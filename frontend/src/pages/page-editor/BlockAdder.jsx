/**
 * BlockAdder — modal dialog shown from the page editor's "Add block" action.
 * Offers three sources: a fresh section type, a snapshot from the user's
 * library sections, or a rich-text block.
 */
import { useState, useMemo } from "react";
import { Layers, Type, Folder, FolderOpen } from "lucide-react";
import { SECTIONS, SECTIONS_BY_ID } from "@/sections/registry";
import { computeBadges } from "@/lib/sectionBadges";
import { useEscapeKey } from "@/lib/useEscapeKey";
import SectionPreviewPopover from "@/components/SectionPreviewPopover";

export default function BlockAdder({
  librarySections,
  libraryCollections = [],
  onAddNewSection,
  onAddLibrarySection,
  onAddRichText,
  onClose,
}) {
  const [mode, setMode] = useState("new"); // new | library | richtext
  useEscapeKey(onClose);

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="block-adder"
      >
        <div className="px-8 py-6 border-b border-slate-200">
          <h2 className="font-heading text-xl font-semibold tracking-tight mb-1">
            Add a block
          </h2>
          <p className="text-sm text-slate-500">
            Pick a fresh section type, drop in a saved section from your
            library, or add free-flowing rich text.
          </p>
          <div className="flex gap-1 mt-4 border-b border-slate-200 -mb-6">
            <AdderTab
              active={mode === "new"}
              onClick={() => setMode("new")}
              testid="adder-tab-new"
            >
              New section
            </AdderTab>
            <AdderTab
              active={mode === "library"}
              onClick={() => setMode("library")}
              testid="adder-tab-library"
            >
              From library ({librarySections.length})
            </AdderTab>
            <AdderTab
              active={mode === "richtext"}
              onClick={() => setMode("richtext")}
              testid="adder-tab-richtext"
            >
              Rich text
            </AdderTab>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {mode === "new" ? (
            <NewSectionGrid onPick={onAddNewSection} />
          ) : mode === "library" ? (
            <LibrarySectionsGrid
              sections={librarySections}
              collections={libraryCollections}
              onPick={onAddLibrarySection}
            />
          ) : (
            <RichTextAdder onAdd={onAddRichText} />
          )}
        </div>
      </div>
    </div>
  );
}

function NewSectionGrid({ onPick }) {
  // Compute badges once per mount — the dates are static config, not
  // user state, so memoising at the component level is enough.
  const badges = useMemo(() => computeBadges(SECTIONS), []);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const badge = badges[s.id];
        return (
          <button
            key={s.id}
            data-testid={`adder-new-${s.id}`}
            onClick={() => onPick(s.id)}
            className="relative text-left p-4 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
          >
            {badge === "new" && (
              <span
                data-testid={`adder-badge-new-${s.id}`}
                className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-emerald-500 text-white"
              >
                New
              </span>
            )}
            {badge === "updated" && (
              <span
                data-testid={`adder-badge-updated-${s.id}`}
                className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-amber-500 text-white"
              >
                Updated
              </span>
            )}
            <SectionPreviewPopover sectionId={s.id} />
            <Icon className="w-5 h-5 text-[#E01839] mb-2 ml-9" />
            <p className="text-sm font-medium text-slate-900">{s.name}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {s.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function LibrarySectionsGrid({ sections, collections = [], onPick }) {
  // Filter pill state: null = "All", "__unfiled__" = sections with no
  // collection_id, otherwise a real collection_id. We deliberately
  // mirror the dashboard's terminology so users carry their mental
  // model between the two surfaces.
  const [activeId, setActiveId] = useState(null);

  // Pre-compute per-collection counts once per render so the pills
  // can show "(N)" without re-scanning the whole list on each click.
  const counts = useMemo(() => {
    const c = { __all__: sections.length, __unfiled__: 0 };
    for (const s of sections) {
      if (!s.collection_id) c.__unfiled__ += 1;
      else c[s.collection_id] = (c[s.collection_id] || 0) + 1;
    }
    return c;
  }, [sections]);

  // Apply the active filter. Empty list states are then handled below.
  const visible = useMemo(() => {
    if (activeId === null) return sections;
    if (activeId === "__unfiled__")
      return sections.filter((s) => !s.collection_id);
    return sections.filter((s) => s.collection_id === activeId);
  }, [sections, activeId]);

  if (sections.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Layers className="w-6 h-6 mx-auto mb-3 opacity-40" />
        <p className="text-sm">
          No saved sections yet. Create one from the Sections tab.
        </p>
      </div>
    );
  }

  // Only render the pill bar when the user has at least one real
  // collection — keeps the picker visually quiet for users who
  // haven't filed anything yet.
  const hasCollections = collections.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {hasCollections && (
        <div
          className="flex flex-wrap gap-1.5"
          data-testid="library-collection-filter"
        >
          <FilterPill
            label="All"
            count={counts.__all__}
            active={activeId === null}
            onClick={() => setActiveId(null)}
            testid="filter-pill-all"
          />
          {counts.__unfiled__ > 0 && (
            <FilterPill
              label="Unfiled"
              count={counts.__unfiled__}
              active={activeId === "__unfiled__"}
              onClick={() => setActiveId("__unfiled__")}
              icon={Folder}
              testid="filter-pill-unfiled"
            />
          )}
          {collections
            // Only show pills for collections the user actually has
            // sections in — empty collections add visual noise without
            // helping the user find anything.
            .filter((c) => (counts[c.collection_id] || 0) > 0)
            .map((c) => (
              <FilterPill
                key={c.collection_id}
                label={c.name}
                count={counts[c.collection_id] || 0}
                active={activeId === c.collection_id}
                onClick={() => setActiveId(c.collection_id)}
                icon={FolderOpen}
                testid={`filter-pill-${c.collection_id}`}
              />
            ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="text-center py-10 text-sm text-slate-500">
          No sections in this folder. Pick a different filter above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visible.map((s) => {
            const def = SECTIONS_BY_ID[s.type];
            const Icon = def?.icon || Layers;
            return (
              <button
                key={s.section_id}
                data-testid={`adder-library-${s.section_id}`}
                onClick={() => onPick(s)}
                className="text-left p-4 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-[#E01839]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {def?.name || s.type}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {s.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Snapshot — edits to library section won&apos;t affect this copy.
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, count, active, onClick, icon: Icon, testid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
      }`}
    >
      {Icon ? <Icon className="w-3 h-3" /> : null}
      <span>{label}</span>
      <span
        className={`text-[10px] font-semibold tabular-nums ${
          active ? "text-white/70" : "text-slate-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function RichTextAdder({ onAdd }) {
  return (
    <div className="max-w-md">
      <button
        data-testid="adder-richtext-confirm"
        onClick={onAdd}
        className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
      >
        <Type className="w-5 h-5 text-[#E01839] mb-2" />
        <p className="text-sm font-medium text-slate-900">Rich-text block</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Headings, paragraphs, lists and links — or paste raw HTML (including
          scripts/iframes) via the Source mode.
        </p>
      </button>
    </div>
  );
}

function AdderTab({ active, onClick, testid, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`relative px-3 py-2 text-sm font-medium transition-colors ${
        active ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
      {active && (
        <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#E01839] rounded-full" />
      )}
    </button>
  );
}
