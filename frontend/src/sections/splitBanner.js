/**
 * Split Banner — two-column block: coloured/gradient panel (logo,
 * heading, subheading, optional CTA) on one side, image on the other.
 * Static (no carousel).
 *
 * Layout contract when `fullBleed` is enabled:
 *  - Section stretches to 100vw (via the shared `is-full` modifier).
 *  - The IMAGE column fills its allocated viewport half edge-to-edge.
 *  - The PANEL background fills its viewport half edge-to-edge.
 *  - But the panel's CONTENT (logo + headings + CTA) is constrained to
 *    sit inside the host site's content gutter — i.e. flush with where
 *    a `max-width: contentMaxWidth` container would start/end. This
 *    prevents the text drifting to the far viewport edge on wide
 *    monitors while still letting the colour + image bleed.
 *
 * The alignment trick: outer panel column has its inner padding set to
 * the gutter that an equivalent centred container would produce —
 * `max(20px, (100vw - contentMaxWidth) / 2)`. When the section is not
 * full-bleed the whole thing sits inside a normal centred wrapper, so
 * the simple symmetric padding inside the panel applies.
 */
import { Columns2 } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
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
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
const ID = "split-banner";

const defaults = () => ({
  uid: makeUid(),
  // Content — kept generic. Brand Kit overlays colours, logo, font and
  // eyebrow at new-section creation; copy + image stay as the user types
  // them.
  eyebrow: "",
  heading: "Your headline goes here",
  subheading: "",
  logoUrl: "",
  logoAlt: "",
  logoMaxWidth: 180,
  ctaText: "",
  ctaLink: "#",
  ctaOpenInSameTab: false,
  image:
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1600&auto=format&fit=crop",
  imageAlt: "",
  // Layout
  imageSide: "right", // "left" | "right"
  panelRatio: 50, // 40 | 50 | 60 (% width of panel)
  height: 420, // px — min-height of the banner
  contentMaxWidth: 1200, // matches the host site's content gutter
  fullBleed: false,
  // Theme — panel. Defaults track DEFAULT_BRAND_KIT (secondary_color
  // for solid panel, primary→secondary for gradient).
  panelBgType: "solid", // "solid" | "gradient"
  panelBg: "#1f2937",
  gradientFrom: "#E01839",
  gradientTo: "#1f2937",
  gradientAngle: 135,
  // Theme — text
  titleColor: "#ffffff",
  subtitleColor: "rgba(255,255,255,0.92)",
  eyebrowColor: "#E01839",
  // Theme — CTA
  ctaBg: "#E01839",
  ctaTextColor: "#ffffff",
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-split-banner-${uid}`;

  const imageSide = cfg.imageSide === "left" ? "left" : "right";
  const ratio = Math.max(30, Math.min(70, num(cfg.panelRatio, 50)));
  const panelPct = ratio;
  const imagePct = 100 - ratio;
  const height = num(cfg.height, 420);
  const contentMax = num(cfg.contentMaxWidth, 1200);
  const logoMaxW = num(cfg.logoMaxWidth, 180);

  const panelBg =
    cfg.panelBgType === "solid"
      ? safeColor(cfg.panelBg, "#0267d7")
      : `linear-gradient(${num(cfg.gradientAngle, 135)}deg, ${safeColor(
          cfg.gradientFrom,
          "#0267d7"
        )} 0%, ${safeColor(cfg.gradientTo, "#0b3e80")} 100%)`;

  const logoUrl = safeUrl(cfg.logoUrl);
  const imageUrl = safeUrl(cfg.image);
  const cta = (cfg.ctaText || "").trim();
  const ctaHref = safeUrl(cfg.ctaLink || "#");
  const ctaTarget = cfg.ctaOpenInSameTab ? "_self" : "_blank";
  const ctaRel = cfg.ctaOpenInSameTab ? "" : ' rel="noopener noreferrer"';

  // Column order in source = visual order. When image is on the left we
  // emit it before the panel in source so flow + reading order match.
  const gridCols =
    imageSide === "left"
      ? `${imagePct}% ${panelPct}%`
      : `${panelPct}% ${imagePct}%`;

  const panelHtml = `<div class="ns-panel is-side-${imageSide === "left" ? "right" : "left"}">
  <div class="ns-panel-inner">
    ${logoUrl ? `<img class="ns-logo" src="${escAttr(logoUrl)}" alt="${escAttr(cfg.logoAlt || "")}"${cfg.logoAlt ? "" : ' aria-hidden="true"'}/>` : ""}
    ${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}
    ${cfg.heading ? `<h2 class="ns-title">${escHtml(cfg.heading)}</h2>` : ""}
    ${cfg.subheading ? `<p class="ns-subtitle">${escHtml(cfg.subheading)}</p>` : ""}
    ${cta ? `<a class="ns-cta" href="${escAttr(ctaHref)}" target="${ctaTarget}"${ctaRel}>${escHtml(cta)}</a>` : ""}
  </div>
</div>`;

  const imageHtml = `<div class="ns-image-wrap">${
    imageUrl ? `<img src="${escAttr(imageUrl)}" alt="${escAttr(cfg.imageAlt || cfg.heading || "")}"/>` : ""
  }</div>`;

  const html = `<section class="ns-split-banner ${cls}${fullBleedClass(cfg)}">
  <div class="ns-grid">
    ${imageSide === "left" ? imageHtml + panelHtml : panelHtml + imageHtml}
  </div>
</section>`;

  // The gutter calc: when full-bleed, the panel column gets extra
  // padding on its OUTER edge (left edge when panel is on left, right
  // edge when on right) so its content lines up with where the centred
  // content column would start.
  // Inner padding (the side facing the image) stays at a fixed visual
  // gap so the text doesn't crash into the image. When NOT full-bleed
  // the outer wrapper already constrains to contentMaxWidth and the
  // panel just uses symmetric padding.
  const css = `
${baseReset(cls)}
.${cls}{position:relative;width:100%;background:#fff;overflow:hidden}
.${cls} .ns-grid{display:grid;grid-template-columns:${gridCols};height:${height}px;min-height:${height}px;align-items:stretch}
.${cls} .ns-panel{background:${panelBg};color:${safeColor(cfg.titleColor, "#ffffff")};display:flex;flex-direction:column;justify-content:center;min-width:0;padding:24px 48px;overflow:hidden;height:100%}
.${cls} .ns-panel-inner{width:100%;max-width:${Math.floor(contentMax / 2)}px}
.${cls} .ns-logo{display:block;max-height:48px;max-width:${logoMaxW}px;width:auto;height:auto;margin:0 0 12px;object-fit:contain}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${safeColor(cfg.eyebrowColor, "#ffffff")};margin:0 0 8px;opacity:.9}
.${cls} .ns-title{font-size:${cfg.headingSize ? `${num(cfg.headingSize, 36)}px` : "clamp(1.4rem,3vw,2.4rem)"};font-weight:700;line-height:1.15;letter-spacing:-.02em;color:${safeColor(cfg.titleColor, "#ffffff")};margin:0 0 10px}
.${cls} .ns-subtitle{font-size:clamp(.9rem,1.2vw,1.0625rem);line-height:1.5;color:${safeColor(cfg.subtitleColor, "rgba(255,255,255,0.92)")};margin:0 0 14px;max-width:560px}
.${cls} .ns-cta{display:inline-block;background:${safeColor(cfg.ctaBg, "#E01839")};color:${safeColor(cfg.ctaTextColor, "#ffffff")};padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px;transition:transform .15s ease,filter .15s ease;margin-top:4px}
.${cls} .ns-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}
.${cls} .ns-image-wrap{position:relative;min-width:0;background:#f7f7f8;overflow:hidden;height:100%}
.${cls} .ns-image-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.${cls}:not(.is-full) .ns-grid{max-width:${contentMax}px;margin:0 auto}
.${cls}.is-full .ns-panel.is-side-left{padding-left:max(20px,calc((100vw - ${contentMax}px) / 2));padding-right:48px}
.${cls}.is-full .ns-panel.is-side-right{padding-right:max(20px,calc((100vw - ${contentMax}px) / 2));padding-left:48px}
.${cls}.is-full .ns-panel.is-side-left .ns-panel-inner{margin-left:0;margin-right:auto}
.${cls}.is-full .ns-panel.is-side-right .ns-panel-inner{margin-left:auto;margin-right:0}
@media (max-width:767px){.${cls} .ns-grid{grid-template-columns:1fr;height:auto;min-height:auto;max-width:none}.${cls} .ns-image-wrap{order:1;min-height:220px;height:220px}.${cls} .ns-panel{order:2;padding:32px 24px!important;height:auto}.${cls} .ns-panel-inner{max-width:none;margin:0!important}.${cls} .ns-title{font-size:1.5rem}}
`.trim();

  return wrapSnippet({ html, css, js: "" });
}

function FormPanel({ config, onUpdate }) {
  return (
    <FormAccordion sectionType="split-banner">
      <Group title="Image">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Image
          </Label>
          <ImageUpload
            value={config.image}
            onChange={(v) => onUpdate({ image: v })}
            testid="split-image"
          />
        </div>
        <TextField
          label="Image alt text (optional)"
          value={config.imageAlt || ""}
          onChange={(v) => onUpdate({ imageAlt: v })}
          placeholder="Falls back to the heading"
          testid="split-image-alt"
        />
      </Group>

      <Group title="Panel content">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Logo (optional)
          </Label>
          <ImageUpload
            value={config.logoUrl}
            onChange={(v) => onUpdate({ logoUrl: v })}
            testid="split-logo"
            compact
          />
        </div>
        {config.logoUrl ? (
          <>
            <TextField
              label="Logo alt text (optional)"
              value={config.logoAlt || ""}
              onChange={(v) => onUpdate({ logoAlt: v })}
              placeholder="Leave blank if purely decorative"
              testid="split-logo-alt"
            />
            <SliderField
              label="Logo max width"
              value={config.logoMaxWidth || 180}
              min={80}
              max={320}
              suffix="px"
              onChange={(v) => onUpdate({ logoMaxWidth: v })}
              testid="split-logo-width"
            />
          </>
        ) : null}
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="split-eyebrow"
        />
        <TextAreaField
          label="Heading"
          value={config.heading}
          onChange={(v) => onUpdate({ heading: v })}
          rows={2}
          testid="split-heading"
        />
        <TextAreaField
          label="Subheading (optional)"
          value={config.subheading || ""}
          onChange={(v) => onUpdate({ subheading: v })}
          rows={2}
          testid="split-subheading"
        />
        <TextField
          label="CTA text (leave blank to hide)"
          value={config.ctaText || ""}
          onChange={(v) => onUpdate({ ctaText: v })}
          testid="split-cta-text"
        />
        {config.ctaText ? (
          <>
            <TextField
              label="CTA link"
              value={config.ctaLink || "#"}
              onChange={(v) => onUpdate({ ctaLink: v })}
              testid="split-cta-link"
            />
            <ToggleField
              label="Open in same tab"
              checked={!!config.ctaOpenInSameTab}
              onChange={(v) => onUpdate({ ctaOpenInSameTab: v })}
              testid="split-cta-same-tab"
            />
          </>
        ) : null}
      </Group>

      <Group title="Layout">
        <SelectField
          label="Image side"
          value={config.imageSide || "right"}
          onChange={(v) => onUpdate({ imageSide: v })}
          options={[
            { value: "right", label: "Image right of text" },
            { value: "left", label: "Image left of text" },
          ]}
          testid="split-image-side"
        />
        <SelectField
          label="Panel width"
          value={String(config.panelRatio || 50)}
          onChange={(v) => onUpdate({ panelRatio: Number(v) })}
          options={[
            { value: "40", label: "40% — image dominant" },
            { value: "50", label: "50% — balanced" },
            { value: "60", label: "60% — text dominant" },
          ]}
          testid="split-panel-ratio"
        />
        <SliderField
          label="Height"
          value={config.height || 420}
          min={150}
          max={680}
          step={10}
          suffix="px"
          onChange={(v) => onUpdate({ height: v })}
          testid="split-height"
        />
        <SliderField
          label="Content max width"
          value={config.contentMaxWidth || 1200}
          min={960}
          max={1440}
          step={20}
          suffix="px"
          onChange={(v) => onUpdate({ contentMaxWidth: v })}
          testid="split-content-max"
        />
        <SliderField
          label="Heading size"
          value={Number(config.headingSize) || 0}
          min={0}
          max={96}
          suffix={Number(config.headingSize) ? "px" : " (auto / responsive)"}
          onChange={(v) => onUpdate({ headingSize: v || 0 })}
          testid="split-heading-size"
        />
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width. Text stays aligned to the content column."
          checked={!!config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="split-full-bleed"
        />
      </Group>

      <Group title="Panel background">
        <SelectField
          label="Background style"
          value={config.panelBgType || "gradient"}
          onChange={(v) => onUpdate({ panelBgType: v })}
          options={[
            { value: "solid", label: "Solid colour" },
            { value: "gradient", label: "Linear gradient" },
          ]}
          testid="split-bg-type"
        />
        {(config.panelBgType || "gradient") === "gradient" ? (
          <>
            <ColorField
              label="Gradient from"
              value={config.gradientFrom}
              onChange={(v) => onUpdate({ gradientFrom: v })}
              testid="split-grad-from"
            />
            <ColorField
              label="Gradient to"
              value={config.gradientTo}
              onChange={(v) => onUpdate({ gradientTo: v })}
              testid="split-grad-to"
            />
            <SliderField
              label="Gradient angle"
              value={config.gradientAngle ?? 135}
              min={0}
              max={360}
              step={5}
              suffix="°"
              onChange={(v) => onUpdate({ gradientAngle: v })}
              testid="split-grad-angle"
            />
          </>
        ) : (
          <ColorField
            label="Panel colour"
            value={config.panelBg}
            onChange={(v) => onUpdate({ panelBg: v })}
            testid="split-panel-bg"
          />
        )}
      </Group>

      <Group title="Text & button colours">
        <ColorField
          label="Eyebrow colour"
          value={config.eyebrowColor}
          onChange={(v) => onUpdate({ eyebrowColor: v })}
          testid="split-eyebrow-color"
        />
        <ColorField
          label="Heading colour"
          value={config.titleColor}
          onChange={(v) => onUpdate({ titleColor: v })}
          testid="split-title-color"
        />
        <ColorField
          label="Subheading colour"
          value={config.subtitleColor}
          onChange={(v) => onUpdate({ subtitleColor: v })}
          testid="split-subtitle-color"
        />
        <ColorField
          label="Button background"
          value={config.ctaBg}
          onChange={(v) => onUpdate({ ctaBg: v })}
          testid="split-cta-bg"
        />
        <ColorField
          label="Button text"
          value={config.ctaTextColor}
          onChange={(v) => onUpdate({ ctaTextColor: v })}
          testid="split-cta-text-color"
        />
      </Group>
    </FormAccordion>
  );
}

export const splitBanner = {
  id: ID,
  name: "Split Banner",
  description: "Two-column banner — coloured/gradient panel + image",
  icon: Columns2,
  defaults,
  render,
  FormPanel,
};
