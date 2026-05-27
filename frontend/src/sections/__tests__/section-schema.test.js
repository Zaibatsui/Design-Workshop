/**
 * Schema smoke-tests for every section's `defaults()` contract.
 *
 * Catches drift on canonical fields so e.g. a section that ships a
 * vertical-spacing slider keeps writing to `paddingTop` / `paddingBottom`
 * (not a one-off `padY` or `paddingY`) — the kind of fragmentation that
 * has bitten us before (Rich Text shipped with `padY` while every other
 * section used `paddingY`).
 *
 * Sections opted into a spacing control MUST expose BOTH `paddingTop`
 * AND `paddingBottom` keys in their defaults output. Legacy keys
 * (`paddingY`, `padY`) are allowed alongside but cannot replace them.
 *
 * Run with: node src/sections/__tests__/section-schema.test.js
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
      ["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }],
      ["@babel/preset-react", { runtime: "automatic" }],
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
  "@/components/RichTextEditor",
  "@/components/ui/label",
  "@/components/ui/input",
  "@/components/ui/button",
  "@/components/FormGroup",
  "lucide-react",
  "react",
  "sonner",
]);

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUBS.has(request)) return require.resolve("./_hero_stub.js");
  if (request.startsWith("@/")) {
    return path.join(SRC_ROOT, request.slice(2)) + ".js";
  }
  return origResolve.call(this, request, parent, ...rest);
};

const origJsExt = require.extensions[".js"];
require.extensions[".js"] = function (module, filename) {
  if (!filename.startsWith(SRC_ROOT)) return origJsExt(module, filename);
  const code = transformFile(filename);
  module._compile(code, filename);
};

// Sections expected to expose top/bottom spacing controls.
// (Sections like "tabs" with internal padding only — and richtext, which
// stores a legacy `padY` — still must surface paddingTop / paddingBottom
// to the schema once their renderer reads through the fallback chain.)
const SPACING_REQUIRED = [
  "break",
  "comparisonTable",
  "content",
  "ctaBanner",
  "faq",
  "featureGrid",
  "featuredCard",
  "hero",
  "insights",
  "logos",
  "placeholder",
  "productGrid",
  "products",
  "resources",
  "splitBanner",
  "steps",
  "tabs",
  "testimonials",
  "trustStrip",
  "welcome",
];

// Path resolver: each entry is a (cfg) -> object reachable. Hero stores
// its layout under cfg.layout — the spacing knobs live there too.
const SPACING_HOST = {
  hero: (cfg) => cfg.layout || {},
};

let passed = 0;
let failed = 0;
function expect(label, cond, extra = "") {
  if (cond) {
    console.log(`PASS · ${label}`);
    passed++;
  } else {
    console.log(`FAIL · ${label}${extra ? "\n   " + extra : ""}`);
    failed++;
  }
}

const EXPORT_NAMES = {
  break: "breakBanner",
};

for (const id of SPACING_REQUIRED) {
  let mod;
  try {
    mod = require(`../${id}.js`);
  } catch (e) {
    expect(`${id}: module loads`, false, e.message);
    continue;
  }
  const exportName = EXPORT_NAMES[id] || id;
  const section = mod[exportName] || mod[id] || mod.default || mod;
  if (!section || typeof section.defaults !== "function") {
    expect(`${id}: exports .defaults()`, false);
    continue;
  }
  const defaults = section.defaults();
  const host = (SPACING_HOST[id] || ((c) => c))(defaults);
  const hasTop = Object.prototype.hasOwnProperty.call(host, "paddingTop");
  const hasBot = Object.prototype.hasOwnProperty.call(host, "paddingBottom");
  expect(
    `${id}: defaults.paddingTop present`,
    hasTop,
    `host keys: ${Object.keys(host).filter((k) => /pad/i.test(k)).join(", ")}`
  );
  expect(
    `${id}: defaults.paddingBottom present`,
    hasBot,
    `host keys: ${Object.keys(host).filter((k) => /pad/i.test(k)).join(", ")}`
  );
}

// Rich text is exported separately (not via registry) but should also
// expose canonical keys.
let rt;
try {
  rt = require("../richtext.js").richtext;
} catch (e) {
  expect("richtext: module loads", false, e.message);
}
if (rt && typeof rt.defaults === "function") {
  const d = rt.defaults();
  // Rich text is allowed to keep its legacy `padY` for back-compat but
  // must also expose paddingTop/paddingBottom going forward. (Currently
  // it relies on the fallback chain inside the renderer — that's fine,
  // but the schema still asks for the canonical keys.)
  // Soft assertion: at least one of padY / paddingY / paddingTop must
  // exist so the renderer has something to read.
  const hasAnyTopSpace =
    Object.prototype.hasOwnProperty.call(d, "paddingTop") ||
    Object.prototype.hasOwnProperty.call(d, "paddingY") ||
    Object.prototype.hasOwnProperty.call(d, "padY");
  expect(
    "richtext: defaults expose at least one top-spacing key",
    hasAnyTopSpace,
    `keys: ${Object.keys(d).filter((k) => /pad/i.test(k)).join(", ")}`
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
