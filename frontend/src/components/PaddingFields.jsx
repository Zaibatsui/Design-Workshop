/**
 * PaddingFields — paired "Top spacing" + "Bottom spacing" + "Side
 * padding" sliders for a section's outer padding. Replaces the older
 * single "Vertical padding" slider and exposes a horizontal-padding
 * knob so authors can tune the gap above, below AND on the sides of a
 * section from one compact block.
 *
 * Back-compat: when an older section only has `paddingY` saved, both
 * top + bottom sliders start at that legacy value. Touching either
 * slider writes the new `paddingTop` / `paddingBottom` fields without
 * clobbering `paddingY` — renderers resolve the effective value via
 * `padTopOf` / `padBotOf` in `sections/shared.js`. Side padding is a
 * new field (`paddingX`) with a default of 20 to mirror the literal
 * `20px` previously hardcoded in every renderer's CSS shorthand, so
 * snippets saved before this control existed render byte-identically.
 */
import { SliderField } from "@/components/FormFields";

export default function PaddingFields({
  config,
  onUpdate,
  defaultValue = 80,
  min = 0,
  max = 140,
  testidPrefix = "pad",
  showSide = true,
  sideDefault = 20,
  sideMax = 80,
}) {
  const fallback = config.paddingY ?? defaultValue;
  const top = config.paddingTop ?? fallback;
  const bot = config.paddingBottom ?? fallback;
  const side = config.paddingX ?? sideDefault;
  return (
    <>
      <SliderField
        label="Top spacing"
        value={top}
        min={min}
        max={max}
        suffix="px"
        onChange={(v) => onUpdate({ paddingTop: v })}
        testid={`${testidPrefix}-pad-top`}
      />
      <SliderField
        label="Bottom spacing"
        value={bot}
        min={min}
        max={max}
        suffix="px"
        onChange={(v) => onUpdate({ paddingBottom: v })}
        testid={`${testidPrefix}-pad-bot`}
      />
      {showSide && (
        <SliderField
          label="Side padding"
          value={side}
          min={0}
          max={sideMax}
          suffix="px"
          onChange={(v) => onUpdate({ paddingX: v })}
          testid={`${testidPrefix}-pad-x`}
        />
      )}
    </>
  );
}
