"""Landing social proof router — admin picks which sections show up in
the "Trusted by" band on the public marketing landing page (`/login`).

Same shape as landing_spotlights.py (an ordered list in a single
`app_settings` doc, `_id="landing_social_proof"`), but with a
deliberately different fallback: when nothing is curated, the public
endpoint returns an empty list and the band hides itself entirely.

Spotlights fall back to a hand-rolled demo because they're illustrating
what the *product* can do — that's honest either way. Social proof
(testimonials, logos, usage stats) makes a claim about *real people*
using the product, so there is no generic placeholder content: this is
the framework to fill in once there's actually beta-tester material to
feature, not something to fake in the meantime.

Each slot carries its own `height` (px) rather than us guessing one
from the section type — a testimonials carousel and a logo strip don't
want the same frame height, and the admin can see exactly what fits
once real content is in there.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db import db
from deps import User, require_admin

admin_router = APIRouter(
    prefix="/admin/landing-social-proof", tags=["landing-social-proof"]
)
public_router = APIRouter(
    prefix="/public/landing-social-proof", tags=["landing-social-proof"]
)

SETTINGS_KEY = "landing_social_proof"
MAX_SLOTS = 3
MIN_HEIGHT = 120
MAX_HEIGHT = 600
DEFAULT_HEIGHT = 280


class SocialProofSlot(BaseModel):
    section_id: Optional[str] = None
    height: int = DEFAULT_HEIGHT


class LandingSocialProofSetting(BaseModel):
    slots: List[SocialProofSlot] = []
    set_by: Optional[str] = None
    set_at: Optional[datetime] = None


class LandingSocialProofUpdate(BaseModel):
    slots: List[SocialProofSlot] = []


class PublicSocialProofItem(BaseModel):
    section_id: str
    name: str
    type: str
    config: Dict[str, Any]
    height: int


class PublicSocialProof(BaseModel):
    slots: List[Optional[PublicSocialProofItem]] = []


def _clamp_height(height: Optional[int]) -> int:
    if not isinstance(height, int):
        return DEFAULT_HEIGHT
    return max(MIN_HEIGHT, min(MAX_HEIGHT, height))


def _normalize_slot(raw: Any) -> Dict[str, Any]:
    """Slots used to be a plain list of section-id strings (or None)
    before per-slot height existed. Normalise both shapes on read so
    already-saved picks from that earlier version don't 500 out."""
    if isinstance(raw, str):
        return {"section_id": raw, "height": DEFAULT_HEIGHT}
    if isinstance(raw, dict):
        return {
            "section_id": raw.get("section_id"),
            "height": _clamp_height(raw.get("height")),
        }
    return {"section_id": None, "height": DEFAULT_HEIGHT}


async def _validate_owned(section_id: Optional[str], user_id: str):
    if not section_id:
        return
    doc = await db.sections.find_one(
        {"section_id": section_id, "user_id": user_id},
        {"_id": 0, "section_id": 1},
    )
    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"Section {section_id} not found in your library",
        )


@admin_router.get("", response_model=LandingSocialProofSetting)
async def get_landing_social_proof(_: User = Depends(require_admin)):
    doc = await db.app_settings.find_one({"_id": SETTINGS_KEY}, {"_id": 0})
    raw_slots = (doc or {}).get("slots") or []
    return LandingSocialProofSetting(
        slots=[_normalize_slot(s) for s in raw_slots],
        set_by=(doc or {}).get("set_by"),
        set_at=(doc or {}).get("set_at"),
    )


@admin_router.put("", response_model=LandingSocialProofSetting)
async def set_landing_social_proof(
    payload: LandingSocialProofUpdate,
    user: User = Depends(require_admin),
):
    slots = payload.slots[:MAX_SLOTS]
    for slot in slots:
        await _validate_owned(slot.section_id, user.user_id)
        slot.height = _clamp_height(slot.height)

    now = datetime.now(timezone.utc)
    has_any = any(s.section_id for s in slots)
    setting = {
        "slots": [s.dict() for s in slots],
        "set_by": user.user_id if has_any else None,
        "set_at": now if has_any else None,
    }
    await db.app_settings.update_one(
        {"_id": SETTINGS_KEY},
        {"$set": setting},
        upsert=True,
    )
    return LandingSocialProofSetting(**setting)


async def _load_public_section(raw_slot: Any):
    slot = _normalize_slot(raw_slot)
    section_id = slot.get("section_id")
    if not section_id:
        return None
    doc = await db.sections.find_one(
        {"section_id": section_id},
        {"_id": 0, "section_id": 1, "name": 1, "type": 1, "config": 1},
    )
    if not doc:
        return None
    return PublicSocialProofItem(
        section_id=doc["section_id"],
        name=doc.get("name") or "",
        type=doc.get("type") or "",
        config=doc.get("config") or {},
        height=_clamp_height(slot.get("height")),
    )


@public_router.get("", response_model=PublicSocialProof)
async def get_public_landing_social_proof():
    """Returns the currently-featured social-proof sections, in order.
    Empty list = nothing curated yet, band hides entirely. Hit
    unauthenticated from the marketing landing page."""
    doc = await db.app_settings.find_one({"_id": SETTINGS_KEY}, {"_id": 0})
    raw_slots = list((doc or {}).get("slots") or [])[:MAX_SLOTS]
    slots = [await _load_public_section(s) for s in raw_slots]
    return PublicSocialProof(slots=slots)
