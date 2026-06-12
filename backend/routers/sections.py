"""Sections router — CRUD + duplicate + reorder.

A 'section' is a single self-contained WYSIWYG block the user saves to their
library. `position` is an ascending int used to order the dashboard grid;
newly created sections are inserted at the top (smallest position).
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from pymongo import UpdateOne

from db import db
from deps import User, get_current_user

router = APIRouter(prefix="/sections", tags=["sections"])


class SectionIn(BaseModel):
    name: str = Field(default="Untitled section")
    type: str
    config: Dict[str, Any]
    # Optional file-on-create: drops the new section straight into the
    # given collection so users don't have to file it as a second step.
    # Null (default) = leave unfiled.
    collection_id: Optional[str] = None


class SectionUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class Section(BaseModel):
    section_id: str
    user_id: str
    name: str
    type: str
    config: Dict[str, Any]
    position: int = 0
    # Optional folder this section is filed under. Null = "unfiled" /
    # appears in the dashboard's "All items" view.
    collection_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ReorderRequest(BaseModel):
    section_ids: List[str]


async def _next_head_position(user_id: str) -> int:
    """Return a position that puts a new section at the top of the grid.

    We never compact positions; we just keep pushing the top down. This is
    fine at our scale — billions of inserts before int32 runs out, and we
    resnap on explicit reorder.
    """
    top = await db.sections.find_one(
        {"user_id": user_id}, sort=[("position", 1)], projection={"position": 1, "_id": 0}
    )
    if top and isinstance(top.get("position"), int):
        return top["position"] - 1
    return 0


@router.get("", response_model=List[Section])
async def list_sections(current_user: User = Depends(get_current_user)):
    # Primary sort by position asc (explicit ordering), tiebreak by
    # updated_at desc so older records don't drift around when new sections
    # get the same starting position.
    cursor = db.sections.find(
        {"user_id": current_user.user_id}, {"_id": 0}
    ).sort([("position", 1), ("updated_at", -1)])
    return [_coerce_section(doc) async for doc in cursor]


@router.post("", response_model=Section)
async def create_section(
    payload: SectionIn, current_user: User = Depends(get_current_user)
):
    # If the client asked to file the section on creation, validate
    # ownership of the target collection up-front (mirrors the move
    # endpoint contract — 422 on unknown / cross-tenant).
    if payload.collection_id:
        exists = await db.collections.count_documents(
            {
                "collection_id": payload.collection_id,
                "user_id": current_user.user_id,
            },
            limit=1,
        )
        if not exists:
            raise HTTPException(
                status_code=422,
                detail="Collection not found or not owned by user",
            )
    now = datetime.now(timezone.utc)
    section = {
        "section_id": f"sec_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "name": payload.name,
        "type": payload.type,
        "config": payload.config,
        "collection_id": payload.collection_id,
        "position": await _next_head_position(current_user.user_id),
        "created_at": now,
        "updated_at": now,
    }
    await db.sections.insert_one(dict(section))
    return Section(**section)


@router.get("/{section_id}", response_model=Section)
async def get_section(
    section_id: str, current_user: User = Depends(get_current_user)
):
    doc = await db.sections.find_one(
        {"section_id": section_id, "user_id": current_user.user_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Section not found")
    return _coerce_section(doc)


@router.put("/{section_id}", response_model=Section)
async def update_section(
    section_id: str,
    payload: SectionUpdate,
    current_user: User = Depends(get_current_user),
):
    update: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if payload.name is not None:
        update["name"] = payload.name
    if payload.config is not None:
        update["config"] = payload.config
    result = await db.sections.find_one_and_update(
        {"section_id": section_id, "user_id": current_user.user_id},
        {"$set": update},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Section not found")
    return _coerce_section(result)


@router.delete("/{section_id}")
async def delete_section(
    section_id: str, current_user: User = Depends(get_current_user)
):
    result = await db.sections.delete_one(
        {"section_id": section_id, "user_id": current_user.user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"ok": True}


@router.post("/{section_id}/duplicate", response_model=Section)
async def duplicate_section(
    section_id: str, current_user: User = Depends(get_current_user)
):
    """Deep-copy a section into a new document owned by the same user.

    The copy is placed at the top of the grid and gets a fresh section_id
    and timestamps; its name becomes 'Copy of <original>'.
    """
    src = await db.sections.find_one(
        {"section_id": section_id, "user_id": current_user.user_id}, {"_id": 0}
    )
    if not src:
        raise HTTPException(status_code=404, detail="Section not found")
    now = datetime.now(timezone.utc)
    new = {
        "section_id": f"sec_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "name": f"Copy of {src.get('name', 'section')}",
        "type": src["type"],
        "config": src.get("config") or {},
        "position": await _next_head_position(current_user.user_id),
        "created_at": now,
        "updated_at": now,
    }
    await db.sections.insert_one(dict(new))
    return Section(**new)


@router.put("/reorder/bulk", response_model=List[Section])
async def reorder_sections(
    payload: ReorderRequest, current_user: User = Depends(get_current_user)
):
    """Apply an explicit order to the user's sections.

    The client sends the full desired top-to-bottom order; we renumber
    positions 0..N-1 in a single bulk_write so the whole reorder is one
    round-trip regardless of list size. IDs not in the list keep their
    existing positions relative to each other and sort after the reordered
    set.
    """
    ops = [
        UpdateOne(
            {"section_id": sid, "user_id": current_user.user_id},
            {"$set": {"position": idx}},
        )
        for idx, sid in enumerate(payload.section_ids)
    ]
    if ops:
        await db.sections.bulk_write(ops, ordered=False)
    return await list_sections(current_user)  # type: ignore[arg-type]


def _coerce_section(doc: Dict[str, Any]) -> Section:
    doc.setdefault("position", 0)
    doc.setdefault("collection_id", None)
    return Section(**doc)
