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
 * NEW trumps UPDATED. A section within its 14-day NEW window keeps the
 * NEW badge even if its `updatedOn` is bumped (a follow-up improvement
 * on a brand-new section is still part of "what's new" — not yet
 * "what's changed"). Once the 14-day window expires the section may
 * then qualify for an UPDATED badge if its last `updatedOn` lands in
 * the 3 most-recent updates across the whole library.
 *
 * Anything older than the NEW window (14 days) silently loses its
 * NEW badge. Anything outside the top-3 most-recent `updatedOn` dates
 * silently loses its UPDATED badge. No manual unflagging needed.
 *
 * Keys are section IDs (matching `SECTIONS_BY_ID`). Missing IDs fall
 * back to the platform launch date so they never qualify for badges.
 */
const LAUNCH = "2025-09-01";

export const SECTION_META = {
  // Pre-existing library — launched together.
  hero: {
    addedOn: LAUNCH,
    updatedOn: "2026-05-28",
    whatsNew:
      "Hero in slide mode now loops continuously — clicking next on the last slide flows straight to the first one with no rewind, and prev on the first slide flips straight to the last. Earlier mobile-specific controls (separate gradients, alignment, arrows) remain.",
  },
  "split-banner": {
    addedOn: LAUNCH,
    updatedOn: "2026-05-28T09:00:00Z",
    whatsNew:
      "New mobile-only 'Centre text on mobile' toggle — on phones the eyebrow, heading, subheading and button sit centred under the image while desktop stays exactly as it was. You can still add a list of icon + title + body points inside the text panel.",
  },
  welcome: {
    addedOn: LAUNCH,
    updatedOn: "2026-05-28T10:00:00Z",
    whatsNew:
      "New mobile-only 'Centre text on mobile' toggle — on phones every block (header, customer logo, account manager card) sits centred while desktop keeps the positioned-grid layout exactly as it was.",
  },
  content: {
    addedOn: LAUNCH,
    updatedOn: "2026-05-28T10:30:00Z",
    whatsNew:
      "New mobile-only 'Centre text on mobile' toggle — on phones the heading, body and buttons sit centred regardless of the desktop alignment you've picked. Desktop layout is unchanged.",
  },
  products: {
    addedOn: LAUNCH,
    updatedOn: "2026-05-28",
    whatsNew:
      "Product Carousel now scrolls continuously in BOTH directions — the right-arrow infinite-loop bug is fixed, swipe-on-mobile loops too, and the carousel no longer drifts out of alignment after several full ring traversals. The corner-badge upload lives behind a clearer toggle so it's never mistaken for the main product photo.",
  },
  "product-grid": {
    addedOn: LAUNCH,
    updatedOn: "2026-05-26",
    whatsNew:
      "The optional corner-badge upload is now tucked behind a small disclosure with clearer wording — no more mistaking it for the main product photo.",
  },
  resources: {
    addedOn: LAUNCH,
    updatedOn: "2026-05-26",
    whatsNew:
      "Resources Carousel now loops continuously — both with the arrows and on mobile swipe. New per-card content alignment override means one card can sit centred while the rest stay left-aligned.",
  },
  insights: { addedOn: LAUNCH, updatedOn: LAUNCH },
  "feature-grid": { addedOn: LAUNCH, updatedOn: LAUNCH },
  steps: { addedOn: LAUNCH, updatedOn: LAUNCH },
  testimonials: {
    addedOn: LAUNCH,
    updatedOn: "2026-05-28T15:30:00Z",
    whatsNew:
      "Each testimonial card now supports an optional review-platform badge in the author footer — drop in a G2, Capterra or Trustpilot logo to add an instant credibility marker next to the author name.",
  },
  faq: {
    addedOn: LAUNCH,
    updatedOn: "2026-05-28",
    whatsNew:
      "Links inside FAQ answers now auto-resolve to full URLs even if you type 'example.com' without the https:// — they used to be appended to the host page's address and break. New per-link 'Open in a new tab' toggle so you can pick whether each link opens in the same window or a fresh tab. Rich-text toolbar still has bold / italics / lists and the inline link editor with colour and underline controls.",
  },
  "cta-banner": {
    addedOn: LAUNCH,
    updatedOn: "2026-05-28T16:00:00Z",
    whatsNew:
      "Now supports two action styles. Pick Buttons for the classic stacked CTA, or switch to Email capture to add an inline <email + submit> field — when a visitor submits, their mail client opens with a pre-filled message to your inbox so the address lands with you, ready to drop into Mailchimp / Klaviyo / whatever list tool you already use. No third-party signup, no backend. Plus the existing mobile-only Centre text toggle for phones-only alignment.",
  },
  placeholder: { addedOn: LAUNCH, updatedOn: LAUNCH },
  logos: {
    addedOn: LAUNCH,
    updatedOn: "2026-05-28T15:00:00Z",
    whatsNew:
      "Optional soft edge-fade — logos now fade in/out at the strip boundaries instead of a hard cut, matching the polished look on Stripe / Dripify / Linear. Toggleable per section with adjustable fade width.",
  },
  break: { addedOn: LAUNCH, updatedOn: LAUNCH },
  tabs: { addedOn: LAUNCH, updatedOn: LAUNCH },
  richtext: {
    addedOn: LAUNCH,
    updatedOn: "2026-05-26",
    whatsNew:
      "Visual editor now has an inline link panel — add web or email links, set a per-link colour, and turn the underline off on any single link from the toolbar. Click an existing link to re-open the panel and tweak it. Scheme-less URLs like 'example.com' are auto-resolved to 'https://example.com' so links never get appended to the host page. New per-link 'Open in a new tab' toggle.",
  },

  // Featured Card, Trust Strip and Comparison Table all share a fresh
  // 7-day NEW window starting 2026-05-28 — the date we re-surfaced
  // them on the picker so every user can spot them.
  "featured-card": {
    addedOn: "2026-05-28",
    updatedOn: "2026-05-26",
    whatsNew:
      "A new section: a big photo background with a clean card holding your headline, supporting points and an optional button. Perfect for hero intros, process steps and final calls to action.",
  },
  "trust-strip": {
    addedOn: "2026-05-28",
    updatedOn: "2026-05-26",
    whatsNew:
      "A new compact row of icons and one-line callouts. Ideal for credibility marks like '20+ years' or '5-star service' between heavier sections.",
  },
  "comparison-table": {
    addedOn: "2026-05-28T11:00:00Z",
    updatedOn: "2026-05-28T11:00:00Z",
    whatsNew:
      "A new 'us vs them' comparison table. Three columns — feature labels, your offering with ticks, and a generic competitor column with crosses. Brand-logo header, highlight your column with a tinted background and accent border, and a closing line + CTA underneath. High-converting B2B pattern.",
  },
  "stat-counter": {
    addedOn: "2026-05-28T12:00:00Z",
    updatedOn: "2026-05-28T12:00:00Z",
    whatsNew:
      "A new big-number block. 2-5 columns of large stats (with optional £/% prefix-suffix and per-stat accent colours), an optional eyebrow + heading + intro, an optional trailing CTA, and a count-up animation that ramps the numbers from zero when the section scrolls into view. Respects prefers-reduced-motion. Perfect for 'we saved 36%' / 'cut tooling by 50%' impact bands.",
  },
  "video-embed": {
    addedOn: "2026-05-28T13:00:00Z",
    updatedOn: "2026-05-28T13:00:00Z",
    whatsNew:
      "A new privacy-friendly video block. Paste any YouTube or Vimeo URL, drop a poster image, and the section renders a clickable poster with a centred play button. Clicking opens a modal lightbox that injects the iframe on demand — nothing loads from YouTube/Vimeo until the user actually presses play. Built-in ESC-to-close, click-outside-to-dismiss, focus management and body scroll-lock. Aspect ratio, lightbox width and play-button style are all configurable.",
  },
};

/** Default metadata used when a section ID isn't in SECTION_META. */
export const DEFAULT_META = { addedOn: LAUNCH, updatedOn: LAUNCH };

export function metaFor(id) {
  return SECTION_META[id] || DEFAULT_META;
}
