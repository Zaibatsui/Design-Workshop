"""Image library router — per-user reusable image collection.

A user adds images (either by uploading via /api/upload first then
registering the resulting URL, or by pasting an external URL) into
their library so they can pick from it inside ImageUpload fields
without re-uploading.

Soft cap: above LIBRARY_SOFT_CAP entries the API still accepts new
additions but flags `over_cap=True` in the response so the frontend
can prompt the user to delete older entries.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, HttpUrl, ValidationError

from db import db
from deps import User, get_current_user

router = APIRouter(prefix="/image-library", tags=["image-library"])

LIBRARY_SOFT_CAP = 100


class ImageEntry(BaseModel):
    image_id: str
    user_id: str
    url: str
    name: str
    source: Literal["upload", "url"]
    created_at: datetime


class ImageCreate(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048)
    name: str = Field(default="", max_length=120)
    source: Literal["upload", "url"] = "url"


class ImageUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)


class ImageLibraryResponse(BaseModel):
    images: List[ImageEntry]
    count: int
    soft_cap: int
    over_cap: bool


def _validate_url(raw: str) -> str:
    """Reject obvious garbage (javascript:, data:, etc) while still
    allowing both absolute https URLs and our backend's relative
    `/uploads/...` paths that the upload route returns."""
    s = (raw or "").strip()
    if not s:
        raise HTTPException(status_code=422, detail="URL is required")
    lower = s.lower()
    if lower.startswith(("javascript:", "vbscript:", "data:text/html")):
        raise HTTPException(status_code=422, detail="Unsafe URL scheme")
    if s.startswith("/"):
        return s  # backend-served upload path
    try:
        HttpUrl(s)
        return s
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail="Invalid URL") from exc


@router.get("", response_model=ImageLibraryResponse)
async def list_images(user: User = Depends(get_current_user)):
    cursor = db.image_library.find(
        {"user_id": user.user_id}, {"_id": 0}
    ).sort("created_at", -1)
    items = [ImageEntry(**doc) async for doc in cursor]
    return ImageLibraryResponse(
        images=items,
        count=len(items),
        soft_cap=LIBRARY_SOFT_CAP,
        over_cap=len(items) > LIBRARY_SOFT_CAP,
    )


@router.post("", response_model=ImageLibraryResponse)
async def add_image(
    payload: ImageCreate, user: User = Depends(get_current_user)
):
    url = _validate_url(payload.url)
    name = (payload.name or "").strip() or url.rsplit("/", 1)[-1] or "Untitled"
    entry = {
        "image_id": uuid.uuid4().hex,
        "user_id": user.user_id,
        "url": url,
        "name": name,
        "source": payload.source,
        "created_at": datetime.now(timezone.utc),
    }
    # De-dupe — if this exact URL is already in this user's library, just
    # bump it to the top by updating created_at instead of inserting.
    existing = await db.image_library.find_one(
        {"user_id": user.user_id, "url": url}, {"_id": 0, "image_id": 1}
    )
    if existing:
        await db.image_library.update_one(
            {"image_id": existing["image_id"]},
            {"$set": {"created_at": entry["created_at"], "name": name}},
        )
    else:
        await db.image_library.insert_one(dict(entry))
    return await list_images(user)


@router.patch("/{image_id}", response_model=ImageEntry)
async def rename_image(
    image_id: str,
    payload: ImageUpdate,
    user: User = Depends(get_current_user),
):
    res = await db.image_library.find_one_and_update(
        {"image_id": image_id, "user_id": user.user_id},
        {"$set": {"name": payload.name.strip()}},
        return_document=True,
        projection={"_id": 0},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Image not found")
    return ImageEntry(**res)


@router.delete("/{image_id}")
async def delete_image(
    image_id: str, user: User = Depends(get_current_user)
):
    result = await db.image_library.delete_one(
        {"image_id": image_id, "user_id": user.user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"ok": True}
