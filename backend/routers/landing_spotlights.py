"""Landing spotlights router — admin picks which two of their saved
sections show up as the "Spotlight" cards on the public marketing
landing page (`/login`).

Storage shape (single doc in `app_settings`, `_id="landing_spotlights"`):

    {
      "left":  "<section_id> | None",
      "right": "<section_id> | None",
      "set_by": "<user_id>",
      "set_at": <utc datetime>,
    }

Same admin model as the landing-demo picker: single-tenant per deploy,
caller can only point at sections they own. Endpoints intentionally
mirror landing_demo.py for symmetry.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional

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


class LandingSpotlightsSetting(BaseModel):
    left: Optional[str] = None
    right: Optional[str] = None
    set_by: Optional[str] = None
    set_at: Optional[datetime] = None


class LandingSpotlightsUpdate(BaseModel):
    left: Optional[str] = None
    right: Optional[str] = None


class PublicSpotlightItem(BaseModel):
    section_id: str
    name: str
    type: str
    config: Dict[str, Any]


class PublicSpotlights(BaseModel):
    left: Optional[PublicSpotlightItem] = None
    right: Optional[PublicSpotlightItem] = None


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
    doc = await db.app_settings.find_one(
        {"_id": SETTINGS_KEY}, {"_id": 0}
    )
    return LandingSpotlightsSetting(**(doc or {}))


@admin_router.put("", response_model=LandingSpotlightsSetting)
async def set_landing_spotlights(
    payload: LandingSpotlightsUpdate,
    user: User = Depends(require_admin),
):
    await _validate_owned(payload.left, user.user_id)
    await _validate_owned(payload.right, user.user_id)

    now = datetime.now(timezone.utc)
    setting = {
        "left": payload.left,
        "right": payload.right,
        "set_by": user.user_id if (payload.left or payload.right) else None,
        "set_at": now if (payload.left or payload.right) else None,
    }
    await db.app_settings.update_one(
        {"_id": SETTINGS_KEY},
        {"$set": setting},
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
    """Returns the currently-featured spotlight sections (left + right),
    either or both may be None. Hit unauthenticated from the marketing
    landing page."""
    setting = await db.app_settings.find_one(
        {"_id": SETTINGS_KEY}, {"_id": 0, "left": 1, "right": 1}
    ) or {}
    left = await _load_public_section(setting.get("left"))
    right = await _load_public_section(setting.get("right"))
    return PublicSpotlights(left=left, right=right)
