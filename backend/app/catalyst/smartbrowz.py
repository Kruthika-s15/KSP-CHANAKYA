"""
Investigation report generation service (SmartBrowz in the brief).

Local provider: this project already has a real, working substitute —
`/crimes/{case_id}/report` server-renders a full investigation report
(case facts, people, chargesheet, arrests, sections, status history) as
print-ready HTML, and the page's PrintButton drives the browser's native
print-to-PDF. That covers SmartBrowz's job (turning structured case data
into a polished document) without needing a headless-browser credential.

Catalyst equivalent: Catalyst SmartBrowz would render the same report
server-side into a PDF file (no client browser involved) and could attach
it to Object Storage automatically. The report page's data-fetching
(fetchCase, fetchCasePeople, fetchChargesheet, fetchArrests, fetchSections,
fetchStatusHistory) is exactly what a SmartBrowz job would consume — this
entry documents that the report logic itself is done; only the headless
PDF-render-and-store step is not.
"""
from app.catalyst.base import ServiceInfo, ServiceTier, register

register(ServiceInfo(
    key="smartbrowz",
    name="Investigation Report Generation",
    category="Intelligence",
    tier=ServiceTier.IMPLEMENTED,
    local_provider="Server-rendered HTML report + browser print-to-PDF "
                    "(frontend crimes/[case_id]/report/page.tsx)",
    catalyst_equivalent="Catalyst SmartBrowz",
    description="Report content generation is fully real and working today via server-side "
                "rendering; only the headless PDF-render-and-store step would move to SmartBrowz.",
    demo_endpoint="GET /crimes/{case_id}/report (frontend)",
))
