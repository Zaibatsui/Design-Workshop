/**
 * SECTION_META — per-section "added on" / "updated on" dates that drive
 * the automated NEW / UPDATED badges in the Add-Section picker.
 *
 * Each entry may also carry a `whatsNew` string — a short, plain-English
 * note shown in the "What's new" drawer in the dashboard header.
 *
 * Maintenance contract (followed by the agent on each deploy):
 *   • Adding a new section → add a row with `addedOn` set to today and
 *     a `whatsNew` line that reads naturally to a non-technical user
 *     (focus on what they can DO with it, not how it was built).
 *   • Making a user-visible improvement to an existing section → bump
 *     `updatedOn` to today and update `whatsNew` to describe the change
 *     in plain language.
 *
 * NEW trumps UPDATED. A section is NEW if its `addedOn` is one of the
 * 3 most-recent `addedOn` dates across the whole library (excluding
 * the launch sentinel — sections shipped on day-one don't count).
 * A section is UPDATED if it's NOT currently NEW and its `updatedOn`
 * is one of the 5 most-recent `updatedOn` dates AND `updatedOn` is
 * strictly later than its own `addedOn` (so a section that's never
 * been touched since launch doesn't qualify).
 *
 * Auto-rotation: shipping a new feature pushes the oldest NEW out of
 * the top-3. Shipping a new edit pushes the oldest UPDATED out of the
 * top-5. No manual unflagging needed — old entries silently age out
 * as new ones land.
 *
 * Keys are section IDs (matching `SECTIONS_BY_ID`). Missing IDs fall
 * back to the platform launch date so they never qualify for badges.
 */
const LAUNCH = "2025-09-01";

export const SECTION_META = {
  // Pre-existing library — launched together.
  hero: {
    addedOn: LAUNCH,
    updatedOn: "2026-01-28",
    whatsNew:
      "Hero in slide mode now loops continuously — clicking next on the last slide flows straight to the first one with no rewind, and prev on the first slide flips straight to the last. Earlier mobile-specific controls (separate gradients, alignment, arrows) remain.",
  },
  "split-banner": {
    addedOn: LAUNCH,
    updatedOn: "2026-01-28T09:00:00Z",
    whatsNew:
      "New mobile-only 'Centre text on mobile' toggle — on phones the eyebrow, heading, subheading and button sit centred under the image while desktop stays exactly as it was. You can still add a list of icon + title + body points inside the text panel.",
  },
  welcome: {
    addedOn: LAUNCH,
    updatedOn: "2026-01-28T10:00:00Z",
    whatsNew:
      "New mobile-only 'Centre text on mobile' toggle — on phones every block (header, customer logo, account manager card) sits centred while desktop keeps the positioned-grid layout exactly as it was.",
  },
  content: {
    addedOn: LAUNCH,
    updatedOn: "2026-01-28T10:30:00Z",
    whatsNew:
      "New mobile-only 'Centre text on mobile' toggle — on phones the heading, body and buttons sit centred regardless of the desktop alignment you've picked. Desktop layout is unchanged.",
  },
  products: {
    addedOn: LAUNCH,
    updatedOn: "2026-01-28",
    whatsNew:
      "Product Carousel now scrolls continuously in BOTH directions — the right-arrow infinite-loop bug is fixed, swipe-on-mobile loops too, and the carousel no longer drifts out of alignment after several full ring traversals. The corner-badge upload lives behind a clearer toggle so it's never mistaken for the main product photo.",
  },
  productGrid: {
    addedOn: LAUNCH,
    updatedOn: "2026-06-05T12:00:00Z",
    whatsNew:
      "Optional Mobile Carousel mode (off by default). Switch the editor to the mobile preview and flip the new Defaults toggle — at ≤640px viewports the grid collapses into a horizontal swipe-strip with 80% card width plus a peek of the next, while desktop stays a normal stacked grid. Sub-controls for arrows and autoplay become available when the toggle is on, with seamless forward infinite-loop scrolling and pause-when-off-screen. Plus the new Card text alignment header control and the per-card rich-text Description / Eyebrow fields ported across from the Product Carousel.",
  },
  resources: {
    addedOn: LAUNCH,
    updatedOn: "2026-01-26",
    whatsNew:
      "Resources Carousel now loops continuously — both with the arrows and on mobile swipe. New per-card content alignment override means one card can sit centred while the rest stay left-aligned.",
  },
  insights: { addedOn: LAUNCH, updatedOn: LAUNCH },
  "feature-grid": { addedOn: LAUNCH, updatedOn: LAUNCH },
  steps: { addedOn: LAUNCH, updatedOn: LAUNCH },
  testimonials: {
    addedOn: LAUNCH,
    updatedOn: "2026-01-28T15:30:00Z",
    whatsNew:
      "Each testimonial card now supports an optional review-platform badge in the author footer — drop in a G2, Capterra or Trustpilot logo to add an instant credibility marker next to the author name.",
  },
  faq: {
    addedOn: LAUNCH,
    updatedOn: "2026-01-28",
    whatsNew:
      "Links inside FAQ answers now auto-resolve to full URLs even if you type 'example.com' without the https:// — they used to be appended to the host page's address and break. New per-link 'Open in a new tab' toggle so you can pick whether each link opens in the same window or a fresh tab. Rich-text toolbar still has bold / italics / lists and the inline link editor with colour and underline controls.",
  },
  "cta-banner": {
    addedOn: LAUNCH,
    updatedOn: "2026-01-28T16:00:00Z",
    whatsNew:
      "Now supports two action styles. Pick Buttons for the classic stacked CTA, or switch to Email capture to add an inline <email + submit> field — when a visitor submits, their mail client opens with a pre-filled message to your inbox so the address lands with you, ready to drop into Mailchimp / Klaviyo / whatever list tool you already use. No third-party signup, no backend. Plus the existing mobile-only Centre text toggle for phones-only alignment.",
  },
  placeholder: { addedOn: LAUNCH, updatedOn: LAUNCH },
  logos: {
    addedOn: LAUNCH,
    updatedOn: "2026-01-28T15:00:00Z",
    whatsNew:
      "Optional soft edge-fade — logos now fade in/out at the strip boundaries instead of a hard cut, matching the polished look on Stripe / Dripify / Linear. Toggleable per section with adjustable fade width.",
  },
  break: { addedOn: LAUNCH, updatedOn: LAUNCH },
  tabs: { addedOn: LAUNCH, updatedOn: LAUNCH },
  "brand-grid": {
    addedOn: "2026-02-18T18:00:00Z",
    updatedOn: "2026-02-19T18:00:00Z",
    whatsNew:
      "Major upgrade — Brand grid now ships with a full-bleed photo header, an in-header search input, per-card eyebrows, left/centre/right card alignment, edge-pickable accent bar (top/right/bottom/left), greyscale-until-hover, and full click-to-edit so clicking any card opens its row in the editor. Default state lands as a finished partner-showcase, including a Brand Kit colour cascade.",
  },
  "blog-body": {
    addedOn: "2026-02-19T22:00:00Z",
    updatedOn: "2026-02-19T22:00:00Z",
    whatsNew:
      "New section purpose-built for long-form articles: a rich-text body column with an optional sidebar of four widget types (Get-in-touch CTA, Related articles, Tag cluster, Author card). Sidebar can sit left, right or below the body, with an opt-in sticky-on-scroll mode for desktop. Mobile auto-collapses the sidebar below the body as a horizontal swipe carousel. Every colour, font and radius cascades from the Brand Kit.",
  },
  "blog-index": {
    addedOn: "2026-02-20T10:00:00Z",
    updatedOn: "2026-02-20T10:00:00Z",
    whatsNew:
      "New section: a searchable blog landing grid. Ships with a full-bleed photo header, an in-header search input (or below-grid placement), per-card category/date/author meta and an excerpt. Built from the Brand Grid DNA — left/centre/right card alignment, lift / accent-bar / none hover affordances, click-to-edit on every card — but with article-specific fields and no pill-chip filters (search-only by user preference). Full Brand Kit cascade.",
  },
  richtext: {
    addedOn: LAUNCH,
    updatedOn: "2026-01-26",
    whatsNew:
      "Visual editor now has an inline link panel — add web or email links, set a per-link colour, and turn the underline off on any single link from the toolbar. Click an existing link to re-open the panel and tweak it. Scheme-less URLs like 'example.com' are auto-resolved to 'https://example.com' so links never get appended to the host page. New per-link 'Open in a new tab' toggle.",
  },

  // Featured Card, Trust Strip and Comparison Table all share a fresh
  // 7-day NEW window starting 2026-01-28 — the date we re-surfaced
  // them on the picker so every user can spot them.
  "featured-card": {
    addedOn: "2026-01-28",
    updatedOn: "2026-01-26",
    whatsNew:
      "A new section: a big photo background with a clean card holding your headline, supporting points and an optional button. Perfect for hero intros, process steps and final calls to action.",
  },
  "trust-strip": {
    addedOn: "2026-01-28",
    updatedOn: "2026-01-26",
    whatsNew:
      "A new compact row of icons and one-line callouts. Ideal for credibility marks like '20+ years' or '5-star service' between heavier sections.",
  },
  "comparison-table": {
    addedOn: "2026-01-28T11:00:00Z",
    updatedOn: "2026-01-28T11:00:00Z",
    whatsNew:
      "A new 'us vs them' comparison table. Three columns — feature labels, your offering with ticks, and a generic competitor column with crosses. Brand-logo header, highlight your column with a tinted background and accent border, and a closing line + CTA underneath. High-converting B2B pattern.",
  },
  "stat-counter": {
    addedOn: "2026-01-28T12:00:00Z",
    updatedOn: "2026-01-28T12:00:00Z",
    whatsNew:
      "A new big-number block. 2-5 columns of large stats (with optional £/% prefix-suffix and per-stat accent colours), an optional eyebrow + heading + intro, an optional trailing CTA, and a count-up animation that ramps the numbers from zero when the section scrolls into view. Respects prefers-reduced-motion. Perfect for 'we saved 36%' / 'cut tooling by 50%' impact bands.",
  },
  "video-embed": {
    addedOn: "2026-01-28T13:00:00Z",
    updatedOn: "2026-01-28T13:00:00Z",
    whatsNew:
      "A new privacy-friendly video block. Paste any YouTube or Vimeo URL, drop a poster image, and the section renders a clickable poster with a centred play button. Clicking opens a modal lightbox that injects the iframe on demand — nothing loads from YouTube/Vimeo until the user actually presses play. Built-in ESC-to-close, click-outside-to-dismiss, focus management and body scroll-lock. Aspect ratio, lightbox width and play-button style are all configurable.",
  },
};

/** Default metadata used when a section ID isn't in SECTION_META. */
export const DEFAULT_META = { addedOn: LAUNCH, updatedOn: LAUNCH };

export function metaFor(id) {
  return SECTION_META[id] || DEFAULT_META;
}
