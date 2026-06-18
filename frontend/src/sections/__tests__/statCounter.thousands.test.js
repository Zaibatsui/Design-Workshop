/**
 * Regression: Stat Counter renders thousand-separator commas on big
 * numbers (e.g. "50,000" instead of "50000") both at static render
 * time AND during the count-up animation. The toggle defaults to ON
 * and the user can disable it per-section.
 *
 * Tested via static source assertions on the renderer output and the
 * embedded IIFE — keeps the test dependency-free.
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "../statCounter.js"), "utf8");

function expect(label, ok, detail = "") {
  if (ok) console.log(`PASS · ${label}`);
  else {
    console.log(`FAIL · ${label}${detail ? ` — ${detail}` : ""}`);
    process.exitCode = 1;
  }
}

expect(
  "defaults() turns on thousandsSeparator by default",
  /thousandsSeparator:\s*true/.test(src)
);

expect(
  "renderer reads cfg.thousandsSeparator into a local",
  /thousandsSep\s*=\s*c\.thousandsSeparator\s*!==\s*false/.test(src)
);

expect(
  "section root carries data-ns-thousands attribute",
  /data-ns-thousands="\$\{thousandsSep\s*\?\s*"1"\s*:\s*"0"\}"/.test(src)
);

expect(
  "formatNumberString helper exists and groups 3-digit chunks",
  /function formatNumberString\(raw,\s*addSeparator\)/.test(src) &&
    /\\B\(\?=\(\\d\{3\}\)\+\(\?!\\d\)\)/.test(src)
);

expect(
  "static (non-animate) render passes the value through formatNumberString",
  /escHtml\(formatNumberString\(it\.value\s*\|\|\s*"",\s*thousandsSep\)\)/.test(src)
);

expect(
  "IIFE reads the data-ns-thousands flag",
  /sep=root\.getAttribute\("data-ns-thousands"\)==="1"/.test(src)
);

expect(
  "IIFE fmt() inserts commas via the same regex group when sep is on",
  /grp\(intp\)/.test(src) && /grp\(s\)\{return s\.replace\(\/\\\\B/.test(src)
);

expect(
  "FormPanel exposes a toggle wired to thousandsSeparator",
  /testid="stat-thousands-separator"/.test(src) &&
    /thousandsSeparator:\s*v/.test(src)
);

if (process.exitCode) {
  console.log("\nstatCounter.thousandsSeparator regression FAILED");
} else {
  console.log("\nALL PASSED (8 assertions)");
}
