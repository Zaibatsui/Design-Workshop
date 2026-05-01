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

## Bug fixes / Features
- **2026-05-01 (Branding + UX polish — Design Workshop)**:
  - Renamed app from "Section Builder" to **Design Workshop** with the Zaibatsu Labs caption. Centralized in `frontend/src/lib/brand.js` (single source of truth — name, short name, icon, container class).
  - Brand mark switched from `Sparkles` icon to Lucide's **`PencilRuler`** — semantic match for "design workshop" (crossed pencil + ruler is the classic design-tool glyph).
  - Browser tab title set to "Design Workshop · Zaibatsu Labs".
  - **Login page restyled** to match the dashboard: white background, subtle dot grid, soft red+slate radial glows, white card with shadow, dark "Sign in with Google" button (was a dark-themed glassmorphism login that didn't match the rest of the app).
  - **Dashboard pagination**: page size 9, classic numbered pagination at the bottom (`< 1 2 ... 5 6 >` with first/last always shown and ±1 around current). "Showing X–Y of N" counter on the left. Auto-snaps back if a delete leaves you past the last page. Uses brand red for the active page chip.
  - Header now shows the brand box + "Design Workshop" + "ZAIBATSU LABS" caption (hidden on mobile).
  - Verified end-to-end: 12 seeded sections → page 1 shows 9, page 2 shows 3, prev/next + numbered chips all work, header + login both rebranded.

- **2026-05-01 (Phase 1 — Auth + Persistence + Dashboard)**:
  - Added Emergent-managed Google OAuth via the official playbook. `/api/auth/session` exchanges `session_id` for a 7-day httpOnly cookie + DB session; `/api/auth/me` returns current user; `/api/auth/logout` clears both. Cookie is `secure=true; samesite=none; httponly=true; path=/`. CORS_ORIGINS pinned to the frontend URL (was `*`) so credentialed requests work.
  - **MongoDB collections**: `users` (custom `user_id` UUID), `user_sessions` (token + 7-day expiry), `sections` (per-user persistent snippet configs).
  - **Sections CRUD** at `/api/sections` (list/create/get/update/delete) — all scoped by `user_id` from the authenticated session.
  - **Frontend rebuild**: react-router-dom v7 with three routes — `/login` (Google sign-in screen), `/` (Dashboard, protected), `/edit/section/:sectionId` (Editor, protected). `AuthProvider` + `ProtectedRoute` + `AuthCallback` per playbook (synchronous `session_id` detection in render to prevent race conditions; `useRef` flag in callback for StrictMode safety; AuthProvider skips `/auth/me` when `#session_id=` is present).
  - **Dashboard** — header w/ avatar + sign-out, "+ New section" button (Page button greyed-out for now), grid of saved sections each rendered as a live mini-iframe thumbnail (16:9 letterbox, `transform: scale(0.30)`) with name + type icon + "Edited X ago", hover-only delete button, empty state with primary CTA. Modal section picker shows all 9 section types as tiles.
  - **Editor** — loads section by ID, renders with the section's persisted config, **debounced 1.5s autosave** on every config or name change, "Saving…/Saved just now" indicator in the header. Inline-editable section name (`<Input>` styled flat). Back-to-dashboard link in the form sidebar header. Reset confirmation. The old localStorage-only multi-section state was removed — the editor is now strictly single-section per route.
  - **Verified end-to-end** with a seeded test session (see `/app/memory/test_credentials.md`): unauthed lands on /login, cookie injection yields dashboard with avatar, "+ New section" → picker → "Hero" creates a record and routes to its editor, renaming triggers autosave (visible "Saved just now"), back navigates to dashboard with the new card showing a live rendered hero preview thumbnail.

## Sections implemented (2026-05-01 consolidation)
1. **Hero** — unified hero with `transition: slide | fade` switch; replaces the old two hero sections
2. **Content Block** — heading + optional body + optional primary/secondary buttons; replaces the old Content Heading + Account CTA
3. **Product Carousel** — 4 or 5 columns, prev/next arrows, hover border accent, live price refresh for scraped products
4. **Resource Carousel** — horizontal scroll of blog / case study cards with image + tag + title
5. **Insights Grid** — 2/3-col icon + text + link cards with left accent border
6. **Grid (Placeholder)** — N items × M columns of placeholder boxes with image + link per cell
7. **Logo Strip** — auto-scrolling infinite logo bar with seamless loop padding
8. **Break Banner** — full-width bg image + overlay + centered heading
9. **Tabs Section** — toggle buttons + split image+copy panels

Total: 9 sections (down from 11).

## Test status
- iter 2: testing_agent_v3 → **100% backend, 100% frontend** across all 8 sections including style-isolation against hostile host CSS, multi-instance safety, copy fidelity, live preview, reset.

## Bug fixes
- **2026-04-30 (improvements — LIVE badge, hi-res images, equal-height cards)**:
  - **LIVE badge in editor preview**: Cards with `data-ns-src` (fetched products with live refresh) now show a small green "LIVE" ribbon top-left in the editor's preview iframe. The badge CSS lives only in `previewDoc()` — the copied snippet does NOT include it.
  - **Hi-res Cnet Cloud images**: The headless-browser fallback now reads the gallery wrapper's `data-src` attribute (`.ccs-fancybox-gallery[data-src]`) before falling back to the visible `<img src>`. Result: Nettailer Surface Pro image jumped from 400×300 thumbnail to 2400×1800 (6× resolution) — crisp on retina displays.
  - **Equal-height cards / aligned prices**: `.ns-track` is now `align-items:stretch`, `.ns-card` and `.ns-card a` are flex columns, `.ns-name` has `min-height:42px` (2 lines reserved), and `.ns-price` uses `margin:auto 0 0` to pin to the bottom. Result: prices line up across all cards in the carousel regardless of how many lines the product name wraps to.

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
- **P1: Hybrid Page Builder** — *captured 2026-05-01*
  - Keep the existing per-section snippet workflow (users will still copy individual section HTML to drop into Nettailer/CMS pages)
  - Add a separate "Page" mode where users assemble a full landing page from:
    1. Structured sections from the registry (Hero, Products, Insights, etc.) — with their existing config UIs
    2. **Free content blocks** between/within structured sections — for arbitrary copy, images, dividers, embeds, raw HTML escape hatch
  - Drag-to-reorder; per-page export to one consolidated snippet (single CSS bundle, IIFEs preserved per section, single `<style>` + multiple `<div>` outputs)
  - Open question: rich-text editor (Tiptap?) vs markdown vs raw HTML for free content blocks. Will revisit when building.
  - This is intentionally **additive** — the existing single-section editor stays exactly as-is.
- P2: Save/load named templates (localStorage)
- P2: Theme presets (light/dark/vivid)
- P2: Section duplication (clone an existing section as a starting point)
- P2: Section picker overlay with live mini-previews (nice-to-have alongside Page Builder)
- P3: `/api/health` exposing storage init status
- P3: Refresh storage_key automatically on 401
