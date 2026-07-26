from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import CaseMaster, CaseStatusMaster, CaseStatusHistory
from app.schemas.catalyst import (
    CatalystStatusResponse, ServiceInfoResponse, HotspotItem,
    CaseStatusUpdateRequest, CaseStatusUpdateResponse, NotificationItem,
    AuthLoginRequest, AuthLoginResponse,
)
from app.catalyst.base import all_services, ServiceTier
from app.catalyst.cache import cache_service
from app.catalyst.automl import compute_hotspots
from app.catalyst.circuits import is_allowed
from app.catalyst.signals import event_bus
from app.catalyst.notifications import notification_log
from app.catalyst.cron import run_daily_crime_analysis

router = APIRouter(prefix="/catalyst", tags=["catalyst"])


@router.get("/status", response_model=CatalystStatusResponse)
async def catalyst_status():
    """
    Full Catalyst service abstraction matrix: what's implemented, what's
    simulated locally, and what's integration-ready pending real credentials.
    """
    services = all_services()
    summary = {tier.value: 0 for tier in ServiceTier}
    for s in services:
        summary[s.tier.value] += 1
    return CatalystStatusResponse(
        services=[ServiceInfoResponse(**s.__dict__) for s in services],
        summary=summary,
        cache_stats=cache_service.stats(),
    )


@router.get("/hotspots", response_model=list[HotspotItem])
async def catalyst_hotspots(db: AsyncSession = Depends(get_db)):
    """Ranked hotspot list from the local predictive-analytics stand-in (see automl.py)."""
    return await compute_hotspots(db)


@router.post("/cron/run-daily-analysis")
async def catalyst_run_cron(db: AsyncSession = Depends(get_db)):
    """Manually trigger the job Catalyst Cron would run on a schedule."""
    return await run_daily_crime_analysis(db)


@router.get("/notifications", response_model=list[NotificationItem])
async def catalyst_notifications():
    return notification_log.recent()



@router.post("/crimes/{case_id}/status", response_model=CaseStatusUpdateResponse)
async def update_case_status(case_id: int, payload: CaseStatusUpdateRequest, db: AsyncSession = Depends(get_db)):
    """
    Change a case's status through the Circuits-validated workflow, which
    fires a Signals event on success (clearing the Cache and writing to the
    Notification log).
    """
    case = (await db.execute(select(CaseMaster).filter(CaseMaster.CaseMasterID == case_id))).scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    to_status = (await db.execute(
        select(CaseStatusMaster).filter(CaseStatusMaster.CaseStatusID == payload.to_status_id)
    )).scalar_one_or_none()
    if not to_status:
        raise HTTPException(status_code=404, detail="Target status not found")

    from_status = None
    if case.CaseStatusID:
        from_status = (await db.execute(
            select(CaseStatusMaster).filter(CaseStatusMaster.CaseStatusID == case.CaseStatusID)
        )).scalar_one_or_none()

    from_status_name = from_status.CaseStatusName if from_status else ""
    if not is_allowed(from_status_name, to_status.CaseStatusName):
        raise HTTPException(
            status_code=409,
            detail=f"Workflow violation: cannot move from '{from_status_name}' to '{to_status.CaseStatusName}'",
        )

    case.CaseStatusID = to_status.CaseStatusID
    db.add(CaseStatusHistory(
        CaseMasterID=case_id,
        CaseStatusID=to_status.CaseStatusID,
        ChangedDate=datetime.now(timezone.utc),
        ChangedByID=payload.changed_by_id,
        Remarks=payload.remarks,
    ))
    await db.commit()

    event_bus.emit("case.status_changed", {
        "case_id": case_id,
        "crime_no": case.CrimeNo,
        "from_status": from_status_name,
        "to_status": to_status.CaseStatusName,
        "changed_by": payload.changed_by_id,
    })

    return CaseStatusUpdateResponse(
        case_id=case_id, from_status=from_status_name,
        to_status=to_status.CaseStatusName, notification_sent=True,
    )
