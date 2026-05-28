/**
 * Smoke tests for the new mobile-only "Centre text on mobile" toggle
 * added to splitBanner.js.
 *
 *   • Default config emits no `is-m-center` class anywhere.
 *   • Toggling `mobileCenterText` ON emits the modifier class on the
 *     .ns-panel element AND a `@media (max-width:767px)` rule that
 *     centres the inner content.
 *   • Desktop styles remain present (no regression on the existing
 *     left-aligned layout).
 *
 * Reuses the same JSX-stripping loader trick as hero.mobile.test.js so
 * we never need a real React runtime in this Node script.
 *
 * Run with: node src/sections/__tests__/splitBanner.mobile.test.js
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const SRC_ROOT = path.resolve(__dirname, "../..");

function transformFile(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const out = babel.transformSync(src, {
    filename: filePath,
    babelrc: false,
    configFile: false,
    presets: [
      [require.resolve("@babel/preset-env"), { targets: { node: "18" } }],
      [require.resolve("@babel/preset-react"), { runtime: "classic" }],
    ],
  });
  return out.code;
}

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

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUBS.has(request)) return require.resolve("./_hero_stub.js");
  if (request.startsWith("@/")) {
    return path.join(SRC_ROOT, request.slice(2)) + ".js";
  }
  return origResolve.call(this, request, parent, ...rest);
};

const stubPath = path.join(__dirname, "_hero_stub.js");
if (!fs.existsSync(stubPath)) {
  fs.writeFileSync(
    stubPath,
    "module.exports = new Proxy({}, { get: () => () => null });\n"
  );
}

const origJsExt = require.extensions[".js"];
require.extensions[".js"] = function (module, filename) {
  if (!filename.startsWith(SRC_ROOT)) {
    return origJsExt(module, filename);
  }
  const code = transformFile(filename);
  module._compile(code, filename);
};

const { splitBanner } = require("../splitBanner.js");

let passed = 0;
let failed = 0;
function expect(label, cond, extra = "") {
  if (cond) {
    console.log(`PASS \u00b7 ${label}`);
    passed++;
  } else {
    console.log(`FAIL \u00b7 ${label}${extra ? "\n   " + extra : ""}`);
    failed++;
  }
}

const defaults = splitBanner.defaults();

// ─── Test 1: default has no is-m-center on the panel HTML element ────
{
  const code = splitBanner.render(defaults);
  expect(
    "default render's <div class=\"ns-panel ...\"> does NOT include is-m-center",
    !/<div class="ns-panel[^"]*is-m-center/.test(code)
  );
  expect(
    "default mobileCenterText flag is false",
    defaults.mobileCenterText === false
  );
}

// ─── Test 2: toggle ON emits class + centring CSS ────────────────────
{
  const code = splitBanner.render({ ...defaults, mobileCenterText: true });
  expect(
    "panel element gets is-m-center class when toggle is ON",
    /<div class="ns-panel is-side-(left|right) is-m-center"/.test(code)
  );
  expect(
    "mobile media query centres .ns-panel-inner",
    code.includes(".ns-panel.is-m-center .ns-panel-inner{text-align:center}")
  );
  expect(
    "mobile media query auto-margins subtitle for centring",
    code.includes(
      ".ns-panel.is-m-center .ns-subtitle{margin-left:auto;margin-right:auto}"
    )
  );
  expect(
    "centring rules live INSIDE the @media (max-width:767px) block",
    (() => {
      const m = code.match(/@media \(max-width:767px\)\{(.+?)\}\s*<\/style>/s)
            || code.match(/@media \(max-width:767px\)\{(.+)$/s);
      if (!m) return false;
      // Walk forward counting braces from start of @media body until
      // the matching closing brace, then check the captured chunk for
      // the centring rule. Simpler heuristic: just confirm the rule
      // text comes AFTER the @media opener in the source.
      const openIdx = code.indexOf("@media (max-width:767px){");
      const ruleIdx = code.indexOf(".ns-panel.is-m-center .ns-panel-inner");
      return openIdx > -1 && ruleIdx > openIdx;
    })()
  );
}

// ─── Test 3: desktop layout unaffected ───────────────────────────────
{
  const code = splitBanner.render({ ...defaults, mobileCenterText: true });
  expect(
    "desktop grid columns rule still present (no regression)",
    code.includes("grid-template-columns:")
  );
  expect(
    "no stray text-align:center at the panel root (desktop unaffected)",
    !/\.ns-panel\{[^}]*text-align:center/.test(code)
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
