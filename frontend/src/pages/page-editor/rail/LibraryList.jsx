import { Layers } from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";

/**
 * LibraryList — the third tab of PageRail. Lists every section the user
 * has saved in their top-level library and lets them drag one onto the
 * BlocksList to insert it at a specific position.
 *
 * Drag transport: HTML5 native DataTransfer. We stash the library
 * section's id under a custom MIME type so the drop target can look it
 * up in the parent-provided lookup map. This avoids the cross-context
 * complexity of wiring two dnd-kit contexts together and still gives us
 * the real "grab and drop somewhere" gesture the user asked for.
 *
 * Tiles are NOT HTML5-draggable in the collapsed rail — the icon-only
 * state is for quick visual reference, drag requires the expanded view.
 */
export const LIBRARY_DRAG_MIME = "application/x-dw-library-section";

export default function LibraryList({
  librarySections,
  loading,
  expanded,
}) {
  if (loading) {
    return (
      <div
        className={`text-slate-500 ${
          expanded ? "px-3 py-2 text-xs" : "py-2 text-[10px]"
        }`}
      >
        {expanded ? "Loading…" : "…"}
      </div>
    );
  }
  if (!librarySections.length) {
    return (
      <div
        className={`text-slate-500 ${
          expanded ? "px-3 py-3 text-xs leading-relaxed" : "py-2 text-[10px]"
        }`}
      >
        {expanded
          ? "No saved sections yet. Build one on the dashboard and it'll show up here, draggable onto your pages."
          : ""}
      </div>
    );
  }
  return (
    <div className={expanded ? "space-y-1" : "contents"}>
      {librarySections.map((s) => (
        <LibraryTile key={s.section_id} section={s} expanded={expanded} />
      ))}
    </div>
  );
}

function LibraryTile({ section, expanded }) {
  const def = SECTIONS_BY_ID[section.type];
  const Icon = def?.icon || Layers;
  const typeLabel = def?.name || section.type;

  const onDragStart = (e) => {
    // Custom MIME so ONLY our BlocksList drop zones accept it; the
    // browser also falls back to text/plain in case any handler is
    // sniffing that (e.g. Firefox requires some data for drag to start).
    try {
      e.dataTransfer.setData(LIBRARY_DRAG_MIME, section.section_id);
      e.dataTransfer.setData("text/plain", section.name || "Library section");
      e.dataTransfer.effectAllowed = "copy";
    } catch {
      /* older browsers */
    }
  };

  if (!expanded) {
    return (
      <div
        draggable
        onDragStart={onDragStart}
        data-testid={`library-tile-${section.section_id}`}
        title={`${section.name} · drag to insert`}
        aria-label={section.name}
        className="group relative w-11 h-11 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-grab active:cursor-grabbing"
      >
        <Icon className="w-4 h-4" />
        <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
          {section.name}
        </span>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      data-testid={`library-tile-${section.section_id}`}
      title="Drag onto the Blocks list to insert"
      className="group flex items-center gap-2 p-2 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-grab active:cursor-grabbing"
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate leading-tight">
          {section.name}
        </p>
        <p className="text-[10px] uppercase tracking-wider truncate leading-tight text-slate-500">
          {typeLabel}
        </p>
      </div>
    </div>
  );
}
