"""
Full-text search service.

Local provider: Postgres ILIKE across the real crime-relevant text columns
(CrimeNo, CaseNo, BriefFacts) — no external search engine required, and it
returns real rows from the real database. Wired into GET /crimes/search via
the optional `q` parameter.

Catalyst equivalent: Catalyst's full-text/Zia Search would replace this with
an indexed, ranked search service, but the query surface (free-text in,
CaseMasterIDs out) stays identical, so callers don't change.
"""
from sqlalchemy import or_

from app.catalyst.base import ServiceInfo, ServiceTier, register


def apply_free_text_filter(query, search_model, text_columns: list, q: str):
    """Apply an OR'd ILIKE filter across the given columns for free-text `q`."""
    if not q:
        return query
    like = f"%{q}%"
    return query.filter(or_(*[col.ilike(like) for col in text_columns]))


register(ServiceInfo(
    key="search",
    name="Full-Text Search",
    category="Data",
    tier=ServiceTier.IMPLEMENTED,
    local_provider="Postgres ILIKE across CrimeNo/CaseNo/BriefFacts (app/catalyst/search.py)",
    catalyst_equivalent="Catalyst Advanced I/O / Zia Search",
    description="Free-text case search used by the `q` parameter on GET /api/v1/crimes/search.",
    demo_endpoint="GET /api/v1/crimes/search?q=theft",
))
