/**
 * Brand Kit — centralized colors + fonts that auto-apply to new sections.
 *
 * The kit lives on the user record (per-user) and is fetched at app boot
 * via `BrandKitContext`. When a new section is created we overlay the
 * kit's values onto the section type's pristine defaults via
 * `applyBrandKit(typeId, defaults, kit)`. Existing sections aren't
 * touched unless the user explicitly clicks "Reset to brand kit" in the
 * editor.
 */

/**
 * Sentinel value for "inherit from the host site". When a font is set to
 * this, the snippet's @import line and font-family declarations get
 * stripped so the snippet picks up whatever CSS the embedding site
 * provides.
 */
export const INHERIT_FONT = "inherit";

/**
 * Curated Google Fonts. Ordered alphabetically. Keep tight — every entry
 * costs a font-weight permutation in the @import, which inflates the
 * user's page weight.
 */
export const FONTS = [
  { name: "Inter", category: "sans" },
  { name: "Lato", category: "sans" },
  { name: "Merriweather", category: "serif" },
  { name: "Montserrat", category: "sans" },
  { name: "Nunito", category: "sans" },
  { name: "Open Sans", category: "sans" },
  { name: "Playfair Display", category: "serif" },
  { name: "Poppins", category: "sans" },
  { name: "Raleway", category: "sans" },
  { name: "Roboto", category: "sans" },
  { name: "Source Sans 3", category: "sans" },
  { name: "Work Sans", category: "sans" },
];

export const FONT_NAMES = FONTS.map((f) => f.name);

export const DEFAULT_BRAND_KIT = {
  primary_color: "#E01839",
  secondary_color: "#1f2937",
  text_color: "#1f2937",
  background_color: "#ffffff",
  heading_font: "Poppins",
  body_font: "Poppins",
};

/**
 * Build the Google Fonts @import URL for a given font name. The returned
 * URL bundles the same weight set Poppins originally shipped (300–700).
 */
export function fontImportUrl(fontName) {
  const safe = (fontName || "Poppins").trim();
  const family = safe.replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700&display=swap`;
}

// ──────────────────────────────────────────────────────────────────────
// Section field mappings.
//
// Each entry maps a brand kit key onto config fields for that section.
// Keep these explicit (vs. magic suffix matching) so changing a brand
// color never silently mutates an unintended field.
// ──────────────────────────────────────────────────────────────────────
function applyToHero(cfg, b) {
  const next = { ...cfg, font: b.heading_font };
  if (Array.isArray(cfg.layouts)) {
    next.layouts = cfg.layouts.map((l) => ({
      ...l,
      titleColor: b.text_color,
      subtitleColor: b.text_color,
      ctaBg: b.primary_color,
      ctaColor: b.background_color,
    }));
  }
  if (Array.isArray(cfg.slides)) {
    next.slides = cfg.slides.map((s) => ({
      ...s,
      titleColor: s.titleColor || b.text_color,
      subtitleColor: s.subtitleColor || b.text_color,
    }));
  }
  return next;
}

const FIELD_MAP = {
  hero: applyToHero,
  content: (cfg, b) => ({
    ...cfg,
    headingColor: b.primary_color,
    bodyColor: b.text_color,
    background: b.background_color,
    primaryColor: b.primary_color,
    font: b.heading_font,
  }),
  products: (cfg, b) => ({
    ...cfg,
    titleColor: b.text_color,
    priceColor: b.primary_color,
    hoverBorder: b.primary_color,
    font: b.heading_font,
  }),
  insights: (cfg, b) => ({
    ...cfg,
    accentColor: b.primary_color,
    titleColor: b.text_color,
    font: b.heading_font,
  }),
  resources: (cfg, b) => ({
    ...cfg,
    accentColor: b.primary_color,
    titleColor: b.text_color,
    font: b.heading_font,
  }),
  break: (cfg, b) => ({
    ...cfg,
    headingColor: b.background_color,
    overlayColor: b.text_color,
    font: b.heading_font,
  }),
  tabs: (cfg, b) => ({
    ...cfg,
    accentColor: b.primary_color,
    titleColor: b.text_color,
    font: b.heading_font,
  }),
  logos: (cfg, b) => ({
    ...cfg,
    bgColor: b.background_color,
    font: b.heading_font,
  }),
  placeholder: (cfg, b) => ({ ...cfg, font: b.heading_font }),
};

/**
 * Overlay brand kit values onto a section's pristine defaults. Returns a
 * new object — the input is not mutated. Sections without a registered
 * mapper just get a `font` field stamped on.
 */
export function applyBrandKit(typeId, config, brandKit) {
  if (!brandKit) return config;
  const mapper = FIELD_MAP[typeId];
  if (mapper) return mapper(config, brandKit);
  return { ...config, font: brandKit.heading_font };
}

/**
 * Same overlay, but for the unified richtext block. Different shape —
 * richtext doesn't go through the section registry.
 */
export function applyBrandKitToRichText(config, brandKit) {
  if (!brandKit) return config;
  return {
    ...config,
    bg: brandKit.background_color,
    color: brandKit.text_color,
    font: brandKit.body_font,
  };
}

/**
 * Replace the default Poppins font references in a rendered snippet with
 * the user's chosen brand font. When `fontName` is the INHERIT_FONT
 * sentinel, the @import and every `font-family:"Poppins"` declaration is
 * stripped instead — the embedding site's CSS then takes over.
 *
 * Idempotent: running twice with the same font is a no-op.
 */
export function applyFontToSnippet(snippet, fontName) {
  if (!snippet) return snippet;

  // "Inherit" → strip all font directives so the host site's CSS wins.
  if (fontName === INHERIT_FONT) {
    return snippet
      .replace(
        /@import\s+url\(["']?https:\/\/fonts\.googleapis\.com\/css2\?family=Poppins[^)]*\);?/g,
        ""
      )
      // Replace font-family declarations whose stack starts with "Poppins"
      // — including system-font fallback chains (`,-apple-system,...`) and
      // optional `!important`. Stop at `;` or `}` so we don't gobble the
      // rest of the rule.
      .replace(
        /font-family:\s*"Poppins"[^;}]*/g,
        "font-family:inherit"
      );
  }

  const target = (fontName || "Poppins").trim();
  if (!target || target === "Poppins") return snippet;
  const family = target.replace(/\s+/g, "+");
  // Escape '$' in replacement strings so RegExp.replace doesn't treat them
  // as backreferences. None of today's curated fonts contain $, but better
  // safe than sorry for future additions.
  const safeReplacement = (s) => s.replace(/\$/g, "$$$$");
  return snippet
    .replace(
      /https:\/\/fonts\.googleapis\.com\/css2\?family=Poppins/g,
      safeReplacement(`https://fonts.googleapis.com/css2?family=${family}`)
    )
    .replace(
      /font-family:"Poppins"/g,
      safeReplacement(`font-family:"${target}"`)
    );
}
