/**
 * BlockAdder — modal dialog shown from the page editor's "Add block" action.
 * Offers three sources: a fresh section type, a snapshot from the user's
 * library sections, or a rich-text block.
 */
import { useState, useMemo } from "react";
import { Layers, Type } from "lucide-react";
import { SECTIONS, SECTIONS_BY_ID } from "@/sections/registry";
import { computeBadges } from "@/lib/sectionBadges";
import { useEscapeKey } from "@/lib/useEscapeKey";

export default function BlockAdder({
  librarySections,
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
            <Icon className="w-5 h-5 text-[#E01839] mb-2" />
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

function LibrarySectionsGrid({ sections, onPick }) {
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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sections.map((s) => {
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
              Snapshot — edits to library section won't affect this copy.
            </p>
          </button>
        );
      })}
    </div>
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
