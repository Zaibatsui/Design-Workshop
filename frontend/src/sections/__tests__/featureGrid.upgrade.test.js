/**
 * Feature Grid — locks in the upgrade:
 *   1. `f.intro` renders between title and body
 *   2. `f.iconSource === "image"` swaps the SVG icon for the uploaded image
 *      inside the same 36×36 icon-box chrome
 *   3. Body HTML (rich-text) passes through untouched
 *   4. Plain-text bodies (legacy) get wrapped in <p>…</p>
 *   5. Mobile alignment overrides land in the @media (max-width:640px) block
 *
 * Run with: node src/sections/__tests__/featureGrid.upgrade.test.js
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

// Stub every editor-only import so we never need a React runtime.
const STUBS = new Set([
  "@/components/FormFields",
  "@/components/ColorField",
  "@/components/ImageUpload",
  "@/components/ListEditor",
  "@/components/PaddingFields",
  "@/components/RichTextEditor",
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
  fs.writeFileSync(stubPath, "module.exports = new Proxy({}, { get: () => () => null });\n");
}

const origJsExt = require.extensions[".js"];
require.extensions[".js"] = function (module, filename) {
  if (!filename.startsWith(SRC_ROOT)) return origJsExt(module, filename);
  const code = transformFile(filename);
  module._compile(code, filename);
};

const { featureGrid } = require("../featureGrid.js");

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

function renderWith(overrides) {
  const cfg = { ...featureGrid.defaults(), ...overrides };
  const snippet = featureGrid.render(cfg);
  // wrapSnippet returns a single string: `<html>\n<style>${css}</style>\n<script>${js}</script>`.
  // Extract the css for the alignment assertions.
  const m = snippet.match(/<style>([\s\S]*?)<\/style>/);
  return { html: snippet, css: m ? m[1] : "" };
}

// ─── 1. intro renders between title and body ──────────────────────────
{
  const out = renderWith({
    features: [
      {
        id: "a",
        iconSource: "library",
        icon: "zap",
        title: "Hello",
        intro: "A quick lead-in.",
        body: "Body copy.",
      },
    ],
  });
  expect(
    "Feature Grid: intro is rendered",
    out.html.includes('class="ns-intro">A quick lead-in.</p>')
  );
  const titleIdx = out.html.indexOf('class="ns-title"');
  const introIdx = out.html.indexOf('class="ns-intro"');
  const bodyIdx = out.html.indexOf('class="ns-body"');
  expect(
    "Feature Grid: intro sits between title and body",
    titleIdx >= 0 && introIdx > titleIdx && bodyIdx > introIdx
  );
}

// ─── 2. iconSource: "image" swaps the icon for an <img>, suppresses SVG
{
  const out = renderWith({
    features: [
      {
        id: "a",
        iconSource: "image",
        icon: "zap",
        image: "https://example.com/icon.png",
        imageAlt: "Bolt",
        title: "T",
        body: "B",
      },
    ],
  });
  expect(
    "Feature Grid: icon-box gets is-img modifier",
    out.html.includes('class="ns-icon-box is-img"')
  );
  expect(
    "Feature Grid: custom icon image src renders",
    out.html.includes('src="https://example.com/icon.png"')
  );
  expect(
    "Feature Grid: library SVG suppressed when iconSource=image",
    !/<svg[^>]*viewBox=/i.test(out.html)
  );
}

// ─── 3. Rich HTML body passes through untouched ───────────────────────
{
  const richBody =
    '<p>Hello <strong>world</strong></p><p style="text-align:right">Right-aligned</p>';
  const out = renderWith({
    features: [{ id: "a", iconSource: "library", icon: "zap", title: "T", body: richBody }],
  });
  expect("Feature Grid: pre-existing HTML body passes through", out.html.includes(richBody));
}

// ─── 4. Legacy plain-text body gets paragraph-wrapped ─────────────────
{
  const out = renderWith({
    features: [
      { id: "a", iconSource: "library", icon: "zap", title: "T", body: "Plain line one.\n\nPlain line two." },
    ],
  });
  expect(
    "Feature Grid: legacy plain-text body coerced to paragraphs",
    out.html.includes("<p>Plain line one.</p>") && out.html.includes("<p>Plain line two.</p>")
  );
}

// ─── 5. Mobile alignment overrides hit @media block ───────────────────
{
  const out = renderWith({
    textAlign: "left",
    textAlignMobile: "center",
    cardTextAlign: "right",
    cardTextAlignMobile: "left",
  });
  const mediaMatch = out.css.match(/@media \(max-width:640px\)\{([\s\S]*?)\}\s*$/);
  expect("Feature Grid: @media (640px) block present", !!mediaMatch);
  const mobileChunk = mediaMatch ? mediaMatch[1] : "";
  expect(
    "Feature Grid: mobile header align lands in @media",
    /\.ns-inner\{text-align:center/.test(mobileChunk)
  );
  expect(
    "Feature Grid: mobile card align lands in @media",
    /\.ns-card\{text-align:left/.test(mobileChunk)
  );
  // Desktop card alignment unchanged outside @media:
  const desktopOnly = out.css.split("@media")[0];
  expect(
    "Feature Grid: desktop card alignment stays as configured",
    /\.ns-card\{[^}]*text-align:right/.test(desktopOnly)
  );
}

// ─── 6. Empty mobile selections inherit desktop ──────────────────────
{
  const out = renderWith({
    textAlign: "center",
    textAlignMobile: "",
    cardTextAlign: "",
    cardTextAlignMobile: "",
  });
  const mediaMatch = out.css.match(/@media \(max-width:640px\)\{([\s\S]*?)\}\s*$/);
  const mobileChunk = mediaMatch ? mediaMatch[1] : "";
  expect(
    "Feature Grid: empty mobile header align inherits desktop center",
    /\.ns-inner\{text-align:center/.test(mobileChunk)
  );
  expect(
    "Feature Grid: empty mobile card align inherits desktop center",
    /\.ns-card\{text-align:center/.test(mobileChunk)
  );
}

if (failed === 0) {
  console.log(`\nALL PASSED (${passed} assertions)`);
  process.exit(0);
} else {
  console.error(`\n${failed} FAILED · ${passed} passed`);
  process.exit(1);
}
