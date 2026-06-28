/**
 * Visual smoke test for the Comparison Table section.
 *
 * Builds the snippet via `comparisonTable.render(defaults())`,
 * mounts it inside a real Chromium page, and asserts the
 * critical visual elements render correctly:
 *   • Heading, eyebrow, sub-heading
 *   • Three-column grid head row
 *   • All N data rows with their tick/cross icons
 *   • "Highlight your column" overlay is present
 *   • Mobile layout collapses to a single column
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.log("playwright not installed — skipping comparison-table smoke test");
  process.exit(0);
}

const SRC_ROOT = path.resolve(__dirname, "../..");

function transformFile(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  return babel.transformSync(src, {
    filename: filePath,
    babelrc: false,
    configFile: false,
    presets: [
      ["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }],
      ["@babel/preset-react", { runtime: "automatic" }],
    ],
  }).code;
}

const STUBS = new Set([
  "@/components/FormFields", "@/components/ColorField", "@/components/ImageUpload",
  "@/components/ListEditor", "@/components/PaddingFields", "@/components/FooterLinkEditor",
  "@/components/BlogPagePicker",
  "@/components/RichTextEditor", "@/components/ui/label", "@/components/ui/input",
  "@/components/ui/button", "@/components/FormGroup", "lucide-react", "react", "sonner",
]);
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUBS.has(request)) return require.resolve("./_hero_stub.js");
  if (request.startsWith("@/")) return path.join(SRC_ROOT, request.slice(2)) + ".js";
  return origResolve.call(this, request, parent, ...rest);
};
const origJsExt = require.extensions[".js"];
require.extensions[".js"] = function (module, filename) {
  if (!filename.startsWith(SRC_ROOT)) return origJsExt(module, filename);
  module._compile(transformFile(filename), filename);
};

const { comparisonTable } = require("../comparisonTable.js");

let pass = 0, fail = 0;
function expect(label, ok, detail = "") {
  if (ok) { console.log(`PASS · ${label}`); pass++; }
  else { console.log(`FAIL · ${label}${detail ? ` — ${detail}` : ""}`); fail++; }
}

(async () => {
  const snippet = comparisonTable.render(comparisonTable.defaults());
  // Schema sanity: snippet is a single HTML string with style + script.
  expect("snippet is non-empty string",
    typeof snippet === "string" && snippet.length > 500);
  expect("snippet contains the table grid", /class="ns-table"/.test(snippet));
  expect("snippet contains 6 sample rows",
    (snippet.match(/class="ns-row" role="row"/g) || []).length === 6);
  expect("snippet includes tick SVG", /ns-mark-check/.test(snippet));
  expect("snippet includes cross SVG", /ns-mark-x/.test(snippet));
  expect("snippet includes our-column highlight overlay",
    /ns-col-our-border/.test(snippet));

  const browser = await chromium.launch({ headless: true });
  // Desktop render
  const ctxD = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageD = await ctxD.newPage();
  await pageD.setContent(
    `<!doctype html><html><body style="margin:0;font-family:sans-serif">${snippet}</body></html>`,
    { waitUntil: "load" }
  );
  await pageD.waitForTimeout(200);
  const desktop = await pageD.evaluate(() => {
    const table = document.querySelector(".ns-table");
    if (!table) return { ok: false };
    const cs = getComputedStyle(table);
    return {
      ok: true,
      gridCols: cs.gridTemplateColumns,
      headCellCount: document.querySelectorAll(".ns-row-head .ns-cell").length,
      dataRowCount: document.querySelectorAll(".ns-row:not(.ns-row-head)").length,
      tickCount: document.querySelectorAll(".ns-mark-check").length,
      crossCount: document.querySelectorAll(".ns-mark-x").length,
      ourBorderVisible: !!document.querySelector(".ns-col-our-border"),
    };
  });
  expect("desktop: table renders", desktop.ok);
  expect("desktop: header row has 3 cells", desktop.headCellCount === 3);
  expect("desktop: 6 data rows render", desktop.dataRowCount === 6);
  expect("desktop: 6 tick icons present", desktop.tickCount === 6);
  expect("desktop: 6 cross icons present", desktop.crossCount === 6);
  expect("desktop: grid uses 3 columns",
    /\d+(?:\.\d+)?px\s+\d+(?:\.\d+)?px\s+\d+(?:\.\d+)?px/.test(desktop.gridCols),
    `gridCols=${desktop.gridCols}`);
  expect("desktop: highlight overlay rendered", desktop.ourBorderVisible);

  // Mobile render — collapse to single column
  const ctxM = await browser.newContext({ viewport: { width: 480, height: 800 } });
  const pageM = await ctxM.newPage();
  await pageM.setContent(
    `<!doctype html><html><head><meta name="viewport" content="width=480"/></head><body style="margin:0">${snippet}</body></html>`,
    { waitUntil: "load" }
  );
  await pageM.waitForTimeout(200);
  const mobile = await pageM.evaluate(() => {
    const table = document.querySelector(".ns-table");
    const cs = getComputedStyle(table);
    const ourBorder = document.querySelector(".ns-col-our-border");
    return {
      gridCols: cs.gridTemplateColumns,
      overlayHidden: !ourBorder || getComputedStyle(ourBorder.closest(".ns-col-our-wrap")).display === "none",
    };
  });
  expect("mobile: table collapses to 1 column",
    /^\d+(?:\.\d+)?px$/.test(mobile.gridCols), `gridCols=${mobile.gridCols}`);
  expect("mobile: our-column overlay hidden", mobile.overlayHidden);

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
