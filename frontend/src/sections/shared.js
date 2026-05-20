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

/**
 * Footer link — small "View all →" / "Sign in to continue →" inline link
 * shipped under section content (CTA buttons, grids of cards/logos, etc.).
 * Always-optional: returns "" if no label or href is set, so omitting it
 * collapses cleanly.
 *
 * Markup:
 *   <p class="ns-footer-link"><span class="ns-fl-prefix">…</span>
 *     <a class="ns-fl-a" href="…"><span>label</span>
 *       <span aria-hidden="true">→</span></a></p>
 *
 * @param cfg     section config object containing `footerLink: { prefix, label, href, openInNewTab }`
 * @param align   "left" | "center" | "right" — defaults to "center"
 */
export function footerLinkHtml(cfg, align = "center") {
  const fl = cfg && cfg.footerLink;
  if (!fl) return "";
  const label = (fl.label || "").trim();
  const href = safeUrl(fl.href || "");
  if (!label || !href) return "";
  const prefix = (fl.prefix || "").trim();
  const target = fl.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
  const alignClass =
    align === "left" ? " ns-fl-left" : align === "right" ? " ns-fl-right" : "";
  const prefixHtml = prefix ? `<span class="ns-fl-prefix">${escHtml(prefix)} </span>` : "";
  return `<p class="ns-footer-link${alignClass}">${prefixHtml}<a class="ns-fl-a" href="${escAttr(href)}"${target}><span>${escHtml(label)}</span><span class="ns-fl-arrow" aria-hidden="true">→</span></a></p>`;
}

/**
 * Footer-link CSS scoped to `cls`. Pair with `footerLinkHtml(cfg, align)`
 * inside any section that wants the affordance. Picks up the section's
 * own accent colour rather than hard-coding one.
 *
 * @param prefixColor optional override for the leading prefix text
 *   (defaults to slate-500 which works on light backgrounds; pass a
 *   lighter colour like the section's `bodyColor` for dark backgrounds).
 */
export function footerLinkCss(cls, accentColor = "#E01839", prefixColor = "#64748b") {
  const accent = safeColor(accentColor, "#E01839");
  const prefix = safeColor(prefixColor, "#64748b");
  return `
.${cls} .ns-footer-link{margin-top:28px;font-size:15px;line-height:1.5;text-align:center;color:${prefix}}
.${cls} .ns-footer-link.ns-fl-left{text-align:left}
.${cls} .ns-footer-link.ns-fl-right{text-align:right}
.${cls} .ns-fl-prefix{color:inherit;margin-right:2px}
.${cls} .ns-fl-a{color:${accent};font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:gap .18s ease,opacity .18s ease}
.${cls} .ns-fl-a:hover{opacity:.85;gap:10px;text-decoration:underline}
.${cls} .ns-fl-arrow{display:inline-block;transition:transform .18s ease}
`.trim();
}

export function previewDoc(snippet, opts) {
  // Editor-only "LIVE" badge: every card with data-ns-src (a fetched product
  // wired up for live price refresh) gets a small ribbon in the editor preview.
  // This style only lives in the editor iframe — copied snippets do NOT include it.
  const editorBadgeCss = `
.ns-card[data-ns-src]{position:relative}
.ns-card[data-ns-src]::after{content:"LIVE";position:absolute;top:8px;left:8px;z-index:5;background:#10b981;color:#fff;font-size:9px;font-weight:700;letter-spacing:.06em;padding:3px 6px;border-radius:3px;line-height:1;font-family:"Poppins",sans-serif;box-shadow:0 1px 2px rgba(0,0,0,.15);pointer-events:none}
`;
  // Editor-only VAT preview pill (Product Carousel sections / pages). Lets
  // the editor verify how the host store's VAT toggle will affect prices
  // without having to embed the snippet on a real Nettailer page. It
  // mutates a `.vat-switcher-label` element which the snippet's own
  // MutationObserver already listens for, so prices repaint from the
  // pre-warmed localStorage cache instantly when toggled.
  const withVat = !!(opts && opts.withVatToggle);
  const vatToggleHtml = withVat
    ? `<div class="dw-edit-vat-toggle" data-testid="editor-vat-toggle"><button type="button" data-state="excl" title="Editor preview — toggle host VAT view"><span class="dw-vat-dot"></span><span class="vat-switcher-label">Excl VAT</span></button></div>`
    : "";
  const vatToggleCss = withVat
    ? `.dw-edit-vat-toggle{position:fixed;top:10px;right:10px;z-index:9999;font-family:"Poppins",sans-serif}` +
      `.dw-edit-vat-toggle button{background:#0f172a;color:#fff;border:0;padding:6px 12px 6px 10px;border-radius:9999px;font-size:11px;font-weight:600;letter-spacing:.04em;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 10px rgba(0,0,0,.18);transition:transform .12s ease}` +
      `.dw-edit-vat-toggle button:hover{transform:translateY(-1px)}` +
      `.dw-edit-vat-toggle .dw-vat-dot{width:7px;height:7px;border-radius:50%;background:#10b981;display:inline-block}` +
      `.dw-edit-vat-toggle button[data-state="excl"] .dw-vat-dot{background:#f59e0b}`
    : "";
  const vatToggleJs = withVat
    ? `<script>(function(){function ready(f){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",f);else f();}ready(function(){var b=document.querySelector(".dw-edit-vat-toggle button");if(!b)return;b.addEventListener("click",function(){var l=b.querySelector(".vat-switcher-label");var cur=b.getAttribute("data-state")||"excl";var nx=cur==="incl"?"excl":"incl";b.setAttribute("data-state",nx);if(l)l.textContent=nx==="incl"?"Incl VAT":"Excl VAT";});});})();</script>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>html,body{margin:0;padding:0;background:#ffffff;font-family:"Poppins",sans-serif}${editorBadgeCss}${vatToggleCss}</style></head><body>${vatToggleHtml}${snippet}${vatToggleJs}</body></html>`;
}
