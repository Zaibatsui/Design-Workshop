/**
 * Regression: Split Banner `.ns-title` must emit `line-height:1.2`
 * in BOTH the `pageHeader: true` and `pageHeader: false` branches.
 * Previously only the pageHeader variant declared a line-height, so
 * non-pageHeader split banners inherited the host site's default
 * (often 1.5-1.6 from global `h2` rules), producing huge vertical
 * gaps between wrapped title lines.
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "../splitBanner.js"),
  "utf8"
);

let passed = 0;
let failed = 0;
function expect(label, cond) {
  if (cond) {
    console.log("PASS ·", label);
    passed++;
  } else {
    console.error("FAIL ·", label);
    failed++;
  }
}

expect(
  "pageHeader branch declares line-height:1.2",
  /font-weight:700;line-height:1\.2;letter-spacing:-\.02em/.test(src)
);

expect(
  "Non-pageHeader branch also declares line-height:1.2",
  /:\s*`font-size:\$\{num\(cfg\.headingSize, 30\)\}px;font-weight:600;line-height:1\.2;/.test(
    src
  )
);

expect(
  "No regression: line-height:1.15 no longer present",
  !/line-height:1\.15/.test(src)
);

console.log(`\n${failed === 0 ? "ALL PASSED" : "FAILED"} (${passed} passed, ${failed} failed)`);
if (failed > 0) process.exit(1);
