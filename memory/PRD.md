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

## Roadmap / Backlog
**P1**
- (done) Hybrid Page Builder.

**P2**
- Section duplication: clone an existing section from the dashboard as a starting point.
- Page duplication: clone an existing page as a starting point.
- Dashboard drag-and-drop reordering (for sections and pages).
- Server-side richtext HTML sanitization (bleach/nh3) before persistence — currently we trust the tiptap output schema; defense-in-depth since the same HTML round-trips into a snippet.
- Tighter `BlockIn` pydantic validation (reject `richtext` with no html, `section` with no section_type).
- Refactor `server.py` (~900 lines) into routers: `auth`, `sections`, `pages`, `scraper`.
- Split `Dashboard.jsx` (617 lines) into `SectionsTab` / `PagesTab` sub-components as it grows.

**P0 security / operations**
- User must rotate their Google Client Secret in Google Cloud Console (it was pasted in plaintext in an earlier chat).

## Testing
- Backend pytest suite at `/app/backend/tests/` (test_pages.py covers Pages CRUD + regressions).
- Latest test agent iteration: `/app/test_reports/iteration_3.json` — backend 100%, frontend 80% (only an automation-time navigation race noted; product verified working).

## Test credentials
See `/app/memory/test_credentials.md` — OAuth-only, uses pre-minted session tokens pulled from MongoDB for automated tests.
