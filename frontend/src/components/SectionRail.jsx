import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Layers,
} from "lucide-react";
import { SECTIONS, SECTIONS_BY_ID } from "@/sections/registry";
import { api } from "@/lib/api";
import { SectionPicker } from "@/pages/dashboard/common";
import InlineEditableLabel from "@/components/InlineEditableLabel";

/**
 * Library rail — persistent sidebar that acts as a mini file browser of the
 * user's saved sections. Clicking a row jumps directly to that section's
 * editor (full navigation, no in-place swap). Plus button at the bottom
 * opens the section-type picker to create a new section. Collapses to an
 * icon rail to reclaim horizontal space.
 */
export default function SectionRail({ activeSectionId }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listSections()
      .then((docs) => {
        if (!cancelled) setItems(docs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-fetch if the active section changed (e.g. after a rename the list label
  // would be stale). Cheap at our scale.
  useEffect(() => {
    if (!activeSectionId) return;
    api
      .listSections()
      .then(setItems)
      .catch(() => {});
  }, [activeSectionId]);

  const renameSection = async (sectionId, name) => {
    setItems((prev) =>
      prev.map((it) => (it.section_id === sectionId ? { ...it, name } : it))
    );
    try {
      await api.updateSection(sectionId, { name });
    } catch {
      // Roll back on failure — re-fetch list to get authoritative names.
      api.listSections().then(setItems).catch(() => {});
    }
  };

  const createNew = (typeId) => {
    const def = SECTIONS_BY_ID[typeId];
    if (!def) return;
    setPicker(false);
    navigate(`/edit/section/new?type=${encodeURIComponent(typeId)}`);
  };

  return (
    <>
      <div
        data-testid="section-rail"
        className={`flex-shrink-0 bg-slate-900 h-screen flex flex-col overflow-hidden transition-[width] duration-200 ease-out ${
          expanded ? "w-60" : "w-16"
        }`}
      >
        {/* Top: back + collapse toggle */}
        <div
          className={`flex items-center py-3 ${
            expanded ? "px-3 justify-between" : "px-0 justify-center flex-col gap-1"
          }`}
        >
          <Link
            to="/"
            data-testid="rail-back"
            className="w-9 h-9 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Back to dashboard"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <button
            type="button"
            data-testid="rail-toggle"
            onClick={() => setExpanded((v) => !v)}
            className="w-9 h-9 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title={expanded ? "Collapse" : "Expand"}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Heading */}
        {expanded && (
          <div className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 flex items-center justify-between">
            <span>Your sections</span>
            <span className="text-slate-600">{items.length}</span>
          </div>
        )}

        {/* List */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto ns-rail-scroll ${
            expanded ? "px-2 pb-2 space-y-0.5" : "px-0 pb-2 flex flex-col items-center gap-1"
          }`}
          data-testid="rail-list"
        >
          {loading ? (
            <div
              className={`text-slate-500 ${
                expanded ? "px-3 py-2 text-xs" : "py-2 text-[10px]"
              }`}
            >
              {expanded ? "Loading…" : "…"}
            </div>
          ) : items.length === 0 ? (
            <div
              className={`text-slate-500 ${
                expanded ? "px-3 py-2 text-xs leading-relaxed" : "py-2 text-[10px]"
              }`}
            >
              {expanded ? "No sections yet. Add one below." : ""}
            </div>
          ) : (
            items.map((s) => {
              const def = SECTIONS_BY_ID[s.type];
              if (!def) return null;
              const Icon = def.icon || Layers;
              const isActive = activeSectionId === s.section_id;
              return (
                <Link
                  key={s.section_id}
                  to={`/edit/section/${s.section_id}`}
                  data-testid={`rail-item-${s.section_id}`}
                  title={`${s.name} · ${def.name}`}
                  className={`group relative flex items-center transition-colors ${
                    expanded
                      ? "w-full h-10 px-2 gap-2 rounded-md"
                      : "w-11 h-11 rounded-md justify-center"
                  } ${
                    isActive
                      ? "bg-white text-slate-900"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {expanded ? (
                    <div className="min-w-0 flex-1">
                      <InlineEditableLabel
                        value={s.name}
                        onCommit={(next) => renameSection(s.section_id, next)}
                        testid={`rail-item-${s.section_id}-name`}
                        className="block text-xs font-medium truncate leading-tight"
                      />
                      <p
                        className={`text-[10px] uppercase tracking-wider truncate leading-tight ${
                          isActive ? "text-slate-500" : "text-slate-500 group-hover:text-slate-300"
                        }`}
                      >
                        {def.name}
                      </p>
                    </div>
                  ) : (
                    <span
                      className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
                    >
                      {s.name}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </div>

        {/* Footer: new section */}
        <div
          className={`border-t border-white/5 py-3 ${
            expanded ? "px-3" : "px-0 flex justify-center"
          }`}
        >
          <button
            type="button"
            onClick={() => setPicker(true)}
            data-testid="rail-new-section"
            className={`flex items-center justify-center transition-colors ${
              expanded
                ? "w-full h-10 gap-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-medium"
                : "w-11 h-11 rounded-md bg-white/5 hover:bg-white/10 text-slate-200"
            }`}
            title="New section"
            aria-label="New section"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            {expanded && <span>New section</span>}
          </button>
        </div>
      </div>

      {picker && (
        <SectionPicker
          sections={SECTIONS}
          onPick={createNew}
          onClose={() => setPicker(false)}
        />
      )}
    </>
  );
}
