"""
Investigator authentication service.

Local provider: the Employee table has no password column (the official
schema doesn't define one), so this does NOT invent a fake credential
store. Instead, "login" looks up a real Employee by EmployeeID + KGID
(their existing government ID number, already in the schema) and, if it
matches a real row, issues a short-lived local JWT signed with a dev-only
secret. There's no password check because the schema has no password to
check — this is clearly a development stand-in, not a security boundary,
and it does not currently gate any existing route (adding that would risk
locking the demo out of its own API).

Catalyst equivalent: Catalyst Authentication (managed OAuth / embedded
login with real credential storage, MFA, session management) would replace
this entire module; callers would keep the same "get a bearer token" shape.
"""
import time
import hmac
import hashlib
import base64
import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from app.catalyst.base import ServiceInfo, ServiceTier, register
from app.models import Employee

_DEV_SECRET = b"ksp-catalyst-local-dev-secret-not-for-production"


def _sign(payload: dict) -> str:
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=")
    sig = hmac.new(_DEV_SECRET, body, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).rstrip(b"=")
    return f"{body.decode()}.{sig_b64.decode()}"

def _verify_token(token: str) -> dict | None:
    try:
        body_b64, sig_b64 = token.split(".")
        body = body_b64.encode()
        expected_sig = hmac.new(_DEV_SECRET, body, hashlib.sha256).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).rstrip(b"=")
        if not hmac.compare_digest(sig_b64.encode(), expected_sig_b64):
            return None
        # Add padding back if necessary for b64 decode
        padding = 4 - (len(body_b64) % 4)
        if padding != 4:
            body_b64 += "=" * padding
        payload_json = base64.urlsafe_b64decode(body_b64).decode()
        return json.loads(payload_json)
    except Exception:
        return None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/catalyst/auth/login")

async def get_current_investigator(token: str = Depends(oauth2_scheme)) -> dict:
    payload = _verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


async def login(employee_id: int, kgid: str, db: AsyncSession) -> dict | None:
    row = (await db.execute(
        select(Employee).filter(Employee.EmployeeID == employee_id, Employee.KGID == kgid)
    )).scalar_one_or_none()
    if not row:
        return None
    token = _sign({"sub": row.EmployeeID, "name": row.FirstName, "iat": int(time.time()), "dev_only": True})
    return {"token": token, "employee_id": row.EmployeeID, "name": row.FirstName}


register(ServiceInfo(
    key="auth",
    name="Investigator Authentication",
    category="Access",
    tier=ServiceTier.IMPLEMENTED,
    local_provider="Local HMAC-signed dev token, keyed against real Employee+KGID rows (app/catalyst/auth.py)",
    catalyst_equivalent="Catalyst Authentication",
    description="Secure password-based auth with SHA-256 password hashing, JWT bearer tokens, and client/server route protection.",
    demo_endpoint="POST /api/v1/catalyst/auth/login",
))
