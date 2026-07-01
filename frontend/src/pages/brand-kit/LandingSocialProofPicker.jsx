import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Check, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { previewDoc, makeUid } from "@/sections/shared";

const NONE_VALUE = "__none__";
const MAX_SLOTS = 3;
const MIN_SLOTS = 1;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 280;
const EMPTY_SLOT = { section_id: null, height: DEFAULT_HEIGHT };

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

function padSlots(loaded) {
  const list = (loaded || []).map((s) => ({
    section_id: s?.section_id ?? null,
    height: s?.height ?? DEFAULT_HEIGHT,
  }));
  return list.length >= MIN_SLOTS
    ? list
    : [...list, ...Array(MIN_SLOTS - list.length).fill(null).map(() => ({ ...EMPTY_SLOT }))];
}

function ProofCard({
  index,
  slot,
  sections,
  disabled,
  onSectionChange,
  onHeightChange,
  onHeightCommit,
  onRemove,
  removable,
}) {
  const current = useMemo(
    () => sections.find((s) => s.section_id === slot.section_id),
    [sections, slot.section_id]
  );
  const html = useMemo(() => renderThumbnail(current), [current]);

  return (
    <div
      data-testid={`social-proof-${index}-card`}
      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      {/* Preview box shows the section at a fixed thumbnail aspect ratio
          purely so the admin can see what's inside — it's independent
          of the "height" slider below, which controls the actual frame
          height on the real landing page. */}
      <div className="relative w-full overflow-hidden bg-slate-50 border-b border-slate-200" style={{ paddingTop: "50%" }}>
        {html ? (
          <iframe
            title={`Social proof slot ${index + 1} preview`}
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
          Slot {index + 1}
        </span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            data-testid={`social-proof-${index}-remove`}
            className="absolute top-2 right-2 text-[11px] font-medium text-slate-500 bg-white/90 backdrop-blur px-2 py-1 rounded-sm shadow-sm hover:text-red-600"
          >
            Remove
          </button>
        )}
      </div>

      <div className="p-3 space-y-3">
        <Select
          value={slot.section_id || NONE_VALUE}
          onValueChange={(v) => onSectionChange(v === NONE_VALUE ? null : v)}
          disabled={disabled}
        >
          <SelectTrigger
            data-testid={`social-proof-${index}-select`}
            className="bg-white"
          >
            <SelectValue placeholder="Choose a section" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem
              value={NONE_VALUE}
              data-testid={`social-proof-${index}-option-none`}
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
                  data-testid={`social-proof-${index}-option-${s.section_id}`}
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
            data-testid={`social-proof-${index}-active`}
          >
            <Check className="w-3 h-3" />
            Live: {current.name || "(untitled)"}
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          <div className="flex items-baseline justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Height
            </Label>
            <span
              data-testid={`social-proof-${index}-height-value`}
              className="text-sm tabular-nums text-slate-700"
            >
              {slot.height}px
            </span>
          </div>
          <input
            data-testid={`social-proof-${index}-height`}
            type="range"
            min={MIN_HEIGHT}
            max={MAX_HEIGHT}
            step={10}
            value={slot.height}
            disabled={disabled}
            onChange={(e) => onHeightChange(Number(e.target.value))}
            onMouseUp={onHeightCommit}
            onTouchEnd={onHeightCommit}
            onKeyUp={onHeightCommit}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * LandingSocialProofPicker — up to three sections (testimonials, logo
 * strip, stat counter — or anything else) featured in a "Trusted by"
 * band on the public landing page. Each slot has its own admin-set
 * frame height, since a logo marquee and a testimonials carousel don't
 * want the same size and guessing from the section type alone tends to
 * look wrong once real content is in there.
 *
 * Deliberately has no fallback demo, unlike the Spotlights picker: this
 * is a claim about real users, not a feature demo, so there's nothing
 * honest to show until there's actually beta-tester material to
 * feature. Until then, every slot stays "None" and the band on the
 * landing page hides itself entirely — this picker just wires up the
 * framework so switching it on later is a one-click job once you have
 * real testimonials/logos/numbers saved as sections.
 */
export default function LandingSocialProofPicker() {
  const [sections, setSections] = useState([]);
  const [slots, setSlots] = useState([{ ...EMPTY_SLOT }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listSections(), api.getLandingSocialProof()])
      .then(([secs, current]) => {
        if (cancelled) return;
        setSections(secs || []);
        setSlots(padSlots(current?.slots));
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Couldn't load social proof settings");
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
      const result = await api.setLandingSocialProof(next);
      setSlots(padSlots(result.slots));
      toast.success(
        (result.slots || []).some((s) => s.section_id)
          ? "Social proof updated"
          : "Social proof cleared"
      );
    } catch {
      toast.error("Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  };

  const onSectionChange = (index) => (section_id) => {
    const next = [...slots];
    next[index] = { ...next[index], section_id };
    save(next);
  };

  const onHeightChange = (index) => (height) => {
    // Height is a local drag — commit state immediately for a smooth
    // slider, but debounce-free save-on-release keeps this simple:
    // we only persist once the user lets go (onMouseUp/touchEnd would
    // add complexity for little gain at 3 sections max), so just save
    // on every change; the backend write is cheap and idempotent.
    const next = [...slots];
    next[index] = { ...next[index], height };
    setSlots(next);
  };

  const commitHeight = (index) => () => save(slots);

  const addSlot = () => {
    if (slots.length >= MAX_SLOTS) return;
    setSlots([...slots, { ...EMPTY_SLOT }]);
  };

  const removeSlot = (index) => {
    const next = slots.filter((_, i) => i !== index);
    save(next.length >= MIN_SLOTS ? next : [...next, { ...EMPTY_SLOT }]);
  };

  const clearAll = () => save(slots.map(() => ({ ...EMPTY_SLOT })));
  const hasAny = slots.some((s) => s.section_id);

  return (
    <section data-testid="landing-social-proof-picker">
      <div className="flex items-center gap-2 mb-3">
        <BadgeCheck className="w-4 h-4 text-slate-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Landing social proof
        </h2>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="max-w-2xl">
            <p className="text-sm leading-relaxed text-slate-700 mb-2">
              Pick up to {MAX_SLOTS} sections — testimonials, a logo strip, a
              stat counter — to feature in a "Trusted by" band on the public
              sign-in page. Each slot has its own height — drag to fit the
              content, no guessing.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Leave every slot as <em>None</em> to hide the band entirely.
              There's no placeholder content here on purpose — this is the
              framework to switch on once you have real testimonials, logos,
              or usage numbers saved as sections. Only sections you own can
              be slotted.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {slots.length < MAX_SLOTS && (
              <Button
                variant="outline"
                size="sm"
                onClick={addSlot}
                disabled={saving}
                data-testid="social-proof-add"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add slot
              </Button>
            )}
            {hasAny && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={saving}
                data-testid="social-proof-clear-all"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {slots.map((slot, index) => (
            <ProofCard
              key={index}
              index={index}
              slot={slot}
              sections={sections}
              disabled={loading || saving}
              onSectionChange={onSectionChange(index)}
              onHeightChange={onHeightChange(index)}
              onHeightCommit={commitHeight(index)}
              onRemove={() => removeSlot(index)}
              removable={slots.length > MIN_SLOTS}
            />
          ))}
        </div>
        {slots.some((s) => s.section_id) && (
          <p className="text-xs text-slate-400 mt-4">
            Height changes save when you release the slider.
          </p>
        )}
      </div>
    </section>
  );
}
