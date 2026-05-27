/**
 * PAGE_TEMPLATE_META — per-template "added on" / "updated on" dates that
 * drive the automated NEW / UPDATED badges in the Page Template picker,
 * and the optional `whatsNew` line shown inside the What's New drawer.
 *
 * Maintenance contract (mirrors `sectionMeta.js`):
 *   • Adding a new template → add a row with `addedOn` set to today and
 *     a `whatsNew` line that reads naturally to a non-technical user
 *     (focus on what they can DO with it, not how it was built).
 *   • Making a user-visible improvement to an existing template → bump
 *     `updatedOn` to today and rewrite `whatsNew` to describe the change
 *     in plain language.
 *
 * NEW trumps UPDATED. A template within its 14-day NEW window keeps the
 * NEW badge even if its `updatedOn` is bumped. Once the window expires
 * the template may then qualify for an UPDATED badge if its last
 * `updatedOn` lands in the 3 most-recent template updates.
 *
 * Keys are template IDs (matching `PAGE_TEMPLATES_BY_ID`). Missing IDs
 * fall back to the platform launch date so they never qualify for badges.
 */
const LAUNCH = "2025-09-01";

export const PAGE_TEMPLATE_META = {
  // Pre-existing templates — launched together.
  blank: { addedOn: LAUNCH, updatedOn: LAUNCH },
  landing: { addedOn: LAUNCH, updatedOn: LAUNCH },
  "product-detail": { addedOn: LAUNCH, updatedOn: LAUNCH },
  "category-hub": { addedOn: LAUNCH, updatedOn: LAUNCH },
  "about-us": { addedOn: LAUNCH, updatedOn: LAUNCH },
  pricing: { addedOn: LAUNCH, updatedOn: LAUNCH },
  "blog-post": { addedOn: LAUNCH, updatedOn: LAUNCH },

  // 2026-02-14 — Brand page (vendor-style landing pre-fill)
  "brand-page": {
    addedOn: "2026-02-14",
    updatedOn: "2026-02-14",
    whatsNew:
      "Pre-fills a brand page in one click — split banner, use-case cards, tech tabs, product carousel and a brand statement. Great for a vendor landing.",
  },

  // 2026-02-19 — Service landing template (new section stack)
  "service-landing": {
    addedOn: "2026-02-19",
    updatedOn: "2026-02-19",
    whatsNew:
      "A new template for service-led pages: problem → solution → trust → process → CTA. Pre-fills the new Featured Card and Trust Strip sections.",
  },
};

/** Default metadata used when a template ID isn't in PAGE_TEMPLATE_META. */
export const DEFAULT_TEMPLATE_META = { addedOn: LAUNCH, updatedOn: LAUNCH };

export function templateMetaFor(id) {
  return PAGE_TEMPLATE_META[id] || DEFAULT_TEMPLATE_META;
}
