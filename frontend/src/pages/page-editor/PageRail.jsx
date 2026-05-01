/**
 * PageRail — persistent library sidebar in the Page editor. Mirrors
 * SectionRail but lists the user's pages; clicking navigates, and the
 * footer "+ New page" button opens the template picker.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileStack,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import PageTemplatePicker from "@/pages/dashboard/PageTemplatePicker";

export default function PageRail({ activePageId }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listPages()
      .then((docs) => !cancelled && setItems(docs))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh list labels when the active page changes (covers rename).
  useEffect(() => {
    if (!activePageId) return;
    api
      .listPages()
      .then(setItems)
      .catch(() => {});
  }, [activePageId]);

  const createFromTemplate = async (template) => {
    const name =
      template && template.id !== "blank" ? template.name : "Untitled page";
    const blocks = template ? template.blocks : [];
    try {
      const created = await api.createPage({ name, blocks });
      setPicker(false);
      navigate(`/edit/page/${created.page_id}`);
    } catch {
      // silently fail; parent editor surfaces toasts
    }
  };

  return (
    <>
      <div
        data-testid="page-rail"
        className={`flex-shrink-0 bg-slate-900 h-screen flex flex-col overflow-hidden transition-[width] duration-200 ease-out ${
          expanded ? "w-60" : "w-16"
        }`}
      >
        <div
          className={`flex items-center py-3 ${
            expanded ? "px-3 justify-between" : "px-0 justify-center flex-col gap-1"
          }`}
        >
          <Link
            to="/"
            data-testid="page-rail-back"
            className="w-9 h-9 rounded-md flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Back to dashboard"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <button
            type="button"
            data-testid="page-rail-toggle"
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

        {expanded && (
          <div className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 flex items-center justify-between">
            <span>Your pages</span>
            <span className="text-slate-600">{items.length}</span>
          </div>
        )}

        <div
          className={`flex-1 min-h-0 overflow-y-auto ns-rail-scroll ${
            expanded
              ? "px-2 pb-2 space-y-0.5"
              : "px-0 pb-2 flex flex-col items-center gap-1"
          }`}
          data-testid="page-rail-list"
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
              {expanded ? "No pages yet. Add one below." : ""}
            </div>
          ) : (
            items.map((p) => {
              const isActive = activePageId === p.page_id;
              const blockCount = (p.blocks || []).length;
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
                  } ${
                    isActive
                      ? "bg-white text-slate-900"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <FileStack className="w-[18px] h-[18px] flex-shrink-0" />
                  {expanded ? (
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate leading-tight">
                        {p.name}
                      </p>
                      <p
                        className={`text-[10px] uppercase tracking-wider truncate leading-tight ${
                          isActive
                            ? "text-slate-500"
                            : "text-slate-500 group-hover:text-slate-300"
                        }`}
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
            })
          )}
        </div>

        <div
          className={`border-t border-white/5 py-3 ${
            expanded ? "px-3" : "px-0 flex justify-center"
          }`}
        >
          <button
            type="button"
            onClick={() => setPicker(true)}
            data-testid="page-rail-new-page"
            className={`flex items-center justify-center transition-colors ${
              expanded
                ? "w-full h-10 gap-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-medium"
                : "w-11 h-11 rounded-md bg-white/5 hover:bg-white/10 text-slate-200"
            }`}
            title="New page"
            aria-label="New page"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            {expanded && <span>New page</span>}
          </button>
        </div>
      </div>

      {picker && (
        <PageTemplatePicker
          onPick={createFromTemplate}
          onClose={() => setPicker(false)}
        />
      )}
    </>
  );
}
