/**
 * Hero Carousel — sliding variant (matches user-supplied design).
 * - Track translateX, brand logo per slide, dark left gradient,
 *   blue CTA, autoplay 4s, prev/next arrows, dots.
 */
import { GalleryHorizontalEnd } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  iife,
  makeUid,
  safeUrl,
  wrapSnippet,
} from "./shared";
import {
  TextField,
  TextAreaField,
  SliderField,
  ToggleField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import { Label } from "@/components/ui/label";

const ID = "hero-slide";

const defaults = () => ({
  uid: makeUid(),
  theme: {
    ctaBg: "#015f9b",
    ctaText: "#ffffff",
    titleColor: "#ffffff",
    subtitleColor: "#f1f5f9",
  },
  layout: {
    height: 520,
    contentMaxWidth: 600,
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
      logo: "https://media.misco.co.uk/images/authentrend_logo.png",
      title: "Hero Banner Title",
      subtitle: "Subtitle here",
      image:
        "https://media.misco.co.uk/media/misco/images/misco-career/Misco-Generic-Background-with-Gradient.jpg",
      ctaText: "Shop Now",
      ctaLink: "#",
    },
    {
      id: makeUid(),
      logo: "https://media.misco.co.uk/images/authentrend_logo.png",
      title: "Second Slide",
      subtitle: "Message here",
      image:
        "https://media.misco.co.uk/media/misco/images/misco-career/Misco-Generic-Background-with-Gradient.jpg",
      ctaText: "Learn More",
      ctaLink: "#",
    },
    {
      id: makeUid(),
      logo: "https://media.misco.co.uk/images/authentrend_logo.png",
      title: "Third Slide",
      subtitle: "Message here",
      image:
        "https://media.misco.co.uk/media/misco/images/misco-career/Misco-Generic-Background-with-Gradient.jpg",
      ctaText: "View Range",
      ctaLink: "#",
    },
  ],
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-hero-slide-${uid}`;
  const t = cfg.theme;
  const l = cfg.layout;
  const s = cfg.settings;
  const slides = (cfg.slides || []).filter(Boolean);

  const styleVars = [
    `--ns-cta-bg:${t.ctaBg}`,
    `--ns-cta-text:${t.ctaText}`,
    `--ns-title:${t.titleColor}`,
    `--ns-subtitle:${t.subtitleColor}`,
    `--ns-height:${l.height}px`,
    `--ns-content-max:${l.contentMaxWidth}px`,
  ].join(";");

  const slidesHtml = slides
    .map((slide) => {
      const bg = safeUrl(slide.image);
      const logo = safeUrl(slide.logo);
      const cta = slide.ctaText && slide.ctaText.trim();
      const link = safeUrl(slide.ctaLink || "#");
      return `<div class="ns-slide" style="background-image:url('${escAttr(bg)}')">
  <div class="ns-overlay"></div>
  <div class="ns-content">
    ${logo ? `<img class="ns-logo" src="${escAttr(logo)}" alt=""/>` : ""}
    ${slide.title ? `<h2 class="ns-title">${escHtml(slide.title)}</h2>` : ""}
    ${slide.subtitle ? `<p class="ns-subtitle">${escHtml(slide.subtitle)}</p>` : ""}
    ${cta ? `<a class="ns-cta" href="${escAttr(link)}" target="_blank" rel="noopener noreferrer">${escHtml(cta)}</a>` : ""}
  </div>
</div>`;
    })
    .join("");

  const dotsHtml = s.showDots
    ? `<div class="ns-dots">${slides
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
.${cls}{position:relative;width:100%;height:var(--ns-height);overflow:hidden;color:var(--ns-title);isolation:isolate}
.${cls} .ns-track{display:flex;height:100%;transition:transform .6s ease;will-change:transform}
.${cls} .ns-slide{flex:0 0 100%;height:100%;background-size:cover;background-position:center;background-repeat:no-repeat;display:flex;align-items:center;padding:0 56px;position:relative}
.${cls} .ns-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.6),rgba(0,0,0,0));pointer-events:none}
.${cls} .ns-content{position:relative;z-index:2;max-width:var(--ns-content-max);width:100%;text-align:left}
.${cls} .ns-logo{width:190px;max-width:100%;height:auto;margin:0 0 22px;object-fit:contain}
.${cls} .ns-title{font-size:clamp(2rem,4vw,3.375rem);font-weight:700;line-height:1.1;color:var(--ns-title);margin:0 0 16px;letter-spacing:-.02em}
.${cls} .ns-subtitle{font-size:clamp(1rem,1.5vw,1.25rem);line-height:1.5;color:var(--ns-subtitle);margin:0 0 24px;max-width:560px}
.${cls} .ns-cta{display:inline-block;background:var(--ns-cta-bg);color:var(--ns-cta-text);padding:14px 28px;border-radius:6px;font-weight:600;font-size:.95rem;border:none;transition:filter .15s ease,transform .15s ease}
.${cls} .ns-cta:hover{filter:brightness(1.1);transform:translateY(-1px)}
.${cls} .ns-arrow{position:absolute;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.4);color:#fff;border:none;font-size:24px;line-height:1;display:flex;align-items:center;justify-content:center;z-index:3;transition:background .15s ease}
.${cls} .ns-arrow:hover{background:rgba(0,0,0,.6)}
.${cls} .ns-prev{left:20px}
.${cls} .ns-next{right:20px}
.${cls} .ns-dots{position:absolute;bottom:20px;left:0;right:0;display:flex;justify-content:center;gap:10px;z-index:3}
.${cls} .ns-dot{width:10px;height:10px;border-radius:50%;border:1px solid #fff;background:transparent;padding:0;transition:background .15s ease}
.${cls} .ns-dot.is-active{background:#fff}
@media (max-width:640px){.${cls} .ns-slide{padding:0 24px}.${cls} .ns-logo{width:140px;margin-bottom:16px}}
`.trim();

  const html = `<section class="ns-hero-slide ${cls}${fullBleedClass(cfg)}" style="${styleVars}" data-ns-autoplay="${s.autoplay ? "1" : "0"}" data-ns-interval="${s.interval}">
<div class="ns-track" data-ns-track>${slidesHtml}</div>
${arrowsHtml}
${dotsHtml}
</section>`;

  const js = iife(
    cls,
    `var track=root.querySelector("[data-ns-track]");var slides=root.querySelectorAll(".ns-slide");var dots=root.querySelectorAll(".ns-dot");var prev=root.querySelector("[data-ns-prev]");var next=root.querySelector("[data-ns-next]");var current=0;var total=slides.length;if(!total||!track)return;var ap=root.getAttribute("data-ns-autoplay")==="1";var interval=parseInt(root.getAttribute("data-ns-interval"),10)||4000;var timer=null;function go(i){current=(i+total)%total;track.style.transform="translateX(-"+(current*100)+"%)";dots.forEach(function(el,idx){el.classList.toggle("is-active",idx===current);});}function start(){if(!ap||total<2)return;stop();timer=setInterval(function(){go(current+1);},interval);}function stop(){if(timer){clearInterval(timer);timer=null;}}if(prev)prev.addEventListener("click",function(){go(current-1);start();});if(next)next.addEventListener("click",function(){go(current+1);start();});dots.forEach(function(el,idx){el.addEventListener("click",function(){go(idx);start();});});root.addEventListener("mouseenter",stop);root.addEventListener("mouseleave",start);go(0);start();`
  );

  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  const t = config.theme;
  const l = config.layout;
  const s = config.settings;
  const setT = (p) => onUpdate({ theme: { ...t, ...p } });
  const setL = (p) => onUpdate({ layout: { ...l, ...p } });
  const setS = (p) => onUpdate({ settings: { ...s, ...p } });

  const addSlide = () =>
    onUpdate({
      slides: [
        ...config.slides,
        {
          id: makeUid(),
          logo: "",
          title: "New Slide",
          subtitle: "Subtitle",
          image: "",
          ctaText: "Shop now",
          ctaLink: "#",
        },
      ],
    });
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

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Slides ({config.slides.length})
        </h3>
        <ListEditor
          items={config.slides}
          onAdd={addSlide}
          onRemove={removeSlide}
          onMove={moveSlide}
          addLabel="Add slide"
          testidPrefix="hs-slide"
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
                  Background image
                </Label>
                <ImageUpload
                  value={slide.image}
                  onChange={(v) => updateSlide(slide.id, { image: v })}
                  testid={`hs-slide-image-${slide.id}`}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Brand logo
                </Label>
                <ImageUpload
                  value={slide.logo}
                  onChange={(v) => updateSlide(slide.id, { logo: v })}
                  testid={`hs-slide-logo-${slide.id}`}
                  compact
                />
              </div>
              <TextField
                label="Title"
                value={slide.title}
                onChange={(v) => updateSlide(slide.id, { title: v })}
                testid={`hs-slide-title-${slide.id}`}
              />
              <TextAreaField
                label="Subtitle"
                value={slide.subtitle}
                onChange={(v) => updateSlide(slide.id, { subtitle: v })}
                testid={`hs-slide-subtitle-${slide.id}`}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="CTA text"
                  value={slide.ctaText}
                  onChange={(v) => updateSlide(slide.id, { ctaText: v })}
                  testid={`hs-slide-cta-text-${slide.id}`}
                />
                <TextField
                  label="CTA link"
                  value={slide.ctaLink}
                  onChange={(v) => updateSlide(slide.id, { ctaLink: v })}
                  testid={`hs-slide-cta-link-${slide.id}`}
                />
              </div>
            </>
          )}
        />
      </div>

      <Group title="Theme">
        <ColorField
          label="Title color"
          value={t.titleColor}
          onChange={(v) => setT({ titleColor: v })}
          testid="hs-title-color"
        />
        <ColorField
          label="Subtitle color"
          value={t.subtitleColor}
          onChange={(v) => setT({ subtitleColor: v })}
          testid="hs-sub-color"
        />
        <ColorField
          label="CTA bg"
          value={t.ctaBg}
          onChange={(v) => setT({ ctaBg: v })}
          testid="hs-cta-bg"
        />
        <ColorField
          label="CTA text"
          value={t.ctaText}
          onChange={(v) => setT({ ctaText: v })}
          testid="hs-cta-text"
        />
      </Group>

      <Group title="Layout">
        <ToggleField
          label="Full bleed (100vw)"
          description="Break out of the host's content area"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="hs-full-bleed"
        />
        <SliderField
          label="Height"
          value={l.height}
          min={320}
          max={800}
          step={10}
          suffix="px"
          onChange={(v) => setL({ height: v })}
          testid="hs-height"
        />
        <SliderField
          label="Content max width"
          value={l.contentMaxWidth}
          min={400}
          max={1000}
          step={20}
          suffix="px"
          onChange={(v) => setL({ contentMaxWidth: v })}
          testid="hs-content-max"
        />
      </Group>

      <Group title="Settings">
        <ToggleField
          label="Autoplay"
          checked={s.autoplay}
          onChange={(v) => setS({ autoplay: v })}
          testid="hs-autoplay"
        />
        <SliderField
          label="Interval"
          value={s.interval}
          min={2000}
          max={10000}
          step={500}
          suffix="ms"
          onChange={(v) => setS({ interval: v })}
          testid="hs-interval"
          disabled={!s.autoplay}
        />
        <ToggleField
          label="Arrows"
          checked={s.showArrows}
          onChange={(v) => setS({ showArrows: v })}
          testid="hs-arrows"
        />
        <ToggleField
          label="Dots"
          checked={s.showDots}
          onChange={(v) => setS({ showDots: v })}
          testid="hs-dots"
        />
      </Group>
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

export const heroSlide = {
  id: ID,
  name: "Hero (Sliding)",
  description: "Sliding track with brand logo per slide",
  icon: GalleryHorizontalEnd,
  defaults,
  render,
  FormPanel,
};
