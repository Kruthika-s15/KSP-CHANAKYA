from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import date, datetime

class CrimeBase(BaseModel):
    CaseMasterID: int
    CrimeNo: Optional[str] = None
    CaseNo: Optional[str] = None
    CrimeRegisteredDate: Optional[date] = None
    IncidentFromDate: Optional[datetime] = None
    IncidentToDate: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    BriefFacts: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class CrimeListResponse(CrimeBase):
    DistrictName: Optional[str] = None
    PoliceStationName: Optional[str] = None
    CaseCategory: Optional[str] = None
    CrimeHead: Optional[str] = None
    CrimeSubHead: Optional[str] = None
    CaseStatus: Optional[str] = None
    Gravity: Optional[str] = None

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int

class CategoryItem(BaseModel):
    id: Any
    name: str

class CrimeCategoriesResponse(BaseModel):
    crime_heads: List[CategoryItem]
    crime_sub_heads: List[CategoryItem]
    case_categories: List[CategoryItem]
    gravity_offences: List[CategoryItem]
    case_statuses: List[CategoryItem]
    districts: List[CategoryItem]
    police_stations: List[CategoryItem]

class PersonDetail(BaseModel):
    id: int
    name: str
    age: Optional[int] = None
    gender: Optional[int] = None
    BiometricRefID: Optional[str] = None
    AccusedMasterID: Optional[int] = None

class CrimePeopleResponse(BaseModel):
    CaseMasterID: int
    complainants: List[PersonDetail]
    victims: List[PersonDetail]
    accused: List[PersonDetail]


class ChargesheetItem(BaseModel):
    CSID: int
    CaseMasterID: int
    csdate: Optional[datetime] = None
    cstype: Optional[str] = None
    PolicePersonID: Optional[int] = None
    InvestigatingOfficerName: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ArrestItem(BaseModel):
    ArrestSurrenderID: int
    CaseMasterID: int
    AccusedMasterID: Optional[int] = None
    AccusedName: Optional[str] = None
    ArrestSurrenderDate: Optional[date] = None
    IsAccused: Optional[bool] = None
    IsComplainantAccused: Optional[bool] = None
    PoliceStationID: Optional[int] = None
    IOID: Optional[int] = None
    InvestigatingOfficerName: Optional[str] = None
    CourtID: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class SectionItem(BaseModel):
    ActCode: str
    ActDescription: Optional[str] = None
    SectionCode: str
    SectionDescription: Optional[str] = None


class CaseStatusHistoryItem(BaseModel):
    CaseStatusHistoryID: int
    CaseMasterID: int
    CaseStatusID: int
    CaseStatusName: Optional[str] = None
    ChangedDate: datetime
    ChangedByID: Optional[int] = None
    Remarks: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AnalyticsBucket(BaseModel):
    label: str
    count: int


class CrimeAnalyticsResponse(BaseModel):
    group_by: str
    total_cases: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    buckets: List[AnalyticsBucket]
