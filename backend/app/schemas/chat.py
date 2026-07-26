from pydantic import BaseModel, Field
from typing import List, Optional, Any

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    mode: str = Field(default="natural", description="'natural' or 'sql'")
    history: List[ChatMessage] = []

class IntentSchema(BaseModel):
    is_crime_query: bool = Field(description="True if the user is explicitly searching or analyzing crimes, cases, or FIRs.")
    intent_category: str = Field(description="Must be one of: 'GENERAL_CONVERSATION', 'CRIME_SEARCH', 'CRIME_ANALYTICS', 'CASE_DETAILS', 'INVESTIGATION_FOLLOWUP', 'BIOMETRIC_SEARCH', 'HELP', 'SQL_QUERY'")
    intent_type: str = Field(description="Type of query: 'list_crimes', 'count_crimes', 'get_case_details', 'search_biometric', 'general_chat'")
    crime_no: Optional[str] = Field(default=None, description="A specific crime or FIR number if mentioned (e.g. 202600001)")
    crime_head: Optional[str] = Field(default=None, description="The broad category of crime mentioned, e.g. Theft, Cyber, Murder, ವಾಹನ ಕಳ್ಳತನ")
    crime_sub_head: Optional[str] = Field(default=None, description="The specific category of crime mentioned, e.g. Vehicle Theft")
    district: Optional[str] = Field(default=None, description="The district name if mentioned, e.g. Bengaluru, ಮೈಸೂರು")
    police_station: Optional[str] = Field(default=None, description="The police station if mentioned")
    biometric_ref_id: Optional[str] = Field(default=None, description="A biometric/fingerprint/AFIS reference ID if the user is asking to match/search by biometric")
    analytics_group_by: Optional[str] = Field(default=None, description="For CRIME_ANALYTICS: one of 'district', 'category', 'status', 'crime_head', 'month'")
    limit: int = Field(default=10, description="Max number of cases to fetch (default 10)")

class ChatResponse(BaseModel):
    reply: str
    references: List[Any] = []
    mode_used: str = "natural"
