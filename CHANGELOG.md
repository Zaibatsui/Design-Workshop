# Changelog

All notable changes to **Design Workshop** are documented here. Format
loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are `YYYY-MM-DD`. Newest releases at the top.

---

## [Unreleased]

### Added
- **Hero · Multiple CTAs per slide** — each Hero slide now supports
  any number of additional buttons alongside the primary CTA. Extra
  buttons are added and removed individually per slide (no global
  setting), each carrying its own text, link, style (filled or
  outline), "open in same tab" toggle, and optional colour overrides
  independent of the section-level CTA theme. All three render paths
  (slide-transition, fade-transition, split-panel) wrap the primary
  and extra buttons in a shared `ns-cta-group` flex container that
  gaps and wraps gracefully on narrow viewports. The `ns-cta-outline`
  variant renders as a transparent button with a coloured border, making
  it easy to pair a solid primary with a ghost secondary. Existing slides
  with no extra buttons are unaffected — fully backwards compatible.
- **Brand Grid section (major upgrade)** — Now ships with a full-bleed
  photo header band (corner-radius cascades from your Brand Kit
  `card_radius`; overlay supports solid or linear-gradient styles
  matching the Hero overlay model), an in-header search input with
  author-picked position / alignment / width, optional per-card
  eyebrow rendered between the logo and the brand name, left /
  centre / right card content alignment, edge-pickable accent bar
  on hover (top / right / bottom / left + thickness + colour),
  greyscale-until-hover for the logos, and full click-to-edit so
  clicking any card pops its row open in the editor and scrolls it
  into view. Defaults ship as a finished partner-showcase — photo
  header, "BRANDS" eyebrow + "Shop by brand" heading + intro, 9
  vendor cards (HP / Dell / Lenovo / Intel / Nvidia / Cisco / Apple
  / Samsung / Logitech), search inside the header, lift hover,
  Brand Kit colour cascade. Logitech uses an inline-SVG wordmark
  fallback so a missing simpleicons slug never 404s.
- **"Shop by brand" page template** — drops a finished partner-
  showcase page in one click: break banner → intro copy → Brand
  Grid → scrolling logo strip → insights.
- **Cross-section render smoke test**
  (`sectionRender.smoke.test.js`) — loads the real `SECTIONS`
  registry through babel-on-require and asserts every registered
  section's `defaults()` + `render(defaults)` runs without throwing
  and emits a `<section …>` snippet. Plus a static guard that any
  section using `<FormGroup>` must wrap its children in
  `<FormAccordion>`. Catches the bug class where a section
  renderer references a symbol the wrong way at runtime
  (`FONT_IMPORT(cfg.font)` instead of `${FONT_IMPORT}`, or a
  FormGroup-without-Accordion). Wired into `yarn test:snippets`.
- **`PLATFORM_UPDATES` build-break guard**
  (`whatsNewDrawer.platformUpdates.test.js`) — parses
  `WhatsNewDrawer.jsx` with `@babel/parser` (same parser the dev
  server uses; a syntax error here is a hard fail) and walks the
  AST to assert every release-note entry is a plain object with
  `id`, `name`, `addedOn`, `whatsNew`, `kind` plus unique `id`s.
  Restores compile safety after the dangling `{ id: …` regression
  that took the frontend down earlier in the session.
- **Brand Kit · Wave 2 — Typography, Components, Layout & Gradient**
  Eight new global controls cascade into the section library:
  *Title line-height*, *title letter-spacing*, *body weight*,
  *eyebrow uppercase + letter-spacing*, *card border-radius*,
  *default CTA microcopy* (auto-fills empty CTA fields on new
  sections), a *section spacing scale* (Compact / Default /
  Spacious), and a *default gradient* (`gradient_from`,
  `gradient_to`, `gradient_angle`) that drives every CTA Banner /
  Split Banner / Hero split-panel surface. The Brand Kit page is
  now grouped into Identity / Typography / Components / Layout
  with a sticky Live Preview pinned to the right that flips between
  *Hero / Cards / CTA banner* tabs so every kit change is visible
  without scrolling. All new kit fields default to the previously
  hardcoded values so existing snippets render byte-identically.
- **Ticket replies with strict turn-taking** — bug / feature
  tickets are now full conversations. Admins can reply to any
  ticket; reporters can reply back. Server-side enforcement of
  one-reply-per-turn (409 on double-post) so the thread can never
  flood. Dashboard counter now reflects "tickets needing your
  attention" (new submissions + reporter replies), and the My
  Tickets badge fires whenever an admin replies. New `replies`
  array, `next_turn` field, `admin_seen` flag, `/admin/seen`
  endpoint, and `POST /tickets/{id}/replies` route.
- **File into a Collection from inside the editor** — every
  section and page editor (Classic + Studio chromes) now carries
  a small chrome-level Collection picker next to the save
  indicator. Pick an existing collection, jump back to *Unfiled*,
  or create a brand-new collection inline without leaving the
  editor.
- **Hero · Per-slide eyebrow + per-slide text colours** — each
  Hero slide now supports an optional eyebrow label above the
  title plus per-slide Title / Subtitle / Eyebrow colour
  overrides. A single carousel can mix slides on light and dark
  backgrounds without forcing one global text colour. Empty
  fields inherit from the section theme so older slides render
  unchanged.
- **CTA Banner · Button text colour** — primary button text
  colour is now configurable in the Design tab. Stops white
  labels disappearing on white-accent buttons.

### Changed
- **Title line-height bumped 1.1 → 1.2** on both Hero `.ns-title`
  rules (slide + fade renderers) and Split Banner's `.ns-title`
  (1.15 → 1.2). Both branches now read `cfg.titleLineHeight` so
  the Brand Kit slider drives the value globally.
- **Rich Text / Content side-padding slider** — range bumped
  0-80px → 0-240px, with an inline helper explaining the
  interaction with the inner 1200px max-width. Makes the slider
  visibly indent the column on wide desktops.
- **Dashboard ticket badge** now reads `unread` (new tickets +
  reporter replies) instead of `open`, so admins see exactly what
  needs their attention. Falls back to `open` for older backends.

### Fixed
- **Stray fragment in `lib/brandKit.js`** — a corrupted edit left
  a duplicate `arget}"\`)` block at the end of the file, breaking
  Babel parsing intermittently. Cleaned up.
- **Hero `.ns-eyebrow` regression test** — refreshed the regex
  matchers after the Brand Kit `cfg.eyebrowLetterSpacing` /
  `cfg.eyebrowUppercase` wire-up so future refactors stay safe.

---

## [2026-02-07]

### Added
- **Collections (folders)** — a flat per-user folder system above the
  Sections / Pages tabs in the dashboard. Both sections and pages can
  be filed into one collection at a time; items without one show under
  *Unfiled*. Chip row carries colour-coded dots + live item counts and
  filters both tabs simultaneously. Manage dialog supports create /
  rename / recolour / delete (8-colour palette, 1–40 char names).
  Per-card *Move to…* dropdown with optimistic-then-rollback semantics.
  When a chip is active, clicking *New section* or *New page* files
  the new item into that collection automatically (with a hint line
  under the chip row confirming where it'll land). Deleting a
  collection cascade-NULLs `collection_id` on every owned section + page
  so items are never silently lost.
- **Universal duplicate on every list editor** — every list-style row
  in every section (Hero slides, Tabs tabs, FAQ items, Feature Grid
  cards, Products, Insights, Resources, Steps, Stat Counter items,
  Trust Strip items, Comparison Table rows, Logos, Testimonials,
  Featured Card points, Split Banner points, Content buttons,
  Placeholder items) now has a Copy icon between the move-down arrow
  and trash icon. The clone is inserted directly under the source with
  a fresh id; the form auto-opens and scrolls the new row into view.
  ListEditor's "newly added id" detector handles mid-list inserts
  (previously only end-appends auto-opened).
- **Tabs section header (eyebrow / title / intro)** — Tabs section now
  supports an optional Eyebrow + Title + multi-paragraph Intro block
  above the tab row, with independent header alignment (left / center
  / right). Existing snippets render identically when the three fields
  are empty; the `<header>` is dropped entirely.
- **Default overlay controls** on Hero — the previously-unused
  `OverlayControlsDesktop` / `OverlayControlsMobile` helpers are now
  wired into a new *Default overlay* sub-group in the Slide-defaults
  panel, following the same desktop / mobile preview branching as the
  Layout block.

### Changed
- **Mobile-only controls are now strictly gated by preview mode**
  across every list-driven section. *Split panel layout (this slide)* /
  *Image side* / *Panel width* are hidden when previewing mobile;
  *Mobile panel BG (≤767px)* is hidden when previewing desktop. Same
  rule applies consistently to *Centre text on mobile* and *Card text
  alignment (mobile)* across `content`, `ctaBanner`, `welcome`,
  `splitBanner`, `featureGrid`, `productGrid`, `hero`.
- **Single-slide Hero carousels auto-hide chrome.** Arrows and dots
  are suppressed (HTML + class hooks) when there's exactly one slide —
  the section no longer reserves a dot-row of bottom padding for
  nothing. Chrome reappears the moment a second slide is added.
- **Mixed-layout Hero carousels render at the same height** on mobile.
  Standard slides used to keep `height:100%` which suppressed
  `align-items:stretch`, so a content-heavy *split* slide stretched to
  600px while standard slides stayed at the 480px min — the section
  visibly bounced during transitions. Standard + split slides now share
  `height:auto + min-height + align-self:stretch` so flex normalises
  them to the tallest.
- **Fade-transition mixed Hero carousels no longer clip panel content
  on mobile.** Fade slides are `position:absolute`, which means they
  don't contribute height to the parent — combined with the existing
  `:has(.is-split)` override they were silently clipped to
  `min-height`. The fade variant now switches to a CSS-grid stack with
  every slide at `grid-area:1/1`, so the tallest slide drives the
  section height while the opacity cross-fade continues to work.
- **Studio top bar fully responsive at narrow center-pane widths.** The
  Studio editor's center pane gets squeezed by the inspector / outline
  rails; the top bar now cascades:
  - ≥xl: full chrome (badge + palette + reset + dividers + Copy snippet text)
  - lg–xl: section-type badge hidden, Copy snippet → icon-only
  - md–lg: palette + reset hidden
  - <md: dividers hidden
- **SaveIndicator collapses to icon-only below xl** with the full
  *"Saved Xs ago"* / *"Saving…"* / *"Save failed"* copy moved to a
  native `title` tooltip.
- **Page Editor block badge** ("X blocks") and Studio section-type badge
  (`def.name`) hidden below `lg` to free top-bar space.
- **Collections bar UI tidy** — wrapped in a soft-grey strip with top
  + bottom border, a small *COLLECTIONS* eyebrow kicker, increased
  vertical padding so the bar reads as its own toolbar zone rather than
  crowding the Sections / Pages tabs.

### Fixed
- **Hero carousel preview-lock no longer breaks when toggling
  Desktop ↔ Mobile preview.** Both Hero IIFEs (slide + fade) now carry
  a `locked` boolean that's set true on init when `__nsHeroIndex` is
  set, toggled by postMessage, and guards `start()`. Mouse-leave
  (pause-on-hover) when the cursor moved from the iframe to the
  device-toggle button no longer silently restarts autoplay.
- **Rich text "0px bottom spacing" white gap.** With `padding-bottom: 0`
  the inner `<p>` / `<ul>` `margin-bottom` (14px) was escaping the
  section via standard CSS margin-collapse — painting a visible white
  strip between the section's background and the next page block. Even
  1px of bottom padding masked the bug, which is why setting it to 5px
  "fixed" it visually. Section root now uses `display:flow-root` to
  establish a Block Formatting Context — margins stay contained, zero
  visual side effects.
- **Hero mobile split-slide grid-template-rows assertion** was stale
  (`auto auto` in tests vs. `auto 1fr` in code). Tests + code
  reconciled to `auto 1fr` so split slides match standard slides in
  height across a carousel.
- **Move dropdown placement** — `MoveToCollectionMenu` uses Radix
  DropdownMenu portal so it floats above the masonry grid instead of
  being clipped by the card's `overflow:hidden`.

### Tests
- New backend pytest `backend/tests_collections_flow.py` — 14/14
  assertions covering empty list, CRUD, alphabetical sort, move,
  unfile, cross-tenant rejection, non-existent collection rejection,
  delete cascade, create-time pre-filing, create-time validation.
- New snippet regression `frontend/src/sections/__tests__/tabs.sectionHeader.test.js`
  (9 assertions) — locks in optional-header drop behaviour, class
  names, FormPanel field ids.
- New snippet regression `frontend/src/sections/__tests__/richtext.flowRoot.test.js`
  — asserts `display:flow-root` is present on the section root.
- Hero mobile regression suite extended with 7 new assertions for
  mixed-layout uniform heights, fade-variant grid stacking, and
  single-slide chrome suppression.

### Repo hygiene
- `.gitignore` tightened: replaced 18 explicit
  `frontend/node_modules/.cache/*.pack` lines with a single
  `**/node_modules/.cache/` rule.
- Stale preview-URL references removed from committed code
  (`video/capture.js` now defaults to `http://localhost:3000`;
  `videoEmbed.test.js` uses `media.example.com`).

---

## 2026-02-01 — GitHub OSS preparation

### Added
- **GitHub Actions CI** workflow (`.github/workflows/ci.yml`) running
  Ruff + pytest + ESLint on every PR + push to `main`.
- README repo badges (CI status + AGPL-3.0 licence).
- `backend/ruff.toml` minimal lint config.

### Changed
- `ADMIN_EMAILS` migrated from hardcoded `deps.py` to `.env` so the
  repo carries no privileged email addresses.
- `docker-compose.yml` updated to surface `ADMIN_EMAILS` through to the
  backend service.
- `.env.example` files added at root, `backend/`, `frontend/`, and
  `deploy/` with placeholder secrets.
- `README.md` scrubbed of personal emails / hosted preview URLs.

---

## 2026-01-XX — Studio polish

### Added
- Hero section mobile enhancements: touch swipe, per-slide mobile
  images, mobile gradients, gap controls, mobile alignment, mobile
  arrow visibility.
- Internal ticketing system upgrade: *Reject* status, *My Tickets*
  user view with unread badge, mutual soft-delete (hard-deletes only
  when both reporter AND admin have dismissed the row).
- Feature Grid upgrade: per-card image-upload icon, short intro field,
  rich-text body, separate text alignment for mobile / desktop.

### Fixed
- FAQ accordion click-bridge — preview iframe's `e.preventDefault` was
  swallowing `<summary>` toggles. Now skipped for summary elements.
- Hero carousel `useMemo` deps — adding `heroIndex` ensures the lock
  re-bakes into the iframe doc when the inspector opens a different
  slide row.

---

## Earlier history

For releases prior to January 2026 see the git log. The above slice
covers the work currently relevant for users; older shipped sections
(Hero, FAQ, Tabs, Product Grid, etc.) were assembled across many small
commits without per-feature changelog entries.
