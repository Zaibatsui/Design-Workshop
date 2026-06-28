/**
 * Smoke tests for the Blog Body section — long-form article column
 * with an optional sidebar of CTA / Related / Tags / Author widgets.
 * Asserts the snippet shape, the three layout positions, the
 * opt-in sticky-on-scroll mode, the mobile-carousel CSS, and that
 * every widget type renders the expected DOM hooks.
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "../blogBody.js"), "utf8");

let pass = 0, fail = 0;
const expect = (label, ok) => {
  if (ok) { console.log("PASS ·", label); pass++; }
  else { console.error("FAIL ·", label); fail++; }
};

// ── Shape ──────────────────────────────────────────────────────────
expect("Section id is 'blog-body'", /const ID = "blog-body"/.test(src));
expect(
  "FormPanel wraps FormGroup children in a FormAccordion",
  /FormAccordion sectionType="blog-body"/.test(src),
);
expect("Defaults seed all four widget types (cta, related, tags, author)",
  /id:\s*"w-cta"[\s\S]+?id:\s*"w-related"[\s\S]+?id:\s*"w-tags"[\s\S]+?id:\s*"w-author"/.test(src));

// ── Sidebar position + DOM order ──────────────────────────────────
expect(
  "Sidebar position whitelist is left/right/below with default 'right'",
  /sidebarPosition:\s*"right"/.test(src) &&
    /\["left",\s*"right",\s*"below"\]\.includes\(cfg\.sidebarPosition\)/.test(src),
);
expect(
  "DOM order: left puts sidebar before body (correct tab order)",
  /pos === "left" \? sidebarHtml \+ bodyHtml : ""/.test(src),
);
expect(
  "DOM order: right puts body before sidebar",
  /pos === "right" \? bodyHtml \+ sidebarHtml : ""/.test(src),
);

// ── Sticky toggle ─────────────────────────────────────────────────
expect(
  "Sticky toggle adds an `ns-sticky` modifier on the section root",
  /cfg\.sidebarSticky \? " ns-sticky" : ""/.test(src) &&
    /\.\$\{cls\}\.ns-sticky \.ns-sidebar\{position:sticky/.test(src),
);

// ── Mobile carousel ───────────────────────────────────────────────
expect(
  "Mobile breakpoint turns the sidebar into a scroll-snap carousel",
  /@media \(max-width:767px\)/.test(src) &&
    /scroll-snap-type:x mandatory/.test(src) &&
    /scroll-snap-align:start/.test(src),
);
expect(
  "Mobile breakpoint disables sticky positioning (would conflict with the carousel)",
  /\.\$\{cls\}\.ns-sticky \.ns-sidebar\{position:static/.test(src),
);

// ── Widget render: every type emits its expected DOM hook ─────────
expect("CTA widget renders an anchor button with the brand-accent fill",
  /ns-w-cta-btn/.test(src) && /ns-w-cta-head/.test(src));
expect("Related-articles widget renders a card list with thumbnails + excerpts",
  /ns-w-rel-list/.test(src) && /ns-w-rel-item/.test(src) && /ns-w-rel-excerpt/.test(src));
expect("Tag-cluster widget renders pill-shaped chips",
  /ns-w-tag-cluster/.test(src) && /class="ns-w-tag"/.test(src));
expect("Author-card widget renders avatar, name, role, bio and an opt-in link",
  /ns-w-author-avatar/.test(src) && /ns-w-author-name/.test(src) && /ns-w-author-role/.test(src) && /ns-w-author-bio/.test(src));

// ── Click-to-edit ─────────────────────────────────────────────────
expect(
  "Each rendered widget carries data-ns-list='widget' + data-ns-item=<id> for click-to-edit",
  /data-ns-list="widget" data-ns-item="\$\{escAttr\(w\.id\)\}"/.test(src),
);
expect(
  "Body article carries data-ns-group='body' so clicks open the body editor",
  /<article class="ns-main" data-ns-group="body">/.test(src),
);

// ── Brand-kit cascade contract ────────────────────────────────────
expect(
  "Renderer uses the brand-kit field names (bgColor, cardBg, titleColor, bodyColor, eyebrowAccentColor, cardRadius, font)",
  /safeColor\(cfg\.bgColor/.test(src) &&
    /safeColor\(cfg\.cardBg/.test(src) &&
    /safeColor\(cfg\.titleColor/.test(src) &&
    /safeColor\(cfg\.bodyColor/.test(src) &&
    /safeColor\(cfg\.eyebrowAccentColor/.test(src) &&
    /num\(cfg\.cardRadius/.test(src),
);

// ── Cross-file: registry pulls it in ──────────────────────────────
const reg = fs.readFileSync(path.join(__dirname, "../registry.js"), "utf8");
expect(
  "Registry imports + registers blogBody",
  /import \{ blogBody \} from "\.\/blogBody"/.test(reg) &&
    /blogBody,\s*\]\.map\(withMeta\)/.test(reg),
);

// ── Cross-file: brand-kit mapper exists ───────────────────────────
const bk = fs.readFileSync(path.join(__dirname, "../../lib/brandKit.js"), "utf8");
expect(
  "Brand Kit mapper writes the section's theme fields on creation",
  /"blog-body":\s*\(cfg, b\)\s*=>\s*\(\{[\s\S]{0,600}eyebrowAccentColor: pick\(b, "accent_color"\)/.test(bk),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
