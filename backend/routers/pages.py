"""Pages router — CRUD + duplicate + reorder.

A 'page' is an ordered list of blocks. Each block is either:
  - { type: "section", section_type, config }
  - { type: "richtext", config: { html, ... } }

Richtext HTML is server-sanitized via bleach so the editor can never persist
event handlers, <script> tags, javascript: URLs etc. — defense in depth.
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import bleach
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from pymongo import UpdateOne

from db import db
from deps import User, get_current_user

router = APIRouter(prefix="/pages", tags=["pages"])


# Matches what the tiptap editor in /app/frontend/src/components/RichTextEditor.jsx
# can produce. Anything not in these sets gets stripped by bleach.
_ALLOWED_TAGS = {
    "h1", "h2", "h3", "p", "br",
    "strong", "em", "b", "i", "u",
    "ul", "ol", "li",
    "a", "span",
}
_ALLOWED_ATTRS = {
    "a": ["href", "title", "target", "rel"],
    "span": [],
}
_ALLOWED_PROTOCOLS = ["http", "https", "mailto"]


def _sanitize_richtext(html: str) -> str:
    if not isinstance(html, str):
        return ""
    # strip=True removes disallowed tags entirely (not just escape them).
    return bleach.clean(
        html,
        tags=list(_ALLOWED_TAGS),
        attributes=_ALLOWED_ATTRS,
        protocols=_ALLOWED_PROTOCOLS,
        strip=True,
        strip_comments=True,
    )


class BlockIn(BaseModel):
    block_id: Optional[str] = None
    type: str  # "section" | "richtext"
    section_type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


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
    created_at: datetime
    updated_at: datetime


class ReorderRequest(BaseModel):
    page_ids: List[str]


def _normalize_blocks(blocks: List[BlockIn]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for b in blocks:
        cfg = dict(b.config or {})
        # Sanitize richtext HTML at persistence time — cheap and prevents
        # bad input from round-tripping into the exported snippet.
        if b.type == "richtext" and "html" in cfg:
            cfg["html"] = _sanitize_richtext(cfg["html"] or "")
        out.append({
            "block_id": b.block_id or f"blk_{uuid.uuid4().hex[:10]}",
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
        # blocks are already sanitized in the source, but re-sanitize to be
        # safe in case future migrations change the allowed tag set.
        cfg = dict(nb.get("config") or {})
        if nb.get("type") == "richtext" and "html" in cfg:
            cfg["html"] = _sanitize_richtext(cfg["html"] or "")
        nb["config"] = cfg
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
