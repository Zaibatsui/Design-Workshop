import { Link } from "react-router-dom";
import { FileStack } from "lucide-react";
import InlineEditableLabel from "@/components/InlineEditableLabel";

/**
 * PagesList — the library side of the PageRail. Lists every page the
 * user has, with the active one highlighted. Single-click navigates,
 * double-click renames inline.
 */
export default function PagesList({
  studio,
  pages,
  loading,
  activePageId,
  expanded,
  onRename,
}) {
  const emptyCls = studio ? "text-zinc-500" : "text-slate-500";
  if (loading) {
    return (
      <div
        className={`${emptyCls} ${
          expanded ? "px-3 py-2 text-xs" : "py-2 text-[10px]"
        }`}
      >
        {expanded ? "Loading…" : "…"}
      </div>
    );
  }
  if (!pages.length) {
    return (
      <div
        className={`${emptyCls} ${
          expanded ? "px-3 py-2 text-xs leading-relaxed" : "py-2 text-[10px]"
        }`}
      >
        {expanded ? "No pages yet. Add one below." : ""}
      </div>
    );
  }
  return (
    <div className={expanded ? "space-y-0.5" : "contents"}>
      {pages.map((p) => {
        const isActive = activePageId === p.page_id;
        const blockCount = (p.blocks || []).length;
        const linkCls = studio
          ? isActive
            ? "bg-blue-50 text-blue-900 border border-blue-200"
            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent"
          : isActive
          ? "bg-white text-slate-900"
          : "text-slate-400 hover:bg-white/10 hover:text-white";
        const captionCls = studio
          ? isActive
            ? "text-blue-700"
            : "text-zinc-400 group-hover:text-zinc-500"
          : isActive
          ? "text-slate-500"
          : "text-slate-500 group-hover:text-slate-300";
        return (
          <Link
            key={p.page_id}
            to={`/edit/page/${p.page_id}`}
            data-testid={`page-rail-item-${p.page_id}`}
            title={`${p.name} · ${blockCount} block${blockCount === 1 ? "" : "s"}`}
            className={`group relative flex items-center transition-colors ${
              expanded
                ? "w-full h-10 px-2 gap-2 rounded-md"
                : "w-11 h-11 rounded-md justify-center"
            } ${linkCls}`}
          >
            <FileStack className="w-[18px] h-[18px] flex-shrink-0" />
            {expanded ? (
              <div className="min-w-0 flex-1">
                <InlineEditableLabel
                  value={p.name}
                  onCommit={(next) => onRename && onRename(p.page_id, next)}
                  testid={`page-rail-item-${p.page_id}-name`}
                  className="block text-xs font-medium truncate leading-tight"
                />
                <p
                  className={`text-[10px] uppercase tracking-wider truncate leading-tight ${captionCls}`}
                >
                  {blockCount} block{blockCount === 1 ? "" : "s"}
                </p>
              </div>
            ) : (
              <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                {p.name}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
