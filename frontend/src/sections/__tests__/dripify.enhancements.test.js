/**
 * Cross-cutting smoke tests for the Dripify-inspired enhancement batch:
 *
 *   • Logo Strip — `edgeFade` adds a `mask-image` linear-gradient at the
 *     left/right boundaries when ON; emits nothing when OFF.
 *   • Testimonials — `platformLogo` per item emits a <img class="ns-platform">
 *     inside the author footer, with safe escaping for the URL & alt.
 *   • CTA Banner — `mode: "email-form"` swaps the button stack for a real
 *     <form action method="POST"> whose action is locked to http(s) URLs.
 *     `mode: "email-form"` with a blank/unsafe action falls back to the
 *     visible error hint instead of shipping a broken form.
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
{
  const d = ctaBanner.defaults();
  expect("ctaBanner.defaults().mode defaults to 'buttons'", d.mode === "buttons");
  expect("ctaBanner.defaults().formAction defaults to ''", d.formAction === "");

  // Buttons mode (default) — no form should appear.
  const buttons = ctaBanner.render(d);
  expect("buttons mode emits NO <form>",
    !/<form/.test(buttons));
  expect("buttons mode still emits .ns-actions wrapper",
    /class="ns-actions"/.test(buttons));

  // email-form mode WITH a valid action URL — should swap to <form>.
  const valid = ctaBanner.render({
    ...d,
    mode: "email-form",
    formAction: "https://example.us10.list-manage.com/subscribe/post?u=abc&id=xyz",
    emailFieldName: "EMAIL",
    emailPlaceholder: "Your work email",
    submitLabel: "Subscribe",
    formMicroTrust: "No credit card",
  });
  expect("email-form mode emits a real <form action method=POST>",
    /<form class="ns-form" action="https:\/\/example\.us10\.list-manage\.com[^"]+" method="POST"/.test(valid));
  expect("email-form mode emits an <input type=email> with the configured name",
    /<input class="ns-form-input" type="email"[^>]*name="EMAIL"/.test(valid));
  expect("email-form mode honours the placeholder",
    /placeholder="Your work email"/.test(valid));
  expect("email-form mode emits the submit label",
    />Subscribe<\/button>/.test(valid));
  expect("email-form mode emits the micro-trust line",
    /class="ns-form-trust">No credit card<\/p>/.test(valid));
  expect("email-form mode drops the button stack",
    !/class="ns-actions"/.test(valid));

  // Default target should be _blank so host site doesn't navigate away.
  expect("email-form mode defaults target=\"_blank\"",
    /target="_blank"/.test(valid));

  // openInNewTab=false → target="_self".
  const sameTab = ctaBanner.render({
    ...d,
    mode: "email-form",
    formAction: "https://example.com/subscribe",
    submitOpenInNewTab: false,
  });
  expect("submitOpenInNewTab=false emits target=\"_self\"",
    /target="_self"/.test(sameTab));

  // Blank action URL → renders the user-facing error hint, NOT a broken form.
  const blank = ctaBanner.render({ ...d, mode: "email-form", formAction: "" });
  expect("email-form mode with blank action shows error hint",
    /Add a form-action URL/.test(blank));
  expect("email-form mode with blank action emits NO <form>",
    !/<form class="ns-form"/.test(blank));

  // Unsafe action URL → blocked (safeUrl rejects javascript:).
  const unsafeAction = ctaBanner.render({
    ...d,
    mode: "email-form",
    formAction: "javascript:alert(1)",
  });
  expect("email-form mode rejects non-http(s) action URLs",
    !/<form class="ns-form"/.test(unsafeAction));
  expect("email-form mode rejects javascript: schemes",
    !/javascript:alert/.test(unsafeAction));

  // Field-name whitelisting — only [A-Za-z0-9_-] survives so an attacker
  // can't inject attribute-breaking content via that field.
  const fieldInjection = ctaBanner.render({
    ...d,
    mode: "email-form",
    formAction: "https://example.com/subscribe",
    emailFieldName: 'email" onfocus="alert(1)',
  });
  expect("email-form mode strips attribute-breaking chars from the field name",
    !/onfocus=/.test(fieldInjection));

  // Hidden fields wiring (e.g. Mailchimp's list ID + bot field).
  const hidden = ctaBanner.render({
    ...d,
    mode: "email-form",
    formAction: "https://example.com/subscribe",
    formHiddenFields: [
      { name: "u", value: "abc123" },
      { name: "id", value: "xyz789" },
    ],
  });
  expect("hiddenFields emit <input type=hidden name=u value=abc123>",
    /<input type="hidden" name="u" value="abc123"/.test(hidden));
  expect("hiddenFields emit <input type=hidden name=id value=xyz789>",
    /<input type="hidden" name="id" value="xyz789"/.test(hidden));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
