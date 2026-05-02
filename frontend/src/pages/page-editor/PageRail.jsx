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
        className={`flex-shrink-0 bg-slate-900 h-screen flex flex-col overflow-hidden transition-[width] duration-200 ease-out ${
          expanded ? "w-64" : "w-16"
        }`}
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

        {/* Tab switcher */}
        <div
          className={`${
            expanded ? "px-3 pb-2" : "px-0 pb-2 flex flex-col items-center gap-1"
          }`}
          data-testid="page-rail-tabs"
        >
          {expanded ? (
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
              <RailTab
                active={tab === "blocks"}
                onClick={() => setTab("blocks")}
                testid="page-rail-tab-blocks"
                count={(blocks || []).length}
                Icon={Layers}
              >
                Blocks
              </RailTab>
              <RailTab
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
                active={tab === "blocks"}
                onClick={() => setTab("blocks")}
                testid="page-rail-tab-blocks"
                Icon={Layers}
                label="Blocks"
              />
              <CollapsedTabButton
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
          className={`border-t border-white/5 py-3 ${
            expanded ? "px-3" : "px-0 flex justify-center"
          }`}
        >
          {tab === "blocks" ? (
            <RailFooterButton
              onClick={onAddBlock}
              testid="page-rail-add-block"
              label="Add block"
              expanded={expanded}
            />
          ) : (
            <RailFooterButton
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
