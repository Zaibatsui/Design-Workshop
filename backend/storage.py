"""Object storage abstraction used by the upload router.

Two backends are supported, selected via env at startup:

  - "local"  → files live on the local filesystem under UPLOADS_DIR
               (a docker volume in the self-hosted production deploy).
  - "emergent" → files live in Emergent's hosted object store, accessed
               with the EMERGENT_LLM_KEY (used by the preview/dev env).

Backend selection:
  - If STORAGE_BACKEND env is set, it wins ("local" or "emergent").
  - Otherwise: fall back to "emergent" iff EMERGENT_LLM_KEY is set,
    else "local". This means a stock production .env (no EMERGENT_LLM_KEY)
    transparently uses local storage, while the preview keeps using
    Emergent without code changes.
"""
import logging
import mimetypes
import os
from pathlib import Path

import requests

logger = logging.getLogger(__name__)

APP_NAME = os.environ.get("APP_NAME", "modular-pages")

EXT_TO_MIME = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
    "svg": "image/svg+xml",
}


class StorageNotFoundError(LookupError):
    """Raised when get_object() can't find the requested path."""


# --------------------------------------------------------------------- #
# Backend selection                                                     #
# --------------------------------------------------------------------- #
_EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
_BACKEND = os.environ.get(
    "STORAGE_BACKEND",
    "emergent" if _EMERGENT_KEY else "local",
).lower()


# --------------------------------------------------------------------- #
# Local-filesystem backend                                              #
# --------------------------------------------------------------------- #
UPLOADS_DIR = Path(os.environ.get("UPLOADS_DIR", "/var/uploads")).resolve()


def _safe_local_path(path: str) -> Path:
    target = (UPLOADS_DIR / path).resolve()
    try:
        target.relative_to(UPLOADS_DIR)
    except ValueError as exc:
        raise StorageNotFoundError("invalid path") from exc
    return target


def _put_local(path: str, data: bytes, content_type: str) -> dict:
    target = _safe_local_path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return {"path": path, "size": len(data)}


def _get_local(path: str):
    target = _safe_local_path(path)
    if not target.is_file():
        raise StorageNotFoundError(path)
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else "bin"
    content_type = (
        EXT_TO_MIME.get(ext)
        or mimetypes.guess_type(target.name)[0]
        or "application/octet-stream"
    )
    return target.read_bytes(), content_type


# --------------------------------------------------------------------- #
# Emergent hosted-object-store backend                                  #
# --------------------------------------------------------------------- #
_EMERGENT_STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
_emergent_storage_key: "str | None" = None


def _emergent_init() -> str:
    global _emergent_storage_key
    if _emergent_storage_key:
        return _emergent_storage_key
    resp = requests.post(
        f"{_EMERGENT_STORAGE_URL}/init",
        json={"emergent_key": _EMERGENT_KEY},
        timeout=30,
    )
    resp.raise_for_status()
    _emergent_storage_key = resp.json()["storage_key"]
    return _emergent_storage_key


def _put_emergent(path: str, data: bytes, content_type: str) -> dict:
    key = _emergent_init()
    resp = requests.put(
        f"{_EMERGENT_STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def _get_emergent(path: str):
    key = _emergent_init()
    try:
        resp = requests.get(
            f"{_EMERGENT_STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60,
        )
        resp.raise_for_status()
    except requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else 500
        if status == 404:
            raise StorageNotFoundError(path) from e
        raise
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# --------------------------------------------------------------------- #
# Public API                                                            #
# --------------------------------------------------------------------- #
def init_storage() -> None:
    """Initialise the active backend. Idempotent — safe to call at startup."""
    if _BACKEND == "local":
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        logger.info("Storage backend: local (UPLOADS_DIR=%s)", UPLOADS_DIR)
    elif _BACKEND == "emergent":
        if not _EMERGENT_KEY:
            raise RuntimeError("STORAGE_BACKEND=emergent requires EMERGENT_LLM_KEY")
        _emergent_init()
        logger.info("Storage backend: emergent")
    else:
        raise RuntimeError(f"Unknown STORAGE_BACKEND: {_BACKEND!r}")


def put_object(path: str, data: bytes, content_type: str) -> dict:
    if _BACKEND == "local":
        return _put_local(path, data, content_type)
    return _put_emergent(path, data, content_type)


def get_object(path: str):
    if _BACKEND == "local":
        return _get_local(path)
    return _get_emergent(path)
