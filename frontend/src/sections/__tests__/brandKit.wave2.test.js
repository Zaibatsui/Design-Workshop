/**
 * Regression: Brand Kit second wave — 6 new global controls + the
 * brandKit.js helpers/mappers/seeders that fan them out into
 * section configs.
 *
 *   1. title_letter_spacing → Hero + Split Banner .ns-title
 *   2. card_radius          → products / productGrid / resources /
 *                             insights / feature-grid / testimonials
 *   3. section_spacing      → universal paddingTop/Bottom presets
 *   4. body_weight          → richtext body
 *   5. eyebrow_uppercase + eyebrow_letter_spacing → Hero, Split
 *                             Banner, Content eyebrow rules + all
 *                             EYEBROW_SECTIONS via eyebrowFields()
 *   6. default_cta_text     → seeded onto empty CTA text fields
 *                             when opts.seedDefaults is passed
 */
const fs = require("fs");
const path = require("path");

const read = (p) => fs.readFileSync(path.join(__dirname, p), "utf8");
const brandKit = read("../../lib/brandKit.js");
const hero = read("../hero.js");
const split = read("../splitBanner.js");
const content = read("../content.js");
const richtext = read("../richtext.js");
const products = read("../products.js");
const productGrid = read("../productGrid.js");
const resources = read("../resources.js");
const insights = read("../insights.js");
const featureGrid = read("../featureGrid.js");
const testimonials = read("../testimonials.js");

let passed = 0;
let failed = 0;
function expect(label, cond) {
  if (cond) {
    console.log("PASS ·", label);
    passed++;
  } else {
    console.error("FAIL ·", label);
    failed++;
  }
}

// ─── DEFAULT_BRAND_KIT ────────────────────────────────────────────
expect("DEFAULT_BRAND_KIT has title_letter_spacing", /title_letter_spacing:\s*-?0\.02/.test(brandKit));
expect("DEFAULT_BRAND_KIT has card_radius", /card_radius:\s*8/.test(brandKit));
expect("DEFAULT_BRAND_KIT has section_spacing", /section_spacing:\s*"default"/.test(brandKit));
expect("DEFAULT_BRAND_KIT has body_weight", /body_weight:\s*400/.test(brandKit));
expect("DEFAULT_BRAND_KIT has eyebrow_uppercase: true", /eyebrow_uppercase:\s*true/.test(brandKit));
expect("DEFAULT_BRAND_KIT has eyebrow_letter_spacing: 0.18", /eyebrow_letter_spacing:\s*0\.18/.test(brandKit));
expect("DEFAULT_BRAND_KIT has default_cta_text: ''", /default_cta_text:\s*""/.test(brandKit));

// ─── eyebrowFields() helper extended ──────────────────────────────
expect(
  "eyebrowFields returns eyebrowUppercase + eyebrowLetterSpacing",
  /eyebrowUppercase:\s*b\.eyebrow_uppercase\s*\?\?\s*true/.test(brandKit) &&
    /eyebrowLetterSpacing:\s*b\.eyebrow_letter_spacing\s*\?\?\s*0\.18/.test(
      brandKit
    )
);

// ─── Spacing scale helper ─────────────────────────────────────────
expect(
  "applySpacingScale overlays paddingTop/Bottom from SPACING_PRESETS",
  /SPACING_PRESETS\s*=\s*\{[\s\S]*compact:\s*\{\s*paddingTop:\s*40[\s\S]*spacious:\s*\{\s*paddingTop:\s*96/.test(
    brandKit
  ) && /applySpacingScale/.test(brandKit)
);

// ─── Default CTA seeder ───────────────────────────────────────────
expect(
  "applyDefaultCta stamps default_cta_text onto empty CTA fields",
  /applyDefaultCta\(cfg, b\)[\s\S]{0,400}b\.default_cta_text/.test(brandKit) &&
    /CTA_FIELDS\s*=\s*\["ctaText",\s*"buttonText"/.test(brandKit)
);
expect(
  "applyBrandKit calls applyDefaultCta only when opts.seedDefaults is true",
  /if \(opts\.seedDefaults\)\s*\{\s*next\s*=\s*applyDefaultCta/.test(brandKit)
);

// ─── Hero mapper wires letter-spacing + eyebrow style ─────────────
expect(
  "applyToHero stamps titleLetterSpacing",
  /titleLetterSpacing:\s*b\.title_letter_spacing\s*\?\?\s*-0\.02/.test(brandKit)
);
expect(
  "applyToHero stamps eyebrowUppercase + eyebrowLetterSpacing",
  /eyebrowUppercase:\s*b\.eyebrow_uppercase[\s\S]{0,200}eyebrowLetterSpacing:\s*b\.eyebrow_letter_spacing/.test(
    brandKit
  )
);

// ─── Hero renderer reads new values ───────────────────────────────
const heroLs = hero.match(/letter-spacing:\$\{num\(cfg\.titleLetterSpacing, -0\.02\)\}em/g) || [];
expect(
  "Hero .ns-title CSS reads num(cfg.titleLetterSpacing, -0.02)em (×2)",
  heroLs.length === 2
);
const heroEyebrow = hero.match(/letter-spacing:\$\{num\(cfg\.eyebrowLetterSpacing, 0\.18\)\}em;text-transform:\$\{cfg\.eyebrowUppercase === false \? "none" : "uppercase"\}/g) || [];
expect(
  "Hero .ns-eyebrow CSS rules read uppercase + letter-spacing from cfg (×2)",
  heroEyebrow.length === 2
);

// ─── Split Banner renderer reads new values ───────────────────────
expect(
  "Split Banner pageHeader branch uses num(cfg.titleLetterSpacing, -0.02)",
  /font-weight:700;line-height:\$\{num\(cfg\.titleLineHeight, 1\.2\)\};letter-spacing:\$\{num\(cfg\.titleLetterSpacing, -0\.02\)\}em/.test(
    split
  )
);
expect(
  "Split Banner non-pageHeader branch also uses num(cfg.titleLetterSpacing, -0.02)",
  /font-weight:600;line-height:\$\{num\(cfg\.titleLineHeight, 1\.2\)\};letter-spacing:\$\{num\(cfg\.titleLetterSpacing, -0\.02\)\}em/.test(
    split
  )
);
expect(
  "Split Banner .ns-eyebrow reads uppercase + letter-spacing from cfg",
  /\.ns-eyebrow\{[^}]*letter-spacing:\$\{num\(cfg\.eyebrowLetterSpacing, 0\.18\)\}em[^}]*text-transform:\$\{cfg\.eyebrowUppercase === false \? "none" : "uppercase"\}/.test(
    split
  )
);

// ─── Content renderer reads eyebrow style ─────────────────────────
expect(
  "Content .ns-eyebrow reads uppercase + letter-spacing from cfg",
  /\.ns-eyebrow\{[^}]*letter-spacing:\$\{num\(cfg\.eyebrowLetterSpacing, 0\.18\)\}em[^}]*text-transform:\$\{cfg\.eyebrowUppercase === false \? "none" : "uppercase"\}/.test(
    content
  )
);

// ─── Card-radius wiring (6 sections) ──────────────────────────────
expect("products .ns-card uses cardRadius", /\.ns-card\{[^}]*border-radius:\$\{num\(cfg\.cardRadius, 6\)\}px/.test(products));
expect("productGrid .ns-card uses cardRadius", /\.ns-card\{[^}]*border-radius:\$\{num\(cfg\.cardRadius, 6\)\}px/.test(productGrid));
expect("resources .ns-card uses cardRadius", /\.ns-card\{[^}]*border-radius:\$\{num\(cfg\.cardRadius, 6\)\}px/.test(resources));
expect("insights .ns-card uses cardRadius", /\.ns-card\{[^\n]*border-radius:\$\{num\(cfg\.cardRadius, 6\)\}px/.test(insights));
expect("featureGrid .ns-card uses cardRadius", /\.ns-card\{[^\n]*border-radius:\$\{num\(cfg\.cardRadius, 8\)\}px/.test(featureGrid));
expect("testimonials .ns-item uses cardRadius", /\.ns-item\{[^}]*border-radius:\$\{num\(cfg\.cardRadius, 12\)\}px/.test(testimonials));

// ─── Mappers stamp cardRadius onto card-bearing sections ──────────
for (const id of ["products", "productGrid", "insights", "resources"]) {
  expect(
    `FIELD_MAP.${id} stamps cardRadius`,
    new RegExp(`${id}:[\\s\\S]{0,400}cardRadius:\\s*b\\.card_radius\\s*\\?\\?\\s*8`).test(
      brandKit
    )
  );
}
expect(
  "FIELD_MAP['feature-grid'] stamps cardRadius",
  /"feature-grid":[\s\S]{0,400}cardRadius:\s*b\.card_radius\s*\?\?\s*8/.test(brandKit)
);
expect(
  "FIELD_MAP.testimonials stamps cardRadius",
  /testimonials:[\s\S]{0,400}cardRadius:\s*b\.card_radius\s*\?\?\s*8/.test(brandKit)
);

// ─── Body weight wiring on richtext ───────────────────────────────
expect(
  "richtext .ns-... p / li read font-weight from cfg.bodyWeight",
  /\.ns-richtext|\$\{cls\}/.test(richtext) &&
    /font-weight:\$\{num\(cfg\.bodyWeight, 400\)\}/.test(richtext)
);
expect(
  "applyBrandKitToRichText stamps bodyWeight from brandKit",
  /applyBrandKitToRichText[\s\S]{0,400}bodyWeight:\s*brandKit\.body_weight\s*\?\?\s*400/.test(
    brandKit
  )
);

// ─── Section creation paths pass seedDefaults: true ───────────────
const editor = read("../../pages/Editor.jsx");
const studioEditor = read("../../pages/studio/Editor.jsx");
const pageEditor = read("../../pages/PageEditor.jsx");
expect(
  "Editor.jsx new-section creation passes seedDefaults: true",
  /applyBrandKit\(newType, def\.defaults\(\), brandKit, \{ seedLogos: true, seedDefaults: true \}\)/.test(
    editor
  )
);
expect(
  "studio/Editor.jsx new-section creation passes seedDefaults: true",
  /applyBrandKit\(newType, def\.defaults\(\), brandKit, \{ seedLogos: true, seedDefaults: true \}\)/.test(
    studioEditor
  )
);
expect(
  "PageEditor.jsx new-section creation passes seedDefaults: true",
  /applyBrandKit\(typeId, def\.defaults\(\), brandKit, \{ seedLogos: true, seedDefaults: true \}\)/.test(
    pageEditor
  )
);

console.log(`\n${failed === 0 ? "ALL PASSED" : "FAILED"} (${passed} passed, ${failed} failed)`);
if (failed > 0) process.exit(1);
