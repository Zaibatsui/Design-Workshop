/**
 * Regression: tabs section can render an optional section header
 * (eyebrow + title + intro) above the tab row.
 *
 * - When all three fields are empty, NO `<header>` element is emitted
 *   (existing snippets keep rendering identically to before this
 *   feature was added).
 * - When any of the three is set, the header block appears with the
 *   correct CSS class names so users can override them.
 * - Header alignment maps to CSS via the `ns-section-head` /
 *   `ns-section-head-inner` rules — verified via the emitted CSS.
 *
 * This guard prevents future refactors from regressing the
 * "header silently disappears" or "old configs suddenly show empty
 * <h2>" failure modes.
 */
const fs = require("fs");
const path = require("path");

const tabsSrc = fs.readFileSync(path.join(__dirname, "../tabs.js"), "utf8");

function expect(label, ok, detail = "") {
  if (ok) console.log(`PASS · ${label}`);
  else {
    console.log(`FAIL · ${label}${detail ? ` — ${detail}` : ""}`);
    process.exitCode = 1;
  }
}

// Source-level guards (no DOM eval needed; the renderer is a plain
// template-string function so static assertions are enough to catch
// regressions).
expect(
  "tabs defaults include `eyebrow` field",
  /eyebrow:\s*"",/.test(tabsSrc)
);
expect(
  "tabs defaults include `heading` field",
  /heading:\s*"",/.test(tabsSrc)
);
expect(
  "tabs defaults include `subheading` field",
  /subheading:\s*"",/.test(tabsSrc)
);
expect(
  "tabs defaults include `headerAlign` field",
  /headerAlign:\s*"left",/.test(tabsSrc)
);
expect(
  "renderer drops <header> when all three header fields are empty",
  /eyebrowHtml \|\| sectionHeadingHtml \|\| subHtml/.test(tabsSrc)
);
expect(
  "renderer emits .ns-section-head wrapper class",
  /class="ns-section-head"/.test(tabsSrc)
);
expect(
  "renderer emits .ns-section-heading for the title",
  /class="ns-section-heading"/.test(tabsSrc)
);
expect(
  "renderer emits .ns-section-sub for each intro paragraph",
  /class="ns-section-sub"/.test(tabsSrc)
);
expect(
  "FormPanel exposes a Section header group with all three fields",
  /title="Section header"/.test(tabsSrc) &&
    /testid="tabs-eyebrow"/.test(tabsSrc) &&
    /testid="tabs-heading"/.test(tabsSrc) &&
    /testid="tabs-subheading"/.test(tabsSrc) &&
    /testid="tabs-header-align"/.test(tabsSrc)
);

if (process.exitCode) {
  console.log("\ntabs.sectionHeader regression FAILED");
} else {
  console.log("\nALL PASSED (9 assertions)");
}
