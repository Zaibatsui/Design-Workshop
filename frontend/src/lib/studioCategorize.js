/**
 * studioCategorize — heuristic mapping from a FormGroup's `title` to
 * one of the three Inspector tabs the Studio editor exposes:
 *
 *   • content  — what the user is communicating (text, products,
 *                slides, links, list items).
 *   • design   — how it looks (colors, typography, layout, sizes,
 *                spacing, alignment, overlay).
 *   • advanced — everything else, in particular layout-affecting
 *                infrastructure (padding, visibility, autoplay,
 *                carousel behaviour, data sources, mobile-only
 *                overrides, currency / VAT).
 *
 * The lookup is intentionally a flat keyword map rather than a
 * config-per-section so adding a new section requires zero further
 * wiring — the FormGroup titles authors already use map sensibly to
 * the right tab. Unknown titles fall through to "content" so nothing
 * disappears (better to over-cluster than to lose a setting).
 */
const KEYWORDS = {
  content: [
    "header",
    "headline",
    "eyebrow",
    "content",
    "slides",
    "slide",
    "products",
    "product",
    "items",
    "list",
    "links",
    "footer link",
    "footer links",
    "logos",
    "tabs",
    "question",
    "testimonials",
    "stats",
    "features",
    "trust",
    "cards",
    "card details",
    "card text",
    "buttons",
    "rich text",
    "video",
    "image",
    "media",
    "answer",
    "details",
    "story",
  ],
  design: [
    "theme",
    "color",
    "colour",
    "typography",
    "font",
    "alignment",
    "layout",
    "spacing",
    "size",
    "appearance",
    "style",
    "border",
    "shadow",
    "overlay",
    "background",
    "ratio",
    "columns",
    "grid",
    "defaults",
    "edge fade",
    "hover",
    "tone",
  ],
  advanced: [
    "padding",
    "visibility",
    "behavior",
    "behaviour",
    "autoplay",
    "auto-play",
    "transition",
    "animation",
    "carousel",
    "mobile",
    "snippet",
    "embed",
    "scraper",
    "vat",
    "currency",
    "live",
    "data",
    "experimental",
    "advanced",
    "code",
    "ai",
    "action",
    "email",
    "schedule",
  ],
};

/**
 * Returns "content" | "design" | "advanced" for any FormGroup title.
 * Matching is case-insensitive and substring-based — first category
 * whose keyword appears in the title wins. Order of the categories
 * here matters: advanced wins over design wins over content when a
 * title contains multiple matches (e.g. "Mobile carousel" hits
 * advanced before design's "carousel" hits).
 */
export function categorizeGroupTitle(title) {
  const t = String(title || "").toLowerCase();
  if (!t) return "content";
  // Walk in priority order so multi-match titles land in the most
  // specific bucket. Advanced > design > content.
  for (const cat of ["advanced", "design", "content"]) {
    for (const kw of KEYWORDS[cat]) {
      if (t.includes(kw)) return cat;
    }
  }
  return "content";
}

export const STUDIO_TABS = [
  { id: "content", label: "Content" },
  { id: "design", label: "Design" },
  { id: "advanced", label: "Advanced" },
];
