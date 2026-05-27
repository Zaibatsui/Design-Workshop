"""Preview-override router — lets admins curate which library section
acts as the hover-preview thumbnail for any given section type.

Background
----------
The Design Workshop frontend shows a hover-preview thumbnail for each
section type in the picker, the User Guide and the public landing
page. By default the thumbnail is the section's `render(defaults())`
output. Admins sometimes want a richer / more representative preview
than the static defaults — for example a Hero that already has the
brand's hero copy + slides, or a Comparison Table seeded with the
actual competitor matrix.

Data shape
----------
We store a single global doc in `app_settings`:

    {
      "_id": "preview_overrides",
      "overrides": {
        "hero":             { "section_id": "sec_abc", "set_by": "...", "set_at": "..." },
        "comparison-table": { "section_id": "sec_def", "set_by": "...", "set_at": "..." }
      }
    }

Each override is keyed by `section_type` (e.g. "hero",
"comparison-table"), pointing at a library section the admin owns.
Setting an override for a section type that already has one simply
replaces it.

Endpoints
---------
- GET  /api/admin/preview-overrides       → full map + resolved snapshots (admin)
- PUT  /api/admin/preview-overrides/{section_type}
                                         → set/clear pointer for a type (admin)
- GET  /api/public/preview-overrides      → resolved `{type: {type, config}}`
                                            map, unauth (used by the public
                                            landing page).
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db import db
from deps import User, require_admin

admin_router = APIRouter(prefix="/admin/preview-overrides", tags=["preview-overrides"])
public_router = APIRouter(prefix="/public/preview-overrides", tags=["preview-overrides"])

SETTINGS_KEY = "preview_overrides"


class OverrideEntry(BaseModel):
    section_id: str
    set_by: Optional[str] = None
    set_at: Optional[datetime] = None


class OverrideUpdate(BaseModel):
    # null section_id clears the override for that section type.
    section_id: Optional[str] = None


class AdminOverrideRow(BaseModel):
    section_type: str
    section_id: str
    name: str
    set_at: Optional[datetime] = None
    set_by_email: Optional[str] = None


class PreviewSnapshot(BaseModel):
    """A resolved override entry — what the frontend popover needs to
    actually render the preview. Mirrors the public landing-demo
    snapshot shape so cross-origin callers can render without further
    lookups."""
    section_id: str
    type: str
    config: Dict[str, Any]


async def _load_overrides() -> Dict[str, Dict[str, Any]]:
    """Return the raw {section_type: {section_id, set_by, set_at}}
    map. Empty dict if nothing has been configured yet."""
    doc = await db.app_settings.find_one(
        {"_id": SETTINGS_KEY}, {"_id": 0, "overrides": 1}
    )
    return (doc or {}).get("overrides") or {}


# ──────────────────────────────────────────────────────────────────
# Public endpoint — unauth so the marketing landing page can render
# admin-curated previews on the SectionsShowcase tile grid.
# ──────────────────────────────────────────────────────────────────
@public_router.get("", response_model=Dict[str, PreviewSnapshot])
async def get_public_preview_overrides():
    overrides = await _load_overrides()
    if not overrides:
        return {}
    section_ids = [entry["section_id"] for entry in overrides.values() if entry.get("section_id")]
    if not section_ids:
        return {}
    cursor = db.sections.find(
        {"section_id": {"$in": section_ids}},
        {"_id": 0, "section_id": 1, "type": 1, "config": 1},
    )
    by_id = {doc["section_id"]: doc async for doc in cursor}
    # Stitch back into the section_type → snapshot map. Drop entries
    # whose underlying section was deleted (stale pointer) so the
    # frontend can quietly fall back to defaults().
    result: Dict[str, PreviewSnapshot] = {}
    for section_type, entry in overrides.items():
        snap = by_id.get(entry.get("section_id"))
        if not snap:
            continue
        result[section_type] = PreviewSnapshot(
            section_id=snap["section_id"],
            type=snap["type"],
            config=snap.get("config") or {},
        )
    return result


# ──────────────────────────────────────────────────────────────────
# Admin endpoints — list + flip.
# ──────────────────────────────────────────────────────────────────
@admin_router.get("", response_model=list[AdminOverrideRow])
async def list_overrides(_: User = Depends(require_admin)):
    """Admin-facing listing — includes section name + setter email so
    the admin UI can show 'Hero is set to "Brand homepage hero" by you'."""
    overrides = await _load_overrides()
    if not overrides:
        return []
    section_ids = [entry["section_id"] for entry in overrides.values() if entry.get("section_id")]
    setter_ids = list({entry.get("set_by") for entry in overrides.values() if entry.get("set_by")})

    cursor = db.sections.find(
        {"section_id": {"$in": section_ids}},
        {"_id": 0, "section_id": 1, "name": 1},
    )
    sections_by_id = {doc["section_id"]: doc async for doc in cursor}

    users_by_id: Dict[str, str] = {}
    if setter_ids:
        u_cursor = db.users.find(
            {"user_id": {"$in": setter_ids}}, {"_id": 0, "user_id": 1, "email": 1}
        )
        async for u in u_cursor:
            users_by_id[u["user_id"]] = u.get("email") or ""

    rows: list[AdminOverrideRow] = []
    for section_type, entry in overrides.items():
        s = sections_by_id.get(entry.get("section_id"))
        if not s:
            # Stale pointer — surface to admin so they know it's broken.
            rows.append(
                AdminOverrideRow(
                    section_type=section_type,
                    section_id=entry.get("section_id") or "",
                    name="(section deleted)",
                    set_at=entry.get("set_at"),
                    set_by_email=users_by_id.get(entry.get("set_by") or ""),
                )
            )
            continue
        rows.append(
            AdminOverrideRow(
                section_type=section_type,
                section_id=s["section_id"],
                name=s.get("name") or "Untitled",
                set_at=entry.get("set_at"),
                set_by_email=users_by_id.get(entry.get("set_by") or ""),
            )
        )
    return rows


@admin_router.put("/{section_type}", response_model=Optional[OverrideEntry])
async def set_override(
    section_type: str,
    payload: OverrideUpdate,
    user: User = Depends(require_admin),
):
    """Set or clear the preview override for one section type.

    - `section_id=null` → clears the override.
    - `section_id="sec_..."` → sets it. The referenced section must
      exist AND its `type` must match `section_type` (admins can't
      use a Hero section as the preview for a Comparison Table).
    """
    overrides = await _load_overrides()

    if payload.section_id is None:
        if section_type in overrides:
            del overrides[section_type]
        await db.app_settings.update_one(
            {"_id": SETTINGS_KEY},
            {"$set": {"overrides": overrides}},
            upsert=True,
        )
        return None

    src = await db.sections.find_one(
        {"section_id": payload.section_id},
        {"_id": 0, "section_id": 1, "type": 1},
    )
    if not src:
        raise HTTPException(status_code=404, detail="Section not found")
    if src["type"] != section_type:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Section type mismatch: '{section_type}' expected, "
                f"got '{src['type']}' from the referenced section"
            ),
        )

    now = datetime.now(timezone.utc)
    overrides[section_type] = {
        "section_id": payload.section_id,
        "set_by": user.user_id,
        "set_at": now,
    }
    await db.app_settings.update_one(
        {"_id": SETTINGS_KEY},
        {"$set": {"overrides": overrides}},
        upsert=True,
    )
    return OverrideEntry(**overrides[section_type])
