/**
 * PaddingFields — paired "Top spacing" + "Bottom spacing" sliders for a
 * section's outer vertical padding. Replaces the older single
 * "Vertical padding" slider so authors can fine-tune the gap above vs
 * below a section without having to nudge both sides together.
 *
 * Back-compat: when an older section only has `paddingY` saved, both
 * sliders start at that legacy value. Touching either slider writes the
 * new `paddingTop` / `paddingBottom` fields without clobbering `paddingY`
 * — renderers resolve the effective value via `padTopOf` / `padBotOf` in
 * `sections/shared.js`.
 */
import { SliderField } from "@/components/FormFields";

export default function PaddingFields({
  config,
  onUpdate,
  defaultValue = 80,
  min = 0,
  max = 140,
  testidPrefix = "pad",
}) {
  const fallback = config.paddingY ?? defaultValue;
  const top = config.paddingTop ?? fallback;
  const bot = config.paddingBottom ?? fallback;
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
    </>
  );
}
