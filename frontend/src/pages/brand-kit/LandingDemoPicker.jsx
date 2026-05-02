import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Check, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const NONE_VALUE = "__none__";

/**
 * LandingDemoPicker — a single dropdown that controls which page is
 * showcased on the public marketing landing page (`/login`). Lives on
 * the Brand Kit page because brand kit + landing demo are both "global
 * presentation" choices the admin makes once and forgets.
 *
 * State machine:
 *   - On mount: GET /api/admin/landing-demo + GET /api/pages in parallel
 *   - On change: PUT /api/admin/landing-demo { page_id: id|null }
 *   - When set, the public landing fetches /api/public/landing-demo and
 *     mounts the composed iframe; when null, the LiveDemo section is
 *     hidden entirely.
 */
export default function LandingDemoPicker() {
  const [pages, setPages] = useState([]);
  const [selected, setSelected] = useState(null); // page_id | null
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listPages(), api.getLandingDemo()])
      .then(([pagesRes, demo]) => {
        if (cancelled) return;
        setPages(pagesRes || []);
        setSelected(demo?.page_id || null);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Couldn't load landing demo settings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = async (value) => {
    const next = value === NONE_VALUE ? null : value;
    setSaving(true);
    try {
      await api.setLandingDemo(next);
      setSelected(next);
      toast.success(
        next ? "Featured page updated" : "Landing demo cleared"
      );
    } catch {
      toast.error("Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  };

  const featuredName =
    selected && pages.find((p) => p.page_id === selected)?.name;

  return (
    <section data-testid="landing-demo-picker">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-slate-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Landing demo
        </h2>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">
          <div>
            <p className="text-sm leading-relaxed text-slate-700 mb-2">
              Pick a page from your library to feature on the public sign-in
              page. It'll render live (real HTML/CSS/JS) inside the
              browser-chrome demo on the marketing landing page.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose <em>None</em> to hide the live demo section entirely.
              Only pages you own can be featured. Updating the page later
              reflects on the landing page automatically.
            </p>
            {selected && (
              <div
                className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200"
                data-testid="landing-demo-active"
              >
                <Check className="w-3.5 h-3.5" />
                Live now: {featuredName || selected}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <Select
              value={selected || NONE_VALUE}
              onValueChange={onChange}
              disabled={loading || saving}
            >
              <SelectTrigger
                data-testid="landing-demo-select"
                className="bg-white"
              >
                <SelectValue
                  placeholder={loading ? "Loading…" : "Choose a page"}
                />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem
                  value={NONE_VALUE}
                  data-testid="landing-demo-option-none"
                >
                  <span className="flex items-center gap-2 text-slate-500">
                    <X className="w-3.5 h-3.5" /> None — hide live demo
                  </span>
                </SelectItem>
                {pages.length > 0 && (
                  <div className="my-1 border-t border-slate-200" />
                )}
                {pages.map((p) => (
                  <SelectItem
                    key={p.page_id}
                    value={p.page_id}
                    data-testid={`landing-demo-option-${p.page_id}`}
                  >
                    {p.name}{" "}
                    <span className="text-slate-400 text-xs">
                      · {(p.blocks || []).length} blocks
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange(NONE_VALUE)}
                disabled={saving}
                data-testid="landing-demo-clear"
                className="w-full"
              >
                Clear featured page
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
