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

## Backlog
- P1: Page-builder mode (stack multiple sections in one canvas with reorder + bulk export)
- P2: Save/load named templates (localStorage)
- P2: Theme presets (light/dark/vivid)
- P2: Section duplication (clone an existing section as a starting point)
- P3: `/api/health` exposing storage init status
- P3: Refresh storage_key automatically on 401
