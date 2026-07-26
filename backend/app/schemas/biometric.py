from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date


class BiometricRecordCreate(BaseModel):
    AccusedMasterID: int
    BiometricType: str  # FINGERPRINT | IRIS | PHOTO
    BiometricRefID: str
    CapturedDate: Optional[date] = None
    CapturedByID: Optional[int] = None
    Remarks: Optional[str] = None


class BiometricRecordResponse(BaseModel):
    BiometricID: int
    AccusedMasterID: int
    BiometricType: str
    BiometricRefID: str
    CapturedDate: Optional[date] = None
    Remarks: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BiometricMatchHit(BaseModel):
    """One matching accused record found via a shared biometric reference."""
    BiometricID: int
    BiometricType: str
    BiometricRefID: str
    AccusedMasterID: int
    AccusedName: Optional[str] = None
    CaseMasterID: int
    CrimeNo: Optional[str] = None
    CaseNo: Optional[str] = None
    DistrictName: Optional[str] = None
    PoliceStationName: Optional[str] = None
    CrimeHead: Optional[str] = None
    CaseStatus: Optional[str] = None


class BiometricSearchResponse(BaseModel):
    query_ref_id: str
    total_matches: int
    is_repeat_offender: bool
    distinct_cases: int
    matches: List[BiometricMatchHit]
