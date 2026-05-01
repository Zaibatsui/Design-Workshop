# Design Workshop — Product Requirements

**Owner:** Zaibatsui Labs
**Product:** Design Workshop — a WYSIWYG section & page builder that produces self-contained HTML/CSS/JS snippets for embedding into external e-commerce sites (Nettailer and similar).

## Original problem statement
Users need to author reusable content sections that drop into their live e-commerce pages with zero host-site bleed (scoped CSS, multi-instance-safe JS, no framework runtime). Sections must optionally auto-fetch live product metadata from product URLs (price, image, name) and keep prices fresh on the embedding host via lightweight per-snippet JS. Authoring is backed by a persistent per-user library stored in MongoDB, protected by direct Google OAuth.

## Core capabilities (built)
- Direct Google OAuth (Authlib + SessionMiddleware) with a `ForwardedHostMiddleware` fix for behind-ingress HTTPS termination.
- 9-section WYSIWYG editor with autosave, live preview, desktop/tablet/mobile viewport switcher, and copy-to-CMS HTML snippet export.
- Section types: Hero (slide/fade), Content, Products, Insights, Resources, Logos, Break banner, Tabs, Placeholder.
- Product scraper with BeautifulSoup4 + Playwright-headless fallback for JS-rendered e-commerce pages (Cnet Cloud, 1WorldSync). Injects an auto-refreshing price IIFE into exported snippets.
- Persistent per-user dashboard with tabs (Sections / Pages), uniform 20:9 thumbnail cards, pagination, Google profile header.
- **Hybrid Page Builder (2026-05-01)**: top-level Pages entity with drag-and-drop block stacking (section blocks + rich-text tiptap blocks), library-section snapshot insertion, live preview, and single-snippet export with deduped Poppins @import.

## Architecture
- **Frontend**: React + React Router, Tailwind CSS, Shadcn UI. Key pages: `Dashboard`, `Editor` (sections), `PageEditor` (pages). Blocks composed via `sections/pageSnippet.js`.
- **Backend**: FastAPI + Motor (MongoDB async). Direct Google OAuth via Authlib. Object storage via Emergent integrations. Custom `ForwardedHostMiddleware` rewrites ASGI scope `server`/`scheme` from X-Forwarded-Host/Proto so OAuth `redirect_uri` matches the external hostname (fixes the k8s-ingress/Cloudflare split-host bug).
- **DB collections**: `users`, `user_sessions`, `sections`, `pages`.
- **API prefix**: `/api`. Full endpoints documented in `/app/backend/server.py`.

## Completed features (with dates)
- 2025-**: 9-section WYSIWYG, autosave editor, product scraper with live price refresh, uniform dashboard thumbnails.
- 2026-**: Merged Hero Slide/Fade into one Hero type; merged CTA into Content; Cnet Cloud Playwright fallback; rebrand to "Design Workshop" / "Zaibatsui Labs"; 20:9 thumbnail grid; migrated from Emergent Google Auth to Direct Google OAuth via Authlib.
- 2026-05-01: **OAuth redirect_uri_mismatch fixed** via `ForwardedHostMiddleware` (rewrites scope.server + Host header from X-Forwarded-Host).
- 2026-05-01: **Hybrid Page Builder** shipped — Pages entity, `/api/pages` CRUD, dashboard tabs, `PageEditor` with drag-and-drop via @dnd-kit, tiptap rich-text blocks, library-section snapshot insertion, single-snippet export.
- 2026-05-01: **P2 batch** — section & page duplication endpoints (`POST /api/{sections,pages}/{id}/duplicate`), dashboard card drag-and-drop reordering with `position` field + `PUT /api/{sections,pages}/reorder/bulk`, server-side richtext HTML sanitization via `bleach` (strips `<script>`, event handlers, `javascript:` URLs, limits protocols to http/https/mailto), backend refactored from ~900-line `server.py` into `db.py` / `deps.py` / `storage.py` + `routers/{auth,sections,pages,uploads,scraper}.py` (slim `server.py` ~130 lines), frontend `Dashboard.jsx` split into `SectionsTab` / `PagesTab` / `dashboard/common.jsx`.
- 2026-05-01: Dropped legacy top-level `BlockIn.html` field (migrated 1 page's 3 null-value blocks; removed from schema + normalizer). Renamed `data-testid=section-card-name`/`page-card-name` → `...-title`.
- 2026-05-01: Bulk-write reorder — `PUT /api/{sections,pages}/reorder/bulk` now issues a single `bulk_write(UpdateOne..., ordered=False)` instead of N sequential `update_one` calls.
- 2026-05-01: **Page templates** — 7 built-in templates (Blank, Landing, Product detail, Category hub, About us, Pricing, Blog post). Template picker modal opens on "New page" click. **Save as template** via `POST /api/page-templates` stores a user-scoped snapshot (block_ids stripped); DELETE + LIST endpoints round out the CRUD; custom templates surface alongside built-ins in the picker.
- 2026-05-01: **Richtext passthrough** — server-side bleach sanitization REMOVED at user request. `<script>`, `<iframe>`, inline handlers, `javascript:` URLs are now persisted and rendered verbatim. Block editor gets a **Visual / HTML Source** mode toggle with a raw-HTML textarea in source mode.
- 2026-05-01: **Block names** — every block has an optional `name` field editable at the top of the block drawer; sidebar shows the custom name when set, falling back to the type label.
- 2026-05-01: **PageEditor layout v2** — PageRail now hosts togglable "Blocks" / "Pages" tabs (with count badges); BlockEditorDrawer relocated from right sidebar to LEFT side of the canvas (mirrors Section Editor UX). EmptyBlockEditor placeholder when no block selected. Footer rail action mirrors active tab (Add block ↔ New page). Validated 14/14 in iteration_8.json.
- 2026-05-01: **Editor improvements batch** — (a) Content max width default 820→1200 across content.js, hero.js (contentMaxWidth), richtext.js, RichTextBlockForm.jsx; (b) Product Carousel new sections start with empty `products[]` (removed NETTAILER_PRODUCTS demo array); (c) Content Block migrated from primary+secondary button pair to unbounded `buttons[]` array with ListEditor (label/url/variant/openInSameTab) — legacy configs auto-migrated via normalizeButtons() back-compat; (d) Logo Strip defaults now use the user's uploaded logos (Netset/ATEA/B2B/Misco/Tibco/DCB/Abero); fixed broken auto-scroll by adding `data-ns-original` attribute on rendered items (the JS query was returning empty + early-returning before this); (e) Pristine new=1 drafts (sections + pages) auto-delete on navigate-away — StrictMode-safe via module-level PENDING_DRAFT_DELETES map with 250ms deferred delete that gets cancelled on re-mount. Validated 5/5 in iteration_9.json.
- 2026-05-01: **Google Client Secret rotated** — old secret (compromised by chat paste) rotated; new GOCSPX-…Rhnqn-R written to backend/.env, backend restarted. User instructed to delete the old secret from Google Cloud Console after smoke-testing login.

## Roadmap / Backlog
**P1**
- (done) Hybrid Page Builder.

**P2**
- (done) Section duplication.
- (done) Page duplication.
- (done) Dashboard drag-and-drop reordering (sections + pages).
- (done) Server-side richtext HTML sanitization (bleach).
- (done) Refactor `server.py` into routers; split `Dashboard.jsx` into SectionsTab/PagesTab.

**P3 / future**
- Tighter `BlockIn` pydantic validation **(done)**
- Apply library-rail pattern to `PageEditor.jsx` **(done)**
- Split `PageEditor.jsx` (~907 → 405 lines + 7 focused sub-components) **(done)**
- PageEditor layout v2 (Blocks/Pages tabs in rail + drawer-on-left) **(done 2026-05-01)**
- Extract `BlockIn` to `/app/backend/models/blocks.py` and remove the cross-router import smell.
- Custom templates preview thumbnails in the picker.
- Auth-gate `POST /api/scrape-product` (currently public — pre-existing).
- Inline rename of library-rail rows (double-click).
- Esc-to-close on BlockAdder + PageTemplatePicker modals.
- Migrate Save-as-template `window.prompt` to a shadcn Dialog.
- Extract EmptyBlockEditor into `/pages/page-editor/EmptyBlockEditor.jsx` for symmetry with BlockEditorDrawer.
- Split PageRail.jsx (563 lines, approaching 700-line cap) — move BlocksList/BlockRow/CollapsedBlockIcon/PagesList into `/pages/page-editor/rail/`.
- Global error boundary + reload-toast for HMR/timeout failures.

**P0 security / operations**
- User must rotate their Google Client Secret in Google Cloud Console (it was pasted in plaintext in an earlier chat).

## Testing
- Backend pytest suite at `/app/backend/tests/` (test_pages.py covers Pages CRUD + regressions).
- Latest test agent iteration: `/app/test_reports/iteration_3.json` — backend 100%, frontend 80% (only an automation-time navigation race noted; product verified working).

## Test credentials
See `/app/memory/test_credentials.md` — OAuth-only, uses pre-minted session tokens pulled from MongoDB for automated tests.
