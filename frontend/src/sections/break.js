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
  safeUrl,
  wrapSnippet,
} from "./shared";
import { TextAreaField, SliderField, ToggleField } from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import { Label } from "@/components/ui/label";

const ID = "break";

const defaults = () => ({
  uid: makeUid(),
  heading:
    "Take the leap into a brighter future for your business — embrace efficiency, convenience, and profitability.",
  textColor: "#ffffff",
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
    `--ns-h:${cfg.height}px`,
    `--ns-text:${cfg.textColor}`,
    `--ns-size:${cfg.fontSize}px`,
    `--ns-overlay:${cfg.overlayColor}`,
    `--ns-overlay-op:${cfg.overlayOpacity}`,
  ].join(";");

  const css = `
${baseReset(cls)}
.${cls}{position:relative;width:100%;min-height:var(--ns-h);display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center;overflow:hidden;color:var(--ns-text)}
.${cls} .ns-overlay{position:absolute;inset:0;background:var(--ns-overlay);opacity:var(--ns-overlay-op);pointer-events:none}
.${cls} .ns-h{position:relative;z-index:2;max-width:900px;margin:0 auto;padding:40px 20px;color:var(--ns-text);font-size:var(--ns-size);line-height:1.3;font-weight:600;text-align:center}
@media (max-width:640px){.${cls} .ns-h{font-size:calc(var(--ns-size) * .75)}}
`.trim();

  const html = `<section class="ns-break ${cls}${fullBleedClass(cfg)}" style="${styleVars};background-image:url('${escAttr(safeUrl(cfg.image))}')">
  <div class="ns-overlay"></div>
  <h2 class="ns-h">${escHtml(cfg.heading)}</h2>
</section>`;

  const js = iife(cls, `/* static */`);
  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  return (
    <div className="space-y-3">
      <ToggleField
        label="Make wide"
        description="Stretch background to full viewport width"
        checked={config.fullBleed}
        onChange={(v) => onUpdate({ fullBleed: v })}
        testid="break-full-bleed"
      />
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
      <TextAreaField
        label="Heading"
        value={config.heading}
        onChange={(v) => onUpdate({ heading: v })}
        rows={3}
        testid="break-heading"
      />
      <ColorField
        label="Text color"
        value={config.textColor}
        onChange={(v) => onUpdate({ textColor: v })}
        testid="break-text"
      />
      <SliderField
        label="Font size"
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
    </div>
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
