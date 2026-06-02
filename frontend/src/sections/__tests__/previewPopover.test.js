/**
 * Smoke test: SectionPreviewPopover can render an HTML thumbnail for
 * every section in the registry without throwing.
 *
 * The component itself is React-bound and best validated in the live
 * app (which the manual screenshot confirms works). What this test
 * locks in is that every section's `render(defaults())` is callable
 * and produces non-empty HTML — i.e. the popover will have something
 * to display when the user hovers any tile.
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const SRC_ROOT = path.resolve(__dirname, "../..");

function transformFile(filePath) {
  return babel.transformSync(fs.readFileSync(filePath, "utf8"), {
    filename: filePath, babelrc: false, configFile: false,
    presets: [
      ["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }],
      ["@babel/preset-react", { runtime: "automatic" }],
    ],
  }).code;
}
const STUBS = new Set([
  "@/components/FormFields", "@/components/ColorField", "@/components/ImageUpload",
  "@/components/ListEditor", "@/components/PaddingFields", "@/components/FooterLinkEditor",
  "@/components/RichTextEditor", "@/components/ui/label", "@/components/ui/input",
  "@/components/ui/button", "@/components/FormGroup", "lucide-react", "react", "sonner",
]);
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (req, parent, ...rest) {
  if (STUBS.has(req)) return require.resolve("./_hero_stub.js");
  if (req.startsWith("@/")) return path.join(SRC_ROOT, req.slice(2)) + ".js";
  return origResolve.call(this, req, parent, ...rest);
};
const origJsExt = require.extensions[".js"];
require.extensions[".js"] = function (mod, fn) {
  if (!fn.startsWith(SRC_ROOT)) return origJsExt(mod, fn);
  mod._compile(transformFile(fn), fn);
};

const { SECTIONS } = require("../registry.js");

let pass = 0, fail = 0;
function expect(label, ok, detail = "") {
  if (ok) { console.log(`PASS · ${label}`); pass++; }
  else { console.log(`FAIL · ${label}${detail ? ` — ${detail}` : ""}`); fail++; }
}

// Source-shape guard for the popover component.
const popoverSrc = fs.readFileSync(
  path.join(SRC_ROOT, "components/SectionPreviewPopover.jsx"),
  "utf8"
);
expect("popover imports SECTIONS_BY_ID from registry",
  /from "@\/sections\/registry"/.test(popoverSrc));
expect("popover caches rendered HTML",
  /HTML_CACHE/.test(popoverSrc) && /\.has\(cacheKey\)/.test(popoverSrc));
expect("popover cache key includes section id, override, and brand kit signature",
  /\$\{sectionId\}::\$\{override [^}]*\}::\$\{brandKitSig/.test(popoverSrc));
expect("popover overlays brand kit on defaults when no override is set",
  /applyBrandKit\(sectionId/.test(popoverSrc));
expect("popover prefers override config over defaults",
  /override\.config/.test(popoverSrc));
expect("popover lazy-mounts the iframe (gated by mounted state)",
  /setMounted\(true\)/.test(popoverSrc));
expect("popover hover delay is non-trivial (>= 150ms)",
  /HOVER_DELAY_MS\s*=\s*(\d+)/.test(popoverSrc) &&
  parseInt(RegExp.$1, 10) >= 150);
expect("popover edge-flips on right-edge overflow",
  /flipped/.test(popoverSrc));
expect("popover renders srcDoc iframe", /srcDoc=\{html\}/.test(popoverSrc));
expect("popover disables pointer events on iframe", /pointer-events:\s*"?none/i.test(popoverSrc));

// Every registered section must produce a non-empty snippet from its
// defaults — otherwise its hover-preview would be a blank box.
for (const s of SECTIONS) {
  let html = "";
  let err = null;
  try {
    html = s.render(s.defaults());
  } catch (e) {
    err = e.message;
  }
  expect(`${s.id}: render(defaults()) → non-empty HTML`,
    typeof html === "string" && html.length > 200,
    err ? `threw: ${err}` : `len=${(html || "").length}`);
}

// The landing page lists 21 tiles total (2 Pro + 19 editorial, where
// "rich text" has no preview id). Lock in the section count so future
// additions don't silently drop off the marketing page.
const showcaseSrc = fs.readFileSync(
  path.join(SRC_ROOT, "pages/login/SectionsShowcase.jsx"),
  "utf8"
);
const proIds = (showcaseSrc.match(/^\s*id: "[^"]+"/gm) || [])
  .filter((l) => /products|productGrid/.test(l));
expect("landing page lists both Pro sections",
  proIds.length >= 2);
expect("landing page lists Comparison Table",
  /id: "comparison-table"/.test(showcaseSrc) &&
  /name: "Comparison Table"/.test(showcaseSrc));
expect("landing page lists Stat Counter",
  /id: "stat-counter"/.test(showcaseSrc) &&
  /name: "Stat Counter"/.test(showcaseSrc));
expect("landing page lists Video Embed",
  /id: "video-embed"/.test(showcaseSrc) &&
  /name: "Video Embed"/.test(showcaseSrc));
expect("landing copy reflects 23 building blocks",
  /Twenty-three composable/.test(showcaseSrc));

// UserGuide must also surface the Comparison Table SectionCard.
const guideSrc = fs.readFileSync(
  path.join(SRC_ROOT, "pages/UserGuide.jsx"), "utf8");
expect("UserGuide lists Comparison Table",
  /sectionId="comparison-table"/.test(guideSrc));
expect("UserGuide lists Stat Counter",
  /sectionId="stat-counter"/.test(guideSrc));
expect("UserGuide lists Video Embed",
  /sectionId="video-embed"/.test(guideSrc));
expect("UserGuide updated count to twenty-two",
  /Design Workshop ships twenty-two/.test(guideSrc));
expect("UserGuide passes sectionId to every SectionCard except richtext",
  // every <SectionCard ... /> call except the rich-text one should have a sectionId
  (() => {
    const matches = guideSrc.match(/<SectionCard[\s\S]*?\/>/g) || [];
    const richText = matches.filter((m) => /name="Rich text"/.test(m));
    const others = matches.filter((m) => !/name="Rich text"/.test(m));
    if (others.length === 0) return false;
    return others.every((m) => /sectionId="/.test(m)) &&
           richText.every((m) => !/sectionId="/.test(m));
  })());

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
