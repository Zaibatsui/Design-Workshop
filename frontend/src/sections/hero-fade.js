/**
 * Hero Carousel — fade variant.
 * Output snippet: scoped CSS, multi-instance-safe IIFE.
 */
import { Layers } from "lucide-react";
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
  SelectField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import { Label } from "@/components/ui/label";

const ID = "hero-fade";

const defaults = () => ({
  uid: makeUid(),
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
    textAlign: "left",
    contentMaxWidth: 720,
    borderRadius: 12,
  },
  settings: {
    autoplay: true,
    interval: 5000,
    showArrows: true,
    showDots: true,
  },
  fullBleed: false,
  slides: [
    {
      id: makeUid(),
      title: "New Season Drop",
      subtitle: "Fresh fits, refined essentials.",
      image:
        "https://images.unsplash.com/photo-1660807541304-9ec2f8ac2811?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      logo: "",
      ctaText: "Shop the Edit",
      ctaLink: "https://example.com",
    },
    {
      id: makeUid(),
      title: "Designed for Living",
      subtitle: "Minimalist furniture crafted for everyday calm.",
      image:
        "https://images.unsplash.com/photo-1617364852223-75f57e78dc96?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
      logo: "",
      ctaText: "Browse Collection",
      ctaLink: "https://example.com",
    },
  ],
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-hero-fade-${uid}`;
  const t = cfg.theme;
  const l = cfg.layout;
  const s = cfg.settings;
  const slides = (cfg.slides || []).filter(Boolean);

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
      <div class="ns-overlay"></div>
      <div class="ns-content" data-align="${escAttr(l.textAlign)}">
        ${logo ? `<img class="ns-logo" src="${escAttr(logo)}" alt=""/>` : ""}
        ${slide.title ? `<h2 class="ns-title">${escHtml(slide.title)}</h2>` : ""}
        ${slide.subtitle ? `<p class="ns-subtitle">${escHtml(slide.subtitle)}</p>` : ""}
        ${cta ? `<a class="ns-cta" href="${escAttr(link)}" target="_blank" rel="noopener noreferrer">${escHtml(cta)}</a>` : ""}
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
    ? `<button class="ns-arrow ns-prev" type="button" data-ns-prev aria-label="Previous"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
<button class="ns-arrow ns-next" type="button" data-ns-next aria-label="Next"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>`
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
.${cls} .ns-logo{max-height:48px;max-width:160px;margin-bottom:20px;object-fit:contain}
.${cls} .ns-content[data-align="center"] .ns-logo{margin-left:auto;margin-right:auto}
.${cls} .ns-title{font-size:clamp(1.75rem,3.6vw,3rem);font-weight:700;line-height:1.1;color:var(--ns-title);letter-spacing:-.02em;margin:0 0 12px}
.${cls} .ns-subtitle{font-size:clamp(.95rem,1.4vw,1.125rem);line-height:1.5;color:var(--ns-subtitle);max-width:560px;margin:0 0 24px}
.${cls} .ns-content[data-align="center"] .ns-subtitle{margin-left:auto;margin-right:auto}
.${cls} .ns-cta{display:inline-block;background:var(--ns-primary);color:var(--ns-primary-text);padding:13px 28px;border-radius:9999px;font-weight:600;font-size:.95rem;border:none;transition:transform .15s ease,filter .15s ease}
.${cls} .ns-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}
.${cls} .ns-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:9999px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.32);color:#fff;display:flex;align-items:center;justify-content:center;z-index:3;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:background .15s ease}
.${cls} .ns-arrow:hover{background:rgba(0,0,0,.55)}
.${cls} .ns-prev{left:16px}
.${cls} .ns-next{right:16px}
.${cls} .ns-dots{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:3}
.${cls} .ns-dot{width:8px;height:8px;padding:0;border-radius:9999px;border:none;background:rgba(255,255,255,.5);transition:background .15s ease,width .15s ease}
.${cls} .ns-dot.is-active{background:#fff;width:22px}
@media (max-width:640px){.${cls} .ns-slide{padding:28px 24px}.${cls} .ns-arrow{width:36px;height:36px}}
`.trim();

  const html = `<section class="ns-hero-fade ${cls}${fullBleedClass(cfg)}" style="${styleVars}" data-ns-autoplay="${s.autoplay ? "1" : "0"}" data-ns-interval="${s.interval}">
${slidesHtml}
${arrowsHtml}
${dotsHtml}
</section>`;

  const js = iife(
    cls,
    `var slides=root.querySelectorAll(".ns-slide");var dots=root.querySelectorAll(".ns-dot");var prev=root.querySelector("[data-ns-prev]");var next=root.querySelector("[data-ns-next]");var current=0;var total=slides.length;if(!total)return;var ap=root.getAttribute("data-ns-autoplay")==="1";var interval=parseInt(root.getAttribute("data-ns-interval"),10)||5000;var timer=null;function go(i){current=(i+total)%total;slides.forEach(function(el,idx){el.classList.toggle("is-active",idx===current);});dots.forEach(function(el,idx){el.classList.toggle("is-active",idx===current);});}function start(){if(!ap||total<2)return;stop();timer=setInterval(function(){go(current+1);},interval);}function stop(){if(timer){clearInterval(timer);timer=null;}}if(prev)prev.addEventListener("click",function(){go(current-1);start();});if(next)next.addEventListener("click",function(){go(current+1);start();});dots.forEach(function(el,idx){el.addEventListener("click",function(){go(idx);start();});});root.addEventListener("mouseenter",stop);root.addEventListener("mouseleave",start);go(0);start();`
  );

  return wrapSnippet({ html, css, js });
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
          ctaText: "Shop now",
          ctaLink: "#",
        },
      ],
    });
  };
  const removeSlide = (id) =>
    onUpdate({ slides: config.slides.filter((s) => s.id !== id) });
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
      slides: config.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
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
          testidPrefix="hf-slide"
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
                  testid={`hf-slide-image-${slide.id}`}
                />
              </div>
              <TextField
                label="Title"
                value={slide.title}
                onChange={(v) => updateSlide(slide.id, { title: v })}
                testid={`hf-slide-title-${slide.id}`}
              />
              <TextAreaField
                label="Subtitle"
                value={slide.subtitle}
                onChange={(v) => updateSlide(slide.id, { subtitle: v })}
                testid={`hf-slide-subtitle-${slide.id}`}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="CTA text"
                  value={slide.ctaText}
                  onChange={(v) => updateSlide(slide.id, { ctaText: v })}
                  testid={`hf-slide-cta-text-${slide.id}`}
                />
                <TextField
                  label="CTA link"
                  value={slide.ctaLink}
                  onChange={(v) => updateSlide(slide.id, { ctaLink: v })}
                  testid={`hf-slide-cta-link-${slide.id}`}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Logo (optional)
                </Label>
                <ImageUpload
                  value={slide.logo}
                  onChange={(v) => updateSlide(slide.id, { logo: v })}
                  testid={`hf-slide-logo-${slide.id}`}
                  compact
                />
              </div>
            </>
          )}
        />
      </div>

      <SectionGroup title="Theme">
        <ColorField
          label="Title color"
          value={t.titleColor}
          onChange={(v) => setTheme({ titleColor: v })}
          testid="hf-theme-title"
        />
        <ColorField
          label="Subtitle color"
          value={t.subtitleColor}
          onChange={(v) => setTheme({ subtitleColor: v })}
          testid="hf-theme-subtitle"
        />
        <ColorField
          label="Button bg"
          value={t.primaryColor}
          onChange={(v) => setTheme({ primaryColor: v })}
          testid="hf-theme-primary"
        />
        <ColorField
          label="Button text"
          value={t.primaryText}
          onChange={(v) => setTheme({ primaryText: v })}
          testid="hf-theme-primary-text"
        />
        <ColorField
          label="Overlay"
          value={t.overlayColor}
          onChange={(v) => setTheme({ overlayColor: v })}
          testid="hf-theme-overlay"
        />
        <SliderField
          label="Overlay opacity"
          value={Math.round(t.overlayOpacity * 100)}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => setTheme({ overlayOpacity: v / 100 })}
          testid="hf-overlay-opacity"
        />
      </SectionGroup>

      <SectionGroup title="Layout">
        <ToggleField
          label="Full bleed (100vw)"
          description="Break out of the host's content area"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="hf-full-bleed"
        />
        <SelectField
          label="Text alignment"
          value={l.textAlign}
          onChange={(v) => setLayout({ textAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          testid="hf-text-align"
        />
        <SliderField
          label="Height"
          value={l.height}
          min={320}
          max={800}
          step={10}
          suffix="px"
          onChange={(v) => setLayout({ height: v })}
          testid="hf-height"
        />
        <SliderField
          label="Border radius"
          value={l.borderRadius}
          min={0}
          max={32}
          suffix="px"
          onChange={(v) => setLayout({ borderRadius: v })}
          testid="hf-radius"
        />
      </SectionGroup>

      <SectionGroup title="Settings">
        <ToggleField
          label="Autoplay"
          checked={s.autoplay}
          onChange={(v) => setSettings({ autoplay: v })}
          testid="hf-autoplay"
        />
        <SliderField
          label="Interval"
          value={s.interval}
          min={2000}
          max={12000}
          step={500}
          suffix="ms"
          onChange={(v) => setSettings({ interval: v })}
          testid="hf-interval"
          disabled={!s.autoplay}
        />
        <ToggleField
          label="Arrows"
          checked={s.showArrows}
          onChange={(v) => setSettings({ showArrows: v })}
          testid="hf-arrows"
        />
        <ToggleField
          label="Dots"
          checked={s.showDots}
          onChange={(v) => setSettings({ showDots: v })}
          testid="hf-dots"
        />
      </SectionGroup>
    </div>
  );
}

function SectionGroup({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export const heroFade = {
  id: ID,
  name: "Hero (Fade)",
  description: "Cross-fading slides with overlay & dots",
  icon: Layers,
  defaults,
  render,
  FormPanel,
};
