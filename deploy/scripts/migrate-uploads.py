#!/usr/bin/env python3
"""Migrate uploaded images from a remote backend to local /var/uploads.

Run this AFTER import-mongo.sh, INSIDE the new backend container:

    docker compose exec backend python /app/deploy/scripts/migrate-uploads.py \\
        --source https://content-forge-1039.preview.emergentagent.com \\
        --target https://designworkshop.zaibatsui.co.uk

What it does:
  1. Walks every section + page document in MongoDB.
  2. Recursively scans every config dict/list for string values that
     reference `<source>/api/files/<path>`.
  3. Downloads each unique file over HTTP from the source backend
     (which still has the binaries in its own storage).
  4. Writes the bytes to UPLOADS_DIR/<path> (matching the upload
     router's storage layout so /api/files/<path> serves them locally).
  5. Rewrites the URL strings in MongoDB to use --target instead of
     --source, so existing snippets keep working from the new domain.

Idempotent: re-runs are safe — files already on disk are skipped, URLs
already pointing at --target are left untouched.
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

import requests
from motor.motor_asyncio import AsyncIOMotorClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("migrate-uploads")

UPLOADS_DIR = Path(os.environ.get("UPLOADS_DIR", "/var/uploads")).resolve()


def _walk_strings(node, path=()):
    """Yield (location, value) pairs for every string in a nested structure.

    `location` is a tuple of (key|index) breadcrumbs, used by the writer
    to mutate the original document in place via dotted-path updates.
    """
    if isinstance(node, str):
        yield path, node
    elif isinstance(node, dict):
        for k, v in node.items():
            yield from _walk_strings(v, path + (k,))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from _walk_strings(v, path + (i,))


def _set_nested(node, path, value):
    """Mutate `node` in place: set value at the breadcrumb path."""
    cur = node
    for step in path[:-1]:
        cur = cur[step]
    cur[path[-1]] = value


def _download(source_url: str, rel_path: str) -> bytes:
    full = f"{source_url.rstrip('/')}/api/files/{rel_path}"
    r = requests.get(full, timeout=60)
    r.raise_for_status()
    return r.content


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, help="Old public URL, e.g. https://content-forge-1039.preview.emergentagent.com")
    ap.add_argument("--target", required=True, help="New public URL, e.g. https://designworkshop.zaibatsui.co.uk")
    ap.add_argument("--dry-run", action="store_true", help="Report what would change but don't write anything")
    args = ap.parse_args()

    src = args.source.rstrip("/")
    tgt = args.target.rstrip("/")
    src_prefix = f"{src}/api/files/"

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not (mongo_url and db_name):
        log.error("MONGO_URL and DB_NAME must be set")
        return 1

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    seen_paths: set[str] = set()
    downloaded = 0
    skipped_existing = 0
    rewritten_docs = 0
    failed: list[str] = []

    for coll_name in ("sections", "pages", "page_templates"):
        coll = db[coll_name]
        cursor = coll.find({})
        async for doc in cursor:
            doc_id = doc.get("_id")
            mutated = False
            for loc, value in list(_walk_strings(doc.get("config") or doc.get("blocks") or {})):
                if not value.startswith(src_prefix):
                    continue
                rel = value[len(src_prefix):]
                # Strip any query/hash so we save just the file path.
                rel_path = urlparse(rel).path or rel
                seen_paths.add(rel_path)

                local = UPLOADS_DIR / rel_path
                if not local.is_file():
                    if args.dry_run:
                        log.info("[dry-run] would download %s", rel_path)
                    else:
                        try:
                            data = _download(src, rel_path)
                            local.parent.mkdir(parents=True, exist_ok=True)
                            local.write_bytes(data)
                            log.info("downloaded %s (%d bytes)", rel_path, len(data))
                            downloaded += 1
                        except Exception as e:
                            log.warning("FAILED %s: %s", rel_path, e)
                            failed.append(rel_path)
                            continue
                else:
                    skipped_existing += 1

                # Rewrite the URL in the doc to point at --target.
                new_url = f"{tgt}/api/files/{rel}"
                # Find the right top-level key (config or blocks) and patch it.
                root = "config" if "config" in doc else "blocks"
                if root in doc:
                    _set_nested(doc[root], loc, new_url)
                    mutated = True

            if mutated and not args.dry_run:
                root = "config" if "config" in doc else "blocks"
                await coll.update_one({"_id": doc_id}, {"$set": {root: doc[root]}})
                rewritten_docs += 1

    log.info("=== summary ===")
    log.info("unique paths referenced : %d", len(seen_paths))
    log.info("files downloaded        : %d", downloaded)
    log.info("already on disk         : %d", skipped_existing)
    log.info("docs rewritten          : %d", rewritten_docs)
    if failed:
        log.warning("FAILED downloads (%d):", len(failed))
        for p in failed:
            log.warning("  %s", p)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
