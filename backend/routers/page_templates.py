"""Page templates router — user-scoped custom templates saved from existing pages.

Each template is a snapshot of a page's blocks + a name + optional description.
Templates are owned by the user that created them; they only surface in that
user's "New page" picker.
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from db import db
from deps import User, get_current_user
from routers.pages import BlockIn

router = APIRouter(prefix="/page-templates", tags=["page-templates"])


class TemplateIn(BaseModel):
    name: str = Field(default="Untitled template")
    description: Optional[str] = None
    # Blocks are validated via the same BlockIn model used by /api/pages so
    # saving a bad template (type='banana', section without section_type, …)
    # is rejected with 422 at the edge instead of polluting the template
    # catalogue with invalid snapshots.
    blocks: List[BlockIn] = Field(default_factory=list)


class PageTemplate(BaseModel):
    template_id: str
    user_id: str
    name: str
    description: Optional[str] = None
    blocks: List[Dict[str, Any]]
    created_at: datetime


def _strip_block_ids(blocks) -> List[Dict[str, Any]]:
    """Drop per-instance block_ids from a template snapshot — new pages will
    mint fresh ones when the template is materialized. Accepts either raw
    dicts or BlockIn instances (dumped via model_dump)."""
    out = []
    for b in blocks or []:
        src = b.model_dump() if hasattr(b, "model_dump") else dict(b)
        nb = {k: v for k, v in src.items() if k != "block_id"}
        out.append(nb)
    return out


@router.get("", response_model=List[PageTemplate])
async def list_templates(current_user: User = Depends(get_current_user)):
    cursor = db.page_templates.find(
        {"user_id": current_user.user_id}, {"_id": 0}
    ).sort("created_at", -1)
    return [PageTemplate(**doc) async for doc in cursor]


@router.post("", response_model=PageTemplate)
async def create_template(
    payload: TemplateIn, current_user: User = Depends(get_current_user)
):
    doc = {
        "template_id": f"tpl_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "name": payload.name,
        "description": payload.description,
        "blocks": _strip_block_ids(payload.blocks),
        "created_at": datetime.now(timezone.utc),
    }
    await db.page_templates.insert_one(dict(doc))
    return PageTemplate(**doc)


@router.delete("/{template_id}")
async def delete_template(
    template_id: str, current_user: User = Depends(get_current_user)
):
    result = await db.page_templates.delete_one(
        {"template_id": template_id, "user_id": current_user.user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"ok": True}
