/**
 * Content Heading section — centered heading + max-width container.
 * No JS needed but we still emit an empty IIFE for consistency.
 */
import { AlignCenter } from "lucide-react";
import {
  baseReset,
  escHtml,
  fullBleedClass,
  iife,
  makeUid,
  wrapSnippet,
} from "./shared";
import {
  TextAreaField,
  SliderField,
  SelectField,
  ToggleField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";

const ID = "content";

const defaults = () => ({
  uid: makeUid(),
  heading:
    "From everyday essentials to tailored technology solutions, we help your business find, manage and scale the right IT.",
  color: "#1067a6",
  fontSize: 28,
  fontWeight: "600",
  paddingY: 60,
  maxWidth: 1200,
  textAlign: "center",
  fullBleed: false,
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-content-${uid}`;

  const styleVars = [
    `--ns-color:${cfg.color}`,
    `--ns-size:${cfg.fontSize}px`,
    `--ns-weight:${cfg.fontWeight}`,
    `--ns-pad:${cfg.paddingY}px`,
    `--ns-max:${cfg.maxWidth}px`,
    `--ns-align:${cfg.textAlign}`,
  ].join(";");

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad) 20px;width:100%}
.${cls} .ns-inner{max-width:var(--ns-max);margin:0 auto;text-align:var(--ns-align)}
.${cls} .ns-h{margin:0;font-size:var(--ns-size);font-weight:var(--ns-weight);line-height:1.35;color:var(--ns-color)}
@media (max-width:640px){.${cls} .ns-h{font-size:calc(var(--ns-size) * .8)}}
`.trim();

  const html = `<section class="ns-content ${cls}${fullBleedClass(cfg)}" style="${styleVars}">
  <div class="ns-inner"><h2 class="ns-h">${escHtml(cfg.heading)}</h2></div>
</section>`;

  const js = iife(cls, `/* static section, init marker only */`);
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
        testid="content-full-bleed"
      />
      <TextAreaField
        label="Heading"
        value={config.heading}
        onChange={(v) => onUpdate({ heading: v })}
        rows={3}
        testid="content-heading"
      />
      <ColorField
        label="Color"
        value={config.color}
        onChange={(v) => onUpdate({ color: v })}
        testid="content-color"
      />
      <SliderField
        label="Font size"
        value={config.fontSize}
        min={16}
        max={56}
        suffix="px"
        onChange={(v) => onUpdate({ fontSize: v })}
        testid="content-size"
      />
      <SelectField
        label="Font weight"
        value={config.fontWeight}
        onChange={(v) => onUpdate({ fontWeight: v })}
        options={[
          { value: "400", label: "Regular" },
          { value: "500", label: "Medium" },
          { value: "600", label: "Semibold" },
          { value: "700", label: "Bold" },
        ]}
        testid="content-weight"
      />
      <SelectField
        label="Alignment"
        value={config.textAlign}
        onChange={(v) => onUpdate({ textAlign: v })}
        options={[
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ]}
        testid="content-align"
      />
      <SliderField
        label="Vertical padding"
        value={config.paddingY}
        min={10}
        max={120}
        suffix="px"
        onChange={(v) => onUpdate({ paddingY: v })}
        testid="content-pad"
      />
      <SliderField
        label="Max width"
        value={config.maxWidth}
        min={600}
        max={1400}
        step={10}
        suffix="px"
        onChange={(v) => onUpdate({ maxWidth: v })}
        testid="content-max"
      />
    </div>
  );
}

export const content = {
  id: ID,
  name: "Content Heading",
  description: "Centered heading block",
  icon: AlignCenter,
  defaults,
  render,
  FormPanel,
};
