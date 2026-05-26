/**
 * Resource Carousel — horizontal scroll of cards with image + tag + title.
 * Used for blogs, case studies, news teasers.
 */
import { Newspaper } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  iife,
  makeUid,
  num,
  padTopOf,
  padBotOf,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import {
  TextField,
  SliderField,
  SelectField,
  ToggleField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";
const ID = "resources";

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=800&auto=format&fit=crop",
];

const sampleResource = (i) => ({
  id: makeUid(),
  image: STOCK_IMAGES[(i - 1) % STOCK_IMAGES.length],
  imageAlt: "",
  tag: i % 2 === 0 ? "Case Study" : "Blog",
  title:
    i === 1
      ? "5 tips to scale your ecommerce platform in 2026"
      : i === 2
        ? "How Nettailer powers reliable B2B checkout"
        : i === 3
          ? "Top IT considerations for modern teams"
          : i === 4
            ? "Delivering reliable solutions at scale"
            : "Building customer trust through technology",
  link: "#",
  openInSameTab: false,
});

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "",
  title: "Insights and Resources",
  titleColor: "#1f2937",
  eyebrowColor: "#E01839",
  tagColor: "#E01839",
  hoverBorder: "#E01839",
  columns: 4,
  showArrows: true,
  // Carousel autoplay — off by default; if turned on, the section
  // auto-advances by one card every `autoplayInterval` ms.
  autoplay: false,
  autoplayInterval: 4000,
  pauseOnHover: true,
  paddingY: 60,
  paddingTop: 60,
  paddingBottom: 60,
  fullBleed: false,
  // Heading + eyebrow alignment across the section width.
  // "left" | "center" | "right" — defaults to left so new sections
  // read like a normal article header. baseReset forces h-tags to
  // inherit text-align, so this value is applied to `.ns-wrap`.
  textAlign: "left",
  resources: Array.from({ length: 5 }, (_, i) => sampleResource(i + 1)),
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-resources-${uid}`;
  const cols = Math.max(2, Math.min(5, Number(cfg.columns) || 4));
  const gap = 18;
  const align = cfg.textAlign === "center" || cfg.textAlign === "right" ? cfg.textAlign : "left";

  const styleVars = [
    `--ns-title-color:${safeColor(cfg.titleColor, "#1f2937")}`,
    `--ns-eyebrow-color:${safeColor(cfg.eyebrowColor || cfg.tagColor, "#E01839")}`,
    `--ns-tag-color:${safeColor(cfg.tagColor, "#E01839")}`,
    `--ns-hover-border:${safeColor(cfg.hoverBorder, "#E01839")}`,
    `--ns-heading-size:${num(cfg.headingSize, 30)}px`,
    `--ns-pad-t:${padTopOf(cfg, 60)}px;--ns-pad-b:${padBotOf(cfg, 60)}px`,
    `--ns-cols:${cols}`,
    `--ns-gap:${gap}px`,
  ].join(";");

  const cardsHtml = (cfg.resources || [])
    .map((r) => {
      const img = safeUrl(r.image);
      const link = safeUrl(r.link || "#");
      const target = r.openInSameTab ? "_self" : "_blank";
      const rel = r.openInSameTab ? "" : ' rel="noopener noreferrer"';
      return `<a class="ns-card" href="${escAttr(link)}" target="${target}"${rel}>
  <div class="ns-img"><img src="${escAttr(img)}" alt="${escAttr(r.imageAlt || r.title || "")}"/></div>
  <div class="ns-body">
    ${r.tag ? `<span class="ns-tag">${escHtml(r.tag)}</span>` : ""}
    <h3 class="ns-rh">${escHtml(r.title || "")}</h3>
  </div>
</a>`;
    })
    .join("");

  const arrowsHtml = cfg.showArrows
    ? `<button class="ns-arrow ns-prev" type="button" data-ns-prev aria-label="Previous">‹</button>
<button class="ns-arrow ns-next" type="button" data-ns-next aria-label="Next">›</button>`
    : "";

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad-t) 20px var(--ns-pad-b);width:100%;background:#fff}
.${cls} .ns-wrap{max-width:1200px;margin:0 auto;position:relative;text-align:${align}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-eyebrow-color);margin:0 0 10px}
.${cls} .ns-h{font-size:var(--ns-heading-size,30px);font-weight:600;color:var(--ns-title-color);margin:0 0 28px}
.${cls} .ns-track{display:flex;align-items:stretch;gap:var(--ns-gap);overflow-x:auto;scroll-behavior:smooth;scrollbar-width:none;-ms-overflow-style:none;padding:10px 0;margin:-10px 0;text-align:left}
.${cls} .ns-track::-webkit-scrollbar{display:none}
.${cls} .ns-card{flex:0 0 calc((100% - (var(--ns-cols) - 1) * var(--ns-gap)) / var(--ns-cols));display:flex;flex-direction:column;border:1px solid #f2f2f2;border-radius:6px;background:#fff;overflow:hidden;text-decoration:none;color:inherit;transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}
.${cls} .ns-card:hover{border-color:var(--ns-hover-border);box-shadow:0 4px 18px rgba(0,0,0,.06);transform:translateY(-2px)}
.${cls} .ns-img{width:100%;height:170px;overflow:hidden;background:#fafafa}
.${cls} .ns-img img{width:100%;height:100%;object-fit:cover;display:block}
.${cls} .ns-body{padding:18px;text-align:left;flex:1;display:flex;flex-direction:column}
.${cls} .ns-tag{display:block;margin:0 0 8px;font-size:11px;line-height:1;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ns-tag-color)}
.${cls} .ns-rh{margin:0;font-size:16px;line-height:1.4;font-weight:600;color:#1f1f1f}
.${cls} .ns-arrow{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;border:1px solid #f2f2f2;background:#fff;color:var(--ns-tag-color);font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.08);z-index:3;transition:background .15s ease}
.${cls} .ns-arrow:hover{background:#f8fafc}
.${cls} .ns-prev{left:-18px}
.${cls} .ns-next{right:-18px}
@media (max-width:1024px){.${cls} .ns-card{flex-basis:calc((100% - 36px) / 3)}}
@media (max-width:640px){.${cls} .ns-card{flex-basis:80%}.${cls} .ns-prev{left:0}.${cls} .ns-next{right:0}}
`.trim();

  const html = `<section class="ns-resources ${cls}${fullBleedClass(cfg)}" style="${styleVars}" data-ns-autoplay="${cfg.autoplay ? "1" : "0"}" data-ns-interval="${num(cfg.autoplayInterval, 4000)}" data-ns-poh="${cfg.pauseOnHover === false ? "0" : "1"}">
  <div class="ns-wrap">
    ${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}
    ${cfg.title ? `<h2 class="ns-h">${escHtml(cfg.title)}</h2>` : ""}
    ${arrowsHtml}
    <div class="ns-track" data-ns-track>
      ${cardsHtml}
    </div>
  </div>
</section>`;

  const js = iife(
    cls,
    `var track=root.querySelector("[data-ns-track]");var prev=root.querySelector("[data-ns-prev]");var next=root.querySelector("[data-ns-next]");if(!track)return;var ap=root.getAttribute("data-ns-autoplay")==="1";var interval=parseInt(root.getAttribute("data-ns-interval"),10)||4000;var poh=root.getAttribute("data-ns-poh")!=="0";var timer=null;function step(dir){var c=track.querySelector(".ns-card");if(!c)return;var amt=c.offsetWidth+18;var max=track.scrollWidth-track.clientWidth;var sl=track.scrollLeft;if(dir>0&&sl>=max-5){track.scrollTo({left:0,behavior:"smooth"});}else if(dir<0&&sl<=5){track.scrollTo({left:max,behavior:"smooth"});}else{track.scrollBy({left:dir*amt,behavior:"smooth"});}}function start(){if(!ap)return;stop();timer=setInterval(function(){step(1);},interval);}function stop(){if(timer){clearInterval(timer);timer=null;}}if(prev)prev.addEventListener("click",function(){step(-1);start();});if(next)next.addEventListener("click",function(){step(1);start();});if(poh){root.addEventListener("mouseenter",stop);root.addEventListener("mouseleave",start);}start();`
  );

  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  const addResource = () =>
    onUpdate({
      resources: [
        ...config.resources,
        sampleResource(config.resources.length + 1),
      ],
    });
  const removeResource = (id) =>
    onUpdate({ resources: config.resources.filter((r) => r.id !== id) });
  const moveResource = (id, dir) => {
    const idx = config.resources.findIndex((r) => r.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= config.resources.length) return;
    const arr = [...config.resources];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    onUpdate({ resources: arr });
  };
  const updateResource = (id, patch) =>
    onUpdate({
      resources: config.resources.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      ),
    });

  return (
    <FormAccordion sectionType="resources">
      <Group title="Header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="resources-eyebrow"
        />
        <TextField
          label="Heading (optional)"
          value={config.title}
          onChange={(v) => onUpdate({ title: v })}
          testid="resources-title"
        />
        <SelectField
          label="Heading alignment"
          value={config.textAlign || "left"}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          testid="resources-text-align"
        />
      </Group>

      <Group title="Defaults" value="defaults">
        <SelectField
          label="Columns"
          value={config.columns}
          onChange={(v) => onUpdate({ columns: Number(v) })}
          options={[
            { value: 2, label: "2 columns" },
            { value: 3, label: "3 columns" },
            { value: 4, label: "4 columns" },
            { value: 5, label: "5 columns" },
          ]}
          testid="resources-columns"
        />
        <ToggleField
          label="Show arrows"
          checked={config.showArrows}
          onChange={(v) => onUpdate({ showArrows: v })}
          testid="resources-arrows"
        />
        <ToggleField
          label="Autoplay"
          description="Auto-advance through cards on a timer"
          checked={!!config.autoplay}
          onChange={(v) => onUpdate({ autoplay: v })}
          testid="resources-autoplay"
        />
        {config.autoplay ? (
          <>
            <SliderField
              label="Interval"
              value={Number(config.autoplayInterval) || 4000}
              min={2000}
              max={12000}
              step={500}
              suffix="ms"
              onChange={(v) => onUpdate({ autoplayInterval: v })}
              testid="resources-autoplay-interval"
            />
            <ToggleField
              label="Pause on hover"
              checked={config.pauseOnHover !== false}
              onChange={(v) => onUpdate({ pauseOnHover: v })}
              testid="resources-pause-on-hover"
            />
          </>
        ) : null}
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="resources-full-bleed"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={60}
          min={20}
          max={120}
          testidPrefix="resources"
        />
        <SliderField
          label="Heading size"
          value={Number(config.headingSize) || 30}
          min={20}
          max={72}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="resources-heading-size"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <ColorField
          label="Eyebrow color"
          value={config.eyebrowColor || config.tagColor}
          onChange={(v) => onUpdate({ eyebrowColor: v })}
          testid="resources-eyebrow-color"
        />
        <ColorField
          label="Heading color"
          value={config.titleColor}
          onChange={(v) => onUpdate({ titleColor: v })}
          testid="resources-title-color"
        />
        <ColorField
          label="Tag color"
          value={config.tagColor}
          onChange={(v) => onUpdate({ tagColor: v })}
          testid="resources-tag"
        />
        <ColorField
          label="Card hover border"
          value={config.hoverBorder}
          onChange={(v) => onUpdate({ hoverBorder: v })}
          testid="resources-hover"
        />
      </Group>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Resources ({config.resources.length})
        </h3>
        <ListEditor
          items={config.resources}
          onAdd={addResource}
          onRemove={removeResource}
          onMove={moveResource}
          addLabel="Add resource"
          testidPrefix="resource"
          renderRow={(r) => (
            <div className="flex items-center gap-2">
              <div className="w-10 h-7 rounded-sm bg-slate-100 flex-shrink-0 overflow-hidden">
                {r.image && (
                  <img src={r.image} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">
                {r.title}
              </p>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 ml-auto">
                {r.tag}
              </span>
            </div>
          )}
          renderForm={(r) => (
            <>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Image
                </Label>
                <ImageUpload
                  value={r.image}
                  onChange={(v) => updateResource(r.id, { image: v })}
                  testid={`resource-image-${r.id}`}
                  compact
                />
              </div>
              <TextField
                label="Image alt text (optional)"
                value={r.imageAlt || ""}
                onChange={(v) => updateResource(r.id, { imageAlt: v })}
                placeholder="Falls back to the title"
                testid={`resource-image-alt-${r.id}`}
              />
              <TextField
                label="Tag (e.g. Blog / Case Study)"
                value={r.tag}
                onChange={(v) => updateResource(r.id, { tag: v })}
                testid={`resource-tag-${r.id}`}
              />
              <TextField
                label="Title"
                value={r.title}
                onChange={(v) => updateResource(r.id, { title: v })}
                testid={`resource-title-${r.id}`}
              />
              <TextField
                label="Link URL"
                value={r.link}
                onChange={(v) => updateResource(r.id, { link: v })}
                testid={`resource-link-${r.id}`}
              />
              <ToggleField
                label="Open in same tab"
                checked={r.openInSameTab}
                onChange={(v) => updateResource(r.id, { openInSameTab: v })}
                testid={`resource-same-tab-${r.id}`}
              />
            </>
          )}
        />
      </div>
    </FormAccordion>
  );
}

export const resources = {
  id: ID,
  name: "Resource Carousel",
  description: "Horizontal scroll of blog / case study cards",
  icon: Newspaper,
  defaults,
  render,
  FormPanel,
};
