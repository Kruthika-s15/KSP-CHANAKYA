from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.db.session import get_db
from app.models import Employee, Rank, Designation, District, Unit, CaseMaster, CaseStatusMaster
from app.schemas.personnel import EmployeeListItem, EmployeeDetail, PersonnelListResponse

router = APIRouter(prefix="/personnel", tags=["personnel"])


def _base_employee_query():
    return (
        select(
            Employee,
            Rank.RankName,
            Designation.DesignationName,
            District.DistrictName,
            Unit.UnitName,
        )
        .outerjoin(Rank, Employee.RankID == Rank.RankID)
        .outerjoin(Designation, Employee.DesignationID == Designation.DesignationID)
        .outerjoin(District, Employee.DistrictID == District.DistrictID)
        .outerjoin(Unit, Employee.UnitID == Unit.UnitID)
    )


def _row_to_item(row) -> EmployeeListItem:
    emp = row[0]
    return EmployeeListItem(
        EmployeeID=emp.EmployeeID,
        FirstName=emp.FirstName,
        KGID=emp.KGID,
        RankName=row.RankName,
        DesignationName=row.DesignationName,
        DistrictName=row.DistrictName,
        UnitName=row.UnitName,
    )


@router.get("", response_model=PersonnelListResponse)
async def list_personnel(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    district_id: Optional[int] = None,
    unit_id: Optional[int] = None,
    rank_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    query = _base_employee_query()
    if district_id:
        query = query.filter(Employee.DistrictID == district_id)
    if unit_id:
        query = query.filter(Employee.UnitID == unit_id)
    if rank_id:
        query = query.filter(Employee.RankID == rank_id)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = [_row_to_item(row) for row in result.all()]

    return PersonnelListResponse(items=items, total=total or 0, page=page, page_size=page_size)


@router.get("/{employee_id}", response_model=EmployeeDetail)
async def get_personnel(employee_id: int, db: AsyncSession = Depends(get_db)):
    query = _base_employee_query().filter(Employee.EmployeeID == employee_id)
    row = (await db.execute(query)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp = row[0]

    active_count = await db.scalar(
        select(func.count())
        .select_from(CaseMaster)
        .join(CaseStatusMaster, CaseMaster.CaseStatusID == CaseStatusMaster.CaseStatusID)
        .filter(CaseMaster.PolicePersonID == employee_id)
        .filter(~CaseStatusMaster.CaseStatusName.ilike("%closed%"))
    ) or 0
    closed_count = await db.scalar(
        select(func.count())
        .select_from(CaseMaster)
        .join(CaseStatusMaster, CaseMaster.CaseStatusID == CaseStatusMaster.CaseStatusID)
        .filter(CaseMaster.PolicePersonID == employee_id)
        .filter(CaseStatusMaster.CaseStatusName.ilike("%closed%"))
    ) or 0

    return EmployeeDetail(
        EmployeeID=emp.EmployeeID,
        FirstName=emp.FirstName,
        KGID=emp.KGID,
        RankName=row.RankName,
        DesignationName=row.DesignationName,
        DistrictName=row.DistrictName,
        UnitName=row.UnitName,
        EmployeeDOB=emp.EmployeeDOB,
        AppointmentDate=emp.AppointmentDate,
        active_case_count=active_count,
        closed_case_count=closed_count,
    )
