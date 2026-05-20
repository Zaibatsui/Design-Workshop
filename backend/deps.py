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
from datetime import datetime, timezone
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Request
from pydantic import BaseModel

from db import db

SESSION_COOKIE = "session_token"
SESSION_TTL_DAYS = 7


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
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

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
    return User(**user_doc)


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Gate an endpoint behind the admin allowlist. Returns the same User
    when allowed; raises 403 otherwise. Pair with FastAPI's `Depends`."""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
