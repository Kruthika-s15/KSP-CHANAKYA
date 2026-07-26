"""
Zoho Catalyst REST client — token management + Zia / Mail wrappers.

Authentication strategy
-----------------------
Zoho's OAuth2 supports a *self-client* flow where a refresh_token can be
pre-generated from the API Console and stored as an env-var, giving us
server-to-server access without a browser round-trip.

If CATALYST_REFRESH_TOKEN is set this module silently obtains/renews an
access token via accounts.zoho.in and attaches it to every request.

If the refresh_token is absent we fall back to the client-credentials
"server token" (Catalyst's own project-scoped token endpoint), which works
for project-internal calls.

Nothing here invents fake responses.  If credentials are absent the
functions raise CatalystNotConfigured immediately.
"""
from __future__ import annotations

import io
import time
import threading
from typing import Optional

import httpx

from app.core.config import settings


class CatalystNotConfigured(RuntimeError):
    """Raised when required Catalyst credentials are absent from .env."""


# ---------------------------------------------------------------------------
# Token manager
# ---------------------------------------------------------------------------

_ZOHO_TOKEN_URL = "https://accounts.zoho.in/oauth/v2/token"
_CATALYST_BASE  = "https://api.catalyst.zoho.in/baas/v1"

_token_lock        = threading.Lock()
_cached_token: Optional[str] = None
_token_expires_at: float      = 0.0


def _credentials_present() -> bool:
    return bool(
        settings.CATALYST_PROJECT_ID
        and settings.CATALYST_CLIENT_ID
        and settings.CATALYST_CLIENT_SECRET
    )


def _refresh_access_token() -> str:
    """Exchange refresh_token (or client_credentials) for a fresh access token."""
    global _cached_token, _token_expires_at

    if not _credentials_present():
        raise CatalystNotConfigured(
            "CATALYST_PROJECT_ID / CATALYST_CLIENT_ID / CATALYST_CLIENT_SECRET "
            "are not set in .env — cannot authenticate with Zoho Catalyst."
        )

    if settings.CATALYST_REFRESH_TOKEN:
        # Preferred: self-client refresh flow
        data = {
            "grant_type": "refresh_token",
            "client_id":     settings.CATALYST_CLIENT_ID,
            "client_secret": settings.CATALYST_CLIENT_SECRET,
            "refresh_token": settings.CATALYST_REFRESH_TOKEN,
        }
    else:
        # Fallback: Catalyst project-scoped client_credentials
        data = {
            "grant_type":    "client_credentials",
            "client_id":     settings.CATALYST_CLIENT_ID,
            "client_secret": settings.CATALYST_CLIENT_SECRET,
            "scope":         "ZohoCatalyst.projects.ALL",
        }

    resp = httpx.post(_ZOHO_TOKEN_URL, data=data, timeout=15)
    resp.raise_for_status()
    body = resp.json()

    if "access_token" not in body:
        raise CatalystNotConfigured(
            f"Zoho token endpoint returned an unexpected payload: {body}"
        )

    _cached_token     = body["access_token"]
    _token_expires_at = time.time() + body.get("expires_in", 3600) - 60  # 60 s buffer
    return _cached_token


def get_access_token() -> str:
    global _cached_token, _token_expires_at
    with _token_lock:
        if _cached_token and time.time() < _token_expires_at:
            return _cached_token
        return _refresh_access_token()


def _auth_headers() -> dict:
    return {"Authorization": f"Zoho-oauthtoken {get_access_token()}"}


# ---------------------------------------------------------------------------
# Zia OCR
# ---------------------------------------------------------------------------

def zia_ocr(image_bytes: bytes, filename: str = "document.png") -> str:
    """
    Call Catalyst Zia OCR and return extracted text.

    POST /baas/v1/project/{id}/ml/ocr
    Multipart: image file + JSON options
    """
    if not _credentials_present():
        raise CatalystNotConfigured("Catalyst credentials missing — Zia OCR unavailable.")

    url = f"{_CATALYST_BASE}/project/{settings.CATALYST_PROJECT_ID}/ml/ocr"
    files  = {"image": (filename, io.BytesIO(image_bytes), "image/png")}
    params = {"language": "eng", "modelType": "OCR"}

    resp = httpx.post(url, headers=_auth_headers(), files=files, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    # Zia OCR response: {"status":"success","data":{"extracted_text":"..."}}
    return data.get("data", {}).get("extracted_text", "")


# ---------------------------------------------------------------------------
# Zia Face Comparison
# ---------------------------------------------------------------------------

def zia_face_compare(
    probe_bytes: bytes,
    candidate_bytes: bytes,
    probe_name: str = "probe.png",
    candidate_name: str = "candidate.png",
) -> float:
    """
    Compare two face images and return a similarity score 0.0–1.0.

    POST /baas/v1/project/{id}/ml/faceanalytics/compare
    Body: multipart with 'source' and 'target' files
    Response: {"status":"success","data":{"is_same_person":true,"similarity":0.92}}
    """
    if not _credentials_present():
        raise CatalystNotConfigured("Catalyst credentials missing — Zia Face Compare unavailable.")

    url = (
        f"{_CATALYST_BASE}/project/{settings.CATALYST_PROJECT_ID}/ml/faceanalytics/compare"
    )
    files = {
        "source": (probe_name,     io.BytesIO(probe_bytes),     "image/png"),
        "target": (candidate_name, io.BytesIO(candidate_bytes), "image/png"),
    }

    resp = httpx.post(url, headers=_auth_headers(), files=files, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    return float(data.get("data", {}).get("similarity", 0.0))


# ---------------------------------------------------------------------------
# Catalyst Mail (notification)
# ---------------------------------------------------------------------------

def send_mail(
    to_address: str,
    subject: str,
    body_html: str,
    from_name: str = "KSP CHANAKYA",
) -> dict:
    """
    Send an email via Catalyst Mail API.

    POST /baas/v1/project/{id}/mail
    """
    if not _credentials_present():
        raise CatalystNotConfigured("Catalyst credentials missing — Mail API unavailable.")

    url  = f"{_CATALYST_BASE}/project/{settings.CATALYST_PROJECT_ID}/mail"
    payload = {
        "from_email": f"{from_name} <no-reply@catalyst.zohoapps.com>",
        "to_email":   to_address,
        "subject":    subject,
        "content":    body_html,
    }

    resp = httpx.post(url, headers=_auth_headers(), json=payload, timeout=15)
    resp.raise_for_status()
    return resp.json()
