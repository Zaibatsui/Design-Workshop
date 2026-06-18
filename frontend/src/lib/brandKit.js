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
  // Global button corner radius (px). Drives every CTA / .ns-btn across
  // every section so buttons stay visually consistent across an entire
  // page or page-group. 0 = sharp, 9999 = pill.
  button_radius: 8,
  // Global title line-height for Hero + Split Banner titles. 1.2 reads
  // tight enough for display headlines while still leaving room for
  // descenders. Users can drop to 1.0 for tight display fonts or push
  // to 1.4 for editorial layouts. Saved kits from before this field
  // default to 1.2 (matches the previous hardcoded value).
  title_line_height: 1.2,
  // Title letter-spacing (em). Negative tightens display headlines,
  // positive loosens for editorial layouts. -0.02 mirrors the value
  // sections shipped with for years.
  title_letter_spacing: -0.02,
  // Global card corner radius (px) for card-bearing sections
  // (products, productGrid, resources, insights, feature-grid,
  // testimonials). 8 sits between the previously scattered 6 / 12
  // values so existing kits look ~unchanged on apply.
  card_radius: 8,
  // Section spacing scale: "compact" | "default" | "spacious".
  // Drives paddingTop/paddingBottom defaults on NEW sections — kept
  // as a string so further presets can be added without schema work.
  section_spacing: "default",
  // Body copy font weight. 400 was the previous hardcoded value.
  // Bumping to 500 thickens body text for brands that prefer it.
  body_weight: 400,
  // Eyebrow text-transform + letter-spacing defaults. The previously
  // hardcoded values were `uppercase` and `0.18em` so these defaults
  // preserve existing snippet output.
  eyebrow_uppercase: true,
  eyebrow_letter_spacing: 0.18,
  // Default CTA microcopy. When non-empty, NEW sections with an empty
  // CTA text field get pre-filled at creation time. Existing sections
  // are never touched.
  default_cta_text: "",
  // Default gradient applied to CTA Banner / Split Banner / Hero
  // split-panel whenever the section's background is set to "gradient".
  // Blank `gradient_from` / `gradient_to` fall back to primary →
  // secondary, so kits without these fields look unchanged. Per-section
  // overrides on the section's own form still win — this is just the
  // default that lands at section-creation time.
  gradient_from: "",
  gradient_to: "",
  gradient_angle: 135,
};

/**
 * Sections that expose an `eyebrow` field. Kept as a whitelist so we
 * never silently stamp eyebrow defaults onto sections that don't
 * render one (hero, tabs, logos, placeholder).
 */
const EYEBROW_SECTIONS = new Set([
  "content",
  "products",
  "productGrid",
  "resources",
  "insights",
  "break",
  "feature-grid",
  "steps",
  "faq",
  "cta-banner",
  "testimonials",
  "welcome",
  "split-banner",
]);

function eyebrowFields(b) {
  return {
    eyebrow: b.eyebrow_text || "",
    // Fallback chain: explicit eyebrow_color > accent_color override >
    // primary. Means setting `accent_color` propagates to every accent
    // position including eyebrows, while `eyebrow_color` still wins
    // when set explicitly.
    eyebrowColor: b.eyebrow_color || b.accent_color || b.primary_color,
    // Eyebrow style is brand-kit-wide. Defaults preserve the
    // previously hardcoded uppercase + 0.18em tracking values.
    eyebrowUppercase: b.eyebrow_uppercase ?? true,
    eyebrowLetterSpacing: b.eyebrow_letter_spacing ?? 0.18,
  };
}

// Section spacing presets. "default" leaves padding alone so old
// sections keep their bespoke per-section defaults; "compact" tightens
// every section to a uniform 40px; "spacious" inflates to 96px.
const SPACING_PRESETS = {
  compact: { paddingTop: 40, paddingBottom: 40 },
  spacious: { paddingTop: 96, paddingBottom: 96 },
};
function applySpacingScale(cfg, b) {
  const preset = SPACING_PRESETS[b.section_spacing];
  if (!preset) return cfg;
  // Only seed if the field is still at the section's own pristine
  // value. We can't tell that here without per-section knowledge, so
  // we simply overlay — the brand kit only flows into NEW sections so
  // this never clobbers user-edited padding on existing sections.
  return { ...cfg, ...preset };
}

// Stamp default CTA microcopy onto common CTA text fields when the
// section ships with them blank. Only touches fields that are
// undefined or empty so a section's existing CTA text wins.
const CTA_FIELDS = ["ctaText", "buttonText", "ctaLabel", "primaryCtaText"];
function applyDefaultCta(cfg, b) {
  const txt = (b.default_cta_text || "").trim();
  if (!txt) return cfg;
  const next = { ...cfg };
  for (const f of CTA_FIELDS) {
    if (!next[f]) next[f] = txt;
  }
  return next;
}

// Pick a role-specific colour with primary_color as the universal
// fallback. Lets users leave button_color / link_color / accent_color
// blank and still get a consistent palette out of the box.
const pick = (b, key) => b[key] || b.primary_color;

// Gradient defaults. Empty kit values fall back to primary → secondary
// so older kits look unchanged. Single source of truth for every
// gradient surface across the library (CTA Banner, Split Banner, Hero
// split-panel) so the gradient stays consistent everywhere.
const gradFrom = (b) => b.gradient_from || b.primary_color;
const gradTo = (b) => b.gradient_to || b.secondary_color;
const gradAngle = (b) => b.gradient_angle ?? 135;

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
  //
  // Split-only panel colours (panelBg, panelGradientFrom/To) are also
  // seeded so that switching `slideLayout` to "split" immediately
  // produces brand-coloured panels without an extra editor step.
  return {
    ...cfg,
    font: b.heading_font,
    buttonRadius: b.button_radius ?? 8,
    titleLineHeight: b.title_line_height ?? 1.2,
    titleLetterSpacing: b.title_letter_spacing ?? -0.02,
    // Eyebrow style is per-slide on Hero (not a section-level field),
    // but the .ns-eyebrow CSS rule lives on the section root — so the
    // kit's uppercase + letter-spacing values are stamped onto the
    // section cfg directly and read by both slide and fade renderers.
    eyebrowUppercase: b.eyebrow_uppercase ?? true,
    eyebrowLetterSpacing: b.eyebrow_letter_spacing ?? 0.18,
    theme: {
      ...(cfg.theme || {}),
      titleColor: b.background_color,        // light text on photo bg
      subtitleColor: b.background_color,
      ctaBg: pick(b, "button_color"),        // CTA button bg
      ctaText: b.background_color,           // CTA button text
      overlayColor: b.text_color,            // dark slate tint over photo
      panelBg: b.secondary_color,            // split: solid panel
      panelGradientFrom: gradFrom(b),        // split: gradient from
      panelGradientTo: gradTo(b),            // split: gradient to
      panelGradientAngle: gradAngle(b),
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
    buttonRadius: b.button_radius ?? 8,
    font: b.heading_font,
  }),
  products: (cfg, b) => ({
    ...cfg,
    titleColor: b.text_color,
    priceColor: pick(b, "accent_color"),
    hoverBorder: pick(b, "accent_color"),
    cardRadius: b.card_radius ?? 8,
    font: b.heading_font,
  }),
  productGrid: (cfg, b) => ({
    ...cfg,
    titleColor: b.text_color,
    priceColor: pick(b, "accent_color"),
    hoverBorder: pick(b, "accent_color"),
    cardRadius: b.card_radius ?? 8,
    font: b.heading_font,
  }),
  insights: (cfg, b) => ({
    ...cfg,
    accentColor: pick(b, "accent_color"),
    titleColor: b.text_color,
    cardHeadingColor: b.text_color,
    cardRadius: b.card_radius ?? 8,
    font: b.heading_font,
  }),
  resources: (cfg, b) => ({
    ...cfg,
    accentColor: pick(b, "accent_color"),
    tagColor: pick(b, "link_color"),
    titleColor: b.text_color,
    hoverBorder: pick(b, "accent_color"),
    cardRadius: b.card_radius ?? 8,
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
    buttonRadius: b.button_radius ?? 8,
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
    cardRadius: b.card_radius ?? 8,
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
    // Gradient stops mirror Split Banner: primary → secondary so the
    // CTA gradient stays on-brand whenever the user (or a template)
    // flips `backgroundType` to "gradient".
    gradientFrom: gradFrom(b),
    gradientTo: gradTo(b),
    gradientAngle: gradAngle(b),
    textColor: b.background_color,
    bodyColor: b.body_color,
    accentColor: pick(b, "button_color"),
    buttonRadius: b.button_radius ?? 8,
    font: b.heading_font,
  }),
  testimonials: (cfg, b) => ({
    ...cfg,
    bgColor: b.background_color,
    cardBg: b.background_color,
    titleColor: b.text_color,
    bodyColor: b.body_color,
    accentColor: pick(b, "accent_color"),
    cardRadius: b.card_radius ?? 8,
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
  // Split Banner mirrors the CTA banner's inverted palette: a dark
  // brand-coloured panel (solid `secondary_color` by default; users can
  // flip to a primary→secondary gradient), light text, primary brand
  // colour on the CTA. The eyebrow + eyebrow_text fields are set by
  // `eyebrowFields()` after this mapper runs (split-banner is in
  // EYEBROW_SECTIONS) so the eyebrow always picks up the brand accent.
  "split-banner": (cfg, b) => ({
    ...cfg,
    panelBg: b.secondary_color,
    gradientFrom: gradFrom(b),
    gradientTo: gradTo(b),
    gradientAngle: gradAngle(b),
    titleColor: b.background_color,
    subtitleColor: b.background_color,
    ctaBg: pick(b, "button_color"),
    ctaTextColor: b.background_color,
    buttonRadius: b.button_radius ?? 8,
    titleLineHeight: b.title_line_height ?? 1.2,
    titleLetterSpacing: b.title_letter_spacing ?? -0.02,
    font: b.heading_font,
  }),
  "featured-card": (cfg, b) => ({
    ...cfg,
    // Card sits on a light surface in front of a photo — keep text dark
    // (text_color) on a near-white card background, with the accent
    // driving the eyebrow, icon tint and headline highlight phrase.
    textColor: b.text_color,
    bodyColor: b.body_color,
    accentColor: pick(b, "accent_color"),
    cardBg: b.background_color,
    ctaBg: pick(b, "button_color"),
    ctaTextColor: b.background_color,
    overlayColor: b.text_color,
    buttonRadius: b.button_radius ?? 8,
    font: b.heading_font,
  }),
  "trust-strip": (cfg, b) => ({
    ...cfg,
    bgColor: b.background_color,
    textColor: b.text_color,
    bodyColor: b.body_color,
    accentColor: pick(b, "accent_color"),
    font: b.heading_font,
  }),
  "comparison-table": (cfg, b) => ({
    ...cfg,
    bgColor: b.background_color,
    titleColor: b.text_color,
    bodyColor: b.body_color,
    eyebrowColor: b.eyebrow_color || b.accent_color || b.primary_color,
    accentColor: pick(b, "accent_color"),
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
  "split-banner": { field: "logoUrl", bg: "dark" },
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
  // Spacing scale is universal — every section respects paddingTop/
  // paddingBottom so we can overlay without per-type knowledge.
  next = applySpacingScale(next, brandKit);
  // Default CTA microcopy: only stamp on EMPTY CTA text fields, and
  // only at SECTION CREATION (opts.seedDefaults). Existing sections
  // aren't touched so a "Apply to library" sweep never overwrites
  // bespoke CTA labels.
  if (opts.seedDefaults) {
    next = applyDefaultCta(next, brandKit);
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
    bodyWeight: brandKit.body_weight ?? 400,
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
