/**
 * Featured Card — full-bleed background image with a translucent
 * "glass" card overlay holding eyebrow + headline + subhead + N
 * icon/title/body feature points + optional CTA. The recurring
 * "card-on-photo" pattern used on every modern B2B landing page.
 *
 * Card position uses the same 9-cell anchor grid as Welcome
 * (tl / tc / tr / cl / cc / cr / bl / bc / br) so the layout language
 * is consistent across the platform.
 *
 * Snippet is pure HTML+CSS — no JS interactions beyond native links.
 */
import { Layers } from "lucide-react";
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
import { ICON_OPTIONS, svgIcon } from "./iconLib";
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

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";

const ID = "featured-card";

const samplePoint = (i) => ({
  id: makeUid(),
  icon: ["check", "zap", "shield"][i] || "check",
  title: ["Feature one", "Feature two", "Feature three"][i] || `Feature ${i + 1}`,
  body: "Short supporting line that backs up the claim above.",
});

const defaults = () => ({
  uid: makeUid(),
  // Background image fills the whole section. Card overlay sits on top.
  image:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop",
  imageAlt: "",
  height: 520,
  overlayColor: "#0f172a",
  overlayOpacity: 0.35,
  // Card composition
  cardPosition: "cl", // tl tc tr cl cc cr bl bc br
  cardBg: "#ffffff",
  cardBgOpacity: 0.96, // 0-1
  cardBlur: 0, // px, optional frosted-glass effect
  cardRadius: 16,
  cardMaxWidth: 520,
  cardPadding: 32,
  // Copy
  eyebrow: "WHY CHOOSE US",
  heading: "A short, punchy headline that pulls the reader in.",
  accentHeading: "pulls the reader in.", // sub-string highlighted in accent
  subheading:
    "One or two supporting sentences explaining the value proposition.",
  // Feature points
  points: [samplePoint(0), samplePoint(1), samplePoint(2)],
  // CTA
  ctaLabel: "Get started",
  ctaUrl: "#",
  showCta: true,
  // Theme
  textColor: "#0f172a",
  bodyColor: "#475569",
  accentColor: "#E01839",
  ctaBg: "#E01839",
  ctaTextColor: "#ffffff",
  buttonRadius: 8,
  // Layout
  fullBleed: false,
  borderRadius: 0,
  // Outer spacing
  paddingTop: 0,
  paddingBottom: 0,
});

const POSITION_MAP = {
  tl: { align: "flex-start", justify: "flex-start", text: "left" },
  tc: { align: "flex-start", justify: "center", text: "left" },
  tr: { align: "flex-start", justify: "flex-end", text: "left" },
  cl: { align: "center", justify: "flex-start", text: "left" },
  cc: { align: "center", justify: "center", text: "left" },
  cr: { align: "center", justify: "flex-end", text: "left" },
  bl: { align: "flex-end", justify: "flex-start", text: "left" },
  bc: { align: "flex-end", justify: "center", text: "left" },
  br: { align: "flex-end", justify: "flex-end", text: "left" },
};

function highlight(heading, accent, accentColor) {
  const safe = escHtml(heading || "");
  const phrase = (accent || "").trim();
  if (!phrase) return safe;
  const escPhrase = escHtml(phrase);
  if (!safe.includes(escPhrase)) return safe;
  return safe.replace(
    escPhrase,
    `<span style="color:${safeColor(accentColor, "#E01839")}">${escPhrase}</span>`
  );
}

function render(cfg = {}) {
  const c = { ...defaults(), ...cfg };
  const uid = c.uid || makeUid();
  const cls = `ns-fc-${uid}`;
  const pos = POSITION_MAP[c.cardPosition] || POSITION_MAP.cl;
  const accent = safeColor(c.accentColor, "#E01839");
  const cardBg = safeColor(c.cardBg, "#ffffff");
  const cardOp = Math.max(0, Math.min(1, num(c.cardBgOpacity, 0.96)));
  const overlayBg = safeColor(c.overlayColor, "#0f172a");
  const overlayOp = Math.max(0, Math.min(1, num(c.overlayOpacity, 0.35)));

  const styleVars = [
    `--ns-h:${num(c.height, 520)}px`,
    `--ns-pad:${num(c.cardPadding, 32)}px`,
    `--ns-radius:${num(c.cardRadius, 16)}px`,
    `--ns-card-w:${num(c.cardMaxWidth, 520)}px`,
    `--ns-card-bg:${cardBg}`,
    `--ns-card-op:${cardOp}`,
    `--ns-card-blur:${num(c.cardBlur, 0)}px`,
    `--ns-text:${safeColor(c.textColor, "#0f172a")}`,
    `--ns-body:${safeColor(c.bodyColor, "#475569")}`,
    `--ns-accent:${accent}`,
    `--ns-overlay:${overlayBg}`,
    `--ns-overlay-op:${overlayOp}`,
    `--ns-cta-bg:${safeColor(c.ctaBg, accent)}`,
    `--ns-cta-text:${safeColor(c.ctaTextColor, "#ffffff")}`,
    `--ns-btn-radius:${num(c.buttonRadius, 8)}px`,
    `--ns-section-radius:${num(c.borderRadius, 0)}px`,
  ].join(";");

  const pointsHtml = (c.points || [])
    .filter((p) => p && (p.title || p.body))
    .map(
      (p) => `
    <li class="ns-pt">
      <span class="ns-pt-icon" aria-hidden="true">${svgIcon(p.icon || "check", 22)}</span>
      <div class="ns-pt-text">
        ${p.title ? `<h3 class="ns-pt-title">${escHtml(p.title)}</h3>` : ""}
        ${p.body ? `<p class="ns-pt-body">${escHtml(p.body)}</p>` : ""}
      </div>
    </li>`
    )
    .join("");

  const ctaHtml =
    c.showCta && c.ctaLabel
      ? `<a class="ns-cta" href="${escAttr(safeUrl(c.ctaUrl) || "#")}">${escHtml(c.ctaLabel)}</a>`
      : "";

  const css = `
${baseReset(cls)}
.${cls}{position:relative;width:100%;min-height:var(--ns-h);background-size:cover;background-position:center;overflow:hidden;border-radius:var(--ns-section-radius);color:var(--ns-text);display:flex;align-items:${pos.align};justify-content:${pos.justify};padding:clamp(16px,3vw,40px);box-sizing:border-box}
.${cls} .ns-overlay{position:absolute;inset:0;background:var(--ns-overlay);opacity:var(--ns-overlay-op);pointer-events:none;z-index:1}
.${cls} .ns-card{position:relative;z-index:2;max-width:min(var(--ns-card-w),100%);width:100%;padding:var(--ns-pad);border-radius:var(--ns-radius);background:color-mix(in srgb, var(--ns-card-bg) calc(var(--ns-card-op) * 100%), transparent);backdrop-filter:blur(var(--ns-card-blur));-webkit-backdrop-filter:blur(var(--ns-card-blur));text-align:${pos.text};box-sizing:border-box}
.${cls} .ns-eyebrow{margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--ns-accent)}
.${cls} .ns-heading{margin:0 0 14px;font-size:clamp(24px,3vw,40px);line-height:1.15;font-weight:700;letter-spacing:-0.01em;color:var(--ns-text)}
.${cls} .ns-sub{margin:0 0 22px;font-size:15px;line-height:1.6;color:var(--ns-body)}
.${cls} .ns-points{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
.${cls} .ns-pt{display:flex;gap:14px;align-items:flex-start;text-align:left}
.${cls} .ns-pt-icon{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;color:var(--ns-accent);background:color-mix(in srgb, var(--ns-accent) 12%, transparent)}
.${cls} .ns-pt-icon svg{width:22px;height:22px}
.${cls} .ns-pt-text{min-width:0}
.${cls} .ns-pt-title{margin:0 0 2px;font-size:15px;font-weight:600;color:var(--ns-text);line-height:1.3}
.${cls} .ns-pt-body{margin:0;font-size:13.5px;line-height:1.55;color:var(--ns-body)}
.${cls} .ns-cta{display:inline-flex;align-items:center;justify-content:center;margin-top:24px;padding:12px 22px;font-size:14px;font-weight:600;letter-spacing:.02em;color:var(--ns-cta-text);background:var(--ns-cta-bg);border-radius:var(--ns-btn-radius);text-decoration:none;transition:transform .18s ease,opacity .18s ease}
.${cls} .ns-cta:hover{transform:translateY(-1px);opacity:.95}
@media (max-width:780px){
  .${cls}{padding:16px;align-items:flex-end;justify-content:flex-start;min-height:auto}
  .${cls} .ns-card{padding:24px;max-width:100%}
  .${cls} .ns-heading{font-size:22px}
}
`.trim();

  const html = `<section class="ns-featured-card ${cls}${fullBleedClass(c)}" style="${styleVars};background-image:url('${escAttr(safeUrl(c.image))}')" role="img"${c.imageAlt ? ` aria-label="${escAttr(c.imageAlt)}"` : ""} data-ns-group="bg">
  <div class="ns-overlay"></div>
  <div class="ns-card" data-ns-group="card">
    <div data-ns-group="header">
    ${c.eyebrow ? `<p class="ns-eyebrow">${escHtml(c.eyebrow)}</p>` : ""}
    ${c.heading ? `<h2 class="ns-heading">${highlight(c.heading, c.accentHeading, c.accentColor)}</h2>` : ""}
    ${c.subheading ? `<p class="ns-sub">${escHtml(c.subheading)}</p>` : ""}
    </div>
    ${pointsHtml ? `<ul class="ns-points" data-ns-group="points">${pointsHtml}</ul>` : ""}
    <div data-ns-group="cta">${ctaHtml}</div>
  </div>
</section>`;

  const js = iife(cls, `/* static */`);
  const out = wrapSnippet({ html, css, js });
  const padTop = padTopOf(c, 0);
  const padBot = padBotOf(c, 0);
  if (!padTop && !padBot) return out;
  return `<div style="padding-top:${padTop}px;padding-bottom:${padBot}px">${out}</div>`;
}

function FormPanel({ config, onUpdate }) {
  const points = config.points || [];
  const updatePoint = (id, patch) =>
    onUpdate({ points: points.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const addPoint = () =>
    onUpdate({ points: [...points, samplePoint(points.length)] });
  const removePoint = (id) =>
    onUpdate({ points: points.filter((p) => p.id !== id) });
  const reorderPoints = (next) => onUpdate({ points: next });

  return (
    <FormAccordion sectionType="featured-card">
      <Group title="Background image" value="bg">
        <ImageUpload
          label="Image"
          value={config.image}
          onChange={(url) => onUpdate({ image: url })}
          testid="fc-image"
        />
        <TextField
          label="Image alt text"
          value={config.imageAlt}
          onChange={(v) => onUpdate({ imageAlt: v })}
          testid="fc-image-alt"
        />
        <SliderField
          label="Section height"
          value={config.height}
          min={300}
          max={900}
          step={10}
          suffix="px"
          onChange={(v) => onUpdate({ height: v })}
          testid="fc-height"
        />
        <ColorField
          label="Overlay colour"
          value={config.overlayColor}
          onChange={(v) => onUpdate({ overlayColor: v })}
          testid="fc-overlay-color"
        />
        <SliderField
          label="Overlay opacity"
          value={Number(config.overlayOpacity) * 100}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => onUpdate({ overlayOpacity: v / 100 })}
          testid="fc-overlay-opacity"
        />
      </Group>

      <Group title="Card" value="card">
        <SelectField
          label="Card position"
          value={config.cardPosition || "cl"}
          onChange={(v) => onUpdate({ cardPosition: v })}
          options={[
            { value: "tl", label: "Top left" },
            { value: "tc", label: "Top center" },
            { value: "tr", label: "Top right" },
            { value: "cl", label: "Middle left" },
            { value: "cc", label: "Middle center" },
            { value: "cr", label: "Middle right" },
            { value: "bl", label: "Bottom left" },
            { value: "bc", label: "Bottom center" },
            { value: "br", label: "Bottom right" },
          ]}
          testid="fc-card-position"
        />
        <SliderField
          label="Card max width"
          value={config.cardMaxWidth}
          min={320}
          max={800}
          step={10}
          suffix="px"
          onChange={(v) => onUpdate({ cardMaxWidth: v })}
          testid="fc-card-maxw"
        />
        <SliderField
          label="Card padding"
          value={config.cardPadding}
          min={16}
          max={64}
          suffix="px"
          onChange={(v) => onUpdate({ cardPadding: v })}
          testid="fc-card-pad"
        />
        <SliderField
          label="Card corner radius"
          value={config.cardRadius}
          min={0}
          max={32}
          suffix="px"
          onChange={(v) => onUpdate({ cardRadius: v })}
          testid="fc-card-radius"
        />
        <ColorField
          label="Card background"
          value={config.cardBg}
          onChange={(v) => onUpdate({ cardBg: v })}
          testid="fc-card-bg"
        />
        <SliderField
          label="Card opacity"
          value={Number(config.cardBgOpacity) * 100}
          min={20}
          max={100}
          suffix="%"
          onChange={(v) => onUpdate({ cardBgOpacity: v / 100 })}
          testid="fc-card-opacity"
        />
        <SliderField
          label="Background blur (frosted glass)"
          value={config.cardBlur}
          min={0}
          max={24}
          suffix="px"
          onChange={(v) => onUpdate({ cardBlur: v })}
          testid="fc-card-blur"
        />
      </Group>

      <Group title="Header" value="header">
        <TextField
          label="Eyebrow"
          value={config.eyebrow}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="fc-eyebrow"
        />
        <TextAreaField
          label="Heading"
          value={config.heading}
          rows={2}
          onChange={(v) => onUpdate({ heading: v })}
          testid="fc-heading"
        />
        <TextField
          label="Accent phrase (highlighted in heading)"
          value={config.accentHeading}
          placeholder="Substring of the heading to colour with the accent"
          onChange={(v) => onUpdate({ accentHeading: v })}
          testid="fc-accent-heading"
        />
        <TextAreaField
          label="Subheading"
          value={config.subheading}
          rows={3}
          onChange={(v) => onUpdate({ subheading: v })}
          testid="fc-sub"
        />
      </Group>

      <Group title={`Feature points (${points.length})`} value="points">
        <ListEditor
          items={points}
          onAdd={addPoint}
          onRemove={removePoint}
          onReorder={reorderPoints}
          itemLabel={(p) => p.title || "Untitled point"}
          addLabel="Add point"
          testid="fc-points"
          renderRow={(p) => (
            <div className="text-xs font-medium text-slate-700 truncate">
              {p.title || "Untitled point"}
            </div>
          )}
          renderForm={(p) => (
            <>
              <SelectField
                label="Icon"
                value={p.icon || "check"}
                onChange={(v) => updatePoint(p.id, { icon: v })}
                options={ICON_OPTIONS}
                testid={`fc-point-icon-${p.id}`}
              />
              <TextField
                label="Title"
                value={p.title || ""}
                onChange={(v) => updatePoint(p.id, { title: v })}
                testid={`fc-point-title-${p.id}`}
              />
              <TextAreaField
                label="Body"
                value={p.body || ""}
                rows={2}
                onChange={(v) => updatePoint(p.id, { body: v })}
                testid={`fc-point-body-${p.id}`}
              />
            </>
          )}
        />
      </Group>

      <Group title="Call to action" value="cta">
        <ToggleField
          label="Show button"
          checked={config.showCta}
          onChange={(v) => onUpdate({ showCta: v })}
          testid="fc-show-cta"
        />
        {config.showCta && (
          <>
            <TextField
              label="Button label"
              value={config.ctaLabel}
              onChange={(v) => onUpdate({ ctaLabel: v })}
              testid="fc-cta-label"
            />
            <TextField
              label="Button URL"
              value={config.ctaUrl}
              onChange={(v) => onUpdate({ ctaUrl: v })}
              testid="fc-cta-url"
            />
          </>
        )}
      </Group>

      <Group title="Defaults" value="defaults">
        <ToggleField
          label="Make wide"
          description="Stretch section to full viewport width"
          checked={!!config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="fc-full-bleed"
        />
        {!config.fullBleed && (
          <SliderField
            label="Section corner radius"
            value={config.borderRadius}
            min={0}
            max={32}
            suffix="px"
            onChange={(v) => onUpdate({ borderRadius: v })}
            testid="fc-section-radius"
          />
        )}
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={0}
          max={160}
          testidPrefix="fc"
          showSide={false}
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <ColorField
          label="Heading colour"
          value={config.textColor}
          onChange={(v) => onUpdate({ textColor: v })}
          testid="fc-text-color"
        />
        <ColorField
          label="Body colour"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="fc-body-color"
        />
        <ColorField
          label="Accent (eyebrow, icons, highlight)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="fc-accent-color"
        />
        <ColorField
          label="Button background"
          value={config.ctaBg}
          onChange={(v) => onUpdate({ ctaBg: v })}
          testid="fc-cta-bg"
        />
        <ColorField
          label="Button text"
          value={config.ctaTextColor}
          onChange={(v) => onUpdate({ ctaTextColor: v })}
          testid="fc-cta-text-color"
        />
      </Group>
    </FormAccordion>
  );
}

export const featuredCard = {
  id: ID,
  name: "Featured Card",
  description: "Photo background with a translucent card holding copy, feature points and a CTA",
  icon: Layers,
  defaults,
  render,
  FormPanel,
};
