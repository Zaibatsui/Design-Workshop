/**
 * Regression: richtext section must establish a Block Formatting Context
 * (`display: flow-root`) on its root.
 *
 * Why: with the default `padding-bottom: 0`, descendant block elements'
 * `margin-bottom` (e.g. <p>'s 14px) would otherwise collapse THROUGH the
 * section boundary into the next page block, painting a visible white
 * strip below the section's background. Adding any non-zero bottom
 * padding masks the bug; the BFC fixes it at the root.
 *
 * Symptom users hit before this fix: "bottom spacing 0px shows a gap,
 * 5px hides it."
 */
const path = require("path");

// Lightweight loader for the ESM-style `richtext.js`: it re-exports its
// own default + named exports via plain ES module syntax. Strip the imports
// and rebuild as a Function so node can evaluate without a bundler.
const fs = require("fs");
const sharedSrc = fs.readFileSync(path.join(__dirname, "../shared.js"), "utf8");
const richtextSrc = fs.readFileSync(path.join(__dirname, "../richtext.js"), "utf8");

function expect(label, ok, detail = "") {
  if (ok) console.log(`PASS · ${label}`);
  else {
    console.log(`FAIL · ${label}${detail ? ` — ${detail}` : ""}`);
    process.exitCode = 1;
  }
}

// Static-source assertions (no JS execution needed — keeps this test
// dependency-free and avoids spinning up a transpiler).
expect(
  "richtext section root uses display:flow-root",
  /\.\$\{cls\}\{background:\$\{bg\};padding:\$\{padTop\}px \$\{padX\}px \$\{padBot\}px;display:flow-root\}/
    .test(richtextSrc)
);

expect(
  "shared.js still ships baseReset (sanity)",
  /export function baseReset/.test(sharedSrc)
);

if (process.exitCode) {
  console.log("\nrichtext.flowRoot regression FAILED");
} else {
  console.log("\nALL PASSED (2 assertions)");
}
