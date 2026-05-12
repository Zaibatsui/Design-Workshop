import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Camera, Check, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { SECTIONS_BY_ID } from "@/sections/registry";

const NONE_VALUE = "__none__";

/**
 * LandingSpotlightsPicker — two dropdowns that control the "Spotlights"
 * cards on the public marketing landing page (`/login`). Each slot
 * shows the live snippet of one of the admin's saved sections, with
 * the section's name used as the headline.
 *
 * - Sibling of LandingDemoPicker, same backend pattern, same admin
 *   gating. Only sections you own can be slotted.
 * - If both slots are empty, the Spotlights section hides itself
 *   entirely on the landing page (no awkward empty band).
 */
function SlotPicker({ slotKey, label, value, sections, disabled, onChange }) {
  const current = useMemo(
    () => sections.find((s) => s.section_id === value),
    [sections, value]
  );
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <Select
        value={value || NONE_VALUE}
        onValueChange={(v) => onChange(v === NONE_VALUE ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger
          data-testid={`spotlight-${slotKey}-select`}
          className="bg-white"
        >
          <SelectValue placeholder="Choose a section" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem
            value={NONE_VALUE}
            data-testid={`spotlight-${slotKey}-option-none`}
          >
            <span className="flex items-center gap-2 text-slate-500">
              <X className="w-3.5 h-3.5" /> None
            </span>
          </SelectItem>
          {sections.length > 0 && (
            <div className="my-1 border-t border-slate-200" />
          )}
          {sections.map((s) => {
            const def = SECTIONS_BY_ID[s.type];
            return (
              <SelectItem
                key={s.section_id}
                value={s.section_id}
                data-testid={`spotlight-${slotKey}-option-${s.section_id}`}
              >
                {s.name || "(untitled)"}{" "}
                <span className="text-slate-400 text-xs">
                  · {def?.name || s.type}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {current && (
        <div
          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200"
          data-testid={`spotlight-${slotKey}-active`}
        >
          <Check className="w-3 h-3" />
          Live: {current.name || "(untitled)"}
        </div>
      )}
    </div>
  );
}

export default function LandingSpotlightsPicker() {
  const [sections, setSections] = useState([]);
  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listSections(), api.getLandingSpotlights()])
      .then(([secs, current]) => {
        if (cancelled) return;
        setSections(secs || []);
        setLeft(current?.left || null);
        setRight(current?.right || null);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Couldn't load landing spotlights");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (next) => {
    setSaving(true);
    try {
      const result = await api.setLandingSpotlights(next);
      setLeft(result.left || null);
      setRight(result.right || null);
      toast.success(
        result.left || result.right
          ? "Spotlights updated"
          : "Spotlights cleared"
      );
    } catch {
      toast.error("Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  };

  const onSlotChange = (slot) => (value) => {
    const next = { left, right, [slot]: value };
    save(next);
  };

  const clearAll = () => save({ left: null, right: null });
  const hasAny = Boolean(left || right);

  return (
    <section data-testid="landing-spotlights-picker">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-slate-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Landing spotlights
        </h2>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">
          <div>
            <p className="text-sm leading-relaxed text-slate-700 mb-2">
              Pick two sections from your library to feature in the
              "Spotlights" band on the public sign-in page. Each renders
              live as a tilted card with the section name as its headline.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Leave both as <em>None</em> to hide the Spotlights band
              entirely. Only sections you own can be slotted; editing the
              section later reflects on the landing page automatically.
            </p>
            {hasAny && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={saving}
                data-testid="spotlight-clear-all"
                className="mt-4"
              >
                Clear both spotlights
              </Button>
            )}
          </div>
          <div className="space-y-4">
            <SlotPicker
              slotKey="left"
              label="Left spotlight"
              value={left}
              sections={sections}
              disabled={loading || saving}
              onChange={onSlotChange("left")}
            />
            <SlotPicker
              slotKey="right"
              label="Right spotlight"
              value={right}
              sections={sections}
              disabled={loading || saving}
              onChange={onSlotChange("right")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
