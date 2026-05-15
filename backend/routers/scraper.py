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
from urllib.parse import urljoin, urlsplit

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
    # "incl" or "excl" — when present, attaches the matching VAT
    # preference cookies/params so the upstream page renders the
    # correct price view. Cache key includes this so the two views
    # never serve crossed results.
    vat_mode: str | None = None


def _format_price(p, currency="GBP"):
    if p is None:
        return None
    s = str(p).strip()
    if not s:
        return None
    if re.match(r"^\d+(?:[.,]\d+)?$", s):
        try:
            return f"{_currency_symbol(currency)}{float(s.replace(',', '.')):.2f}"
        except Exception:
            return s
    return s


# ISO-4217 → display symbol. Anything not listed falls back to the raw
# code (e.g. "PLN 199.00") so we never silently mislabel a price.
_CURRENCY_SYMBOLS = {
    "GBP": "£",
    "USD": "$",
    "EUR": "€",
    "JPY": "¥",
    "CNY": "¥",
    "INR": "₹",
    "AUD": "$",
    "CAD": "$",
    "NZD": "$",
    "CHF": "CHF ",
    "SEK": "kr ",
    "NOK": "kr ",
    "DKK": "kr ",
    "PLN": "zł ",
    "CZK": "Kč ",
    "HUF": "Ft ",
    "ZAR": "R",
    "BRL": "R$ ",
    "MXN": "$",
    "SGD": "$",
    "HKD": "$",
    "AED": "د.إ ",
    "SAR": "﷼ ",
    "ILS": "₪",
    "TRY": "₺",
    "RUB": "₽",
}


def _currency_symbol(code):
    if not code:
        return "£"
    c = str(code).strip().upper()
    return _CURRENCY_SYMBOLS.get(c, f"{c} ")


# Reverse-map: page text symbol → ISO code. Used when the page has only
# a rendered symbol (e.g. "€1,234.56") and no JSON-LD priceCurrency.
_SYMBOL_TO_CODE = {
    "£": "GBP",
    "$": "USD",
    "€": "EUR",
    "¥": "JPY",
    "₹": "INR",
    "₪": "ILS",
    "₺": "TRY",
    "₽": "RUB",
    "kr": "SEK",  # ambiguous (SEK/NOK/DKK) — assume SEK
    "zł": "PLN",
    "Kč": "CZK",
}


def _detect_currency_from_text(s):
    """Find the currency adjacent to an actual price in the text. Returns
    an ISO code or None.

    We look for symbols/codes immediately before or after a number — that
    excludes false positives like jQuery (`$('.foo')`), Stripe JS includes,
    or base64 tokens that happen to contain `EUR`. Counts each match and
    returns whichever is most frequent (ties favour the more
    region-specific currency by insertion order)."""
    if not s:
        return None
    s = str(s)
    # Each pattern must match a currency token *next to* a digit run.
    SYM_PATTERNS = {
        "GBP": r"£\s?\d|\d\s?£",
        "EUR": r"€\s?\d|\d\s?€",
        "USD": r"\$\s?\d|\d\s?USD\b",   # `$1` requires the digit so jQuery `$.` doesn't trigger
        "JPY": r"¥\s?\d|\d\s?¥|\d\s?JPY\b",
        "INR": r"₹\s?\d|\d\s?₹",
        "ILS": r"₪\s?\d|\d\s?₪",
        "TRY": r"₺\s?\d|\d\s?₺",
        "RUB": r"₽\s?\d|\d\s?₽",
        "SEK": r"\d\s?kr\b|\bkr\s?\d",
        "NOK": r"\d\s?NOK\b|\bNOK\s?\d",
        "DKK": r"\d\s?DKK\b|\bDKK\s?\d",
        "PLN": r"\d\s?zł\b|\bzł\s?\d",
        "CZK": r"\d\s?Kč\b|\bKč\s?\d",
        "CHF": r"\bCHF\s?\d|\d\s?CHF\b",
        "AUD": r"\bAUD\s?\d|\d\s?AUD\b",
        "CAD": r"\bCAD\s?\d|\d\s?CAD\b",
        "NZD": r"\bNZD\s?\d|\d\s?NZD\b",
        "ZAR": r"\bZAR\s?\d|\d\s?ZAR\b|R\s?\d{2,}",
        "BRL": r"R\$\s?\d|\d\s?BRL\b",
        "AED": r"\bAED\s?\d|\d\s?AED\b",
        "SAR": r"\bSAR\s?\d|\d\s?SAR\b",
        "HUF": r"\d\s?Ft\b|\bHUF\s?\d",
    }
    best_code = None
    best_count = 0
    for code, pat in SYM_PATTERNS.items():
        n = len(re.findall(pat, s))
        if n > best_count:
            best_count = n
            best_code = code
    return best_code


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
    currency = None  # ISO code if we can find one

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
    currency = currency or og("product:price:currency") or og("og:price:currency")

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
                    m = re.search(r"[£$€¥₹₪₺₽]?\s*\d[\d,]*(?:\.\d+)?", cand)
                    if m:
                        price = m.group(0).strip()
                        if not currency:
                            currency = _detect_currency_from_text(cand)
                        break

    # Last-ditch: scan the document body for currency tokens adjacent to
    # digits — that filters out stray `$` from jQuery/Stripe JS and stray
    # `EUR` from base64 tokens. Anonymous Nettailer storefronts that gate
    # prices behind login may not expose any price-shaped text at all; we
    # still leave currency=None in that case rather than guess wrong.
    if not currency:
        body_text = soup.get_text(" ", strip=True)[:5000]
        currency = _detect_currency_from_text(body_text)

    return {
        "name": (name or "").strip()[:200] or None,
        "price": _format_price(price, currency),
        "image": image,
        "overlay": _extract_overlay(soup),
        "currency": (currency or "GBP").upper() if currency else None,
    }


# Map common overlay-position class names → our canonical 4 positions.
_OVERLAY_POSITION_PATTERNS = {
    "top-left": (re.compile(r"(top[\s_-]*left|top-start|tl)\b", re.I),),
    "top-right": (re.compile(r"(top[\s_-]*right|top-end|tr)\b", re.I),),
    "bottom-left": (re.compile(r"(bottom[\s_-]*left|bl)\b", re.I),),
    "bottom-right": (re.compile(r"(bottom[\s_-]*right|br)\b", re.I),),
}


def _extract_overlay(soup):
    """Find a product-image overlay (e.g. an "IN STOCK" badge) layered
    over the main product image. Returns ``{"src": ..., "position": ...}``
    or None.

    Looks for elements whose class contains ``image-overlay``, ``badge``,
    or ``ribbon``, takes the first ``<img>`` inside, and parses the
    position from the class names. Position falls back to ``top-left``
    which matches the most common badge convention.
    """
    candidates = soup.select(
        "[class*='image-overlay'], [class*='product-badge'], [class*='ribbon']"
    )
    for el in candidates:
        img = el.find("img")
        if not img:
            continue
        src = img.get("src") or img.get("data-src")
        if not src or _looks_like_logo(src):
            continue
        cls = " ".join(el.get("class") or [])
        position = "top-left"
        for canonical, patterns in _OVERLAY_POSITION_PATTERNS.items():
            if any(p.search(cls) for p in patterns):
                position = canonical
                break
        return {"src": src, "position": position}
    return None


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


def _parse_money(price_str):
    """Pull a numeric value out of a price string like '£1,234.56' or '£99'."""
    if not price_str:
        return None
    m = re.search(r"\d[\d,]*(?:\.\d+)?", str(price_str))
    if not m:
        return None
    try:
        return float(m.group(0).replace(",", ""))
    except Exception:
        return None


def _is_nettailer(final_url: str, html: str) -> bool:
    """Detect a Nettailer / netset storefront so we know the VAT-toggle
    endpoint is available. We accept either a host match or in-page
    markers because resellers white-label Nettailer on their own domain."""
    try:
        host = (urlsplit(final_url).hostname or "").lower()
    except Exception:
        host = ""
    if "nettailer" in host or "netset" in host:
        return True
    if html and ("change_inc_vat" in html or "vat-switcher" in html):
        return True
    return False


def _origin(url: str) -> str:
    parts = urlsplit(url)
    return f"{parts.scheme}://{parts.netloc}"


_DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/146.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}


async def _do_scrape(url: str, vat_mode: str | None = None) -> dict:
    """Actual upstream fetch — bypasses cache & lock. Use scrape_product()
    as the public entry point so callers always go through the protections.

    For Nettailer storefronts we exploit the ``/nodeapi/change_inc_vat``
    toggle endpoint discovered in DevTools: we fetch the page once with a
    fresh session, POST the toggle (which is stored server-side in the
    session, not in a client cookie value), then fetch again. The larger
    of the two parsed prices is inc-VAT, the smaller is ex-VAT.

    For non-Nettailer pages we just do a single fetch."""
    session = requests.Session()
    session.headers.update(_DEFAULT_HEADERS)

    try:
        resp = session.get(url, timeout=15, allow_redirects=True)
        resp.raise_for_status()
    except requests.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Page returned {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot fetch page: {e}")

    soup = BeautifulSoup(resp.text, "html.parser")
    data = _extract_product(soup)

    price_inc = None
    price_exc = None

    # Nettailer-only: fetch the other VAT view by POSTing the toggle in
    # the same session, then re-fetching the product page.
    if _is_nettailer(resp.url, resp.text) and data.get("price"):
        try:
            origin = _origin(resp.url)
            toggle_url = f"{origin}/nodeapi/change_inc_vat"
            base_toggle_headers = {
                "X-Requested-With": "XMLHttpRequest",
                "Accept": "application/json, */*; q=0.01",
                "Content-Type": "application/json; charset=UTF-8",
                "Origin": origin,
                "Referer": resp.url,
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
            }
            # Nettailer's /nodeapi/ endpoints reject the first call from a
            # fresh session with an app-level ``{"status":{"code":449}}``
            # body, and use that response to set a ``node`` cookie. The
            # client JS then reads that cookie and echoes it back as a
            # custom ``node:`` HTTP header on subsequent calls — only
            # those calls actually succeed. We replicate that handshake:
            # one priming call to get the cookie, then the real toggle
            # with the cookie value mirrored into the header.
            toggle_ok = False
            for attempt in range(2):
                hdrs = dict(base_toggle_headers)
                node_val = session.cookies.get("node")
                if node_val:
                    hdrs["node"] = node_val
                t = session.post(toggle_url, headers=hdrs, timeout=10, allow_redirects=True)
                body = (t.text or "").strip()
                if t.status_code < 400 and '"code":449' not in body:
                    toggle_ok = True
                    break
            if toggle_ok:
                resp2 = session.get(url, timeout=15, allow_redirects=True)
                if resp2.status_code < 400:
                    soup2 = BeautifulSoup(resp2.text, "html.parser")
                    data2 = _extract_product(soup2)
                    p1 = _parse_money(data.get("price"))
                    p2 = _parse_money(data2.get("price"))
                    if p1 is not None and p2 is not None and p1 != p2:
                        if p1 > p2:
                            price_inc, price_exc = data["price"], data2["price"]
                        else:
                            price_inc, price_exc = data2["price"], data["price"]
                        # Pick the requested view. Nettailer's anonymous
                        # default is ex-VAT (the `.vat-switcher-label`
                        # reads "Excl VAT" on a fresh visit), so when the
                        # caller doesn't specify a mode we mirror that
                        # default — keeps the editor preview consistent
                        # with what real customers see.
                        if vat_mode == "incl":
                            data["price"] = price_inc
                        else:
                            data["price"] = price_exc
        except Exception as e:
            logger.warning("Nettailer VAT toggle fetch failed for %s: %s", url, e)

    if data.get("image"):
        data["image"] = urljoin(resp.url, data["image"])
    overlay = data.get("overlay")
    if overlay and overlay.get("src"):
        overlay["src"] = urljoin(resp.url, overlay["src"])
        if not re.match(r"^https?://", overlay["src"]):
            data["overlay"] = None

    if not data.get("image"):
        js_image = await _scrape_image_with_browser(url)
        if js_image:
            data["image"] = js_image

    if price_inc is not None:
        data["priceInc"] = price_inc
    if price_exc is not None:
        data["priceExc"] = price_exc

    data["url"] = url
    return data


@router.post("/scrape-product")
async def scrape_product(req: ScrapeRequest, response: Response):
    url = req.url.strip()
    if not re.match(r"^https?://", url):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")
    vat_mode = req.vat_mode if req.vat_mode in ("incl", "excl") else None

    # Tell Cloudflare / browsers to cache the result for 10 min — same TTL
    # as our in-process cache. Combined with the snippet's 30-min
    # localStorage cache this gives us three layers of de-duplication.
    response.headers["Cache-Control"] = "public, max-age=600"

    # Cache key includes vat_mode so the incl/excl views don't collide.
    cache_key = f"{url}::{vat_mode or 'default'}"

    # Fast path — fresh hit in the in-process cache.
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    # Slow path — single-flight per cache_key.
    lock = await _get_url_lock(cache_key)
    async with lock:
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached
        data = await _do_scrape(url, vat_mode=vat_mode)
        _cache_set(cache_key, data)
        # When the Nettailer scrape produced both views in one shot,
        # populate every cache key (default/incl/excl) so any future
        # request — whichever mode it asks for — hits the cache instantly
        # without re-scraping upstream.
        if data.get("priceInc") and data.get("priceExc"):
            for mode_key, price_for_mode in (
                ("default", data["priceExc"]),  # anonymous Nettailer default = ex-VAT
                ("incl", data["priceInc"]),
                ("excl", data["priceExc"]),
            ):
                k = f"{url}::{mode_key}"
                if _cache_get(k) is None:
                    sibling = dict(data)
                    sibling["price"] = price_for_mode
                    _cache_set(k, sibling)
        return data
