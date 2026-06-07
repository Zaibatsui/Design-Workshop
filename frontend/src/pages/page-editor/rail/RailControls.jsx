import { Plus } from "lucide-react";

/**
 * Three small chrome components shared between PageRail's expanded and
 * collapsed states. Pulled out of the main PageRail file to keep that
 * orchestrator focused on layout + state.
 *
 * Each component accepts a `studio` boolean that swaps the dark-rail
 * (Classic) palette for the white/zinc rail used inside the Studio
 * shell. Same shapes, just different colours.
 */

export function RailTab({ studio, active, onClick, testid, count, Icon, children }) {
  const cls = studio
    ? active
      ? "bg-white text-zinc-900 shadow-sm"
      : "text-zinc-600 hover:text-zinc-900"
    : active
    ? "bg-white text-slate-900 shadow-sm"
    : "text-slate-400 hover:text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${cls}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{children}</span>
      <span className={`text-[10px] font-normal ${studio ? "text-zinc-400" : "text-slate-500"}`}>
        {count}
      </span>
    </button>
  );
}

export function CollapsedTabButton({ studio, active, onClick, testid, Icon, label }) {
  const cls = studio
    ? active
      ? "bg-zinc-100 text-zinc-900"
      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
    : active
    ? "bg-white text-slate-900"
    : "text-slate-400 hover:bg-white/10 hover:text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      title={label}
      aria-label={label}
      className={`group relative w-11 h-11 rounded-md flex items-center justify-center transition-colors ${cls}`}
    >
      <Icon className="w-4 h-4" />
      <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
        {label}
      </span>
    </button>
  );
}

export function RailFooterButton({ studio, onClick, testid, label, expanded }) {
  const studioBg = "bg-zinc-900 hover:bg-zinc-800 text-white";
  const classicBg = "bg-[#E01839] hover:bg-[#c01530] text-white";
  const bg = studio ? studioBg : classicBg;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      title={label}
      aria-label={label}
      className={`flex items-center justify-center transition-colors ${
        expanded
          ? `w-full h-10 gap-2 rounded-md text-sm font-medium ${bg}`
          : `w-11 h-11 rounded-md ${bg}`
      }`}
    >
      <Plus className="w-4 h-4 flex-shrink-0" />
      {expanded && <span>{label}</span>}
    </button>
  );
}
