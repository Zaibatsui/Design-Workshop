<div align="center">

# Design Workshop

**A modular WYSIWYG editor that exports self-contained HTML/CSS/JS snippets you can paste into any e-commerce site.**

Build reusable Hero blocks, Product carousels, Logo strips, Tabs, FAQs and more — colour-themed via a Brand Kit, drag-stacked into Pages, then dropped into Nettailer / Shopify / WooCommerce / your custom CMS as one inert HTML blob. No React, no jQuery, no CDN calls at runtime. Just markup.

[Features](#features) · [Architecture](#architecture) · [Quick start (local)](#local-development) · [Deploy on Proxmox](deploy/PROXMOX-INSTALL.md) · [User guide](#user-guide)

</div>

---

## What it is

A persistent per-user library + page builder for **content people who ship to real e-commerce sites** but don't want their CMS's locked-down section editor. You compose sections with a live preview, theme them with a Brand Kit, then click "Copy snippet" and paste the resulting standalone HTML into any rich-text-source field that allows raw markup.

The output is **strictly inert** — scoped CSS classes (one unique class per instance, never collides with the host site's styles), an optional tiny IIFE per section for things like carousels and accordions, no global JavaScript dependencies. Drops into Nettailer's raw-HTML widget the same way it drops into a Shopify rich-text block or a Squarespace code block.

## Features

### Section library — 14 composable building blocks

| Block | What it does |
|---|---|
| **Hero** | Slide / fade carousel, full-bleed background, headline, subtitle, CTA. Per-slide colour overrides. |
| **Content** | Heading + body + buttons. The all-purpose marquee block. |
| **Product Carousel** | Card carousel with image, name, price, hover-tinted border. Optional product URL scraping with auto-refreshing prices on the host site. |
| **Insights Grid** | Editorial 2–3 column card grid for articles & case studies. |
| **Resource Carousel** | Tag-tinted card carousel — blog posts, guides, downloads. |
| **Feature Grid** | 2–4 column value-prop cards with icon, title, body. Outlined / tinted / solid card styles. |
| **Steps** | Numbered process strip. Horizontal or vertical, big editorial numerals or compact inline. |
| **FAQ** | Collapsible Q+A accordion. Native `<details>` / `<summary>` for zero-JS accessibility. |
| **CTA Banner** | Final-call conversion block — eyebrow + headline + subhead + 1 or 2 buttons. |
| **Logo Strip** | Auto-scrolling marquee. Per-image links + greyscale-until-hover toggle. |
| **Break Banner** | Full-bleed parallax break with overlaid heading. Use it to chapter long pages. |
| **Tabs** | Tabbed content panel with a side image. Configurable tab alignment + image position. |
| **Grid** | 2×2 / 2×3 image grid with optional links per cell. |
| **Rich text** | Tiptap-powered freeform copy block — used inside Pages for ad-hoc paragraphs between structural sections. |

### Hybrid Page Builder

Stack reusable sections + ad-hoc rich-text blocks into a single page. Drag to reorder. Save any page as a custom template. Export the whole page as one combined snippet — order in the snippet matches the rail's vertical order.

### Brand Kit

Single source of truth for primary / secondary / text / background colours and heading + body fonts (12 curated Google fonts or "Inherit from site"). One click re-skins existing sections without touching their content. "Inherit from site" ships the snippet without a font import — the host page's typography wins.

### Live, dynamic previews

Every section editor and the page editor render the **actual exported snippet** inside a sandboxed iframe and shrink-wrap it to the available viewport using `IntersectionObserver` + `ResizeObserver`. The dashboard uses a masonry layout (variable card heights, no ragged whitespace) with deferred rendering — only visible cards run their snippet JS.

### Marketing landing page + admin-curated demo

The login page (`/login`) doubles as a public marketing site explaining the tool. Admins can pick any of their pages as the **scroll-triggered live demo** that visitors see, configurable from `/brand`.

### In-app user guide

Long-form documentation at `/guide` with a scroll-spy table of contents, organised by user goal rather than feature taxonomy.

## Architecture

```
                          ┌─────────────────────────────────────────────┐
   browser ──► reverse ──►│  frontend (nginx)                           │
                proxy     │  ├── /         → built React SPA             │
                (TLS)     │  └── /api/*    ──► backend (uvicorn 8001)    │
                          │                       ├── mongo:4.4          │
                          │                       └── /var/uploads (vol) │
                          └─────────────────────────────────────────────┘
```

- **Frontend** — React + React Router + Tailwind + Shadcn UI + Tiptap. Deferred-rendered sandboxed-iframe previews. Production build served as static files via nginx.
- **Backend** — FastAPI + Motor (async MongoDB). Direct Google OAuth via Authlib + a custom `ForwardedHostMiddleware` that rewrites the ASGI scope from `X-Forwarded-Host` / `X-Forwarded-Proto` so OAuth `redirect_uri` resolves to the public hostname even behind a Cloudflare / k8s-ingress / nginx-proxy split-host setup.
- **Storage** — pluggable. Defaults to a local filesystem volume (`/var/uploads`) for self-hosted deployments; auto-switches to Emergent hosted object storage when `EMERGENT_LLM_KEY` is set (used by the preview environment).
- **Database** — MongoDB. The compose stack pins **mongo:4.4** so it runs on CPUs without AVX support (older Xeons / Atoms / homelab Proxmox hosts).

### Self-contained snippet generation

Every section's `render(config)` function emits a `{ html, css, js }` triple wrapped by `wrapSnippet()`. The CSS class is suffixed with a per-instance UID so two copies of the same section never collide. The IIFE — when one's needed — captures its scope to its own root element. Output is **architecturally incapable** of leaking styles to the host site.

```html
<!-- exported snippet shape -->
<style>.ns-hero-Ab1cD2{ /* …scoped to this UID… */ }</style>
<section class="ns-hero ns-hero-Ab1cD2"> … </section>
<script>(function(){ var root=document.querySelector(".ns-hero-Ab1cD2"); /* … */ })();</script>
```

### Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, React Router, Tailwind CSS, Shadcn UI, Tiptap, Motion (one) |
| Backend | FastAPI, Motor (MongoDB), Authlib (OAuth 2.0), bleach (richtext sanitisation), BeautifulSoup4 + Playwright (product scraper fallback) |
| Database | MongoDB 4.4 (AVX-free) |
| Storage | Local filesystem volume **or** Emergent hosted object store |
| Auth | Direct Google OAuth (not via an intermediate identity provider) |
| Deploy | Docker Compose · nginx · Microsoft Playwright Python image |

## Project structure

```
.
├── backend/                     # FastAPI app
│   ├── server.py                # ~140 lines: middleware wiring, router includes
│   ├── db.py                    # Motor client + `db` singleton
│   ├── deps.py                  # get_current_user / require_admin
│   ├── storage.py               # dual-mode: local fs OR Emergent
│   ├── routers/
│   │   ├── auth.py              # /api/auth/google/{login,callback,logout,me}
│   │   ├── sections.py          # /api/sections CRUD + duplicate + reorder
│   │   ├── pages.py             # /api/pages CRUD + duplicate + reorder
│   │   ├── page_templates.py    # custom user templates
│   │   ├── uploads.py           # /api/upload + /api/files/{path}
│   │   ├── brand_kit.py         # /api/brand-kit
│   │   ├── landing_demo.py      # /api/{public/,}landing-demo
│   │   └── scraper.py           # /api/scrape-product
│   ├── tests/                   # pytest + requests integration suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               # Dashboard, Editor, PageEditor, BrandKit, Login, UserGuide
│   │   ├── pages/login/         # Marketing sub-components (Hero, FAQ, LiveDemo, …)
│   │   ├── pages/dashboard/     # SectionsTab, PagesTab, common, RecentStrip
│   │   ├── pages/page-editor/   # PageRail, BlockEditorDrawer, SaveIndicator, …
│   │   ├── components/          # Shared FormFields, ImageUpload, ListEditor, ErrorBoundary
│   │   ├── components/ui/       # Shadcn primitives
│   │   ├── sections/            # registry.js + 14 section modules + iconLib + shared helpers
│   │   ├── lib/                 # api client, BrandKitContext, brand colours
│   │   └── auth/                # AuthContext + startLogin
│   └── package.json
├── deploy/                      # Self-host artefacts
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   ├── README.md
│   ├── PROXMOX-INSTALL.md       # ←  step-by-step SSH walkthrough
│   └── scripts/                 # mongodump/restore + uploads migration
├── docker-compose.yml
└── README.md                    # this file
```

## Local development

The repository ships with a Kubernetes-style preview environment in mind, but the same code runs on any Linux box.

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium                # one-off, for the scraper fallback

cp .env.example .env                        # set MONGO_URL, DB_NAME, GOOGLE_*
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (in a second shell)
cd frontend
yarn install
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
yarn start                                  # http://localhost:3000
```

**Mongo locally**: `docker run -d --name dw-mongo -p 27017:27017 mongo:4.4`

**OAuth locally**: register `http://localhost:8001/api/auth/google/callback` as an authorised redirect URI on your Google OAuth client, then sign in via `http://localhost:3000/login`.

### Running the test suite

```bash
cd backend
# Mint a session token from your local mongo, then:
export TEST_SESSION_TOKEN=<paste session_token from user_sessions collection>
export REACT_APP_BACKEND_URL=http://localhost:8001
pytest tests/ -v
```

## Production deployment

**TL;DR — Proxmox / Docker / single host**: see [`deploy/PROXMOX-INSTALL.md`](deploy/PROXMOX-INSTALL.md) for the full SSH walkthrough.

The short version:

```bash
git clone https://github.com/<you>/<repo>.git design-workshop
cd design-workshop
cp deploy/.env.example deploy/.env
${EDITOR} deploy/.env
docker compose --env-file deploy/.env up -d --build
```

- One published port (`${PUBLIC_PORT}` → frontend nginx, default 8080).
- Mongo runs on the internal docker network only, never reachable from the host.
- Uploads persist in a named docker volume; back it up with `docker run --rm -v <stack>_uploads-data:/src ...`.
- TLS terminates on your existing reverse proxy (Caddy / NPM / Traefik / nginx). The internal nginx honours `X-Forwarded-Proto` / `X-Forwarded-Host` so OAuth callbacks resolve to the public hostname.

See [`deploy/README.md`](deploy/README.md) for reverse-proxy snippets, day-2 ops, and migration scripts (mongodump → mongorestore + URL-rewriting upload sync from a previous environment).

## User guide

The in-app guide at `/guide` is the canonical reference once you're signed in. Highlights:

- **Everything autosaves** — there is no Save button. Edits persist the moment focus leaves the field.
- **One section is one snippet** — sections are reusable. Pages are stacks of (section snapshot OR rich text) blocks; one page export is one combined snippet.
- **Brand Kit overlays brand fonts + colours onto an existing section** without touching its content (your products, slides, copy stay intact).
- **Custom templates** — save any page as a template; future pages can spawn from it.

## Status

Single-tenant. Authentication is Direct Google OAuth — every user gets their own private library. The `/brand` page (Live Demo picker) and admin-only routes are gated to a single admin email configured in `backend/deps.py::ADMIN_EMAILS`.

## Licence

Source-available. Pick a licence that suits your situation; the canonical recommendations for self-hosted productivity tools are [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) (copyleft) or [PolyForm Noncommercial](https://polyformproject.org/licenses/noncommercial/1.0.0/) (no commercial competition). Drop a `LICENSE` file at the repo root with whichever you choose.

## Acknowledgements

Built on top of FastAPI, React, Tailwind, Shadcn UI, Tiptap, and the Lucide icon set. The product-scraper fallback uses Playwright. Self-host packaging targets MongoDB 4.4 specifically because **a lot of perfectly serviceable hardware** doesn't have AVX — and there's no good reason to make CPUs from before 2013 obsolete just because Mongo's release engineers needed a vector instruction set.
