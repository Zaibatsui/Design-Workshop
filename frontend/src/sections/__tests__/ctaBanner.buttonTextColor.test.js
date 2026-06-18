/**
 * Regression: CTA Banner exposes a `buttonTextColor` field so users
 * can change the primary button's text colour. Previously the colour
 * was hardcoded to `#fff` in `.ns-btn-primary`, which made the button
 * label invisible whenever the user picked a white/very-light accent.
 *
 * This file verifies:
 *  - `defaults()` exposes `buttonTextColor: "#ffffff"` (back-compat).
 *  - The renderer's `.ns-btn-primary` CSS uses the configured
 *    `buttonTextColor`, not a hardcoded `#fff`.
 *  - The FormPanel renders a `cta-btn-text` ColorField for the
 *    user to edit it.
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "../ctaBanner.js"),
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

expect(
  "defaults() declares buttonTextColor: \"#ffffff\"",
  /buttonTextColor:\s*"#ffffff"/.test(src)
);

expect(
  "render derives buttonTextColor via safeColor(cfg.buttonTextColor, \"#ffffff\")",
  /const\s+buttonTextColor\s*=\s*safeColor\(\s*cfg\.buttonTextColor,\s*"#ffffff"\s*\)/.test(
    src
  )
);

expect(
  "ns-btn-primary CSS rule uses the dynamic buttonTextColor",
  /\.ns-btn-primary\{background:\$\{accent\};color:\$\{buttonTextColor\}\}/.test(
    src
  )
);

expect(
  "ns-btn-primary CSS no longer hardcodes color:#fff",
  !/\.ns-btn-primary\{background:\$\{accent\};color:#fff\}/.test(src)
);

expect(
  "FormPanel exposes a ColorField with testid='cta-btn-text'",
  /testid="cta-btn-text"/.test(src) && /Button text colour/.test(src)
);

expect(
  "FormPanel ColorField writes to config.buttonTextColor",
  /onUpdate\(\s*\{\s*buttonTextColor:\s*v\s*\}\s*\)/.test(src)
);

console.log(`\n${failed === 0 ? "ALL PASSED" : "FAILED"} (${passed} passed, ${failed} failed)`);
if (failed > 0) process.exit(1);
