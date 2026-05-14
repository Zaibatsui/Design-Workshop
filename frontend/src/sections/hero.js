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
    // Split-panel theme (only used when transition === "split").
    // Panel = the coloured/gradient side that holds logo + headline.
    panelBgType: "gradient", // "solid" | "gradient"
    panelBg: "#0267d7",
    panelGradientFrom: "#0267d7",
    panelGradientTo: "#0b3e80",
    panelGradientAngle: 135,
  },
  layout: {
    height: 520,
    contentMaxWidth: 1200,
    textAlign: "left",
    borderRadius: 0,
    // Split-panel layout (only used when transition === "split").
    imageSide: "right", // "left" | "right"
    panelRatio: 50, // % width given to the panel (40 | 50 | 60)
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

function renderSlide(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-hero-slide-${uid}`;
  const t = cfg.theme;
  const l = cfg.layout;
  const s = cfg.settings;
  const slides = (cfg.slides || []).filter(Boolean);

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
      const bg = safeUrl(slide.image);
      const logo = safeUrl(slide.logo);
      const cta = slide.ctaText && slide.ctaText.trim();
      const link = safeUrl(slide.ctaLink || "#");
      const target = slide.openInSameTab ? "_self" : "_blank";
      const rel = slide.openInSameTab ? "" : ' rel="noopener noreferrer"';
      return `<div class="ns-slide" style="background-image:url('${escAttr(bg)}')">
      <div class="ns-overlay"></div>
      <div class="ns-content">
        ${logo ? `<img class="ns-logo" src="${escAttr(logo)}" alt="${escAttr(slide.logoAlt || "")}"${slide.logoAlt ? "" : ' aria-hidden="true"'}/>` : ""}
        ${slide.title ? `<h2 class="ns-title">${escHtml(slide.title)}</h2>` : ""}
        ${slide.subtitle ? `<p class="ns-subtitle">${escHtml(slide.subtitle)}</p>` : ""}
        ${cta ? `<a class="ns-cta" href="${escAttr(link)}" target="${target}"${rel}>${escHtml(cta)}</a>` : ""}
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
.${cls} .ns-title{font-size:clamp(1.75rem,3.6vw,3.2rem);font-weight:700;line-height:1.1;letter-spacing:-.02em;color:var(--ns-title);margin:0 0 14px}
.${cls} .ns-subtitle{font-size:clamp(.95rem,1.4vw,1.125rem);line-height:1.5;color:var(--ns-subtitle);margin:0 0 26px;max-width:520px}
.${cls} .ns-cta{display:inline-block;background:var(--ns-cta-bg);color:var(--ns-cta-text);padding:13px 28px;border-radius:8px;font-weight:600;transition:transform .15s ease,filter .15s ease}
.${cls} .ns-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}
.${cls} .ns-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.4);color:#fff;font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:5;transition:background .15s ease}
.${cls} .ns-arrow:hover{background:rgba(0,0,0,.6)}
.${cls} .ns-prev{left:16px}
.${cls} .ns-next{right:16px}
.${cls} .ns-dots{position:absolute;bottom:18px;left:0;right:0;display:flex;justify-content:center;gap:10px;z-index:5}
.${cls} .ns-dot{width:10px;height:10px;border-radius:50%;border:1px solid #fff;background:transparent;padding:0;cursor:pointer;transition:background .15s ease}
.${cls} .ns-dot.is-active{background:#fff}
@media (max-width:640px){.${cls} .ns-slide{padding:28px 24px}.${cls} .ns-arrow{width:36px;height:36px}}
.${cls}.is-full .ns-slide{padding-left:calc(var(--ns-fb-offset, 0px) + 56px);padding-right:calc(var(--ns-fb-offset, 0px) + 56px)}
@media (max-width:640px){.${cls}.is-full .ns-slide{padding-left:calc(var(--ns-fb-offset, 0px) + 24px);padding-right:calc(var(--ns-fb-offset, 0px) + 24px)}}
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
      const bg = safeUrl(slide.image);
      const logo = safeUrl(slide.logo);
      const cta = slide.ctaText && slide.ctaText.trim();
      const link = safeUrl(slide.ctaLink || "#");
      const target = slide.openInSameTab ? "_self" : "_blank";
      const rel = slide.openInSameTab ? "" : ' rel="noopener noreferrer"';
      return `<div class="ns-slide${i === 0 ? " is-active" : ""}" data-ns-slide="${i}" style="background-image:url('${escAttr(bg)}')">
      <div class="ns-overlay"></div>
      <div class="ns-content" data-align="${escAttr(l.textAlign)}">
        ${logo ? `<img class="ns-logo" src="${escAttr(logo)}" alt="${escAttr(slide.logoAlt || "")}"${slide.logoAlt ? "" : ' aria-hidden="true"'}/>` : ""}
        ${slide.title ? `<h2 class="ns-title">${escHtml(slide.title)}</h2>` : ""}
        ${slide.subtitle ? `<p class="ns-subtitle">${escHtml(slide.subtitle)}</p>` : ""}
        ${cta ? `<a class="ns-cta" href="${escAttr(link)}" target="${target}"${rel}>${escHtml(cta)}</a>` : ""}
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
.${cls} .ns-title{font-size:clamp(1.75rem,3.6vw,3rem);font-weight:700;line-height:1.1;color:var(--ns-title);letter-spacing:-.02em;margin:0 0 12px}
.${cls} .ns-subtitle{font-size:clamp(.95rem,1.4vw,1.125rem);line-height:1.5;color:var(--ns-subtitle);max-width:560px;margin:0 0 24px}
.${cls} .ns-content[data-align="center"] .ns-subtitle{margin-left:auto;margin-right:auto}
.${cls} .ns-cta{display:inline-block;background:var(--ns-cta-bg);color:var(--ns-cta-text);padding:13px 28px;border-radius:9999px;font-weight:600;border:none;transition:transform .15s ease,filter .15s ease}
.${cls} .ns-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}
.${cls} .ns-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:9999px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.32);color:#fff;font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;transition:background .15s ease}
.${cls} .ns-arrow:hover{background:rgba(0,0,0,.55)}
.${cls} .ns-prev{left:16px}
.${cls} .ns-next{right:16px}
.${cls} .ns-dots{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:3}
.${cls} .ns-dot{width:8px;height:8px;padding:0;border-radius:9999px;border:none;background:rgba(255,255,255,.5);cursor:pointer;transition:background .15s ease,width .15s ease}
.${cls} .ns-dot.is-active{background:#fff;width:22px}
@media (max-width:640px){.${cls} .ns-slide{padding:28px 24px}.${cls} .ns-arrow{width:36px;height:36px}}
.${cls}.is-full .ns-slide{padding-left:calc(var(--ns-fb-offset, 0px) + 56px);padding-right:calc(var(--ns-fb-offset, 0px) + 56px)}
@media (max-width:640px){.${cls}.is-full .ns-slide{padding-left:calc(var(--ns-fb-offset, 0px) + 24px);padding-right:calc(var(--ns-fb-offset, 0px) + 24px)}}
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

function renderSplit(cfg) {
  // Split panel layout (Philips-style 50/50 brand banner). No carousel —
  // uses slides[0] only. Multi-slide split would add cognitive load
  // without a clear win; users can stack two hero sections for that.
  const uid = cfg.uid || makeUid();
  const cls = `ns-hero-split-${uid}`;
  const t = cfg.theme || {};
  const l = cfg.layout || {};
  const slide = (cfg.slides || [])[0] || {};

  const imageSide = l.imageSide === "left" ? "left" : "right";
  const ratio = Math.max(30, Math.min(70, num(l.panelRatio, 50)));
  const panelPct = ratio;
  const imagePct = 100 - ratio;
  const height = num(l.height, 420);

  const panelBg =
    t.panelBgType === "solid"
      ? safeColor(t.panelBg, "#0267d7")
      : `linear-gradient(${num(t.panelGradientAngle, 135)}deg, ${safeColor(
          t.panelGradientFrom,
          "#0267d7"
        )} 0%, ${safeColor(t.panelGradientTo, "#0b3e80")} 100%)`;

  const logo = safeUrl(slide.logo);
  const bg = safeUrl(slide.image);
  const cta = slide.ctaText && slide.ctaText.trim();
  const link = safeUrl(slide.ctaLink || "#");
  const target = slide.openInSameTab ? "_self" : "_blank";
  const rel = slide.openInSameTab ? "" : ' rel="noopener noreferrer"';

  // Grid columns: panel + image, swapped via order when image is on the left.
  const gridCols =
    imageSide === "left"
      ? `${imagePct}% ${panelPct}%`
      : `${panelPct}% ${imagePct}%`;

  const panelHtml = `<div class="ns-panel">
  <div class="ns-panel-inner">
    ${logo ? `<img class="ns-logo" src="${escAttr(logo)}" alt="${escAttr(slide.logoAlt || "")}"${slide.logoAlt ? "" : ' aria-hidden="true"'}/>` : ""}
    ${slide.title ? `<h2 class="ns-title">${escHtml(slide.title)}</h2>` : ""}
    ${slide.subtitle ? `<p class="ns-subtitle">${escHtml(slide.subtitle)}</p>` : ""}
    ${cta ? `<a class="ns-cta" href="${escAttr(link)}" target="${target}"${rel}>${escHtml(cta)}</a>` : ""}
  </div>
</div>`;

  const imageHtml = `<div class="ns-image-wrap">${
    bg ? `<img src="${escAttr(bg)}" alt="${escAttr(slide.title || "")}"/>` : ""
  }</div>`;

  const html = `<section class="ns-hero ${cls}${fullBleedClass(cfg)}">
  <div class="ns-grid">
    ${imageSide === "left" ? imageHtml + panelHtml : panelHtml + imageHtml}
  </div>
</section>`;

  const css = `
${baseReset(cls)}
.${cls}{position:relative;width:100%;overflow:hidden;background:#fff}
.${cls} .ns-grid{display:grid;grid-template-columns:${gridCols};min-height:${height}px;align-items:stretch}
.${cls} .ns-panel{background:${panelBg};color:${safeColor(t.titleColor, "#ffffff")};display:flex;flex-direction:column;justify-content:center;align-items:flex-start;min-width:0;padding:48px 56px}
.${cls} .ns-panel-inner{width:100%;max-width:600px}
.${cls} .ns-logo{display:block;max-height:64px;max-width:200px;margin:0 0 22px;object-fit:contain}
.${cls} .ns-title{font-size:clamp(1.75rem,3.4vw,2.6rem);font-weight:700;line-height:1.1;letter-spacing:-.02em;color:${safeColor(t.titleColor, "#ffffff")};margin:0 0 14px}
.${cls} .ns-subtitle{font-size:clamp(.95rem,1.3vw,1.0625rem);line-height:1.55;color:${safeColor(t.subtitleColor, "rgba(255,255,255,0.92)")};margin:0 0 22px;max-width:560px}
.${cls} .ns-cta{display:inline-block;background:${safeColor(t.ctaBg, "#E01839")};color:${safeColor(t.ctaText, "#ffffff")};padding:13px 28px;border-radius:8px;font-weight:600;transition:transform .15s ease,filter .15s ease}
.${cls} .ns-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}
.${cls} .ns-image-wrap{position:relative;min-width:0;background:#f7f7f8;overflow:hidden;min-height:${height}px}
.${cls} .ns-image-wrap img{width:100%;height:100%;object-fit:cover;display:block}
@media (max-width:767px){.${cls} .ns-grid{grid-template-columns:1fr;min-height:auto}.${cls} .ns-image-wrap{order:1;min-height:260px;height:260px}.${cls} .ns-panel{order:2;padding:40px 24px}.${cls} .ns-panel-inner{max-width:none}.${cls} .ns-title{font-size:1.75rem}}
`.trim();

  return wrapSnippet({ html, css, js: "" });
}

function render(cfg) {
  if (cfg.transition === "fade") return renderFade(cfg);
  if (cfg.transition === "split") return renderSplit(cfg);
  return renderSlide(cfg);
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
  const isSplit = config.transition === "split";

  return (
    <div className="space-y-5">
      <Group title="Section">
        <SelectField
          label="Transition"
          value={config.transition}
          onChange={(v) => onUpdate({ transition: v })}
          options={[
            { value: "slide", label: "Slide" },
            { value: "fade", label: "Fade" },
            { value: "split", label: "Split panel (static)" },
          ]}
          testid="hero-transition"
        />
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="hero-full-bleed"
        />
      </Group>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Slides ({config.slides.length})
        </h3>
        {isSplit && config.slides.length > 1 ? (
          <p
            data-testid="hero-split-notice"
            className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2"
          >
            Split panel uses the first slide only. Extra slides are ignored.
          </p>
        ) : null}
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
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Background
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
                <TextField
                  label="Logo alt text (optional)"
                  value={slide.logoAlt || ""}
                  onChange={(v) => updateSlide(slide.id, { logoAlt: v })}
                  placeholder="Leave blank if purely decorative"
                  testid={`hero-slide-logo-alt-${slide.id}`}
                />
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
            </>
          )}
        />
      </div>

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
        {isSplit && (
          <>
            <SelectField
              label="Panel background"
              value={t.panelBgType || "gradient"}
              onChange={(v) => setTheme({ panelBgType: v })}
              options={[
                { value: "solid", label: "Solid colour" },
                { value: "gradient", label: "Linear gradient" },
              ]}
              testid="hero-panel-bg-type"
            />
            {(t.panelBgType || "gradient") === "gradient" ? (
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
                label="Panel background"
                value={t.panelBg}
                onChange={(v) => setTheme({ panelBg: v })}
                testid="hero-panel-bg"
              />
            )}
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
        {isSplit && (
          <>
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
          </>
        )}
        <SliderField
          label="Height"
          value={l.height}
          min={200}
          max={800}
          step={10}
          suffix="px"
          onChange={(v) => setLayout({ height: v })}
          testid="hero-height"
        />
        {!isSplit && (
          <SliderField
            label="Content max width"
            value={l.contentMaxWidth}
            min={320}
            max={1200}
            step={10}
            suffix="px"
            onChange={(v) => setLayout({ contentMaxWidth: v })}
            testid="hero-content-max"
          />
        )}
        {isFade && (
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

      {!isSplit && (
        <Group title="Settings">
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
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
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
