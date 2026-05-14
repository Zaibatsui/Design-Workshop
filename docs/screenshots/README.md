# `docs/screenshots/` — README assets

Images embedded by the top-level `README.md`. Public marketing-page captures
are committed; the authenticated screens are intentionally **not** committed
because:

1. They require a logged-in session (Direct Google OAuth), so the build
   pipeline can't recapture them, and
2. They tend to contain whichever brand kit + sample data the maintainer
   last used, which is rarely what you want to ship as the public preview.

## Committed images (rendered in `README.md`)

| File | Captured from | Caption |
| --- | --- | --- |
| `landing-hero.png`        | `/login` (top)                                 | The marketing hero — "Build e-commerce pages without the bloat" |
| `landing-features.png`    | `/login` — "What it does" feature grid         | Four feature cards (editor / page builder / brand kit / snippet) plus the section-types intro |
| `landing-howitworks.png`  | `/login` — "How it works" three-step strip     | Sign-in → Build & autosave → Copy / paste / ship |

## Recommended additions (drop these in to complete the README preview)

| Suggested filename | Captured from | What to show |
| --- | --- | --- |
| `dashboard.png`           | `/` (authenticated)                            | Masonry sections grid + "Recently edited" strip |
| `editor-hero.png`         | `/sections/<id>` — Hero section editor         | Accordion settings rail on the right, live iframe preview centre |
| `editor-products.png`     | `/sections/<id>` — Products section editor     | Live VAT toggle pill in the preview, scraped product cards visible |
| `page-builder.png`        | `/pages/<id>`                                  | Page rail on the left with reorderable blocks, drawer editor on the right |
| `brand-kit.png`           | `/brand`                                       | Brand colour pickers + font selectors |
| `snippet-drawer.png`      | Any editor with "Copy snippet" open            | The drawer showing self-contained HTML / CSS / JS output |

### How to capture

1. Sign in to your deployed instance.
2. Use your browser's full-page screenshot tool (Firefox: right-click → "Take Screenshot" → "Save full page"; Chrome DevTools: ⌘⇧P → "Capture full size screenshot").
3. Target **1600 × 1000** viewport for visual parity with the existing
   committed captures.
4. Save as `*.png` into this directory and re-commit. The `README.md`
   already references these filenames, so the images appear automatically
   once they're on disk.

### Optional: animated GIF

If you'd rather show a flow than a strip, record a short screen capture
(LICEcap / Kap / Screen Studio) of:

```
new section → edit field → preview updates → Copy snippet → drawer opens
```

Keep it under 5 MB and ≤ 8 seconds, save as `flow.gif`, then replace the
two side-by-side `landing-*.png` images in `README.md` with:

```markdown
<p align="center">
  <img src="docs/screenshots/flow.gif" alt="Design Workshop flow" width="100%" />
</p>
```
