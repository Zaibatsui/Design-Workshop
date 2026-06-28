/**
 * Regression guard for the "Blog Body text becomes uneditable after
 * save" bug.
 *
 * Root cause: `blogBody.js` passed `<RichTextEditor value={cfg.body}>`
 * but the component's prop is `html`. So `html` was `undefined` and
 * the sync `useEffect` (`html !== editor.getHTML()`) fired on every
 * parent re-render, calling `setContent("", …)` and wiping anything
 * the user had just typed. Net effect: after the first autosave the
 * editor cleared and the user could only "replace" text.
 *
 * This audit asserts:
 *   1. Every section `<RichTextEditor>` call site uses `html={…}`
 *      (NOT `value={…}`). Sweep across all section files.
 *   2. `RichTextEditor` still defends against the typo via a
 *      `value` → `html` fallback shim, so the same mistake at a
 *      future call site doesn't silently wipe data again.
 *   3. The sync effect bails out when `sourceHtml` is undefined.
 */
const fs = require("fs");
const path = require("path");

const SECTIONS_DIR = path.resolve(__dirname, "..");

let pass = 0, fail = 0;
const expect = (label, ok, extra = "") => {
  if (ok) { console.log("PASS ·", label); pass++; }
  else { console.error("FAIL ·", label, extra ? " — " + extra : ""); fail++; }
};

// ── 1. No section file passes `value=` to <RichTextEditor> ────────
const sectionFiles = fs
  .readdirSync(SECTIONS_DIR)
  .filter((f) => f.endsWith(".js") && !f.startsWith("_"))
  .map((f) => path.join(SECTIONS_DIR, f));

const callsite = /<RichTextEditor[\s\S]{0,400}?\/>/g;
const offenders = [];
for (const file of sectionFiles) {
  const src = fs.readFileSync(file, "utf8");
  let m;
  while ((m = callsite.exec(src))) {
    if (/\bvalue=/.test(m[0])) {
      offenders.push({ file: path.basename(file), match: m[0].slice(0, 80) });
    }
  }
}
expect(
  "No section passes `value={…}` to <RichTextEditor> (the prop is `html`)",
  offenders.length === 0,
  offenders.map((o) => `${o.file}: ${o.match}`).join(" | "),
);

// ── 2. Every <RichTextEditor> call site uses `html={…}` ───────────
let callSiteCount = 0;
let htmlCount = 0;
for (const file of sectionFiles) {
  const src = fs.readFileSync(file, "utf8");
  let m;
  while ((m = callsite.exec(src))) {
    callSiteCount++;
    if (/\bhtml=/.test(m[0])) htmlCount++;
  }
}
expect(
  `Every <RichTextEditor> call site (${callSiteCount}) explicitly wires the html prop`,
  callSiteCount > 0 && callSiteCount === htmlCount,
);

// ── 3. RichTextEditor still has the `value` → `html` fallback shim
const rteSrc = fs.readFileSync(
  path.join(__dirname, "../../components/RichTextEditor.jsx"),
  "utf8",
);
expect(
  "RichTextEditor accepts `value` as a fallback so future typos don't silently wipe data",
  /\(\{\s*html,\s*value,/.test(rteSrc) &&
    /const sourceHtml = html !== undefined \? html : value/.test(rteSrc),
);

// ── 4. The sync effect bails out when sourceHtml is undefined ─────
expect(
  "Sync effect guards against undefined sourceHtml so editor isn't reset on every render",
  /if \(sourceHtml === undefined\) return/.test(rteSrc),
);

// ── 5. blogBody.js specifically uses html= (was the original site) ─
const bbSrc = fs.readFileSync(
  path.join(SECTIONS_DIR, "blogBody.js"),
  "utf8",
);
expect(
  "blogBody.js: <RichTextEditor html={cfg.body} … /> — the original bug site",
  /<RichTextEditor[\s\S]{0,200}html=\{cfg\.body\}/.test(bbSrc),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
