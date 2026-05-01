/**
 * Rich text block renderer — produces a self-contained, scoped HTML snippet
 * for a tiptap-generated block of content (h1-h3, p, ul/ol, strong/em, links).
 *
 * Kept intentionally separate from registry.js SECTIONS: rich text is only a
 * block type inside Pages (not a standalone library section).
 */
import { FONT_IMPORT, baseReset, escHtml, fullBleedClass, makeUid, wrapSnippet } from "./shared";

const ID = "richtext";

const defaults = () => ({
  html: "<h2>New section</h2><p>Write something compelling.</p>",
  maxWidth: 820, // px — content column width
  padY: 48, // px vertical padding
  bg: "#ffffff",
  fg: "#1f2937",
  accent: "#E01839",
  align: "left", // left | center
  fullBleed: false,
});

function render(cfg = {}) {
  const {
    html = "",
    maxWidth = 820,
    padY = 48,
    bg = "#ffffff",
    fg = "#1f2937",
    accent = "#E01839",
    align = "left",
    fullBleed = false,
  } = cfg;
  const uid = cfg.uid || makeUid();
  const cls = `ns-richtext-${uid}`;

  const css = `
${baseReset(cls)}
.${cls}{background:${bg};color:${fg};padding:${Number(padY) || 0}px 24px}
.${cls}-inner{max-width:${Number(maxWidth) || 820}px;margin:0 auto;text-align:${align === "center" ? "center" : "left"}}
.${cls} h1{font-size:clamp(28px,4vw,44px);font-weight:700;letter-spacing:-0.01em;line-height:1.15;margin:0 0 18px}
.${cls} h2{font-size:clamp(22px,3vw,32px);font-weight:600;letter-spacing:-0.01em;line-height:1.2;margin:24px 0 14px}
.${cls} h3{font-size:18px;font-weight:600;letter-spacing:0;line-height:1.3;margin:18px 0 10px}
.${cls} p{font-size:16px;line-height:1.65;margin:0 0 14px}
.${cls} strong{font-weight:600}
.${cls} em{font-style:italic}
.${cls} a{color:${accent};text-decoration:underline;text-underline-offset:2px}
.${cls} a:hover{opacity:.8}
.${cls} ul,.${cls} ol{margin:0 0 14px 0;padding-left:22px${align === "center" ? ";text-align:left;display:inline-block" : ""}}
.${cls} ul{list-style:disc!important}
.${cls} ol{list-style:decimal!important}
.${cls} li{margin:0 0 6px;line-height:1.6}
.${cls} > :first-child,.${cls}-inner > :first-child{margin-top:0}
.${cls} > :last-child,.${cls}-inner > :last-child{margin-bottom:0}
`.trim();

  // Note: html here comes from tiptap's getHTML() which produces well-formed,
  // safe markup restricted to our allowed schema (h1-h3, p, ul/ol/li,
  // strong/em, a[href]). We don't need to re-sanitize at render time because
  // the editor enforces schema. For safety we still strip <script> tags.
  const safe = String(html || "").replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  const htmlOut = `<section class="${cls}${fullBleedClass(cfg)}"><div class="${cls}-inner">${safe}</div></section>`;
  return wrapSnippet({ html: htmlOut, css, js: "" });
}

/** Strip only a trailing <style>/<script> tag from another snippet's output.
 *  Used when composing a page so we don't end up with a huge pile of
 *  redundant @import Poppins declarations.
 */
export function stripSnippetFontImport(snippet) {
  return String(snippet).replace(
    new RegExp(`@import url\\("https://fonts.googleapis.com/css2\\?family=Poppins[^"]+"\\);?`, "g"),
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
