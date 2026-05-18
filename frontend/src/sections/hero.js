/**
 * Hero Carousel — single unified hero with transition switch (slide / fade).
 * Replaces the old hero-slide.js and hero-fade.js.
 */
import { GalleryHorizontalEnd } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  iife,
  makeUid,
  num,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import {
  TextField,
  TextAreaField,
  SliderField,
  ToggleField,
  SelectField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
const ID = "hero";

const defaults = () => ({
  uid: makeUid(),
  transition: "slide",
  theme: {
    ctaBg: "#E01839",
    ctaText: "#ffffff",
    titleColor: "#ffffff",
    subtitleColor: "#f1f5f9",
    overlayColor: "#000000",
    overlayOpacity: 0.4,
    // Split-only fields (applied to every slide that opts into the
    // "split" layout — see slide.layout). Theme is global so a single
    // carousel doesn't visually flicker between two different brand
    // palettes when switching slides. Defaults track DEFAULT_BRAND_KIT
    // secondary/primary; Brand Kit overlays them on new section
    // creation via `applyToHero`.
    panelBgType: "solid", // "solid" | "gradient"
    panelBg: "#1f2937",
    panelGradientFrom: "#E01839",
    panelGradientTo: "#1f2937",
    panelGradientAngle: 135,
  },
  layout: {
    height: 520,
    contentMaxWidth: 1200,
    textAlign: "left",
    borderRadius: 0,
    // Split-only layout (global across all split slides for visual
    // consistency).
    imageSide: "right", // "left" | "right"
    panelRatio: 50, // 40 | 50 | 60 — % width of the panel column
  },
  settings: {
    autoplay: true,
    interval: 4000,
    showArrows: true,
    showDots: true,
  },
  fullBleed: false,
  slides: [
    {
      id: makeUid(),
      logo: "",
      logoAlt: "",
      title: "Tailor-made eCommerce solutions",
      subtitle: "Built for IT and telecom retailers ready to scale online.",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop",
      ctaText: "Book a demo",
      ctaLink: "#",
    },
    {
      id: makeUid(),
      logo: "",
      logoAlt: "",
      title: "Ready in no time",
      subtitle: "Launch your B2B web shop fast — and grow without limits.",
      image:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
      ctaText: "Read more",
      ctaLink: "#",
    },
    {
      id: makeUid(),
      logo: "",
      logoAlt: "",
      title: "Enterprise-grade, customer-first",
      subtitle: "Advanced features for medium and large IT & telecom resellers.",
      image:
        "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop",
      ctaText: "Learn more",
      ctaLink: "#",
    },
  ],
});

// ──────────────────────────────────────────────────────────────────────
// Split-slide helpers.
//
// When `cfg.slideLayout === "split"`, each slide is rendered as a 2-col
// block: image on one side, brand panel on the other. The carousel
// outer mechanics (track + transitions + autoplay + arrows + dots) are
// untouched — only the inner slide markup + extra CSS differs.
//
// Full-bleed alignment trick: when the section sits at 100vw, the panel
// column's OUTER edge gets a calc-based gutter so its inner content
// lines up with where the host site's centred content column would
// start/end. Prevents headings drifting to the far viewport edge on
// wide monitors. Mirrors the standalone Split Banner section's logic.
//
// Panel background resolution:
//   - Per-slide overrides (slide.panelBgType, slide.panelBg, ...) win
//     when set.
//   - Otherwise the section-level theme (cfg.theme.panelBg*) is used.
//   - Applied as INLINE style on the `.ns-panel` element so each slide
//     can carry a different background without proliferating CSS rules.
// ──────────────────────────────────────────────────────────────────────
function slidePanelBackground(slide, cfg) {
  const t = cfg.theme || {};
  // Per-slide override wins if the user picked an explicit type.
  const useSlide = slide.panelBgType === "solid" || slide.panelBgType === "gradient";
  const type = useSlide ? slide.panelBgType : t.panelBgType || "solid";
  if (type === "gradient") {
    const angle = useSlide
      ? num(slide.panelGradientAngle, num(t.panelGradientAngle, 135))
      : num(t.panelGradientAngle, 135);
    const from = useSlide && slide.panelGradientFrom
      ? safeColor(slide.panelGradientFrom, "#E01839")
      : safeColor(t.panelGradientFrom, "#E01839");
    const to = useSlide && slide.panelGradientTo
      ? safeColor(slide.panelGradientTo, "#1f2937")
      : safeColor(t.panelGradientTo, "#1f2937");
    return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
  }
  // Solid
  if (useSlide && slide.panelBg) return safeColor(slide.panelBg, "#1f2937");
  return safeColor(t.panelBg, "#1f2937");
}

// Resolve per-slide CTA button colours. Override fields on the slide
// take precedence; otherwise the section theme is used. Returns an
// inline `style="..."` attribute fragment (with leading space) or "".
function slideCtaStyle(slide, cfg) {
  if (!slide.ctaOverrideColors) return "";
  const t = cfg.theme || {};
  const bg = safeColor(slide.ctaBgColor || t.ctaBg, "#1f2937");
  const fg = safeColor(slide.ctaTextColor || t.ctaText, "#ffffff");
  return ` style="background:${bg};color:${fg}"`;
}

function splitSlideInner(slide, cfg) {
  const imageSide = (cfg.layout || {}).imageSide === "left" ? "left" : "right";
  const logo = safeUrl(slide.logo);
  const bg = safeUrl(slide.image);
  const cta = slide.ctaText && slide.ctaText.trim();
  const link = safeUrl(slide.ctaLink || "#");
  const target = slide.openInSameTab ? "_self" : "_blank";
  const rel = slide.openInSameTab ? "" : ' rel="noopener noreferrer"';

  // Panel sits on the side OPPOSITE to the image.
  const panelSide = imageSide === "left" ? "right" : "left";
  const panelBg = slidePanelBackground(slide, cfg);

  const panelHtml = `<div class="ns-panel is-side-${panelSide}" style="background:${panelBg}">
    <div class="ns-panel-inner">
      ${logo ? `<img class="ns-logo" src="${escAttr(logo)}" alt="${escAttr(slide.logoAlt || "")}"${slide.logoAlt ? "" : ' aria-hidden="true"'} style="max-height:${num(slide.logoMaxHeight, 48)}px"/>` : ""}
      ${slide.title ? `<h2 class="ns-title">${escHtml(slide.title)}</h2>` : ""}
      ${slide.subtitle ? `<p class="ns-subtitle">${escHtml(slide.subtitle)}</p>` : ""}
      ${cta ? `<a class="ns-cta" href="${escAttr(link)}" target="${target}"${rel}${slideCtaStyle(slide, cfg)}>${escHtml(cta)}</a>` : ""}
    </div>
  </div>`;

  const imageHtml = `<div class="ns-image-wrap">${
    bg ? `<img src="${escAttr(bg)}" alt="${escAttr(slide.title || "")}"/>` : ""
  }</div>`;

  return `<div class="ns-split-grid">${imageSide === "left" ? imageHtml + panelHtml : panelHtml + imageHtml}</div>`;
}

function splitCss(cls, cfg) {
  const t = cfg.theme || {};
  const l = cfg.layout || {};
  const imageSide = l.imageSide === "left" ? "left" : "right";
  const ratio = Math.max(30, Math.min(70, num(l.panelRatio, 50)));
  const panelPct = ratio;
  const imagePct = 100 - ratio;
  const contentMax = num(l.contentMaxWidth, 1200);

  const gridCols =
    imageSide === "left"
      ? `${imagePct}% ${panelPct}%`
      : `${panelPct}% ${imagePct}%`;

  // Note: `.ns-panel` background is NOT set here — it's emitted as an
  // inline style on the element itself from `splitSlideInner` so each
  // slide can carry its own background (per-slide override). The
  // section-level theme.panelBg* fields act as the default fallback,
  // applied by `slidePanelBackground(slide, cfg)`.
  //
  // We *intentionally* re-scope inside .ns-slide.is-split so these
  // rules override the standard padding / overlay rules in both
  // renderSlide and renderFade without needing to touch their base CSS
  // strings, AND so non-split slides in the same carousel still get
  // the classic background-image-with-overlay treatment.
  //
  // `align-items:stretch` on the slide is critical — both renderSlide
  // and renderFade set the slide to `display:flex; align-items:center`,
  // which would otherwise vertically centre the inner grid (and at low
  // heights the grid would collapse to its intrinsic content height
  // instead of filling the slide). Stretching the grid makes the image
  // fill the slide edge-to-edge regardless of `height`.
  //
  // Vertical padding intentionally kept low (24px) so split panels
  // remain usable at heights as low as 150px. Horizontal padding stays
  // at 48px for breathing room between content and image.
  return `
.${cls} .ns-slide.is-split{padding:0;background:none;align-items:stretch;display:flex}
.${cls} .ns-slide.is-split .ns-overlay{display:none}
.${cls} .ns-slide.is-split .ns-content{display:none}
.${cls} .ns-slide.is-split .ns-split-grid{display:grid;grid-template-columns:${gridCols};width:100%;height:100%;min-height:100%;align-items:stretch}
.${cls} .ns-slide.is-split .ns-panel{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:24px 48px;overflow:hidden}
.${cls} .ns-slide.is-split .ns-panel-inner{width:100%;max-width:${Math.floor(contentMax / 2)}px}
.${cls} .ns-slide.is-split .ns-panel-inner .ns-logo{display:block;max-height:48px;max-width:190px;margin:0 0 12px;object-fit:contain}
.${cls} .ns-slide.is-split .ns-panel-inner .ns-title{margin:0 0 8px}
.${cls} .ns-slide.is-split .ns-panel-inner .ns-subtitle{margin:0 0 14px}
.${cls} .ns-slide.is-split .ns-image-wrap{position:relative;min-width:0;background:#f7f7f8;overflow:hidden;height:100%}
.${cls} .ns-slide.is-split .ns-image-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.${cls}.is-full .ns-slide.is-split .ns-panel.is-side-left{padding-left:max(20px,calc((100vw - ${contentMax}px) / 2));padding-right:48px}
.${cls}.is-full .ns-slide.is-split .ns-panel.is-side-right{padding-right:max(20px,calc((100vw - ${contentMax}px) / 2));padding-left:48px}
.${cls}.is-full .ns-slide.is-split .ns-panel.is-side-left .ns-panel-inner{margin-left:0;margin-right:auto}
.${cls}.is-full .ns-slide.is-split .ns-panel.is-side-right .ns-panel-inner{margin-left:auto;margin-right:0}
@media (max-width:767px){.${cls} .ns-slide.is-split .ns-split-grid{grid-template-columns:1fr}.${cls} .ns-slide.is-split .ns-image-wrap{order:1;min-height:200px;height:200px}.${cls} .ns-slide.is-split .ns-panel{order:2;padding:24px!important}.${cls} .ns-slide.is-split .ns-panel-inner{max-width:none!important;margin:0!important}}
`.trim();
}

function renderSlide(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-hero-slide-${uid}`;
  const t = cfg.theme;
  const l = cfg.layout;
  const s = cfg.settings;
  const slides = (cfg.slides || []).filter(Boolean);
  // Per-slide layout — back-compat: a slide without an explicit
  // `layout` field inherits the legacy top-level `cfg.slideLayout` if
  // present (last-turn behaviour), otherwise defaults to "standard".
  const slideMode = (slide) =>
    slide.layout || cfg.slideLayout || "standard";
  const anySplit = slides.some((sl) => slideMode(sl) === "split");

  const styleVars = [
    `--ns-cta-bg:${safeColor(t.ctaBg, "#E01839")}`,
    `--ns-cta-text:${safeColor(t.ctaText, "#ffffff")}`,
    `--ns-title:${safeColor(t.titleColor, "#ffffff")}`,
    `--ns-subtitle:${safeColor(t.subtitleColor, "#ffffff")}`,
    `--ns-height:${num(l.height, 520)}px`,
    `--ns-content-max:${num(l.contentMaxWidth, 720)}px`,
  ].join(";");

  const slidesHtml = slides
    .map((slide) => {
      if (slideMode(slide) === "split") {
        return `<div class="ns-slide is-split">${splitSlideInner(slide, cfg)}</div>`;
      }
      const bg = safeUrl(slide.image);
      const logo = safeUrl(slide.logo);
      const cta = slide.ctaText && slide.ctaText.trim();
      const link = safeUrl(slide.ctaLink || "#");
      const target = slide.openInSameTab ? "_self" : "_blank";
      const rel = slide.openInSameTab ? "" : ' rel="noopener noreferrer"';
      return `<div class="ns-slide" style="background-image:url('${escAttr(bg)}')">
      <div class="ns-overlay"></div>
      <div class="ns-content">
        ${logo ? `<img class="ns-logo" src="${escAttr(logo)}" alt="${escAttr(slide.logoAlt || "")}"${slide.logoAlt ? "" : ' aria-hidden="true"'} style="max-height:${num(slide.logoMaxHeight, 48)}px"/>` : ""}
        ${slide.title ? `<h2 class="ns-title">${escHtml(slide.title)}</h2>` : ""}
        ${slide.subtitle ? `<p class="ns-subtitle">${escHtml(slide.subtitle)}</p>` : ""}
        ${cta ? `<a class="ns-cta" href="${escAttr(link)}" target="${target}"${rel}${slideCtaStyle(slide, cfg)}>${escHtml(cta)}</a>` : ""}
      </div>
    </div>`;
    })
    .join("");

  const dotsHtml = s.showDots
    ? `<div class="ns-dots" role="tablist">${slides
        .map(
          (_, i) =>
            `<button class="ns-dot${i === 0 ? " is-active" : ""}" type="button" data-ns-dot="${i}" aria-label="Slide ${i + 1}"></button>`
        )
        .join("")}</div>`
    : "";

  const arrowsHtml = s.showArrows
    ? `<button class="ns-arrow ns-prev" type="button" data-ns-prev aria-label="Previous">‹</button>
<button class="ns-arrow ns-next" type="button" data-ns-next aria-label="Next">›</button>`
    : "";

  const css = `
${baseReset(cls)}
.${cls}{position:relative;width:100%;height:var(--ns-height);overflow:hidden;color:var(--ns-title)}
.${cls} .ns-track{display:flex;height:100%;transition:transform .6s ease;will-change:transform}
.${cls} .ns-slide{flex:0 0 100%;height:100%;background-size:cover;background-position:center;background-repeat:no-repeat;display:flex;align-items:center;padding:48px 56px;position:relative}
.${cls} .ns-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.75) 0%,rgba(0,0,0,.55) 25%,rgba(0,0,0,.25) 50%,rgba(0,0,0,0) 75%);pointer-events:none}
.${cls} .ns-content{position:relative;z-index:2;max-width:var(--ns-content-max);text-align:left}
.${cls} .ns-logo{display:block;max-height:48px;max-width:190px;margin:0 auto 22px 0;object-fit:contain}
.${cls} .ns-title{font-size:${num(cfg.headingSize, 48)}px;font-weight:700;line-height:1.1;letter-spacing:-.02em;color:var(--ns-title);margin:0 0 14px}
.${cls} .ns-subtitle{font-size:clamp(.95rem,1.4vw,1.125rem);line-height:1.5;color:var(--ns-subtitle);margin:0 0 26px;max-width:520px}
.${cls} .ns-cta{display:inline-block;background:var(--ns-cta-bg);color:var(--ns-cta-text);padding:13px 28px;border-radius:${num(cfg.buttonRadius, 8)}px;font-weight:600;transition:transform .15s ease,filter .15s ease}
.${cls} .ns-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}
.${cls} .ns-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.4);color:#fff;font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:5;transition:background .15s ease}
.${cls} .ns-arrow:hover{background:rgba(0,0,0,.6)}
.${cls} .ns-prev{left:16px}
.${cls} .ns-next{right:16px}
.${cls} .ns-dots{position:absolute;bottom:18px;left:0;right:0;display:flex;justify-content:center;gap:10px;z-index:5}
.${cls} .ns-dot{width:10px;height:10px;border-radius:50%;border:1px solid #fff;background:transparent;padding:0;cursor:pointer;transition:background .15s ease}
.${cls} .ns-dot.is-active{background:#fff}
@media (max-width:640px){.${cls} .ns-slide{padding:28px 24px}.${cls} .ns-arrow{width:36px;height:36px}.${cls} .ns-title{font-size:min(${num(cfg.headingSize, 48)}px, 7vw)}}
.${cls}.is-full .ns-slide{padding-left:calc(var(--ns-fb-offset, 0px) + 56px);padding-right:calc(var(--ns-fb-offset, 0px) + 56px)}
@media (max-width:640px){.${cls}.is-full .ns-slide{padding-left:calc(var(--ns-fb-offset, 0px) + 24px);padding-right:calc(var(--ns-fb-offset, 0px) + 24px)}}
${anySplit ? splitCss(cls, cfg) : ""}
`.trim();

  const html = `<section class="ns-hero ${cls}${fullBleedClass(cfg)}" style="${styleVars}" data-ns-autoplay="${s.autoplay ? "1" : "0"}" data-ns-interval="${s.interval}">
  <div class="ns-track" data-ns-track>${slidesHtml}</div>
  ${arrowsHtml}
  ${dotsHtml}
</section>`;

  const js = iife(
    cls,
    `var track=root.querySelector("[data-ns-track]");var dots=root.querySelectorAll(".ns-dot");var prev=root.querySelector("[data-ns-prev]");var next=root.querySelector("[data-ns-next]");if(!track)return;var total=track.children.length;if(!total)return;var current=0;var ap=root.getAttribute("data-ns-autoplay")==="1";var interval=parseInt(root.getAttribute("data-ns-interval"),10)||4000;var timer=null;function go(i){current=(i+total)%total;track.style.transform="translateX(-"+(current*100)+"%)";dots.forEach(function(el,idx){el.classList.toggle("is-active",idx===current);});}function start(){if(!ap||total<2)return;stop();timer=setInterval(function(){go(current+1);},interval);}function stop(){if(timer){clearInterval(timer);timer=null;}}function setOffset(){if(!root.classList.contains("is-full")||!root.parentElement)return;var p=root.parentElement;var pr=p.getBoundingClientRect();var pad=parseFloat(getComputedStyle(p).paddingLeft)||0;var off=pr.left+pad;root.style.setProperty("--ns-fb-offset",(off>0?off:0)+"px");}if(prev)prev.addEventListener("click",function(){go(current-1);start();});if(next)next.addEventListener("click",function(){go(current+1);start();});dots.forEach(function(el,idx){el.addEventListener("click",function(){go(idx);start();});});root.addEventListener("mouseenter",stop);root.addEventListener("mouseleave",start);setOffset();window.addEventListener("resize",setOffset);go(0);start();`
  );

  return wrapSnippet({ html, css, js });
}

function renderFade(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-hero-fade-${uid}`;
  const t = cfg.theme;
  const l = cfg.layout;
  const s = cfg.settings;
  const slides = (cfg.slides || []).filter(Boolean);
  const slideMode = (slide) =>
    slide.layout || cfg.slideLayout || "standard";
  const anySplit = slides.some((sl) => slideMode(sl) === "split");

  const styleVars = [
    `--ns-cta-bg:${safeColor(t.ctaBg, "#E01839")}`,
    `--ns-cta-text:${safeColor(t.ctaText, "#ffffff")}`,
    `--ns-title:${safeColor(t.titleColor, "#ffffff")}`,
    `--ns-subtitle:${safeColor(t.subtitleColor, "#ffffff")}`,
    `--ns-overlay:${safeColor(t.overlayColor, "#000000")}`,
    `--ns-overlay-opacity:${num(t.overlayOpacity, 0.5)}`,
    `--ns-height:${num(l.height, 520)}px`,
    `--ns-content-max:${num(l.contentMaxWidth, 720)}px`,
    `--ns-radius:${num(l.borderRadius, 0)}px`,
    `--ns-text-align:${l.textAlign === "right" || l.textAlign === "center" ? l.textAlign : "left"}`,
  ].join(";");

  const slidesHtml = slides
    .map((slide, i) => {
      if (slideMode(slide) === "split") {
        return `<div class="ns-slide is-split${i === 0 ? " is-active" : ""}" data-ns-slide="${i}">${splitSlideInner(slide, cfg)}</div>`;
      }
      const bg = safeUrl(slide.image);
      const logo = safeUrl(slide.logo);
      const cta = slide.ctaText && slide.ctaText.trim();
      const link = safeUrl(slide.ctaLink || "#");
      const target = slide.openInSameTab ? "_self" : "_blank";
      const rel = slide.openInSameTab ? "" : ' rel="noopener noreferrer"';
      return `<div class="ns-slide${i === 0 ? " is-active" : ""}" data-ns-slide="${i}" style="background-image:url('${escAttr(bg)}')">
      <div class="ns-overlay"></div>
      <div class="ns-content" data-align="${escAttr(l.textAlign)}">
        ${logo ? `<img class="ns-logo" src="${escAttr(logo)}" alt="${escAttr(slide.logoAlt || "")}"${slide.logoAlt ? "" : ' aria-hidden="true"'} style="max-height:${num(slide.logoMaxHeight, 48)}px"/>` : ""}
        ${slide.title ? `<h2 class="ns-title">${escHtml(slide.title)}</h2>` : ""}
        ${slide.subtitle ? `<p class="ns-subtitle">${escHtml(slide.subtitle)}</p>` : ""}
        ${cta ? `<a class="ns-cta" href="${escAttr(link)}" target="${target}"${rel}${slideCtaStyle(slide, cfg)}>${escHtml(cta)}</a>` : ""}
      </div>
    </div>`;
    })
    .join("");

  const dotsHtml = s.showDots
    ? `<div class="ns-dots" role="tablist">${slides
        .map(
          (_, i) =>
            `<button class="ns-dot${i === 0 ? " is-active" : ""}" type="button" data-ns-dot="${i}" aria-label="Slide ${i + 1}"></button>`
        )
        .join("")}</div>`
    : "";

  const arrowsHtml = s.showArrows
    ? `<button class="ns-arrow ns-prev" type="button" data-ns-prev aria-label="Previous">‹</button>
<button class="ns-arrow ns-next" type="button" data-ns-next aria-label="Next">›</button>`
    : "";

  const css = `
${baseReset(cls)}
.${cls}{position:relative;width:100%;height:var(--ns-height);overflow:hidden;border-radius:var(--ns-radius);color:var(--ns-title);isolation:isolate}
.${cls} .ns-slide{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transition:opacity .6s ease;pointer-events:none;display:flex;align-items:center;padding:48px 56px}
.${cls} .ns-slide.is-active{opacity:1;pointer-events:auto;z-index:1}
.${cls} .ns-overlay{position:absolute;inset:0;background:var(--ns-overlay);opacity:var(--ns-overlay-opacity);pointer-events:none}
.${cls} .ns-content{position:relative;z-index:2;max-width:var(--ns-content-max);width:100%;text-align:var(--ns-text-align)}
.${cls} .ns-content[data-align="center"]{margin-left:auto;margin-right:auto}
.${cls} .ns-content[data-align="right"]{margin-left:auto}
.${cls} .ns-logo{max-height:48px;max-width:190px;margin-bottom:20px;object-fit:contain}
.${cls} .ns-content[data-align="center"] .ns-logo{margin-left:auto;margin-right:auto}
.${cls} .ns-title{font-size:${num(cfg.headingSize, 48)}px;font-weight:700;line-height:1.1;color:var(--ns-title);letter-spacing:-.02em;margin:0 0 12px}
.${cls} .ns-subtitle{font-size:clamp(.95rem,1.4vw,1.125rem);line-height:1.5;color:var(--ns-subtitle);max-width:560px;margin:0 0 24px}
.${cls} .ns-content[data-align="center"] .ns-subtitle{margin-left:auto;margin-right:auto}
.${cls} .ns-cta{display:inline-block;background:var(--ns-cta-bg);color:var(--ns-cta-text);padding:13px 28px;border-radius:${num(cfg.buttonRadius, 8)}px;font-weight:600;border:none;transition:transform .15s ease,filter .15s ease}
.${cls} .ns-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}
.${cls} .ns-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:9999px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.32);color:#fff;font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;transition:background .15s ease}
.${cls} .ns-arrow:hover{background:rgba(0,0,0,.55)}
.${cls} .ns-prev{left:16px}
.${cls} .ns-next{right:16px}
.${cls} .ns-dots{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:3}
.${cls} .ns-dot{width:8px;height:8px;padding:0;border-radius:9999px;border:none;background:rgba(255,255,255,.5);cursor:pointer;transition:background .15s ease,width .15s ease}
.${cls} .ns-dot.is-active{background:#fff;width:22px}
@media (max-width:640px){.${cls} .ns-slide{padding:28px 24px}.${cls} .ns-arrow{width:36px;height:36px}.${cls} .ns-title{font-size:min(${num(cfg.headingSize, 48)}px, 7vw)}}
.${cls}.is-full .ns-slide{padding-left:calc(var(--ns-fb-offset, 0px) + 56px);padding-right:calc(var(--ns-fb-offset, 0px) + 56px)}
@media (max-width:640px){.${cls}.is-full .ns-slide{padding-left:calc(var(--ns-fb-offset, 0px) + 24px);padding-right:calc(var(--ns-fb-offset, 0px) + 24px)}}
${anySplit ? splitCss(cls, cfg) : ""}
`.trim();

  const html = `<section class="ns-hero ${cls}${fullBleedClass(cfg)}" style="${styleVars}" data-ns-autoplay="${s.autoplay ? "1" : "0"}" data-ns-interval="${s.interval}">
${slidesHtml}
${arrowsHtml}
${dotsHtml}
</section>`;

  const js = iife(
    cls,
    `var slides=root.querySelectorAll(".ns-slide");var dots=root.querySelectorAll(".ns-dot");var prev=root.querySelector("[data-ns-prev]");var next=root.querySelector("[data-ns-next]");var current=0;var total=slides.length;if(!total)return;var ap=root.getAttribute("data-ns-autoplay")==="1";var interval=parseInt(root.getAttribute("data-ns-interval"),10)||5000;var timer=null;function go(i){current=(i+total)%total;slides.forEach(function(el,idx){el.classList.toggle("is-active",idx===current);});dots.forEach(function(el,idx){el.classList.toggle("is-active",idx===current);});}function start(){if(!ap||total<2)return;stop();timer=setInterval(function(){go(current+1);},interval);}function stop(){if(timer){clearInterval(timer);timer=null;}}function setOffset(){if(!root.classList.contains("is-full")||!root.parentElement)return;var p=root.parentElement;var pr=p.getBoundingClientRect();var pad=parseFloat(getComputedStyle(p).paddingLeft)||0;var off=pr.left+pad;root.style.setProperty("--ns-fb-offset",(off>0?off:0)+"px");}if(prev)prev.addEventListener("click",function(){go(current-1);start();});if(next)next.addEventListener("click",function(){go(current+1);start();});dots.forEach(function(el,idx){el.addEventListener("click",function(){go(idx);start();});});root.addEventListener("mouseenter",stop);root.addEventListener("mouseleave",start);setOffset();window.addEventListener("resize",setOffset);go(0);start();`
  );

  return wrapSnippet({ html, css, js });
}

function render(cfg) {
  return cfg.transition === "fade" ? renderFade(cfg) : renderSlide(cfg);
}

function FormPanel({ config, onUpdate }) {
  const t = config.theme;
  const l = config.layout;
  const s = config.settings;
  const setTheme = (p) => onUpdate({ theme: { ...t, ...p } });
  const setLayout = (p) => onUpdate({ layout: { ...l, ...p } });
  const setSettings = (p) => onUpdate({ settings: { ...s, ...p } });

  const addSlide = () => {
    onUpdate({
      slides: [
        ...config.slides,
        {
          id: makeUid(),
          title: "New Slide",
          subtitle: "Subtitle",
          image: "",
          logo: "",
          logoAlt: "",
          ctaText: "Shop now",
          ctaLink: "#",
        },
      ],
    });
  };
  const removeSlide = (id) =>
    onUpdate({ slides: config.slides.filter((x) => x.id !== id) });
  const moveSlide = (id, dir) => {
    const idx = config.slides.findIndex((x) => x.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= config.slides.length) return;
    const arr = [...config.slides];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    onUpdate({ slides: arr });
  };
  const updateSlide = (id, patch) =>
    onUpdate({
      slides: config.slides.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });

  const isFade = config.transition === "fade";
  // "Any slide split" controls visibility of the global split-only
  // theme + layout controls (panel colours, imageSide, panelRatio).
  // Per-slide layout selection lives inside each slide's form so a
  // single carousel can mix standard + split slides.
  const slideMode = (s) => s.layout || config.slideLayout || "standard";
  const anySplit = (config.slides || []).some((s) => slideMode(s) === "split");

  return (
    <FormAccordion sectionType="hero">
      <Group title="Section">
        <SelectField
          label="Transition"
          value={config.transition}
          onChange={(v) => onUpdate({ transition: v })}
          options={[
            { value: "slide", label: "Slide" },
            { value: "fade", label: "Fade" },
          ]}
          testid="hero-transition"
        />
        <SliderField
          label="Slide title size"
          value={Number(config.headingSize) || 48}
          min={24}
          max={96}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="hero-heading-size"
        />
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="hero-full-bleed"
        />
      </Group>

      <Group title={`Slides (${config.slides.length})`}>
        <ListEditor
          items={config.slides}
          onAdd={addSlide}
          onRemove={removeSlide}
          onMove={moveSlide}
          addLabel="Add slide"
          testidPrefix="hero-slide"
          renderRow={(slide, i) => (
            <div className="flex items-center gap-2">
              <div className="w-10 h-7 rounded-sm bg-slate-100 flex-shrink-0 overflow-hidden">
                {slide.image && (
                  <img
                    src={slide.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">
                {slide.title || `Slide ${i + 1}`}
              </p>
            </div>
          )}
          renderForm={(slide) => (
            <>
              <SelectField
                label="Layout"
                value={slide.layout || "standard"}
                onChange={(v) => updateSlide(slide.id, { layout: v })}
                options={[
                  {
                    value: "standard",
                    label: "Standard (background image + overlay)",
                  },
                  {
                    value: "split",
                    label: "Split panel (image + coloured panel)",
                  },
                ]}
                testid={`hero-slide-layout-${slide.id}`}
              />
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {slide.layout === "split" ? "Image" : "Background"}
                </Label>
                <ImageUpload
                  value={slide.image}
                  onChange={(v) => updateSlide(slide.id, { image: v })}
                  testid={`hero-slide-image-${slide.id}`}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Logo (optional)
                </Label>
                <ImageUpload
                  value={slide.logo}
                  onChange={(v) => updateSlide(slide.id, { logo: v })}
                  testid={`hero-slide-logo-${slide.id}`}
                  compact
                />
              </div>
              {slide.logo ? (
                <>
                  <TextField
                    label="Logo alt text (optional)"
                    value={slide.logoAlt || ""}
                    onChange={(v) => updateSlide(slide.id, { logoAlt: v })}
                    placeholder="Leave blank if purely decorative"
                    testid={`hero-slide-logo-alt-${slide.id}`}
                  />
                  <SliderField
                    label="Logo size"
                    value={Number(slide.logoMaxHeight) || 48}
                    min={20}
                    max={140}
                    suffix="px max-height"
                    onChange={(v) => updateSlide(slide.id, { logoMaxHeight: v })}
                    testid={`hero-slide-logo-size-${slide.id}`}
                  />
                </>
              ) : null}
              <TextField
                label="Title"
                value={slide.title}
                onChange={(v) => updateSlide(slide.id, { title: v })}
                testid={`hero-slide-title-${slide.id}`}
              />
              <TextAreaField
                label="Subtitle"
                value={slide.subtitle}
                onChange={(v) => updateSlide(slide.id, { subtitle: v })}
                testid={`hero-slide-subtitle-${slide.id}`}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="CTA text"
                  value={slide.ctaText}
                  onChange={(v) => updateSlide(slide.id, { ctaText: v })}
                  testid={`hero-slide-cta-text-${slide.id}`}
                />
                <TextField
                  label="CTA link"
                  value={slide.ctaLink}
                  onChange={(v) => updateSlide(slide.id, { ctaLink: v })}
                  testid={`hero-slide-cta-link-${slide.id}`}
                />
              </div>
              <ToggleField
                label="Open in same tab"
                checked={slide.openInSameTab}
                onChange={(v) => updateSlide(slide.id, { openInSameTab: v })}
                testid={`hero-slide-same-tab-${slide.id}`}
              />

              {slide.ctaText ? (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Button colour override (this slide only)
                  </p>
                  <ToggleField
                    label="Override button colours"
                    checked={!!slide.ctaOverrideColors}
                    onChange={(v) => {
                      const patch = { ctaOverrideColors: v };
                      // Seed override fields with the section theme on first
                      // enable so the ColorFields show a starting hex.
                      if (v && !slide.ctaBgColor) {
                        patch.ctaBgColor = t.ctaBg || "#1f2937";
                      }
                      if (v && !slide.ctaTextColor) {
                        patch.ctaTextColor = t.ctaText || "#ffffff";
                      }
                      updateSlide(slide.id, patch);
                    }}
                    testid={`hero-slide-cta-override-${slide.id}`}
                  />
                  {slide.ctaOverrideColors && (
                    <>
                      <ColorField
                        label="Button background"
                        value={slide.ctaBgColor || t.ctaBg || "#1f2937"}
                        onChange={(v) => updateSlide(slide.id, { ctaBgColor: v })}
                        testid={`hero-slide-cta-bg-${slide.id}`}
                      />
                      <ColorField
                        label="Button text"
                        value={slide.ctaTextColor || t.ctaText || "#ffffff"}
                        onChange={(v) => updateSlide(slide.id, { ctaTextColor: v })}
                        testid={`hero-slide-cta-text-color-${slide.id}`}
                      />
                    </>
                  )}
                </div>
              ) : null}

              {slideMode(slide) === "split" && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Panel design override (this slide only)
                  </p>
                  <p className="text-[11px] text-slate-500 mb-2 leading-snug">
                    Leave at "Inherit" to use the section's "Split panel
                    design" defaults. Pick a type here to override just
                    this slide's panel.
                  </p>
                  <SelectField
                    label="Background type"
                    value={slide.panelBgType || ""}
                    onChange={(v) => {
                      const patch = { panelBgType: v };
                      // Seed override fields with the section's current
                      // theme values the first time the user enables this
                      // override — so the ColorField shows a starting hex
                      // instead of a blank swatch. Existing values are
                      // preserved.
                      if (v === "solid" && !slide.panelBg) {
                        patch.panelBg = t.panelBg || "#1f2937";
                      }
                      if (v === "gradient") {
                        if (!slide.panelGradientFrom)
                          patch.panelGradientFrom = t.panelGradientFrom || "#E01839";
                        if (!slide.panelGradientTo)
                          patch.panelGradientTo = t.panelGradientTo || "#1f2937";
                        if (!slide.panelGradientAngle)
                          patch.panelGradientAngle = t.panelGradientAngle || 135;
                      }
                      updateSlide(slide.id, patch);
                    }}
                    options={[
                      { value: "", label: "Inherit from section" },
                      { value: "solid", label: "Solid color" },
                      { value: "gradient", label: "Gradient" },
                    ]}
                    testid={`hero-slide-panel-bg-type-${slide.id}`}
                  />
                  {slide.panelBgType === "solid" && (
                    <ColorField
                      label="Panel color"
                      value={slide.panelBg || t.panelBg || "#1f2937"}
                      onChange={(v) => updateSlide(slide.id, { panelBg: v })}
                      testid={`hero-slide-panel-bg-${slide.id}`}
                    />
                  )}
                  {slide.panelBgType === "gradient" && (
                    <>
                      <ColorField
                        label="Gradient from"
                        value={slide.panelGradientFrom || t.panelGradientFrom || "#E01839"}
                        onChange={(v) =>
                          updateSlide(slide.id, { panelGradientFrom: v })
                        }
                        testid={`hero-slide-panel-grad-from-${slide.id}`}
                      />
                      <ColorField
                        label="Gradient to"
                        value={slide.panelGradientTo || t.panelGradientTo || "#1f2937"}
                        onChange={(v) =>
                          updateSlide(slide.id, { panelGradientTo: v })
                        }
                        testid={`hero-slide-panel-grad-to-${slide.id}`}
                      />
                      <SliderField
                        label="Gradient angle"
                        value={
                          Number(slide.panelGradientAngle) ||
                          Number(t.panelGradientAngle) ||
                          135
                        }
                        min={0}
                        max={360}
                        step={5}
                        suffix="°"
                        onChange={(v) =>
                          updateSlide(slide.id, { panelGradientAngle: v })
                        }
                        testid={`hero-slide-panel-grad-angle-${slide.id}`}
                      />
                    </>
                  )}
                </div>
              )}
            </>
          )}
        />
      </Group>

      <Group title="Theme">
        <ColorField
          label="Title color"
          value={t.titleColor}
          onChange={(v) => setTheme({ titleColor: v })}
          testid="hero-title-color"
        />
        <ColorField
          label="Subtitle color"
          value={t.subtitleColor}
          onChange={(v) => setTheme({ subtitleColor: v })}
          testid="hero-subtitle-color"
        />
        <ColorField
          label="Button bg"
          value={t.ctaBg}
          onChange={(v) => setTheme({ ctaBg: v })}
          testid="hero-cta-bg"
        />
        <ColorField
          label="Button text"
          value={t.ctaText}
          onChange={(v) => setTheme({ ctaText: v })}
          testid="hero-cta-text"
        />
        {isFade && (
          <>
            <ColorField
              label="Overlay color"
              value={t.overlayColor}
              onChange={(v) => setTheme({ overlayColor: v })}
              testid="hero-overlay-color"
            />
            <SliderField
              label="Overlay opacity"
              value={Math.round(t.overlayOpacity * 100)}
              min={0}
              max={100}
              suffix="%"
              onChange={(v) => setTheme({ overlayOpacity: v / 100 })}
              testid="hero-overlay-opacity"
            />
          </>
        )}
      </Group>

      <Group title="Layout">
        {isFade && (
          <SelectField
            label="Text alignment"
            value={l.textAlign}
            onChange={(v) => setLayout({ textAlign: v })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            testid="hero-text-align"
          />
        )}
        <SliderField
          label="Height"
          value={l.height}
          min={150}
          max={800}
          step={10}
          suffix="px"
          onChange={(v) => setLayout({ height: v })}
          testid="hero-height"
        />
        <SliderField
          label="Content max width"
          value={l.contentMaxWidth}
          min={320}
          max={1440}
          step={10}
          suffix="px"
          onChange={(v) => setLayout({ contentMaxWidth: v })}
          testid="hero-content-max"
        />
        {!l.fullBleed && (
          <SliderField
            label="Border radius"
            value={l.borderRadius}
            min={0}
            max={32}
            suffix="px"
            onChange={(v) => setLayout({ borderRadius: v })}
            testid="hero-radius"
          />
        )}
      </Group>

      {/* Split panel design — only rendered when at least one slide is
        * marked "split". Groups the 6 controls that ONLY affect split
        * slides so they're not mistaken for global hero settings. The
        * settings still apply globally to every split slide (rather
        * than per-slide) for visual consistency across the carousel.
        */}
      {anySplit && (
        <Group title="Split panel design">
          <p
            className="text-xs text-slate-500 -mt-1 mb-1 leading-snug"
            data-testid="hero-split-panel-help"
          >
            Applies to every slide set to <strong>Split panel</strong>{" "}
            layout. Standard slides ignore these settings.
          </p>
          <SelectField
            label="Image side"
            value={l.imageSide || "right"}
            onChange={(v) => setLayout({ imageSide: v })}
            options={[
              { value: "right", label: "Image right of text" },
              { value: "left", label: "Image left of text" },
            ]}
            testid="hero-image-side"
          />
          <SelectField
            label="Panel width"
            value={String(l.panelRatio || 50)}
            onChange={(v) => setLayout({ panelRatio: Number(v) })}
            options={[
              { value: "40", label: "40% — image dominant" },
              { value: "50", label: "50% — balanced" },
              { value: "60", label: "60% — text dominant" },
            ]}
            testid="hero-panel-ratio"
          />
          <SelectField
            label="Panel background"
            value={t.panelBgType || "solid"}
            onChange={(v) => setTheme({ panelBgType: v })}
            options={[
              { value: "solid", label: "Solid colour" },
              { value: "gradient", label: "Linear gradient" },
            ]}
            testid="hero-panel-bg-type"
          />
          {(t.panelBgType || "solid") === "gradient" ? (
            <>
              <ColorField
                label="Gradient from"
                value={t.panelGradientFrom}
                onChange={(v) => setTheme({ panelGradientFrom: v })}
                testid="hero-panel-grad-from"
              />
              <ColorField
                label="Gradient to"
                value={t.panelGradientTo}
                onChange={(v) => setTheme({ panelGradientTo: v })}
                testid="hero-panel-grad-to"
              />
              <SliderField
                label="Gradient angle"
                value={t.panelGradientAngle ?? 135}
                min={0}
                max={360}
                step={5}
                suffix="°"
                onChange={(v) => setTheme({ panelGradientAngle: v })}
                testid="hero-panel-grad-angle"
              />
            </>
          ) : (
            <ColorField
              label="Panel colour"
              value={t.panelBg}
              onChange={(v) => setTheme({ panelBg: v })}
              testid="hero-panel-bg"
            />
          )}
        </Group>
      )}

      {/* Carousel controls — only relevant with 2+ slides. Single-slide
        * heroes never auto-advance and have nothing to flip between, so
        * the autoplay / arrows / dots controls would just be noise. */}
      {config.slides.length > 1 && (
        <Group title="Carousel">
          <p
            className="text-xs text-slate-500 -mt-1 mb-1 leading-snug"
            data-testid="hero-carousel-help"
          >
            Applies to the slideshow as a whole — not to individual slides.
          </p>
          <ToggleField
            label="Autoplay"
            checked={s.autoplay}
            onChange={(v) => setSettings({ autoplay: v })}
            testid="hero-autoplay"
          />
          <SliderField
            label="Interval"
            value={s.interval}
            min={2000}
            max={12000}
            step={500}
            suffix="ms"
            onChange={(v) => setSettings({ interval: v })}
            testid="hero-interval"
            disabled={!s.autoplay}
          />
          <ToggleField
            label="Arrows"
            checked={s.showArrows}
            onChange={(v) => setSettings({ showArrows: v })}
            testid="hero-arrows"
          />
          <ToggleField
            label="Dots"
            checked={s.showDots}
            onChange={(v) => setSettings({ showDots: v })}
            testid="hero-dots"
          />
        </Group>
      )}
    </FormAccordion>
  );
}

export const hero = {
  id: ID,
  name: "Hero",
  description: "Full-width slideshow — slide or fade transition",
  icon: GalleryHorizontalEnd,
  defaults,
  render,
  FormPanel,
};
