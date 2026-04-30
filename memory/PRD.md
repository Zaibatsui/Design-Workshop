# Modular Pages — Section Builder (Hero Carousel)

## Original problem statement
Modular WYSIWYG editor for reusable ecommerce content sections. Each section is fully self-contained (scoped CSS/JS) so it can be embedded in any external ecommerce CMS without conflicts. Form-based editor for non-technical users. Output: clean self-contained HTML snippet (HTML + scoped CSS + multi-instance-safe JS) via a "Copy Section" button. Initial scope: Hero Carousel section.

## User choices
- Persistence: Client-side only (no DB)
- Image uploads: Object storage (Emergent)
- Snippet output: Pure vanilla HTML/CSS/JS
- Initial sections: Hero Carousel only (user has HTML for others)
- Design: Shopify-admin style

## Architecture
- **Frontend (React)** — single editor page at `/`. Two-column layout: left sidebar with Accordion (Slides / Theme / Layout / Settings), right canvas with iframe `srcDoc` preview rendered by the same `renderHero()` function used to generate the copied snippet → preview = exact output.
- **Backend (FastAPI)** — minimal, only two endpoints:
  - `POST /api/upload` → uploads to Emergent object storage, returns `{path, url}`
  - `GET /api/files/{path:path}` → public proxy (no auth — embedded in copyable snippets)
- **Snippet contract** — `<section class="ns-hero ns-hero-{uid}">…</section><style>…</style><script>(IIFE)</script>`. CSS scoped by `.ns-hero-{uid}` prefix. JS uses `querySelectorAll('.ns-hero-{uid}:not([data-ns-init])')` to initialize each matching instance once. No global vars, no element IDs. CSS variables on the `<section>` for theming.
- **Multi-instance safety** — every Copy generates a fresh uid (so different versions of the same section coexist), and the IIFE design handles multiple pastes of the same snippet too.

## What's implemented (2026-04-30)
- Hero carousel section with: multiple slides (add/remove/reorder), title, subtitle, image upload, optional logo, CTA text/link, autoplay toggle + interval, arrows + dots toggles, text alignment, height/width/radius sliders, theme color pickers (title, subtitle, button bg/text, overlay), overlay opacity.
- Live iframe preview with desktop/tablet/mobile viewport switcher.
- Copy HTML Snippet button (toast confirmation) + raw snippet drawer.
- Image upload to Emergent object storage with drag-to-click upload UI + URL fallback.
- 100% pass on full E2E test suite (testing_agent_v3 iteration 1).

## Backlog
- P1: Add more section types (Product Carousel, Logo Strip — user has HTML for these). Section type selector in sidebar.
- P1: Save / load named sections (localStorage) for client-side library.
- P2: Section export as `.html` file download.
- P2: Pre-built theme presets (light / dark / vivid).
- P2: Keyboard navigation for slides in editor.
- P2: `/api/health` endpoint exposing storage init status.
- P3: Refresh storage_key automatically on 401.
