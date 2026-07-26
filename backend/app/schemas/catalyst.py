from pydantic import BaseModel
from typing import Optional


class ServiceInfoResponse(BaseModel):
    key: str
    name: str
    category: str
    tier: str
    local_provider: str
    catalyst_equivalent: str
    description: str
    demo_endpoint: Optional[str] = None


class CatalystStatusResponse(BaseModel):
    services: list[ServiceInfoResponse]
    summary: dict[str, int]
    cache_stats: dict


class HotspotItem(BaseModel):
    label: str
    district: Optional[str] = None
    case_count: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    hotspot_score: float


class CaseStatusUpdateRequest(BaseModel):
    to_status_id: int
    changed_by_id: int
    remarks: Optional[str] = None


class CaseStatusUpdateResponse(BaseModel):
    case_id: int
    from_status: str
    to_status: str
    notification_sent: bool


class NotificationItem(BaseModel):
    channel: str
    recipient: str
    subject: str
    body: str
    sent_at: str
    delivered: bool


class AuthLoginRequest(BaseModel):
    employee_id: int
    kgid: str


class AuthLoginResponse(BaseModel):
    token: str
    employee_id: int
    name: Optional[str] = None
