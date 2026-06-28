/**
 * Smoke tests for the shared "Centre text on mobile" pattern rolled out
 * to text-heavy sections (Welcome / Content / CTA Banner), mirroring the
 * Split Banner implementation already covered in splitBanner.mobile.test.js.
 *
 * For each section:
 *   • Default config emits NO `is-m-center` modifier on the root element.
 *   • Toggling `mobileCenterText` ON adds `is-m-center` to the root
 *     section element.
 *   • The centring rules live INSIDE the section's existing mobile
 *     @media block (not at the desktop scope).
 *
 * Uses the same Babel-on-require loader trick as splitBanner.mobile.test.js
 * so we never need a real React runtime.
 *
 * Run with: node src/sections/__tests__/mobileCenterText.test.js
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const SRC_ROOT = path.resolve(__dirname, "../..");

function transformFile(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  return babel.transformSync(src, {
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
  if (!filename.startsWith(SRC_ROOT)) return origJsExt(module, filename);
  module._compile(transformFile(filename), filename);
};

const { welcome } = require("../welcome.js");
const { content } = require("../content.js");
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

const CASES = [
  {
    name: "welcome",
    section: welcome,
    rootSelector: "ns-welcome",
    mediaQuery: "@media (max-width:780px)",
    centringRule: ".is-m-center .ns-block{text-align:center!important}",
  },
  {
    name: "content",
    section: content,
    rootSelector: "ns-content",
    mediaQuery: "@media (max-width:640px)",
    centringRule: ".is-m-center .ns-inner{text-align:center!important}",
  },
  {
    name: "cta-banner",
    section: ctaBanner,
    rootSelector: "ns-cta",
    mediaQuery: "@media (max-width:640px)",
    centringRule: ".is-m-center .ns-inner{text-align:center!important}",
  },
];

for (const c of CASES) {
  const defaults = c.section.defaults();

  expect(
    `${c.name}: defaults.mobileCenterText === false`,
    defaults.mobileCenterText === false
  );

  // Default render — root <section> must NOT carry is-m-center.
  {
    const code = c.section.render(defaults);
    const rootRe = new RegExp(
      `<section class="${c.rootSelector} [^"]*is-m-center`
    );
    expect(
      `${c.name}: default render does NOT add is-m-center to root <section>`,
      !rootRe.test(code)
    );
  }

  // Toggle ON — root <section> must carry is-m-center.
  {
    const code = c.section.render({ ...defaults, mobileCenterText: true });
    const rootRe = new RegExp(
      `<section class="${c.rootSelector} [^"]*is-m-center`
    );
    expect(
      `${c.name}: toggle ON adds is-m-center to root <section>`,
      rootRe.test(code)
    );
    expect(
      `${c.name}: centring rule "${c.centringRule}" is emitted`,
      code.includes(c.centringRule)
    );
    // Confirm centring rule lives AFTER the mobile media query opener.
    const mq = code.indexOf(c.mediaQuery);
    const rule = code.indexOf(c.centringRule);
    expect(
      `${c.name}: centring rule is positioned after ${c.mediaQuery}`,
      mq > -1 && rule > mq
    );
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
