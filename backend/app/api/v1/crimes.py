from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import date

from app.db.session import get_db
from app.models import (
    CaseMaster, District, Unit, CaseCategory, CrimeHead, CrimeSubHead, CaseStatusMaster, GravityOffence,
    ComplainantDetails, Victim, Accused, ChargesheetDetails, ArrestSurrender, ActSectionAssociation,
    Act, Section, CaseStatusHistory, Employee
)
from app.schemas.crime import (
    CrimeListResponse, PaginatedResponse, CrimeCategoriesResponse, CategoryItem, CrimePeopleResponse,
    PersonDetail, ChargesheetItem, ArrestItem, SectionItem, CaseStatusHistoryItem,
    CrimeAnalyticsResponse, AnalyticsBucket,
)
from app.catalyst.cache import cache_service
from app.catalyst.search import apply_free_text_filter

router = APIRouter(prefix="/crimes", tags=["crimes"])

def get_base_crime_query():
    return select(
        CaseMaster,
        District.DistrictName.label("DistrictName"),
        Unit.UnitName.label("PoliceStationName"),
        CaseCategory.LookupValue.label("CaseCategory"),
        CrimeHead.CrimeGroupName.label("CrimeHead"),
        CrimeSubHead.CrimeHeadName.label("CrimeSubHead"),
        CaseStatusMaster.CaseStatusName.label("CaseStatus"),
        GravityOffence.LookupValue.label("Gravity")
    ).outerjoin(Unit, CaseMaster.PoliceStationID == Unit.UnitID)\
     .outerjoin(District, Unit.DistrictID == District.DistrictID)\
     .outerjoin(CaseCategory, CaseMaster.CaseCategoryID == CaseCategory.CaseCategoryID)\
     .outerjoin(CrimeHead, CaseMaster.CrimeMajorHeadID == CrimeHead.CrimeHeadID)\
     .outerjoin(CrimeSubHead, CaseMaster.CrimeMinorHeadID == CrimeSubHead.CrimeSubHeadID)\
     .outerjoin(CaseStatusMaster, CaseMaster.CaseStatusID == CaseStatusMaster.CaseStatusID)\
     .outerjoin(GravityOffence, CaseMaster.GravityOffenceID == GravityOffence.GravityOffenceID)

def row_to_dict(row) -> dict:
    case_obj = row[0]
    mapping = row._mapping
    data = {c.name: getattr(case_obj, c.name) for c in case_obj.__table__.columns}
    data["DistrictName"] = mapping.get("DistrictName")
    data["PoliceStationName"] = mapping.get("PoliceStationName")
    data["CaseCategory"] = mapping.get("CaseCategory")
    data["CrimeHead"] = mapping.get("CrimeHead")
    data["CrimeSubHead"] = mapping.get("CrimeSubHead")
    data["CaseStatus"] = mapping.get("CaseStatus")
    data["Gravity"] = mapping.get("Gravity")
    return data

@router.get("", response_model=PaginatedResponse)
async def list_crimes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    crime_no: Optional[str] = None,
    case_no: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    district_id: Optional[int] = None,
    police_station_id: Optional[int] = None,
    case_status_id: Optional[int] = None,
    crime_head_id: Optional[int] = None,
    crime_sub_head_id: Optional[int] = None,
    case_category_id: Optional[int] = None,
    gravity_offence_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    cache_key = (
        f"crimes:{page}:{page_size}:{crime_no}:{case_no}:{start_date}:{end_date}:{district_id}:"
        f"{police_station_id}:{case_status_id}:{crime_head_id}:{crime_sub_head_id}:"
        f"{case_category_id}:{gravity_offence_id}"
    )
    cached = cache_service.get(cache_key)
    if cached is not None:
        return PaginatedResponse(**cached)

    query = get_base_crime_query()
    
    if crime_no:
        query = query.filter(CaseMaster.CrimeNo.ilike(f"%{crime_no}%"))
    if case_no:
        query = query.filter(CaseMaster.CaseNo.ilike(f"%{case_no}%"))
    if start_date:
        query = query.filter(CaseMaster.CrimeRegisteredDate >= start_date)
    if end_date:
        query = query.filter(CaseMaster.CrimeRegisteredDate <= end_date)
    if district_id:
        query = query.filter(Unit.DistrictID == district_id)
    if police_station_id:
        query = query.filter(CaseMaster.PoliceStationID == police_station_id)
    if case_status_id:
        query = query.filter(CaseMaster.CaseStatusID == case_status_id)
    if crime_head_id:
        query = query.filter(CaseMaster.CrimeMajorHeadID == crime_head_id)
    if crime_sub_head_id:
        query = query.filter(CaseMaster.CrimeMinorHeadID == crime_sub_head_id)
    if case_category_id:
        query = query.filter(CaseMaster.CaseCategoryID == case_category_id)
    if gravity_offence_id:
        query = query.filter(CaseMaster.GravityOffenceID == gravity_offence_id)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    query = query.offset((page - 1) * page_size).limit(page_size).order_by(CaseMaster.CrimeRegisteredDate.desc())
    result = await db.execute(query)
    
    items = [CrimeListResponse(**row_to_dict(row)) for row in result.all()]
    response = PaginatedResponse(items=items, total=total or 0, page=page, page_size=page_size)
    cache_service.set(cache_key, response.model_dump(), ttl_seconds=30)
    return response

@router.get("/search", response_model=PaginatedResponse)
async def search_crimes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = Query(None, description="Free-text search across CrimeNo/CaseNo/BriefFacts"),
    crime_head_id: Optional[int] = None,
    crime_sub_head_id: Optional[int] = None,
    case_category_id: Optional[int] = None,
    gravity_offence_id: Optional[int] = None,
    district_id: Optional[int] = None,
    police_station_id: Optional[int] = None,
    case_status_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    query = get_base_crime_query()

    if q:
        query = apply_free_text_filter(
            query, CaseMaster, [CaseMaster.CrimeNo, CaseMaster.CaseNo, CaseMaster.BriefFacts], q
        )
    if crime_head_id:
        query = query.filter(CaseMaster.CrimeMajorHeadID == crime_head_id)
    if crime_sub_head_id:
        query = query.filter(CaseMaster.CrimeMinorHeadID == crime_sub_head_id)
    if case_category_id:
        query = query.filter(CaseMaster.CaseCategoryID == case_category_id)
    if gravity_offence_id:
        query = query.filter(CaseMaster.GravityOffenceID == gravity_offence_id)
    if district_id:
        query = query.filter(Unit.DistrictID == district_id)
    if police_station_id:
        query = query.filter(CaseMaster.PoliceStationID == police_station_id)
    if case_status_id:
        query = query.filter(CaseMaster.CaseStatusID == case_status_id)
    if start_date:
        query = query.filter(CaseMaster.CrimeRegisteredDate >= start_date)
    if end_date:
        query = query.filter(CaseMaster.CrimeRegisteredDate <= end_date)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    query = query.offset((page - 1) * page_size).limit(page_size).order_by(CaseMaster.CrimeRegisteredDate.desc())
    result = await db.execute(query)
    
    items = [CrimeListResponse(**row_to_dict(row)) for row in result.all()]
    return PaginatedResponse(items=items, total=total or 0, page=page, page_size=page_size)

@router.get("/categories", response_model=CrimeCategoriesResponse)
async def get_categories(db: AsyncSession = Depends(get_db)):
    ch = (await db.execute(select(CrimeHead))).scalars().all()
    csh = (await db.execute(select(CrimeSubHead))).scalars().all()
    cc = (await db.execute(select(CaseCategory))).scalars().all()
    go = (await db.execute(select(GravityOffence))).scalars().all()
    csm = (await db.execute(select(CaseStatusMaster))).scalars().all()
    dist = (await db.execute(select(District))).scalars().all()
    ps = (await db.execute(select(Unit).filter(Unit.ParentUnit == 0))).scalars().all()
    
    return CrimeCategoriesResponse(
        crime_heads=[CategoryItem(id=c.CrimeHeadID, name=c.CrimeGroupName) for c in ch],
        crime_sub_heads=[CategoryItem(id=c.CrimeSubHeadID, name=c.CrimeHeadName) for c in csh],
        case_categories=[CategoryItem(id=c.CaseCategoryID, name=c.LookupValue) for c in cc],
        gravity_offences=[CategoryItem(id=c.GravityOffenceID, name=c.LookupValue) for c in go],
        case_statuses=[CategoryItem(id=c.CaseStatusID, name=c.CaseStatusName) for c in csm],
        districts=[CategoryItem(id=c.DistrictID, name=c.DistrictName) for c in dist],
        police_stations=[CategoryItem(id=c.UnitID, name=c.UnitName) for c in ps]
    )

@router.get("/analytics", response_model=CrimeAnalyticsResponse)
async def get_crime_analytics(
    group_by: str = Query("district", pattern="^(district|category|status|crime_head|month)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Real aggregation query backing crime trend/count questions
    (e.g. "which district has the most crimes", "case counts by status").
    Replaces the old behaviour of just returning a flat list of cases.
    """
    label_col_map = {
        "district": District.DistrictName,
        "category": CaseCategory.LookupValue,
        "status": CaseStatusMaster.CaseStatusName,
        "crime_head": CrimeHead.CrimeGroupName,
        "month": func.to_char(CaseMaster.CrimeRegisteredDate, 'YYYY-MM'),
    }
    label_col = label_col_map[group_by]

    query = (
        select(label_col.label("label"), func.count(CaseMaster.CaseMasterID).label("count"))
        .select_from(CaseMaster)
        .outerjoin(Unit, CaseMaster.PoliceStationID == Unit.UnitID)
        .outerjoin(District, Unit.DistrictID == District.DistrictID)
        .outerjoin(CaseCategory, CaseMaster.CaseCategoryID == CaseCategory.CaseCategoryID)
        .outerjoin(CaseStatusMaster, CaseMaster.CaseStatusID == CaseStatusMaster.CaseStatusID)
        .outerjoin(CrimeHead, CaseMaster.CrimeMajorHeadID == CrimeHead.CrimeHeadID)
    )

    if start_date:
        query = query.filter(CaseMaster.CrimeRegisteredDate >= start_date)
    if end_date:
        query = query.filter(CaseMaster.CrimeRegisteredDate <= end_date)

    query = query.group_by(label_col).order_by(func.count(CaseMaster.CaseMasterID).desc())

    result = await db.execute(query)
    rows = result.all()

    buckets = [AnalyticsBucket(label=r.label or "Unknown", count=r.count) for r in rows]
    total = sum(b.count for b in buckets)

    return CrimeAnalyticsResponse(
        group_by=group_by, total_cases=total,
        start_date=start_date, end_date=end_date, buckets=buckets,
    )


@router.get("/{case_id}", response_model=CrimeListResponse)
async def get_case(case_id: int, db: AsyncSession = Depends(get_db)):
    query = get_base_crime_query().filter(CaseMaster.CaseMasterID == case_id)
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")
    return CrimeListResponse(**row_to_dict(row))

@router.get("/{case_id}/people", response_model=CrimePeopleResponse)
async def get_case_people(case_id: int, db: AsyncSession = Depends(get_db)):
    case_check = await db.execute(select(CaseMaster.CaseMasterID).filter(CaseMaster.CaseMasterID == case_id))
    if not case_check.scalar():
        raise HTTPException(status_code=404, detail="Case not found")
        
    comps = (await db.execute(select(ComplainantDetails).filter(ComplainantDetails.CaseMasterID == case_id))).scalars().all()
    vics = (await db.execute(select(Victim).filter(Victim.CaseMasterID == case_id))).scalars().all()
    
    # Query accused along with their first BiometricRefID
    from app.models import BiometricRecord
    accs_query = (
        select(
            Accused,
            select(BiometricRecord.BiometricRefID)
            .filter(BiometricRecord.AccusedMasterID == Accused.AccusedMasterID)
            .limit(1)
            .scalar_subquery()
        )
        .filter(Accused.CaseMasterID == case_id)
    )
    accs_result = (await db.execute(accs_query)).all()
    
    accused_list = []
    for row in accs_result:
        a = row[0]
        biometric_ref_id = row[1]
        accused_list.append(PersonDetail(
            id=a.AccusedMasterID,
            name=a.AccusedName,
            age=a.AgeYear,
            gender=a.GenderID,
            BiometricRefID=biometric_ref_id,
            AccusedMasterID=a.AccusedMasterID
        ))
    
    return CrimePeopleResponse(
        CaseMasterID=case_id, 
        complainants=[PersonDetail(id=c.ComplainantID, name=c.ComplainantName, age=c.AgeYear, gender=c.GenderID) for c in comps],
        victims=[PersonDetail(id=v.VictimMasterID, name=v.VictimName, age=v.AgeYear, gender=v.GenderID) for v in vics],
        accused=accused_list
    )


async def _ensure_case_exists(case_id: int, db: AsyncSession):
    exists = await db.scalar(select(CaseMaster.CaseMasterID).filter(CaseMaster.CaseMasterID == case_id))
    if not exists:
        raise HTTPException(status_code=404, detail="Case not found")


@router.get("/{case_id}/chargesheet", response_model=list[ChargesheetItem])
async def get_case_chargesheet(case_id: int, db: AsyncSession = Depends(get_db)):
    """Chargesheet filings for a case, with investigating officer name resolved."""
    await _ensure_case_exists(case_id, db)

    query = (
        select(ChargesheetDetails, Employee.FirstName.label("InvestigatingOfficerName"))
        .outerjoin(Employee, ChargesheetDetails.PolicePersonID == Employee.EmployeeID)
        .filter(ChargesheetDetails.CaseMasterID == case_id)
        .order_by(ChargesheetDetails.csdate)
    )
    rows = (await db.execute(query)).all()

    return [
        ChargesheetItem(
            CSID=row[0].CSID, CaseMasterID=row[0].CaseMasterID, csdate=row[0].csdate,
            cstype=row[0].cstype, PolicePersonID=row[0].PolicePersonID,
            InvestigatingOfficerName=row.InvestigatingOfficerName,
        )
        for row in rows
    ]


@router.get("/{case_id}/arrests", response_model=list[ArrestItem])
async def get_case_arrests(case_id: int, db: AsyncSession = Depends(get_db)):
    """Arrest/surrender records for a case, with accused name and IO name resolved."""
    await _ensure_case_exists(case_id, db)

    query = (
        select(ArrestSurrender, Accused.AccusedName, Employee.FirstName.label("InvestigatingOfficerName"))
        .outerjoin(Accused, ArrestSurrender.AccusedMasterID == Accused.AccusedMasterID)
        .outerjoin(Employee, ArrestSurrender.IOID == Employee.EmployeeID)
        .filter(ArrestSurrender.CaseMasterID == case_id)
        .order_by(ArrestSurrender.ArrestSurrenderDate)
    )
    rows = (await db.execute(query)).all()

    return [
        ArrestItem(
            ArrestSurrenderID=row[0].ArrestSurrenderID, CaseMasterID=row[0].CaseMasterID,
            AccusedMasterID=row[0].AccusedMasterID, AccusedName=row.AccusedName,
            ArrestSurrenderDate=row[0].ArrestSurrenderDate, IsAccused=row[0].IsAccused,
            IsComplainantAccused=row[0].IsComplainantAccused, PoliceStationID=row[0].PoliceStationID,
            IOID=row[0].IOID, InvestigatingOfficerName=row.InvestigatingOfficerName,
            CourtID=row[0].CourtID,
        )
        for row in rows
    ]


@router.get("/{case_id}/sections", response_model=list[SectionItem])
async def get_case_sections(case_id: int, db: AsyncSession = Depends(get_db)):
    """Acts/Sections (IPC/BNS etc.) applied to a case."""
    await _ensure_case_exists(case_id, db)

    query = (
        select(Act.ActCode, Act.ActDescription, Section.SectionCode, Section.SectionDescription)
        .select_from(ActSectionAssociation)
        .join(Act, ActSectionAssociation.ActID == Act.ActCode)
        .join(
            Section,
            (ActSectionAssociation.ActID == Section.ActCode) & (ActSectionAssociation.SectionID == Section.SectionCode),
        )
        .filter(ActSectionAssociation.CaseMasterID == case_id)
    )
    rows = (await db.execute(query)).all()

    return [
        SectionItem(
            ActCode=row.ActCode, ActDescription=row.ActDescription,
            SectionCode=row.SectionCode, SectionDescription=row.SectionDescription,
        )
        for row in rows
    ]


@router.get("/{case_id}/status-history", response_model=list[CaseStatusHistoryItem])
async def get_case_status_history(case_id: int, db: AsyncSession = Depends(get_db)):
    """Timeline of status changes for a case (registered -> under investigation -> closed, etc.)."""
    await _ensure_case_exists(case_id, db)

    query = (
        select(CaseStatusHistory, CaseStatusMaster.CaseStatusName)
        .outerjoin(CaseStatusMaster, CaseStatusHistory.CaseStatusID == CaseStatusMaster.CaseStatusID)
        .filter(CaseStatusHistory.CaseMasterID == case_id)
        .order_by(CaseStatusHistory.ChangedDate)
    )
    rows = (await db.execute(query)).all()

    return [
        CaseStatusHistoryItem(
            CaseStatusHistoryID=row[0].CaseStatusHistoryID, CaseMasterID=row[0].CaseMasterID,
            CaseStatusID=row[0].CaseStatusID, CaseStatusName=row.CaseStatusName,
            ChangedDate=row[0].ChangedDate, ChangedByID=row[0].ChangedByID, Remarks=row[0].Remarks,
        )
        for row in rows
    ]

@router.get("/{case_id}/report/pdf", response_class=HTMLResponse)
async def get_investigation_report_pdf(case_id: int, db: AsyncSession = Depends(get_db)):
    """
    Returns an HTML investigation report intended for PDF generation or printing.
    """
    await _ensure_case_exists(case_id, db)

    query = get_base_crime_query().filter(CaseMaster.CaseMasterID == case_id)
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case_data = row_to_dict(row)
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Investigation Report - Case {case_id}</title>
    <style>
        body {{ font-family: serif; color: #000; background: #fff; padding: 20px; }}
        h1 {{ font-size: 24px; font-weight: bold; margin-bottom: 5px; }}
        h2 {{ font-size: 16px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 5px; margin-top: 20px; }}
        .header {{ border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }}
        .field {{ margin-bottom: 10px; }}
        .label {{ font-size: 12px; font-weight: bold; text-transform: uppercase; color: #555; }}
        .value {{ font-size: 14px; margin-top: 2px; }}
        .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }}
    </style>
</head>
<body>
    <div class="header">
        <div>GOVERNMENT OF KARNATAKA</div>
        <h1>KARNATAKA STATE POLICE</h1>
        <div>Investigation Report - Ref: RPT-{case_id}</div>
    </div>
    <div class="grid">
        <div class="field"><div class="label">FIR / Crime No</div><div class="value">{case_data.get('CrimeNo') or 'N/A'}</div></div>
        <div class="field"><div class="label">Case No</div><div class="value">{case_data.get('CaseNo') or 'N/A'}</div></div>
        <div class="field"><div class="label">Registered Date</div><div class="value">{case_data.get('CrimeRegisteredDate') or 'N/A'}</div></div>
        <div class="field"><div class="label">Case Status</div><div class="value">{case_data.get('CaseStatus') or 'N/A'}</div></div>
        <div class="field"><div class="label">Crime Category</div><div class="value">{case_data.get('CaseCategory') or 'N/A'}</div></div>
        <div class="field"><div class="label">Police Station</div><div class="value">{case_data.get('PoliceStationName') or 'N/A'}</div></div>
        <div class="field"><div class="label">District</div><div class="value">{case_data.get('DistrictName') or 'N/A'}</div></div>
    </div>
    
    <h2>Brief Facts</h2>
    <p>{case_data.get('BriefFacts') or 'No detailed facts recorded for this case.'}</p>
    
</body>
</html>"""
    
    headers = {
        "Content-Disposition": 'inline; filename="investigation_report.html"'
    }
    return HTMLResponse(content=html_content, headers=headers)
