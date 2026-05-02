"""Landing demo router — picks which page is featured on the public
marketing landing page (`/login`).

The setting is a single global doc in the `app_settings` collection
(key `_id="landing_demo"`). The current admin model is "anyone signed
in can flip it" — there's only one tenant per deployment of Design
Workshop, so this is intentional. If multi-tenancy ever lands, swap
the storage to be per-account.

Endpoints:
- GET  /api/admin/landing-demo       → current pointer (auth)
- PUT  /api/admin/landing-demo       → set/clear pointer (auth)
- GET  /api/public/landing-demo      → composed blocks of the featured
                                        page, no auth, used by the public
                                        login page's LiveDemo iframe.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db import db
from deps import User, require_admin

admin_router = APIRouter(prefix="/admin/landing-demo", tags=["landing-demo"])
public_router = APIRouter(prefix="/public/landing-demo", tags=["landing-demo"])

SETTINGS_KEY = "landing_demo"


class LandingDemoSetting(BaseModel):
    page_id: Optional[str] = None
    set_by: Optional[str] = None
    set_at: Optional[datetime] = None


class LandingDemoUpdate(BaseModel):
    page_id: Optional[str] = None  # null clears the pointer


class PublicLandingDemo(BaseModel):
    page_id: str
    name: str
    blocks: List[Dict[str, Any]]


@admin_router.get("", response_model=LandingDemoSetting)
async def get_landing_demo(_: User = Depends(require_admin)):
    doc = await db.app_settings.find_one(
        {"_id": SETTINGS_KEY}, {"_id": 0}
    )
    return LandingDemoSetting(**(doc or {}))


@admin_router.put("", response_model=LandingDemoSetting)
async def set_landing_demo(
    payload: LandingDemoUpdate,
    user: User = Depends(require_admin),
):
    # Validate the page exists and belongs to the caller. We only accept
    # pages the caller owns so an attacker can't expose someone else's
    # private page on the public landing page.
    if payload.page_id:
        page_doc = await db.pages.find_one(
            {"page_id": payload.page_id, "user_id": user.user_id},
            {"_id": 0, "page_id": 1},
        )
        if not page_doc:
            raise HTTPException(
                status_code=404,
                detail="Page not found in your library",
            )

    now = datetime.now(timezone.utc)
    setting = {
        "page_id": payload.page_id,
        "set_by": user.user_id if payload.page_id else None,
        "set_at": now if payload.page_id else None,
    }
    await db.app_settings.update_one(
        {"_id": SETTINGS_KEY},
        {"$set": setting},
        upsert=True,
    )
    return LandingDemoSetting(**setting)


@public_router.get("", response_model=Optional[PublicLandingDemo])
async def get_public_landing_demo():
    """Returns the currently-featured page's blocks, or null if nothing
    is featured (or the featured page was deleted). Designed to be hit
    unauthenticated from the marketing landing page."""
    setting = await db.app_settings.find_one(
        {"_id": SETTINGS_KEY}, {"_id": 0, "page_id": 1}
    )
    page_id = (setting or {}).get("page_id")
    if not page_id:
        return None
    page = await db.pages.find_one(
        {"page_id": page_id},
        {"_id": 0, "page_id": 1, "name": 1, "blocks": 1},
    )
    if not page:
        return None
    return PublicLandingDemo(
        page_id=page["page_id"],
        name=page["name"],
        blocks=page.get("blocks") or [],
    )
