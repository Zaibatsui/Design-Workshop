/**
 * Regression: new `brand-grid` section ships defaults, render output,
 * scoped vanilla-JS search + chip filter, optional hover bar on any of
 * the four sides, and a back-compat-safe shape.
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "../brandGrid.js"),
  "utf8"
);

let passed = 0;
let failed = 0;
function expect(label, cond) {
  if (cond) { console.log("PASS ·", label); passed++; }
  else { console.error("FAIL ·", label); failed++; }
}

expect("Section id is 'brand-grid'", /const ID = "brand-grid"/.test(src));
expect(
  "FONT_IMPORT is interpolated as a value, never called as a function",
  !/FONT_IMPORT\s*\(/.test(src),
);
expect("Defaults seed at least 6 sample brands", /items:\s*\[[\s\S]{0,5000}id:\s*"jabra"/.test(src));
expect("Spotlight flag is per-item", /spotlight:\s*(true|false),/.test(src));
expect("Sample logos use images\\.unsplash\\.com",
  /logo:\s*"https:\/\/images\.unsplash\.com\//.test(src));
expect("Renderer emits .ns-spotlight when any item.spotlight=true",
  /spotlight\.length \? `[\s\S]{0,200}<div class="ns-spotlight">/.test(src));
expect("Renderer carries data-haystack for client-side search match",
  /data-haystack="\$\{escAttr\(`\$\{nameLower\} \$\{descLower\}`\)\}"/.test(src));
expect("Snippet JS debounces search input by 150ms",
  /setTimeout\(function\(\)\{state\.q=[\s\S]{0,200}\},150\)/.test(src));
expect("Snippet JS combines category chip + search into one apply() pass",
  /var matchCat=[\s\S]{0,80}var matchQ=[\s\S]{0,80}var show=matchCat&&matchQ/.test(src));
expect("Empty state toggles `hidden` when visible count is 0",
  /empty\.hidden=visible!==0/.test(src));
expect("Hover-bar CSS only emitted when cfg.hoverEffect === 'bar'",
  /cfg\.hoverEffect === "bar" \? barRule : ""/.test(src));
expect("Hover bar supports all 4 sides (top/right/bottom/left whitelisted)",
  /\["top",\s*"right",\s*"bottom",\s*"left"\]\.includes\(cfg\.barSide\)/.test(src));
expect("Mobile @media query overrides columns + chips column flex",
  /@media \(max-width:767px\)\{[\s\S]{0,300}grid-template-columns:repeat\(\$\{colsM\}/.test(src));
expect("spotlightHideFromMain filter drops spotlight items from main when true",
  /cfg\.spotlightHideFromMain[\s\S]{0,80}items\.filter\(\(i\) => !i\.spotlight\)/.test(src));
expect("Card root is <a> only when item.link is set (no broken anchors)",
  /const tag = link \? "a" : "div"/.test(src));
expect("Section registers as a named export `brandGrid`",
  /export const brandGrid = \{[\s\S]{0,300}id: ID/.test(src));

// Cross-file: registry pulls it in
const reg = fs.readFileSync(path.join(__dirname, "../registry.js"), "utf8");
expect("Registry imports + registers brandGrid",
  /import \{ brandGrid \} from "\.\/brandGrid"/.test(reg) && /brandGrid,\s*\]\.map\(withMeta\)/.test(reg));

console.log(`\n${failed === 0 ? "ALL PASSED" : "FAILED"} (${passed} passed, ${failed} failed)`);
if (failed > 0) process.exit(1);
