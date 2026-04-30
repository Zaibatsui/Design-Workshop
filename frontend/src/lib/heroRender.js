/**
 * Hero carousel snippet renderer.
 *
 * renderHero(config) -> string
 * Returns a fully self-contained HTML string:
 *   <section class="ns-hero ns-hero-{uid}" data-ns-hero> ... slides ... </section>
 *   <style> /* scoped to .ns-hero-{uid} *\/ </style>
 *   <script> (IIFE that inits all matching uninitialised instances) </script>
 *
 * Multi-instance safe:
 *   - All CSS selectors prefixed with `.ns-hero-{uid}` -> no leakage / no host bleed.
 *   - JS uses `document.querySelectorAll('.ns-hero-{uid}:not([data-ns-init]))`,
 *     marks each `data-ns-init`, and stores per-instance state on the element.
 *   - No global variables; no element IDs.
 */

const escAttr = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const safeUrl = (u = "") => {
  if (!u) return "";
  const s = String(u).trim();
  if (/^javascript:/i.test(s)) return "";
  return s;
};

export const DEFAULT_CONFIG = () => ({
  uid: "abc123",
  theme: {
    primaryColor: "#0f172a",
    primaryText: "#ffffff",
    titleColor: "#ffffff",
    subtitleColor: "#e2e8f0",
    overlayColor: "#000000",
    overlayOpacity: 0.35,
  },
  layout: {
    height: 520,
    textAlign: "left", // left | center | right
    contentMaxWidth: 720,
    borderRadius: 12,
  },
  settings: {
    autoplay: true,
    interval: 5000,
    showArrows: true,
    showDots: true,
  },
  slides: [],
});

export function renderHero(config) {
  const cfg = { ...DEFAULT_CONFIG(), ...config };
  const uid = cfg.uid || Math.random().toString(36).slice(2, 8);
  const cls = `ns-hero-${uid}`;
  const t = cfg.theme;
  const l = cfg.layout;
  const s = cfg.settings;
  const slides = (cfg.slides || []).filter(Boolean);

  // Inline CSS variables on the section so theming is portable.
  const styleVars = [
    `--ns-primary:${t.primaryColor}`,
    `--ns-primary-text:${t.primaryText}`,
    `--ns-title:${t.titleColor}`,
    `--ns-subtitle:${t.subtitleColor}`,
    `--ns-overlay:${t.overlayColor}`,
    `--ns-overlay-opacity:${t.overlayOpacity}`,
    `--ns-height:${l.height}px`,
    `--ns-content-max:${l.contentMaxWidth}px`,
    `--ns-radius:${l.borderRadius}px`,
    `--ns-text-align:${l.textAlign}`,
  ].join(";");

  const slidesHtml = slides
    .map((slide, i) => {
      const bg = safeUrl(slide.image);
      const logo = safeUrl(slide.logo);
      const cta = slide.ctaText && slide.ctaText.trim();
      const link = safeUrl(slide.ctaLink || "#");
      return `
    <div class="ns-slide${i === 0 ? " is-active" : ""}" data-ns-slide="${i}" style="background-image:url('${escAttr(bg)}')">
      <div class="ns-slide-overlay"></div>
      <div class="ns-slide-content">
        ${logo ? `<img class="ns-slide-logo" src="${escAttr(logo)}" alt="" />` : ""}
        ${slide.title ? `<h2 class="ns-slide-title">${escHtml(slide.title)}</h2>` : ""}
        ${slide.subtitle ? `<p class="ns-slide-subtitle">${escHtml(slide.subtitle)}</p>` : ""}
        ${cta ? `<a class="ns-slide-cta" href="${escAttr(link)}" target="_blank" rel="noopener noreferrer">${escHtml(cta)}</a>` : ""}
      </div>
    </div>`;
    })
    .join("");

  const dotsHtml = s.showDots
    ? `<div class="ns-dots" role="tablist" aria-label="Slides">${slides
        .map(
          (_, i) =>
            `<button class="ns-dot${i === 0 ? " is-active" : ""}" type="button" data-ns-dot="${i}" aria-label="Slide ${i + 1}"></button>`
        )
        .join("")}</div>`
    : "";

  const arrowsHtml = s.showArrows
    ? `
    <button class="ns-arrow ns-arrow-prev" type="button" data-ns-prev aria-label="Previous slide">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <button class="ns-arrow ns-arrow-next" type="button" data-ns-next aria-label="Next slide">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`
    : "";

  const css = `
.${cls}{position:relative;width:100%;height:var(--ns-height);overflow:hidden;border-radius:var(--ns-radius);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ns-title);box-sizing:border-box;isolation:isolate}
.${cls} *,.${cls} *::before,.${cls} *::after{box-sizing:border-box}
.${cls} .ns-slide{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transition:opacity .6s ease;pointer-events:none;display:flex;align-items:center;padding:48px 56px}
.${cls} .ns-slide.is-active{opacity:1;pointer-events:auto;z-index:1}
.${cls} .ns-slide-overlay{position:absolute;inset:0;background:var(--ns-overlay);opacity:var(--ns-overlay-opacity);pointer-events:none}
.${cls} .ns-slide-content{position:relative;z-index:2;max-width:var(--ns-content-max);width:100%;text-align:var(--ns-text-align);margin-left:0}
.${cls} .ns-slide[data-align="center"] .ns-slide-content,.${cls} .ns-slide-content[data-align="center"]{margin-left:auto;margin-right:auto}
.${cls} .ns-slide-logo{display:block;max-height:48px;max-width:160px;margin-bottom:20px;object-fit:contain}
.${cls} .ns-slide-content[data-align="center"] .ns-slide-logo{margin-left:auto;margin-right:auto}
.${cls} .ns-slide-title{font-size:clamp(1.75rem,3.6vw,3rem);font-weight:700;line-height:1.1;margin:0 0 12px;color:var(--ns-title);letter-spacing:-.02em}
.${cls} .ns-slide-subtitle{font-size:clamp(.95rem,1.4vw,1.125rem);line-height:1.5;margin:0 0 24px;color:var(--ns-subtitle);max-width:560px}
.${cls} .ns-slide-content[data-align="center"] .ns-slide-subtitle{margin-left:auto;margin-right:auto}
.${cls} .ns-slide-cta{display:inline-block;background:var(--ns-primary);color:var(--ns-primary-text);padding:13px 28px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:.95rem;letter-spacing:.01em;transition:transform .15s ease,filter .15s ease;border:none}
.${cls} .ns-slide-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}
.${cls} .ns-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:9999px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.32);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:background .15s ease}
.${cls} .ns-arrow:hover{background:rgba(0,0,0,.55)}
.${cls} .ns-arrow-prev{left:16px}
.${cls} .ns-arrow-next{right:16px}
.${cls} .ns-dots{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:3}
.${cls} .ns-dot{width:8px;height:8px;padding:0;border-radius:9999px;border:none;background:rgba(255,255,255,.5);cursor:pointer;transition:background .15s ease,width .15s ease}
.${cls} .ns-dot.is-active{background:#fff;width:22px}
@media (max-width:640px){.${cls} .ns-slide{padding:28px 24px}.${cls} .ns-arrow{width:36px;height:36px}}
`.trim();

  // Apply text-align via inline data-attribute on slide-content for centered layout
  const alignedSlidesHtml = slidesHtml.replaceAll(
    'class="ns-slide-content"',
    `class="ns-slide-content" data-align="${escAttr(l.textAlign)}"`
  );

  const sectionHtml = `<section class="ns-hero ${cls}" style="${styleVars}" data-ns-hero data-ns-autoplay="${s.autoplay ? "1" : "0"}" data-ns-interval="${s.interval}">
${alignedSlidesHtml}
  ${arrowsHtml}
  ${dotsHtml}
</section>`;

  // Multi-instance safe IIFE. Targets only this scope class + uninitialised.
  const js = `
(function(){
  var SEL = ".${cls}";
  function init(root){
    if(root.getAttribute("data-ns-init")) return;
    root.setAttribute("data-ns-init","1");
    var slides = root.querySelectorAll(".ns-slide");
    var dots = root.querySelectorAll(".ns-dot");
    var prev = root.querySelector("[data-ns-prev]");
    var next = root.querySelector("[data-ns-next]");
    var current = 0;
    var total = slides.length;
    if(total === 0) return;
    var autoplay = root.getAttribute("data-ns-autoplay") === "1";
    var interval = parseInt(root.getAttribute("data-ns-interval"),10) || 5000;
    var timer = null;
    function go(i){
      current = (i + total) % total;
      slides.forEach(function(el,idx){ el.classList.toggle("is-active", idx===current); });
      dots.forEach(function(el,idx){ el.classList.toggle("is-active", idx===current); });
    }
    function nextSlide(){ go(current+1); }
    function prevSlide(){ go(current-1); }
    function start(){ if(!autoplay || total<2) return; stop(); timer = setInterval(nextSlide, interval); }
    function stop(){ if(timer){ clearInterval(timer); timer=null; } }
    if(prev) prev.addEventListener("click", function(){ prevSlide(); start(); });
    if(next) next.addEventListener("click", function(){ nextSlide(); start(); });
    dots.forEach(function(el,idx){ el.addEventListener("click", function(){ go(idx); start(); }); });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    start();
  }
  function boot(){
    document.querySelectorAll(SEL).forEach(function(el){
      if(!el.hasAttribute("data-ns-init")) init(el);
    });
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();`.trim();

  return `${sectionHtml}
<style>${css}</style>
<script>${js}</script>`;
}

/**
 * Build a full standalone HTML document for the iframe preview so the
 * preview EXACTLY matches the snippet output (no inherited styles).
 */
export function renderPreviewDoc(config) {
  const snippet = renderHero(config);
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>html,body{margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,sans-serif}.ns-frame{padding:24px}</style></head><body><div class="ns-frame">${snippet}</div></body></html>`;
}
