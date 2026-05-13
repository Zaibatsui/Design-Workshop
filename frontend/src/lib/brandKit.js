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
  body_color: "#64748b",
  background_color: "#ffffff",
  heading_font: "Poppins",
  body_font: "Poppins",
  eyebrow_text: "",
  eyebrow_color: "",
  // Role-specific colour overrides. Blank → fall back to primary_color
  // at apply time (see `pick()` below). Lets users break a single
  // element (button, link, accent) away from the primary without
  // touching the rest.
  link_color: "",
  button_color: "",
  accent_color: "",
  logo_dark: "",
  logo_light: "",
};

/**
 * Sections that expose an `eyebrow` field. Kept as a whitelist so we
 * never silently stamp eyebrow defaults onto sections that don't
 * render one (hero, tabs, logos, placeholder).
 */
const EYEBROW_SECTIONS = new Set([
  "content",
  "products",
  "resources",
  "insights",
  "break",
  "feature-grid",
  "steps",
  "faq",
  "cta-banner",
  "testimonials",
  "welcome",
]);

function eyebrowFields(b) {
  return {
    eyebrow: b.eyebrow_text || "",
    // Fallback chain: explicit eyebrow_color > accent_color override >
    // primary. Means setting `accent_color` propagates to every accent
    // position including eyebrows, while `eyebrow_color` still wins
    // when set explicitly.
    eyebrowColor: b.eyebrow_color || b.accent_color || b.primary_color,
  };
}

// Pick a role-specific colour with primary_color as the universal
// fallback. Lets users leave button_color / link_color / accent_color
// blank and still get a consistent palette out of the box.
const pick = (b, key) => b[key] || b.primary_color;

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
  // Hero stores its colours in a nested `theme` object (ctaBg, ctaText,
  // titleColor, subtitleColor, overlayColor) — NOT in flat top-level
  // fields and NOT inside individual slides. Map onto theme so changing
  // the brand kit + Apply to library actually re-skins hero slides.
  return {
    ...cfg,
    font: b.heading_font,
    theme: {
      ...(cfg.theme || {}),
      titleColor: b.background_color,        // light text on photo bg
      subtitleColor: b.background_color,
      ctaBg: pick(b, "button_color"),        // CTA button bg
      ctaText: b.background_color,           // CTA button text
      overlayColor: b.text_color,            // dark slate tint over photo
    },
  };
}

const FIELD_MAP = {
  hero: applyToHero,
  content: (cfg, b) => ({
    ...cfg,
    headingColor: pick(b, "accent_color"),
    bodyColor: b.body_color,
    background: b.background_color,
    primaryColor: pick(b, "button_color"),
    font: b.heading_font,
  }),
  products: (cfg, b) => ({
    ...cfg,
    titleColor: b.text_color,
    priceColor: pick(b, "accent_color"),
    hoverBorder: pick(b, "accent_color"),
    font: b.heading_font,
  }),
  insights: (cfg, b) => ({
    ...cfg,
    accentColor: pick(b, "accent_color"),
    titleColor: b.text_color,
    font: b.heading_font,
  }),
  resources: (cfg, b) => ({
    ...cfg,
    accentColor: pick(b, "accent_color"),
    tagColor: pick(b, "link_color"),
    titleColor: b.text_color,
    hoverBorder: pick(b, "accent_color"),
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
    bgColor: b.background_color,
    accentColor: pick(b, "accent_color"),
    bodyColor: b.body_color,
    font: b.heading_font,
  }),
  logos: (cfg, b) => ({
    ...cfg,
    bgColor: b.background_color,
    font: b.heading_font,
  }),
  placeholder: (cfg, b) => ({ ...cfg, font: b.heading_font }),
  // Light-on-dark / accent-driven block kinds.
  "feature-grid": (cfg, b) => ({
    ...cfg,
    bgColor: b.background_color,
    textColor: b.text_color,
    bodyColor: b.body_color,
    accentColor: pick(b, "accent_color"),
    font: b.heading_font,
  }),
  steps: (cfg, b) => ({
    ...cfg,
    bgColor: b.background_color,
    textColor: b.text_color,
    bodyColor: b.body_color,
    accentColor: pick(b, "accent_color"),
    font: b.heading_font,
  }),
  faq: (cfg, b) => ({
    ...cfg,
    bgColor: b.background_color,
    textColor: b.text_color,
    bodyColor: b.body_color,
    accentColor: pick(b, "accent_color"),
    font: b.heading_font,
  }),
  // CTA banner traditionally inverts the palette for emphasis — dark
  // background, light text, primary brand colour on the button. The
  // brand kit's `secondary_color` carries the dark slate for the bg.
  "cta-banner": (cfg, b) => ({
    ...cfg,
    bgColor: b.secondary_color,
    textColor: b.background_color,
    bodyColor: b.body_color,
    accentColor: pick(b, "button_color"),
    font: b.heading_font,
  }),
  testimonials: (cfg, b) => ({
    ...cfg,
    bgColor: b.background_color,
    cardBg: b.background_color,
    titleColor: b.text_color,
    bodyColor: b.body_color,
    accentColor: pick(b, "accent_color"),
    font: b.heading_font,
  }),
  // Welcome banner sits over a photo + dark overlay — light text is
  // intentional. We only stamp brand accent onto the highlights
  // (eyebrow, AM accent) and tint the overlay with the brand's dark
  // secondary colour.
  welcome: (cfg, b) => ({
    ...cfg,
    headerTextColor: b.background_color,
    eyebrowColor: pick(b, "accent_color"),
    amAccentColor: pick(b, "accent_color"),
    overlayColor: b.secondary_color,
    font: b.heading_font,
  }),
};

/**
 * Sections that auto-seed their logo field from the brand kit.
 *
 * The flat LOGO_SEED map covers sections with a top-level `logo` field.
 * Hero is a special case (slides[].logo) handled inline in
 * applyBrandKit below.
 *
 * `bg` indicates whether the logo sits on a dark or light background,
 * so we can pull the right brand-kit slot. Seeding only fills empty
 * fields — never overwrites a logo the user (or template) already set.
 */
const LOGO_SEED = {
  welcome: { field: "logo", bg: "dark" },
};

function seedHeroLogos(cfg, b) {
  // Hero slides typically have a dark / image background → use logo_dark.
  // We only stamp when the slide's logo is empty so per-slide customer
  // logos are preserved.
  const logo = b.logo_dark;
  if (!logo || !Array.isArray(cfg.slides)) return cfg;
  return {
    ...cfg,
    slides: cfg.slides.map((s) =>
      s.logo ? s : { ...s, logo }
    ),
  };
}

/**
 * Overlay brand kit values onto a section's pristine defaults. Returns a
 * new object — the input is not mutated. Sections without a registered
 * mapper just get a `font` field stamped on.
 *
 * `opts.seedLogos`: when true, also stamp the brand-kit logo into the
 * section's logo field(s). Seeding only fills empty logo fields — a
 * value the user (or template) already set is always preserved. Passed
 * `true` from new-section creation paths and from the "Apply to library"
 * bulk button on the Brand Kit page so the brand logos flow into both
 * fresh and existing sections without clobbering per-customer logos.
 */
export function applyBrandKit(typeId, config, brandKit, opts = {}) {
  if (!brandKit) return config;
  const mapper = FIELD_MAP[typeId];
  let next = mapper
    ? mapper(config, brandKit)
    : { ...config, font: brandKit.heading_font };
  if (EYEBROW_SECTIONS.has(typeId)) {
    next = { ...next, ...eyebrowFields(brandKit) };
  }
  if (opts.seedLogos) {
    const seed = LOGO_SEED[typeId];
    if (seed) {
      const url = seed.bg === "dark" ? brandKit.logo_dark : brandKit.logo_light;
      if (url && !next[seed.field]) {
        next = { ...next, [seed.field]: url };
      }
    }
    if (typeId === "hero") {
      next = seedHeroLogos(next, brandKit);
    }
  }
  return next;
}

/**
 * Same overlay, but for the unified richtext block. The richtext
 * renderer reads `bg`, `fg`, and `accent` — older versions of this
 * helper wrote `color` / `font` keys that the renderer ignored, so
 * Apply-to-library appeared to do nothing for richtext blocks.
 */
export function applyBrandKitToRichText(config, brandKit) {
  if (!brandKit) return config;
  return {
    ...config,
    bg: brandKit.background_color,
    fg: brandKit.text_color,
    accent: brandKit.link_color || brandKit.primary_color,
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
