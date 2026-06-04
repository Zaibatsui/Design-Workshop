/**
 * Product Carousel — per-product description (rich-text blurb between
 * name and price). Reuses the FAQ-answer Tiptap pipeline.
 *
 *   1. Default render has NO `.ns-desc` element (field is opt-in).
 *   2. Plain-text description renders inside `.ns-desc` between the
 *      `.ns-name` and the `.ns-price`, with HTML escaping applied.
 *   3. HTML payload (from Tiptap — bold / italic / link / list)
 *      passes through unchanged so formatting actually survives.
 *   4. CSS rules for `.ns-desc` ship in the rendered stylesheet.
 *
 * Run with: node src/sections/__tests__/products.description.test.js
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

const { products } = require("../products.js");

let failed = 0;
function expect(name, cond, extra) {
  if (cond) console.log("PASS ·", name);
  else {
    console.log("FAIL ·", name, extra ? `\n  ${extra}` : "");
    failed += 1;
  }
}

function cfgWith(description) {
  const cfg = products.defaults();
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
  const out = products.render(products.defaults());
  expect(
    "defaults render with no description block",
    !out.includes('class="ns-desc"'),
    "found .ns-desc in default-render output"
  );
}

// ── 2. Plain-text description: escaped + placed between name & price
{
  const out = products.render(
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
  // Plain text gets wrapped in <p> by coerceDescHtml so legacy
  // hand-typed values still flow with the surrounding card layout.
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
  const out = products.render(
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
  const out = products.render(products.defaults());
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
  // The baseReset() helper applies `list-style:none !important` to every
  // ul/ol inside the section to neutralise stray host-page CSS. To get
  // bullets/numbers back inside the rich-text description we re-apply
  // the canonical list-style with !important so authors who use the
  // toolbar's bullet / numbered list buttons actually see markers in
  // the rendered snippet.
  expect(
    "bullet lists in .ns-desc restore list-style:disc !important",
    /\.ns-desc ul\{list-style:disc!important\}/.test(out),
    "missing list-style:disc !important — bullets won't render in the rendered snippet"
  );
  expect(
    "numbered lists in .ns-desc restore list-style:decimal !important",
    /\.ns-desc ol\{list-style:decimal!important\}/.test(out),
    "missing list-style:decimal !important — numbers won't render in the rendered snippet"
  );
}

// ── 5. Name spacing slider feeds .ns-name margin-bottom ────────────
{
  // Default → 12 px below the name (historical look).
  const dflt = products.render(products.defaults());
  expect(
    "default nameSpacing renders as 12px margin-bottom on .ns-name",
    /\.ns-name\{[^}]*margin:0 0 12px/.test(dflt),
    "default .ns-name margin should be 12px"
  );
  // The legacy `min-height:42px` reservation on .ns-name caused
  // ~30px of phantom whitespace when product names fit on a single
  // line. With the description field in play it actively gets in the
  // way of authors who want a tight layout, so it was removed.
  expect(
    ".ns-name no longer reserves 2-line min-height",
    !/\.ns-name\{[^}]*min-height/.test(dflt),
    "min-height on .ns-name is back — it creates phantom whitespace"
  );
  // Custom slider value → flows through verbatim.
  const cfg = products.defaults();
  cfg.nameSpacing = 4;
  const tight = products.render(cfg);
  expect(
    "custom nameSpacing renders as 4px margin-bottom on .ns-name",
    /\.ns-name\{[^}]*margin:0 0 4px/.test(tight),
    "custom .ns-name margin should be 4px"
  );
  // Zero is honoured — important corner case (authors who want
  // name flush against the next element).
  const cfgZero = products.defaults();
  cfgZero.nameSpacing = 0;
  const flush = products.render(cfgZero);
  expect(
    "nameSpacing=0 renders as 0px margin-bottom on .ns-name",
    /\.ns-name\{[^}]*margin:0 0 0px/.test(flush),
    "zero spacing should produce 'margin:0 0 0px'"
  );
}

// ── 6. Per-card eyebrow renders above .ns-name in section eyebrow style
{
  // No eyebrow set → no .ns-card-eyebrow element emitted.
  const dflt = products.render(products.defaults());
  expect(
    "defaults render with no per-card eyebrow",
    !dflt.includes('class="ns-card-eyebrow"'),
    "ns-card-eyebrow leaked into the default render"
  );
  // Set an eyebrow → renders above the name, escaped, in eyebrow style.
  const cfg = cfgWith("");
  cfg.products[0].eyebrow = "AI ENABLED";
  const out = products.render(cfg);
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
  // Eyebrow text is HTML-escaped so user input can't break out of
  // the element.
  const xss = cfgWith("");
  xss.products[0].eyebrow = "<script>x</script>";
  const xssOut = products.render(xss);
  expect(
    "per-card eyebrow escapes HTML entities",
    xssOut.includes("&lt;script&gt;") && !xssOut.includes("<script>x</script>"),
    "raw <script> leaked through the eyebrow path"
  );
}

// ── 7. Section-level cardTextAlign drives .ns-card-body text-align ──
{
  // Default → left.
  const dflt = products.render(products.defaults());
  expect(
    "default cardTextAlign renders .ns-card-body as text-align:left",
    /\.ns-card-body\{[^}]*text-align:left/.test(dflt),
    "default card-body alignment should be left"
  );
  // Centre → text-align:center AND lists keep their bullets visible
  // via `text-align:left; display:inline-block` override (same
  // pattern as richtext.js).
  const cfg = products.defaults();
  cfg.cardTextAlign = "center";
  const out = products.render(cfg);
  expect(
    "cardTextAlign=center renders .ns-card-body as text-align:center",
    /\.ns-card-body\{[^}]*text-align:center/.test(out),
    "card-body should centre when cardTextAlign=center"
  );
  expect(
    "centred cards do NOT force lists left-aligned (bullets now flow with text)",
    !/\.ns-desc ul,[^{]*\{[^}]*display:inline-block/.test(out),
    "lists are still being inline-block-overridden — bullet flow should match the chosen alignment"
  );
  // Right alignment is honoured too.
  const right = products.defaults();
  right.cardTextAlign = "right";
  const rightOut = products.render(right);
  expect(
    "cardTextAlign=right renders .ns-card-body as text-align:right",
    /\.ns-card-body\{[^}]*text-align:right/.test(rightOut),
    "card-body should right-align when cardTextAlign=right"
  );
}

// ── 8. Tiptap inline text-align styles survive the render ─────────
{
  // The TextAlign extension emits `<p style="text-align: center">`
  // when an author hits the Align-Centre button in the toolbar. That
  // payload arrives via the rich-text `description` field, gets
  // trusted as HTML, and must reach the snippet verbatim so the
  // browser actually centres the paragraph at runtime. (baseReset()
  // does NOT !important text-align on <p>, so the inline style
  // wins over the section's cascade — that's the contract we're
  // locking in here.)
  const cfg = cfgWith(
    '<p style="text-align: center">Centred line.</p>' +
      '<p style="text-align: right">Right line.</p>' +
      "<p>Default left.</p>"
  );
  const out = products.render(cfg);
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

console.log(`\n${failed === 0 ? "ALL PASSED" : `${failed} FAILED`}`);
process.exit(failed ? 1 : 0);
