/**
 * Smoke tests for the Blog Index section — searchable grid of blog
 * post cards built from the Brand Grid DNA. Asserts the snippet
 * shape, the in-header vs below-grid search-input positioning, the
 * card meta line (date + author + category), the search filter
 * behaviour, the no-match empty-state and the Brand Kit cascade.
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "../blogIndex.js"), "utf8");

let pass = 0, fail = 0;
const expect = (label, ok) => {
  if (ok) { console.log("PASS ·", label); pass++; }
  else { console.error("FAIL ·", label); fail++; }
};

// ── Shape ──────────────────────────────────────────────────────────
expect("Section id is 'blog-index'", /const ID = "blog-index"/.test(src));
expect(
  "FormPanel wraps FormGroup children in a FormAccordion",
  /FormAccordion sectionType="blog-index"/.test(src),
);
expect(
  "Defaults seed multiple sample posts so the section lands as a finished blog landing",
  (src.match(/title:\s*"[^"]+"/g) || []).length >= 6,
);

// ── No pill chips (search-only, per user preference) ──────────────
expect(
  "Renderer has NO pill-chip filter UI (search-only, by user request)",
  !/ns-chip/.test(src) && !/data-chip/.test(src),
);

// ── Card shape: image + category + date + author + title + excerpt
expect(
  "Card markup carries class hooks for image, body, category, title, excerpt and meta",
  /ns-card-media/.test(src) &&
    /ns-card-body/.test(src) &&
    /ns-card-cat/.test(src) &&
    /ns-card-title/.test(src) &&
    /ns-card-excerpt/.test(src) &&
    /ns-card-meta/.test(src),
);
expect(
  "Meta line renders both date and author with a dot separator",
  /ns-card-date/.test(src) &&
    /ns-card-author/.test(src) &&
    /ns-card-dot/.test(src),
);

// ── Search positioning (header vs below) ──────────────────────────
expect(
  "Search position whitelist is header/below with default 'header'",
  /searchPosition:\s*"header"/.test(src) &&
    /cfg\.searchPosition === "header"/.test(src),
);
expect(
  "Search input falls back to below-grid when there's no header image",
  /searchInHeader =\s*cfg\.searchEnabled && cfg\.searchPosition === "header" && hasHeaderImg/.test(src),
);

// ── Header background ─────────────────────────────────────────────
expect(
  "Renderer supports both solid and gradient overlays on the photo header",
  /overlayType === "gradient"/.test(src) && /linear-gradient/.test(src),
);

// ── Filter JS: client-side haystack search ────────────────────────
expect(
  "Each card carries a `data-haystack` attribute the client search reads",
  /data-haystack="\$\{escAttr\(haystack\)\}"/.test(src),
);
expect(
  "Search input is debounced (~150ms) before re-applying the filter",
  /setTimeout\(function\(\)\{apply/.test(src) && /,150\)/.test(src),
);
expect(
  "No-match state has an `ns-empty` paragraph + a `noMatchText` override",
  /ns-empty/.test(src) && /noMatchText/.test(src),
);

// ── Click-to-edit ─────────────────────────────────────────────────
expect(
  "Each card carries data-ns-list='post' + data-ns-item=<idx> for click-to-edit",
  /data-ns-list="post" data-ns-item="\$\{idx\}"/.test(src),
);
expect(
  "Photo header carries data-ns-group='header-background' so clicks open the header editor",
  /data-ns-group="header-background"/.test(src),
);

// ── Brand-kit cascade contract ────────────────────────────────────
expect(
  "Renderer uses the brand-kit field names (bgColor, cardBg, titleColor, bodyColor, eyebrowAccentColor, cardRadius, font)",
  /safeColor\(cfg\.bgColor/.test(src) &&
    /safeColor\(cfg\.cardBg/.test(src) &&
    /safeColor\(cfg\.titleColor/.test(src) &&
    /safeColor\(cfg\.bodyColor/.test(src) &&
    /cfg\.eyebrowAccentColor/.test(src) &&
    /num\(cfg\.cardRadius/.test(src),
);

// ── Cross-file: registry pulls it in ──────────────────────────────
const reg = fs.readFileSync(path.join(__dirname, "../registry.js"), "utf8");
expect(
  "Registry imports + registers blogIndex",
  /import \{ blogIndex \} from "\.\/blogIndex"/.test(reg) &&
    /\n\s*blogIndex,\s*\n/.test(reg),
);

// ── Cross-file: section meta entry exists with new/whatsNew copy ──
const meta = fs.readFileSync(path.join(__dirname, "../sectionMeta.js"), "utf8");
expect(
  "sectionMeta has a 'blog-index' entry with whatsNew copy",
  /"blog-index":\s*\{[\s\S]{0,400}whatsNew:/.test(meta),
);

// ── Cross-file: brand-kit mapper exists ───────────────────────────
const bk = fs.readFileSync(path.join(__dirname, "../../lib/brandKit.js"), "utf8");
expect(
  "Brand Kit mapper writes the section's theme fields on creation",
  /"blog-index":\s*\(cfg, b\)\s*=>\s*\(\{[\s\S]{0,600}eyebrowAccentColor: pick\(b, "accent_color"\)/.test(bk),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
