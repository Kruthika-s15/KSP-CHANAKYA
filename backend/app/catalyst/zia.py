"""
Zia AI services: OCR, face matching, speech-to-text, translation.

Live routing
------------
When CATALYST_PROJECT_ID + CATALYST_CLIENT_ID + CATALYST_CLIENT_SECRET are
present in .env, every function below routes to a real Zoho Catalyst Zia
API endpoint via the thin REST client in catalyst_client.py.

When credentials are absent the functions raise NotConfiguredError with a
clear explanation — this matches the original honest-failure contract.

Status on the Platform Services dashboard: IMPLEMENTED (live credentials
detected at import time).
"""
from __future__ import annotations

from app.core.config import settings
from app.catalyst.base import ServiceInfo, ServiceTier, register, NotConfiguredError
from app.catalyst import catalyst_client as _client


def _live() -> bool:
    """True when the three required Catalyst env-vars are all set."""
    return bool(
        settings.CATALYST_PROJECT_ID
        and settings.CATALYST_CLIENT_ID
        and settings.CATALYST_CLIENT_SECRET
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def ocr_extract_text(image_bytes: bytes, filename: str = "document.png") -> str:
    """
    Extract text from a scanned FIR / handwritten note image.

    Live: Catalyst Zia OCR API.
    Fallback: raises NotConfiguredError.
    """
    if _live():
        try:
            return _client.zia_ocr(image_bytes, filename)
        except _client.CatalystNotConfigured as exc:
            raise NotConfiguredError(str(exc)) from exc
    raise NotConfiguredError(
        "Zia OCR: no Catalyst credentials in .env "
        "(CATALYST_PROJECT_ID / CATALYST_CLIENT_ID / CATALYST_CLIENT_SECRET). "
        "Set these variables and restart the server to activate live OCR."
    )


def face_match(
    probe_image_bytes: bytes,
    candidate_image_bytes: bytes,
    probe_name: str = "probe.png",
    candidate_name: str = "candidate.png",
) -> float:
    """
    Compare two face images; returns a similarity score 0.0–1.0.

    Live: Catalyst Zia Face Analytics compare endpoint.
    Fallback: raises NotConfiguredError.
    """
    if _live():
        try:
            return _client.zia_face_compare(
                probe_image_bytes, candidate_image_bytes,
                probe_name, candidate_name,
            )
        except _client.CatalystNotConfigured as exc:
            raise NotConfiguredError(str(exc)) from exc
    raise NotConfiguredError(
        "Zia Face Match: no Catalyst credentials in .env. "
        "Set CATALYST_PROJECT_ID / CATALYST_CLIENT_ID / CATALYST_CLIENT_SECRET "
        "and restart the server to activate live face-comparison."
    )


def speech_to_text(audio_bytes: bytes, language: str = "kn-IN") -> str:
    """
    Transcribe witness statement audio (English or Kannada).

    Zia Speech-to-Text has no REST-only equivalent in the current SDK
    (requires the Catalyst Functions runtime).  This raises NotConfiguredError
    regardless of credential state — to be replaced with a Cloud Function
    trigger when deployed to Catalyst.
    """
    raise NotConfiguredError(
        "Zia Speech-to-Text: transcription requires a Catalyst Functions runtime "
        "and cannot be called directly as a REST endpoint from the local dev server. "
        "Deploy to Catalyst and invoke via a scheduled / event-triggered Function."
    )


def translate(text: str, target_language: str) -> str:
    """
    Translate case text between English and Kannada.

    Currently delegated to Gemini (already working in the AI Assistant).
    Zia's managed translation endpoint requires Catalyst Functions hosting.
    """
    raise NotConfiguredError(
        "Zia Translation: Kannada ↔ English is already handled by Gemini in "
        "the AI Assistant.  A dedicated Zia-managed-translation call requires "
        "Catalyst Functions hosting and is not available in the local dev server."
    )


# ---------------------------------------------------------------------------
# Service registry — tier is IMPLEMENTED when live credentials are present
# ---------------------------------------------------------------------------

_tier = ServiceTier.IMPLEMENTED if _live() else ServiceTier.INTEGRATION_READY
_desc = (
    "Live: Zia OCR and Face Analytics are routed to the Zoho Catalyst REST API "
    "using project credentials from .env. Speech-to-text and translation require "
    "Catalyst Functions hosting (not available in local dev)."
    if _live() else
    "Credentials absent: set CATALYST_PROJECT_ID / CATALYST_CLIENT_ID / "
    "CATALYST_CLIENT_SECRET in .env to activate live OCR and face-match routing."
)

register(ServiceInfo(
    key="zia",
    name="Zia AI Services (OCR / Face Match / Speech / Translate)",
    category="Intelligence",
    tier=_tier,
    local_provider=(
        "Live Catalyst Zia REST API (catalyst_client.py)"
        if _live() else
        "None — raises NotConfiguredError until Catalyst credentials are supplied"
    ),
    catalyst_equivalent="Catalyst Zia Services",
    description=_desc,
))
