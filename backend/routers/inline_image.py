"""
Inline-image proxy — fetches a remote image URL server-side and returns it
as a `data:` URI. Used by the FooterLinkEditor when a user enables the
"Match link colour" toggle on a cross-origin image URL: CSS `mask-image`
requires the resource to be CORS-clean, but most icon CDNs (e.g.
svgrepo.com) do not send `Access-Control-Allow-Origin`. Inlining as a
data URI bypasses CORS entirely.

Hardened to refuse to be used as a generic SSRF tool:
  • Only http(s) URLs.
  • DNS-resolves and rejects any private / loopback / link-local IPs.
  • Content-Type must start with `image/`.
  • Response body capped at 256 KB.
  • 5 second total timeout.
  • Authentication required.

Returns: { "dataUri": "data:<mime>;base64,…", "contentType": "...", "sizeBytes": … }
"""
import base64
import ipaddress
import logging
import socket
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from deps import User, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["inline-image"])

MAX_BYTES = 256 * 1024  # 256 KB ceiling — way more than any reasonable icon


class InlineImageReq(BaseModel):
    url: str = Field(..., min_length=8, max_length=2048)


def _is_private_host(host: str) -> bool:
    """Block private / loopback / link-local addresses (SSRF defence)."""
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return True  # can't resolve → safer to refuse
    for info in infos:
        addr = info[4][0]
        try:
            ip = ipaddress.ip_address(addr)
        except ValueError:
            continue
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
            return True
    return False


@router.post("/inline-image")
async def inline_image(
    req: InlineImageReq,
    _user: User = Depends(get_current_user),
):
    parsed = urlparse(req.url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Only http(s) URLs are supported.")
    if not parsed.hostname:
        raise HTTPException(status_code=400, detail="Invalid URL.")
    if _is_private_host(parsed.hostname):
        raise HTTPException(status_code=400, detail="URL resolves to a private address.")

    try:
        async with httpx.AsyncClient(
            timeout=5.0,
            follow_redirects=True,
            max_redirects=3,
            headers={"User-Agent": "DesignWorkshop/1.0 (image-inliner)"},
        ) as client:
            r = await client.get(req.url)
    except httpx.HTTPError as e:
        logger.info("inline-image: fetch failed for %s: %s", req.url, e)
        raise HTTPException(status_code=502, detail=f"Could not fetch image: {e}")

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Upstream returned HTTP {r.status_code}.")

    ct = (r.headers.get("content-type") or "").split(";", 1)[0].strip().lower()
    if not ct.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"Resource is not an image (Content-Type: {ct or 'unknown'}).")

    body = r.content
    if len(body) > MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Image too large ({len(body)} bytes > {MAX_BYTES}).")

    b64 = base64.b64encode(body).decode("ascii")
    return {
        "dataUri": f"data:{ct};base64,{b64}",
        "contentType": ct,
        "sizeBytes": len(body),
    }
