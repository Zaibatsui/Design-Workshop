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

// ─── Regression: `contentFullWidth` toggle drops the 1200px constraint
// on .ns-inner so users can paste wide custom HTML (e.g. an image
// carousel) and have it span the whole section width. Default OFF
// preserves the comfortable 1200px reading column for plain text.
expect(
  "defaults() includes contentFullWidth: false (opt-in)",
  /contentFullWidth:\s*false/.test(richtextSrc)
);
expect(
  "render destructures contentFullWidth from cfg",
  /contentFullWidth\s*=\s*false,/.test(richtextSrc)
);
expect(
  "ns-inner CSS branches on contentFullWidth (off → 1200px, on → none/100%)",
  /contentFullWidth\s*\?\s*"max-width:none;width:100%;margin:0"\s*:\s*"max-width:1200px;margin:0 auto"/.test(
    richtextSrc
  )
);

// ─── Regression: `contentFullWidth` toggle drops the 1200px constraint
// on .ns-inner so users can paste wide custom HTML (e.g. an image
// carousel) and have it span the whole section width. Default OFF
// preserves the comfortable 1200px reading column for plain text.
const richtextMod = require(path.join(__dirname, "../richtext.js"));
{
  const off = richtextMod.richtext.render({
    html: "<p>plain</p>",
    contentFullWidth: false,
  });
  expect(
    "contentFullWidth=false keeps the 1200px max-width on .ns-inner",
    /\.ns-inner\{max-width:1200px;margin:0 auto/.test(off)
  );
  expect(
    "contentFullWidth=false does NOT emit max-width:none",
    !/\.ns-inner\{max-width:none/.test(off)
  );
}
{
  const on = richtextMod.richtext.render({
    html: "<div class=\"my-carousel\">…</div>",
    contentFullWidth: true,
  });
  expect(
    "contentFullWidth=true drops the max-width on .ns-inner",
    /\.ns-inner\{max-width:none;width:100%;margin:0/.test(on)
  );
}

if (process.exitCode) {
  console.log("\nrichtext.flowRoot regression FAILED");
} else {
  console.log("\nALL PASSED (5 assertions)");
}
