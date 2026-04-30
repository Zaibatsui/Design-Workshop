/**
 * Placeholder Grid — N boxes in M columns. Static, no JS interaction.
 */
import { LayoutGrid } from "lucide-react";
import { baseReset, fullBleedClass, iife, makeUid, wrapSnippet } from "./shared";
import { SliderField, SelectField, ToggleField } from "@/components/FormFields";
import ColorField from "@/components/ColorField";

const ID = "placeholder";

const defaults = () => ({
  uid: makeUid(),
  count: 4,
  columns: 2,
  itemHeight: 180,
  bgColor: "#fafafa",
  borderRadius: 6,
  paddingY: 60,
  gap: 20,
  fullBleed: false,
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-placeholder-${uid}`;

  const styleVars = [
    `--ns-cols:${cfg.columns}`,
    `--ns-h:${cfg.itemHeight}px`,
    `--ns-bg:${cfg.bgColor}`,
    `--ns-r:${cfg.borderRadius}px`,
    `--ns-pad:${cfg.paddingY}px`,
    `--ns-gap:${cfg.gap}px`,
  ].join(";");

  const itemsHtml = Array.from(
    { length: Math.max(1, Math.min(24, cfg.count)) },
    () => `<div class="ns-cell"></div>`
  ).join("");

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad) 20px;width:100%;background:#fff}
.${cls} .ns-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(var(--ns-cols),1fr);gap:var(--ns-gap)}
.${cls} .ns-cell{background:var(--ns-bg);height:var(--ns-h);border-radius:var(--ns-r)}
@media (max-width:768px){.${cls} .ns-grid{grid-template-columns:1fr}}
`.trim();

  const html = `<section class="ns-placeholder ${cls}${fullBleedClass(cfg)}" style="${styleVars}">
  <div class="ns-grid">${itemsHtml}</div>
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
        testid="placeholder-full-bleed"
      />
      <SliderField
        label="Items"
        value={config.count}
        min={1}
        max={12}
        onChange={(v) => onUpdate({ count: v })}
        testid="placeholder-count"
      />
      <SelectField
        label="Columns"
        value={config.columns}
        onChange={(v) => onUpdate({ columns: Number(v) })}
        options={[
          { value: 1, label: "1" },
          { value: 2, label: "2" },
          { value: 3, label: "3" },
          { value: 4, label: "4" },
        ]}
        testid="placeholder-cols"
      />
      <SliderField
        label="Item height"
        value={config.itemHeight}
        min={80}
        max={400}
        suffix="px"
        onChange={(v) => onUpdate({ itemHeight: v })}
        testid="placeholder-h"
      />
      <SliderField
        label="Gap"
        value={config.gap}
        min={0}
        max={48}
        suffix="px"
        onChange={(v) => onUpdate({ gap: v })}
        testid="placeholder-gap"
      />
      <SliderField
        label="Border radius"
        value={config.borderRadius}
        min={0}
        max={32}
        suffix="px"
        onChange={(v) => onUpdate({ borderRadius: v })}
        testid="placeholder-radius"
      />
      <SliderField
        label="Vertical padding"
        value={config.paddingY}
        min={10}
        max={120}
        suffix="px"
        onChange={(v) => onUpdate({ paddingY: v })}
        testid="placeholder-pad"
      />
      <ColorField
        label="Box color"
        value={config.bgColor}
        onChange={(v) => onUpdate({ bgColor: v })}
        testid="placeholder-bg"
      />
    </div>
  );
}

export const placeholder = {
  id: ID,
  name: "Placeholder Grid",
  description: "Grid of empty placeholder boxes",
  icon: LayoutGrid,
  defaults,
  render,
  FormPanel,
};
