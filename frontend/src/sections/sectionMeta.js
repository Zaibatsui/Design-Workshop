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
    updatedOn: "2026-05-28",
    whatsNew:
      "New mobile-only 'Centre text on mobile' toggle — on phones the eyebrow, heading, subheading and button sit centred under the image while desktop stays exactly as it was. You can still add a list of icon + title + body points inside the text panel.",
  },
  welcome: { addedOn: LAUNCH, updatedOn: LAUNCH },
  content: { addedOn: LAUNCH, updatedOn: LAUNCH },
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
  testimonials: { addedOn: LAUNCH, updatedOn: LAUNCH },
  faq: {
    addedOn: LAUNCH,
    updatedOn: "2026-05-28",
    whatsNew:
      "Links inside FAQ answers now auto-resolve to full URLs even if you type 'example.com' without the https:// — they used to be appended to the host page's address and break. New per-link 'Open in a new tab' toggle so you can pick whether each link opens in the same window or a fresh tab. Rich-text toolbar still has bold / italics / lists and the inline link editor with colour and underline controls.",
  },
  "cta-banner": { addedOn: LAUNCH, updatedOn: LAUNCH },
  placeholder: { addedOn: LAUNCH, updatedOn: LAUNCH },
  logos: { addedOn: LAUNCH, updatedOn: LAUNCH },
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
    addedOn: "2026-05-28",
    updatedOn: "2026-05-28",
    whatsNew:
      "A new 'us vs them' comparison table. Three columns — feature labels, your offering with ticks, and a generic competitor column with crosses. Brand-logo header, highlight your column with a tinted background and accent border, and a closing line + CTA underneath. High-converting B2B pattern.",
  },
};

/** Default metadata used when a section ID isn't in SECTION_META. */
export const DEFAULT_META = { addedOn: LAUNCH, updatedOn: LAUNCH };

export function metaFor(id) {
  return SECTION_META[id] || DEFAULT_META;
}
