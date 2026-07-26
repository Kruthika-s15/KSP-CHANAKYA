"""
Structured Data Store service — for the 28-table KSP FIR/case schema.

This one needs no separate provider class: the project's existing
SQLAlchemy async engine + the official Postgres schema (app/models/,
app/db/session.py) already *is* the implementation. This module exists only
to register that fact in the Catalyst status matrix, so the demo shows a
complete picture instead of implying the relational data layer is missing.

Catalyst equivalent: Catalyst Data Store is a managed relational database
service — swapping DATABASE_URL in app/core/config.py to point at a
Catalyst-provisioned Postgres instance is the entire migration; no
application code changes.
"""
from app.catalyst.base import ServiceInfo, ServiceTier, register

register(ServiceInfo(
    key="datastore",
    name="Structured Data Store",
    category="Data",
    tier=ServiceTier.IMPLEMENTED,
    local_provider="Existing SQLAlchemy async engine + local Postgres (app/db/, app/models/)",
    catalyst_equivalent="Catalyst Data Store",
    description="The official 28-table KSP schema, already fully implemented and in active "
                "use by every API route. Nothing to add — this entry documents that coverage.",
))
