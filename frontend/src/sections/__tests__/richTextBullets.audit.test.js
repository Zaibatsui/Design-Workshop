/**
 * Audit sweep — every section that hosts a Tiptap `<RichTextEditor>`
 * (or otherwise emits author-driven HTML containing `<ul>` / `<ol>`)
 * MUST re-enable list bullets / numbers in its emitted CSS. The
 * `baseReset` helper that every section's CSS starts with includes
 * `.${cls} ul, .${cls} ol { list-style: none !important }` as a
 * defence against host-site bullet inheritance — without an explicit
 * counter-rule downstream, Tiptap's bulleted lists render as plain
 * text in the snippet.
 *
 * Two acceptable counter-patterns:
 *   1. The shared `richBodyResetCss(...)` helper (canonical, recommended
 *      — also fixes the Tiptap `<li><p>` block-inline gotcha)
 *   2. Inline `list-style: disc inside !important` + `list-style:
 *      decimal inside !important` rules (older sections, still valid)
 *
 * If a section uses `<RichTextEditor>` and has NEITHER of those, this
 * test fails — preventing the Blog-Body bullet bug from sneaking into
 * any other section in the future.
 */
const fs = require("fs");
const path = require("path");

const SECTIONS_DIR = path.resolve(__dirname, "..");

let pass = 0, fail = 0;
const expect = (label, ok, extra = "") => {
  if (ok) { console.log("PASS ·", label); pass++; }
  else { console.error("FAIL ·", label, extra ? " — " + extra : ""); fail++; }
};

// Discover every section file. Filter to ones whose source contains
// either `<RichTextEditor` OR the standalone richtext block's own
// Tiptap output (richtext.js is the dedicated rich-text section, even
// though it doesn't import RichTextEditor directly — its source IS
// the rich text consumer).
const sectionFiles = fs
  .readdirSync(SECTIONS_DIR)
  .filter((f) => f.endsWith(".js") && !f.startsWith("_"))
  .map((f) => path.join(SECTIONS_DIR, f))
  .filter((p) => fs.statSync(p).isFile());

const richTextSections = [];
for (const file of sectionFiles) {
  const src = fs.readFileSync(file, "utf8");
  // Two qualifying conditions: imports RichTextEditor, OR the section
  // is the dedicated rich-text block (`richtext.js`).
  if (
    /import RichTextEditor from/.test(src) ||
    /\/sections\/richtext\.js$/.test(file)
  ) {
    richTextSections.push({ file, src });
  }
}

expect(
  "Audit discovered at least 4 rich-text-bearing sections (blogBody, faq, featureGrid, productGrid, products, richtext)",
  richTextSections.length >= 4,
);

// Per-section assertion: at least ONE of the two counter-patterns
// is present. The test is permissive on purpose — old sections that
// went the inline route still work and shouldn't be forced to
// refactor just to keep CI green.
const HELPER_RE = /richBodyResetCss\(/;
const INLINE_UL_RE = /list-style\s*:\s*disc\s+inside\s*!important/i;
const INLINE_OL_RE = /list-style\s*:\s*decimal\s+inside\s*!important/i;

for (const { file, src } of richTextSections) {
  const base = path.basename(file);
  const usesHelper = HELPER_RE.test(src);
  const usesInline = INLINE_UL_RE.test(src) && INLINE_OL_RE.test(src);
  expect(
    `${base}: restores bullet markers (via richBodyResetCss OR explicit list-style rules)`,
    usesHelper || usesInline,
    usesHelper
      ? ""
      : usesInline
        ? ""
        : "neither richBodyResetCss(...) call nor 'list-style: disc/decimal inside !important' rules found",
  );
}

// Also assert the shared helper itself still emits both rules — a
// regression in `shared.js` would silently break every section that
// uses the helper, so we lock the helper's output shape too.
const sharedSrc = fs.readFileSync(path.join(SECTIONS_DIR, "shared.js"), "utf8");
expect(
  "shared.js → richBodyResetCss still emits the !important list-style restoration rules",
  /\$\{scope\} ul\{list-style:disc inside!important\}/.test(sharedSrc) &&
    /\$\{scope\} ol\{list-style:decimal inside!important\}/.test(sharedSrc),
);
expect(
  "shared.js → richBodyResetCss still emits the `li p {display:inline}` rule that fixes Tiptap's <li><p> wrap",
  /\$\{scope\} li p\{display:inline/.test(sharedSrc),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
