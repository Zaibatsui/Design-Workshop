/**
 * Smoke tests for the Page → Blog Card derivation helpers used by
 * Blog Index + Blog Body Related-articles widget. Centralised here
 * so both sections rely on a single, well-tested projection.
 */
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");
const fs = require("fs");

const SRC_ROOT = path.resolve(__dirname, "../..");

function transformFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  return babel.transformSync(code, {
    filename: filePath,
    babelrc: false,
    configFile: false,
    presets: [
      ["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }],
    ],
  }).code;
}
const origJsExt = require.extensions[".js"];
require.extensions[".js"] = function (m, f) {
  if (!f.startsWith(SRC_ROOT)) return origJsExt(m, f);
  m._compile(transformFile(f), f);
};

const { isBlogPage, filterBlogPages, pageToBlogCard, pageToRelatedItem } =
  require("../pageBlogMeta.js");

let pass = 0, fail = 0;
const expect = (label, ok, extra = "") => {
  if (ok) { console.log("PASS ·", label); pass++; }
  else { console.error("FAIL ·", label, extra ? " — " + extra : ""); fail++; }
};

// ── isBlogPage ────────────────────────────────────────────────────
expect("isBlogPage: null → false", isBlogPage(null) === false);
expect("isBlogPage: no blocks → false", isBlogPage({}) === false);
expect(
  "isBlogPage: a page with only a hero is NOT a blog",
  isBlogPage({ blocks: [{ section_type: "hero" }] }) === false,
);
expect(
  "isBlogPage: a page that contains a blog-body block IS a blog",
  isBlogPage({
    blocks: [
      { section_type: "hero" },
      { section_type: "blog-body" },
    ],
  }) === true,
);

// ── filterBlogPages: sort by updated_at desc, drop non-blogs ─────
const pages = [
  { page_id: "p1", name: "Old blog", updated_at: "2026-01-10T00:00:00Z", blocks: [{ section_type: "blog-body" }] },
  { page_id: "p2", name: "Landing",  updated_at: "2026-02-20T00:00:00Z", blocks: [{ section_type: "hero" }] },
  { page_id: "p3", name: "New blog", updated_at: "2026-02-19T00:00:00Z", blocks: [{ section_type: "blog-body" }] },
];
const filtered = filterBlogPages(pages);
expect("filterBlogPages: keeps only blog pages", filtered.length === 2);
expect("filterBlogPages: sorted newest-first", filtered[0].page_id === "p3" && filtered[1].page_id === "p1");

// ── pageToBlogCard: extracts title/excerpt/image/author/date/link ─
const samplePage = {
  page_id: "pg_abc",
  name: "How to scale a video surveillance estate",
  updated_at: "2026-02-19T10:30:00.000Z",
  public_url: "https://example.com/blog/scale-video",
  blocks: [
    { section_type: "hero", config: {} },
    {
      section_type: "blog-body",
      config: {
        body:
          '<p>Open with the <strong>idea</strong> that would make a reader nod. Then back it up.</p>' +
          '<p><img src="https://images.example.com/hero.jpg" alt="cover"/>More copy.</p>',
        widgets: [
          { type: "cta", heading: "Get in touch" },
          { type: "author", name: "Sam Reynolds", role: "Editorial" },
        ],
      },
    },
  ],
};
const card = pageToBlogCard(samplePage);
expect("pageToBlogCard.title = page.name", card.title === "How to scale a video surveillance estate");
expect("pageToBlogCard.excerpt = first sentence of body (HTML stripped)",
  card.excerpt === "Open with the idea that would make a reader nod.");
expect("pageToBlogCard.image = first <img src> in the body",
  card.image === "https://images.example.com/hero.jpg");
expect("pageToBlogCard.author = name of first author widget",
  card.author === "Sam Reynolds");
expect("pageToBlogCard.date = page.updated_at as YYYY-MM-DD",
  card.date === "2026-02-19");
expect("pageToBlogCard.link = page.public_url",
  card.link === "https://example.com/blog/scale-video");
expect("pageToBlogCard.category defaults to empty",
  card.category === "");

// ── pageToBlogCard: graceful fallbacks ────────────────────────────
const sparsePage = {
  page_id: "pg_bare",
  name: "Bare post",
  updated_at: null,
  blocks: [{ section_type: "blog-body", config: { body: "" } }],
};
const bare = pageToBlogCard(sparsePage);
expect("pageToBlogCard handles empty body without crashing", bare.excerpt === "");
expect("pageToBlogCard returns empty image when body has no <img>", bare.image === "");
expect("pageToBlogCard returns empty author when no author widget", bare.author === "");
expect("pageToBlogCard returns empty link when page has no public_url", bare.link === "");
expect("pageToBlogCard returns empty date when updated_at is null", bare.date === "");

// ── pageToBlogCard: excerpt over 200 chars gets truncated with ellipsis
const longBody = "<p>" + "Lorem ipsum dolor sit amet ".repeat(20) + "</p>";
const longCard = pageToBlogCard({ name: "x", updated_at: null, blocks: [{ section_type: "blog-body", config: { body: longBody } }] });
expect("pageToBlogCard: long excerpts truncate to 200 chars with ellipsis",
  longCard.excerpt.length <= 200 && longCard.excerpt.endsWith("…"));

// ── pageToRelatedItem: smaller projection (no author/date/category) ─
const rel = pageToRelatedItem(samplePage);
expect("pageToRelatedItem keeps title/excerpt/image/link only",
  rel.title === "How to scale a video surveillance estate" &&
  rel.excerpt === "Open with the idea that would make a reader nod." &&
  rel.image === "https://images.example.com/hero.jpg" &&
  rel.link === "https://example.com/blog/scale-video" &&
  rel.author === undefined &&
  rel.date === undefined);

// ── Section-level helpers (standalone blog-body Section) ──────────
const { isBlogSection, filterBlogSections, sectionToBlogCard, sectionToRelatedItem,
        filterBlogContent, entryToBlogCard, entryToRelatedItem } = require("../pageBlogMeta.js");

const sampleSection = {
  section_id: "sec_xyz",
  name: "Why we picked Wireguard over IPsec",
  type: "blog-body",
  updated_at: "2026-02-21T08:00:00Z",
  public_url: "https://example.com/blog/wireguard",
  config: {
    body:
      '<p>The <em>short</em> version: ergonomics. The long version follows.</p>' +
      '<p><img src="https://images.example.com/wg.jpg" alt="diagram"/>Detail.</p>',
    widgets: [
      { type: "tags", items: [{ label: "Networking" }] },
      { type: "author", name: "Priya Shah" },
    ],
  },
};
expect("isBlogSection: non-blog section type → false",
  isBlogSection({ type: "hero" }) === false);
expect("isBlogSection: blog-body section → true",
  isBlogSection(sampleSection) === true);

const blogSections = filterBlogSections([
  { type: "hero", name: "Landing hero" },
  sampleSection,
]);
expect("filterBlogSections: keeps only blog-body sections", blogSections.length === 1);

const sCard = sectionToBlogCard(sampleSection);
expect("sectionToBlogCard.title = section.name",
  sCard.title === "Why we picked Wireguard over IPsec");
expect("sectionToBlogCard.excerpt = first sentence of body (HTML stripped)",
  sCard.excerpt === "The short version: ergonomics.");
expect("sectionToBlogCard.image = first <img src> in body",
  sCard.image === "https://images.example.com/wg.jpg");
expect("sectionToBlogCard.author = name of first author widget",
  sCard.author === "Priya Shah");
expect("sectionToBlogCard.date = section.updated_at as YYYY-MM-DD",
  sCard.date === "2026-02-21");
expect("sectionToBlogCard.link = section.public_url",
  sCard.link === "https://example.com/blog/wireguard");

const sRel = sectionToRelatedItem(sampleSection);
expect("sectionToRelatedItem keeps title/excerpt/image/link only",
  sRel.title === "Why we picked Wireguard over IPsec" &&
  sRel.author === undefined &&
  sRel.date === undefined);

// ── Unified picker list (filterBlogContent) ───────────────────────
const merged = filterBlogContent({
  pages: [samplePage, { page_id: "px", name: "Landing", updated_at: "2026-02-15T00:00:00Z", blocks: [] }],
  sections: [sampleSection, { type: "hero", name: "irrelevant" }],
});
expect("filterBlogContent: drops non-blog pages and sections", merged.length === 2);
expect("filterBlogContent: tags entries with `kind`",
  merged.every((e) => e.kind === "page" || e.kind === "section"));
expect("filterBlogContent: sorts newest-first across both kinds",
  // sampleSection (2026-02-21) is newer than samplePage (2026-02-19)
  merged[0].kind === "section" && merged[1].kind === "page");

// ── entry→card/related dispatch on kind ───────────────────────────
const entryFromPage = { kind: "page", id: "pg_abc", doc: samplePage };
const entryFromSection = { kind: "section", id: "sec_xyz", doc: sampleSection };
expect("entryToBlogCard(page entry) → pageToBlogCard projection",
  entryToBlogCard(entryFromPage).title === samplePage.name);
expect("entryToBlogCard(section entry) → sectionToBlogCard projection",
  entryToBlogCard(entryFromSection).title === sampleSection.name);
expect("entryToRelatedItem(section entry) → 4-field projection",
  entryToRelatedItem(entryFromSection).author === undefined);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
