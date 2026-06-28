/**
 * Smoke tests for the "Pro · Blog tools" band — the second red-ringed
 * Pro grouping that surfaces Blog Index + Blog Body together. Asserts
 * the band lives on BOTH the dashboard section picker AND the public
 * landing page's Sections showcase, that blog-index is ordered FIRST
 * (so the row reads left-to-right "list of posts → individual post"),
 * and that the badge metadata still tags both sections as NEW.
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const SRC_ROOT = path.resolve(__dirname, "../..");
function transformFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  return babel.transformSync(code, {
    filename: filePath, babelrc: false, configFile: false,
    presets: [["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }]],
  }).code;
}
const origJsExt = require.extensions[".js"];
require.extensions[".js"] = function (m, f) {
  if (!f.startsWith(SRC_ROOT)) return origJsExt(m, f);
  m._compile(transformFile(f), f);
};

let pass = 0, fail = 0;
const expect = (label, ok) => {
  if (ok) { console.log("PASS ·", label); pass++; }
  else { console.error("FAIL ·", label); fail++; }
};

// ── 1. Dashboard SectionPicker — three bands ──────────────────────
const pickerSrc = fs.readFileSync(
  path.join(__dirname, "../../pages/dashboard/common.jsx"),
  "utf8",
);
expect(
  "Dashboard picker defines PRO_BLOG_IDS with blog-index FIRST then blog-body",
  /PRO_BLOG_IDS = \["blog-index", "blog-body"\]/.test(pickerSrc),
);
expect(
  "Dashboard picker has a 'Pro · Blog tools' band with its own testid",
  /data-testid="section-picker-blog-band"/.test(pickerSrc) &&
    /Pro · Blog tools/.test(pickerSrc),
);
expect(
  "Dashboard picker excludes the blog ids from the editorial fallback list",
  /\(s\) => !PRO_NETTAILER_IDS\.has\(s\.id\) && !PRO_BLOG_SET\.has\(s\.id\)/.test(pickerSrc),
);
expect(
  "Editorial heading shows when EITHER Pro band has content",
  /\(proSections\.length > 0 \|\| proBlogSections\.length > 0\)/.test(pickerSrc),
);

// ── 2. Landing showcase — Pro Blog band + ordering ────────────────
const showcaseSrc = fs.readFileSync(
  path.join(__dirname, "../../pages/login/SectionsShowcase.jsx"),
  "utf8",
);
expect(
  "Landing showcase declares BLOG_SECTIONS with blog-index FIRST",
  /const BLOG_SECTIONS = \[\s*\{\s*id:\s*"blog-index"/.test(showcaseSrc),
);
expect(
  "Landing showcase has a 'Pro · Blog tools' band with its own testid",
  /data-testid="login-blog-band"/.test(showcaseSrc) &&
    /Pro · Blog tools/.test(showcaseSrc),
);
expect(
  "Landing showcase NO LONGER lists blog-body inside the generic SECTIONS array",
  !/id:\s*"blog-body".*name:\s*"Blog Body"/.test(
    showcaseSrc.replace(/const BLOG_SECTIONS[\s\S]*?\];/, ""),
  ),
);
expect(
  "Landing showcase NO LONGER lists blog-index inside the generic SECTIONS array",
  !/id:\s*"blog-index".*name:\s*"Blog Index"/.test(
    showcaseSrc.replace(/const BLOG_SECTIONS[\s\S]*?\];/, ""),
  ),
);

// ── 3. Registry — blog-index comes before blog-body ───────────────
const reg = fs.readFileSync(
  path.join(__dirname, "../registry.js"),
  "utf8",
);
expect(
  "Registry imports blogIndex BEFORE blogBody",
  /import \{ blogIndex \}[\s\S]{0,80}import \{ blogBody \}/.test(reg),
);
expect(
  "SECTIONS array lists blogIndex before blogBody",
  /blogIndex,\s*\n\s*blogBody,/.test(reg),
);

// ── 4. Section meta — both blog sections still NEW (top-3 added) ──
const { SECTION_META } = require("../sectionMeta.js");
const { computeBadges } = require("../../lib/sectionBadges.js");
const sectionsForBadges = Object.entries(SECTION_META).map(([id, m]) => ({
  id, ...m,
}));
const badges = computeBadges(sectionsForBadges);
expect("blog-index is currently flagged NEW", badges["blog-index"] === "new");
expect("blog-body is currently flagged NEW", badges["blog-body"] === "new");
expect(
  "blog-index's updatedOn was bumped to reflect the Pro-band promotion (2026-02-28 or later)",
  new Date(SECTION_META["blog-index"].updatedOn) >=
    new Date("2026-02-28T00:00:00Z"),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
