"""
Predictive analytics service (QuickML / Zia AutoML in the brief).

Local provider: a real statistical scoring pass over the actual seeded case
data — no invented numbers. For each police-station cluster with cases, it
computes:
  - case_count           : raw volume
  - recency_weight       : more recent cases score higher (half-life decay)
  - hotspot_score         : case_count * recency_weight, min-max normalised

This is an honest stand-in for a trained model: it's deterministic,
explainable, and runs entirely on data already in Postgres. It is NOT a
machine-learned model — that distinction is stated explicitly wherever this
is surfaced in the UI/API, so it can't be mistaken for what Catalyst's
QuickML/Zia AutoML would actually deliver (a trained regression/classification
model over historical + external features).

Catalyst equivalent: QuickML/Zia AutoML would replace `compute_hotspots`
with a trained model call; the output shape (ranked list of
{label, score, case_count}) is designed to stay the same either way.
"""
import math
from datetime import date, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalyst.base import ServiceInfo, ServiceTier, register
from app.models import CaseMaster, Unit, District


async def compute_hotspots(db: AsyncSession, half_life_days: int = 60, limit: int = 10) -> list[dict]:
    query = (
        select(
            Unit.UnitName.label("label"),
            District.DistrictName.label("district"),
            func.count(CaseMaster.CaseMasterID).label("case_count"),
            func.max(CaseMaster.CrimeRegisteredDate).label("most_recent"),
            func.avg(CaseMaster.latitude).label("lat"),
            func.avg(CaseMaster.longitude).label("lng"),
        )
        .select_from(CaseMaster)
        .join(Unit, CaseMaster.PoliceStationID == Unit.UnitID)
        .outerjoin(District, Unit.DistrictID == District.DistrictID)
        .group_by(Unit.UnitName, District.DistrictName)
    )
    rows = (await db.execute(query)).all()
    if not rows:
        return []

    today = date.today()
    scored = []
    for r in rows:
        days_old = (today - r.most_recent).days if r.most_recent else 9999
        recency_weight = math.exp(-days_old / max(half_life_days, 1))
        raw_score = r.case_count * (0.5 + recency_weight)
        scored.append({
            "label": r.label,
            "district": r.district,
            "case_count": r.case_count,
            "latitude": float(r.lat) if r.lat is not None else None,
            "longitude": float(r.lng) if r.lng is not None else None,
            "raw_score": raw_score,
        })

    max_score = max(s["raw_score"] for s in scored) or 1.0
    for s in scored:
        s["hotspot_score"] = round(s.pop("raw_score") / max_score, 3)

    scored.sort(key=lambda s: s["hotspot_score"], reverse=True)
    return scored[:limit]


register(ServiceInfo(
    key="automl",
    name="Predictive Hotspot Analysis",
    category="Intelligence",
    tier=ServiceTier.IMPLEMENTED,
    local_provider="Deterministic frequency + recency scoring over real case data "
                    "(app/catalyst/automl.py) — NOT a trained model",
    catalyst_equivalent="QuickML / Zia AutoML",
    description="Ranks police-station clusters by a case_count * recency hotspot score. "
                "Explicitly labelled as a statistical stand-in, not a trained model.",
    demo_endpoint="GET /api/v1/catalyst/hotspots",
))
