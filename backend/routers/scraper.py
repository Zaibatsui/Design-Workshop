"""Product-page scraper — BeautifulSoup4 with a Playwright Chromium fallback
for JS-rendered product galleries (Cnet Cloud / 1WorldSync widgets).

Hardened with an in-process TTL cache + per-URL single-flight lock so a
busy embedded snippet (or a viral page) cannot cause your IP to flood
the upstream site. See the bottom of the file for the cache layer."""
import asyncio
import json
import logging
import os
import re
import time
from collections import OrderedDict
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

router = APIRouter(tags=["scraper"])
logger = logging.getLogger(__name__)

# ── In-process scrape cache ─────────────────────────────────────────────
# Keyed by URL. Entries expire after _CACHE_TTL seconds. LRU-capped at
# _CACHE_MAX so a long-running container can't grow the dict unbounded.
_CACHE_TTL = 600  # 10 min — must match the Cache-Control max-age below
_CACHE_MAX = 500
_cache: "OrderedDict[str, tuple[float, dict]]" = OrderedDict()

# Per-URL single-flight: if 50 visitors land at the same instant we still
# fire ONE upstream request. The other 49 await the same coroutine's
# result via the per-URL asyncio.Lock.
_locks: "dict[str, asyncio.Lock]" = {}
_locks_guard = asyncio.Lock()


def _cache_get(url: str):
    entry = _cache.get(url)
    if not entry:
        return None
    ts, data = entry
    if time.time() - ts > _CACHE_TTL:
        _cache.pop(url, None)
        return None
    _cache.move_to_end(url)
    return data


def _cache_set(url: str, data: dict):
    _cache[url] = (time.time(), data)
    _cache.move_to_end(url)
    while len(_cache) > _CACHE_MAX:
        _cache.popitem(last=False)


async def _get_url_lock(url: str) -> asyncio.Lock:
    async with _locks_guard:
        lock = _locks.get(url)
        if lock is None:
            lock = asyncio.Lock()
            _locks[url] = lock
        return lock


class ScrapeRequest(BaseModel):
    url: str


def _format_price(p):
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

    if not image:
        link_img = soup.find("link", attrs={"rel": "image_src"})
        if link_img:
            image = link_img.get("href")

    if not image:
        ip = soup.find(attrs={"itemprop": "image"})
        if ip:
            image = ip.get("content") or ip.get("src") or ip.get("href")

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

    if not image:
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src") or ""
            if "/imgr/" in src and "logo" not in src.lower():
                image = src
                break

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

    if image and image.startswith("//"):
        image = "https:" + image

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


def _looks_like_logo(src: str) -> bool:
    s = (src or "").lower()
    return any(k in s for k in ("logo", "icon", "header", "footer", "sprite"))


def _chromium_executable_path():
    """Resolve which chromium binary to launch.

    Order of preference:
      1. PLAYWRIGHT_CHROME_EXECUTABLE_PATH env var (explicit override).
      2. /usr/bin/chromium if it exists (preview/dev env where the
         distro chromium is version-matched to a system playwright).
      3. None — let Playwright auto-discover its bundled browser
         (production: the MSFT image puts a perfectly version-matched
         chromium in /ms-playwright).
    """
    explicit = os.environ.get("PLAYWRIGHT_CHROME_EXECUTABLE_PATH")
    if explicit and os.path.isfile(explicit):
        return explicit
    if os.path.isfile("/usr/bin/chromium"):
        return "/usr/bin/chromium"
    return None


async def _scrape_image_with_browser(url: str):
    """Render the page with headless Chromium and pull the main product image."""
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
            launch_kwargs = {
                "headless": True,
                "args": ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
            }
            chrome_exec = _chromium_executable_path()
            if chrome_exec:
                launch_kwargs["executable_path"] = chrome_exec
            browser = await p.chromium.launch(**launch_kwargs)
            try:
                context = await browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/146.0 Safari/537.36"
                    ),
                    viewport={"width": 1280, "height": 800},
                )
                page = await context.new_page()

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
                try:
                    await page.wait_for_selector(
                        ".ccs-ds-cloud-main-image img, #cnet-cloud-product-images-large img, [itemprop='image'], meta[property='og:image']",
                        timeout=8000,
                    )
                except Exception:
                    pass

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


async def _do_scrape(url: str) -> dict:
    """Actual upstream fetch — bypasses cache & lock. Use scrape_product()
    as the public entry point so callers always go through the protections."""
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
    if data.get("image"):
        data["image"] = urljoin(resp.url, data["image"])

    if not data.get("image"):
        js_image = await _scrape_image_with_browser(url)
        if js_image:
            data["image"] = js_image

    data["url"] = url
    return data


@router.post("/scrape-product")
async def scrape_product(req: ScrapeRequest, response: Response):
    url = req.url.strip()
    if not re.match(r"^https?://", url):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    # Tell Cloudflare / browsers to cache the result for 10 min — same TTL
    # as our in-process cache. Combined with the snippet's 30-min
    # localStorage cache this gives us three layers of de-duplication.
    response.headers["Cache-Control"] = "public, max-age=600"

    # Fast path — fresh hit in the in-process cache.
    cached = _cache_get(url)
    if cached is not None:
        return cached

    # Slow path — single-flight per URL. If 50 concurrent requests arrive
    # for the same URL, only the first acquires the lock and scrapes; the
    # other 49 await it and read the result from the cache below.
    lock = await _get_url_lock(url)
    async with lock:
        cached = _cache_get(url)
        if cached is not None:
            return cached
        data = await _do_scrape(url)
        _cache_set(url, data)
        return data
