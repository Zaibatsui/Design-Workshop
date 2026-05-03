"""Admin router — user management for accounts with admin privilege.

Currently exposes:
  - GET  /api/admin/users               list every account with stats
  - PUT  /api/admin/users/{id}/status   activate / deactivate an account

Admin gating is via deps.require_admin (email allowlist in deps.py).
Admins cannot deactivate themselves or other admins — both are silent
guard rails to prevent the room locking itself out.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db import db
from deps import User, is_admin_email, require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminUserRow(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: Optional[str] = None       # ISO strings, easier on the JSON pipeline
    last_login_at: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False
    sections_count: int = 0
    pages_count: int = 0


class StatusUpdate(BaseModel):
    is_active: bool


def _iso(dt) -> Optional[str]:
    if dt is None:
        return None
    if hasattr(dt, "isoformat"):
        return dt.isoformat()
    return str(dt)


@router.get("/users", response_model=list[AdminUserRow])
async def list_users(_admin: User = Depends(require_admin)):
    """Every user in the system + per-user counts of sections and pages.

    Pulls all users in one round-trip and aggregates counts via two
    aggregation queries grouped by user_id; that's O(2) round-trips
    instead of O(N) per-user lookups, which keeps the page snappy
    even at hundreds of users.
    """
    users = await db.users.find({}, {"_id": 0}).to_list(length=10_000)

    sec_counts = {
        doc["_id"]: doc["count"]
        async for doc in db.sections.aggregate([
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
        ])
    }
    pg_counts = {
        doc["_id"]: doc["count"]
        async for doc in db.pages.aggregate([
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
        ])
    }

    rows: list[AdminUserRow] = []
    for u in users:
        rows.append(AdminUserRow(
            user_id=u["user_id"],
            email=u["email"],
            name=u.get("name") or u["email"],
            picture=u.get("picture"),
            created_at=_iso(u.get("created_at")),
            last_login_at=_iso(u.get("last_login_at")),
            is_active=u.get("is_active", True),
            is_admin=is_admin_email(u.get("email")),
            sections_count=sec_counts.get(u["user_id"], 0),
            pages_count=pg_counts.get(u["user_id"], 0),
        ))

    # Sort: admins first → most recently active first → never-logged-in last
    # → alphabetised by email. ISO timestamps sort lexicographically in
    # natural chronological order, so we negate by inverting via a tuple
    # of (is_admin?, never_logged?, -timestamp_str_via_reverse_compare,
    # email). Simpler in two passes with a stable sort:
    rows.sort(key=lambda r: r.email.lower())
    rows.sort(key=lambda r: (r.last_login_at or ""), reverse=True)
    rows.sort(key=lambda r: not r.is_admin)
    return rows


@router.put("/users/{user_id}/status", response_model=AdminUserRow)
async def update_user_status(
    user_id: str,
    payload: StatusUpdate,
    admin: User = Depends(require_admin),
):
    """Activate or deactivate a user. Deactivation also clears their
    active sessions so the change is effective immediately — without it
    a logged-in revoked user keeps working until their cookie expires."""
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Self-protection — never let an admin lock themselves out.
    if target["user_id"] == admin.user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own status")

    # Don't let one admin deactivate another (the allowlist is the
    # source of truth for admin status; flipping is_active on an admin
    # would silently strip their access without changing the allowlist).
    if is_admin_email(target.get("email")) and not payload.is_active:
        raise HTTPException(status_code=400, detail="Cannot deactivate another admin")

    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_active": payload.is_active}},
    )

    if not payload.is_active:
        # Drop active sessions so the user is kicked out on their next
        # request rather than waiting for their 7-day cookie to expire.
        await db.user_sessions.delete_many({"user_id": user_id})

    # Re-render the row for the caller.
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    sections_count = await db.sections.count_documents({"user_id": user_id})
    pages_count = await db.pages.count_documents({"user_id": user_id})
    return AdminUserRow(
        user_id=target["user_id"],
        email=target["email"],
        name=target.get("name") or target["email"],
        picture=target.get("picture"),
        created_at=_iso(target.get("created_at")),
        last_login_at=_iso(target.get("last_login_at")),
        is_active=target.get("is_active", True),
        is_admin=is_admin_email(target.get("email")),
        sections_count=sections_count,
        pages_count=pages_count,
    )
