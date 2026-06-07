import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileStack,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { api } from "@/lib/api";
import PageTemplatePicker from "@/pages/dashboard/PageTemplatePicker";
import {
  RailTab,
  CollapsedTabButton,
  RailFooterButton,
} from "./rail/RailControls";
import BlocksList from "./rail/BlocksList";
import PagesList from "./rail/PagesList";

/**
 * PageRail (prototype v2) — tabbed library + block sidebar.
 *
 * Tabs:
 *   - Blocks  → this page's blocks (drag-reorderable, selectable)
 *   - Pages   → library of user's pages
 *
 * Footer action mirrors the active tab:
 *   - Blocks tab → "+ Add block"
 *   - Pages tab  → "+ New page"
 *
 * Collapsed state shows tab icons only; list is hidden.
 */
export default function PageRail({
  studio = false,
  activePageId,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onRemoveBlock,
  onReorderBlocks,
  onAddBlock,
  onRenameBlock,
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [tab, setTab] = useState("blocks"); // "blocks" | "pages"
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [templatePicker, setTemplatePicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listPages()
      .then((docs) => !cancelled && setPages(docs))
      .catch(() => {})
      .finally(() => setPagesLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh pages whenever the active page changes (e.g. after a rename the
  // rail label would be stale). Cheap at our scale.
  useEffect(() => {
    if (!activePageId) return;
    api.listPages().then(setPages).catch(() => {});
  }, [activePageId]);

  const createFromTemplate = (template) => {
    setTemplatePicker(false);
    // Strip non-serializable fields — the Lucide icon on built-in
    // templates is a forwardRef and not structured-cloneable for the
    // History API.
    const safe = template
      ? { id: template.id, name: template.name, blocks: template.blocks || [] }
      : null;
    navigate("/edit/page/new", { state: { template: safe } });
  };

  const renamePage = async (pageId, name) => {
    setPages((prev) =>
      prev.map((p) => (p.page_id === pageId ? { ...p, name } : p))
    );
    try {
      await api.updatePage(pageId, { name });
    } catch {
      api.listPages().then(setPages).catch(() => {});
    }
  };

  return (
    <>
      <div
        data-testid="page-rail"
        className={`flex-shrink-0 h-screen flex flex-col overflow-hidden transition-[width] duration-200 ease-out ${
          studio
            ? "bg-white border-r border-zinc-200"
            : "bg-slate-900"
        } ${expanded ? "w-64" : "w-16"}`}
      >
        {/* Top: back + collapse toggle */}
        <div
          className={`flex items-center py-3 ${
            expanded
              ? "px-3 justify-between"
              : "px-0 justify-center flex-col gap-1"
          }`}
        >
          <Link
            to="/"
            data-testid="page-rail-back"
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
              studio
                ? "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
            title="Back to dashboard"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <button
            type="button"
            data-testid="page-rail-toggle"
            onClick={() => setExpanded((v) => !v)}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
              studio
                ? "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
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

        {/* Tab switcher */}
        <div
          className={`${
            expanded ? "px-3 pb-2" : "px-0 pb-2 flex flex-col items-center gap-1"
          }`}
          data-testid="page-rail-tabs"
        >
          {expanded ? (
            <div className={`flex items-center gap-1 p-1 rounded-lg ${studio ? "bg-zinc-100" : "bg-white/5"}`}>
              <RailTab
                studio={studio}
                active={tab === "blocks"}
                onClick={() => setTab("blocks")}
                testid="page-rail-tab-blocks"
                count={(blocks || []).length}
                Icon={Layers}
              >
                Blocks
              </RailTab>
              <RailTab
                studio={studio}
                active={tab === "pages"}
                onClick={() => setTab("pages")}
                testid="page-rail-tab-pages"
                count={pages.length}
                Icon={FileStack}
              >
                Pages
              </RailTab>
            </div>
          ) : (
            <>
              <CollapsedTabButton
                studio={studio}
                active={tab === "blocks"}
                onClick={() => setTab("blocks")}
                testid="page-rail-tab-blocks"
                Icon={Layers}
                label="Blocks"
              />
              <CollapsedTabButton
                studio={studio}
                active={tab === "pages"}
                onClick={() => setTab("pages")}
                testid="page-rail-tab-pages"
                Icon={FileStack}
                label="Pages"
              />
            </>
          )}
        </div>

        {/* Active tab content */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto ns-rail-scroll ${
            expanded ? "px-2 pb-2" : "px-0 pb-2 flex flex-col items-center gap-1"
          }`}
          data-testid="page-rail-list"
        >
          {tab === "blocks" ? (
            <BlocksList
              studio={studio}
              blocks={blocks || []}
              selectedBlockId={selectedBlockId}
              onSelect={onSelectBlock}
              onRemove={onRemoveBlock}
              onReorder={onReorderBlocks}
              onRename={onRenameBlock}
              expanded={expanded}
            />
          ) : (
            <PagesList
              studio={studio}
              pages={pages}
              loading={pagesLoading}
              activePageId={activePageId}
              expanded={expanded}
              onRename={renamePage}
            />
          )}
        </div>

        {/* Footer action — mirrors active tab */}
        <div
          className={`border-t py-3 ${studio ? "border-zinc-200" : "border-white/5"} ${
            expanded ? "px-3" : "px-0 flex justify-center"
          }`}
        >
          {tab === "blocks" ? (
            <RailFooterButton
              studio={studio}
              onClick={onAddBlock}
              testid="page-rail-add-block"
              label="Add block"
              expanded={expanded}
            />
          ) : (
            <RailFooterButton
              studio={studio}
              onClick={() => setTemplatePicker(true)}
              testid="page-rail-new-page"
              label="New page"
              expanded={expanded}
            />
          )}
        </div>
      </div>

      {templatePicker && (
        <PageTemplatePicker
          onPick={createFromTemplate}
          onClose={() => setTemplatePicker(false)}
        />
      )}
    </>
  );
}
