# Modular Pages — Section Builder

## Original problem statement
Modular WYSIWYG editor for reusable ecommerce content sections. Each section is fully self-contained (scoped CSS/JS) so it can be embedded in any external ecommerce CMS without conflicts. Form-based editor for non-technical users. Output: clean self-contained HTML snippet (HTML + scoped CSS + multi-instance-safe JS) via a "Copy Section" button.

## User choices
- Persistence: Client-side only (no DB)
- Image uploads: Object storage (Emergent)
- Snippet output: Pure vanilla HTML/CSS/JS, includes Poppins `@import`
- Editor mode: Section picker (one section type at a time)
- Sections: All 8 section types from user-supplied HTML
- Scoping: Re-scoped with `.ns-<id>-<uid>` prefix (no global classes)
- Hero variants: Both fade + sliding kept
- Design: Shopify-admin style

## Architecture
- **Frontend (React)** — single editor at `/`. 3-column layout:
  - Far left: Dark icon rail with 8 section types
  - Middle: Form sidebar (specific to active section)
  - Right: iframe `srcDoc` preview rendered by the same `render()` function used to copy
- **Section module pattern** — each `sections/<id>.js` exports `{id, name, icon, defaults, render, FormPanel}`. `sections/registry.js` collects them.
- **Snippet contract** — `<section class="ns-<id> ns-<id>-<uid>">…</section><style>@import Poppins; baseReset; scoped CSS</style><script>(IIFE init)</script>`. CSS scoped by `.ns-<id>-<uid>`. JS uses `querySelectorAll('.ns-<id>-<uid>:not([data-ns-init])')`. No globals, no IDs. CSS variables on the `<section>` for theming.
- **Style isolation** — `baseReset` zeroes box-sizing/margins/list-style/font-family etc. inside the section to prevent host bleed. Tested against `* {margin:50px !important; color:red}` host rules.
- **Multi-instance safety** — every Copy click re-renders with a fresh uid (different versions of same section coexist), and IIFE handles multiple identical pastes too.
- **Backend (FastAPI)** — only:
  - `POST /api/upload` → Emergent object storage
  - `GET /api/files/{path:path}` → public proxy (snippet image URLs work in any CMS)
  - `POST /api/scrape-product` → BeautifulSoup scraper, returns `{name, price, image, url}` from ecommerce product pages (Nettailer/Misco/generic OpenGraph)

## Sections implemented (2026-04-30)
1. **Hero (Sliding)** — translateX track, brand logo per slide, dark left gradient, blue CTA, autoplay, arrows, dots
2. **Hero (Fade)** — cross-fade slides, overlay opacity, CSS variable theming
3. **Content Heading** — centered heading block, color/size/weight/alignment
4. **Product Carousel** — 4 or 5 columns, prev/next arrows, hover border accent
5. **Placeholder Grid** — N items × M columns of placeholder boxes
6. **Logo Strip** — auto-scrolling infinite logo bar with seamless loop padding
7. **Break Banner** — full-width bg image + overlay + centered heading
8. **Tabs Section** — toggle buttons + split image+copy panels

## Test status
- iter 2: testing_agent_v3 → **100% backend, 100% frontend** across all 8 sections including style-isolation against hostile host CSS, multi-instance safety, copy fidelity, live preview, reset.

## Bug fixes
- **2026-04-30 (feature — live price refresh in generated snippets)**: Every product fetched via the URL scraper now ships with a `data-ns-src="<source-url>"` attribute and a self-contained refresh loop in the snippet's IIFE. When the snippet is pasted into any host CMS, the script reads each card's `data-ns-src`, checks `localStorage["ns-px:<url>"]` for a cached price (30-minute TTL = 1.8M ms), and if stale, calls `POST <BACKEND>/api/scrape-product` and updates only the `<span class="ns-price-amount">` text in place — image and name are not re-synced (avoids layout shift). Failures are silent (snippet keeps the authored price). The backend URL is hardcoded into the JS at generation time. Verified end-to-end: a snippet with stale price `£999.99` correctly updated to live `£1,415.20` in a fresh browser, with the cache entry persisted. CORS confirmed (`access-control-allow-origin: *`) and Nettailer's CSP `connect-src 'self' https:` permits the call. Price markup changed: `<p class="ns-price">£X <span class="ns-price-suffix">VAT</span></p>` → `<p class="ns-price"><span class="ns-price-amount">£X</span><span class="ns-price-suffix">VAT</span></p>` so JS can patch the amount without touching the suffix.
- **2026-04-30 (text)**: Helper text changed from "Paste a Nettailer/Misco product link…" to "Paste product page URL…" so it doesn't imply the scraper only works for those two stores.

- **2026-04-30 (enhancement — headless browser fallback for JS-rendered product images)**: Nettailer (and any other store using Cnet Cloud / 1WorldSync / client-side image widgets) renders the main product image via JavaScript — the raw HTML contains only an empty `<div id="cnet-cloud-product-images-large">`. Added a Playwright (headless Chromium) fallback in `/api/scrape-product`: if `_extract_product` returns no image from the raw HTML, launch a stripped-down headless browser (fonts/media/stylesheets blocked, `--no-sandbox`, 20s nav timeout, 8s selector wait), wait for one of `.ccs-ds-cloud-main-image img`, `#cnet-cloud-product-images-large img`, `[itemprop='image']`, `og:image` meta, then return the main image URL. Fast-path (raw HTML) stays ~1s; browser fallback adds ~3s only when needed. Verified: Nettailer Surface Pro URL now returns `https://cdn.cs.1worldsync.com/ce/16/ce16d176-b6a1-4534-923f-4024c682e527.jpg` (real product photo — verified via image analysis) in ~4s.
- **2026-04-30 (fix — scraper returning accessory image for Nettailer)**: `_extract_product` now decomposes noise containers (`.product-card-accessories`, `.selected-accessories`, `.small-product-list`, `[class*='accessor']`, `[class*='related']`, `[class*='recommend']`, `[class*='upsell']`, `[class*='cross-sell']`, `aside`, `header`, `footer`, `nav`) before any image search so accessories/related products can't leak into the main image slot.

- **2026-04-30 (feature — URL scraper in Product Carousel)**: Added "Add from product URL" panel at the top of the Products list in Product Carousel. User pastes a product page URL, clicks Fetch, and a new product card is appended with scraped `name`, `price`, `image`, and the URL as the product link. All fields remain manually editable. Invalid URLs, network errors, and empty-payload responses surface via sonner toasts. Backend endpoint: `POST /api/scrape-product`.
- **2026-04-30 (post-iter-2 #3)**: "Make wide" refinement.
  - Renamed `"Full bleed (100vw)"` toggle to `"Make wide"` across all 8 sections.
  - For hero variants, content now stays anchored at the **original host-container x-position** when wide is on — only the background stretches. Implementation: each hero IIFE measures `parent.getBoundingClientRect().left + parent.paddingLeft` at init and on resize, sets it on the section as `--ns-fb-offset` CSS variable, and the `.is-full .ns-slide` rule increases padding-left/right by that offset. Verified with side-by-side compare in a 800px host container at 1920px viewport: title and logo `x` delta = 0 px between non-wide and wide variants.
  - Other sections (content/products/placeholder/tabs/break/logos) already use `margin: 0 auto` centered inner wrappers, so background stretch alone keeps content anchored to viewport center, matching the original centered-container position.

- **2026-04-30 (post-iter-2 #2)**: Hero title misaligned in nettailer + need full-width option.
  - Added `fullBleed` toggle to all 8 sections. When enabled, root section gets `is-full` class which applies `width: 100vw; margin-left: calc(50% - 50vw)` to break out of the host's content container.
  - Hardened `baseReset` with `!important` on the highest-risk bleed properties: `padding`, `text-indent`, `text-transform`, `text-align`, `font-family`, `list-style`. Hosts that style `h1/h2/p` with `padding-left` or `text-indent` (e.g. nettailer) were offsetting our titles relative to other content.
- **2026-04-30 (post-iter-2 #1)**: CMS save/edit re-init bug. Replaced DOM-attribute init guard (`data-ns-init`) with a JS-only property (`root.__nsInit`). Persisted attributes were causing already-initialised sections to skip re-init when CMSs serialise the live DOM and re-render on edit, killing arrows/dots/autoplay. Also added `go(0)` reset on init for both hero variants and tabs (resets visual state if CMS persisted runtime `is-active` classes), and tagged logo-strip originals with `data-ns-original` so the seamless-loop padding can't compound across save/edit cycles.

## Backlog
- P1: Page-builder mode (stack multiple sections in one canvas with reorder + bulk export)
- P2: Save/load named templates (localStorage)
- P2: Theme presets (light/dark/vivid)
- P2: Section duplication (clone an existing section as a starting point)
- P3: `/api/health` exposing storage init status
- P3: Refresh storage_key automatically on 401
