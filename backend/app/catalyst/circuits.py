"""
Investigation workflow service (Circuits in the brief).

Local provider: an explicit state machine over the case-status values that
actually exist in the seeded schema ("Under Investigation" <-> "Closed").
It's real validation logic, used by POST /api/v1/catalyst/crimes/{case_id}/status
to reject illegal transitions before anything is written to CaseStatusHistory.

Catalyst equivalent: Catalyst Circuits (a visual, multi-step workflow
builder). The transition table below is exactly what you would encode as a
Circuit's nodes/edges; the validation contract (`is_allowed`) is what a
Circuit's guard condition would call.
"""
from app.catalyst.base import ServiceInfo, ServiceTier, register

# Status names are matched case-insensitively and by substring against
# CaseStatusMaster.CaseStatusName, since the seeded demo data prefixes
# names with "DEMO_" (e.g. "DEMO_Under Investigation").
ALLOWED_TRANSITIONS = {
    "under investigation": {"closed"},
    "closed": {"under investigation"},  # reopen
}


def _normalize(status_name: str) -> str:
    name = (status_name or "").lower()
    if name.startswith("demo_"):
        name = name[len("demo_"):]
    return name.strip()


def is_allowed(from_status: str, to_status: str) -> bool:
    frm, to = _normalize(from_status), _normalize(to_status)
    if frm == to:
        return False
    if frm not in ALLOWED_TRANSITIONS:
        # Unknown current status (e.g. a status not in the demo dataset) —
        # be permissive rather than block a real investigator, but this is
        # exactly the kind of case a real Circuit would route to a human.
        return True
    return to in ALLOWED_TRANSITIONS[frm]


register(ServiceInfo(
    key="circuits",
    name="Investigation Workflow",
    category="Workflow",
    tier=ServiceTier.IMPLEMENTED,
    local_provider="Explicit status transition state machine (app/catalyst/circuits.py)",
    catalyst_equivalent="Catalyst Circuits",
    description="Validates case status changes (e.g. blocks 'Under Investigation' -> "
                "'Under Investigation') before they're written to CaseStatusHistory.",
    demo_endpoint="POST /api/v1/catalyst/crimes/{case_id}/status",
))
