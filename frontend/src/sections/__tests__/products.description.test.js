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
}

console.log(`\n${failed === 0 ? "ALL PASSED" : `${failed} FAILED`}`);
process.exit(failed ? 1 : 0);
