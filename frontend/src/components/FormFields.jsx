import { useState } from "react";
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

export function TextAreaField({ label, value, onChange, rows = 2, testid }) {
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
}) {
  // Hold the in-flight value locally so the thumb + label update on
  // every tick, but only fire `onChange` (which triggers the parent
  // section re-render + iframe srcDoc swap) when the user releases the
  // pointer. Massive UX win for sliders that affect image sizing or
  // section height — no thrashing the snippet rebuild on every pixel.
  const [drag, setDrag] = useState(null);
  const display = drag != null ? drag : value;
  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <div className="flex justify-between mb-2">
        <Label className={labelCls}>{label}</Label>
        <span className="text-xs text-slate-500">
          {display}
          {suffix}
        </span>
      </div>
      <Slider
        data-testid={testid}
        value={[display]}
        onValueChange={(v) => setDrag(v[0])}
        onValueCommit={(v) => {
          setDrag(null);
          onChange(v[0]);
        }}
        min={min}
        max={max}
        step={step}
      />
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

export function SelectField({ label, value, onChange, options, testid }) {
  return (
    <div>
      <Label className={labelCls}>{label}</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(v)}>
        <SelectTrigger data-testid={testid} className="mt-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
