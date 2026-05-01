import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SECTIONS } from "@/sections/registry";

export default function SectionRail({ activeId, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      data-testid="section-rail"
      className={`flex-shrink-0 bg-slate-900 h-screen flex flex-col py-3 overflow-hidden transition-[width] duration-200 ease-out ${
        expanded ? "w-56" : "w-16"
      }`}
    >
      <div
        className={`flex items-center mb-2 ${expanded ? "px-3 justify-end" : "px-0 justify-center"}`}
      >
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

      <div
        className={`flex-1 flex flex-col min-h-0 overflow-y-auto ns-rail-scroll ${expanded ? "px-2 gap-0.5" : "items-center gap-1"}`}
      >
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = activeId === s.id;
          return (
            <button
              key={s.id}
              data-testid={`rail-${s.id}`}
              onClick={() => onSelect(s.id)}
              title={s.name}
              className={`group relative flex items-center transition-colors ${
                expanded
                  ? "w-full h-10 px-3 gap-3 rounded-md text-left"
                  : "w-11 h-11 rounded-md justify-center"
              } ${
                isActive
                  ? "bg-white text-slate-900"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {expanded ? (
                <span className="text-sm font-medium truncate">{s.name}</span>
              ) : (
                <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {s.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
