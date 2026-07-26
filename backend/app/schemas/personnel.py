from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date


class EmployeeListItem(BaseModel):
    EmployeeID: int
    FirstName: Optional[str] = None
    KGID: Optional[str] = None
    RankName: Optional[str] = None
    DesignationName: Optional[str] = None
    DistrictName: Optional[str] = None
    UnitName: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EmployeeDetail(EmployeeListItem):
    EmployeeDOB: Optional[date] = None
    AppointmentDate: Optional[date] = None
    active_case_count: int = 0
    closed_case_count: int = 0


class PersonnelListResponse(BaseModel):
    items: List[EmployeeListItem]
    total: int
    page: int
    page_size: int
