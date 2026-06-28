"""Object storage abstraction used by the upload router.

Files live on the local filesystem under UPLOADS_DIR
(a Docker volume in the self-hosted production deploy).
"""
import logging
import mimetypes
import os
from pathlib import Path

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
# Public API                                                            #
# --------------------------------------------------------------------- #
def init_storage() -> None:
    """Initialise storage. Idempotent — safe to call at startup."""
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Storage backend: local (UPLOADS_DIR=%s)", UPLOADS_DIR)


def put_object(path: str, data: bytes, content_type: str) -> dict:
    return _put_local(path, data, content_type)


def get_object(path: str):
    return _get_local(path)
