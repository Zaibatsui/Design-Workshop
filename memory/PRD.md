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
- Tighter `BlockIn` pydantic validation (reject `richtext` with no html, `section` with no section_type).
- Rename `data-testid="section-card-name"` / `page-card-name` → `...-title` to avoid prefix-selector shadowing during Playwright automation. **(done)**
- Drop the legacy top-level `BlockIn.html` field once all documents have migrated to `config.html`. **(done)**
- Batch the N-updateOne reorder loop into `bulk_write(UpdateOne...)` for perf + atomicity. **(done)**
- Page templates: one-click "Landing page" / "Product detail" / "Category hub" starters. **(done)**
- More page templates (e.g. "About us", "Pricing", "Blog post") as the catalogue grows.
- Custom user-authored templates (save current page as a template for future reuse).

**P0 security / operations**
- User must rotate their Google Client Secret in Google Cloud Console (it was pasted in plaintext in an earlier chat).

## Testing
- Backend pytest suite at `/app/backend/tests/` (test_pages.py covers Pages CRUD + regressions).
- Latest test agent iteration: `/app/test_reports/iteration_3.json` — backend 100%, frontend 80% (only an automation-time navigation race noted; product verified working).

## Test credentials
See `/app/memory/test_credentials.md` — OAuth-only, uses pre-minted session tokens pulled from MongoDB for automated tests.
