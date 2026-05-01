from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Request, Response, Cookie, Depends
from fastapi.responses import Response as FastAPIResponse, RedirectResponse
from authlib.integrations.starlette_client import OAuth, OAuthError
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Any, Dict
import os
import logging
import uuid
import json
import re
import requests
import secrets
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB
mongo_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = mongo_client[os.environ["DB_NAME"]]

# Storage config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "modular-pages")

SESSION_COOKIE = "session_token"
SESSION_TTL_DAYS = 7

# Google OAuth (REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH)
GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
OAUTH_STATE_SECRET = os.environ["OAUTH_STATE_SECRET"]

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


# ============================================================
# Auth (Emergent Google OAuth)
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
# ============================================================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime


# Authlib OAuth client (registered once at module load)
oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(default=None),
) -> User:
    # Cookie first, Authorization Bearer fallback
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session_doc = await db.user_sessions.find_one(
        {"session_token": token}, {"_id": 0}
    )
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]}, {"_id": 0}
    )
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)


# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.get("/auth/google/login")
async def google_login(request: Request):
    # Build the redirect URI dynamically from the incoming request so it works
    # in any environment (preview, deployed, custom domain). Must exactly match
    # one of the URIs registered in Google Cloud Console.
    # Behind the Kubernetes ingress the request appears as HTTP; honor the
    # X-Forwarded-Proto header so we hand Google an https:// callback URL.
    redirect_uri = str(request.url_for("google_callback"))
    forwarded_proto = request.headers.get("x-forwarded-proto")
    if forwarded_proto and redirect_uri.startswith(f"{forwarded_proto}://") is False:
        redirect_uri = forwarded_proto + redirect_uri[redirect_uri.index("://"):]
    return await oauth.google.authorize_redirect(request, redirect_uri)


@api_router.get("/auth/google/callback", name="google_callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        logger.warning("Google OAuth failed: %s", e)
        return RedirectResponse(url="/login?error=oauth_failed", status_code=302)

    userinfo = token.get("userinfo")
    if not userinfo:
        # Fallback: parse the id_token if userinfo isn't in the token bundle
        userinfo = token.get("id_token_claims") or {}

    email = userinfo.get("email")
    name = userinfo.get("name") or email
    picture = userinfo.get("picture")
    if not email:
        return RedirectResponse(url="/login?error=no_email", status_code=302)

    # Upsert user keyed by email so existing accounts re-attach automatically.
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc),
        })

    # Mint our app session token + cookie. Authlib's OAuth state cookie is
    # separate (managed by SessionMiddleware) and only used during the dance.
    session_token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })

    response = RedirectResponse(url="/", status_code=302)
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_token,
        max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    return response


@api_router.get("/auth/me", response_model=User)
async def auth_me(current_user: User = Depends(get_current_user)):
    return current_user


@api_router.post("/auth/logout")
async def auth_logout(
    response: Response,
    session_token: Optional[str] = Cookie(default=None),
):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(SESSION_COOKIE, path="/", samesite="lax", secure=True)
    return {"ok": True}


# ============================================================
# Sections (per-user persistent snippet configurations)
# ============================================================

class SectionIn(BaseModel):
    name: str = Field(default="Untitled section")
    type: str
    config: Dict[str, Any]


class SectionUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class Section(BaseModel):
    section_id: str
    user_id: str
    name: str
    type: str
    config: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


@api_router.get("/sections", response_model=List[Section])
async def list_sections(current_user: User = Depends(get_current_user)):
    cursor = db.sections.find(
        {"user_id": current_user.user_id}, {"_id": 0}
    ).sort("updated_at", -1)
    return [Section(**doc) async for doc in cursor]


@api_router.post("/sections", response_model=Section)
async def create_section(
    payload: SectionIn, current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    section = {
        "section_id": f"sec_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "name": payload.name,
        "type": payload.type,
        "config": payload.config,
        "created_at": now,
        "updated_at": now,
    }
    await db.sections.insert_one(dict(section))
    return Section(**section)


@api_router.get("/sections/{section_id}", response_model=Section)
async def get_section(
    section_id: str, current_user: User = Depends(get_current_user)
):
    doc = await db.sections.find_one(
        {"section_id": section_id, "user_id": current_user.user_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Section not found")
    return Section(**doc)


@api_router.put("/sections/{section_id}", response_model=Section)
async def update_section(
    section_id: str,
    payload: SectionUpdate,
    current_user: User = Depends(get_current_user),
):
    update = {"updated_at": datetime.now(timezone.utc)}
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
    return Section(**result)


@api_router.delete("/sections/{section_id}")
async def delete_section(
    section_id: str, current_user: User = Depends(get_current_user)
):
    result = await db.sections.delete_one(
        {"section_id": section_id, "user_id": current_user.user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"ok": True}


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

                # First, try to grab a hi-res asset directly. Cnet Cloud / 1WorldSync
                # gallery slides carry the original (un-thumbnailed) URL on a
                # data-src attribute on the ccs-fancybox-gallery wrapper. The visible
                # <img src> is a resized 400x300 thumbnail.
                hires = await page.evaluate(
                    """() => {
                        const slide = document.querySelector(
                            '.ccs-ds-cloud-main-image .ccs-fancybox-gallery.ccs-slick-active[data-src],'
                            + ' .ccs-ds-cloud-main-image .ccs-fancybox-gallery[data-src],'
                            + ' .ccs-fancybox-gallery[data-src]'
                        );
                        if (slide) {
                            const ds = slide.getAttribute('data-src');
                            if (ds) return ds;
                        }
                        return null;
                    }"""
                )
                if hires and not _looks_like_logo(hires):
                    return hires

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

# SessionMiddleware is required by Authlib to track OAuth state across the
# Google redirect dance. Uses a separate signed cookie ("session") that's only
# read during /api/auth/google/* — our app session is a separate "session_token"
# cookie tied to user_sessions in MongoDB.
app.add_middleware(
    SessionMiddleware,
    secret_key=OAUTH_STATE_SECRET,
    same_site="lax",
    https_only=True,
    max_age=600,  # 10 min — only needs to survive the OAuth redirect
)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
