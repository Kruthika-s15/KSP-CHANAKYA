"""
Pure-Python tests for the Circuits workflow state machine — no DB/event
loop needed, since app.catalyst.circuits has no external dependencies.
"""
from app.catalyst.circuits import is_allowed


def test_allows_under_investigation_to_closed():
    assert is_allowed("DEMO_Under Investigation", "DEMO_Closed") is True


def test_allows_closed_to_reopen():
    assert is_allowed("DEMO_Closed", "DEMO_Under Investigation") is True


def test_blocks_no_op_transition():
    assert is_allowed("DEMO_Under Investigation", "DEMO_Under Investigation") is False


def test_permissive_for_unknown_status():
    # A status not in the demo dataset isn't blocked outright — a real
    # Circuit would route this to a human, but we don't lock investigators
    # out over an unrecognised status name.
    assert is_allowed("Some Other Status", "DEMO_Closed") is True
