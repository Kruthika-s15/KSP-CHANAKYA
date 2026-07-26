from pydantic import BaseModel
from typing import Optional, List, Literal

NodeType = Literal["case", "accused", "victim", "complainant", "officer"]
EdgeRelation = Literal[
    "ACCUSED_IN", "VICTIM_IN", "COMPLAINANT_IN", "INVESTIGATED_BY",
    "SAME_PERSON", "SAME_BIOMETRIC",
]


class NetworkNode(BaseModel):
    id: str
    type: NodeType
    label: str
    sublabel: Optional[str] = None
    case_master_id: Optional[int] = None
    is_focus: bool = False
    # True for a case pulled in only because a shared identity (PersonID /
    # BiometricRefID) links it to the focus case, not because it matched
    # the original filter/case_id.
    is_secondary_case: bool = False


class NetworkEdge(BaseModel):
    source: str
    target: str
    relation: EdgeRelation
    label: Optional[str] = None


class NetworkGraphResponse(BaseModel):
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]
    total_cases: int
    total_nodes: int
    total_edges: int
    truncated: bool = False
    focus_case_id: Optional[int] = None
