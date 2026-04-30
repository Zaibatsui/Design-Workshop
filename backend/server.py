from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from bs4 import BeautifulSoup
import os
import logging
import uuid
import json
import re
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


# ---------- Product page scraping ----------

class ScrapeRequest(BaseModel):
    url: str


def _format_price(p):
    """If raw price is a bare number, format as £X.XX. Otherwise return as-is."""
    if p is None:
        return None
    s = str(p).strip()
    if not s:
        return None
    if re.match(r"^\d+(?:[.,]\d+)?$", s):
        try:
            return f"£{float(s.replace(',', '.')):.2f}"
        except Exception:
            return s
    return s


def _walk_jsonld(data):
    """Yield all dict nodes from a JSON-LD blob (handles @graph, lists, nesting)."""
    if isinstance(data, list):
        for x in data:
            yield from _walk_jsonld(x)
    elif isinstance(data, dict):
        yield data
        for v in data.values():
            if isinstance(v, (list, dict)):
                yield from _walk_jsonld(v)


def _extract_product(soup):
    name = price = image = None

    # Strip sections that commonly contain accessory / related / recommended / upsell
    # product images so fallback image searches never pick them up.
    _NOISE_SELECTORS = [
        ".product-card-accessories",
        ".selected-accessories",
        ".small-product-list",
        ".accessories",
        ".related-products",
        ".related",
        ".upsell",
        ".upsells",
        ".cross-sell",
        ".cross-sells",
        ".recommendations",
        ".recommended",
        ".suggested",
        ".also-bought",
        ".you-may-like",
        "[class*='accessor']",
        "[class*='related']",
        "[class*='recommend']",
        "[class*='upsell']",
        "[class*='cross-sell']",
        "[id*='accessor']",
        "[id*='related']",
        "[id*='recommend']",
        "aside",
        "footer",
        "nav",
        "header",
    ]
    for sel in _NOISE_SELECTORS:
        for el in soup.select(sel):
            el.decompose()

    # 1. JSON-LD Product
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or script.get_text() or "{}")
        except Exception:
            continue
        for node in _walk_jsonld(data):
            t = node.get("@type")
            is_product = t == "Product" or (isinstance(t, list) and "Product" in t)
            if not is_product:
                continue
            name = name or node.get("name")
            img = node.get("image")
            if img and not image:
                if isinstance(img, str):
                    image = img
                elif isinstance(img, list) and img:
                    image = img[0] if isinstance(img[0], str) else img[0].get("url")
                elif isinstance(img, dict):
                    image = img.get("url")
            offers = node.get("offers")
            if offers and not price:
                offer = offers if isinstance(offers, dict) else (offers[0] if offers else {})
                if isinstance(offer, dict):
                    price = offer.get("price") or offer.get("lowPrice")

    # 2. OpenGraph fallbacks
    def og(prop):
        m = soup.find("meta", attrs={"property": prop})
        return m.get("content") if m else None

    name = name or og("og:title")
    image = image or og("og:image:secure_url") or og("og:image")
    price = price or og("product:price:amount") or og("og:price:amount")

    # 3. Twitter cards
    def tw(prop):
        m = soup.find("meta", attrs={"name": prop})
        return m.get("content") if m else None

    image = image or tw("twitter:image")
    name = name or tw("twitter:title")

    # link rel=image_src (older standard, still used by misco)
    if not image:
        link_img = soup.find("link", attrs={"rel": "image_src"})
        if link_img:
            image = link_img.get("href")

    # itemprop=image
    if not image:
        ip = soup.find(attrs={"itemprop": "image"})
        if ip:
            image = ip.get("content") or ip.get("src") or ip.get("href")

    # Common product image selectors
    if not image:
        for sel in [
            "img#mainImage",
            "img#main-image",
            "img.product-image",
            ".product-image img",
            ".product-gallery img",
            ".product-img img",
            ".productImage img",
            "[data-zoom-image]",
            "img[data-src]",
        ]:
            el = soup.select_one(sel)
            if el is not None:
                cand = (
                    el.get("data-zoom-image")
                    or el.get("data-large")
                    or el.get("src")
                    or el.get("data-src")
                )
                if cand:
                    image = cand
                    break

    # Nettailer plain /imgr/UUID/W/H images (no class/id markers)
    if not image:
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src") or ""
            if "/imgr/" in src and "logo" not in src.lower():
                image = src
                break

    # Upscale tiny /imgr/UUID/W/H thumbnails to a reasonable size
    if image:
        m = re.match(r"^(.*?/imgr/[A-Fa-f0-9-]+)/(\d+)/(\d+)(.*)$", image)
        if m:
            try:
                w = int(m.group(2))
                h = int(m.group(3))
                if max(w, h) < 400:
                    image = f"{m.group(1)}/640/480{m.group(4)}"
            except Exception:
                pass

    # Resolve relative image URLs against the page URL
    if image and image.startswith("//"):
        image = "https:" + image
    elif image and image.startswith("/"):
        # Will resolve in caller using urljoin since we have the request URL
        pass

    # 4. HTML fallbacks
    if not name:
        h1 = soup.find("h1")
        if h1:
            name = h1.get_text(" ", strip=True)
    if not name:
        title = soup.find("title")
        if title:
            name = title.get_text(strip=True)

    if not price:
        # common ecommerce price selectors
        for sel in [
            "[itemprop='price']",
            "[data-price]",
            ".product-price",
            ".price",
            ".prod-price",
        ]:
            el = soup.select_one(sel)
            if el:
                cand = (
                    el.get("content")
                    or el.get("data-price")
                    or el.get_text(" ", strip=True)
                )
                if cand:
                    m = re.search(r"[£$€]?\s*\d[\d,]*(?:\.\d+)?", cand)
                    if m:
                        price = m.group(0).strip()
                        break

    return {
        "name": (name or "").strip()[:200] or None,
        "price": _format_price(price),
        "image": image,
    }


@api_router.post("/scrape-product")
async def scrape_product(req: ScrapeRequest):
    url = req.url.strip()
    if not re.match(r"^https?://", url):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")
    try:
        resp = requests.get(
            url,
            timeout=15,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; NettailerSectionBuilder/1.0; +https://demo.nettailer.com)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-GB,en;q=0.9",
            },
            allow_redirects=True,
        )
        resp.raise_for_status()
    except requests.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Page returned {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot fetch page: {e}")

    soup = BeautifulSoup(resp.text, "html.parser")
    data = _extract_product(soup)
    # Resolve relative image URL against the page URL
    if data.get("image"):
        from urllib.parse import urljoin
        data["image"] = urljoin(resp.url, data["image"])

    # If image couldn't be found in the raw HTML (e.g. Nettailer renders the main
    # product image via a Cnet Cloud JS widget), render the page in a headless
    # browser and grab the image after JS has executed.
    if not data.get("image"):
        js_image = await _scrape_image_with_browser(url)
        if js_image:
            data["image"] = js_image
            # If we also missed name/price on this page, they'll still be None —
            # keep whatever _extract_product found.

    data["url"] = url
    return data


async def _scrape_image_with_browser(url: str):
    """Fallback: render the page with headless Chromium and pull the main product image."""
    try:
        from playwright.async_api import async_playwright
    except Exception as e:
        logger.warning("Playwright not available: %s", e)
        return None

    selectors = [
        ".ccs-ds-cloud-main-image img",
        "#cnet-cloud-product-images-large img",
        ".product-card-image img",
        "[itemprop='image']",
        ".product-gallery img",
        ".product-image img",
        "img.product-image",
        "meta[property='og:image']",
    ]
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                executable_path="/usr/bin/chromium",
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
            )
            try:
                context = await browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/146.0 Safari/537.36"
                    ),
                    viewport={"width": 1280, "height": 800},
                )
                page = await context.new_page()
                # Block non-essential resources to keep it fast
                async def _route(route):
                    if route.request.resource_type in ("font", "media", "stylesheet"):
                        await route.abort()
                    else:
                        await route.continue_()
                await page.route("**/*", _route)

                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                except Exception:
                    pass
                # Allow client-side widgets (Cnet Cloud) to inject images
                try:
                    await page.wait_for_selector(
                        ".ccs-ds-cloud-main-image img, #cnet-cloud-product-images-large img, [itemprop='image'], meta[property='og:image']",
                        timeout=8000,
                    )
                except Exception:
                    pass

                for sel in selectors:
                    try:
                        src = await page.evaluate(
                            """(s) => {
                                const el = document.querySelector(s);
                                if (!el) return null;
                                if (el.tagName === 'META') return el.getAttribute('content');
                                return el.currentSrc || el.src || el.getAttribute('data-src') || null;
                            }""",
                            sel,
                        )
                        if src and not _looks_like_logo(src):
                            return src
                    except Exception:
                        continue
                return None
            finally:
                await browser.close()
    except Exception as e:
        logger.warning("Browser fallback failed for %s: %s", url, e)
        return None


def _looks_like_logo(src: str) -> bool:
    s = (src or "").lower()
    return any(k in s for k in ("logo", "icon", "header", "footer", "sprite"))


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
