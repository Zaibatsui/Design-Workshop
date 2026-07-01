import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Camera, Check, Plus, X } from "lucide-react";
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
import { previewDoc, makeUid } from "@/sections/shared";

const NONE_VALUE = "__none__";
const MAX_SLOTS = 4;
const MIN_SLOTS = 2;

// Render-string cache keyed by section_id — a picker session only ever
// looks at the same handful of saved sections, so this avoids re-running
// `def.render()` on every keystroke/re-render.
const HTML_CACHE = new Map();

function renderThumbnail(section) {
  if (!section) return "";
  if (HTML_CACHE.has(section.section_id)) return HTML_CACHE.get(section.section_id);
  const def = SECTIONS_BY_ID[section.type];
  if (!def || typeof def.render !== "function") return "";
  let html = "";
  try {
    html = previewDoc(def.render({ ...section.config, uid: makeUid() }));
  } catch {
    html = "";
  }
  HTML_CACHE.set(section.section_id, html);
  return html;
}

/**
 * SpotlightCard — one slot: a live-rendered thumbnail (so admins can see
 * what they're picking, not just a name in a dropdown) with the section
 * select and status underneath.
 *
 * The thumbnail uses the "4x width, scale to 25%" trick rather than a
 * fixed pixel width: the card is fluid (part of a responsive grid), so a
 * percentage-based iframe lets the preview scale with it instead of
 * assuming one specific thumbnail box size.
 */
function SpotlightCard({ index, value, sections, disabled, onChange, onRemove, removable }) {
  const current = useMemo(
    () => sections.find((s) => s.section_id === value),
    [sections, value]
  );
  const html = useMemo(() => renderThumbnail(current), [current]);

  return (
    <div
      data-testid={`spotlight-${index}-card`}
      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      <div className="relative w-full overflow-hidden bg-slate-50 border-b border-slate-200" style={{ paddingTop: "58%" }}>
        {html ? (
          <iframe
            title={`Spotlight ${index + 1} preview`}
            srcDoc={html}
            sandbox="allow-same-origin"
            loading="lazy"
            className="absolute top-0 left-0 border-0"
            style={{
              width: "400%",
              height: "400%",
              transform: "scale(0.25)",
              transformOrigin: "top left",
              pointerEvents: "none",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            No section selected
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white/90 backdrop-blur px-2 py-1 rounded-sm shadow-sm">
          Spotlight {index + 1}
        </span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            data-testid={`spotlight-${index}-remove`}
            className="absolute top-2 right-2 text-[11px] font-medium text-slate-500 bg-white/90 backdrop-blur px-2 py-1 rounded-sm shadow-sm hover:text-red-600"
          >
            Remove
          </button>
        )}
      </div>

      <div className="p-3 space-y-2">
        <Select
          value={value || NONE_VALUE}
          onValueChange={(v) => onChange(v === NONE_VALUE ? null : v)}
          disabled={disabled}
        >
          <SelectTrigger
            data-testid={`spotlight-${index}-select`}
            className="bg-white"
          >
            <SelectValue placeholder="Choose a section" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem
              value={NONE_VALUE}
              data-testid={`spotlight-${index}-option-none`}
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
                  data-testid={`spotlight-${index}-option-${s.section_id}`}
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
            data-testid={`spotlight-${index}-active`}
          >
            <Check className="w-3 h-3" />
            Live: {current.name || "(untitled)"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingSpotlightsPicker() {
  const [sections, setSections] = useState([]);
  const [slots, setSlots] = useState([null, null]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listSections(), api.getLandingSpotlights()])
      .then(([secs, current]) => {
        if (cancelled) return;
        setSections(secs || []);
        const loaded = current?.slots || [];
        setSlots(
          loaded.length >= MIN_SLOTS
            ? loaded
            : [...loaded, ...Array(MIN_SLOTS - loaded.length).fill(null)]
        );
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
      const loaded = result.slots || [];
      setSlots(
        loaded.length >= MIN_SLOTS
          ? loaded
          : [...loaded, ...Array(MIN_SLOTS - loaded.length).fill(null)]
      );
      toast.success(loaded.some(Boolean) ? "Spotlights updated" : "Spotlights cleared");
    } catch {
      toast.error("Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  };

  const onSlotChange = (index) => (value) => {
    const next = [...slots];
    next[index] = value;
    save(next);
  };

  const addSlot = () => {
    if (slots.length >= MAX_SLOTS) return;
    setSlots([...slots, null]);
  };

  const removeSlot = (index) => {
    const next = slots.filter((_, i) => i !== index);
    save(next.length >= MIN_SLOTS ? next : [...next, null]);
  };

  const clearAll = () => save(slots.map(() => null));
  const hasAny = slots.some(Boolean);

  return (
    <section data-testid="landing-spotlights-picker">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-slate-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Landing spotlights
        </h2>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="max-w-2xl">
            <p className="text-sm leading-relaxed text-slate-700 mb-2">
              Pick up to {MAX_SLOTS} sections from your library to feature in
              the "Spotlights" band on the public sign-in page. Each renders
              live — see exactly what visitors would see below.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Leave every slot as <em>None</em> to hide the Spotlights band
              entirely. Only sections you own can be slotted; editing the
              section later reflects on the landing page automatically.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {slots.length < MAX_SLOTS && (
              <Button
                variant="outline"
                size="sm"
                onClick={addSlot}
                disabled={saving}
                data-testid="spotlight-add"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add spotlight
              </Button>
            )}
            {hasAny && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={saving}
                data-testid="spotlight-clear-all"
              >
                Clear all spotlights
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {slots.map((value, index) => (
            <SpotlightCard
              key={index}
              index={index}
              value={value}
              sections={sections}
              disabled={loading || saving}
              onChange={onSlotChange(index)}
              onRemove={() => removeSlot(index)}
              removable={slots.length > MIN_SLOTS}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
