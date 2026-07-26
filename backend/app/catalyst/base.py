"""
Shared types for the Catalyst service abstraction layer.

Every Zoho Catalyst platform service the KSP brief calls for is represented
here as a `ServiceInfo` entry with an honest `ServiceTier`:

- IMPLEMENTED        : a real local provider exists AND is wired into a live
                        API route the demo actually exercises.
- SIMULATED_LOCAL     : a real local provider exists (you can call it and get
                        real behaviour) but it stands in for infrastructure
                        Catalyst would normally supply in production (e.g.
                        writing to local disk instead of Stratus).
- INTEGRATION_READY   : the interface/contract is defined and documented, but
                        there is no local fallback that would be honest to
                        fake (e.g. OCR/face-match need a real model), so it is
                        wired to raise NotConfiguredError until real Catalyst
                        credentials are supplied.

Nothing in this package invents fake API calls or fake credentials. Modules
either do real local work (cache, full-text search, hotspot scoring, a
workflow state machine, an in-process event bus, on-disk file storage) or
they clearly say "not configured" and explain what would replace them.
"""
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class ServiceTier(str, Enum):
    IMPLEMENTED = "implemented"
    SIMULATED_LOCAL = "simulated_local"
    INTEGRATION_READY = "integration_ready"


@dataclass
class ServiceInfo:
    key: str
    name: str
    category: str
    tier: ServiceTier
    local_provider: str
    catalyst_equivalent: str
    description: str
    demo_endpoint: Optional[str] = None


class NotConfiguredError(RuntimeError):
    """Raised by INTEGRATION_READY providers when no real credentials exist."""
    pass


_REGISTRY: dict[str, ServiceInfo] = {}


def register(info: ServiceInfo) -> ServiceInfo:
    _REGISTRY[info.key] = info
    return info


def all_services() -> list[ServiceInfo]:
    return sorted(_REGISTRY.values(), key=lambda s: (s.category, s.name))
