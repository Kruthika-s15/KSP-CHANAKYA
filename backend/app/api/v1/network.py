from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date

from app.db.session import get_db
from app.models import (
    CaseMaster, District, Unit, CrimeHead, CaseStatusMaster,
    ComplainantDetails, Victim, Accused, Employee, BiometricRecord,
)
from app.schemas.network import NetworkNode, NetworkEdge, NetworkGraphResponse

router = APIRouter(prefix="/network", tags=["network"])

# Hard ceilings so a demo dataset (or a pathological filter) can never
# produce a graph the frontend can't render or a query that runs away.
MAX_CASES_OVERVIEW = 60
MAX_SECONDARY_CASES = 15
MAX_TOTAL_NODES = 400


def _case_label_query(case_ids: list[int]):
    """Minimal case metadata (for labeling case nodes) keyed by CaseMasterID."""
    return (
        select(
            CaseMaster.CaseMasterID, CaseMaster.CrimeNo, CaseMaster.CaseNo,
            CaseMaster.PolicePersonID,
            District.DistrictName, Unit.UnitName.label("PoliceStationName"),
            CrimeHead.CrimeGroupName.label("CrimeHead"),
            CaseStatusMaster.CaseStatusName.label("CaseStatus"),
        )
        .outerjoin(Unit, CaseMaster.PoliceStationID == Unit.UnitID)
        .outerjoin(District, Unit.DistrictID == District.DistrictID)
        .outerjoin(CrimeHead, CaseMaster.CrimeMajorHeadID == CrimeHead.CrimeHeadID)
        .outerjoin(CaseStatusMaster, CaseMaster.CaseStatusID == CaseStatusMaster.CaseStatusID)
        .filter(CaseMaster.CaseMasterID.in_(case_ids))
    )


async def _build_graph(
    db: AsyncSession,
    case_ids: list[int],
    focus_case_id: Optional[int] = None,
    allow_expansion: bool = False,
) -> NetworkGraphResponse:
    """
    Build a node/edge graph strictly from real rows already tied together
    by foreign keys in the schema:
      - CaseMaster <-(CaseMasterID)- Accused / Victim / ComplainantDetails
      - CaseMaster -(PolicePersonID)-> Employee (investigating officer)
      - Accused <-(shared PersonID)-> Accused                (same real person, different case)
      - Accused <-(shared BiometricRefID via BiometricRecord)-> Accused (same real person)
    No relationship here is inferred or fabricated; every edge traces back
    to a foreign key or a shared identity value already stored on the rows.
    """
    truncated = False
    case_ids = list(dict.fromkeys(case_ids))  # de-dupe, keep order

    nodes: dict[str, NetworkNode] = {}
    edges: list[NetworkEdge] = []

    case_rows = (await db.execute(_case_label_query(case_ids))).all()
    if not case_rows:
        return NetworkGraphResponse(
            nodes=[], edges=[], total_cases=0, total_nodes=0, total_edges=0,
            truncated=False, focus_case_id=focus_case_id,
        )

    officer_ids = {r.PolicePersonID for r in case_rows if r.PolicePersonID}
    officers = {}
    if officer_ids:
        emp_rows = (
            await db.execute(select(Employee).filter(Employee.EmployeeID.in_(officer_ids)))
        ).scalars().all()
        officers = {e.EmployeeID: e for e in emp_rows}

    for r in case_rows:
        case_node_id = f"case-{r.CaseMasterID}"
        nodes[case_node_id] = NetworkNode(
            id=case_node_id, type="case",
            label=r.CrimeNo or r.CaseNo or f"Case #{r.CaseMasterID}",
            sublabel=r.CrimeHead or r.CaseStatus,
            case_master_id=r.CaseMasterID,
            is_focus=(focus_case_id is not None and r.CaseMasterID == focus_case_id),
            is_secondary_case=(focus_case_id is not None and r.CaseMasterID != focus_case_id and allow_expansion),
        )
        if r.PolicePersonID and r.PolicePersonID in officers:
            officer_node_id = f"officer-{r.PolicePersonID}"
            emp = officers[r.PolicePersonID]
            if officer_node_id not in nodes:
                nodes[officer_node_id] = NetworkNode(
                    id=officer_node_id, type="officer", label=emp.FirstName or f"Officer #{emp.EmployeeID}",
                    sublabel="Investigating Officer",
                )
            edges.append(NetworkEdge(source=officer_node_id, target=case_node_id, relation="INVESTIGATED_BY"))

    # --- People tied to these cases (real FK: CaseMasterID) ---
    accused_rows = (
        await db.execute(select(Accused).filter(Accused.CaseMasterID.in_(case_ids)))
    ).scalars().all()
    victim_rows = (
        await db.execute(select(Victim).filter(Victim.CaseMasterID.in_(case_ids)))
    ).scalars().all()
    complainant_rows = (
        await db.execute(select(ComplainantDetails).filter(ComplainantDetails.CaseMasterID.in_(case_ids)))
    ).scalars().all()

    for v in victim_rows:
        node_id = f"victim-{v.VictimMasterID}"
        nodes[node_id] = NetworkNode(
            id=node_id, type="victim", label=v.VictimName or f"Victim #{v.VictimMasterID}",
            case_master_id=v.CaseMasterID,
        )
        edges.append(NetworkEdge(source=node_id, target=f"case-{v.CaseMasterID}", relation="VICTIM_IN"))

    for c in complainant_rows:
        node_id = f"complainant-{c.ComplainantID}"
        nodes[node_id] = NetworkNode(
            id=node_id, type="complainant", label=c.ComplainantName or f"Complainant #{c.ComplainantID}",
            case_master_id=c.CaseMasterID,
        )
        edges.append(NetworkEdge(source=node_id, target=f"case-{c.CaseMasterID}", relation="COMPLAINANT_IN"))

    for a in accused_rows:
        node_id = f"accused-{a.AccusedMasterID}"
        nodes[node_id] = NetworkNode(
            id=node_id, type="accused", label=a.AccusedName or f"Accused #{a.AccusedMasterID}",
            case_master_id=a.CaseMasterID,
        )
        edges.append(NetworkEdge(source=node_id, target=f"case-{a.CaseMasterID}", relation="ACCUSED_IN"))

    # --- Cross-case identity links ---
    # 1. Accused.PersonID: an explicit "this is the same real person" field
    #    already in the schema. Group the accused we have by PersonID.
    person_id_groups: dict[str, list[Accused]] = {}
    for a in accused_rows:
        if a.PersonID:
            person_id_groups.setdefault(a.PersonID, []).append(a)

    # 2. BiometricRecord.BiometricRefID: same identity signal, via the
    #    biometric feature already shipped (biometrics.py).
    accused_ids = [a.AccusedMasterID for a in accused_rows]
    biometric_groups: dict[str, list[int]] = {}
    if accused_ids:
        bio_rows = (
            await db.execute(
                select(BiometricRecord.BiometricRefID, BiometricRecord.AccusedMasterID)
                .filter(BiometricRecord.AccusedMasterID.in_(accused_ids))
            )
        ).all()
        for ref_id, acc_id in bio_rows:
            biometric_groups.setdefault(ref_id, []).append(acc_id)

    known_case_ids = set(case_ids)
    expansion_case_ids: set[int] = set()

    if allow_expansion and focus_case_id is not None:
        # Focused mode: look OUTSIDE the current batch for other accused
        # sharing a PersonID or BiometricRefID with an accused in the
        # focus case, and pull in just enough of their case to show the link.
        focus_person_ids = {a.PersonID for a in accused_rows if a.CaseMasterID == focus_case_id and a.PersonID}
        focus_accused_ids = [a.AccusedMasterID for a in accused_rows if a.CaseMasterID == focus_case_id]

        if focus_person_ids:
            extra = (
                await db.execute(
                    select(Accused).filter(
                        Accused.PersonID.in_(focus_person_ids),
                        Accused.CaseMasterID.notin_(known_case_ids),
                    ).limit(MAX_SECONDARY_CASES)
                )
            ).scalars().all()
            for a in extra:
                if len(expansion_case_ids) >= MAX_SECONDARY_CASES:
                    truncated = True
                    break
                expansion_case_ids.add(a.CaseMasterID)
                accused_rows.append(a)
                person_id_groups.setdefault(a.PersonID, []).append(a)

        if focus_accused_ids:
            focus_bio_refs = (
                await db.execute(
                    select(BiometricRecord.BiometricRefID)
                    .filter(BiometricRecord.AccusedMasterID.in_(focus_accused_ids))
                )
            ).scalars().all()
            if focus_bio_refs:
                extra_bio = (
                    await db.execute(
                        select(BiometricRecord.BiometricRefID, Accused)
                        .join(Accused, BiometricRecord.AccusedMasterID == Accused.AccusedMasterID)
                        .filter(
                            BiometricRecord.BiometricRefID.in_(focus_bio_refs),
                            Accused.CaseMasterID.notin_(known_case_ids | expansion_case_ids),
                        )
                        .limit(MAX_SECONDARY_CASES)
                    )
                ).all()
                for ref_id, a in extra_bio:
                    if len(expansion_case_ids) >= MAX_SECONDARY_CASES:
                        truncated = True
                        break
                    expansion_case_ids.add(a.CaseMasterID)
                    accused_rows.append(a)
                    biometric_groups.setdefault(ref_id, []).append(a.AccusedMasterID)
                    node_id = f"accused-{a.AccusedMasterID}"
                    if node_id not in nodes:
                        nodes[node_id] = NetworkNode(
                            id=node_id, type="accused", label=a.AccusedName or f"Accused #{a.AccusedMasterID}",
                            case_master_id=a.CaseMasterID,
                        )
                        edges.append(NetworkEdge(source=node_id, target=f"case-{a.CaseMasterID}", relation="ACCUSED_IN"))

        if expansion_case_ids:
            extra_case_rows = (await db.execute(_case_label_query(list(expansion_case_ids)))).all()
            for r in extra_case_rows:
                node_id = f"case-{r.CaseMasterID}"
                if node_id not in nodes:
                    nodes[node_id] = NetworkNode(
                        id=node_id, type="case",
                        label=r.CrimeNo or r.CaseNo or f"Case #{r.CaseMasterID}",
                        sublabel=r.CrimeHead or r.CaseStatus,
                        case_master_id=r.CaseMasterID, is_secondary_case=True,
                    )
                # newly expanded accused already got their ACCUSED_IN edges above

    # Re-derive node ids for any accused added during expansion so their
    # entry exists even if it was skipped above (defensive).
    for a in accused_rows:
        node_id = f"accused-{a.AccusedMasterID}"
        if node_id not in nodes:
            nodes[node_id] = NetworkNode(
                id=node_id, type="accused", label=a.AccusedName or f"Accused #{a.AccusedMasterID}",
                case_master_id=a.CaseMasterID,
            )
            edges.append(NetworkEdge(source=node_id, target=f"case-{a.CaseMasterID}", relation="ACCUSED_IN"))

    for person_id, group in person_id_groups.items():
        distinct = {a.AccusedMasterID: a for a in group}.values()
        distinct_list = list(distinct)
        for i in range(len(distinct_list)):
            for j in range(i + 1, len(distinct_list)):
                a1, a2 = distinct_list[i], distinct_list[j]
                if a1.CaseMasterID != a2.CaseMasterID:
                    edges.append(NetworkEdge(
                        source=f"accused-{a1.AccusedMasterID}", target=f"accused-{a2.AccusedMasterID}",
                        relation="SAME_PERSON", label="Same identity (Person ID)",
                    ))

    for ref_id, acc_ids in biometric_groups.items():
        distinct_ids = list(dict.fromkeys(acc_ids))
        for i in range(len(distinct_ids)):
            for j in range(i + 1, len(distinct_ids)):
                edges.append(NetworkEdge(
                    source=f"accused-{distinct_ids[i]}", target=f"accused-{distinct_ids[j]}",
                    relation="SAME_BIOMETRIC", label="Same biometric reference",
                ))

    node_list = list(nodes.values())
    if len(node_list) > MAX_TOTAL_NODES:
        node_list = node_list[:MAX_TOTAL_NODES]
        kept_ids = {n.id for n in node_list}
        edges = [e for e in edges if e.source in kept_ids and e.target in kept_ids]
        truncated = True

    return NetworkGraphResponse(
        nodes=node_list,
        edges=edges,
        total_cases=len({n.case_master_id for n in node_list if n.type == "case"}),
        total_nodes=len(node_list),
        total_edges=len(edges),
        truncated=truncated,
        focus_case_id=focus_case_id,
    )


@router.get("", response_model=NetworkGraphResponse)
async def get_network_overview(
    limit_cases: int = Query(25, ge=1, le=MAX_CASES_OVERVIEW),
    district_id: Optional[int] = None,
    crime_head_id: Optional[int] = None,
    case_status_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Overview relationship graph across the most recent cases matching the
    given filters (bounded by limit_cases so the graph stays renderable).
    """
    query = select(CaseMaster.CaseMasterID).outerjoin(Unit, CaseMaster.PoliceStationID == Unit.UnitID)
    if district_id:
        query = query.filter(Unit.DistrictID == district_id)
    if crime_head_id:
        query = query.filter(CaseMaster.CrimeMajorHeadID == crime_head_id)
    if case_status_id:
        query = query.filter(CaseMaster.CaseStatusID == case_status_id)
    if start_date:
        query = query.filter(CaseMaster.CrimeRegisteredDate >= start_date)
    if end_date:
        query = query.filter(CaseMaster.CrimeRegisteredDate <= end_date)

    query = query.order_by(CaseMaster.CrimeRegisteredDate.desc()).limit(limit_cases)
    case_ids = (await db.execute(query)).scalars().all()

    return await _build_graph(db, list(case_ids), focus_case_id=None, allow_expansion=False)


@router.get("/case/{case_id}", response_model=NetworkGraphResponse)
async def get_network_for_case(case_id: int, db: AsyncSession = Depends(get_db)):
    """
    Relationship graph focused on one case: its accused/victims/complainants/
    officer, plus any other case files linked through a shared accused
    identity (Accused.PersonID or a shared BiometricRefID).
    """
    exists = await db.scalar(select(CaseMaster.CaseMasterID).filter(CaseMaster.CaseMasterID == case_id))
    if not exists:
        raise HTTPException(status_code=404, detail="Case not found")

    return await _build_graph(db, [case_id], focus_case_id=case_id, allow_expansion=True)
