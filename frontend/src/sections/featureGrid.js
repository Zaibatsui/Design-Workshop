/**
 * Feature Grid — N feature cards with optional icon, title and body.
 * Use cases: "Why choose us", "What's included", value props.
 *
 * Self-contained: no JS, just scoped CSS and inline SVG icons drawn
 * from the in-tree ICON_LIBRARY (no external icon set required at
 * runtime in the embedded site).
 */
import { LayoutGrid } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  makeUid,
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
import ListEditor from "@/components/ListEditor";

const ID = "feature-grid";

const sampleFeature = (i) => ({
  id: makeUid(),
  icon: ["zap", "shield", "layers", "code"][i % 4],
  title: ["Lightning fast", "Secure by default", "Composable", "Developer-friendly"][i % 4],
  body: "Short paragraph that backs up the title — keep it under 25 words for visual rhythm across cards.",
});

const defaults = () => ({
  uid: makeUid(),
  // Section-level chrome
  eyebrow: "Why choose us",
  heading: "Built for teams that ship.",
  subheading: "Four reasons our customers stick around.",
  bgColor: "#ffffff",
  textColor: "#1f2937",
  bodyColor: "#64748b",
  accentColor: "#E01839",
  paddingY: 80,
  fullBleed: false,
  // Layout
  columns: 4, // 2 | 3 | 4
  cardStyle: "outlined", // "outlined" | "tinted" | "solid"
  textAlign: "left", // "left" | "center"
  features: [sampleFeature(0), sampleFeature(1), sampleFeature(2), sampleFeature(3)],
});

const render = (cfg) => {
  const uid = cfg.uid || makeUid();
  const cls = `ns-feature-grid-${uid}`;
  const cols = Math.max(1, Math.min(4, Number(cfg.columns) || 4));

  const cardBase =
    cfg.cardStyle === "tinted"
      ? "background:#f8fafc;border:1px solid transparent"
      : cfg.cardStyle === "solid"
        ? "background:#0f172a;color:#fff;border:1px solid #0f172a"
        : "background:#ffffff;border:1px solid #e2e8f0";
  const cardHover =
    cfg.cardStyle === "solid"
      ? "border-color:#fff"
      : "border-color:#cbd5e1";

  const featuresHtml = (cfg.features || [])
    .map((f) => {
      const iconHtml = svgIcon(f.icon || "none", 18);
      const iconBox = iconHtml
        ? `<div class="ns-icon-box" aria-hidden="true">${iconHtml}</div>`
        : "";
      return `<article class="ns-card">${iconBox}<h3 class="ns-title">${escHtml(
        f.title || ""
      )}</h3><p class="ns-body">${escHtml(f.body || "")}</p></article>`;
    })
    .join("");

  const eyebrowHtml = cfg.eyebrow
    ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>`
    : "";
  const subHtml = cfg.subheading
    ? `<p class="ns-sub">${escHtml(cfg.subheading)}</p>`
    : "";

  const html = `<section class="ns-feature-grid ${cls}${fullBleedClass(cfg)}" data-ns-uid="${escAttr(
    uid
  )}"><div class="ns-inner"><header class="ns-head"><div class="ns-head-inner">${eyebrowHtml}<h2 class="ns-heading">${escHtml(
    cfg.heading || ""
  )}</h2>${subHtml}</div></header><div class="ns-grid">${featuresHtml}</div></div></section>`;

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad,80px) 20px;background:${cfg.bgColor};color:${cfg.textColor};--ns-pad:${cfg.paddingY}px}
.${cls} .ns-inner{max-width:1200px;margin:0 auto;text-align:${cfg.textAlign}}
.${cls} .ns-head{margin-bottom:48px}
.${cls} .ns-head-inner{max-width:720px;${cfg.textAlign === "center" ? "margin:0 auto;" : ""}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${cfg.accentColor};margin-bottom:14px}
.${cls} .ns-heading{font-size:32px;font-weight:600;letter-spacing:-0.01em;line-height:1.15;color:${cfg.textColor}}
.${cls} .ns-sub{margin-top:14px;font-size:16px;color:${cfg.bodyColor};line-height:1.6}
.${cls} .ns-grid{display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:16px}
.${cls} .ns-card{${cardBase};border-radius:8px;padding:28px;text-align:left;transition:border-color .18s ease,transform .18s ease}
.${cls} .ns-card:hover{${cardHover};transform:translateY(-2px)}
.${cls} .ns-icon-box{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${cfg.accentColor}1a;color:${cfg.accentColor};margin-bottom:20px}
.${cls} .ns-card .ns-title{font-size:16px;font-weight:600;letter-spacing:-0.005em;line-height:1.3;color:${cfg.cardStyle === "solid" ? "#fff" : cfg.textColor};margin-bottom:8px}
.${cls} .ns-card .ns-body{font-size:14px;line-height:1.6;color:${cfg.cardStyle === "solid" ? "rgba(255,255,255,0.7)" : cfg.bodyColor}}
@media (max-width:1024px){.${cls} .ns-grid{grid-template-columns:repeat(${Math.min(cols, 2)},minmax(0,1fr))}}
@media (max-width:640px){.${cls} .ns-grid{grid-template-columns:1fr}}
`.trim();

  return wrapSnippet({ html, css, js: "" });
};

function FormPanel({ config, onUpdate }) {
  const features = config.features || [];
  const updateFeature = (id, patch) =>
    onUpdate({
      features: features.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  const addFeature = () =>
    onUpdate({
      features: [...features, sampleFeature(features.length)],
    });
  const removeFeature = (id) =>
    onUpdate({ features: features.filter((f) => f.id !== id) });
  const reorderFeatures = (next) => onUpdate({ features: next });

  return (
    <div className="space-y-6">
      <Group title="Header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="fg-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.heading}
          onChange={(v) => onUpdate({ heading: v })}
          testid="fg-heading"
        />
        <TextAreaField
          label="Subheading"
          value={config.subheading}
          onChange={(v) => onUpdate({ subheading: v })}
          testid="fg-sub"
        />
      </Group>

      <Group title="Layout">
        <SelectField
          label="Columns"
          value={String(config.columns)}
          onChange={(v) => onUpdate({ columns: Number(v) })}
          options={[
            { value: "2", label: "2 columns" },
            { value: "3", label: "3 columns" },
            { value: "4", label: "4 columns" },
          ]}
          testid="fg-columns"
        />
        <SelectField
          label="Card style"
          value={config.cardStyle}
          onChange={(v) => onUpdate({ cardStyle: v })}
          options={[
            { value: "outlined", label: "Outlined (white card, hairline border)" },
            { value: "tinted", label: "Tinted (light grey card)" },
            { value: "solid", label: "Solid (dark card, white text)" },
          ]}
          testid="fg-card-style"
        />
        <SelectField
          label="Header alignment"
          value={config.textAlign}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
          ]}
          testid="fg-text-align"
        />
        <SliderField
          label="Vertical padding"
          value={config.paddingY}
          min={20}
          max={140}
          suffix="px"
          onChange={(v) => onUpdate({ paddingY: v })}
          testid="fg-pad"
        />
        <ToggleField
          label="Make wide"
          description="Stretch section to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="fg-full-bleed"
        />
      </Group>

      <Group title="Theme">
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="fg-bg"
        />
        <ColorField
          label="Heading colour"
          value={config.textColor}
          onChange={(v) => onUpdate({ textColor: v })}
          testid="fg-text"
        />
        <ColorField
          label="Body colour"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="fg-body"
        />
        <ColorField
          label="Accent (eyebrow + icon tint)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="fg-accent"
        />
      </Group>

      <Group title={`Features (${features.length})`}>
        <ListEditor
          items={features}
          onReorder={reorderFeatures}
          onRemove={removeFeature}
          onAdd={addFeature}
          itemLabel={(f) => f.title || "Untitled feature"}
          addLabel="Add feature"
          testid="fg-features"
          renderRow={(f) => (
            <div className="text-xs font-medium text-slate-700 truncate">
              {f.title || "Untitled feature"}
            </div>
          )}
          renderForm={(f) => (
            <>
              <SelectField
                label="Icon"
                value={f.icon || "none"}
                onChange={(v) => updateFeature(f.id, { icon: v })}
                options={ICON_OPTIONS}
                testid={`fg-icon-${f.id}`}
              />
              <TextField
                label="Title"
                value={f.title}
                onChange={(v) => updateFeature(f.id, { title: v })}
                testid={`fg-title-${f.id}`}
              />
              <TextAreaField
                label="Body"
                value={f.body}
                onChange={(v) => updateFeature(f.id, { body: v })}
                testid={`fg-body-${f.id}`}
              />
            </>
          )}
        />
      </Group>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export const featureGrid = {
  id: ID,
  name: "Feature Grid",
  icon: LayoutGrid,
  description: "2-4 column value-prop cards with icon + title + body",
  defaults,
  render,
  FormPanel,
};
