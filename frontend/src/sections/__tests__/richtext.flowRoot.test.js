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
const fs = require("fs");

// ── Babel-on-require shim ────────────────────────────────────────
// `richtext.js` (and friends) ship ESM import syntax + JSX. Node's
// native `.js` loader won't handle either, so the runtime-require
// section at the bottom needs the same on-the-fly transpilation
// every other behavioural test in this folder uses. The shim
// only kicks in for files under `src/` — node_modules stays
// untouched and fast.
const Module = require("module");
const babel = require("@babel/core");
const SRC_ROOT = path.resolve(__dirname, "../..");
const STUB_PATH = path.join(__dirname, "_hero_stub.js");
const STUBS = new Set([
  "@/components/FormFields",
  "@/components/ColorField",
  "@/components/ImageUpload",
  "@/components/ListEditor",
  "@/components/PaddingFields",
  "@/components/FooterLinkEditor",
  "@/components/ui/label",
  "@/components/FormGroup",
  "lucide-react",
]);
const _origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUBS.has(request)) return STUB_PATH;
  if (request.startsWith("@/")) {
    const rel = request.slice(2);
    for (const c of [
      path.join(SRC_ROOT, rel + ".js"),
      path.join(SRC_ROOT, rel + ".jsx"),
    ]) {
      if (fs.existsSync(c)) return c;
    }
  }
  return _origResolve.call(this, request, parent, ...rest);
};
if (!fs.existsSync(STUB_PATH)) {
  fs.writeFileSync(
    STUB_PATH,
    "module.exports = new Proxy({}, { get: () => () => null });\n"
  );
}
const _origJsExt = require.extensions[".js"];
require.extensions[".js"] = function (module, filename) {
  if (!filename.startsWith(SRC_ROOT)) return _origJsExt(module, filename);
  const code = babel.transformSync(fs.readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [
      [require.resolve("@babel/preset-env"), { targets: { node: "18" } }],
      [require.resolve("@babel/preset-react"), { runtime: "classic" }],
    ],
  }).code;
  module._compile(code, filename);
};

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

// ─── Same toggle on the Content section (parallel implementation,
// different default max-width source — Content uses var(--ns-max)).
const contentSrc = fs.readFileSync(path.join(__dirname, "../content.js"), "utf8");
expect(
  "Content section defaults() also includes contentFullWidth: false",
  /contentFullWidth:\s*false/.test(contentSrc)
);
expect(
  "Content section ns-inner branches on contentFullWidth",
  /cfg\.contentFullWidth\s*\?\s*"max-width:none;width:100%;margin:0"\s*:\s*"max-width:var\(--ns-max\);margin:0 auto"/.test(
    contentSrc
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
  console.log("\nALL PASSED (7 assertions)");
}
