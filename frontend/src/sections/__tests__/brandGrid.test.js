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
  "Defaults seed 9 sample brands (last is logitech)",
  /items:\s*\[[\s\S]{0,8000}id:\s*"logitech"/.test(src) &&
    /id:\s*"samsung"/.test(src),
);
expect(
  "Sample logos use simpleicons.org CDN (brand-coloured SVG glyphs)",
  /logo:\s*SI\("/.test(src) &&
    /cdn\.simpleicons\.org/.test(src),
);
expect(
  "Greyscale-until-hover toggle is wired into defaults + render + form",
  /greyscale:\s*false/.test(src) &&
    /cfg\.greyscale\s*\?[\s\S]{0,200}filter:grayscale\(100%\)/.test(src) &&
    /label="Greyscale until hover"/.test(src),
);
expect(
  "Accent-bar edge is author-controlled (top/right/bottom/left whitelisted)",
  /barSide:\s*"bottom"/.test(src) &&
    /\["top",\s*"right",\s*"bottom",\s*"left"\]\.includes\(cfg\.barSide\)/.test(src) &&
    /label="Bar edge"/.test(src),
);
expect(
  "Accent-bar thickness + colour are exposed in the form",
  /label="Bar thickness"/.test(src) && /label="Bar colour"/.test(src),
);

// ── New: card eyebrow + card alignment + header radius + overlay gradient
expect(
  "Per-card eyebrow field exists (defaults + form + renderer)",
  /eyebrow:\s*""/.test(src) &&
    /label="Eyebrow \(optional\)"/.test(src) &&
    /it\.eyebrow\s*\?\s*`<p class="ns-card-eyebrow">/.test(src),
);
expect(
  "Card content alignment is author-controlled (left/center/right)",
  /cardAlign:\s*"center"/.test(src) &&
    /\["left",\s*"center",\s*"right"\]\.includes\(cfg\.cardAlign\)/.test(src) &&
    /label="Card content alignment"/.test(src),
);
expect(
  "Header corner radius defaults to cardRadius and is hidden when fullBleed",
  /headerRadius:\s*null/.test(src) &&
    /cfg\.fullBleed\s*\?\s*0\s*:\s*\(cfg\.headerRadius/.test(src) &&
    /!cfg\.fullBleed\s*&&\s*\(/.test(src) &&
    /label="Header corner radius"/.test(src),
);
expect(
  "Overlay style supports solid AND linear gradient",
  /overlayType:\s*"solid"/.test(src) &&
    /label="Overlay style"/.test(src) &&
    /cfg\.overlayType\s*===\s*"gradient"\s*\?[\s\S]{0,400}linear-gradient/.test(src) &&
    /overlayGradientFrom/.test(src) &&
    /overlayGradientTo/.test(src) &&
    /overlayGradientAngle/.test(src),
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
expect(
  "Photo header is rendered OUTSIDE `.ns-inner` so it spans edge-to-edge",
  /\$\{photoHeader\}\s*<div class="ns-inner">/.test(src),
);
expect(
  "Section root drops horizontal padding (lives on .ns-inner instead)",
  /\.\$\{cls\}\{background:[\s\S]{0,200}padding:\$\{padTop\}px 0 \$\{padBot\}px/.test(src) &&
    /\.ns-inner\{[^}]{0,200}padding:0 \$\{padX\}px/.test(src),
);
expect(
  "Section honours the shared `fullBleed` flag",
  /fullBleed:\s*false/.test(src) && /fullBleedClass\(cfg\)/.test(src),
);

// ── Search controls ───────────────────────────────────────────────
expect(
  "Search position field exists with 'header' and 'below' options",
  /searchPosition:\s*"below"/.test(src) &&
    /value:\s*"header"[\s\S]{0,80}Inside the header/.test(src),
);
expect(
  "Search alignment maps to flex justify-content",
  /SEARCH_ALIGN_TO_FLEX\s*=\s*\{[\s\S]{0,150}left:\s*"flex-start"[\s\S]{0,80}right:\s*"flex-end"/.test(src),
);
expect(
  "Search width is configurable via slider",
  /searchWidth:\s*\d+/.test(src) && /label="Width"/.test(src),
);
expect(
  "Search renders inside header content when position === 'header' AND an image is set",
  /searchInHeader\s*=\s*cfg\.searchEnabled\s*&&\s*cfg\.searchPosition\s*===\s*"header"\s*&&\s*hasHeaderImg/.test(src),
);

// ── Search-only filter ────────────────────────────────────────────
expect(
  "Renderer carries data-haystack for client-side search match (incl. eyebrow)",
  /data-haystack="\$\{escAttr\(`\$\{nameLower\} \$\{descLower\} \$\{ebLower\}`\)\}"/.test(src),
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
