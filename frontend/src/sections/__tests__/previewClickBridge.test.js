/**
 * Editor click-to-edit bridge — regression tests.
 *
 * Verifies the three moving parts that ship the "click an element in
 * the preview → editor opens the matching settings group" feature:
 *
 *   1. `previewDoc()` injects the click-capture <script> + the hover
 *      outline CSS rule, and the bridge posts a message of shape
 *      `{ type: "ns-preview-click", blockId, group }`.
 *
 *   2. `composePage()` wraps each block in
 *      `<div data-ns-block-id="<uuid>" style="display:contents">` so the
 *      bridge can identify which block was clicked.
 *
 *   3. The instrumented sections (Product Carousel, Product Grid, Hero)
 *      actually emit `data-ns-group` on their wrapper elements.
 *
 * Run with: node src/sections/__tests__/previewClickBridge.test.js
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

const { previewDoc } = require("../shared.js");
const { composePage } = require("../pageSnippet.js");
const { products } = require("../products.js");
const { productGrid } = require("../productGrid.js");
const { hero } = require("../hero.js");

let failed = 0;
function expect(name, cond, extra) {
  if (cond) console.log("PASS ·", name);
  else {
    console.log("FAIL ·", name, extra ? `\n  ${extra}` : "");
    failed += 1;
  }
}

// ── 1. previewDoc injects the click bridge ────────────────────────
{
  const doc = previewDoc("<section><h1>hi</h1></section>");
  expect(
    "previewDoc emits the click-bridge <script>",
    doc.includes("parent.postMessage") && doc.includes("ns-preview-click"),
    "click bridge script missing — click-to-edit will not work"
  );
  expect(
    "previewDoc emits the hover-outline CSS for [data-ns-group]",
    /\[data-ns-group\][^{]*\{cursor:pointer/.test(doc),
    "hover outline rule missing"
  );
  expect(
    "click bridge walks up for both data-ns-block-id AND data-ns-group",
    doc.includes("data-ns-block-id") && doc.includes("data-ns-group"),
    "bridge must read both attributes off the click target's ancestors"
  );
}

// ── 2. composePage wraps each block in a marker ───────────────────
{
  const blocks = [
    {
      block_id: "blk-aaa",
      type: "section",
      section_type: "products",
      config: products.defaults(),
    },
    {
      block_id: "blk-bbb",
      type: "section",
      section_type: "productGrid",
      config: productGrid.defaults(),
    },
  ];
  const html = composePage(blocks);
  expect(
    "composePage wraps first block in data-ns-block-id marker",
    html.includes('data-ns-block-id="blk-aaa"'),
    "first block lost its block-id wrapper"
  );
  expect(
    "composePage wraps second block in data-ns-block-id marker",
    html.includes('data-ns-block-id="blk-bbb"'),
    "second block lost its block-id wrapper"
  );
  expect(
    "wrapper uses display:contents so it's layout-transparent",
    html.includes('style="display:contents"'),
    "wrapper must not introduce a block-level box"
  );
  const evil = composePage([
    {
      block_id: 'evil"-->&',
      type: "section",
      section_type: "products",
      config: products.defaults(),
    },
  ]);
  expect(
    "composePage HTML-escapes block IDs into the attribute",
    evil.includes('data-ns-block-id="evil&quot;--&gt;&amp;"') ||
      evil.includes('data-ns-block-id="evil&quot;-->&amp;"'),
    "block ID escape rule must run for safety (& and \" must be encoded)"
  );
}

// ── 3. Instrumented sections emit data-ns-group ───────────────────
{
  const carousel = products.render({ ...products.defaults(), title: "T" });
  expect(
    'Product Carousel emits data-ns-group="defaults" on the root section',
    /<section[^>]*data-ns-group="defaults"/.test(carousel),
    "carousel root must be a click target → opens 'Defaults' group"
  );
  expect(
    'Product Carousel emits data-ns-group="header" around heading + eyebrow',
    /data-ns-group="header"[^>]*>[\s\S]*<h2 class="ns-h"/.test(carousel),
    "clicking the heading must open the 'Header' group"
  );

  const grid = productGrid.render({ ...productGrid.defaults(), title: "T" });
  expect(
    'Product Grid emits data-ns-group="defaults" on the root section',
    /<section[^>]*data-ns-group="defaults"/.test(grid),
    "grid root must be a click target → opens 'Defaults' group"
  );
  expect(
    'Product Grid emits data-ns-group="header" around heading + eyebrow',
    /data-ns-group="header"[^>]*>[\s\S]*<h2 class="ns-h"/.test(grid),
    "clicking the heading must open the 'Header' group"
  );

  const heroHtml = hero.render(hero.defaults());
  expect(
    'Hero emits data-ns-group="section-carousel" on the root section',
    /<section[^>]*data-ns-group="section-carousel"/.test(heroHtml),
    "hero root must be a click target → opens 'Section / Carousel' group"
  );
}

// ── 3b. Wave-2 sections all expose data-ns-group="defaults" on root ──
{
  const wave2Modules = [
    ["breakBanner", "break.js"],
    ["comparisonTable", "comparisonTable.js"],
    ["content", "content.js"],
    ["ctaBanner", "ctaBanner.js"],
    ["faq", "faq.js"],
    ["featureGrid", "featureGrid.js"],
    ["featuredCard", "featuredCard.js"],
    ["insights", "insights.js"],
    ["logos", "logos.js"],
    ["placeholder", "placeholder.js"],
    ["resources", "resources.js"],
    ["splitBanner", "splitBanner.js"],
    ["statCounter", "statCounter.js"],
    ["steps", "steps.js"],
    ["tabs", "tabs.js"],
    ["testimonials", "testimonials.js"],
    ["trustStrip", "trustStrip.js"],
    ["videoEmbed", "videoEmbed.js"],
    ["welcome", "welcome.js"],
  ];
  for (const [exportName, fileName] of wave2Modules) {
    const mod = require(`../${fileName}`);
    const section = mod[exportName];
    if (!section || !section.render || !section.defaults) continue;
    const cfg = section.defaults();
    // featuredCard's root <section> uses data-ns-group="bg" (the image
    // wrapper), not "defaults" — every other instrumented section uses
    // "defaults" on its outermost element.
    const html = section.render(cfg);
    if (exportName === "featuredCard") {
      expect(
        `${exportName} root emits a data-ns-group attribute`,
        /<section[^>]*data-ns-group="(?:defaults|bg)"/.test(html),
        `${exportName} root must carry a click-to-edit marker`
      );
    } else {
      expect(
        `${exportName} root emits data-ns-group="defaults"`,
        /<section[^>]*data-ns-group="defaults"/.test(html),
        `${exportName} root must carry data-ns-group="defaults"`
      );
    }
  }
}

// ── 4. Snippets copied out of the editor must NOT include the bridge ──
{
  const raw = products.render(products.defaults());
  expect(
    "Raw section snippet does NOT include the click-bridge script",
    !raw.includes("ns-preview-click"),
    "click bridge leaked into the snippet"
  );
}

// ── 5. Per-item list markers (Wave 3 — click a specific slide/card) ──
{
  // Each section that has a per-item ListEditor should also stamp
  // `data-ns-list` + `data-ns-item` on the rendered HTML of each item
  // so the click bridge can post an itemIndex back to the editor.
  // The "list" value MUST match the ListEditor's `testidPrefix` so the
  // expand-item handler in `ListEditor.jsx` matches correctly.
  const cases = [
    { name: "Product Carousel cards", file: "products.js", export: "products", list: "product", needle: /<div class="ns-card"[^>]*data-ns-list="product"[^>]*data-ns-item="0"/ },
    { name: "Product Grid cards",     file: "productGrid.js", export: "productGrid", list: "pgrid-product", needle: /<div class="ns-card"[^>]*data-ns-list="pgrid-product"[^>]*data-ns-item="0"/ },
    { name: "Hero slides",            file: "hero.js", export: "hero", list: "hero-slide", needle: /class="ns-slide[^"]*"[^>]*data-ns-list="hero-slide"[^>]*data-ns-item="0"/ },
    { name: "FAQ items",              file: "faq.js", export: "faq", list: "faq", needle: /<details class="ns-item"[^>]*data-ns-list="faq"[^>]*data-ns-item="0"/ },
    { name: "Steps",                  file: "steps.js", export: "steps", list: "steps", needle: /<article class="ns-step"[^>]*data-ns-list="steps"[^>]*data-ns-item="0"/ },
    { name: "Testimonials",           file: "testimonials.js", export: "testimonials", list: "testi", needle: /<article class="ns-item"[^>]*data-ns-list="testi"[^>]*data-ns-item="0"/ },
    { name: "Insights cards",         file: "insights.js", export: "insights", list: "insight", needle: /data-ns-list="insight"[^>]*data-ns-item="0"/ },
    { name: "Resources cards",        file: "resources.js", export: "resources", list: "resource", needle: /data-ns-list="resource"[^>]*data-ns-item="0"/ },
    { name: "Feature Grid items",     file: "featureGrid.js", export: "featureGrid", list: "feature", needle: /data-ns-list="feature"[^>]*data-ns-item="0"/ },
    { name: "Logo Strip items",       file: "logos.js", export: "logos", list: "logo", needle: /data-ns-list="logo"[^>]*data-ns-item="0"/ },
    { name: "Trust Strip items",      file: "trustStrip.js", export: "trustStrip", list: "trust-item", needle: /data-ns-list="trust-item"[^>]*data-ns-item="0"/ },
    { name: "Stat Counter items",     file: "statCounter.js", export: "statCounter", list: "stat-item", needle: /data-ns-list="stat-item"[^>]*data-ns-item="0"/ },
    { name: "Comparison Table rows",  file: "comparisonTable.js", export: "comparisonTable", list: "compare", needle: /data-ns-list="compare"[^>]*data-ns-item="0"/ },
    { name: "Tabs",                   file: "tabs.js", export: "tabs", list: "tab", needle: /data-ns-list="tab"[^>]*data-ns-item="0"/ },
  ];
  for (const c of cases) {
    const mod = require(`../${c.file}`);
    const section = mod[c.export];
    if (!section || !section.render || !section.defaults) {
      expect(`${c.name}: module loads`, false, `couldn't import ${c.file}`);
      continue;
    }
    // Some sections (Logos) have an empty default items list — seed one
    // before rendering so the regex matches.
    let cfg = section.defaults();
    if (c.export === "logos") {
      cfg = { ...cfg, logos: [{ id: "L1", image: "x.png", alt: "Brand" }] };
    } else if (c.export === "products" || c.export === "productGrid") {
      cfg = {
        ...cfg,
        products: [
          { id: "P1", name: "Sample", price: "100", image: "x.jpg", link: "#" },
        ],
      };
    }
    const html = section.render(cfg);
    expect(
      `${c.name}: rendered HTML carries data-ns-list="${c.list}" + data-ns-item="0"`,
      c.needle.test(html),
      `${c.name}: missing per-item click marker — clicking the rendered item won't open its editor`
    );
  }
}

console.log(`\n${failed === 0 ? "ALL PASSED" : `${failed} FAILED`}`);
process.exit(failed ? 1 : 0);
