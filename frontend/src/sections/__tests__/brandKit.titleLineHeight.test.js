/**
 * Regression: Brand Kit exposes a `title_line_height` field that
 * cascades into Hero (`titleLineHeight` config) and Split Banner
 * (`titleLineHeight` config), and both renderers consume that value
 * via `num(cfg.titleLineHeight, 1.2)` so saved sections without the
 * field stay byte-identical (default 1.2).
 */
const fs = require("fs");
const path = require("path");

const brandKit = fs.readFileSync(
  path.join(__dirname, "../../lib/brandKit.js"),
  "utf8"
);
const hero = fs.readFileSync(
  path.join(__dirname, "../hero.js"),
  "utf8"
);
const split = fs.readFileSync(
  path.join(__dirname, "../splitBanner.js"),
  "utf8"
);

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
expect(
  "DEFAULT_BRAND_KIT.title_line_height defaults to 1.2",
  /title_line_height:\s*1\.2/.test(brandKit)
);

// ─── Mapper wiring ────────────────────────────────────────────────
expect(
  "applyToHero stamps titleLineHeight from brand kit",
  /titleLineHeight:\s*b\.title_line_height\s*\?\?\s*1\.2/.test(brandKit) &&
    /applyToHero[\s\S]{0,800}titleLineHeight/.test(brandKit)
);
expect(
  "split-banner mapper stamps titleLineHeight from brand kit",
  /["']split-banner["'][\s\S]{0,800}titleLineHeight:\s*b\.title_line_height\s*\?\?\s*1\.2/.test(
    brandKit
  )
);

// ─── Renderer reads with safe fallback ────────────────────────────
const heroHits = hero.match(/line-height:\$\{num\(cfg\.titleLineHeight, 1\.2\)\}/g) || [];
expect(
  "Hero .ns-title rules use num(cfg.titleLineHeight, 1.2) (×2)",
  heroHits.length === 2
);
const splitHits = split.match(/line-height:\$\{num\(cfg\.titleLineHeight, 1\.2\)\}/g) || [];
expect(
  "Split Banner .ns-title rules use num(cfg.titleLineHeight, 1.2) (×2)",
  splitHits.length === 2
);

// ─── No leftover hardcoded line-heights on these rules ───────────
expect(
  "No hero .ns-title rule still hardcodes line-height:1.2",
  !/\.ns-title\{font-size:\$\{num\(cfg\.headingSize[^\n]*line-height:1\.2[^\n]*color:var\(--ns-title\)/.test(
    hero
  )
);

console.log(`\n${failed === 0 ? "ALL PASSED" : "FAILED"} (${passed} passed, ${failed} failed)`);
if (failed > 0) process.exit(1);
