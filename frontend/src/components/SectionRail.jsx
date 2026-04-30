import { SECTIONS } from "@/sections/registry";

export default function SectionRail({ activeId, onSelect }) {
  return (
    <div
      data-testid="section-rail"
      className="w-16 flex-shrink-0 bg-slate-900 h-screen flex flex-col items-center py-3 gap-1 overflow-y-auto"
    >
      <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center mb-2">
        <span className="font-heading text-white font-bold text-sm">SB</span>
      </div>
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const isActive = activeId === s.id;
        return (
          <button
            key={s.id}
            data-testid={`rail-${s.id}`}
            onClick={() => onSelect(s.id)}
            title={s.name}
            className={`group relative w-11 h-11 rounded-md flex items-center justify-center transition-colors ${
              isActive
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="w-[18px] h-[18px]" />
            <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {s.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
