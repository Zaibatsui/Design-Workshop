/**
 * Regression: Hero slides expose an optional per-slide `eyebrow`
 * text + per-slide `titleColor` / `subtitleColor` / `eyebrowColor`
 * overrides so a carousel can mix slides on light and dark
 * backgrounds without each slide being forced to share one global
 * text colour.
 *
 * This test guards the *renderer* helpers (string-level inspection)
 * and the form-panel field declarations so a future refactor can't
 * silently regress either layer.
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "../hero.js"),
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

// ─── Helper presence ──────────────────────────────────────────────
expect(
  "slideTitleStyle helper exists",
  /function slideTitleStyle\(slide\)/.test(src)
);
expect(
  "slideSubtitleStyle helper exists",
  /function slideSubtitleStyle\(slide\)/.test(src)
);
expect(
  "slideEyebrowStyle helper exists",
  /function slideEyebrowStyle\(slide, t\)/.test(src)
);
expect(
  "slideEyebrowHtml helper renders a .ns-eyebrow <p>",
  /function slideEyebrowHtml[\s\S]*?<p class="ns-eyebrow"\$\{slideEyebrowStyle\(slide, t\)\}>\$\{escHtml\(eb\)\}<\/p>/m.test(
    src
  )
);

// ─── All three renderers wire the eyebrow above the title ─────────
const renderers = src.match(/slideEyebrowHtml\(slide, cfg\.theme\)/g) || [];
expect(
  "slideEyebrowHtml is referenced by all 3 renderers (split + slide + fade)",
  renderers.length === 3
);

// ─── All three renderers apply per-slide title/subtitle colour ────
const titleStyleHits = src.match(/<h2 class="ns-title"\$\{slideTitleStyle\(slide\)\}>/g) || [];
expect(
  "slideTitleStyle applied to all 3 ns-title elements",
  titleStyleHits.length === 3
);
const subStyleHits = src.match(/<p class="ns-subtitle"\$\{slideSubtitleStyle\(slide\)\}>/g) || [];
expect(
  "slideSubtitleStyle applied to all 3 ns-subtitle elements",
  subStyleHits.length === 3
);

// ─── CSS rule for .ns-eyebrow exists in both flow and fade ────────
const eyebrowCss = src.match(/\.ns-eyebrow\{[^}]*letter-spacing:\.18em[^}]*text-transform:uppercase/g) || [];
expect(
  "Both slide + fade renderers emit a .ns-eyebrow CSS rule",
  eyebrowCss.length >= 2
);
expect(
  ".ns-eyebrow falls back to var(--ns-title) when no slide override is set",
  /\.ns-eyebrow\{[^}]*color:var\(--ns-title\)\}/.test(src)
);

// ─── Form panel exposes the new fields ────────────────────────────
expect(
  "Form panel exposes Eyebrow TextField (testid hero-slide-eyebrow-)",
  /testid=\{`hero-slide-eyebrow-\$\{slide\.id\}`\}/.test(src) &&
    /label="Eyebrow \(optional\)"/.test(src)
);
expect(
  "Form panel exposes Title colour ColorField",
  /testid=\{`hero-slide-title-color-\$\{slide\.id\}`\}/.test(src) &&
    /label="Title colour"/.test(src)
);
expect(
  "Form panel exposes Subtitle colour ColorField",
  /testid=\{`hero-slide-subtitle-color-\$\{slide\.id\}`\}/.test(src) &&
    /label="Subtitle colour"/.test(src)
);
expect(
  "Form panel exposes Eyebrow colour ColorField (gated behind slide.eyebrow)",
  /testid=\{`hero-slide-eyebrow-color-\$\{slide\.id\}`\}/.test(src) &&
    /label="Eyebrow colour"/.test(src) &&
    /\{slide\.eyebrow \?/.test(src)
);

// ─── Back-compat: empty eyebrow → no <p> emitted ──────────────────
expect(
  "slideEyebrowHtml returns empty string when no eyebrow text present",
  /if \(!eb\) return "";/.test(src)
);
expect(
  "slideTitleStyle returns empty string when titleColor is blank (back-compat)",
  /slide\.titleColor[\s\S]*?\.trim\(\)[\s\S]*?return c \?/.test(src)
);

// ─── Line-height bumped to 1.2 (was 1.1) per user feedback ────────
// (Now driven by `num(cfg.titleLineHeight, 1.2)` via the Brand Kit —
//  the fallback inside `num()` is the 1.2 default that locks in the
//  back-compat behaviour for sections that pre-date the kit field.)
const lh12 = src.match(/line-height:\$\{num\(cfg\.titleLineHeight, 1\.2\)\}/g) || [];
expect(
  "Both ns-title CSS rules in hero read titleLineHeight (fallback 1.2)",
  lh12.length === 2
);
expect(
  "No ns-title rule still uses the old line-height:1.1",
  !/\.ns-title\{[^\n]*line-height:1\.1/.test(src)
);

console.log(`\n${failed === 0 ? "ALL PASSED" : "FAILED"} (${passed} passed, ${failed} failed)`);
if (failed > 0) process.exit(1);
