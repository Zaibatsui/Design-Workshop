/**
 * Smoke tests for two related additions:
 *   • "Convert to Page" action on blog-body Section cards — should be
 *     wired through the page-templates registry and only surface when
 *     the section type matches.
 *   • Library tab of the page editor's Block Adder now exposes a
 *     collection filter pill bar, so users with long section libraries
 *     can narrow to a specific folder.
 *
 * Both are static-shape smoke tests — they verify the JSX wiring
 * (imports, testids, prop names, conditional rendering guards) is
 * present and stable. They do NOT mount the React tree because the
 * existing snippet-test harness is dependency-light by design.
 */
const fs = require("fs");
const path = require("path");

let pass = 0, fail = 0;
const expect = (label, ok, extra = "") => {
  if (ok) { console.log("PASS ·", label); pass++; }
  else { console.error("FAIL ·", label, extra ? " — " + extra : ""); fail++; }
};

// ── 1. SectionsTab — Convert to Page action ───────────────────────
const sectionsTabSrc = fs.readFileSync(
  path.join(__dirname, "../../pages/dashboard/SectionsTab.jsx"),
  "utf8",
);

expect(
  "SectionsTab imports the page-templates registry to source the blog-post template",
  /import \{ PAGE_TEMPLATES_BY_ID \} from "@\/sections\/pageTemplates"/.test(sectionsTabSrc),
);
expect(
  "SectionsTab declares a convertBlogBodyToPage callback that pulls 'blog-post' template",
  /convertBlogBodyToPage = useCallback/.test(sectionsTabSrc) &&
    /PAGE_TEMPLATES_BY_ID\["blog-post"\]/.test(sectionsTabSrc),
);
expect(
  "convertBlogBodyToPage injects the source section's config into the blog-body block",
  /b\.section_type === "blog-body"[\s\S]{0,400}config:\s*\{[^}]*\.\.\.section\.config/.test(sectionsTabSrc),
);
expect(
  "convertBlogBodyToPage navigates to /edit/page/new with the customised template in state",
  /navigate\("\/edit\/page\/new",\s*\{\s*state:\s*\{\s*template:\s*customised\s*\}/.test(sectionsTabSrc),
);
expect(
  "SectionCard receives the convertBlogBodyToPage handler via onConvertToPage prop",
  /onConvertToPage=\{convertBlogBodyToPage\}/.test(sectionsTabSrc),
);
expect(
  "Convert-to-page button only renders for sections of type 'blog-body'",
  /section\.type === "blog-body" && onConvertToPage && \(/.test(sectionsTabSrc),
);
expect(
  "Convert-to-page button has a stable per-section testid for E2E selection",
  /data-testid=\{`convert-to-page-\$\{section\.section_id\}`\}/.test(sectionsTabSrc),
);

// ── 2. BlockAdder — collection filter pills ───────────────────────
const adderSrc = fs.readFileSync(
  path.join(__dirname, "../../pages/page-editor/BlockAdder.jsx"),
  "utf8",
);

expect(
  "BlockAdder accepts libraryCollections prop with an empty-array default",
  /libraryCollections\s*=\s*\[\]/.test(adderSrc),
);
expect(
  "LibrarySectionsGrid receives both sections + collections props",
  /<LibrarySectionsGrid[\s\S]{0,200}collections=\{libraryCollections\}[\s\S]{0,200}\/>/.test(adderSrc),
);
expect(
  "Filter pill bar carries a stable testid for E2E selection",
  /data-testid="library-collection-filter"/.test(adderSrc),
);
expect(
  "Pill bar renders 'All' + per-collection pills with their counts",
  /testid="filter-pill-all"/.test(adderSrc) &&
    /testid=\{`filter-pill-\$\{c\.collection_id\}`\}/.test(adderSrc),
);
expect(
  "Unfiled pill only renders when there are actually unfiled sections",
  /counts\.__unfiled__ > 0/.test(adderSrc),
);
expect(
  "Empty collections (zero sections in them) are filtered OUT of the pill bar — keeps it tidy",
  /\.filter\(\(c\) => \(counts\[c\.collection_id\] \|\| 0\) > 0\)/.test(adderSrc),
);
expect(
  "Pill bar only renders when the user has at least one real collection",
  /const hasCollections = collections\.length > 0/.test(adderSrc) &&
    /\{hasCollections && \(/.test(adderSrc),
);
expect(
  "Per-pill click flips activeId state and the visible list filters off it",
  /setActiveId\(c\.collection_id\)/.test(adderSrc) &&
    /activeId === c\.collection_id/.test(adderSrc) &&
    /sections\.filter\(\(s\) => s\.collection_id === activeId\)/.test(adderSrc),
);
expect(
  "Empty-folder fallback copy nudges the user to switch filters",
  /No sections in this folder\. Pick a different filter above\./.test(adderSrc),
);

// ── 3. PageEditor — loads collections + passes them down ──────────
const pageEditorSrc = fs.readFileSync(
  path.join(__dirname, "../../pages/PageEditor.jsx"),
  "utf8",
);
expect(
  "PageEditor loads collections on mount via api.listCollections",
  /api\s*\.listCollections\(\)\s*\.then\(setLibraryCollections\)/.test(pageEditorSrc),
);
expect(
  "PageEditor passes libraryCollections through to <BlockAdder />",
  /libraryCollections=\{libraryCollections\}/.test(pageEditorSrc),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
