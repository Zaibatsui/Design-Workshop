"""Smoke test for the /api/inline-image router. Run with:
    cd /app/backend && bash -c 'set -a; source .env; set +a; python tests_inline_image.py'
"""
import asyncio
from fastapi import HTTPException
from routers.inline_image import inline_image, InlineImageReq


async def expect_error(coro, code, label):
    try:
        await coro
        print(f"FAIL · {label} (no error raised)")
    except HTTPException as e:
        ok = e.status_code == code
        print(("PASS" if ok else "FAIL") + f" · {label} → HTTP {e.status_code}: {e.detail[:80]}")


async def main():
    user = object()  # endpoint never actually inspects this dependency value
    await expect_error(inline_image(InlineImageReq(url="http://localhost/"), user), 400, "localhost rejected")
    await expect_error(inline_image(InlineImageReq(url="http://127.0.0.1/"), user), 400, "loopback rejected")
    await expect_error(inline_image(InlineImageReq(url="http://10.0.0.1/"), user), 400, "private 10/8 rejected")
    await expect_error(inline_image(InlineImageReq(url="http://192.168.1.1/"), user), 400, "private 192.168/16 rejected")
    await expect_error(inline_image(InlineImageReq(url="file:///etc/passwd"), user), 400, "file:// rejected")
    await expect_error(inline_image(InlineImageReq(url="gopher://x/"), user), 400, "non-http rejected")

    try:
        res = await inline_image(InlineImageReq(url="https://www.svgrepo.com/show/325437/nav-arrow-right.svg"), user)
        ct = res["contentType"]
        sz = res["sizeBytes"]
        prefix = res["dataUri"][:50]
        ok = res["dataUri"].startswith("data:image/svg+xml") and 50 < sz < 256 * 1024
        msg = f" · svgrepo fetch: ct={ct} size={sz} prefix={prefix}"
        print(("PASS" if ok else "FAIL") + msg)
    except Exception as e:
        print(f"FAIL · svgrepo fetch: {e}")

    await expect_error(inline_image(InlineImageReq(url="https://example.com/"), user), 400, "non-image URL rejected")


asyncio.run(main())
