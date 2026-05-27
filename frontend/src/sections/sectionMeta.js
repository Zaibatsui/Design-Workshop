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
    updatedOn: "2026-02-19",
    whatsNew:
      "Hero now has separate desktop and mobile controls — set different gradients, alignment and arrows for each screen size without one breaking the other.",
  },
  "split-banner": {
    addedOn: LAUNCH,
    updatedOn: "2026-02-26",
    whatsNew:
      "You can now add a list of icon + title + body points inside the text panel. Great for showing several benefits at once instead of just one CTA.",
  },
  welcome: { addedOn: LAUNCH, updatedOn: LAUNCH },
  content: { addedOn: LAUNCH, updatedOn: LAUNCH },
  products: {
    addedOn: LAUNCH,
    updatedOn: "2026-05-26",
    whatsNew:
      "The optional corner-badge upload is now tucked behind a small disclosure with clearer wording — no more mistaking it for the main product photo.",
  },
  "product-grid": {
    addedOn: LAUNCH,
    updatedOn: "2026-05-26",
    whatsNew:
      "The optional corner-badge upload is now tucked behind a small disclosure with clearer wording — no more mistaking it for the main product photo.",
  },
  resources: { addedOn: LAUNCH, updatedOn: LAUNCH },
  insights: { addedOn: LAUNCH, updatedOn: LAUNCH },
  "feature-grid": { addedOn: LAUNCH, updatedOn: LAUNCH },
  steps: { addedOn: LAUNCH, updatedOn: LAUNCH },
  testimonials: { addedOn: LAUNCH, updatedOn: LAUNCH },
  faq: {
    addedOn: LAUNCH,
    updatedOn: "2026-02-23",
    whatsNew:
      "Centering the header no longer pushes your answers off to the middle of the page. Title and answers behave independently now.",
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
      "Two new toggles sit above the Layout group: one to let inline styles and colours from your pasted HTML win, and one to turn off the link underline. Pasted-link styling now also survives the Visual editor.",
  },

  // 2026-05-26 — new arrivals
  "featured-card": {
    addedOn: "2026-05-26",
    updatedOn: "2026-05-26",
    whatsNew:
      "A new section: a big photo background with a clean card holding your headline, supporting points and an optional button. Perfect for hero intros, process steps and final calls to action.",
  },
  "trust-strip": {
    addedOn: "2026-05-26",
    updatedOn: "2026-05-26",
    whatsNew:
      "A new compact row of icons and one-line callouts. Ideal for credibility marks like '20+ years' or '5-star service' between heavier sections.",
  },
};

/** Default metadata used when a section ID isn't in SECTION_META. */
export const DEFAULT_META = { addedOn: LAUNCH, updatedOn: LAUNCH };

export function metaFor(id) {
  return SECTION_META[id] || DEFAULT_META;
}
