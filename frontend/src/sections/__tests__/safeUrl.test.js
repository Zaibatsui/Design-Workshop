/**
 * Regression: `safeUrl()` auto-prepends `https://` to host-shaped
 * URLs (anything containing a dot but no scheme and no leading
 * slash / hash). Stops snippets resolving naked URLs like
 * `example.com/foo` against the host site's own domain when the
 * snippet is embedded externally.
 */
const fs = require("fs");
const path = require("path");

const sharedSrc = fs.readFileSync(
  path.join(__dirname, "../shared.js"),
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

// Static-source assertions (back-up for the runtime check below).
expect(
  "safeUrl auto-prepends https:// for host-shaped naked URLs",
  /return\s+`https:\/\/\$\{s\}`;/.test(sharedSrc)
);
expect(
  "safeUrl preserves anchors (#…)",
  /!s\.startsWith\("#"\)/.test(sharedSrc)
);
expect(
  "safeUrl preserves absolute paths (/…)",
  /!s\.startsWith\("\/"\)/.test(sharedSrc)
);
expect(
  "safeUrl preserves explicit schemes (http: / mailto: / tel: / etc.)",
  /!\/\^\[a-z\]\[a-z0-9\+\.\-\]\*:\/i\.test\(s\)/.test(sharedSrc)
);

// Runtime check via dynamic import — keeps the test self-contained
// even if a future refactor splits shared.js into smaller files.
(async () => {
  const mod = await import("../shared.js");
  const cases = [
    ["", ""],
    ["#section", "#section"],
    ["/path/x", "/path/x"],
    ["https://example.com", "https://example.com"],
    ["mailto:x@y.com", "mailto:x@y.com"],
    ["example.com", "https://example.com"],
    ["www.example.com/foo", "https://www.example.com/foo"],
    ["javascript:alert(1)", ""],
    ["  https://x.com  ", "https://x.com"],
  ];
  for (const [input, want] of cases) {
    const got = mod.safeUrl(input);
    expect(
      `safeUrl(${JSON.stringify(input)}) → ${JSON.stringify(want)}`,
      got === want
    );
  }
  console.log(
    `\n${failed === 0 ? "ALL PASSED" : "FAILED"} (${passed} passed, ${failed} failed)`
  );
  if (failed > 0) process.exit(1);
})();
