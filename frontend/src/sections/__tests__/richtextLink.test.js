/**
 * Unit tests for RichTextEditor link normalisation + target handling.
 * Exercises the buildHref and parseHref helpers via dynamic require
 * (the editor itself needs a DOM and isn't unit-tested here — that's
 * covered by the live editor screenshot smoke test).
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "../../components/RichTextEditor.jsx"),
  "utf8"
);

// Extract `normalizeWebUrl` function definition for direct unit-testing.
const m = src.match(/function normalizeWebUrl\(raw\) \{([\s\S]*?)\n\}/);
if (!m) {
  console.error("FAIL · could not locate normalizeWebUrl in RichTextEditor.jsx");
  process.exit(1);
}
// eslint-disable-next-line no-new-func
const normalizeWebUrl = new Function("raw", m[1]);

let pass = 0, fail = 0;
function expect(label, ok, detail = "") {
  if (ok) { console.log(`PASS · ${label}`); pass++; }
  else { console.log(`FAIL · ${label}${detail ? ` — ${detail}` : ""}`); fail++; }
}

// External URL bug: scheme-less inputs must get https:// prepended,
// otherwise the browser resolves them relative to the host page and
// links break inside embedded snippets.
expect("bare domain → https://", normalizeWebUrl("example.com") === "https://example.com");
expect("www subdomain → https://", normalizeWebUrl("www.example.com") === "https://www.example.com");
expect("subpath without scheme → https://", normalizeWebUrl("example.com/foo/bar") === "https://example.com/foo/bar");
expect("already-https kept",
  normalizeWebUrl("https://example.com") === "https://example.com");
expect("already-http kept",
  normalizeWebUrl("http://example.com") === "http://example.com");
expect("mailto: kept", normalizeWebUrl("mailto:a@b.com") === "mailto:a@b.com");
expect("tel: kept", normalizeWebUrl("tel:+44123") === "tel:+44123");
expect("ftp: kept", normalizeWebUrl("ftp://files.example.com") === "ftp://files.example.com");
// Intentional relative links — user typed `/path` or `#anchor` deliberately.
expect("/path kept", normalizeWebUrl("/about") === "/about");
expect("#anchor kept", normalizeWebUrl("#section-2") === "#section-2");
expect("?query kept", normalizeWebUrl("?utm=x") === "?utm=x");
// Whitespace trim
expect("trim whitespace", normalizeWebUrl("  example.com  ") === "https://example.com");
expect("empty → empty", normalizeWebUrl("") === "");
expect("null → empty", normalizeWebUrl(null) === "");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
