/**
 * Rich text block renderer — produces a self-contained, scoped HTML snippet
 * for a tiptap-generated block of content (h1-h3, p, ul/ol, strong/em, links).
 *
 * Kept intentionally separate from registry.js SECTIONS: rich text is only a
 * block type inside Pages (not a standalone library section).
 */
import { FONT_IMPORT, baseReset, escHtml, fullBleedClass, makeUid, padTopOf, padBotOf, wrapSnippet } from "./shared";

const ID = "richtext";

const defaults = () => ({
  html: "<h2>New section</h2><p>Write something compelling.</p>",
  padY: 48, // px legacy single-value padding (still read as fallback)
  bg: "#ffffff",
  fg: "#1f2937",
  accent: "#E01839",
  align: "left", // left | center
  fullBleed: false,
  // Link style controls. Defaults preserve the original "branded + underlined"
  // behaviour so existing blocks keep rendering identically.
  underlineLinks: true,
  // When false, the section's default colours + link decoration are forced
  // (using !important) so any inline `style="..."` on pasted HTML is
  // overridden by the platform defaults. Default true → pasted inline
  // styles win, matching the natural CSS cascade.
  respectInlineStyles: true,
});

function render(cfg = {}) {
  const {
    html = "",
    bg = "#ffffff",
    fg = "#1f2937",
    accent = "#E01839",
    align = "left",
    fullBleed = false,
    underlineLinks = true,
    respectInlineStyles = true,
  } = cfg;
  const uid = cfg.uid || makeUid();
  const cls = `ns-richtext-${uid}`;
  // Resolve top/bottom padding through paddingTop → paddingY → padY → 48.
  // The legacy `padY` field stays read-only here for blocks created before
  // the top/bottom sliders shipped.
  const padCfg = { ...cfg, paddingY: cfg.paddingY ?? cfg.padY };
  const padTop = padTopOf(padCfg, 48);
  const padBot = padBotOf(padCfg, 48);

  // !important is appended on the relevant declarations only when the user
  // chose to ignore inline styles. With the default (respect) we additionally
  // wrap our selectors in :where() so they carry zero specificity — that
  // way any rule the user pastes (inline OR via a <style> block) wins
  // automatically, regardless of source order.
  const bang = respectInlineStyles ? "" : " !important";
  // Selector wrapper — :where() zeroes specificity. Used only on the
  // user-visible style rules (colour, link decoration); structural rules
  // like padding / max-width keep their normal specificity so they aren't
  // accidentally overridden by generic pasted resets.
  const w = respectInlineStyles
    ? (sel) => `:where(${sel})`
    : (sel) => sel;
  const linkDecoration = underlineLinks
    ? `text-decoration:underline${bang};text-underline-offset:2px`
    : `text-decoration:none${bang}`;

  const css = `
${baseReset(cls, { lowSpecificity: respectInlineStyles })}
.${cls}{background:${bg};padding:${padTop}px 20px ${padBot}px}
${w(`.${cls}`)}{color:${fg}${bang}}
.${cls} .ns-inner{max-width:1200px;margin:0 auto;text-align:${align === "center" ? "center" : "left"}}
.${cls} h1{font-size:clamp(28px,4vw,44px);font-weight:700;letter-spacing:-0.01em;line-height:1.15;margin:0 0 18px}
.${cls} h2{font-size:clamp(22px,3vw,32px);font-weight:600;letter-spacing:-0.01em;line-height:1.2;margin:24px 0 14px}
.${cls} h3{font-size:18px;font-weight:600;letter-spacing:0;line-height:1.3;margin:18px 0 10px}
.${cls} p{font-size:16px;line-height:1.65;margin:0 0 14px}
.${cls} strong{font-weight:600}
.${cls} em{font-style:italic}
${w(`.${cls} a`)}{color:${accent}${bang};${linkDecoration}}
${w(`.${cls} a[data-no-underline]`)}{text-decoration:none${bang}}
${w(`.${cls} a:hover`)}{opacity:.8}
.${cls} ul,.${cls} ol{margin:0 0 14px 0;padding-left:22px${align === "center" ? ";text-align:left;display:inline-block" : ""}}
.${cls} ul{list-style:disc!important}
.${cls} ol{list-style:decimal!important}
.${cls} li{margin:0 0 6px;line-height:1.6}
.${cls} .ns-inner > :first-child{margin-top:0}
.${cls} .ns-inner > :last-child{margin-bottom:0}
`.trim();

  // Richtext html is stored verbatim — users can embed <script>, <iframe>,
  // inline handlers, etc. The snippet is their CMS content; they own the
  // blast radius. The only transformation here is: if config.html is missing
  // entirely we fall back to an empty string.
  const safe = String(html || "");

  const htmlOut = `<section class="${cls}${fullBleedClass(cfg)}"><div class="ns-inner">${safe}</div></section>`;
  return wrapSnippet({ html: htmlOut, css, js: "" });
}

/** Strip ALL Google Fonts @import declarations from a snippet. Used when
 *  composing a page so we don't end up with N redundant @imports — only the
 *  first block keeps its font import.
 *
 *  Matches any family name (Poppins, Lato, "Playfair Display", …) so the
 *  strip is order-independent — works whether composePage runs before or
 *  after applyFontToSnippet has rewritten the family.
 */
export function stripSnippetFontImport(snippet) {
  return String(snippet).replace(
    /@import\s+url\(["']?https:\/\/fonts\.googleapis\.com\/css2\?family=[^)]+\);?/g,
    ""
  );
}

export const richtext = {
  id: ID,
  name: "Rich text",
  description: "Headings, paragraphs, lists and links",
  defaults,
  render,
};

export { escHtml, FONT_IMPORT };
