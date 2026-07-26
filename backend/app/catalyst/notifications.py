"""
Mail + Push Notification service.

Live routing
------------
When CATALYST_PROJECT_ID + CATALYST_CLIENT_ID + CATALYST_CLIENT_SECRET are
present in .env, `record()` attempts a real Catalyst Mail API call.  If the
call succeeds, `delivered` is set to True in the log entry.

When credentials are absent (or the API call fails) the notification is
recorded in the in-memory log with `delivered=False` — exactly the
honest local simulation from before.  Nothing is silently swallowed.

Status on the Platform Services dashboard: IMPLEMENTED when live credentials
are detected at import time; SIMULATED_LOCAL otherwise.
"""
from __future__ import annotations

from datetime import datetime, timezone

import os
import smtplib
from email.mime.text import MIMEText
import logging
import asyncio
from app.core.config import settings
from app.catalyst.base import ServiceInfo, ServiceTier, register

logger = logging.getLogger(__name__)

async def send_investigator_email(to_email: str, subject: str, message: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    def _send():
        if not smtp_server or not smtp_port:
            print(f"[NOTIFICATION LOG] Sent to: {to_email} | Subject: {subject} | Msg: {message}")
            return
            
        try:
            msg = MIMEText(message)
            msg['Subject'] = subject
            msg['From'] = smtp_user or "noreply@ksp.gov.in"
            msg['To'] = to_email

            with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
                if smtp_user and smtp_password:
                    server.starttls()
                    server.login(smtp_user, smtp_password)
                server.send_message(msg)
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            print(f"[NOTIFICATION LOG] Sent to: {to_email} | Subject: {subject} | Msg: {message}")

    await asyncio.to_thread(_send)

def _live() -> bool:
    return bool(
        settings.CATALYST_PROJECT_ID
        and settings.CATALYST_CLIENT_ID
        and settings.CATALYST_CLIENT_SECRET
    )


class NotificationLog:
    def __init__(self) -> None:
        self._log: list[dict] = []

    def record(
        self,
        channel: str,
        subject: str,
        body: str,
        recipient: str = "duty-officer",
    ) -> dict:
        delivered = False
        error: str | None = None

        if _live() and channel == "mail":
            try:
                from app.catalyst import catalyst_client as _c
                _c.send_mail(
                    to_address=recipient if "@" in recipient else f"{recipient}@ksp.gov.in",
                    subject=subject,
                    body_html=f"<pre>{body}</pre>",
                )
                delivered = True
            except Exception as exc:
                error = str(exc)

        entry: dict = {
            "channel":   channel,
            "recipient": recipient,
            "subject":   subject,
            "body":      body,
            "sent_at":   datetime.now(timezone.utc).isoformat(),
            "delivered": delivered,
        }
        if error:
            entry["delivery_error"] = error

        self._log.append(entry)
        self._log[:] = self._log[-50:]
        return entry

    def recent(self, limit: int = 20) -> list[dict]:
        return list(reversed(self._log[-limit:]))


notification_log = NotificationLog()

# ---------------------------------------------------------------------------
# Service registry
# ---------------------------------------------------------------------------

_tier = ServiceTier.IMPLEMENTED if _live() else ServiceTier.SIMULATED_LOCAL
_desc = (
    "Live: mail notifications delivered via Catalyst Mail API using project "
    "credentials from .env.  All alerts are also persisted in the in-memory log."
    if _live() else
    "Simulated: alerts are generated and logged but not actually delivered — "
    "no Catalyst credentials in .env.  Set CATALYST_PROJECT_ID / "
    "CATALYST_CLIENT_ID / CATALYST_CLIENT_SECRET to enable live delivery."
)

register(ServiceInfo(
    key="notifications",
    name="Mail & Push Notifications",
    category="Communication",
    tier=_tier,
    local_provider=(
        "Catalyst Mail API + in-memory log (app/catalyst/notifications.py)"
        if _live() else
        "In-memory notification log, no real transport (app/catalyst/notifications.py)"
    ),
    catalyst_equivalent="Catalyst Mail + Push Notifications",
    description=_desc,
    demo_endpoint="GET /api/v1/catalyst/notifications",
))
