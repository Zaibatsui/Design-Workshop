"""Pages router — CRUD + duplicate + reorder.

A 'page' is an ordered list of blocks. Each block is either:
  - { block_id, name?, type: "section", section_type, config }
  - { block_id, name?, type: "richtext", config: { html, mode, ... } }

Richtext HTML is persisted verbatim — users can embed arbitrary tags
(including <script>, <iframe>, inline event handlers). The snippet is
rendered inside a sandboxed iframe in the editor preview, and the user
is fully responsible for whatever lands in the exported HTML that gets
pasted into their own CMS.
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator
from pymongo import UpdateOne

from db import db
from deps import User, get_current_user

router = APIRouter(prefix="/pages", tags=["pages"])

_VALID_BLOCK_TYPES = {"section", "richtext"}


class BlockIn(BaseModel):
    block_id: Optional[str] = None
    name: Optional[str] = None
    type: str
    section_type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

    @field_validator("type")
    @classmethod
    def _type_known(cls, v: str) -> str:
        if v not in _VALID_BLOCK_TYPES:
            raise ValueError(
                f"Invalid block type {v!r}. Allowed: "
                + ", ".join(sorted(_VALID_BLOCK_TYPES))
            )
        return v

    @model_validator(mode="after")
    def _cross_field(self):
        if self.type == "section" and not self.section_type:
            raise ValueError("section blocks require a section_type")
        if self.type == "richtext" and self.section_type is not None:
            raise ValueError("richtext blocks must not set section_type")
        return self


class PageIn(BaseModel):
    name: str = Field(default="Untitled page")
    blocks: List[BlockIn] = Field(default_factory=list)


class PageUpdate(BaseModel):
    name: Optional[str] = None
    blocks: Optional[List[BlockIn]] = None


class Page(BaseModel):
    page_id: str
    user_id: str
    name: str
    blocks: List[Dict[str, Any]]
    position: int = 0
    # Optional folder this page is filed under. Null = "unfiled".
    collection_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ReorderRequest(BaseModel):
    page_ids: List[str]


def _normalize_blocks(blocks: List[BlockIn]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for b in blocks:
        cfg = dict(b.config or {})
        out.append({
            "block_id": b.block_id or f"blk_{uuid.uuid4().hex[:10]}",
            "name": b.name,
            "type": b.type,
            "section_type": b.section_type,
            "config": cfg,
        })
    return out


async def _next_head_position(user_id: str) -> int:
    top = await db.pages.find_one(
        {"user_id": user_id}, sort=[("position", 1)], projection={"position": 1, "_id": 0}
    )
    if top and isinstance(top.get("position"), int):
        return top["position"] - 1
    return 0


def _coerce_page(doc: Dict[str, Any]) -> Page:
    doc.setdefault("position", 0)
    doc.setdefault("collection_id", None)
    return Page(**doc)


@router.get("", response_model=List[Page])
async def list_pages(current_user: User = Depends(get_current_user)):
    cursor = db.pages.find(
        {"user_id": current_user.user_id}, {"_id": 0}
    ).sort([("position", 1), ("updated_at", -1)])
    return [_coerce_page(doc) async for doc in cursor]


@router.post("", response_model=Page)
async def create_page(
    payload: PageIn, current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    page = {
        "page_id": f"pg_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "name": payload.name,
        "blocks": _normalize_blocks(payload.blocks),
        "position": await _next_head_position(current_user.user_id),
        "created_at": now,
        "updated_at": now,
    }
    await db.pages.insert_one(dict(page))
    return Page(**page)


@router.get("/{page_id}", response_model=Page)
async def get_page(
    page_id: str, current_user: User = Depends(get_current_user)
):
    doc = await db.pages.find_one(
        {"page_id": page_id, "user_id": current_user.user_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    return _coerce_page(doc)


@router.put("/{page_id}", response_model=Page)
async def update_page(
    page_id: str,
    payload: PageUpdate,
    current_user: User = Depends(get_current_user),
):
    update: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if payload.name is not None:
        update["name"] = payload.name
    if payload.blocks is not None:
        update["blocks"] = _normalize_blocks(payload.blocks)
    result = await db.pages.find_one_and_update(
        {"page_id": page_id, "user_id": current_user.user_id},
        {"$set": update},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Page not found")
    return _coerce_page(result)


@router.delete("/{page_id}")
async def delete_page(
    page_id: str, current_user: User = Depends(get_current_user)
):
    result = await db.pages.delete_one(
        {"page_id": page_id, "user_id": current_user.user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"ok": True}


@router.post("/{page_id}/duplicate", response_model=Page)
async def duplicate_page(
    page_id: str, current_user: User = Depends(get_current_user)
):
    """Deep-copy a page + all its blocks into a new document.

    Each block gets a fresh block_id so per-instance UIDs in the rendered
    snippet don't collide with the source page's blocks.
    """
    src = await db.pages.find_one(
        {"page_id": page_id, "user_id": current_user.user_id}, {"_id": 0}
    )
    if not src:
        raise HTTPException(status_code=404, detail="Page not found")
    now = datetime.now(timezone.utc)
    cloned_blocks = []
    for b in (src.get("blocks") or []):
        nb = dict(b)
        nb["block_id"] = f"blk_{uuid.uuid4().hex[:10]}"
        cloned_blocks.append(nb)
    new = {
        "page_id": f"pg_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "name": f"Copy of {src.get('name', 'page')}",
        "blocks": cloned_blocks,
        "position": await _next_head_position(current_user.user_id),
        "created_at": now,
        "updated_at": now,
    }
    await db.pages.insert_one(dict(new))
    return Page(**new)


@router.put("/reorder/bulk", response_model=List[Page])
async def reorder_pages(
    payload: ReorderRequest, current_user: User = Depends(get_current_user)
):
    """Renumber page positions 0..N-1 in one bulk_write round-trip."""
    ops = [
        UpdateOne(
            {"page_id": pid, "user_id": current_user.user_id},
            {"$set": {"position": idx}},
        )
        for idx, pid in enumerate(payload.page_ids)
    ]
    if ops:
        await db.pages.bulk_write(ops, ordered=False)
    return await list_pages(current_user)  # type: ignore[arg-type]
