/**
 * Smoke test: every section registered in `registry.js` must
 *   1. expose `defaults()` returning a plain object,
 *   2. expose `render(defaults)` that returns a non-empty string
 *      WITHOUT throwing,
 *   3. produce output starting with `<section ` (the contract every
 *      snippet has to satisfy so the editor preview pane can mount it).
 *
 * Catches the entire class of bugs where a section renderer references
 * a symbol incorrectly at runtime — e.g. `FONT_IMPORT(cfg.font)` when
 * the export is a string constant, or a typo'd helper, or a
 * mis-destructured shared util. Pure source-grep tests can't see those
 * because the symbol is "present" but invoked the wrong way.
 *
 * Strategy
 * ──────────────────────────────────────────────────────────────────
 * `registry.js` pulls in every section file, which in turn pulls in
 * JSX + `@/...` aliased modules + lucide-react. We:
 *   • Hook `Module._resolveFilename` so `@/...` resolves to the right
 *     file under `src/`, trying `.js`, `.jsx`, then `/index.js`.
 *   • Replace lucide-react and the UI form-field leaves with a Proxy
 *     stub returning `() => null` for any property access. They have
 *     zero bearing on `render()` (which is plain JS string assembly)
 *     and importing the real ones would drag in `react`, css-in-js,
 *     etc. for no signal.
 *   • Compile every `.js`/`.jsx` file under `src/` through @babel with
 *     env + react presets the first time it's `require()`d.
 *
 * Side benefit: this also exercises every section file's top-level
 * imports, so a stray broken import (typo'd path, missing export)
 * fails here before it ships.
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const SRC_ROOT = path.resolve(__dirname, "../..");
const STUB_PATH = path.join(__dirname, "_hero_stub.js");

// ── Module resolution: tries .js → .jsx → /index.js for @/ aliases.
const STUBS = new Set([
  "@/components/FormFields",
  "@/components/ColorField",
  "@/components/ImageUpload",
  "@/components/ListEditor",
  "@/components/PaddingFields",
  "@/components/FooterLinkEditor",
  "@/components/CollectionPicker",
  "@/components/ui/label",
  "@/components/ui/input",
  "@/components/ui/button",
  "@/components/ui/textarea",
  "@/components/ui/switch",
  "@/components/ui/slider",
  "@/components/ui/select",
  "@/components/ui/accordion",
  "@/components/FormGroup",
  "lucide-react",
]);

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUBS.has(request)) return STUB_PATH;
  if (request.startsWith("@/")) {
    const rel = request.slice(2);
    const candidates = [
      path.join(SRC_ROOT, rel + ".js"),
      path.join(SRC_ROOT, rel + ".jsx"),
      path.join(SRC_ROOT, rel, "index.js"),
      path.join(SRC_ROOT, rel, "index.jsx"),
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
  }
  return origResolve.call(this, request, parent, ...rest);
};

if (!fs.existsSync(STUB_PATH)) {
  fs.writeFileSync(
    STUB_PATH,
    "module.exports = new Proxy({}, { get: () => () => null });\n",
  );
}

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

const origJs = require.extensions[".js"];
require.extensions[".js"] = function (module, filename) {
  if (!filename.startsWith(SRC_ROOT)) return origJs(module, filename);
  module._compile(transformFile(filename), filename);
};
require.extensions[".jsx"] = function (module, filename) {
  module._compile(transformFile(filename), filename);
};

// Pull the live registry — same module the app loads at runtime.
const { SECTIONS } = require("../registry.js");

let pass = 0;
let fail = 0;
function expect(label, ok, detail = "") {
  if (ok) {
    console.log(`PASS · ${label}`);
    pass++;
  } else {
    console.error(`FAIL · ${label}${detail ? `\n   ${detail}` : ""}`);
    fail++;
  }
}

expect(
  "registry exports a non-empty SECTIONS array",
  Array.isArray(SECTIONS) && SECTIONS.length > 0,
);

for (const section of SECTIONS) {
  const id = section && section.id;
  const label = id || "(unknown)";

  expect(`[${label}] has an id`, typeof id === "string" && id.length > 0);
  expect(
    `[${label}] exposes defaults() and render()`,
    typeof section.defaults === "function" &&
      typeof section.render === "function",
  );

  let defs = null;
  try {
    defs = section.defaults();
    expect(
      `[${label}] defaults() returns a plain object`,
      defs && typeof defs === "object" && !Array.isArray(defs),
    );
  } catch (e) {
    expect(`[${label}] defaults() does not throw`, false, e.message);
  }

  if (!defs) continue;

  let out = null;
  try {
    out = section.render(defs);
  } catch (e) {
    expect(
      `[${label}] render(defaults) does not throw`,
      false,
      `${e.message}\n   ${(e.stack || "").split("\n")[1] || ""}`.trim(),
    );
    continue;
  }
  expect(
    `[${label}] render(defaults) returns a non-empty string`,
    typeof out === "string" && out.length > 0,
  );
  expect(
    `[${label}] output starts with <section`,
    typeof out === "string" && /^<section\b/.test(out.trim()),
  );
}

// ── Static guard: any section that uses <FormGroup> must wrap its
//    children in <FormAccordion>. Skipping the wrapper triggers a
//    Radix runtime error "AccordionItem must be used within Accordion"
//    which only surfaces when the user actually opens the section's
//    edit panel.
const SECTIONS_DIR = path.join(SRC_ROOT, "sections");
const sectionFiles = fs
  .readdirSync(SECTIONS_DIR)
  .filter((f) => f.endsWith(".js") && !f.startsWith("_"));

for (const f of sectionFiles) {
  const src = fs.readFileSync(path.join(SECTIONS_DIR, f), "utf8");
  const usesFormGroup = /<FormGroup\b/.test(src);
  if (!usesFormGroup) continue;
  expect(
    `[${f}] FormGroup users must wrap children in FormAccordion`,
    /\bFormAccordion\b/.test(src) && /<FormAccordion\b/.test(src),
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
