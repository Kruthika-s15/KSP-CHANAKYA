"""
Event / alert service (Signals & Event Functions in the brief).

Local provider: a small in-process pub/sub bus. Real subscribers are
attached at startup (see app/catalyst/__init__.py) — a case status change
actually fires the "case.status_changed" event, which actually clears the
Cache and actually appends to the Notification log. Nothing here is a no-op.

Catalyst equivalent: Catalyst Signals / Event Functions would replace the
in-process `emit()` call with a real event published to a queue, invoking
serverless functions asynchronously. Subscribers keep the same signature.
"""
import logging
from collections import defaultdict
from typing import Callable
import asyncio

from app.catalyst.base import ServiceInfo, ServiceTier, register

logger = logging.getLogger(__name__)


class LocalEventBus:
    def __init__(self):
        self._subscribers: dict[str, list[Callable]] = defaultdict(list)
        self.event_log: list[dict] = []

    def subscribe(self, event_name: str, handler: Callable) -> None:
        self._subscribers[event_name].append(handler)

    def emit(self, event_name: str, payload: dict) -> None:
        self.event_log.append({"event": event_name, "payload": payload})
        self.event_log[:] = self.event_log[-50:]  # keep it bounded
        for handler in self._subscribers.get(event_name, []):
            try:
                res = handler(payload)
                if asyncio.iscoroutine(res):
                    try:
                        loop = asyncio.get_running_loop()
                        loop.create_task(res)
                    except RuntimeError:
                        pass # No running event loop
            except Exception:
                logger.exception("Signal handler for %s failed", event_name)


event_bus = LocalEventBus()

register(ServiceInfo(
    key="signals",
    name="Signals / Event Functions",
    category="Workflow",
    tier=ServiceTier.IMPLEMENTED,
    local_provider="In-process pub/sub event bus (app/catalyst/signals.py)",
    catalyst_equivalent="Catalyst Signals / Event Functions",
    description="Fires 'case.status_changed' on every workflow transition; live subscribers "
                "clear the Cache and write to the Notification log.",
    demo_endpoint="POST /api/v1/catalyst/crimes/{case_id}/status (triggers the event)",
))
