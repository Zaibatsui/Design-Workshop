/**
 * Smoke tests for the CTA Banner email-capture mode.
 *
 * The author picks "Email capture" in Action style and types in a
 * destination email address. The rendered snippet must:
 *
 *   • In `buttons` mode (default): emit NO email form / no mailto JS.
 *   • In `email-form` mode WITHOUT a destinationEmail: emit a clear
 *     configuration-error hint (no broken capture, no JS).
 *   • In `email-form` mode WITH a valid destinationEmail:
 *       – render an <input type="email"> + submit button
 *       – encode the destination + subject + body into the .ns-capture
 *         data attributes (so the IIFE can read them at click time)
 *       – emit the click handler IIFE that builds a `mailto:` URL with
 *         the visitor's typed address substituted into the body
 *       – substitute {email} placeholders in the body template.
 *   • destinationEmail values that don't pass the basic shape check
 *     (e.g. include header-injection characters) are rejected and
 *     treated as if no destination was provided.
 *
 * Run with: node src/sections/__tests__/ctaBanner.emailCapture.test.js
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

const baseDefaults = ctaBanner.defaults();

// ─── Default (buttons) mode ───────────────────────────────────────────
{
  const code = ctaBanner.render({ ...baseDefaults });
  expect(
    "buttons mode: defaults.mode === 'buttons'",
    baseDefaults.mode === "buttons"
  );
  expect(
    "buttons mode: no ns-capture HTML wrapper emitted",
    !/<div class="ns-capture"/.test(code)
  );
  expect(
    "buttons mode: no mailto: handler emitted",
    !/mailto:/.test(code)
  );
  expect(
    "buttons mode: ns-actions wrapper IS present",
    /ns-actions/.test(code)
  );
}

// ─── Email-form mode WITHOUT a destination email ──────────────────────
{
  const code = ctaBanner.render({
    ...baseDefaults,
    mode: "email-form",
    destinationEmail: "",
  });
  expect(
    "email-form mode, no destination: emits configuration hint",
    /Add a destination email address/.test(code)
  );
  expect(
    "email-form mode, no destination: does NOT emit <input type=\"email\">",
    !/<input class="ns-capture-input" type="email"/.test(code)
  );
  expect(
    "email-form mode, no destination: does NOT emit mailto handler",
    !/mailto:/.test(code)
  );
}

// ─── Email-form mode WITH a valid destination ─────────────────────────
{
  const cfg = {
    ...baseDefaults,
    mode: "email-form",
    destinationEmail: "owner@example.com",
    emailSubject: "New newsletter signup",
    emailBodyTemplate:
      "A visitor wants to subscribe.\n\nEmail: {email}\n\nSent from the homepage banner.",
    emailButtonText: "Sign me up",
    emailPlaceholder: "you@you.com",
    emailSuccessText: "Thanks! Your mail app just opened — hit send to finish.",
    formMicroTrust: "No credit card · Unsubscribe anytime",
  };
  const code = ctaBanner.render(cfg);

  expect(
    "email-form mode: emits <input type=\"email\"> field",
    /<input class="ns-capture-input" type="email"/.test(code)
  );
  expect(
    "email-form mode: emits submit button with author-provided label",
    /class="ns-btn ns-btn-primary ns-capture-btn"[^>]*>Sign me up<\/button>/.test(
      code
    )
  );
  expect(
    "email-form mode: encodes destination email into data-ns-dest",
    /data-ns-dest="owner@example\.com"/.test(code)
  );
  expect(
    "email-form mode: encodes subject into data-ns-subject",
    /data-ns-subject="New newsletter signup"/.test(code)
  );
  expect(
    "email-form mode: encodes body template (incl. {email} placeholder) into data-ns-body",
    /data-ns-body="[^"]*\{email\}[^"]*"/.test(code)
  );
  expect(
    "email-form mode: encodes success message into data-ns-success",
    /data-ns-success="Thanks! Your mail app just opened — hit send to finish\."/.test(
      code
    )
  );
  expect(
    "email-form mode: emits micro-trust line under the form",
    /class="ns-form-trust">No credit card · Unsubscribe anytime</.test(code)
  );
  expect(
    "email-form mode: IIFE constructs mailto: URL",
    /mailto:"\+encodeURIComponent\(dest\)/.test(code)
  );
  expect(
    "email-form mode: IIFE substitutes {email} placeholder",
    /bodyTpl\.replace\(\/\\\{email\\\}\/g,\s*email\)/.test(code)
  );
  expect(
    "email-form mode: IIFE validates input against email regex",
    /EMAIL_RE\.test\(email\)/.test(code)
  );
  expect(
    "email-form mode: no .ns-actions button stack emitted (replaced by form)",
    !/ns-actions">/.test(code)
  );
}

// ─── Email-form mode WITH a header-injection destination ──────────────
// e.g. a destination like "evil@example.com?bcc=attacker@x.com" — the
// `?` is a structural character in mailto URLs, so we must reject it.
{
  const code = ctaBanner.render({
    ...baseDefaults,
    mode: "email-form",
    destinationEmail: "evil@example.com?bcc=attacker@x.com",
  });
  expect(
    "email-form mode, header-injection destination: treated as missing destination",
    /Add a destination email address/.test(code) && !/mailto:/.test(code)
  );
}

// ─── Email-form mode WITH a newline-injection destination ─────────────
{
  const code = ctaBanner.render({
    ...baseDefaults,
    mode: "email-form",
    destinationEmail: "owner@example.com\r\nBcc: attacker@x.com",
  });
  expect(
    "email-form mode, newline-injection destination: treated as missing destination",
    /Add a destination email address/.test(code) && !/mailto:/.test(code)
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
