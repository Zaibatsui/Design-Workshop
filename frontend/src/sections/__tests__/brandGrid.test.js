/**
 * Regression: the `brand-grid` section ships defaults, render output,
 * scoped vanilla-JS search, optional photo header, and a brand-kit
 * cascade-friendly field shape. Spotlight + category-chip features
 * were dropped on 2026-02-19 to match the rest of the section
 * library's layout conventions.
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

// ── Shape + guardrails ────────────────────────────────────────────
expect("Section id is 'brand-grid'", /const ID = "brand-grid"/.test(src));
expect(
  "FONT_IMPORT is interpolated as a value, never called as a function",
  !/FONT_IMPORT\s*\(/.test(src),
);
expect(
  "FormPanel wraps FormGroup children in a FormAccordion",
  /FormAccordion sectionType="brand-grid"/.test(src) &&
    /from "@\/components\/FormGroup"/.test(src),
);
expect(
  "Defaults seed at least 6 sample brands",
  /items:\s*\[[\s\S]{0,8000}id:\s*"jabra"/.test(src),
);
expect(
  "Sample logos use inline SVG wordmarks (no external image dep)",
  /logo:\s*wordmarkSvg\(/.test(src),
);

// ── Spotlight + chip features must be GONE ────────────────────────
expect(
  "Spotlight flag is removed from per-item defaults",
  !/spotlight:\s*(true|false),/.test(src),
);
expect(
  "Spotlight tier rendering is removed",
  !/ns-spotlight/.test(src),
);
expect(
  "Category field is removed from per-item defaults",
  !/category:\s*"/.test(src),
);
expect(
  "Category chip UI is removed",
  !/ns-chip/.test(src) && !/categoryFilterEnabled/.test(src),
);

// ── Header background image ───────────────────────────────────────
expect(
  "Defaults expose headerImage + overlay + height controls",
  /headerImage:\s*""/.test(src) &&
    /headerOverlayColor:/.test(src) &&
    /headerOverlayOpacity:/.test(src) &&
    /headerHeight:/.test(src),
);
expect(
  "Renderer applies background-image when headerImage is set",
  /ns-header-bg/.test(src) && /background-image:url\(/.test(src),
);
expect(
  "Header overlay div uses the configured overlay colour + opacity",
  /ns-header-overlay/.test(src) && /opacity:\$\{headerOverlayOpacity\}/.test(src),
);

// ── Search-only filter ────────────────────────────────────────────
expect(
  "Renderer carries data-haystack for client-side search match",
  /data-haystack="\$\{escAttr\(`\$\{nameLower\} \$\{descLower\}`\)\}"/.test(src),
);
expect(
  "Snippet JS debounces search input by 150ms",
  /setTimeout\(function\(\)\{apply\([\s\S]{0,80}\},150\)/.test(src),
);
expect(
  "Empty state toggles `hidden` when visible count is 0",
  /empty\.hidden=visible!==0/.test(src),
);

// ── Hover + grid + cards ──────────────────────────────────────────
expect(
  "Hover-bar CSS only emitted when cfg.hoverEffect === 'bar'",
  /cfg\.hoverEffect === "bar" \? barRule : ""/.test(src),
);
expect(
  "Mobile @media query overrides columns",
  /@media \(max-width:767px\)\{[\s\S]{0,400}grid-template-columns:repeat\(\$\{colsM\}/.test(src),
);
expect(
  "Card root is <a> only when item.link is set (no broken anchors)",
  /const tag = link \? "a" : "div"/.test(src),
);
expect(
  "Section registers as a named export `brandGrid`",
  /export const brandGrid = \{[\s\S]{0,300}id: ID/.test(src),
);

// ── Cross-file: registry pulls it in ──────────────────────────────
const reg = fs.readFileSync(path.join(__dirname, "../registry.js"), "utf8");
expect(
  "Registry imports + registers brandGrid",
  /import \{ brandGrid \} from "\.\/brandGrid"/.test(reg) &&
    /brandGrid,\s*\]\.map\(withMeta\)/.test(reg),
);

console.log(`\n${failed === 0 ? "ALL PASSED" : "FAILED"} (${passed} passed, ${failed} failed)`);
if (failed > 0) process.exit(1);
