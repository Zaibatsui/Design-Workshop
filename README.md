<div align="center">

# Design Workshop

[![ci](https://github.com/Zaibatsui/Design-Workshop/actions/workflows/ci.yml/badge.svg)](https://github.com/Zaibatsui/Design-Workshop/actions/workflows/ci.yml)
[![licence](https://img.shields.io/badge/licence-AGPL--3.0--or--later-blue.svg)](LICENSE)

**A no-code section builder for websites. Design beautiful content blocks, copy a single block of HTML, paste it into your shop or CMS.**

Build hero banners, product carousels, FAQs, testimonials, stat counters and more — theme them with a Brand Kit, drag-stack them into Pages, then drop the resulting standalone HTML into Shopify, WordPress, Squarespace, Wix, Webflow, BigCommerce, Magento, Nettailer or any other tool that accepts a custom HTML block. No React, no jQuery, no CDN calls at runtime. Just markup.

[Why this exists](#why-this-exists) · [Features](#features) · [Architecture](#architecture) · [Local development](#local-development) · [Self-hosted production](#production-deployment) · [Changelog](CHANGELOG.md)

</div>

---

## Why this exists

Most CMS section editors are fine until they aren't. You can't ship a really good hero, your product carousel needs a hover detail their widget won't give you, and the marketing team wants brand-consistent typography across pages the template doesn't expose. Or you're on a platform where "custom HTML block" is your only escape hatch and you'd like something better than a hand-written `<div>` to paste into it.

Design Workshop is a persistent, per-user library and page builder for the people who write that content — marketing managers, small-shop owners, designers handing pages to clients. Compose sections in a visual editor with a live preview, theme them with a Brand Kit, then click **Copy snippet** and paste the resulting standalone HTML into any rich-text or HTML field that accepts raw markup.

It is **not** a website builder. It doesn't try to replace Shopify, WordPress, or your existing CMS. It builds the content blocks you'd otherwise have to hand-code or wait on a developer for, and gives them back to you as a single inert HTML payload.

The output is **strictly inert** — scoped CSS classes (one unique class per instance, never collides with the host site's styles), an optional tiny IIFE per section for carousels and accordions, no global JavaScript dependencies, no fetch on render.

### Where it pastes

Anywhere that accepts a custom HTML block or embed. Confirmed working with Shopify (Custom Liquid / HTML sections), WordPress (Gutenberg Custom HTML, Classic Editor, Elementor HTML widget, Divi Code Module, most page builders), Squarespace (Code Block + Embed Block), Wix (HTML iframe / embed), Webflow (Custom Code embed), BigCommerce (page-builder HTML widget), Magento / Adobe Commerce (CMS blocks + pages), PrestaShop, OpenCart, Drupal, Joomla, HubSpot CMS (custom HTML modules), Umbraco, Sitecore, and Nettailer / Netset.

## Features

### 28 ready-made section types + rich-text

Plus a Tiptap-powered rich-text block for ad-hoc paragraphs inside Pages. Two distinct **Pro** bands sit at the top of the section picker: **Pro · Nettailer-aware** (Product Carousel + Product Grid — live-scraped pricing, universal VAT toggle, gated-pricing fallback) and **Pro · Blog tools** (Blog Index + Blog Body — searchable editorial landing + long-form article with a cross-linking picker).

| Block | What it does |
|---|---|
| **Hero** | Slide / fade carousel, full-bleed background, headline, subtitle, CTA. Slide mode loops continuously. Per-slide colour overrides, an optional `split` layout (image + container-aligned text), touch-swipe on mobile, and a full set of mobile-only overrides for gradients, alignment, arrow visibility and per-slide images so the small-screen view never inherits a desktop-only look you didn't want. Each slide supports multiple CTAs — add any number of extra buttons (filled or outline style, per-button colour overrides) alongside the primary CTA; buttons flex-wrap responsively. |
| **Split Banner** | Static full-bleed image with container-aligned heading, subtitle and buttons. Lighter cousin of Hero for non-carousel use. Optional feature-points list inside the panel. |
| **Featured Card** | Full-bleed photo background with a translucent glass card holding eyebrow, headline (with accent-phrase highlight), subheading, feature points and an optional CTA. Card placeable in one of nine grid positions. |
| **Welcome** | Post-login greeter banner with positionable heading, customer logo and account-manager card. Each block snaps to one of nine grid positions. |
| **Content** | Heading + body + buttons. The all-purpose marquee block. Optional mobile-only "centre text" override. |
| **Product Carousel** _(Pro · Nettailer-aware)_ | Card carousel with image, name, price, hover-tinted border. Infinite-loop in both directions (clone-and-jump scrolling — no rewind). Optional product-URL scraping (BeautifulSoup4 + Playwright fallback) auto-fills name / price / image with overlay-badge extraction. Universal VAT toggle: snippet watches the host site's VAT switcher and live-flips between inc-VAT and ex-VAT prices, mirroring whatever label convention the host uses (`Inc VAT`, `Inkl. moms`, `TTC`, …). |
| **Product Grid** _(Pro · Nettailer-aware)_ | Same product cards as the Carousel, laid out as a static grid (2–6 per row, wraps to multiple rows). Shares the live-price refresh + universal VAT toggle + gated-pricing fallback via the `productLive.js` helper. |
| **Blog Index** _(Pro · Blog tools)_ | Searchable grid of blog post cards with an optional full-bleed photo header (solid or gradient overlay; in-header or below-grid search input). Each card carries an image, category, date, author, title and excerpt with left/centre/right alignment. Three hover affordances. Picker pulls existing Blog Body pages or sections in one click. Search-only — no pill chips — by design. |
| **Blog Body** _(Pro · Blog tools)_ | Long-form article block with an optional sidebar of CTA / Related-articles / Tag-cluster / Author-card widgets. Sidebar sits left, right or below the body; opt-in sticky-on-scroll for desktop; mobile auto-collapses to a horizontal swipe carousel. Related-articles widget can pull existing blog content from the picker. Optional per-page "Public URL" so card links auto-populate. |
| **Insights Grid** | Editorial 2–3 column card grid for articles & case studies. Per-card layouts (image-left, image-top, image-right), accent border toggle, configurable image width. |
| **Resource Carousel** | Tag-tinted card carousel — blog posts, guides, downloads. Infinite-loop scrolling in both directions, per-card content alignment override. |
| **Feature Grid** | 2–4 column value-prop cards with icon, title, body. Outlined / tinted / solid card styles, plus an image-card variant (`image-top` / `image-left`). |
| **Trust Strip** | Compact 2–5 column row of icon + title + 1-line credibility callouts. Flat by design — perfect for "20+ years", "ISO 27001 certified", "5-star service" rows. |
| **Stat Counter** | Row of big numbers ('36%', '£2.4M', '5×') each with a label and an optional supporting line. 2–5 columns, optional eyebrow + heading + intro on top, optional CTA underneath. Numbers ramp from zero on scroll into view (respects `prefers-reduced-motion`). |
| **Video Embed** | Poster image + centred play button → click opens a modal lightbox that lazy-loads a YouTube or Vimeo iframe (or plays an inline HTML5 `<video>`). Nothing loads from the host until the user presses play. ESC closes, click-outside dismisses, focus restores to the play button, body scroll locks while open. |
| **Comparison Table** | Three-column "us vs them" matrix. Feature rows with ticks on your column and crosses on the competitor's. Brand-logo header on your column, accent tint + border to draw the eye, closing line + CTA below. Mobile-collapses to a card-per-row layout. |
| **Pricing Table** | 2–4 tier side-by-side pricing comparison. Each tier has a price, billing period, description and CTA button. Flag one column as "Best Value" to highlight it with a tinted background, accent border and filled CTA. Add unlimited feature rows with tick, cross, dash or plain-text values per tier. Optional full-bleed photo header with solid or gradient overlay. Click any tier in the live preview to jump straight to its editor. Horizontally scrollable on mobile. |
| **Countdown Timer** | Live ticking urgency block for sale deadlines, product launches or events. Set a target date; the snippet ticks in real time with no server dependency — pure JS IIFE, works anywhere HTML is accepted. Two display styles: Blocks (digits in rounded cards) or Minimal (plain large numbers with colon separators). Toggle individual units (days / hours / mins / secs) and labels on or off. Post-expiry: show a custom message or silently hide the section. Optional eyebrow, title, subheading, CTA button, flanking side images/logos, and a full-bleed background image with solid or gradient overlay. |
| **Steps** | Numbered process strip. Horizontal or vertical, big editorial numerals or compact inline. |
| **Testimonials** | Auto-scrolling quote carousel with avatars + 0–5 star ratings. Optional platform-logo badges (G2, Trustpilot, Capterra). Pauses on hover, respects `prefers-reduced-motion`. |
| **FAQ** | Collapsible Q+A accordion. Native `<details>` / `<summary>` for zero-JS accessibility. Rich-text answer editor with inline link panel — web or email, per-link colour, underline toggle and "Open in a new tab" choice. Scheme-less URLs (`example.com`) auto-resolve to `https://`. |
| **CTA Banner** | Final-call conversion block — eyebrow + headline + subhead + 1 or 2 buttons. Optional logo, gradient backgrounds, per-element colour overrides. Inline email-capture form mode. Optional mobile-only centre-text override. |
| **Logo Strip** | Auto-scrolling marquee. Per-image links + greyscale-until-hover toggle. Edge-fade gradients mode for a softer marquee. |
| **Brand Grid** | Searchable grid of brand cards with an optional full-bleed photo header band (radius cascades from your Brand Kit; overlay supports solid or linear-gradient styles). Per-card eyebrow, name and description with left/centre/right alignment. Three hover affordances — Lift + accent-border, edge-pickable accent bar (top/right/bottom/left + thickness + colour), or none — plus a Greyscale-until-hover toggle that desaturates every logo until pointer / keyboard focus lands on the card. Click any card in the live preview and its row pops open in the editor and scrolls into view. |
| **Break Banner** | Full-bleed parallax break with overlaid heading. Use it to chapter long pages. |
| **Tabs** | Tabbed content panel with a side image. Configurable tab alignment and image position. Optional per-tab image link. |
| **Grid** | 2×2 / 2×3 image grid with optional links per cell. |
| **Rich text** | Tiptap-powered freeform copy block — used inside Pages for ad-hoc paragraphs between structural sections. Inline link panel with per-link colour, underline toggle and "Open in a new tab" choice; scheme-less URLs auto-resolve to `https://`. |

### Hybrid Page Builder

Stack reusable sections plus ad-hoc rich-text blocks into a single page. Drag to reorder, **duplicate** any block in place (the same one-click duplicate is available on every list editor inside sections — Hero slides, Tabs tabs, FAQ items, Feature Grid cards, Products, etc.). Save any page as a custom template. Export the whole page as one combined snippet — order in the snippet matches the rail's vertical order. Eleven page templates ship out of the box: **Landing**, **Product detail**, **Category hub**, **About us**, **Pricing**, **Blog post** (breadcrumb → Blog Body with sidebar → newsletter CTA → "Read next" Blog Index rail), **Brand page**, **Service landing**, **Story page** (Hero → Video Embed → Stat Counter → Trust Strip → CTA Banner), **Shop by brand** (break banner → intro copy → Brand Grid → logo marquee → insights), plus **Blank**.

When you add a block to a page and switch to the **From library** tab, a horizontal pill bar at the top filters your saved sections by collection — `All (N)`, `Unfiled (N)`, plus one pill per real collection that contains sections. Empty collections are filtered out so the bar stays tidy regardless of how many folders you keep. Mirrors the dashboard's collection rail so your navigation pattern carries across.

Any standalone `blog-body` section in your library exposes a one-click **"Convert to Page"** button on hover — it spawns a fresh Page from the Blog post template with your section's body, sidebar widgets and styling pre-populated. The original section is left intact, so you end up with both the embeddable snippet and the full editorial page.

### Blog content authoring (Blog Index + Blog Body)

Both Pro · Blog tools sections share a **picker** that's aware of every page-with-a-blog-body OR standalone blog-body section in your library. From the Blog Index's "Posts" group or any Blog Body sidebar Related-articles widget, hit **"Pick from your pages"** to surface a search dialog of all blog content, tagged "Page" or "Section". Picking one auto-fills the card's title, excerpt (first sentence of the body), cover image (first `<img>` inside the body), author (from the author widget if present), date (the source's `updated_at`) and link (the source's `public_url`). Each card stamps a `source_kind` + `source_id` for dedupe across future picks.

Blog Body and blog-body Sections both get a compact "Public URL" popover-button in their editor header (auto-shows only for blog content) so the link your audience follows is one field away from the content itself — and that URL automatically flows into any Blog Index card or Related-articles card that picks the same page or section.

### Collections (folders)

A user-scoped, flat folder system for organising your library as it grows. Both sections and pages can be filed into one collection at a time; unfiled items show under **Unfiled**. The dashboard surfaces a colour-coded chip row above the Sections / Pages tabs — click a chip to filter both tabs simultaneously, click **Manage** to create / rename / recolour / delete from a small modal. Eight curated dot colours, 1–40 character names. Items get a **Move to…** dropdown on every dashboard card; moves are optimistic with rollback-on-failure. If you click **New section** or **New page** while a chip is active the new item is filed there automatically (a contextual hint underneath the chip row confirms where it'll land). The section + page editors also carry a chrome-level **Collection picker** next to the save indicator, so you can file the current item — or spin up a brand-new collection inline — without leaving the editor. Deleting a collection cascade-NULLs `collection_id` on every owned section + page — items are never silently lost.

### Brand Kit

Single source of truth for **every visual choice** across your library, grouped into four panels — Identity / Typography / Components / Layout — with a sticky **Live Preview** pinned to the right that flips between Hero, Cards, and CTA banner tabs so every change is visible without scrolling.

* **Identity** — primary / secondary / text / body / background + per-role overrides (link, button, accent, eyebrow), brand logos (dark + light, auto-seeded into Hero / Welcome / Split Banner), and a **default gradient** (`gradient_from`, `gradient_to`, `gradient_angle`) that drives every CTA Banner / Split Banner / Hero split-panel surface.
* **Typography** — heading + body fonts from 12 curated Google fonts (or "Inherit from site" to ship snippets without a font import), **title line-height**, **title letter-spacing** (em), **body font weight** (300-700), eyebrow defaults (uppercase ON/OFF, letter-spacing).
* **Components** — global **button corner radius** (sharp ↔ pill), an optional **default CTA microcopy** that pre-fills empty CTA fields on every new section, and a global **card border-radius** that drives product, resource, insight, feature and testimonial cards.
* **Layout** — a **section spacing scale** (Compact 40px / Default per-section / Spacious 96px) that stamps consistent paddingTop / paddingBottom onto every new section.

Per-section overrides on each block's own form always win — the kit just sets the cascade default. One click re-skins every existing section in your library without touching their content.

### Image library

Per-user persistent image library at `/images`. Upload once, reference everywhere — every section's image field offers "Pick from library" alongside upload and "Paste URL". Files stored via pluggable `storage.py` (local-fs default, swap to S3 / R2 / B2 without touching the upload routes).

### Live previews everywhere

Every section editor and the page editor render the **actual exported snippet** inside a sandboxed iframe. The section preview frame is drag-resizable per section type and persists your preference in `localStorage`. Pointer-capture on the resize handle so dragging the iframe shorter (cursor crossing into the iframe) never drops events at the cross-frame boundary.

Tile thumbnails throughout the app (section picker, page-editor `+ Add block` flow, in-app User Guide, public landing page) carry a small **Eye icon** in the corner. Hover or click the icon to mount a 480×270 live preview popover; the rest of the card stays inert (no more unsolicited previews while scanning the grid). When you're logged in the preview is overlaid with your **Brand Kit** so the thumbnail reflects your own palette and fonts; on the unauth landing page it uses the section's defaults.

Admins can pick any saved library section as the **global hover-preview source** for its section type via a checkbox in the Editor sidebar. The override beats both the static defaults and the per-user brand-kit overlay so every visitor sees the same curated thumbnail. State is stored in `app_settings.preview_overrides` and served via `GET /api/public/preview-overrides`.

### Automatic NEW / UPDATED badges + What's-new drawer

Both the section picker and the page-template picker render small **NEW** and **UPDATED** chips automatically, driven by hour-precision `addedOn` / `updatedOn` ISO datetimes in `sections/sectionMeta.js` and `sections/pageTemplateMeta.js`. NEW lasts 14 days from `addedOn`; UPDATED uses a 7-day rolling window. NEW trumps UPDATED — a still-new block keeps its NEW chip even if it gets follow-up improvements within the window.

A header **"What's new"** sheet lists every currently-badged section and template alongside a plain-English note describing what shipped or what changed, sorted newest-first by the actual datetime. An unread-dot indicator on the trigger button stays lit until the user opens the sheet, and re-lights whenever any badged date is bumped.

### Internal ticketing

Built-in **Report a bug / Request a feature** flow from the header of every screen. Tickets live in MongoDB; admins triage them at `/admin/tickets`, users see their own at `/my-tickets`. Statuses: **Open**, **Complete**, **Rejected** — the admin can flip any ticket to any status, and the reporter sees a coloured pill on their My Tickets page when something moves.

**Reply threads with strict turn-taking.** Both admins and reporters can reply to any ticket; the server enforces a one-reply-per-turn rule (`POST /api/tickets/{id}/replies` returns 409 if the caller is the side that last spoke). The original submission counts as the reporter's first turn, so admins always speak next. Either side's badge fires when the other replies: `admin_seen` flips False on reporter replies, `reporter_seen` flips False on admin replies.

Both sidebar entries in Studio mode (`Tickets` for the caller and `Admin · Tickets` for admins) render a red count pill driven by `GET /api/tickets/mine/notifications` and `GET /api/tickets/count`. The admin pill now reflects `unread` (new submissions + reporter replies needing a response) rather than just "open" — `POST /api/tickets/admin/seen` bulk-clears it the moment the inbox is opened. The user's pill clears the moment they visit `/my-tickets` (`POST /api/tickets/mine/seen` resets per-row `reporter_seen`).

**Mutual soft-delete** keeps abandoned tickets out of either inbox without losing the audit trail: either side can dismiss a row, but the document only hard-deletes from Mongo when both the reporter AND an admin have dismissed it.

### Marketing landing page · admin-curated demos

The login page (`/login`) doubles as a public marketing site. From `/brand`, admins can curate:

- **Live demo** — one of their saved pages that visitors see scrolling live inside a sandboxed iframe with browser chrome.
- **Spotlights** — two of their saved sections rendered as tilted "highlight" cards with auto-derived headlines and blurbs.

### Hardened against XSS

Every user-facing config value passes through one of: `escHtml` (text), `escAttr` (attributes), `safeUrl` (links / images — blocks `javascript:`, `vbscript:`, `data:text/html`, etc.), `safeColor` (CSS colour values — whitelist hex / rgb / hsl / keywords), or `num` (numeric coercion). The snippets generated are architecturally incapable of leaking styles to the host site or executing attacker-supplied scripts via colour / URL / numeric form fields.

### Universal VAT-aware price scraping

The Product Carousel scraper handles VAT-toggling storefronts as a first-class concern, with deep integration for **Nettailer / Netset**:

- One scrape returns **both VAT views** (`priceInc` + `priceExc`). For Nettailer the scraper uses a `requests.Session`, primes the `/nodeapi/` session-cookie handshake, then POSTs `/nodeapi/change_inc_vat` to flip the VAT flag and re-fetches the product page.
- An in-process TTL cache (10 min) plus a per-(URL, vat-mode) single-flight `asyncio.Lock` so a viral page that mounts the snippet 1000× still fires **one** upstream request.
- Cache priming: every Nettailer scrape populates `::default`, `::incl` and `::excl` cache keys at once.
- **Universal host detection** in the snippet — pure JS, no framework assumptions. A `MutationObserver` plus polling fallback watches the host page for any of the common VAT-toggle label variants (`Inc VAT`, `Excl. VAT`, `Inkl. moms`, `Exkl. moms`, `TTC`, `HT`, and more) and live-flips prices from a pre-warmed `localStorage` cache when the customer clicks the storefront's toggle.
- Editor preview ships a floating `Excl VAT` / `Incl VAT` pill so authors can verify both price views without leaving Design Workshop.

### In-app user guide

Long-form documentation at `/guide` with a scroll-spy table of contents, organised by user goal rather than feature taxonomy. Includes Quickstart (5 min), Dashboard tour, section-by-section reference, Brand Kit walkthrough, image hosting guidance, copy-and-paste flow, page templates, and a tips list.

## Editor chrome

Both the Section editor (`/edit/section/:id`) and the Page editor (`/edit/page/:id`) use the same three-column shell:

- **Left rail** — full-height, collapsible outline column. The PanelLeft icon flips it between a w-64 outline (with the section's anchor groups + active-section indicator) and a w-16 icon-only rail; preference persists in `localStorage`.
- **Centre canvas** — single h-14 header bar with editable section / page name, type label, action buttons (`Apply brand kit`, `Reset to defaults`, `SaveIndicator`) and a 200px **Copy snippet** primary button. Below it: a "Canvas" toolbar with the Desktop / Tablet / Mobile viewport switcher, then the live-preview iframe.
- **Right inspector** — 350px-wide full-height column with the section / block's settings grouped into **Content / Design / Advanced** tabs. Drag-resizable preview height (Section editor) is kept in `localStorage`.

`StudioShell` wraps every non-editor page — Library, Templates, Brand Kit, Image library, Tickets, Admin · Tickets, Admin · Users, Guide — with a slim header (Design Workshop wordmark, What's new, Report, user menu) and a 56px-wide workspace sidebar. Sidebar items render badge counts where relevant (tickets) and become active based on the current route.

A one-screen **first-login onboarding tour** walks new users through the sidebar, the canvas and the inspector — dismissable, never replayed (the user record carries an `onboarded` flag).

### Click-to-edit bridge

A **bidirectional click-to-edit** bridge connects the preview iframe and the inspector:

- **Preview → editor.** Every section's `render()` decorates its DOM with `data-ns-group`, `data-ns-list` and `data-ns-item` markers (stripped on snippet export — only present inside the editor's iframe). Clicking any decorated element posts `{type: "ns-preview-click", group, list, itemIndex}` to the parent window, which opens the matching accordion in the inspector and scrolls the field into view. Clicking a product card in a carousel, a slide in the hero, or a Q in the FAQ jumps the inspector straight to that row's editor.
- **Editor → preview.** Opening a list row in the inspector posts `{type: "ns-focus-item", list, index}` back into the iframe, which scrolls the matching DOM node into view. So when you expand "Slide 3" in the inspector, the hero preview slides to slide 3.
- **`<summary>` / `<details>` interplay.** The click bridge skips `preventDefault()` whenever the click target sits inside a `<summary>`, so the FAQ accordion's native open / close still fires alongside the editor jump.

The bridge code lives in `frontend/src/sections/shared.js` (`clickBridgeJs` + `focusBridgeJs`) and is gated by `withClickBridge: true`, which is only set when the editor renders the preview. Exported snippets ship with the bridge code absent — a copy-pasted snippet on a live storefront is fully inert.

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
- **Scraper** — Playwright Chromium is baked into the backend image at build time (`RUN python -m playwright install --with-deps chromium`) so a fresh `docker compose up --build` never crashes the Product scraper with a "browser executable doesn't exist" error.

### Self-contained snippet generation

Every section's `render(config)` function emits a `{ html, css, js }` triple wrapped by `wrapSnippet()`. The CSS class is suffixed with a per-instance UID so two copies of the same section never collide. The IIFE — when one's needed — captures its scope to its own root element.

```html
<!-- exported snippet shape -->
<style>.ns-hero-Ab1cD2{ /* …scoped to this UID… */ }</style>
<section class="ns-hero ns-hero-Ab1cD2"> … </section>
<script>(function(){ var root=document.querySelector(".ns-hero-Ab1cD2"); /* … */ })();</script>
```

The Studio click-to-edit bridge attaches an extra `<script>` to the preview iframe (only when `withClickBridge: true` is passed to `wrapSnippet`). The bridge is omitted from any snippet that's copied or exported, so a snippet pasted into a live storefront never contains the editor's interactivity glue.

### Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, React Router, Tailwind CSS, Shadcn UI, Tiptap, Lucide, dnd-kit |
| Backend | FastAPI, Motor (MongoDB), Authlib (OAuth 2.0), BeautifulSoup4 + Playwright (product-scraper fallback) |
| Database | MongoDB 4.4 (AVX-free) |
| Storage | Local filesystem volume (pluggable) |
| Auth | Direct Google OAuth (no intermediate identity provider) |
| Deploy | Docker Compose · nginx · Microsoft Playwright Python image |

## Project structure

```
.
├── backend/
│   ├── server.py                # middleware wiring, router includes
│   ├── db.py                    # Motor client + `db` singleton
│   ├── deps.py                  # get_current_user / require_admin / ADMIN_EMAILS env-driven allowlist
│   ├── storage.py               # local-fs object storage (pluggable)
│   ├── routers/
│   │   ├── auth.py              # /api/auth/google/{login,callback,logout,me}, onboarded, idle-minutes
│   │   ├── sections.py          # /api/sections CRUD + duplicate + reorder
│   │   ├── pages.py             # /api/pages CRUD + duplicate + reorder
│   │   ├── page_templates.py    # custom user templates
│   │   ├── uploads.py           # /api/upload + /api/files/{path}
│   │   ├── brand_kit.py         # /api/brand-kit
│   │   ├── landing_demo.py      # /api/{public/,}landing-demo
│   │   ├── landing_spotlights.py # /api/{public/,}landing-spotlights
│   │   ├── image_library.py     # /api/image-library (per-user image library)
│   │   ├── admin.py             # /api/admin/users
│   │   ├── tickets.py           # /api/tickets (mutual soft-delete, reporter_seen, /count, /mine, /mine/notifications)
│   │   ├── preview_overrides.py # /api/preview_overrides (admin curated hover thumbnails)
│   │   └── scraper.py           # /api/scrape-product
│   ├── tests_tickets_flow.py    # native-pytest backend tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PageEditor.jsx              # shared page editor (used by studio/PageEditor.jsx)
│   │   │   ├── Dashboard.jsx, BrandKit.jsx, Editor.jsx  # chromeless content shells (wrapped by studio/)
│   │   │   ├── UserGuide.jsx, AdminTickets.jsx, MyTickets.jsx, AdminUsers.jsx
│   │   │   └── studio/                     # top-level pages (all wrapped in StudioShell)
│   │   │       ├── Dashboard.jsx           # Library
│   │   │       ├── Editor.jsx              # section editor (3-col: outline + canvas + inspector)
│   │   │       ├── PageEditor.jsx          # passes `studio` prop to shared PageEditor
│   │   │       ├── Templates.jsx           # /templates
│   │   │       ├── Tickets.jsx             # exports StudioMyTickets + StudioAdminTickets
│   │   │       └── BrandKit, ImageLibrary, UserGuide, AdminUsers
│   │   ├── pages/login/         # Marketing sub-components (Hero, FAQ, LiveDemo, Spotlights, …)
│   │   ├── pages/brand-kit/     # LandingDemoPicker, LandingSpotlightsPicker
│   │   ├── pages/dashboard/     # SectionsTab, PagesTab, RecentStrip
│   │   ├── pages/page-editor/   # PageRail, BlockEditorDrawer (350px studio drawer), EmptyBlockEditor, SaveIndicator, BlockAdder
│   │   ├── components/
│   │   │   ├── FormFields, ImageUpload, ListEditor, SectionPreviewPopover, TicketDialog,
│   │   │   ├── WhatsNewDrawer, ErrorBoundary, UserMenu, EditorBits
│   │   │   └── studio/
│   │   │       ├── StudioShell.jsx         # top-bar + sidebar + nav + ticket badges
│   │   │       ├── StudioOutline.jsx       # left-rail outline jump-to-group
│   │   │       ├── StudioInspector.jsx     # right-rail accordion settings host
│   │   │       └── OnboardingTour.jsx      # one-screen first-login walkthrough
│   │   ├── components/ui/       # Shadcn primitives
│   │   ├── sections/            # registry.js + 28 section modules + iconLib + shared helpers
│   │   │                          + sectionMeta / pageTemplateMeta / pageTemplates
│   │   ├── sections/__tests__/  # jsdom-backed snippet behavioural tests (1000+ assertions across 40+ files)
│   │   ├── lib/                 # api client, BrandKitContext, sectionBadges, brand colours, useEscapeKey
│   │   └── auth/                # AuthContext + startLogin
│   └── package.json
├── deploy/                      # Self-host artefacts
│   ├── backend.Dockerfile       # bakes `playwright install --with-deps chromium`
│   ├── frontend.Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   ├── README.md                # Generic Docker self-host docs
│   ├── PROXMOX-INSTALL.md       # Step-by-step SSH walkthrough
│   └── scripts/                 # mongodump/restore + uploads migration
├── video/                       # Playwright + ffmpeg pipeline for promo MP4s
│                                  (build scripts only; outputs are gitignored)
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
ADMIN_EMAILS=you@example.com
EOF

uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# 3. Frontend (in a second shell)
cd frontend
yarn install
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
yarn start                                 # http://localhost:3000
```

**OAuth locally**: register `http://localhost:8001/api/auth/google/callback` as an authorised redirect URI on your Google OAuth client, then sign in via `http://localhost:3000/login`.

**Admin gating**: set `ADMIN_EMAILS=you@example.com` in `backend/.env` (comma-separated for multiple admins). Empty / unset means no admins — fail-closed so a forgotten env var never accidentally promotes every user. Admin-only routes: `/brand` (Brand Kit + landing demo / spotlights pickers), `/admin/users`, `/admin/tickets`.

## Production deployment

**One host, Docker, behind your own reverse proxy** — see [`deploy/PROXMOX-INSTALL.md`](deploy/PROXMOX-INSTALL.md) for the full SSH walkthrough (LXC create, Docker install, env config, reverse-proxy snippets for Caddy / nginx / NPM / Traefik, troubleshooting).

The short version:

```bash
git clone https://github.com/Zaibatsui/Design-Workshop.git design-workshop
cd design-workshop
cp deploy/.env.example deploy/.env
${EDITOR} deploy/.env                      # set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
                                           # OAUTH_STATE_SECRET, ADMIN_EMAILS, PUBLIC_HOST
ln -s deploy/.env .env                     # so `docker compose` picks it up
docker compose up -d --build
```

- One published port (`${PUBLIC_PORT}` → frontend nginx, default 8080).
- Mongo runs on the internal Docker network only, never reachable from the host.
- Uploads persist in a named Docker volume.
- TLS terminates on your existing reverse proxy. The internal nginx honours `X-Forwarded-Proto` / `X-Forwarded-Host` so OAuth callbacks resolve correctly.
- The backend image bakes `playwright install --with-deps chromium`; no post-deploy step is required to get the Product scraper Playwright fallback working.

See [`deploy/README.md`](deploy/README.md) for reverse-proxy snippets, day-2 ops, and the Mongo + uploads migration scripts.

### Updating after a `git pull`

```bash
git pull
docker compose --env-file deploy/.env up -d --build
docker compose logs -f backend             # wait for "Application startup complete"
```

Volumes (`mongo` + `uploads`) persist. Rollback is `git checkout <previous-sha>` then re-run the same `up -d --build`.

## Testing

```bash
# Backend lint
cd backend && ruff check .

# Backend behavioural tests (pytest)
cd backend && pytest tests_tickets_flow.py

# Frontend syntax / type check runs as part of the build
cd frontend && yarn build

# Snippet behavioural tests (jsdom-backed, no browser required)
cd frontend && yarn test:snippets
```

The snippet tests live in `frontend/src/sections/__tests__/` and `frontend/src/lib/__tests__/` and verify the runtime behaviours that ship inside every snippet — same-origin session pricing, gate-phrase harmonisation, VAT-suffix hide-on-gate, price-magnitude sanity checks, hero mobile overrides, video-embed lightbox behaviour, story-page template composition, the Studio click-to-edit / focus-bridge round-trip, blog content derivation, picker wiring across pages and sections, and more. The suite currently locks in **1000+ assertions across 40+ test files**. Run them before opening a PR that touches anything under `frontend/src/sections/` or `frontend/src/lib/`.

## Contributing

Pull requests welcome. The codebase is small enough (one router file per resource, one section file per block type) that adding a new section type means:

1. Create `frontend/src/sections/<name>.js` exporting `{ id, name, description, icon, defaults, render, FormPanel }`
2. Register it in `frontend/src/sections/registry.js`
3. Add a recommended preview height in `frontend/src/sections/previewHeights.js`
4. Add a `sectionMeta` entry with an `addedOn` ISO datetime so the NEW badge fires for 14 days
5. Decorate the rendered DOM with `data-ns-group` / `data-ns-list` / `data-ns-item` markers on every editable region so the Studio click-to-edit bridge can route clicks back to the inspector
6. If the section ships a **rich-text body** (anything that mounts `<RichTextEditor>`), append `richBodyResetCss(scope, { paraSpacing, linkColor })` from `sections/shared.js` to your CSS template. The helper restores paragraph spacing, list markers (UA defaults are nuked by `baseReset`'s `list-style:none!important` host-site protection rule) and — critically — collapses Tiptap's per-item `<p>` wrapper to `display:inline` so bullets sit next to their text rather than on a separate line above it. Skipping this is the single most common bug introduced by new rich-text sections.
7. Add a `__tests__/<name>.test.js` jsdom snippet test that locks in the rendered output shape

Example for step 6:

```js
// inside your section's render() — after the rest of your CSS
const css = `
${baseReset(cls)}
.${cls} .ns-body { font-size:14px; line-height:1.6; color:${bodyColor} }
${richBodyResetCss(`.${cls} .ns-body`, { linkColor: accent })}
`.trim();
```

The XSS hardening helpers (`escHtml` / `escAttr` / `safeUrl` / `safeColor` / `num` from `frontend/src/sections/shared.js`) are mandatory for every `${cfg.*}` template-literal interpolation in your `render()`. Rich-text containers must additionally use `richBodyResetCss()` from the same file (step 6 above).

## Status

Single-tenant per deployment. Authentication is Direct Google OAuth — every user gets their own private library. Admin-only routes (Live Demo + Spotlight pickers on `/brand`, user management at `/admin/users`, Tickets inbox at `/admin/tickets`) are gated by the `ADMIN_EMAILS` env var (comma-separated email allowlist).

## Licence

[AGPL-3.0-or-later](LICENSE). © 2026 Zaibatsui Labs.

You're free to use, modify, and self-host Design Workshop for any purpose, including commercial. If you run a modified version as a service accessible over a network, you must publish your modifications under the same licence — the canonical AGPL clause that keeps the project open while still letting individuals and businesses use it freely.

For a proprietary licence (e.g. you need to embed a modified Design Workshop in a closed-source product), contact Zaibatsui Labs to negotiate an exception.

## Acknowledgements

Built on top of FastAPI, React, Tailwind, Shadcn UI, Tiptap, dnd-kit, and the Lucide icon set. The product-scraper fallback uses Playwright. Self-host packaging targets MongoDB 4.4 specifically because **a lot of perfectly serviceable hardware** doesn't have AVX — and there's no good reason to make CPUs from before 2013 obsolete just because Mongo's release engineers needed a vector instruction set.
