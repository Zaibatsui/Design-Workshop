import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function ColorField({ label, value, onChange, testid }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </Label>
      <div className="mt-1.5 flex items-center gap-2 border border-slate-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-slate-900/20">
        <label className="relative w-10 h-9 flex-shrink-0 cursor-pointer block">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
            data-testid={`${testid}-picker`}
          />
          <div
            className="w-full h-full"
            style={{ backgroundColor: value }}
            aria-hidden
          />
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 font-mono text-xs uppercase h-9"
          data-testid={`${testid}-input`}
        />
      </div>
    </div>
  );
}
