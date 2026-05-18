"""Ticket router — bug reports & feature requests submitted from inside
Design Workshop.

  - POST   /api/tickets          authenticated; any user can file
  - GET    /api/tickets          admin only; lists every ticket
  - PATCH  /api/tickets/{id}     admin only; flip status open ↔ complete
  - DELETE /api/tickets/{id}     admin only

Tickets store base64-encoded screenshots inline (no separate file upload
pipeline) to keep the surface area tiny. The form clamps total payload
size on the frontend so we don't bloat MongoDB documents.
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
    status: Literal["open", "complete"]


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


# ---------- Helpers --------------------------------------------------

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _doc_to_out(doc: dict) -> TicketOut:
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
    )


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
    }
    await db.tickets.insert_one(doc)
    logger.info("ticket created: %s by %s", doc["id"], user.email)
    return _doc_to_out(doc)


@router.get("", response_model=List[TicketOut])
async def list_tickets(_user: User = Depends(require_admin)):
    """Admin only — open tickets first, then by created_at desc inside each group."""
    rows = []
    async for d in db.tickets.find({}, {"_id": 0}):
        rows.append(d)
    rows.sort(
        key=lambda r: (
            r.get("status") == "complete",
            -1 * _ts(r.get("created_at", "")),
        )
    )
    return [_doc_to_out(d) for d in rows]


def _ts(iso: str) -> int:
    """Return a sortable integer timestamp from an ISO string (0 if invalid)."""
    if not iso:
        return 0
    try:
        return int(datetime.fromisoformat(iso.replace("Z", "+00:00")).timestamp())
    except ValueError:
        return 0


@router.patch("/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    ticket_id: str,
    payload: TicketStatusUpdate,
    _user: User = Depends(require_admin),
):
    """Admin only — flip ticket status."""
    doc = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket not found")
    await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {"status": payload.status, "updated_at": _now_iso()}},
    )
    doc = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    return _doc_to_out(doc)


@router.delete("/{ticket_id}")
async def delete_ticket(ticket_id: str, _user: User = Depends(require_admin)):
    """Admin only — hard delete."""
    res = await db.tickets.delete_one({"id": ticket_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"ok": True}
