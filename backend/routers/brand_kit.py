"""Brand Kit router — per-user color palette and font choices.

The brand kit is a single document per user, stored as a subdocument on the
user record under `brand_kit`. New sections inherit colors + fonts from this
kit at creation time (frontend overlay; the backend just persists raw
preferences).
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from db import db
from deps import User, get_current_user

router = APIRouter(prefix="/brand-kit", tags=["brand-kit"])


class BrandKit(BaseModel):
    primary_color: str = Field(default="#E01839")
    secondary_color: str = Field(default="#1f2937")
    text_color: str = Field(default="#1f2937")
    background_color: str = Field(default="#ffffff")
    heading_font: str = Field(default="Poppins")
    body_font: str = Field(default="Poppins")


DEFAULT_KIT = BrandKit().model_dump()


@router.get("", response_model=BrandKit)
async def get_brand_kit(user: User = Depends(get_current_user)):
    doc = await db.users.find_one(
        {"user_id": user.user_id}, {"_id": 0, "brand_kit": 1}
    )
    kit = (doc or {}).get("brand_kit") or {}
    try:
        return BrandKit(**{**DEFAULT_KIT, **kit})
    except Exception:
        # Stored doc is malformed (legacy/null fields) — fall back to defaults
        # rather than 500ing the whole settings page.
        return BrandKit(**DEFAULT_KIT)


@router.put("", response_model=BrandKit)
async def update_brand_kit(
    payload: BrandKit, user: User = Depends(get_current_user)
):
    kit = payload.model_dump()
    await db.users.update_one(
        {"user_id": user.user_id}, {"$set": {"brand_kit": kit}}
    )
    return BrandKit(**kit)
