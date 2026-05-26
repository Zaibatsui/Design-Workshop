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
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";
const ID = "feature-grid";

const sampleFeature = (i) => ({
  id: makeUid(),
  // Both `icon` and `image` are persisted on every feature so switching
  // `cardLayout` back and forth doesn't lose previously-entered data.
  icon: ["zap", "shield", "layers", "code"][i % 4],
  image: "",
  imageAlt: "",
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
  paddingTop: 80,
  paddingBottom: 80,
  fullBleed: false,
  // Layout
  columns: 4, // 2 | 3 | 4
  cardStyle: "outlined", // "outlined" | "tinted" | "solid"
  // `cardLayout` swaps between the icon-led card (current default) and
  // two image-led variants. Image-led cards make Feature Grid suitable
  // for "feature with hero image" / "use-case tile" patterns — same
  // mental model as Insights Grid but with the cleaner value-prop
  // headline rhythm Feature Grid is built around.
  cardLayout: "icon", // "icon" | "image-top" | "image-left"
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

  const cardLayout =
    cfg.cardLayout === "image-top" || cfg.cardLayout === "image-left"
      ? cfg.cardLayout
      : "icon";
  const layoutMod = cardLayout === "icon" ? "" : ` is-${cardLayout}`;

  const featuresHtml = (cfg.features || [])
    .map((f) => {
      // Image-led cards bypass the icon box entirely. We keep both
      // `icon` and `image` persisted on the feature record so the user
      // can flip cardLayout back to "icon" without losing data.
      if (cardLayout !== "icon") {
        const imgUrl = safeUrl(f.image);
        const imgHtml = imgUrl
          ? `<img src="${escAttr(imgUrl)}" alt="${escAttr(f.imageAlt || f.title || "")}"/>`
          : "";
        return `<article class="ns-card${layoutMod}"><div class="ns-image-wrap">${imgHtml}</div><div class="ns-card-body"><h3 class="ns-title">${escHtml(
          f.title || ""
        )}</h3><p class="ns-body">${escHtml(f.body || "")}</p></div></article>`;
      }
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

  const bg = safeColor(cfg.bgColor, "#ffffff");
  const textColor = safeColor(cfg.textColor, "#1f2937");
  const accent = safeColor(cfg.accentColor, "#E01839");
  const bodyColor = safeColor(cfg.bodyColor, "#64748b");
  const align = cfg.textAlign === "center" ? "center" : "left";
  const padTop = padTopOf(cfg, 80);
  const padBot = padBotOf(cfg, 80);
  const isSolid = cfg.cardStyle === "solid";

  const css = `
${baseReset(cls)}
.${cls}{padding:${padTop}px 20px ${padBot}px;background:${bg};color:${textColor}}
.${cls} .ns-inner{max-width:1200px;margin:0 auto;text-align:${align}}
.${cls} .ns-head{margin-bottom:48px}
.${cls} .ns-head-inner{max-width:720px;${align === "center" ? "margin:0 auto;" : ""}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${accent};margin-bottom:14px}
.${cls} .ns-heading{font-size:${num(cfg.headingSize, 32)}px;font-weight:600;letter-spacing:-0.01em;line-height:1.15;color:${textColor}}
.${cls} .ns-sub{margin-top:14px;font-size:16px;color:${bodyColor};line-height:1.6}
.${cls} .ns-grid{display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:16px}
.${cls} .ns-card{${cardBase};border-radius:8px;padding:28px;text-align:left;transition:border-color .18s ease,transform .18s ease}
.${cls} .ns-card:hover{${cardHover};transform:translateY(-2px)}
.${cls} .ns-icon-box{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${accent}1a;color:${accent};margin-bottom:20px}
.${cls} .ns-card .ns-title{font-size:16px;font-weight:600;letter-spacing:-0.005em;line-height:1.3;color:${isSolid ? "#fff" : textColor};margin-bottom:8px}
.${cls} .ns-card .ns-body{font-size:14px;line-height:1.6;color:${isSolid ? "rgba(255,255,255,0.7)" : bodyColor}}
.${cls} .ns-card.is-image-top,.${cls} .ns-card.is-image-left{padding:0;overflow:hidden}
.${cls} .ns-card.is-image-top{display:flex;flex-direction:column}
.${cls} .ns-card.is-image-top .ns-image-wrap{width:100%;aspect-ratio:16/9;background:#f1f5f9;overflow:hidden}
.${cls} .ns-card.is-image-top .ns-card-body{padding:24px 24px 26px}
.${cls} .ns-card.is-image-left{display:flex;flex-direction:row;align-items:stretch}
.${cls} .ns-card.is-image-left .ns-image-wrap{flex:0 0 130px;align-self:stretch;background:#f1f5f9;overflow:hidden}
.${cls} .ns-card.is-image-left .ns-card-body{padding:22px 24px;flex:1;display:flex;flex-direction:column;justify-content:center}
.${cls} .ns-card.is-image-top .ns-image-wrap img,.${cls} .ns-card.is-image-left .ns-image-wrap img{width:100%;height:100%;object-fit:cover;display:block}
@media (max-width:1024px){.${cls} .ns-grid{grid-template-columns:repeat(${Math.min(cols, 2)},minmax(0,1fr))}}
@media (max-width:640px){.${cls} .ns-grid{grid-template-columns:1fr}.${cls} .ns-card.is-image-left{flex-direction:column}.${cls} .ns-card.is-image-left .ns-image-wrap{flex-basis:auto;width:100%;aspect-ratio:16/9}}
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
    <FormAccordion sectionType="feature-grid">
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

      <Group title="Defaults" value="defaults">
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
          label="Card layout"
          value={config.cardLayout || "icon"}
          onChange={(v) => onUpdate({ cardLayout: v })}
          options={[
            { value: "icon", label: "Icon (top-left, framed)" },
            { value: "image-top", label: "Image (top of card, 16:9)" },
            { value: "image-left", label: "Image (left of card, square)" },
          ]}
          testid="fg-card-layout"
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
          label="Heading size"
          value={Number(config.headingSize) || 32}
          min={20}
          max={72}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="fg-heading-size"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={80}
          max={140}
          testidPrefix="fg"
        />
        <ToggleField
          label="Make wide"
          description="Stretch section to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="fg-full-bleed"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
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
              {(config.cardLayout || "icon") === "icon" ? (
                <SelectField
                  label="Icon"
                  value={f.icon || "none"}
                  onChange={(v) => updateFeature(f.id, { icon: v })}
                  options={ICON_OPTIONS}
                  testid={`fg-icon-${f.id}`}
                />
              ) : (
                <>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Image
                    </Label>
                    <ImageUpload
                      value={f.image || ""}
                      onChange={(v) => updateFeature(f.id, { image: v })}
                      testid={`fg-image-${f.id}`}
                      compact
                    />
                  </div>
                  <TextField
                    label="Image alt (optional)"
                    value={f.imageAlt || ""}
                    onChange={(v) => updateFeature(f.id, { imageAlt: v })}
                    placeholder="Falls back to the title"
                    testid={`fg-image-alt-${f.id}`}
                  />
                </>
              )}
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
    </FormAccordion>
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
