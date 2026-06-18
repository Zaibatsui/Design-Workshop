/**
 * Regression: link-arrow affordances in the snippet HTML must NOT use
 * the Unicode `→` (U+2192) character — some host pages serve fonts
 * without a glyph at that codepoint and fall back to "?" / tofu.
 * The arrow is rendered as inline SVG instead, sized via `1em` and
 * stroked with `currentColor` so it scales with the surrounding text.
 *
 * Sections audited: shared.js (footerLinkHtml default), insights.js
 * (card link text). If another section grows a link affordance later,
 * add an entry below.
 */
const fs = require("fs");
const path = require("path");

const sharedSrc = fs.readFileSync(path.join(__dirname, "../shared.js"), "utf8");
const insightsSrc = fs.readFileSync(path.join(__dirname, "../insights.js"), "utf8");

function expect(label, ok, detail = "") {
  if (ok) console.log(`PASS · ${label}`);
  else {
    console.log(`FAIL · ${label}${detail ? ` — ${detail}` : ""}`);
    process.exitCode = 1;
  }
}

// Helper: split a JS source into "executable code only" by stripping
// block comments (/* … */) and line comments (// …). We then check
// the remainder for the literal `→` codepoint. This way the JSDoc
// blocks documenting the bug history (which intentionally mention
// the character) don't trip the regression.
function stripComments(src) {
  return src
    // block comments (greedy across newlines — non-greedy still safe)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // single-line comments
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const sharedExec = stripComments(sharedSrc);
const insightsExec = stripComments(insightsSrc);

expect(
  "shared.js exports DEFAULT_ARROW_SVG",
  /export const DEFAULT_ARROW_SVG\s*=\s*'<svg/.test(sharedSrc)
);

expect(
  "shared.js footerLinkHtml uses DEFAULT_ARROW_SVG (not literal arrow)",
  /\$\{DEFAULT_ARROW_SVG\}/.test(sharedSrc)
);

expect(
  "shared.js executable code carries no literal `→` character",
  !/→/.test(sharedExec),
  "literal arrow re-introduced in code (not comments) — host fonts without U+2192 will render `?`"
);

expect(
  "insights.js imports DEFAULT_ARROW_SVG",
  /DEFAULT_ARROW_SVG,/.test(insightsSrc)
);

expect(
  "insights.js card link uses DEFAULT_ARROW_SVG (not literal arrow)",
  /\$\{DEFAULT_ARROW_SVG\}/.test(insightsSrc)
);

expect(
  "insights.js executable code carries no literal `→` character",
  !/→/.test(insightsExec)
);

// SVG content sanity — keeps the path simple and uses currentColor so
// it inherits link colour automatically. A future refactor swapping
// to a different glyph should still keep these properties.
expect(
  "DEFAULT_ARROW_SVG uses currentColor stroke (inherits link colour)",
  /stroke="currentColor"/.test(sharedSrc)
);

expect(
  "DEFAULT_ARROW_SVG sized via 1em (scales with surrounding text)",
  /width="1em" height="1em"/.test(sharedSrc)
);

if (process.exitCode) {
  console.log("\nlinkArrow regression FAILED");
} else {
  console.log("\nALL PASSED (8 assertions)");
}
