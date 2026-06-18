import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const labelCls =
  "text-xs font-semibold uppercase tracking-wider text-slate-500";

export function TextField({ label, value, onChange, placeholder, testid }) {
  return (
    <div>
      <Label className={labelCls}>{label}</Label>
      <Input
        data-testid={testid}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5"
      />
    </div>
  );
}

export function TextAreaField({ label, value, onChange, rows = 2, testid, hint }) {
  return (
    <div>
      <Label className={labelCls}>{label}</Label>
      <Textarea
        data-testid={testid}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1.5 resize-none"
      />
      {hint && (
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{hint}</p>
      )}
    </div>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
  testid,
  disabled,
  description,
}) {
  return (
    // SliderField root gets a small `pb-1.5` so the visible rail
    // doesn't sit flush against the next field's label. Other field
    // types end with a 40-ish-px-tall input — the rail is only ~16px
    // so without this padding the FormGroup's `space-y-3` reads
    // visually as a tight squeeze (see screenshot regression where
    // 3 consecutive sliders bunched up).
    <div className={(disabled ? "opacity-50 pointer-events-none" : "") + " pb-1.5"}>
      <div className="flex justify-between mb-2">
        <Label className={labelCls}>{label}</Label>
        <span className="text-xs text-slate-500">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        data-testid={testid}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
      />
      {description && (
        <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{description}</p>
      )}
    </div>
  );
}

export function ToggleField({ label, description, checked, onChange, testid }) {
  return (
    <div className="flex items-center justify-between">
      <div className="pr-2">
        <Label className="text-sm font-medium text-slate-900">{label}</Label>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <Switch
        data-testid={testid}
        checked={!!checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}

// Radix `<Select.Item>` forbids an empty-string `value` (it reserves `""`
// for "no selection"). Several of our sections legitimately want one of
// the dropdown options to mean "no override / inherit defaults" and
// store that as `""` in the data model. We bridge by mapping the data
// value `""` to a private sentinel `__empty__` inside the Select, and
// translating back to `""` on change. Callers are unaware.
const EMPTY_SENTINEL = "__empty__";
const toSelectValue = (v) => (v === "" || v == null ? EMPTY_SENTINEL : String(v));
const fromSelectValue = (v) => (v === EMPTY_SENTINEL ? "" : v);

export function SelectField({ label, value, onChange, options, testid }) {
  return (
    <div>
      <Label className={labelCls}>{label}</Label>
      <Select
        value={toSelectValue(value)}
        onValueChange={(v) => onChange(fromSelectValue(v))}
      >
        <SelectTrigger data-testid={testid} className="mt-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={String(o.value)} value={toSelectValue(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
