/**
 * Testimonials — auto-scrolling quote carousel (marquee).
 * Uses the same pad-once + clone-once + CSS translateX(0 → -50%) pattern
 * as Logo Strip. Hover pauses so readers can actually read.
 */
import { Quote } from "lucide-react";
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
  SelectField,
  ToggleField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
const ID = "testimonials";

const sampleCard = (quote, name, role, rating = 5) => ({
  id: makeUid(),
  quote,
  name,
  role,
  avatar: "",
  avatarAlt: "",
  rating,
});

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "",
  title: "What our customers say",
  subheading: "",
  textAlign: "left",
  titleColor: "#1f2937",
  bodyColor: "#64748b",
  accentColor: "#E01839",
  bgColor: "#f8fafc",
  cardBg: "#ffffff",
  speedSeconds: 50,
  cardWidth: 340,
  cardGap: 24,
  paddingY: 72,
  showRatings: true,
  fullBleed: true,
  items: [
    sampleCard(
      "Shipped our new partner page in an afternoon. No dev ticket, no framework wrangling, just a clean HTML drop-in that our CMS actually liked.",
      "Alex Ramos",
      "Head of eCommerce, Nordheim Supplies"
    ),
    sampleCard(
      "The snippet-in, snippet-out model is exactly what we needed. We stopped arguing about component libraries and started shipping pages.",
      "Priya Natarajan",
      "Content Manager, Lumera Retail"
    ),
    sampleCard(
      "Live pricing inside a static snippet felt like cheating. Our catalogue pages now stay fresh with zero server-side work on our end.",
      "Tom Whitaker",
      "Marketing Lead, B2B Direct"
    ),
  ],
});

function stars(n, accent) {
  const v = Math.max(0, Math.min(5, Number(n) || 0));
  let out = "";
  for (let i = 0; i < 5; i += 1) {
    const on = i < v;
    out += `<svg viewBox="0 0 20 20" aria-hidden="true" width="14" height="14" fill="${
      on ? escAttr(accent) : "none"
    }" stroke="${escAttr(accent)}" stroke-width="1.5"><path d="M10 2l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 14.77l-4.78 2.51.91-5.32L2.27 8.2l5.34-.78L10 2z"/></svg>`;
  }
  return out;
}

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-testi-${uid}`;
  const accent = safeColor(cfg.accentColor, "#E01839");
  const align =
    cfg.textAlign === "right" || cfg.textAlign === "center"
      ? cfg.textAlign
      : "left";

  const styleVars = [
    `--ns-title-color:${safeColor(cfg.titleColor, "#1f2937")}`,
    `--ns-body-color:${safeColor(cfg.bodyColor, "#64748b")}`,
    `--ns-accent:${accent}`,
    `--ns-bg:${safeColor(cfg.bgColor, "#f8fafc")}`,
    `--ns-card-bg:${safeColor(cfg.cardBg, "#ffffff")}`,
    `--ns-speed:${num(cfg.speedSeconds, 50)}s`,
    `--ns-card-w:${num(cfg.cardWidth, 340)}px`,
    `--ns-gap:${num(cfg.cardGap, 24)}px`,
    `--ns-pad:${num(cfg.paddingY, 72)}px`,
    `--ns-heading-size:${num(cfg.headingSize, 32)}px`,
  ].join(";");

  const items = Array.isArray(cfg.items) ? cfg.items : [];
  const itemsHtml = items
    .map((t) => {
      const avatar = safeUrl(t.avatar);
      const avatarHtml = avatar
        ? `<img class="ns-avatar" src="${escAttr(avatar)}" alt="${escAttr(t.avatarAlt || t.name || "")}"/>`
        : `<div class="ns-avatar ns-avatar-placeholder" aria-hidden="true">${escHtml((t.name || "?").slice(0, 1).toUpperCase())}</div>`;
      const ratingHtml =
        cfg.showRatings && Number(t.rating) > 0
          ? `<div class="ns-rating" aria-label="${escAttr(t.rating + " out of 5")}">${stars(t.rating, accent)}</div>`
          : "";
      return `<article class="ns-item" data-ns-original>
  ${ratingHtml}
  <p class="ns-quote">${escHtml(t.quote || "")}</p>
  <div class="ns-author">
    ${avatarHtml}
    <div class="ns-meta">
      <div class="ns-name">${escHtml(t.name || "")}</div>
      <div class="ns-role">${escHtml(t.role || "")}</div>
    </div>
  </div>
</article>`;
    })
    .join("");

  const animName = `nsTestiScroll_${uid.replace(/[^a-z0-9]/gi, "")}`;

  const eyebrowHtml = cfg.eyebrow
    ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>`
    : "";
  const subHtml = cfg.subheading
    ? `<p class="ns-sub">${escHtml(cfg.subheading)}</p>`
    : "";
  const hasHeader = !!(cfg.title || cfg.eyebrow || cfg.subheading);
  const headerHtml = hasHeader
    ? `<div class="ns-head-wrap"><header class="ns-head"><div class="ns-head-inner">${eyebrowHtml}${cfg.title ? `<h2 class="ns-heading">${escHtml(cfg.title)}</h2>` : ""}${subHtml}</div></header></div>`
    : "";

  // Head-inner margin logic matches Feature Grid / Steps / FAQ exactly.
  const headInnerAlign =
    align === "center"
      ? "margin:0 auto;"
      : align === "right"
        ? "margin:0 0 0 auto;"
        : "";

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad) 0;width:100%;background:var(--ns-bg);overflow:hidden}
.${cls} .ns-head-wrap{max-width:1200px;margin:0 auto;padding:0 20px;text-align:${align}}
.${cls} .ns-head{margin-bottom:40px}
.${cls} .ns-head-inner{max-width:720px;${headInnerAlign}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-accent);margin-bottom:14px}
.${cls} .ns-heading{font-size:var(--ns-heading-size,32px);font-weight:600;letter-spacing:-0.01em;line-height:1.15;color:var(--ns-title-color)}
.${cls} .ns-sub{margin-top:14px;font-size:16px;color:var(--ns-body-color);line-height:1.6}
.${cls} .ns-track{display:flex;width:max-content;animation:${animName} var(--ns-speed) linear infinite;will-change:transform}
.${cls} .ns-item{flex:0 0 auto;width:var(--ns-card-w);margin:0 calc(var(--ns-gap) / 2);background:var(--ns-card-bg);border:1px solid #e5e7eb;border-radius:12px;padding:26px 26px 22px;display:flex;flex-direction:column;gap:18px;position:relative}
.${cls} .ns-item::before{content:"";position:absolute;top:0;left:26px;right:26px;height:3px;background:var(--ns-accent);border-radius:0 0 3px 3px;opacity:0.9}
.${cls} .ns-rating{display:flex;gap:3px}
.${cls} .ns-quote{font-size:15px;line-height:1.6;color:#374151;font-weight:400;flex:1;min-height:4.8em}
.${cls} .ns-author{display:flex;align-items:center;gap:12px}
.${cls} .ns-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;flex:0 0 auto;background:#f1f5f9}
.${cls} .ns-avatar-placeholder{display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:var(--ns-accent);background:color-mix(in srgb, var(--ns-accent) 12%, #fff)}
.${cls} .ns-meta{min-width:0}
.${cls} .ns-name{font-size:14px;font-weight:600;color:#111827;line-height:1.3}
.${cls} .ns-role{font-size:12px;color:#6b7280;line-height:1.4;margin-top:2px}
@keyframes ${animName}{to{transform:translateX(-50%)}}
.${cls}:hover .ns-track{animation-play-state:paused}
@media (prefers-reduced-motion: reduce){.${cls} .ns-track{animation:none}}
@media (max-width:640px){.${cls} .ns-heading{font-size:26px}}
`.trim();

  const html = `<section class="ns-testimonials ${cls}${fullBleedClass(cfg)}" style="${styleVars}">
  ${headerHtml}
  <div class="ns-track" data-ns-track>${itemsHtml}</div>
</section>`;

  // Same marquee pattern as Logo Strip: pad base to ≥ viewport, clone once,
  // CSS animates translateX(0 → -50%) for a seamless loop.
  const js = iife(
    cls,
    `var track=root.querySelector("[data-ns-track]");if(!track)return;var origItems=track.querySelectorAll("[data-ns-original]");if(!origItems.length)return;var orig=Array.prototype.map.call(origItems,function(el){return el.outerHTML;}).join("");var base=orig;track.innerHTML=base;var safety=0;while(track.scrollWidth<window.innerWidth&&safety<10){base+=orig;track.innerHTML=base;safety++;}track.innerHTML=base+base;`
  );

  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  const addItem = () =>
    onUpdate({
      items: [
        ...(config.items || []),
        {
          id: makeUid(),
          quote: "",
          name: "",
          role: "",
          avatar: "",
          avatarAlt: "",
          rating: 5,
        },
      ],
    });
  const removeItem = (id) =>
    onUpdate({ items: config.items.filter((t) => t.id !== id) });
  const moveItem = (id, dir) => {
    const idx = config.items.findIndex((t) => t.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= config.items.length) return;
    const arr = [...config.items];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    onUpdate({ items: arr });
  };
  const updateItem = (id, patch) =>
    onUpdate({
      items: config.items.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });

  return (
    <FormAccordion sectionType="testimonials">
      <Group title="Header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          placeholder="What people say"
          testid="testi-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.title}
          onChange={(v) => onUpdate({ title: v })}
          testid="testi-title"
        />
        <TextAreaField
          label="Subheading (optional)"
          value={config.subheading || ""}
          onChange={(v) => onUpdate({ subheading: v })}
          rows={2}
          testid="testi-subheading"
        />
      </Group>

      <Group title="Layout">
        <SelectField
          label="Header alignment"
          value={config.textAlign || "left"}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Centre" },
            { value: "right", label: "Right" },
          ]}
          testid="testi-text-align"
        />
        <ToggleField
          label="Make wide"
          description="Stretch to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="testi-full-bleed"
        />
        <ToggleField
          label="Show star ratings"
          description="Hide if you don't collect per-quote ratings"
          checked={config.showRatings}
          onChange={(v) => onUpdate({ showRatings: v })}
          testid="testi-show-ratings"
        />
        <SliderField
          label="Scroll speed"
          value={config.speedSeconds}
          min={20}
          max={180}
          suffix="s per loop"
          onChange={(v) => onUpdate({ speedSeconds: v })}
          testid="testi-speed"
        />
        <SliderField
          label="Card width"
          value={config.cardWidth}
          min={220}
          max={520}
          suffix="px"
          onChange={(v) => onUpdate({ cardWidth: v })}
          testid="testi-card-w"
        />
        <SliderField
          label="Card gap"
          value={config.cardGap}
          min={0}
          max={80}
          suffix="px"
          onChange={(v) => onUpdate({ cardGap: v })}
          testid="testi-card-gap"
        />
        <SliderField
          label="Vertical padding"
          value={config.paddingY}
          min={0}
          max={160}
          suffix="px"
          onChange={(v) => onUpdate({ paddingY: v })}
          testid="testi-pad"
        />
        <SliderField
          label="Heading size"
          value={Number(config.headingSize) || 32}
          min={20}
          max={72}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="testi-heading-size"
        />
      </Group>

      <Group title="Theme">
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="testi-bg"
        />
        <ColorField
          label="Card background"
          value={config.cardBg}
          onChange={(v) => onUpdate({ cardBg: v })}
          testid="testi-card-bg"
        />
        <ColorField
          label="Heading color"
          value={config.titleColor}
          onChange={(v) => onUpdate({ titleColor: v })}
          testid="testi-title-color"
        />
        <ColorField
          label="Subheading color"
          value={config.bodyColor || "#64748b"}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="testi-body-color"
        />
        <ColorField
          label="Accent (stars & top bar)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="testi-accent"
        />
      </Group>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Testimonials ({(config.items || []).length})
        </h3>
        <ListEditor
          items={config.items || []}
          onAdd={addItem}
          onRemove={removeItem}
          onMove={moveItem}
          addLabel="Add testimonial"
          testidPrefix="testi"
          renderRow={(t) => (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-semibold text-slate-600">
                {t.avatar ? (
                  <img src={t.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (t.name || "?").slice(0, 1).toUpperCase()
                )}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">
                {t.name || "Untitled"}
              </p>
            </div>
          )}
          renderForm={(t) => (
            <>
              <TextAreaField
                label="Quote"
                value={t.quote}
                onChange={(v) => updateItem(t.id, { quote: v })}
                rows={4}
                testid={`testi-quote-${t.id}`}
              />
              <TextField
                label="Author name"
                value={t.name}
                onChange={(v) => updateItem(t.id, { name: v })}
                testid={`testi-name-${t.id}`}
              />
              <TextField
                label="Role / company"
                value={t.role}
                onChange={(v) => updateItem(t.id, { role: v })}
                placeholder="Head of eCommerce, Acme"
                testid={`testi-role-${t.id}`}
              />
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Avatar (optional)
                </Label>
                <ImageUpload
                  value={t.avatar}
                  onChange={(v) => updateItem(t.id, { avatar: v })}
                  testid={`testi-avatar-${t.id}`}
                  compact
                />
              </div>
              <TextField
                label="Avatar alt text (optional)"
                value={t.avatarAlt || ""}
                onChange={(v) => updateItem(t.id, { avatarAlt: v })}
                placeholder="Falls back to the author name"
                testid={`testi-avatar-alt-${t.id}`}
              />
              <SliderField
                label="Rating (0 to hide)"
                value={Number(t.rating) || 0}
                min={0}
                max={5}
                suffix=" stars"
                onChange={(v) => updateItem(t.id, { rating: v })}
                testid={`testi-rating-${t.id}`}
              />
            </>
          )}
        />
      </div>
    </FormAccordion>
  );
}

export const testimonials = {
  id: ID,
  name: "Testimonials",
  description: "Auto-scrolling customer quotes",
  icon: Quote,
  defaults,
  render,
  FormPanel,
};
