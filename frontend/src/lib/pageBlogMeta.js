/**
 * pageBlogMeta — helpers to treat a Page as a "blog post" and derive
 * the metadata the Blog Index / Related-articles widget needs to
 * render a card.
 *
 * Why this lives in /lib (not /sections): the derivation logic is
 * pure JS that has to be reusable from both the blogIndex FormPanel
 * AND the blogBody Related-widget FormPanel. Centralising it here
 * keeps both call sites lean and makes the contract trivial to test
 * with a single test file.
 *
 * Detection rule (per user spec): a Page is a blog if any block has
 * `section_type === "blog-body"`. No explicit toggle, no schema
 * migration — auto-detected.
 */

const BLOG_BODY_TYPE = "blog-body";
const MAX_EXCERPT_CHARS = 200;

/**
 * @returns {boolean} true if the given page has at least one blog-body
 *   section in its blocks array.
 */
export function isBlogPage(page) {
  if (!page || !Array.isArray(page.blocks)) return false;
  return page.blocks.some((b) => b && b.section_type === BLOG_BODY_TYPE);
}

/**
 * @param {Array<Object>} pages
 * @returns {Array<Object>} subset of `pages` that are blog pages,
 *   sorted by most-recently-updated first.
 */
export function filterBlogPages(pages) {
  return (pages || [])
    .filter(isBlogPage)
    .slice()
    .sort((a, b) => {
      const at = a?.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bt = b?.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bt - at;
    });
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentenceOf(text) {
  if (!text) return "";
  const m = text.match(/^[^.!?]+[.!?]/);
  const out = (m ? m[0] : text).trim();
  return out.length > MAX_EXCERPT_CHARS
    ? out.slice(0, MAX_EXCERPT_CHARS - 1).trimEnd() + "…"
    : out;
}

function firstImageFrom(html) {
  if (!html) return "";
  const m = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

function isoDateOf(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * Derive a blog-card shape from a Page document. Used by the Blog
 * Index "Pick from your pages" button (which appends a card with
 * these fields filled in) and by the Blog Body Related-articles
 * widget (which appends an item with title/excerpt/image/link).
 *
 * Source mapping (per user spec — option 1a + 2a + 3b):
 *   title    ← page.name
 *   excerpt  ← first sentence of blog-body.config.body (HTML stripped)
 *   image    ← first <img src> inside blog-body.config.body
 *   author   ← name field of the first "author" widget if present
 *   date     ← page.updated_at as YYYY-MM-DD
 *   link     ← page.public_url || ""
 *   category ← left empty; user fills in if they want one
 *
 * @param {Object} page  full Page document from GET /api/pages
 * @returns {Object} blog-card shape: { title, excerpt, image, imageAlt,
 *   author, date, link, category }
 */
export function pageToBlogCard(page) {
  const blogBody = (page?.blocks || []).find(
    (b) => b && b.section_type === BLOG_BODY_TYPE,
  );
  const cfg = blogBody?.config || {};
  const body = cfg.body || "";
  const widgets = Array.isArray(cfg.widgets) ? cfg.widgets : [];
  const authorWidget = widgets.find((w) => w && w.type === "author");

  return {
    title: page?.name || "Untitled",
    excerpt: firstSentenceOf(stripHtml(body)),
    image: firstImageFrom(body),
    imageAlt: page?.name || "",
    author: authorWidget?.name || "",
    date: isoDateOf(page?.updated_at),
    link: page?.public_url || "",
    category: "",
  };
}

/**
 * Smaller projection used by the Related-articles widget — it only
 * carries title / excerpt / image / link.
 */
export function pageToRelatedItem(page) {
  const full = pageToBlogCard(page);
  return {
    title: full.title,
    excerpt: full.excerpt,
    image: full.image,
    link: full.link,
  };
}

// ────────────────────────────────────────────────────────────────────
// Section-level variants — for users who author a blog as a standalone
// Section (in the Sections library) rather than as a multi-block Page.
// Same derivation rules, but the source is `section.config` directly
// (not `section.config.blocks[i].config`).
// ────────────────────────────────────────────────────────────────────

/**
 * @returns {boolean} true if the given section is of type "blog-body".
 *   The Sections library lets users author a blog-body snippet on its
 *   own; this lets the picker pick it up alongside full Pages.
 */
export function isBlogSection(section) {
  return !!section && section.type === BLOG_BODY_TYPE;
}

export function filterBlogSections(sections) {
  return (sections || [])
    .filter(isBlogSection)
    .slice()
    .sort((a, b) => {
      const at = a?.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bt = b?.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bt - at;
    });
}

/**
 * Derive a blog-card shape from a Section document (type === "blog-body").
 * Mirrors `pageToBlogCard` but the body/widgets live directly on
 * `section.config` instead of inside a block.
 */
export function sectionToBlogCard(section) {
  const cfg = section?.config || {};
  const body = cfg.body || "";
  const widgets = Array.isArray(cfg.widgets) ? cfg.widgets : [];
  const authorWidget = widgets.find((w) => w && w.type === "author");

  return {
    title: section?.name || cfg.heading || "Untitled",
    excerpt: firstSentenceOf(stripHtml(body)),
    image: firstImageFrom(body),
    imageAlt: section?.name || "",
    author: authorWidget?.name || "",
    date: isoDateOf(section?.updated_at),
    link: section?.public_url || "",
    category: "",
  };
}

export function sectionToRelatedItem(section) {
  const full = sectionToBlogCard(section);
  return {
    title: full.title,
    excerpt: full.excerpt,
    image: full.image,
    link: full.link,
  };
}

/**
 * Unified picker entry — merges Pages (that contain a blog-body block)
 * with Sections (of type blog-body) into a single list, tagged with
 * `kind: "page" | "section"` so the picker UI can label rows and the
 * caller can route the pick through the right derivation helper.
 *
 * Sorted newest-first by updated_at across both kinds.
 */
export function filterBlogContent({ pages = [], sections = [] } = {}) {
  const taggedPages = filterBlogPages(pages).map((p) => ({
    kind: "page",
    id: p.page_id,
    name: p.name,
    public_url: p.public_url || "",
    updated_at: p.updated_at,
    doc: p,
  }));
  const taggedSections = filterBlogSections(sections).map((s) => ({
    kind: "section",
    id: s.section_id,
    name: s.name,
    public_url: s.public_url || "",
    updated_at: s.updated_at,
    doc: s,
  }));
  return [...taggedPages, ...taggedSections].sort((a, b) => {
    const at = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bt = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return bt - at;
  });
}

/**
 * Project a picker entry into a blog-card shape, dispatching on `kind`.
 */
export function entryToBlogCard(entry) {
  return entry.kind === "section"
    ? sectionToBlogCard(entry.doc)
    : pageToBlogCard(entry.doc);
}

export function entryToRelatedItem(entry) {
  return entry.kind === "section"
    ? sectionToRelatedItem(entry.doc)
    : pageToRelatedItem(entry.doc);
}
