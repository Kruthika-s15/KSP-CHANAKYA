"""
CI/CD service (Pipelines in the brief).

No provider class here — a pipeline isn't something the running application
calls, it's something that runs around it. A real, runnable GitHub Actions
config is checked in at .github/workflows/ci.yml (backend py_compile +
pytest, frontend build) as the honest local/portable equivalent. It is not
executed inside this environment (no network), which is exactly why it's
registered INTEGRATION_READY rather than IMPLEMENTED.

Catalyst equivalent: Catalyst Pipelines would replace or wrap this same
workflow file to deploy straight to Catalyst-hosted functions/static
hosting on every merge to main.
"""
from app.catalyst.base import ServiceInfo, ServiceTier, register

register(ServiceInfo(
    key="pipelines",
    name="CI/CD",
    category="Access",
    tier=ServiceTier.INTEGRATION_READY,
    local_provider="GitHub Actions workflow at .github/workflows/ci.yml (not executed in this sandbox)",
    catalyst_equivalent="Catalyst Pipelines",
    description="A real CI config exists (backend compile+test, frontend build) but hasn't "
                "run anywhere yet — this sandbox has no network access to a CI runner.",
))
