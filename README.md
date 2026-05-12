<div align="center">

# Design Workshop

**A modular WYSIWYG editor that exports self-contained HTML / CSS / JS snippets you can paste into any e-commerce site.**

Build reusable Hero blocks, Product carousels, Logo strips, Tabs, FAQs and more — colour-themed via a Brand Kit, drag-stacked into Pages, then dropped into Nettailer / Shopify / WooCommerce / your custom CMS as one inert HTML blob. No React, no jQuery, no CDN calls at runtime. Just markup.

[Why this exists](#why-this-exists) · [Features](#features) · [Architecture](#architecture) · [Local development](#local-development) · [Self-hosted production](#production-deployment)

</div>

---

## Why this exists

Locked-down CMS section editors are fine until they aren't. You can't ship a really good Hero, your product carousel needs a hover detail their widget won't give you, and the marketing team wants brand-consistent typography across pages that the CMS template doesn't expose.

Design Workshop is a persistent, per-user library and page builder for **content people who ship to real e-commerce sites**. Compose sections with a live preview, theme them with a Brand Kit, then click **Copy snippet** and paste the resulting standalone HTML into any rich-text source field that allows raw markup.

The output is **strictly inert** — scoped CSS classes (one unique class per instance, never collides with the host site's styles), an optional tiny IIFE per section for carousels and accordions, no global JavaScript dependencies, no fetch on render. Drops into Nettailer's raw-HTML widget the same way it drops into a Shopify rich-text block or a Squarespace code block.

## Features

### Section library — 16 composable building blocks

| Block | What it does |
|---|---|
| **Hero** | Slide / fade carousel, full-bleed background, headline, subtitle, CTA. Per-slide colour overrides. |
| **Welcome** | Post-login banner with positionable heading, customer logo and account-manager card. Each block snaps to one of nine grid positions so one section serves many brands. |
| **Content** | Heading + body + buttons. The all-purpose marquee block. |
| **Product Carousel** | Card carousel with image, name, price, hover-tinted border. Optional product-URL scraping (BeautifulSoup4 + Playwright fallback) auto-fills name / price / image, with overlay-badge extraction. |
| **Insights Grid** | Editorial 2–3 column card grid for articles & case studies. |
| **Resource Carousel** | Tag-tinted card carousel — blog posts, guides, downloads. |
| **Feature Grid** | 2–4 column value-prop cards with icon, title, body. Outlined / tinted / solid card styles. |
| **Steps** | Numbered process strip. Horizontal or vertical, big editorial numerals or compact inline. |
| **Testimonials** | Auto-scrolling quote carousel with avatars + 0–5 star ratings. Pauses on hover, respects `prefers-reduced-motion`. |
| **FAQ** | Collapsible Q+A accordion. Native `<details>` / `<summary>` for zero-JS accessibility. |
| **CTA Banner** | Final-call conversion block — eyebrow + headline + subhead + 1 or 2 buttons. |
| **Logo Strip** | Auto-scrolling marquee. Per-image links + greyscale-until-hover toggle. |
| **Break Banner** | Full-bleed parallax break with overlaid heading. Use it to chapter long pages. |
| **Tabs** | Tabbed content panel with a side image. Configurable tab alignment and image position. |
| **Grid** | 2×2 / 2×3 image grid with optional links per cell. |
| **Rich text** | Tiptap-powered freeform copy block — used inside Pages for ad-hoc paragraphs between structural sections. |

### Hybrid Page Builder

Stack reusable sections plus ad-hoc rich-text blocks into a single page. Drag to reorder. Save any page as a custom template. Export the whole page as one combined snippet — order in the snippet matches the rail's vertical order. Seven page templates ship out of the box.

### Brand Kit

Single source of truth for primary / secondary / text / background colours, heading + body fonts (12 curated Google fonts or "Inherit from site"), and a default eyebrow text + colour. One click re-skins every existing section without touching their content. "Inherit from site" ships the snippet without a font import — the host page's typography wins.

### Live previews everywhere

Every section editor and the page editor render the **actual exported snippet** inside a sandboxed iframe. The section preview frame is drag-resizable per section type and persists your preference in `localStorage`. The dashboard masonry deferred-renders cards so only visible thumbnails run their snippet JS.

### Marketing landing page · admin-curated demos

The login page (`/login`) doubles as a public marketing site. From `/brand`, admins can curate:

- **Live demo** — one of their saved pages that visitors see scrolling live inside a sandboxed iframe with browser chrome.
- **Spotlights** — two of their saved sections rendered as tilted "highlight" cards with auto-derived headlines and blurbs.

### Hardened against XSS

Every user-facing config value passes through one of: `escHtml` (text), `escAttr` (attributes), `safeUrl` (links / images — blocks `javascript:`, `vbscript:`, `data:text/html`, etc.), `safeColor` (CSS colour values — whitelist hex / rgb / hsl / keywords), or `num` (numeric coercion). The snippets generated are architecturally incapable of leaking styles to the host site or executing attacker-supplied scripts via colour / URL / numeric form fields.

### In-app user guide

Long-form documentation at `/guide` with a scroll-spy table of contents, organised by user goal rather than feature taxonomy.

## Architecture

```
                          ┌─────────────────────────────────────────────┐
   browser ──► reverse ──►│  frontend (nginx)                            │
                proxy     │  ├── /         → built React SPA              │
                (TLS)     │  └── /api/*    ──► backend (uvicorn 8001)     │
                          │                       ├── mongo:4.4           │
                          │                       └── /var/uploads (vol)  │
                          └─────────────────────────────────────────────┘
```

- **Frontend** — React + React Router + Tailwind + Shadcn UI + Tiptap. Deferred-rendered sandboxed-iframe previews. Production build served as static files via nginx.
- **Backend** — FastAPI + Motor (async MongoDB). Direct Google OAuth via Authlib + a custom `ForwardedHostMiddleware` that rewrites the ASGI scope from `X-Forwarded-Host` / `X-Forwarded-Proto` so OAuth `redirect_uri` resolves to the public hostname even behind a Cloudflare / k8s-ingress / nginx-proxy split-host setup.
- **Storage** — pluggable. Local filesystem volume (`/var/uploads`) by default; swap `backend/storage.py` to point at S3 / R2 / B2 without touching upload routes.
- **Database** — MongoDB. Pinned to **mongo:4.4** so it runs on CPUs without AVX support (older Xeons / Atoms / homelab Proxmox hosts).

### Self-contained snippet generation

Every section's `render(config)` function emits a `{ html, css, js }` triple wrapped by `wrapSnippet()`. The CSS class is suffixed with a per-instance UID so two copies of the same section never collide. The IIFE — when one's needed — captures its scope to its own root element.

```html
<!-- exported snippet shape -->
<style>.ns-hero-Ab1cD2{ /* …scoped to this UID… */ }</style>
<section class="ns-hero ns-hero-Ab1cD2"> … </section>
<script>(function(){ var root=document.querySelector(".ns-hero-Ab1cD2"); /* … */ })();</script>
```

### Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, React Router, Tailwind CSS, Shadcn UI, Tiptap, Lucide |
| Backend | FastAPI, Motor (MongoDB), Authlib (OAuth 2.0), BeautifulSoup4 + Playwright (product-scraper fallback) |
| Database | MongoDB 4.4 (AVX-free) |
| Storage | Local filesystem volume (pluggable) |
| Auth | Direct Google OAuth (no intermediate identity provider) |
| Deploy | Docker Compose · nginx · Microsoft Playwright Python image |

## Project structure

```
.
├── backend/
│   ├── server.py                # ~140 lines: middleware wiring, router includes
│   ├── db.py                    # Motor client + `db` singleton
│   ├── deps.py                  # get_current_user / require_admin / ADMIN_EMAILS
│   ├── storage.py               # local-fs object storage (pluggable)
│   ├── routers/
│   │   ├── auth.py              # /api/auth/google/{login,callback,logout,me}
│   │   ├── sections.py          # /api/sections CRUD + duplicate + reorder
│   │   ├── pages.py             # /api/pages CRUD + duplicate + reorder
│   │   ├── page_templates.py    # custom user templates
│   │   ├── uploads.py           # /api/upload + /api/files/{path}
│   │   ├── brand_kit.py         # /api/brand-kit
│   │   ├── landing_demo.py      # /api/{public/,}landing-demo
│   │   ├── landing_spotlights.py # /api/{public/,}landing-spotlights
│   │   ├── admin.py             # /api/admin/users (user management)
│   │   └── scraper.py           # /api/scrape-product
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               # Dashboard, Editor, PageEditor, BrandKit, Login, UserGuide
│   │   ├── pages/login/         # Marketing sub-components (Hero, FAQ, LiveDemo, Spotlights, …)
│   │   ├── pages/brand-kit/     # LandingDemoPicker, LandingSpotlightsPicker
│   │   ├── pages/dashboard/     # SectionsTab, PagesTab, RecentStrip
│   │   ├── pages/page-editor/   # PageRail, BlockEditorDrawer, SaveIndicator
│   │   ├── components/          # FormFields, ImageUpload, ListEditor, ErrorBoundary
│   │   ├── components/ui/       # Shadcn primitives
│   │   ├── sections/            # registry.js + 16 section modules + iconLib + shared helpers
│   │   ├── lib/                 # api client, BrandKitContext, brand colours
│   │   └── auth/                # AuthContext + startLogin
│   └── package.json
├── deploy/                      # Self-host artefacts
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   ├── README.md                # Generic Docker self-host docs
│   ├── PROXMOX-INSTALL.md       # Step-by-step SSH walkthrough
│   └── scripts/                 # mongodump/restore + uploads migration
├── docker-compose.yml
└── README.md
```

## Local development

```bash
# 1. Mongo locally (one-off)
docker run -d --name dw-mongo -p 27017:27017 mongo:4.4

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium                # one-off, for the scraper fallback

cat > .env <<'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=design_workshop
APP_NAME=modular-pages
UPLOADS_DIR=./uploads
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
OAUTH_STATE_SECRET=$(openssl rand -hex 32)
EOF

uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# 3. Frontend (in a second shell)
cd frontend
npm install --legacy-peer-deps
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
npm start                                  # http://localhost:3000
```

**OAuth locally**: register `http://localhost:8001/api/auth/google/callback` as an authorised redirect URI on your Google OAuth client, then sign in via `http://localhost:3000/login`.

**Admin gating**: add your Google account email to `backend/deps.py::ADMIN_EMAILS` to unlock `/brand` admin pickers and the `/admin/users` page.

## Production deployment

**One host, Docker, behind your own reverse proxy** — see [`deploy/PROXMOX-INSTALL.md`](deploy/PROXMOX-INSTALL.md) for the full SSH walkthrough (LXC create, Docker install, env config, reverse-proxy snippets for Caddy / nginx / NPM / Traefik, troubleshooting).

The short version:

```bash
git clone https://github.com/<you>/<repo>.git design-workshop
cd design-workshop
cp deploy/.env.example deploy/.env
${EDITOR} deploy/.env
ln -s deploy/.env .env                     # so `docker compose` picks it up
docker compose up -d --build
```

- One published port (`${PUBLIC_PORT}` → frontend nginx, default 8080).
- Mongo runs on the internal Docker network only, never reachable from the host.
- Uploads persist in a named Docker volume.
- TLS terminates on your existing reverse proxy. The internal nginx honours `X-Forwarded-Proto` / `X-Forwarded-Host` so OAuth callbacks resolve correctly.

See [`deploy/README.md`](deploy/README.md) for reverse-proxy snippets, day-2 ops, and the Mongo + uploads migration scripts.

### Updating after a `git pull`

```bash
git pull
docker compose --env-file deploy/.env up -d --build
docker compose logs -f backend             # wait for "Application startup complete"
```

Volumes (`mongo` + `uploads`) persist. Rollback is `git checkout <previous-sha>` then re-run the same `up -d --build`.

## Contributing

Pull requests welcome. The codebase is small enough (one router file per resource, one section file per block type) that adding a new section type means:

1. Create `frontend/src/sections/<name>.js` exporting `{ id, name, description, icon, defaults, render, FormPanel }`
2. Register it in `frontend/src/sections/registry.js`
3. Add a recommended preview height in `frontend/src/sections/previewHeights.js`

The XSS hardening helpers (`escHtml` / `escAttr` / `safeUrl` / `safeColor` / `num` from `frontend/src/sections/shared.js`) are mandatory for every `${cfg.*}` template-literal interpolation in your `render()`.

## Status

Single-tenant per deployment. Authentication is Direct Google OAuth — every user gets their own private library. Admin-only routes (Live Demo + Spotlight pickers on `/brand`, user management at `/admin/users`) are gated by an email allowlist in `backend/deps.py::ADMIN_EMAILS`.

## Licence

Source-available. Pick a licence that suits your situation; the canonical recommendations for self-hosted productivity tools are [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) (copyleft) or [PolyForm Noncommercial](https://polyformproject.org/licenses/noncommercial/1.0.0/) (no commercial competition). Drop a `LICENSE` file at the repo root with whichever you choose.

## Acknowledgements

Built on top of FastAPI, React, Tailwind, Shadcn UI, Tiptap, and the Lucide icon set. The product-scraper fallback uses Playwright. Self-host packaging targets MongoDB 4.4 specifically because **a lot of perfectly serviceable hardware** doesn't have AVX — and there's no good reason to make CPUs from before 2013 obsolete just because Mongo's release engineers needed a vector instruction set.
