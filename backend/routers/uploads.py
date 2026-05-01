"""File upload + public file proxy via Emergent object storage."""
import logging
import uuid

from fastapi import APIRouter, File, HTTPException, Response, UploadFile

import requests

from storage import APP_NAME, get_object, put_object

logger = logging.getLogger(__name__)
router = APIRouter(tags=["uploads"])

EXT_TO_MIME = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
    "svg": "image/svg+xml",
}


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="filename required")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    if ext not in EXT_TO_MIME:
        raise HTTPException(status_code=400, detail=f"unsupported file type: {ext}")
    content_type = file.content_type or EXT_TO_MIME[ext]
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="max 10MB")
    storage_path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(storage_path, data, content_type)
    except Exception as e:
        logger.exception("upload failed")
        raise HTTPException(status_code=500, detail=f"upload failed: {e}")
    return {
        "path": result["path"],
        "url": f"/api/files/{result['path']}",
        "size": result.get("size", len(data)),
        "content_type": content_type,
    }


@router.get("/files/{path:path}")
async def download(path: str):
    """Public file proxy — no auth; URLs are embedded in generated HTML
    snippets pasted into external CMSs and must work for any visitor."""
    try:
        data, content_type = get_object(path)
    except requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else 500
        if status == 404:
            raise HTTPException(status_code=404, detail="file not found")
        raise HTTPException(status_code=status, detail="storage error")
    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
