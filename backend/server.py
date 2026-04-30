from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import uuid
import requests
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Storage config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "modular-pages")

storage_key = None  # session-scoped

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def init_storage():
    """Init once, return cached storage_key."""
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(
        f"{STORAGE_URL}/init",
        json={"emergent_key": EMERGENT_KEY},
        timeout=30,
    )
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# App
app = FastAPI()
api_router = APIRouter(prefix="/api")

EXT_TO_MIME = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
    "svg": "image/svg+xml",
}


@app.on_event("startup")
async def _startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@api_router.get("/")
async def root():
    return {"message": "Modular Pages API"}


@api_router.post("/upload")
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
    # Public URL — used directly inside generated HTML snippets
    return {
        "path": result["path"],
        "url": f"/api/files/{result['path']}",
        "size": result.get("size", len(data)),
        "content_type": content_type,
    }


@api_router.get("/files/{path:path}")
async def download(path: str):
    """Public file proxy. No auth — these URLs are embedded in generated HTML
    snippets that get pasted into external CMSs and must work for any visitor."""
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


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
