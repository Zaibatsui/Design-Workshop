/**
 * Break Banner — full-width image with overlay + centered heading.
 */
import { Image as ImageIcon } from "lucide-react";
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
import { TextField, TextAreaField, SliderField, ToggleField } from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
const ID = "break";

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "",
  heading:
    "Take the leap into a brighter future for your business — embrace efficiency, convenience, and profitability.",
  textColor: "#ffffff",
  eyebrowColor: "#ffffff",
  fontSize: 34,
  height: 280,
  overlayColor: "#000000",
  overlayOpacity: 0.55,
  fullBleed: false,
  image:
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1600&auto=format&fit=crop",
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-break-${uid}`;

  const styleVars = [
    `--ns-h:${num(cfg.height, 280)}px`,
    `--ns-text:${safeColor(cfg.textColor, "#ffffff")}`,
    `--ns-eyebrow:${safeColor(cfg.eyebrowColor || cfg.textColor, "#ffffff")}`,
    `--ns-size:${num(cfg.fontSize, 34)}px`,
    `--ns-overlay:${safeColor(cfg.overlayColor, "#000000")}`,
    `--ns-overlay-op:${num(cfg.overlayOpacity, 0.55)}`,
  ].join(";");

  const css = `
${baseReset(cls)}
.${cls}{position:relative;width:100%;min-height:var(--ns-h);display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center;overflow:hidden;color:var(--ns-text)}
.${cls} .ns-overlay{position:absolute;inset:0;background:var(--ns-overlay);opacity:var(--ns-overlay-op);pointer-events:none}
.${cls} .ns-inner{position:relative;z-index:2;max-width:900px;margin:0 auto;padding:40px 20px;text-align:center}
.${cls} .ns-eyebrow{margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-eyebrow);opacity:0.9}
.${cls} .ns-h{margin:0;color:var(--ns-text);font-size:var(--ns-size);line-height:1.3;font-weight:600}
@media (max-width:640px){.${cls} .ns-h{font-size:calc(var(--ns-size) * .75)}}
`.trim();

  const html = `<section class="ns-break ${cls}${fullBleedClass(cfg)}" style="${styleVars};background-image:url('${escAttr(safeUrl(cfg.image))}')">
  <div class="ns-overlay"></div>
  <div class="ns-inner">
    ${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}
    <h2 class="ns-h">${escHtml(cfg.heading)}</h2>
  </div>
</section>`;

  const js = iife(cls, `/* static */`);
  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  return (
    <FormAccordion sectionType="break">
      <Group title="Header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="break-eyebrow"
        />
        <TextAreaField
          label="Heading"
          value={config.heading}
          onChange={(v) => onUpdate({ heading: v })}
          rows={3}
          testid="break-heading"
        />
      </Group>

      <Group title="Layout">
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="break-full-bleed"
        />
        <SliderField
          label="Heading size"
          value={config.fontSize}
          min={20}
          max={64}
          suffix="px"
          onChange={(v) => onUpdate({ fontSize: v })}
          testid="break-size"
        />
        <SliderField
          label="Section height"
          value={config.height}
          min={160}
          max={600}
          step={10}
          suffix="px"
          onChange={(v) => onUpdate({ height: v })}
          testid="break-h"
        />
      </Group>

      <Group title="Theme">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Background image
          </Label>
          <ImageUpload
            value={config.image}
            onChange={(v) => onUpdate({ image: v })}
            testid="break-image"
          />
        </div>
        <ColorField
          label="Eyebrow color"
          value={config.eyebrowColor || config.textColor}
          onChange={(v) => onUpdate({ eyebrowColor: v })}
          testid="break-eyebrow-color"
        />
        <ColorField
          label="Heading color"
          value={config.textColor}
          onChange={(v) => onUpdate({ textColor: v })}
          testid="break-text"
        />
        <ColorField
          label="Overlay color"
          value={config.overlayColor}
          onChange={(v) => onUpdate({ overlayColor: v })}
          testid="break-overlay"
        />
        <SliderField
          label="Overlay opacity"
          value={Math.round(config.overlayOpacity * 100)}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => onUpdate({ overlayOpacity: v / 100 })}
          testid="break-opacity"
        />
      </Group>
    </FormAccordion>
  );
}

export const breakBanner = {
  id: ID,
  name: "Break Banner",
  description: "Full-width image with overlay heading",
  icon: ImageIcon,
  defaults,
  render,
  FormPanel,
};
