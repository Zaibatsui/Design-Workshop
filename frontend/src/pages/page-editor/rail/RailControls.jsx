import { Plus } from "lucide-react";

/**
 * Three small chrome components shared between PageRail's expanded and
 * collapsed states. Pulled out of the main PageRail file to keep that
 * orchestrator focused on layout + state.
 */

export function RailTab({ active, onClick, testid, count, Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-400 hover:text-white"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{children}</span>
      <span
        className={`text-[10px] font-normal ${
          active ? "text-slate-500" : "text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export function CollapsedTabButton({ active, onClick, testid, Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      title={label}
      aria-label={label}
      className={`group relative w-11 h-11 rounded-md flex items-center justify-center transition-colors ${
        active
          ? "bg-white text-slate-900"
          : "text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
        {label}
      </span>
    </button>
  );
}

export function RailFooterButton({ onClick, testid, label, expanded }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      title={label}
      aria-label={label}
      className={`flex items-center justify-center transition-colors ${
        expanded
          ? "w-full h-10 gap-2 rounded-md bg-[#E01839] hover:bg-[#c01530] text-white text-sm font-medium"
          : "w-11 h-11 rounded-md bg-[#E01839] hover:bg-[#c01530] text-white"
      }`}
    >
      <Plus className="w-4 h-4 flex-shrink-0" />
      {expanded && <span>{label}</span>}
    </button>
  );
}
