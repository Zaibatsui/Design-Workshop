/**
 * Regression: Split Banner and Hero split-panel slides become a
 * single big clickable surface when the user supplies a real CTA
 * link. The CTA itself renders as a <span> (not an <a>) so we never
 * emit nested anchors — the parent .ns-link / .ns-grid.ns-link
 * handles navigation.
 */
const fs = require("fs");
const path = require("path");

const read = (p) => fs.readFileSync(path.join(__dirname, p), "utf8");
const split = read("../splitBanner.js");
const hero = read("../hero.js");

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

// ─── Split Banner ────────────────────────────────────────────────
expect(
  "Split Banner gates link-wrap on a real ctaLink (not blank / not '#')",
  /const linkSection = Boolean\(cfg\.ctaLink && cfg\.ctaLink\.trim\(\) && cfg\.ctaLink\.trim\(\) !== "#"\)/.test(
    split
  )
);
expect(
  "Split Banner renders CTA as <span> when link-wrapped (avoids nested <a>)",
  /linkSection[\s\S]{0,400}<span class="ns-cta">/.test(split)
);
expect(
  "Split Banner anchor IS the grid container (display:grid via .ns-grid)",
  /<a class="ns-grid ns-link"/.test(split)
);
expect(
  "Split Banner anchor carries aria-label for screen readers",
  /<a class="ns-grid ns-link"[\s\S]{0,400}aria-label=/.test(split)
);
expect(
  "Split Banner .ns-link CSS resets link styling + focus ring",
  /\.ns-link\{[^}]*text-decoration:none[^}]*color:inherit/.test(split) &&
    /\.ns-link:focus-visible/.test(split)
);

// ─── Hero split-panel slides ─────────────────────────────────────
expect(
  "Hero split-slide gates link-wrap on a real slide.ctaLink",
  /const linkSlide = Boolean\([\s\S]{0,200}slide\.ctaLink\.trim\(\) !== "#"/.test(
    hero
  )
);
expect(
  "Hero split-slide CTA renders as <span> when link-wrapped",
  /linkSlide[\s\S]{0,300}<span class="ns-cta"/.test(hero)
);
expect(
  "Hero split-slide anchor IS the grid container (.ns-split-grid)",
  /<a class="ns-split-grid ns-link"/.test(hero)
);
expect(
  "Hero .ns-link.ns-split-grid CSS resets link styling",
  /\.ns-link\.ns-split-grid\{[^}]*text-decoration:none[^}]*color:inherit/.test(hero)
);

console.log(`\n${failed === 0 ? "ALL PASSED" : "FAILED"} (${passed} passed, ${failed} failed)`);
if (failed > 0) process.exit(1);
