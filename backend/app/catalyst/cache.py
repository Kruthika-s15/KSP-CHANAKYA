"""
Cache service.

Local provider: a real in-process TTL cache (thread-unsafe by design — the
FastAPI dev server here is single-process/async, so a plain dict is fine for
a demo). It's actually wired into GET /crimes to cut repeated-query latency,
and invalidated whenever a case status changes via the Circuits workflow.

Catalyst equivalent: Catalyst Cache (a managed, distributed key-value cache
shared across serverless function instances). Swapping this provider for a
Catalyst SDK client behind the same `get`/`set`/`clear` interface is a
drop-in change — nothing above this layer needs to know which one is active.
"""
import time
from typing import Any, Optional

from app.catalyst.base import ServiceInfo, ServiceTier, register


class LocalTTLCache:
    def __init__(self):
        self._store: dict[str, tuple[float, Any]] = {}
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if not entry:
            self.misses += 1
            return None
        expires_at, value = entry
        if time.monotonic() > expires_at:
            self._store.pop(key, None)
            self.misses += 1
            return None
        self.hits += 1
        return value

    def set(self, key: str, value: Any, ttl_seconds: float = 30.0) -> None:
        self._store[key] = (time.monotonic() + ttl_seconds, value)

    def clear(self) -> int:
        n = len(self._store)
        self._store.clear()
        return n

    def stats(self) -> dict:
        return {"entries": len(self._store), "hits": self.hits, "misses": self.misses}


cache_service = LocalTTLCache()

register(ServiceInfo(
    key="cache",
    name="Cache",
    category="Data",
    tier=ServiceTier.IMPLEMENTED,
    local_provider="In-process TTL cache (app/catalyst/cache.py)",
    catalyst_equivalent="Catalyst Cache",
    description="Caches GET /crimes list results for 30s to cut repeated-query load; "
                "cleared automatically on any case status change.",
    demo_endpoint="GET /api/v1/crimes (cache-backed) — see /api/v1/catalyst/status for hit/miss counters",
))
