/**
 * Feature Grid — N feature cards with optional icon/image, title,
 * short intro and rich-text body.
 *
 * Self-contained: no JS, just scoped CSS. Icons can be drawn from the
 * in-tree ICON_LIBRARY OR replaced per-card with an uploaded image
 * (same ImageUpload component used elsewhere). The body is authored
 * via the shared RichTextEditor so authors can bold / italicise / list
 * / link / align per-paragraph — same toolset and trust model as the
 * FAQ answer field.
 *
 * Alignment is layered:
 *   1. `textAlign`             — section header default (desktop)
 *   2. `textAlignMobile`       — override for ≤640px
 *   3. `cardTextAlign`         — card body default (desktop), "" inherits header
 *   4. `cardTextAlignMobile`   — card body override on mobile, "" inherits desktop card
 *   5. Per-paragraph `<p style="text-align:right">` inside the rich-text body
 *      beats everything else because inline styles win the cascade.
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
  padXOf,
  richBodyResetCss,
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
import RichTextEditor from "@/components/RichTextEditor";
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";
const ID = "feature-grid";

/**
 * Body-content coercion: lifted from FAQ. Anything that already looks
 * like HTML passes through; plain-text (saved by older Feature Grids
 * before this field was a rich-text editor) is split on blank lines
 * into `<p>` paragraphs with `<br/>`s for soft breaks. Means existing
 * snippets keep rendering byte-identically.
 */
function coerceBodyHtml(body) {
  const s = String(body || "");
  if (!s.trim()) return "";
  if (/<\/?[a-z][\s\S]*>/i.test(s)) return s;
  return s
    .split(/\n{2,}/)
    .map((para) => `<p>${escHtml(para).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

const sampleFeature = (i) => ({
  id: makeUid(),
  // Both `icon` and `image` are persisted on every feature so switching
  // `cardLayout` or `iconSource` back and forth never loses data.
  iconSource: "library", // "library" | "image"
  icon: ["zap", "shield", "layers", "code"][i % 4],
  image: "",
  imageAlt: "",
  title: ["Lightning fast", "Secure by default", "Composable", "Developer-friendly"][i % 4],
  intro: "",
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
  textAlign: "left", // "left" | "center" | "right" — header default (desktop)
  textAlignMobile: "", // "" inherits desktop · "left" | "center" | "right"
  cardTextAlign: "", // "" inherits header · "left" | "center" | "right"
  cardTextAlignMobile: "", // "" inherits desktop card align
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
    .map((f, idx) => {
      const introHtml = f.intro
        ? `<p class="ns-intro">${escHtml(f.intro)}</p>`
        : "";
      const titleHtml = `<h3 class="ns-title">${escHtml(f.title || "")}</h3>`;
      const bodyHtml = `<div class="ns-body">${coerceBodyHtml(f.body)}</div>`;

      if (cardLayout !== "icon") {
        const imgUrl = safeUrl(f.image);
        const imgHtml = imgUrl
          ? `<img src="${escAttr(imgUrl)}" alt="${escAttr(f.imageAlt || f.title || "")}"/>`
          : "";
        return `<article class="ns-card${layoutMod}" data-ns-list="feature" data-ns-item="${idx}"><div class="ns-image-wrap">${imgHtml}</div><div class="ns-card-body">${titleHtml}${introHtml}${bodyHtml}</div></article>`;
      }
      // Icon-mode card. `iconSource` decides whether the 36×36 box
      // shows a library SVG or the per-card uploaded image — the box
      // chrome stays put either way so cards stay visually aligned.
      const useImg = f.iconSource === "image";
      const customImgUrl = useImg ? safeUrl(f.image) : "";
      let iconBox = "";
      if (useImg && customImgUrl) {
        iconBox = `<div class="ns-icon-box is-img" aria-hidden="true"><img src="${escAttr(
          customImgUrl
        )}" alt="${escAttr(f.imageAlt || f.title || "")}"/></div>`;
      } else if (!useImg) {
        const iconHtml = svgIcon(f.icon || "none", 18);
        if (iconHtml) iconBox = `<div class="ns-icon-box" aria-hidden="true">${iconHtml}</div>`;
      }
      return `<article class="ns-card" data-ns-list="feature" data-ns-item="${idx}">${iconBox}${titleHtml}${introHtml}${bodyHtml}</article>`;
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
  )}" data-ns-group="defaults"><div class="ns-inner"><header class="ns-head" data-ns-group="header"><div class="ns-head-inner">${eyebrowHtml}<h2 class="ns-heading">${escHtml(
    cfg.heading || ""
  )}</h2>${subHtml}</div></header><div class="ns-grid">${featuresHtml}</div></div></section>`;

  const bg = safeColor(cfg.bgColor, "#ffffff");
  const textColor = safeColor(cfg.textColor, "#1f2937");
  const accent = safeColor(cfg.accentColor, "#E01839");
  const bodyColor = safeColor(cfg.bodyColor, "#64748b");
  // Alignment cascade: header → card body, desktop → mobile. Empty
  // string at any level means "inherit from the layer above".
  const allowedAligns = new Set(["left", "center", "right"]);
  const headAlign = allowedAligns.has(cfg.textAlign) ? cfg.textAlign : "left";
  const headAlignM = allowedAligns.has(cfg.textAlignMobile) ? cfg.textAlignMobile : headAlign;
  const cardAlign = allowedAligns.has(cfg.cardTextAlign) ? cfg.cardTextAlign : headAlign;
  const cardAlignM = allowedAligns.has(cfg.cardTextAlignMobile) ? cfg.cardTextAlignMobile : cardAlign;
  const padTop = padTopOf(cfg, 80);
  const padBot = padBotOf(cfg, 80);
  const padX = padXOf(cfg);
  const isSolid = cfg.cardStyle === "solid";

  const css = `
${baseReset(cls)}
.${cls}{padding:${padTop}px ${padX}px ${padBot}px;background:${bg};color:${textColor}}
.${cls} .ns-inner{max-width:1200px;margin:0 auto;text-align:${headAlign}}
.${cls} .ns-head{margin-bottom:48px}
.${cls} .ns-head-inner{max-width:720px;${headAlign === "center" ? "margin:0 auto;" : headAlign === "right" ? "margin:0 0 0 auto;" : ""}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${accent};margin-bottom:14px}
.${cls} .ns-heading{font-size:${num(cfg.headingSize, 32)}px;font-weight:600;letter-spacing:-0.01em;line-height:1.15;color:${textColor}}
.${cls} .ns-sub{margin-top:14px;font-size:16px;color:${bodyColor};line-height:1.6}
.${cls} .ns-grid{display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:16px}
.${cls} .ns-card{${cardBase};border-radius:8px;padding:28px;text-align:${cardAlign};transition:border-color .18s ease,transform .18s ease}
.${cls} .ns-card:hover{${cardHover};transform:translateY(-2px)}
.${cls} .ns-icon-box{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${accent}1a;color:${accent};margin-bottom:20px;overflow:hidden;${cardAlign === "center" ? "margin-left:auto;margin-right:auto;" : cardAlign === "right" ? "margin-left:auto;" : ""}}
.${cls} .ns-icon-box.is-img{background:transparent;padding:0}
.${cls} .ns-icon-box.is-img img{width:100%;height:100%;object-fit:cover;display:block}
.${cls} .ns-card .ns-title{font-size:16px;font-weight:600;letter-spacing:-0.005em;line-height:1.3;color:${isSolid ? "#fff" : textColor};margin-bottom:6px}
.${cls} .ns-card .ns-intro{font-size:14px;font-weight:500;line-height:1.45;color:${isSolid ? "rgba(255,255,255,0.85)" : textColor};margin:0 0 10px 0}
.${cls} .ns-card .ns-body{font-size:14px;line-height:1.6;color:${isSolid ? "rgba(255,255,255,0.7)" : bodyColor}}
${richBodyResetCss(`.${cls} .ns-card .ns-body`, { linkColor: accent })}
.${cls} .ns-card.is-image-top,.${cls} .ns-card.is-image-left{padding:0;overflow:hidden}
.${cls} .ns-card.is-image-top{display:flex;flex-direction:column}
.${cls} .ns-card.is-image-top .ns-image-wrap{width:100%;aspect-ratio:16/9;background:#f1f5f9;overflow:hidden}
.${cls} .ns-card.is-image-top .ns-card-body{padding:24px 24px 26px;text-align:${cardAlign}}
.${cls} .ns-card.is-image-left{display:flex;flex-direction:row;align-items:stretch}
.${cls} .ns-card.is-image-left .ns-image-wrap{flex:0 0 130px;align-self:stretch;background:#f1f5f9;overflow:hidden}
.${cls} .ns-card.is-image-left .ns-card-body{padding:22px 24px;flex:1;display:flex;flex-direction:column;justify-content:center;text-align:${cardAlign}}
.${cls} .ns-card.is-image-top .ns-image-wrap img,.${cls} .ns-card.is-image-left .ns-image-wrap img{width:100%;height:100%;object-fit:cover;display:block}
@media (max-width:1024px){.${cls} .ns-grid{grid-template-columns:repeat(${Math.min(cols, 2)},minmax(0,1fr))}}
@media (max-width:640px){.${cls} .ns-grid{grid-template-columns:1fr}.${cls} .ns-inner{text-align:${headAlignM}}.${cls} .ns-head-inner{${headAlignM === "center" ? "margin:0 auto;" : headAlignM === "right" ? "margin:0 0 0 auto;" : "margin:0;"}}.${cls} .ns-card{text-align:${cardAlignM}}.${cls} .ns-card .ns-icon-box{${cardAlignM === "center" ? "margin-left:auto;margin-right:auto;" : cardAlignM === "right" ? "margin-left:auto;margin-right:0;" : "margin-left:0;margin-right:auto;"}}.${cls} .ns-card.is-image-left{flex-direction:column}.${cls} .ns-card.is-image-left .ns-image-wrap{flex-basis:auto;width:100%;aspect-ratio:16/9}}
`.trim();

  return wrapSnippet({ html, css, js: "" });
};

function FormPanel({ config, onUpdate, previewMode }) {
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
  const duplicateFeature = (id) => {
    const idx = features.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const clone = { ...features[idx], id: makeUid() };
    const next = [...features];
    next.splice(idx + 1, 0, clone);
    onUpdate({ features: next });
  };
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
            { value: "right", label: "Right" },
          ]}
          testid="fg-text-align"
        />
        {previewMode === "mobile" && (
          <SelectField
            label="Header alignment (mobile)"
            value={config.textAlignMobile || ""}
            onChange={(v) => onUpdate({ textAlignMobile: v })}
            options={[
              { value: "", label: "Inherit from desktop" },
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            testid="fg-text-align-mobile"
          />
        )}
        <SelectField
          label="Card text alignment"
          value={config.cardTextAlign || ""}
          onChange={(v) => onUpdate({ cardTextAlign: v })}
          options={[
            { value: "", label: "Inherit from header" },
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          testid="fg-card-align"
        />
        {previewMode === "mobile" && (
          <SelectField
            label="Card text alignment (mobile)"
            value={config.cardTextAlignMobile || ""}
            onChange={(v) => onUpdate({ cardTextAlignMobile: v })}
            options={[
              { value: "", label: "Inherit from desktop" },
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            testid="fg-card-align-mobile"
          />
        )}
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
          onDuplicate={duplicateFeature}
          itemLabel={(f) => f.title || "Untitled feature"}
          addLabel="Add feature"
          testidPrefix="feature"
          renderRow={(f) => (
            <div className="text-xs font-medium text-slate-700 truncate">
              {f.title || "Untitled feature"}
            </div>
          )}
          renderForm={(f) => {
            // Effective card body alignment for the RichTextEditor's
            // toolbar default. Mirrors the same cascade the renderer
            // uses so the editor's "align" indicator matches what the
            // visitor will see.
            const allowed = new Set(["left", "center", "right"]);
            const headA = allowed.has(config.textAlign) ? config.textAlign : "left";
            const cardA = allowed.has(config.cardTextAlign) ? config.cardTextAlign : headA;
            const layout = config.cardLayout || "icon";
            const useImage = layout === "icon" && f.iconSource === "image";
            return (
              <>
                {layout === "icon" ? (
                  <>
                    <SelectField
                      label="Icon source"
                      value={f.iconSource || "library"}
                      onChange={(v) => updateFeature(f.id, { iconSource: v })}
                      options={[
                        { value: "library", label: "Library icon" },
                        { value: "image", label: "Custom image (upload or URL)" },
                      ]}
                      testid={`fg-icon-source-${f.id}`}
                    />
                    {useImage ? (
                      <>
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Icon image
                          </Label>
                          <ImageUpload
                            value={f.image || ""}
                            onChange={(v) => updateFeature(f.id, { image: v })}
                            testid={`fg-icon-image-${f.id}`}
                            compact
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            Renders inside the existing 36×36 box. Square images look best.
                          </p>
                        </div>
                        <TextField
                          label="Image alt (optional)"
                          value={f.imageAlt || ""}
                          onChange={(v) => updateFeature(f.id, { imageAlt: v })}
                          placeholder="Falls back to the title"
                          testid={`fg-icon-image-alt-${f.id}`}
                        />
                      </>
                    ) : (
                      <SelectField
                        label="Icon"
                        value={f.icon || "none"}
                        onChange={(v) => updateFeature(f.id, { icon: v })}
                        options={ICON_OPTIONS}
                        testid={`fg-icon-${f.id}`}
                      />
                    )}
                  </>
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
                <TextField
                  label="Intro (optional)"
                  value={f.intro || ""}
                  onChange={(v) => updateFeature(f.id, { intro: v })}
                  placeholder="Short lead-in line between title and body"
                  testid={`fg-intro-${f.id}`}
                />
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Body</Label>
                  <RichTextEditor
                    html={coerceBodyHtml(f.body)}
                    onChange={(v) => updateFeature(f.id, { body: v })}
                    tools={["bold", "italic", "ul", "ol", "link", "align"]}
                    inheritedAlign={cardA}
                  />
                  <p className="text-[11px] text-slate-500">
                    Select text and use the toolbar to add links, bold, italics or
                    per-paragraph alignment. Per-paragraph align overrides the
                    card-level alignment.
                  </p>
                </div>
              </>
            );
          }}
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
