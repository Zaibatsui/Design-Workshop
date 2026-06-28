"""Shared FastAPI dependencies — notably `get_current_user` for auth.

Cookie-based session with Authorization: Bearer fallback so automated tests
can authenticate without the full OAuth dance.

`require_admin` gates admin-only endpoints. The admin allowlist is read
from the `ADMIN_EMAILS` environment variable (comma-separated) at
import time. Keeping it env-driven means a public fork of this repo
doesn't ship with anyone's email pre-promoted; an empty/missing var
simply means "no admin" — never "everyone is admin".
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Request
from pydantic import BaseModel

from db import db

SESSION_COOKIE = "session_token"
SESSION_TTL_DAYS = 7
# Sliding inactivity timeout. Independent of the 7-day absolute TTL —
# a session is invalid if EITHER limit lapses. 30 minutes mirrors the
# Google Workspace / Linear default for admin SaaS tools: short enough
# that an unattended laptop in a coffee shop is reasonably safe, long
# enough that an author taking a call doesn't get logged out mid-edit.
SESSION_IDLE_MINUTES = 30
# Hard bounds for the user-settable idle window. Floor matches the
# system default; ceiling caps unattended-tab risk at 2 hours.
SESSION_IDLE_MIN = 30
SESSION_IDLE_MAX = 120


def _load_admin_emails() -> frozenset:
    """Parse ADMIN_EMAILS env var into a normalised frozenset.

    Accepts comma- or whitespace-separated emails (so both
    `a@x.com,b@x.com` and `a@x.com b@x.com` work). An unset or empty
    var yields an empty set — i.e. NO admins, which fails closed
    rather than promoting everyone.
    """
    raw = os.environ.get("ADMIN_EMAILS", "").strip()
    if not raw:
        return frozenset()
    parts = [p.strip().lower() for p in raw.replace(",", " ").split()]
    return frozenset(p for p in parts if p)


ADMIN_EMAILS = _load_admin_emails()


def is_admin_email(email: Optional[str]) -> bool:
    if not email:
        return False
    return email.strip().lower() in ADMIN_EMAILS


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None
    is_active: bool = True
    is_admin: bool = False
    # Whether the user has completed the first-login onboarding tour
    # (the 4-step "what's in Studio" walkthrough shown to new accounts).
    # Persisted so the tour fires exactly once across all devices.
    onboarded: bool = False
    # Idle-timeout window in minutes (between SESSION_IDLE_MIN and
    # SESSION_IDLE_MAX). Per-user override of the default
    # SESSION_IDLE_MINUTES — lets users with longer concentration
    # spans push the window up to 2 hours without forcing it on
    # everyone else.
    session_idle_minutes: int = 30


async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(default=None),
) -> User:
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session_doc = await db.user_sessions.find_one(
        {"session_token": token}, {"_id": 0}
    )
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    if expires_at < now:
        raise HTTPException(status_code=401, detail="Session expired")

    # Idle (sliding) expiry — `idle_expires_at` is bumped to
    # now + SESSION_IDLE_MINUTES on every authenticated request. If the
    # user has been inactive long enough that this stamp is in the past,
    # the session is dead even if the absolute `expires_at` is still
    # comfortably in the future. Sessions created before this field was
    # introduced (back-compat) are treated as freshly active so existing
    # users aren't kicked out the moment the upgrade ships.
    idle_at = session_doc.get("idle_expires_at")
    if idle_at is not None:
        if isinstance(idle_at, str):
            idle_at = datetime.fromisoformat(idle_at)
        if idle_at.tzinfo is None:
            idle_at = idle_at.replace(tzinfo=timezone.utc)
        if idle_at < now:
            # Drop the row eagerly — keeps the collection from
            # accumulating long-dead idle sessions.
            await db.user_sessions.delete_one({"session_token": token})
            raise HTTPException(status_code=401, detail="Session timed out")

    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]}, {"_id": 0}
    )
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")

    # is_active defaults to True for users created before this field
    # existed (back-compat) — admin must explicitly revoke to lock out.
    if not user_doc.get("is_active", True):
        # Belt-and-braces: also drop the session so the next request
        # short-circuits at the session lookup instead of re-checking.
        await db.user_sessions.delete_one({"session_token": token})
        raise HTTPException(status_code=403, detail="Account has been deactivated")

    user_doc["is_admin"] = is_admin_email(user_doc.get("email"))

    # Bump the sliding idle stamp on the way out so successful traffic
    # keeps the session alive. Use the user's chosen idle window if
    # set, otherwise fall back to the system default. Clamped to the
    # documented bounds so a stale DB value (or a manual mongo edit)
    # can't extend a session past the policy ceiling.
    user_idle = int(user_doc.get("session_idle_minutes") or SESSION_IDLE_MINUTES)
    user_idle = max(SESSION_IDLE_MIN, min(SESSION_IDLE_MAX, user_idle))
    await db.user_sessions.update_one(
        {"session_token": token},
        {"$set": {
            "idle_expires_at": now + timedelta(minutes=user_idle),
        }},
    )
    return User(**user_doc)


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Gate an endpoint behind the admin allowlist. Returns the same User
    when allowed; raises 403 otherwise. Pair with FastAPI's `Depends`."""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
