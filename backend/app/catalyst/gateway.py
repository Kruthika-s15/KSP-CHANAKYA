"""
API Gateway service — request-level security in front of the API.

Local provider: a real FastAPI middleware that, when enabled, checks for an
`X-API-Key` header against a locally-configured key and applies a simple
per-IP rate limit. It is registered but left OFF by default in main.py so
the existing open demo routes keep working without a key — flipping
`settings.CATALYST_GATEWAY_ENABLED` on is a one-line change once you want
to demo it.

Catalyst equivalent: Catalyst API Gateway (managed key issuance, quotas,
throttling, analytics) sitting in front of the same FastAPI routes.
"""
import time
from collections import defaultdict

from fastapi import Request
from fastapi.responses import JSONResponse

from app.catalyst.base import ServiceInfo, ServiceTier, register

_WINDOW_SECONDS = 60
_MAX_REQUESTS_PER_WINDOW = 120
_hits: dict[str, list[float]] = defaultdict(list)


async def rate_limit_and_key_check(request: Request, call_next, api_key: str | None):
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    _hits[client_ip] = [t for t in _hits[client_ip] if now - t < _WINDOW_SECONDS]

    if api_key and request.headers.get("X-API-Key") != api_key:
        return JSONResponse(status_code=401, content={"detail": "Invalid or missing X-API-Key"})

    if len(_hits[client_ip]) >= _MAX_REQUESTS_PER_WINDOW:
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})

    _hits[client_ip].append(now)
    return await call_next(request)


register(ServiceInfo(
    key="gateway",
    name="API Gateway",
    category="Access",
    tier=ServiceTier.SIMULATED_LOCAL,
    local_provider="FastAPI middleware: API-key check + per-IP rate limit (app/catalyst/gateway.py), "
                    "off by default",
    catalyst_equivalent="Catalyst API Gateway",
    description="Real middleware exists but is disabled by default so the open demo API keeps "
                "working without a key. Toggle CATALYST_GATEWAY_ENABLED to demo it.",
))
