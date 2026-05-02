"""Shared FastAPI dependencies — notably `get_current_user` for auth.

Cookie-based session with Authorization: Bearer fallback so automated tests
can authenticate without the full OAuth dance.

`require_admin` gates admin-only endpoints. The admin allowlist is a tiny
hardcoded set keyed by email — kept in code so a forgotten env var can't
silently expand admin access. To grant admin to another email, edit
`ADMIN_EMAILS` below or extend the helper to read from `ADMIN_EMAILS`
env var if you ever need runtime configurability.
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Request
from pydantic import BaseModel

from db import db

SESSION_COOKIE = "session_token"
SESSION_TTL_DAYS = 7

# Sole admin account. Future development can extend this set; we
# deliberately keep this hardcoded rather than env-driven so a missing
# environment variable can't accidentally promote everyone to admin.
ADMIN_EMAILS = frozenset({"pazmaskell@gmail.com"})


def is_admin_email(email: Optional[str]) -> bool:
    if not email:
        return False
    return email.strip().lower() in {a.lower() for a in ADMIN_EMAILS}


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime
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
    user_doc["is_admin"] = is_admin_email(user_doc.get("email"))
    return User(**user_doc)


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Gate an endpoint behind the admin allowlist. Returns the same User
    when allowed; raises 403 otherwise. Pair with FastAPI's `Depends`."""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
