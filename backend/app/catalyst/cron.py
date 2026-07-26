"""
Scheduled analysis service (Cron in the brief).

Local provider: no background scheduler process runs in this dev
environment (uvicorn --reload is a single foreground process), so nothing
is honestly "scheduled" here. What IS real: the exact job Catalyst Cron
would run daily — recomputing hotspot scores and clearing the cache — as a
plain function, exposed behind a manual-trigger endpoint so it can be
demoed on demand instead of faking a timer firing.

Catalyst equivalent: Catalyst Cron would call `run_daily_crime_analysis`
on a schedule (e.g. daily at 02:00 IST) instead of a person hitting the
endpoint.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalyst.base import ServiceInfo, ServiceTier, register
from app.catalyst.automl import compute_hotspots
from app.catalyst.cache import cache_service


async def run_daily_crime_analysis(db: AsyncSession) -> dict:
    hotspots = await compute_hotspots(db)
    cleared = cache_service.clear()
    return {"hotspots_computed": len(hotspots), "cache_entries_cleared": cleared, "top_hotspots": hotspots[:3]}


register(ServiceInfo(
    key="cron",
    name="Scheduled Crime Analysis",
    category="Workflow",
    tier=ServiceTier.SIMULATED_LOCAL,
    local_provider="Manually-triggered version of the real job function (app/catalyst/cron.py) — "
                    "no background scheduler runs in this dev environment",
    catalyst_equivalent="Catalyst Cron",
    description="The job Cron would run daily (recompute hotspots, refresh cache) is real code, "
                "just triggered on demand instead of on a timer.",
    demo_endpoint="POST /api/v1/catalyst/cron/run-daily-analysis",
))
