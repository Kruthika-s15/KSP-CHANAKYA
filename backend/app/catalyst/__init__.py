"""
Catalyst service abstraction layer.

Importing this package registers every service in the status matrix (see
app/catalyst/base.py::all_services) and wires the one live event chain used
by the demo: a case status change -> Signals event -> Cache invalidation +
Notification log entry.

Local dev still runs entirely on Postgres + FastAPI, exactly as before —
nothing here changes existing routes' behaviour except where explicitly
wired (GET /crimes uses Cache, GET /crimes/search accepts `q` via Search).
"""
from app.catalyst.base import all_services, ServiceInfo, ServiceTier, NotConfiguredError  # noqa: F401

# Import every provider module so it registers itself.
from app.catalyst import (  # noqa: F401
    datastore, cache, search, automl, circuits, signals as signals_module,
    notifications, storage, nosql, auth, gateway, cron, zia, smartbrowz, pipelines,
)
from app.catalyst.signals import event_bus
from app.catalyst.cache import cache_service
from app.catalyst.notifications import notification_log, send_investigator_email


async def _on_status_changed(payload: dict) -> None:
    cache_service.clear()
    
    case_ref = payload.get('crime_no') or payload.get('case_id')
    subject = f"Case {case_ref} status updated"
    body = f"Status changed from '{payload.get('from_status')}' to '{payload.get('to_status')}' " \
           f"by employee {payload.get('changed_by')}."

    notification_log.record(
        channel="mail",
        subject=subject,
        body=body,
    )
    
    await send_investigator_email("officer@ksp.gov.in", subject, body)

    notification_log.record(
        channel="push",
        subject="Case status updated",
        body=f"Case {case_ref} is now {payload.get('to_status')}.",
    )


event_bus.subscribe("case.status_changed", _on_status_changed)
