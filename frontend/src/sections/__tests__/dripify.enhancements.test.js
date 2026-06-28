/**
 * Cross-cutting smoke tests for the Dripify-inspired enhancement batch:
 *
 *   • Logo Strip — `edgeFade` adds a `mask-image` linear-gradient at the
 *     left/right boundaries when ON; emits nothing when OFF.
 *   • Testimonials — `platformLogo` per item emits a <img class="ns-platform">
 *     inside the author footer, with safe escaping for the URL & alt.
 *   • CTA Banner — email-capture mode coverage has been moved into its
 *     own dedicated test file (`ctaBanner.emailCapture.test.js`) after
 *     the simplification from a provider-POST form to a self-contained
 *     `mailto:` handoff.
 *
 * Run with: node src/sections/__tests__/dripify.enhancements.test.js
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const SRC_ROOT = path.resolve(__dirname, "../..");

function transformFile(filePath) {
  return babel.transformSync(fs.readFileSync(filePath, "utf8"), {
    filename: filePath,
    babelrc: false,
    configFile: false,
    presets: [
      [require.resolve("@babel/preset-env"), { targets: { node: "18" } }],
      [require.resolve("@babel/preset-react"), { runtime: "classic" }],
    ],
  }).code;
}

const STUBS = new Set([
  "@/components/FormFields",
  "@/components/ColorField",
  "@/components/ImageUpload",
  "@/components/ListEditor",
  "@/components/PaddingFields",
  "@/components/FooterLinkEditor",
  "@/components/BlogPagePicker",
  "@/components/ui/label",
  "@/components/FormGroup",
  "lucide-react",
]);
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUBS.has(request)) return require.resolve("./_hero_stub.js");
  if (request.startsWith("@/")) return path.join(SRC_ROOT, request.slice(2)) + ".js";
  return origResolve.call(this, request, parent, ...rest);
};
const stubPath = path.join(__dirname, "_hero_stub.js");
if (!fs.existsSync(stubPath)) {
  fs.writeFileSync(stubPath, "module.exports = new Proxy({}, { get: () => () => null });\n");
}
const origJsExt = require.extensions[".js"];
require.extensions[".js"] = function (module, filename) {
  if (!filename.startsWith(SRC_ROOT)) return origJsExt(module, filename);
  module._compile(transformFile(filename), filename);
};

const { logos } = require("../logos.js");
const { testimonials } = require("../testimonials.js");
const { ctaBanner } = require("../ctaBanner.js");

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

// ─── Logo Strip: edge-fade gradients ─────────────────────────────────
{
  const d = logos.defaults();
  expect("logos.defaults().edgeFade defaults to true", d.edgeFade === true);
  expect("logos.defaults().edgeFadeWidth defaults to 80", d.edgeFadeWidth === 80);

  const on = logos.render({ ...d, logos: [{ id: "x", image: "https://example.com/a.png", alt: "a" }] });
  expect("edgeFade ON emits mask-image linear-gradient (standard)",
    /mask-image:linear-gradient\(90deg,transparent 0,#000 var\(--ns-fade\)/.test(on));
  expect("edgeFade ON emits -webkit-mask-image too (Safari)",
    /-webkit-mask-image:linear-gradient/.test(on));
  expect("edgeFade ON exposes --ns-fade CSS variable",
    /--ns-fade:80px/.test(on));

  const off = logos.render({ ...d, edgeFade: false, logos: [{ id: "x", image: "https://example.com/a.png", alt: "a" }] });
  expect("edgeFade OFF emits NO mask-image rule",
    !/mask-image:linear-gradient/.test(off));
}

// ─── Testimonials: platform-logo badge ───────────────────────────────
{
  const d = testimonials.defaults();
  // Default items don't carry platform logos — confirm baseline.
  const baseline = testimonials.render(d);
  expect("testimonials baseline does NOT emit .ns-platform when items omit platformLogo",
    !/class="ns-platform"/.test(baseline));

  const withPlatform = testimonials.render({
    ...d,
    items: [
      {
        id: "t1",
        quote: "A quote",
        name: "Alex",
        role: "CEO",
        rating: 5,
        platformLogo: "https://example.com/g2.svg",
        platformAlt: "Reviewed on G2",
      },
    ],
  });
  expect("testimonials with platformLogo emits <img class=\"ns-platform\">",
    /<img class="ns-platform" src="https:\/\/example\.com\/g2\.svg" alt="Reviewed on G2"/.test(withPlatform));
  expect("testimonials with platformLogo emits .ns-platform CSS rule",
    /\.ns-platform\{[^}]*height:22px/.test(withPlatform));

  // Unsafe URL should be sanitised — safeUrl strips javascript: schemes.
  const unsafe = testimonials.render({
    ...d,
    items: [
      { id: "t1", quote: "Q", name: "A", role: "B", rating: 5, platformLogo: "javascript:alert(1)" },
    ],
  });
  expect("testimonials platformLogo blocks javascript: URLs (safeUrl)",
    !/javascript:alert/.test(unsafe));
}

// ─── CTA Banner: email-form mode ─────────────────────────────────────
// The CTA Banner's email-capture mode lives in its own dedicated test
// file at `ctaBanner.emailCapture.test.js`. The capture flow was
// simplified from a third-party-provider POST form to a self-contained
// `mailto:` handoff (visitor's address gets emailed straight to the
// store owner's inbox) — see that file for the full assertions.

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
