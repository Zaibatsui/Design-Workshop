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
  // Block dangerous schemes outright. We allow `data:image/*` because
  // legitimate base64-encoded thumbnails are common and a future "bake"
  // feature relies on them, but block every other `data:` variant —
  // `data:text/html` is the script-execution vector.
  const lower = s.toLowerCase();
  if (/^(javascript|vbscript|file|about|blob)\s*:/.test(lower)) return "";
  if (lower.startsWith("data:") && !/^data:image\//.test(lower)) return "";
  return s;
};

/**
 * Whitelist for CSS colour values. Anything that isn't an obvious colour
 * gets replaced with the fallback. Stops `red"></style><script>` style
 * payloads from escaping a `<style>` block via colour form fields.
 *
 * Accepts: hex (#fff, #ffffff, #ffffff80), rgb/rgba/hsl/hsla, plain
 * named colours / CSS keywords (red, transparent, inherit, currentColor).
 * Anything containing `;`, `<`, `>`, quotes or other CSS-syntax
 * terminators is rejected.
 */
export const safeColor = (c = "", fallback = "#000000") => {
  const s = String(c == null ? "" : c).trim();
  if (!s) return fallback;
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  if (/^(rgb|rgba|hsl|hsla)\(\s*[\d.,\s%/-]+\s*\)$/i.test(s)) return s;
  if (/^[a-zA-Z][a-zA-Z0-9-]{1,30}$/.test(s)) return s; // named colour / keyword
  return fallback;
};

/**
 * Coerce a value to a finite number for safe interpolation into CSS
 * length expressions like `${num(cfg.paddingY)}px`. Defends against
 * corrupt DB records or malicious form submissions injecting CSS via
 * what would otherwise be numeric fields.
 */
export const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Base reset scoped to a section root. Prevents host site bleed
 * (margins, padding, text-indent, list-style, default colors, alignment).
 *
 * Hosts often style `h1/h2/p` with extra padding or text-indent — these
 * leak into our titles and offset them visually. We use `!important` on
 * the highest-risk bleed properties (padding, text-indent, font-family,
 * list-style) because some host stylesheets use `!important` on their
 * resets, and without it we lose. Section-specific CSS uses class
 * selectors of equal/higher specificity (and comes later) so it still
 * wins over this reset.
 */
export function baseReset(cls) {
  return `
.${cls},.${cls} *,.${cls} *::before,.${cls} *::after{box-sizing:border-box}
.${cls}{font-family:"Poppins",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important;line-height:1.5;-webkit-font-smoothing:antialiased;color:#1f2937;text-align:left}
.${cls} h1,.${cls} h2,.${cls} h3,.${cls} h4,.${cls} h5,.${cls} h6{margin:0;padding:0!important;text-indent:0!important;text-transform:none!important;font-style:normal;letter-spacing:normal;text-align:inherit!important;font-family:inherit}
.${cls} p,.${cls} a,.${cls} ul,.${cls} ol,.${cls} li,.${cls} span,.${cls} div{margin:0;padding:0;text-indent:0!important;text-transform:none;font-style:normal;letter-spacing:normal}
.${cls} ul,.${cls} ol{list-style:none!important}
.${cls} a{color:inherit;text-decoration:none}
.${cls} button{font-family:inherit;cursor:pointer;background:none;border:0;padding:0;margin:0;color:inherit;text-align:inherit}
.${cls} img{max-width:100%;display:block;border:0}
.${cls}.is-full{position:relative;width:100vw;max-width:100vw;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw)}
`.trim();
}

/**
 * Returns the className suffix to add to a section root when fullBleed
 * is enabled. Use as: `class="ns-foo ${cls}${fullBleedClass(cfg)}"`.
 */
export function fullBleedClass(cfg) {
  return cfg && cfg.fullBleed ? " is-full" : "";
}

/**
 * Multi-instance-safe IIFE wrapper.
 *
 * IMPORTANT: the "already initialised" marker is a JS property on the root
 * element (`root.__nsInit`), NOT a DOM attribute. CMSs often serialise
 * runtime-set attributes when saving — using a `data-ns-init` attribute
 * caused already-saved sections to skip initialisation on re-edit, killing
 * arrows/dots/autoplay. JS properties don't survive serialisation, so the
 * script will always re-run on a fresh page load.
 *
 * @param scopeClass e.g. "ns-hero-slide-abc123"
 * @param body JS body that uses `root` to refer to the section element.
 */
export function iife(scopeClass, body) {
  return `(function(){var SEL=".${scopeClass}";function init(root){if(root.__nsInit)return;root.__nsInit=true;root.removeAttribute("data-ns-init");${body}}function boot(){document.querySelectorAll(SEL).forEach(init);}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",boot);}else{boot();}})();`;
}

export function wrapSnippet({ html, css, js }) {
  return `${html}\n<style>${FONT_IMPORT}\n${css}</style>\n<script>${js}</script>`;
}

export function previewDoc(snippet) {
  // Editor-only "LIVE" badge: every card with data-ns-src (a fetched product
  // wired up for live price refresh) gets a small ribbon in the editor preview.
  // This style only lives in the editor iframe — copied snippets do NOT include it.
  const editorBadgeCss = `
.ns-card[data-ns-src]{position:relative}
.ns-card[data-ns-src]::after{content:"LIVE";position:absolute;top:8px;left:8px;z-index:5;background:#10b981;color:#fff;font-size:9px;font-weight:700;letter-spacing:.06em;padding:3px 6px;border-radius:3px;line-height:1;font-family:"Poppins",sans-serif;box-shadow:0 1px 2px rgba(0,0,0,.15);pointer-events:none}
`;
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>html,body{margin:0;padding:0;background:#ffffff;font-family:"Poppins",sans-serif}${editorBadgeCss}</style></head><body>${snippet}</body></html>`;
}
