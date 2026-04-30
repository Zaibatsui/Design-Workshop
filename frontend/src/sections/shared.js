/**
 * Shared helpers for every section renderer.
 * Each section produces a self-contained snippet:
 *   <section class="ns-<id> ns-<id>-<uid>" ...>...</section>
 *   <style>@import Poppins; scoped CSS; base reset</style>
 *   <script>(function(){ multi-instance init })();</script>
 */

export const FONT_IMPORT =
  `@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");`;

export function makeUid() {
  return Math.random().toString(36).slice(2, 8);
}

export const escAttr = (s = "") =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const escHtml = (s = "") =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const safeUrl = (u = "") => {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^javascript:/i.test(s)) return "";
  return s;
};

/**
 * Base reset scoped to a section root. Prevents host site bleed
 * (margins, line-height, list-style, default colors).
 */
export function baseReset(cls) {
  return `
.${cls},.${cls} *,.${cls} *::before,.${cls} *::after{box-sizing:border-box}
.${cls}{font-family:"Poppins",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased;color:#1f2937}
.${cls} h1,.${cls} h2,.${cls} h3,.${cls} h4,.${cls} p{margin:0}
.${cls} ul,.${cls} ol{margin:0;padding:0;list-style:none}
.${cls} a{color:inherit;text-decoration:none}
.${cls} button{font-family:inherit;cursor:pointer}
.${cls} img{max-width:100%;display:block}
`.trim();
}

/**
 * Multi-instance-safe IIFE wrapper.
 * @param scopeClass e.g. "ns-hero-slide-abc123"
 * @param body JS body that uses `root` to refer to the section element.
 */
export function iife(scopeClass, body) {
  return `(function(){var SEL=".${scopeClass}";function init(root){if(root.getAttribute("data-ns-init"))return;root.setAttribute("data-ns-init","1");${body}}function boot(){document.querySelectorAll(SEL).forEach(init);}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",boot);}else{boot();}})();`;
}

export function wrapSnippet({ html, css, js }) {
  return `${html}\n<style>${FONT_IMPORT}\n${css}</style>\n<script>${js}</script>`;
}

export function previewDoc(snippet) {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>html,body{margin:0;padding:0;background:#ffffff;font-family:"Poppins",sans-serif}</style></head><body>${snippet}</body></html>`;
}
