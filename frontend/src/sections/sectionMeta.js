/**
 * SECTION_META — per-section "added on" / "updated on" dates that drive
 * the automated NEW / UPDATED badges in the Add-Section picker.
 *
 * Maintenance contract (followed by the agent on each deploy):
 *   • Adding a new section → add a row with `addedOn` set to today.
 *     `updatedOn` should equal `addedOn` on day one.
 *   • Making a user-visible improvement to an existing section → bump
 *     `updatedOn` to today.
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
  hero: { addedOn: LAUNCH, updatedOn: "2026-02-19" }, // mobile overrides + wide-mode align
  "split-banner": { addedOn: LAUNCH, updatedOn: "2026-02-26" }, // feature-points mode
  welcome: { addedOn: LAUNCH, updatedOn: LAUNCH },
  content: { addedOn: LAUNCH, updatedOn: LAUNCH },
  products: { addedOn: LAUNCH, updatedOn: LAUNCH },
  "product-grid": { addedOn: LAUNCH, updatedOn: LAUNCH },
  resources: { addedOn: LAUNCH, updatedOn: LAUNCH },
  insights: { addedOn: LAUNCH, updatedOn: LAUNCH },
  "feature-grid": { addedOn: LAUNCH, updatedOn: LAUNCH },
  steps: { addedOn: LAUNCH, updatedOn: LAUNCH },
  testimonials: { addedOn: LAUNCH, updatedOn: LAUNCH },
  faq: { addedOn: LAUNCH, updatedOn: "2026-02-23" }, // header-alignment scope fix
  "cta-banner": { addedOn: LAUNCH, updatedOn: LAUNCH },
  placeholder: { addedOn: LAUNCH, updatedOn: LAUNCH },
  logos: { addedOn: LAUNCH, updatedOn: LAUNCH },
  break: { addedOn: LAUNCH, updatedOn: LAUNCH },
  tabs: { addedOn: LAUNCH, updatedOn: LAUNCH },
  richtext: { addedOn: LAUNCH, updatedOn: "2026-02-25" }, // alignment + max-width fix

  // 2026-02-26 — new arrivals
  "featured-card": { addedOn: "2026-02-26", updatedOn: "2026-02-26" },
  "trust-strip": { addedOn: "2026-02-26", updatedOn: "2026-02-26" },
};

/** Default metadata used when a section ID isn't in SECTION_META. */
export const DEFAULT_META = { addedOn: LAUNCH, updatedOn: LAUNCH };

export function metaFor(id) {
  return SECTION_META[id] || DEFAULT_META;
}
