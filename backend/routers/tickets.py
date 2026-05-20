"""Ticket router — bug reports & feature requests submitted from inside
Design Workshop.

Public surface
--------------
  - POST   /api/tickets                    authenticated; any user can file
  - GET    /api/tickets                    admin only; lists every ticket
  - GET    /api/tickets/count              admin only; open-ticket badge
  - PATCH  /api/tickets/{id}               admin only; open | complete | rejected
  - DELETE /api/tickets/{id}               authenticated; soft-hide for caller

  - GET    /api/tickets/mine               caller's own tickets (excluding ones they've hidden)
  - GET    /api/tickets/mine/notifications caller's unseen complete/rejected count
  - POST   /api/tickets/mine/seen          caller marks all their tickets as seen

Soft-delete contract
--------------------
`hidden_for_admin` and `hidden_for_reporter` are two independent booleans.
When EITHER side calls DELETE, only that side's flag flips. When BOTH
flags are true the document is hard-deleted (per user requirement —
once both parties have walked away from a ticket there's no reason to
keep the row in MongoDB).

Notifications
-------------
`reporter_seen` defaults to True on creation (the reporter knows about
their own submission). When admin flips the status to `complete` or
`rejected`, we reset `reporter_seen` to False so the user's My Tickets
badge lights up. Opening the My Tickets page POSTs to `/mine/seen`
which bulk-clears the flag for that user.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from db import db
from deps import User, require_admin, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tickets", tags=["tickets"])


# ---------- Pydantic models -----------------------------------------

class TicketCreate(BaseModel):
    type: Literal["bug", "feature"] = "bug"
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=8000)
    # data URLs (data:image/png;base64,...) — clamped client-side
    screenshots: List[str] = Field(default_factory=list)


class TicketStatusUpdate(BaseModel):
    status: Literal["open", "complete", "rejected"]


class TicketOut(BaseModel):
    id: str
    type: str
    title: str
    description: str
    screenshots: List[str]
    status: str
    created_by_email: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: str
    updated_at: str
    # True when the caller has unread changes (admin flipped status to
    # complete/rejected since the caller last opened their tickets).
    # Only meaningful on the `/mine` endpoint — `/admin` callers get
    # `False` here because admins are the originator of status flips.
    unread: bool = False


class NotificationsOut(BaseModel):
    count: int


# ---------- Helpers --------------------------------------------------

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _doc_to_out(doc: dict, *, unread: bool = False) -> TicketOut:
    return TicketOut(
        id=doc["id"],
        type=doc.get("type", "bug"),
        title=doc.get("title", ""),
        description=doc.get("description", ""),
        screenshots=doc.get("screenshots", []) or [],
        status=doc.get("status", "open"),
        created_by_email=doc.get("created_by_email"),
        created_by_name=doc.get("created_by_name"),
        created_at=doc.get("created_at", ""),
        updated_at=doc.get("updated_at", ""),
        unread=unread,
    )


def _ts(iso: str) -> int:
    """Return a sortable integer timestamp from an ISO string (0 if invalid)."""
    if not iso:
        return 0
    try:
        return int(datetime.fromisoformat(iso.replace("Z", "+00:00")).timestamp())
    except ValueError:
        return 0


def _sort_key(row: dict) -> tuple:
    # Open first, then complete/rejected, then by created_at desc.
    bucket = 0 if row.get("status") == "open" else 1
    return (bucket, -1 * _ts(row.get("created_at", "")))


# ---------- Routes ---------------------------------------------------

@router.post("", response_model=TicketOut)
async def create_ticket(payload: TicketCreate, user: User = Depends(get_current_user)):
    """Any authenticated user can file a bug or feature request."""
    now = _now_iso()
    doc = {
        "id": str(uuid.uuid4()),
        "type": payload.type,
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "screenshots": payload.screenshots,
        "status": "open",
        "created_by_email": user.email,
        "created_by_name": user.name,
        "created_at": now,
        "updated_at": now,
        # Soft-delete flags — neither side has hidden the brand-new
        # ticket yet. When BOTH flip true we hard-delete.
        "hidden_for_admin": False,
        "hidden_for_reporter": False,
        # Reporter has seen their own submission by definition.
        "reporter_seen": True,
    }
    await db.tickets.insert_one(doc)
    logger.info("ticket created: %s by %s", doc["id"], user.email)
    return _doc_to_out(doc)


@router.get("/count")
async def ticket_count(_user: User = Depends(require_admin)):
    """Admin only — lightweight open-ticket counter for the dashboard badge.
    Excludes tickets the admin has soft-hidden."""
    open_count = await db.tickets.count_documents(
        {"status": "open", "hidden_for_admin": {"$ne": True}}
    )
    return {"open": open_count}


@router.get("", response_model=List[TicketOut])
async def list_tickets(_user: User = Depends(require_admin)):
    """Admin only — open tickets first, then by created_at desc.
    Excludes admin-side soft-deletes."""
    rows = []
    async for d in db.tickets.find(
        {"hidden_for_admin": {"$ne": True}}, {"_id": 0}
    ):
        rows.append(d)
    rows.sort(key=_sort_key)
    return [_doc_to_out(d) for d in rows]


# ---- "My tickets" endpoints (any authenticated user) ----------------

@router.get("/mine", response_model=List[TicketOut])
async def list_my_tickets(user: User = Depends(get_current_user)):
    """Caller's own tickets, excluding ones they've soft-hidden."""
    rows = []
    async for d in db.tickets.find(
        {
            "created_by_email": user.email,
            "hidden_for_reporter": {"$ne": True},
        },
        {"_id": 0},
    ):
        rows.append(d)
    rows.sort(key=_sort_key)
    return [
        _doc_to_out(
            d,
            unread=(
                d.get("status") in ("complete", "rejected")
                and not d.get("reporter_seen", True)
            ),
        )
        for d in rows
    ]


@router.get("/mine/notifications", response_model=NotificationsOut)
async def my_ticket_notifications(user: User = Depends(get_current_user)):
    """Count of caller's tickets that have a recent admin-driven status
    change (complete/rejected) and haven't been seen yet. Drives the
    red badge on the My Tickets header link."""
    count = await db.tickets.count_documents(
        {
            "created_by_email": user.email,
            "status": {"$in": ["complete", "rejected"]},
            "reporter_seen": False,
            "hidden_for_reporter": {"$ne": True},
        }
    )
    return NotificationsOut(count=count)


@router.post("/mine/seen")
async def mark_my_tickets_seen(user: User = Depends(get_current_user)):
    """Bulk-clear the unread flag for every ticket the caller filed.
    Called by the My Tickets page on mount so the header badge clears
    as soon as the user has had a chance to see the status update."""
    res = await db.tickets.update_many(
        {"created_by_email": user.email, "reporter_seen": False},
        {"$set": {"reporter_seen": True}},
    )
    return {"updated": res.modified_count}


# ---- Admin status mutation -----------------------------------------

@router.patch("/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    ticket_id: str,
    payload: TicketStatusUpdate,
    _user: User = Depends(require_admin),
):
    """Admin only — set ticket status (open | complete | rejected).
    When flipping to complete/rejected we reset `reporter_seen` so the
    reporter's badge fires; opening it again ("open") doesn't notify."""
    doc = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket not found")
    update_fields = {"status": payload.status, "updated_at": _now_iso()}
    if payload.status in ("complete", "rejected"):
        update_fields["reporter_seen"] = False
    await db.tickets.update_one({"id": ticket_id}, {"$set": update_fields})
    doc = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    return _doc_to_out(doc)


# ---- Soft-delete (with mutual hard-delete) -------------------------

@router.delete("/{ticket_id}")
async def delete_ticket(
    ticket_id: str, user: User = Depends(get_current_user)
):
    """Soft-hide the ticket for the caller. When BOTH the admin side
    and the reporter side have hidden the ticket, hard-delete the
    document from MongoDB.

    Permissions:
      - admin → flips `hidden_for_admin`
      - reporter → flips `hidden_for_reporter`
      - everyone else → 403 (they have no view of the ticket anyway)
    """
    doc = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket not found")

    is_admin = bool(user.is_admin)
    is_reporter = doc.get("created_by_email") == user.email
    if not is_admin and not is_reporter:
        raise HTTPException(status_code=403, detail="Not allowed")

    update_fields = {}
    if is_admin:
        update_fields["hidden_for_admin"] = True
    if is_reporter:
        update_fields["hidden_for_reporter"] = True

    # Compute the post-update state to decide whether to hard-delete.
    final_admin_hidden = (
        update_fields.get("hidden_for_admin")
        or doc.get("hidden_for_admin", False)
    )
    final_reporter_hidden = (
        update_fields.get("hidden_for_reporter")
        or doc.get("hidden_for_reporter", False)
    )

    if final_admin_hidden and final_reporter_hidden:
        await db.tickets.delete_one({"id": ticket_id})
        logger.info("ticket hard-deleted (mutual hide): %s", ticket_id)
        return {"ok": True, "hard_deleted": True}

    await db.tickets.update_one({"id": ticket_id}, {"$set": update_fields})
    logger.info(
        "ticket soft-hidden for %s: %s",
        "admin" if is_admin else "reporter",
        ticket_id,
    )
    return {"ok": True, "hard_deleted": False}
