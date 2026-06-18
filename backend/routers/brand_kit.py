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
    body_color: str = Field(default="#64748b")
    background_color: str = Field(default="#ffffff")
    heading_font: str = Field(default="Poppins")
    body_font: str = Field(default="Poppins")
    # Eyebrow defaults — applied to new sections that expose an eyebrow
    # field. Blank = fall back (color → primary_color, text → empty).
    eyebrow_text: str = Field(default="")
    eyebrow_color: str = Field(default="")
    # Specific role colours. All blank by default — when blank the
    # frontend falls back to `primary_color`. Saved kits that pre-date
    # these fields therefore behave identically to before.
    link_color: str = Field(default="")     # links + small inline tag pills
    button_color: str = Field(default="")   # CTA button backgrounds
    accent_color: str = Field(default="")   # active tab, step circle, star, chevron, heading accent
    # Two logo slots so the same kit works on light AND dark sections —
    # Welcome's dark overlay needs a logo that reads on dark backgrounds,
    # while a Hero with a light background wants the inverse. Either may
    # be blank.
    logo_dark: str = Field(default="")   # logo that reads on DARK bg
    logo_light: str = Field(default="")  # logo that reads on LIGHT bg
    # Global button corner radius — drives every CTA / .ns-btn across
    # every section. 0 = sharp, 9999 = full pill. Kept as a number (not
    # a string) so the frontend can drag a slider without round-trip
    # conversion. Saved kits from before this field default to 8 px so
    # behaviour stays consistent with the previous hardcoded value.
    button_radius: int = Field(default=8, ge=0, le=9999)
    # Global title line-height applied to .ns-title across Hero and
    # Split Banner. Defaults to 1.2 — the value most users land on
    # after tweaking in DevTools. Stored as a float so the slider can
    # do fine-grained 0.05 steps (1.0 → 1.6 covers tight display
    # headlines through editorial layouts). Saved kits from before
    # this field default to 1.2 so behaviour is byte-identical.
    title_line_height: float = Field(default=1.2, ge=0.8, le=2.0)
    # Title letter-spacing (tracking) applied to .ns-title across Hero
    # and Split Banner. Stored as em (negative tightens, positive
    # loosens). -0.02 matches the previous hardcoded value.
    title_letter_spacing: float = Field(default=-0.02, ge=-0.05, le=0.05)
    # Global card corner radius (px) for sections that render product /
    # content / testimonial cards (products, productGrid, resources,
    # insights, feature-grid, testimonials). 8 is the safest default —
    # it lands between the previous 6px / 8px / 12px scattered values.
    card_radius: int = Field(default=8, ge=0, le=32)
    # Three preset section spacing scales: compact (40px),
    # default (existing per-section values), spacious (96px). Stored
    # as a string so it can extend later without a schema migration.
    section_spacing: str = Field(
        default="default", pattern="^(compact|default|spacious)$"
    )
    # Body copy font-weight. 400 is the previous hardcoded value.
    # Some chunkier brand body fonts (Manrope, Plus Jakarta) read
    # better at 500. Capped 300-700 so a malformed value can't
    # break a snippet.
    body_weight: int = Field(default=400, ge=300, le=700)
    # Eyebrow style defaults. The previous hardcoded values are
    # `text-transform: uppercase` + `letter-spacing: 0.18em`.
    eyebrow_uppercase: bool = Field(default=True)
    eyebrow_letter_spacing: float = Field(default=0.18, ge=0, le=0.3)
    # Default CTA microcopy stamped into NEW sections' empty CTA text
    # fields at section-creation time. Existing sections are not
    # touched. Empty string disables the feature (back-compat).
    default_cta_text: str = Field(default="")


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
