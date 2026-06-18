/**
 * Regression: Brand Kit gradient defaults — single source of truth
 * for the gradient that flows into CTA Banner / Split Banner / Hero
 * split-panel surfaces.
 *
 *   gradient_from / gradient_to: blank = inherit primary / secondary
 *                                 (back-compat for older kits)
 *   gradient_angle: 135 default
 *
 *   gradFrom(b) / gradTo(b) / gradAngle(b) helpers wrap the fallback
 *   logic so every mapper stays terse + consistent.
 */
const fs = require("fs");
const path = require("path");

const brandKit = fs.readFileSync(
  path.join(__dirname, "../../lib/brandKit.js"),
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
  "DEFAULT_BRAND_KIT.gradient_from defaults to ''",
  /gradient_from:\s*""/.test(brandKit)
);
expect(
  "DEFAULT_BRAND_KIT.gradient_to defaults to ''",
  /gradient_to:\s*""/.test(brandKit)
);
expect(
  "DEFAULT_BRAND_KIT.gradient_angle defaults to 135",
  /gradient_angle:\s*135/.test(brandKit)
);

// ─── Helper presence with fallback to primary/secondary ───────────
expect(
  "gradFrom helper falls back to primary_color when kit value is blank",
  /const\s+gradFrom\s*=\s*\(b\)\s*=>\s*b\.gradient_from\s*\|\|\s*b\.primary_color/.test(
    brandKit
  )
);
expect(
  "gradTo helper falls back to secondary_color when kit value is blank",
  /const\s+gradTo\s*=\s*\(b\)\s*=>\s*b\.gradient_to\s*\|\|\s*b\.secondary_color/.test(
    brandKit
  )
);
expect(
  "gradAngle helper falls back to 135",
  /const\s+gradAngle\s*=\s*\(b\)\s*=>\s*b\.gradient_angle\s*\?\?\s*135/.test(
    brandKit
  )
);

// ─── Hero mapper uses the helpers ─────────────────────────────────
expect(
  "applyToHero panelGradientFrom/To/Angle use the helpers",
  /panelGradientFrom:\s*gradFrom\(b\)/.test(brandKit) &&
    /panelGradientTo:\s*gradTo\(b\)/.test(brandKit) &&
    /panelGradientAngle:\s*gradAngle\(b\)/.test(brandKit)
);

// ─── CTA Banner mapper uses the helpers ───────────────────────────
expect(
  "cta-banner mapper gradientFrom/To/Angle use the helpers",
  /"cta-banner":[\s\S]{0,800}gradientFrom:\s*gradFrom\(b\)[\s\S]{0,200}gradientTo:\s*gradTo\(b\)[\s\S]{0,200}gradientAngle:\s*gradAngle\(b\)/.test(
    brandKit
  )
);

// ─── Split Banner mapper uses the helpers ─────────────────────────
expect(
  "split-banner mapper gradientFrom/To/Angle use the helpers",
  /"split-banner":[\s\S]{0,800}gradientFrom:\s*gradFrom\(b\)[\s\S]{0,200}gradientTo:\s*gradTo\(b\)[\s\S]{0,200}gradientAngle:\s*gradAngle\(b\)/.test(
    brandKit
  )
);

console.log(`\n${failed === 0 ? "ALL PASSED" : "FAILED"} (${passed} passed, ${failed} failed)`);
if (failed > 0) process.exit(1);
