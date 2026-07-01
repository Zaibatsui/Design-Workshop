"""Landing spotlights router — admin picks which sections show up as
the "Spotlight" cards on the public marketing landing page (`/login`).

Storage shape (single doc in `app_settings`, `_id="landing_spotlights"`):

    {
      "slots": ["<section_id> | None", ...],   # up to MAX_SLOTS entries
      "set_by": "<user_id>",
      "set_at": <utc datetime>,
    }

Older deployments may still have a doc shaped `{"left": ..., "right":
...}` from before slots became a list — `_read_slots` below upgrades
that shape transparently on read so existing curated picks keep
rendering after a deploy, with no manual migration step required.

Same admin model as the landing-demo picker: single-tenant per deploy,
caller can only point at sections they own.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db import db
from deps import User, require_admin

admin_router = APIRouter(
    prefix="/admin/landing-spotlights", tags=["landing-spotlights"]
)
public_router = APIRouter(
    prefix="/public/landing-spotlights", tags=["landing-spotlights"]
)

SETTINGS_KEY = "landing_spotlights"
MAX_SLOTS = 4


def _read_slots(doc: Optional[Dict[str, Any]]) -> List[Optional[str]]:
    """Normalise a stored settings doc into a slots list, upgrading the
    legacy {"left", "right"} shape transparently."""
    if not doc:
        return []
    if "slots" in doc:
        return list(doc["slots"])[:MAX_SLOTS]
    legacy = [doc.get("left"), doc.get("right")]
    # Drop trailing Nones so an all-empty legacy doc reads as [].
    while legacy and legacy[-1] is None:
        legacy.pop()
    return legacy


class LandingSpotlightsSetting(BaseModel):
    slots: List[Optional[str]] = []
    set_by: Optional[str] = None
    set_at: Optional[datetime] = None


class LandingSpotlightsUpdate(BaseModel):
    slots: List[Optional[str]] = []


class PublicSpotlightItem(BaseModel):
    section_id: str
    name: str
    type: str
    config: Dict[str, Any]


class PublicSpotlights(BaseModel):
    slots: List[Optional[PublicSpotlightItem]] = []


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


@admin_router.get("", response_model=LandingSpotlightsSetting)
async def get_landing_spotlights(_: User = Depends(require_admin)):
    doc = await db.app_settings.find_one({"_id": SETTINGS_KEY}, {"_id": 0})
    return LandingSpotlightsSetting(
        slots=_read_slots(doc),
        set_by=(doc or {}).get("set_by"),
        set_at=(doc or {}).get("set_at"),
    )


@admin_router.put("", response_model=LandingSpotlightsSetting)
async def set_landing_spotlights(
    payload: LandingSpotlightsUpdate,
    user: User = Depends(require_admin),
):
    slots = payload.slots[:MAX_SLOTS]
    for section_id in slots:
        await _validate_owned(section_id, user.user_id)

    now = datetime.now(timezone.utc)
    has_any = any(slots)
    setting = {
        "slots": slots,
        "set_by": user.user_id if has_any else None,
        "set_at": now if has_any else None,
    }
    await db.app_settings.update_one(
        {"_id": SETTINGS_KEY},
        {"$set": setting, "$unset": {"left": "", "right": ""}},
        upsert=True,
    )
    return LandingSpotlightsSetting(**setting)


async def _load_public_section(section_id: Optional[str]):
    if not section_id:
        return None
    doc = await db.sections.find_one(
        {"section_id": section_id},
        {"_id": 0, "section_id": 1, "name": 1, "type": 1, "config": 1},
    )
    if not doc:
        return None
    return PublicSpotlightItem(
        section_id=doc["section_id"],
        name=doc.get("name") or "",
        type=doc.get("type") or "",
        config=doc.get("config") or {},
    )


@public_router.get("", response_model=PublicSpotlights)
async def get_public_landing_spotlights():
    """Returns the currently-featured spotlight sections, in order. Any
    entry may be None (empty slot). Hit unauthenticated from the
    marketing landing page."""
    doc = await db.app_settings.find_one({"_id": SETTINGS_KEY}, {"_id": 0})
    slot_ids = _read_slots(doc)
    slots = [await _load_public_section(sid) for sid in slot_ids]
    return PublicSpotlights(slots=slots)
