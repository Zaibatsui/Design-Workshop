"""Collections router — user-scoped folders for sections + pages.

A 'collection' is a flat labelled bucket that an item (section or page)
can live in. Items can belong to at most one collection ("filed" model);
items with `collection_id = null` are "All items" / unfiled and still
appear in the main library lists.

Collection deletion cascades by NULLing `collection_id` on every owned
section + page that referenced it — items are never silently lost.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from db import db
from deps import User, get_current_user

router = APIRouter(prefix="/collections", tags=["collections"])

# Hard-cap the palette so the sidebar dots can't carry arbitrary colours
# (keeps the UI tidy and avoids "ugly grey" or "off-brand" picks). The
# values are the canonical chip colours; the frontend resolves them to
# Tailwind classes.
_ALLOWED_COLORS = {
    "slate",   # neutral default
    "red",
    "amber",
    "emerald",
    "sky",
    "indigo",
    "violet",
    "pink",
}


class CollectionIn(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    color: str = Field(default="slate")

    @field_validator("color")
    @classmethod
    def _color_in_palette(cls, v: str) -> str:
        if v not in _ALLOWED_COLORS:
            raise ValueError(
                f"Invalid color {v!r}. Allowed: {', '.join(sorted(_ALLOWED_COLORS))}"
            )
        return v

    @field_validator("name")
    @classmethod
    def _name_trimmed(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be blank")
        return v


class Collection(BaseModel):
    collection_id: str
    user_id: str
    name: str
    color: str
    created_at: datetime
    updated_at: datetime


class MoveItemRequest(BaseModel):
    """Body for moving an item into / out of a collection.

    `collection_id = null` explicitly unfiles the item. Omitting the
    field entirely is a 422 — clients must be deliberate about the move.
    """
    collection_id: Optional[str] = None


@router.get("", response_model=List[Collection])
async def list_collections(current_user: User = Depends(get_current_user)):
    cursor = db.collections.find(
        {"user_id": current_user.user_id}, {"_id": 0}
    ).sort([("name", 1)])
    return [Collection(**doc) async for doc in cursor]


@router.post("", response_model=Collection)
async def create_collection(
    payload: CollectionIn, current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    coll = {
        "collection_id": f"col_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "name": payload.name,
        "color": payload.color,
        "created_at": now,
        "updated_at": now,
    }
    await db.collections.insert_one(dict(coll))
    return Collection(**coll)


@router.put("/{collection_id}", response_model=Collection)
async def update_collection(
    collection_id: str,
    payload: CollectionIn,
    current_user: User = Depends(get_current_user),
):
    result = await db.collections.find_one_and_update(
        {"collection_id": collection_id, "user_id": current_user.user_id},
        {
            "$set": {
                "name": payload.name,
                "color": payload.color,
                "updated_at": datetime.now(timezone.utc),
            }
        },
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Collection not found")
    return Collection(**result)


@router.delete("/{collection_id}")
async def delete_collection(
    collection_id: str, current_user: User = Depends(get_current_user)
):
    """Delete a collection AND unfile every section/page that referenced it.

    Two `update_many` calls instead of a transaction — Mongo standalone
    instances don't support multi-doc transactions, and the worst case
    if one call fails is that the user has orphaned `collection_id`s
    pointing at a deleted collection. The frontend filter treats any
    unknown collection_id as "unfiled" so this is graceful.
    """
    result = await db.collections.delete_one(
        {"collection_id": collection_id, "user_id": current_user.user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")
    await db.sections.update_many(
        {"user_id": current_user.user_id, "collection_id": collection_id},
        {"$set": {"collection_id": None}},
    )
    await db.pages.update_many(
        {"user_id": current_user.user_id, "collection_id": collection_id},
        {"$set": {"collection_id": None}},
    )
    return {"ok": True}


async def _verify_collection_or_null(
    user_id: str, collection_id: Optional[str]
) -> None:
    """422 if `collection_id` is non-null and does not belong to user."""
    if collection_id is None:
        return
    exists = await db.collections.count_documents(
        {"collection_id": collection_id, "user_id": user_id}, limit=1
    )
    if not exists:
        raise HTTPException(
            status_code=422, detail="Collection not found or not owned by user"
        )


@router.put("/move/section/{section_id}")
async def move_section(
    section_id: str,
    payload: MoveItemRequest,
    current_user: User = Depends(get_current_user),
):
    await _verify_collection_or_null(current_user.user_id, payload.collection_id)
    result = await db.sections.update_one(
        {"section_id": section_id, "user_id": current_user.user_id},
        {
            "$set": {
                "collection_id": payload.collection_id,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"ok": True, "collection_id": payload.collection_id}


@router.put("/move/page/{page_id}")
async def move_page(
    page_id: str,
    payload: MoveItemRequest,
    current_user: User = Depends(get_current_user),
):
    await _verify_collection_or_null(current_user.user_id, payload.collection_id)
    result = await db.pages.update_one(
        {"page_id": page_id, "user_id": current_user.user_id},
        {
            "$set": {
                "collection_id": payload.collection_id,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"ok": True, "collection_id": payload.collection_id}
