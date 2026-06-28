/**
 * Product Grid — per-card description / eyebrow / spacing / alignment.
 * Mirrors the Product Carousel test suite (products.description.test.js)
 * for the features ported across in 2026-06-05:
 *
 *   1. Default render has NO `.ns-desc` element (description is opt-in).
 *   2. Plain-text descriptions are HTML-escaped, paragraph-wrapped, and
 *      placed BETWEEN .ns-name and .ns-price.
 *   3. HTML payload from Tiptap (bold / italic / link / list) passes
 *      through unchanged.
 *   4. CSS rules for `.ns-desc` ship in the stylesheet (font-size, link
 *      underline, bullet/numbered list-style restoration).
 *   5. `nameSpacing` slider feeds `.ns-name` margin-bottom.
 *   6. Per-card `eyebrow` renders above `.ns-name`, escaped, in the
 *      section's eyebrow style.
 *   7. `cardTextAlign` drives `.ns-card-body` text-align.
 *   8. Tiptap inline `text-align` styles survive the render.
 *   9. `descSpacing` slider feeds .ns-desc p / li / ul / ol margins.
 *
 * Run with: node src/sections/__tests__/productGrid.description.test.js
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const SRC_ROOT = path.resolve(__dirname, "../..");

const STUBS = new Set([
  "@/components/FormFields",
  "@/components/ColorField",
  "@/components/ImageUpload",
  "@/components/ListEditor",
  "@/components/RichTextEditor",
  "@/components/BlogPagePicker",
  "@/components/PaddingFields",
  "@/components/FooterLinkEditor",
  "@/components/FormGroup",
  "@/components/ui/label",
  "@/components/ui/input",
  "@/components/ui/button",
  "lucide-react",
  "sonner",
  "react",
]);

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUBS.has(request)) return require.resolve("./_hero_stub.js");
  if (request.startsWith("@/")) {
    return path.join(SRC_ROOT, request.slice(2)) + ".js";
  }
  return origResolve.call(this, request, parent, ...rest);
};

const origCompile = Module.prototype._compile;
require.extensions[".js"] = function (mod, filename) {
  if (filename.includes(`${path.sep}node_modules${path.sep}`)) {
    return origCompile.call(mod, fs.readFileSync(filename, "utf8"), filename);
  }
  const code = babel.transformSync(fs.readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [
      [require.resolve("@babel/preset-env"), { targets: { node: "18" } }],
      [require.resolve("@babel/preset-react"), { runtime: "classic" }],
    ],
  }).code;
  return origCompile.call(mod, code, filename);
};

const { productGrid } = require("../productGrid.js");

let failed = 0;
function expect(name, cond, extra) {
  if (cond) console.log("PASS \u00b7", name);
  else {
    console.log("FAIL \u00b7", name, extra ? `\n  ${extra}` : "");
    failed += 1;
  }
}

function cfgWith(description) {
  const cfg = productGrid.defaults();
  cfg.products = [
    {
      id: "p1",
      name: "Widget Pro",
      description,
      price: "£49.00",
      priceSuffix: "Excl VAT",
      image: "https://example.com/x.png",
      imageAlt: "",
      link: "#",
      overlay: "",
      overlayAlt: "",
      overlayPosition: "top-left",
      overlaySize: 38,
    },
  ];
  return cfg;
}

// ── 1. Default render has no description block ─────────────────────
{
  const out = productGrid.render(productGrid.defaults());
  expect(
    "defaults render with no description block",
    !out.includes('class="ns-desc"'),
    "found .ns-desc in default-render output"
  );
}

// ── 2. Plain-text description: escaped + placed between name & price
{
  const out = productGrid.render(
    cfgWith("Includes 2-year warranty & free shipping for new customers")
  );
  const namePos = out.indexOf('class="ns-name"');
  const descPos = out.indexOf('class="ns-desc"');
  const pricePos = out.indexOf('class="ns-price"');

  expect(
    "plain-text description renders inside .ns-desc",
    descPos > -1 && out.includes("2-year warranty"),
    `descPos=${descPos}`
  );
  expect(
    ".ns-desc sits BETWEEN .ns-name and .ns-price",
    namePos > -1 && descPos > namePos && pricePos > descPos,
    `name=${namePos} desc=${descPos} price=${pricePos}`
  );
  expect(
    "plain-text description is wrapped in <p>",
    /class="ns-desc"><p>[^<]*2-year warranty/.test(out),
    "plain text wasn't paragraph-wrapped"
  );
  expect(
    "plain-text ampersand is HTML-escaped",
    out.includes("free shipping &amp; ") || out.includes("warranty &amp; "),
    "raw '&' leaked through plain-text path without escaping"
  );
}

// ── 3. HTML payload from Tiptap passes through unchanged ───────────
{
  const out = productGrid.render(
    cfgWith("<p>Now with <strong>military-grade</strong> <em>foam</em>.</p>")
  );
  expect(
    "HTML payload <strong> survives the render",
    out.includes("<strong>military-grade</strong>"),
    "trusted Tiptap markup was double-escaped or stripped"
  );
  expect(
    "HTML payload <em> survives the render",
    out.includes("<em>foam</em>"),
    "trusted Tiptap markup was stripped"
  );
}

// ── 4. CSS rules for .ns-desc ──────────────────────────────────────
{
  const out = productGrid.render(productGrid.defaults());
  expect(
    "stylesheet declares .ns-desc base rule",
    /\.ns-desc\{[^}]*font-size:13px/.test(out),
    "missing .ns-desc base rule"
  );
  expect(
    "stylesheet styles nested links in .ns-desc",
    /\.ns-desc a\{[^}]*text-decoration:underline/.test(out),
    "missing .ns-desc a underline rule"
  );
  expect(
    "bullet lists in .ns-desc restore list-style:disc !important",
    /\.ns-desc ul\{list-style:disc inside!important\}/.test(out),
    "missing list-style:disc inside !important — bullets won't render"
  );
  expect(
    "numbered lists in .ns-desc restore list-style:decimal !important",
    /\.ns-desc ol\{list-style:decimal inside!important\}/.test(out),
    "missing list-style:decimal inside !important — numbers won't render"
  );
}

// ── 5. Name spacing slider feeds .ns-name margin-bottom ────────────
{
  const dflt = productGrid.render(productGrid.defaults());
  expect(
    "default nameSpacing renders as 12px margin-bottom on .ns-name",
    /\.ns-name\{[^}]*margin:0 0 12px/.test(dflt),
    "default .ns-name margin should be 12px"
  );
  // Grid intentionally KEEPS min-height:42px to align card heights
  // across a row — unlike the carousel where it was removed.
  expect(
    ".ns-name retains min-height:42px (grid row alignment)",
    /\.ns-name\{[^}]*min-height:42px/.test(dflt),
    "min-height on grid card .ns-name was dropped — rows will become uneven"
  );
  const cfg = productGrid.defaults();
  cfg.nameSpacing = 4;
  const tight = productGrid.render(cfg);
  expect(
    "custom nameSpacing renders as 4px margin-bottom on .ns-name",
    /\.ns-name\{[^}]*margin:0 0 4px/.test(tight),
    "custom .ns-name margin should be 4px"
  );
  const cfgZero = productGrid.defaults();
  cfgZero.nameSpacing = 0;
  const flush = productGrid.render(cfgZero);
  expect(
    "nameSpacing=0 renders as 0px margin-bottom on .ns-name",
    /\.ns-name\{[^}]*margin:0 0 0px/.test(flush),
    "zero spacing should produce 'margin:0 0 0px'"
  );
}

// ── 6. Per-card eyebrow renders above .ns-name in section eyebrow style
{
  const dflt = productGrid.render(productGrid.defaults());
  expect(
    "defaults render with no per-card eyebrow",
    !dflt.includes('class="ns-card-eyebrow"'),
    "ns-card-eyebrow leaked into the default render"
  );
  const cfg = cfgWith("");
  cfg.products[0].eyebrow = "AI ENABLED";
  const out = productGrid.render(cfg);
  const eyebrowPos = out.indexOf('class="ns-card-eyebrow"');
  const namePos = out.indexOf('class="ns-name"');
  expect(
    ".ns-card-eyebrow renders when eyebrow value is set",
    eyebrowPos > -1 && out.includes("AI ENABLED"),
    `eyebrowPos=${eyebrowPos}`
  );
  expect(
    ".ns-card-eyebrow sits ABOVE .ns-name in the DOM",
    eyebrowPos > -1 && namePos > -1 && eyebrowPos < namePos,
    `eyebrow=${eyebrowPos} name=${namePos}`
  );
  expect(
    ".ns-card-eyebrow uses the section eyebrow colour CSS var",
    /\.ns-card-eyebrow\{[^}]*color:var\(--ns-eyebrow-color\)/.test(out),
    "missing --ns-eyebrow-color reference on .ns-card-eyebrow"
  );
  expect(
    ".ns-card-eyebrow is uppercase + letter-spaced (eyebrow visual)",
    /\.ns-card-eyebrow\{[^}]*text-transform:uppercase/.test(out) &&
      /\.ns-card-eyebrow\{[^}]*letter-spacing:0\.14em/.test(out),
    "missing uppercase / letter-spacing on .ns-card-eyebrow"
  );
  const xss = cfgWith("");
  xss.products[0].eyebrow = "<script>x</script>";
  const xssOut = productGrid.render(xss);
  expect(
    "per-card eyebrow escapes HTML entities",
    xssOut.includes("&lt;script&gt;") && !xssOut.includes("<script>x</script>"),
    "raw <script> leaked through the eyebrow path"
  );
}

// ── 7. Section-level cardTextAlign drives .ns-card-body text-align ──
{
  const dflt = productGrid.render(productGrid.defaults());
  expect(
    "default cardTextAlign renders .ns-card-body as text-align:left",
    /\.ns-card-body\{[^}]*text-align:left/.test(dflt),
    "default card-body alignment should be left"
  );
  const cfg = productGrid.defaults();
  cfg.cardTextAlign = "center";
  const out = productGrid.render(cfg);
  expect(
    "cardTextAlign=center renders .ns-card-body as text-align:center",
    /\.ns-card-body\{[^}]*text-align:center/.test(out),
    "card-body should centre when cardTextAlign=center"
  );
  const right = productGrid.defaults();
  right.cardTextAlign = "right";
  const rightOut = productGrid.render(right);
  expect(
    "cardTextAlign=right renders .ns-card-body as text-align:right",
    /\.ns-card-body\{[^}]*text-align:right/.test(rightOut),
    "card-body should right-align when cardTextAlign=right"
  );
}

// ── 8. Tiptap inline text-align styles survive the render ─────────
{
  const cfg = cfgWith(
    '<p style="text-align: center">Centred line.</p>' +
      '<p style="text-align: right">Right line.</p>' +
      "<p>Default left.</p>"
  );
  const out = productGrid.render(cfg);
  expect(
    "centred <p> inline style survives the render",
    out.includes('style="text-align: center"'),
    "Tiptap-emitted text-align:center got stripped from .ns-desc"
  );
  expect(
    "right-aligned <p> inline style survives the render",
    out.includes('style="text-align: right"'),
    "Tiptap-emitted text-align:right got stripped"
  );
}

// ── 9. descSpacing slider feeds .ns-desc p / li / ul margins ─────
{
  const dflt = productGrid.render(productGrid.defaults());
  expect(
    "default descSpacing renders as 6px margin-bottom on .ns-desc p",
    /\.ns-desc p\{[^}]*margin:0 0 6px/.test(dflt),
    ".ns-desc p margin should default to 6px"
  );
  expect(
    "default descSpacing renders as 6px margin-bottom on .ns-desc li",
    /\.ns-desc li\{[^}]*margin:0 0 6px/.test(dflt),
    ".ns-desc li margin should default to 6px"
  );
  expect(
    "default descSpacing renders as 6px margin-bottom on .ns-desc ul/ol",
    /\.ns-desc ul,[^{]*\.ns-desc ol\{margin:0 0 6px/.test(dflt),
    ".ns-desc ul/ol margin should default to 6px"
  );
  const cfg = productGrid.defaults();
  cfg.descSpacing = 14;
  const loose = productGrid.render(cfg);
  expect(
    "custom descSpacing renders as 14px on .ns-desc p",
    /\.ns-desc p\{[^}]*margin:0 0 14px/.test(loose),
    "custom .ns-desc p margin should be 14px"
  );
  expect(
    "custom descSpacing renders as 14px on .ns-desc li",
    /\.ns-desc li\{[^}]*margin:0 0 14px/.test(loose),
    "custom .ns-desc li margin should be 14px"
  );
  const tight = productGrid.defaults();
  tight.descSpacing = 0;
  const flush = productGrid.render(tight);
  expect(
    "descSpacing=0 renders as 0px on .ns-desc li",
    /\.ns-desc li\{[^}]*margin:0 0 0px/.test(flush),
    "zero descSpacing should produce 'margin:0 0 0px'"
  );
}

// ── 10. Empty title suppresses the .ns-h heading element ───────────
{
  // Whitespace-only or empty title → no <h2 class="ns-h"> emitted so
  // its 28px margin-bottom doesn't leave a phantom gap above the grid
  // when authors deliberately omit a heading.
  const cfg = productGrid.defaults();
  cfg.title = "";
  const empty = productGrid.render(cfg);
  expect(
    "empty title suppresses the .ns-h element entirely",
    !empty.includes('class="ns-h"'),
    '.ns-h leaked into render even though title was ""'
  );
  const cfgWS = productGrid.defaults();
  cfgWS.title = "   ";
  expect(
    "whitespace-only title suppresses the .ns-h element",
    !productGrid.render(cfgWS).includes('class="ns-h"'),
    '.ns-h leaked into render even though title was whitespace-only'
  );
  const cfgFull = productGrid.defaults();
  cfgFull.title = "Featured products";
  expect(
    "populated title still renders the .ns-h element",
    productGrid.render(cfgFull).includes('class="ns-h"'),
    '.ns-h should render when a non-empty title is supplied'
  );
}

console.log(`\n${failed === 0 ? "ALL PASSED" : `${failed} FAILED`}`);
process.exit(failed ? 1 : 0);
