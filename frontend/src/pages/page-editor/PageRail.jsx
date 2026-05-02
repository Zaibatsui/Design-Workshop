import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  FileStack,
  GripVertical,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { api } from "@/lib/api";
import PageTemplatePicker from "@/pages/dashboard/PageTemplatePicker";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { blockTypeLabel } from "@/sections/pageSnippet";
import InlineEditableLabel from "@/components/InlineEditableLabel";

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

// ─── Subcomponents ────────────────────────────────────────────────────────

function RailTab({ active, onClick, testid, count, Icon, children }) {
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

function CollapsedTabButton({ active, onClick, testid, Icon, label }) {
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

function RailFooterButton({ onClick, testid, label, expanded }) {
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

// ── Blocks list (sortable) ───────────────────────────────────────────────

function BlocksList({
  blocks,
  selectedBlockId,
  onSelect,
  onRemove,
  onReorder,
  onRename,
  expanded,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!blocks.length) {
    return (
      <div
        className={`text-slate-500 ${
          expanded ? "px-3 py-3 text-xs leading-relaxed" : "py-2 text-[10px]"
        }`}
      >
        {expanded ? "No blocks yet. Add one below." : ""}
      </div>
    );
  }

  if (!expanded) {
    // Collapsed: just stacked icons (no drag)
    return (
      <>
        {blocks.map((b) => (
          <CollapsedBlockIcon
            key={b.block_id}
            block={b}
            selected={selectedBlockId === b.block_id}
            onSelect={() => onSelect(b.block_id)}
          />
        ))}
      </>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e) => {
        if (e.over && e.active.id !== e.over.id) {
          onReorder(e.active.id, e.over.id);
        }
      }}
    >
      <SortableContext
        items={blocks.map((b) => b.block_id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {blocks.map((b, i) => (
            <BlockRow
              key={b.block_id}
              block={b}
              index={i}
              selected={selectedBlockId === b.block_id}
              onSelect={() => onSelect(b.block_id)}
              onRemove={() => onRemove(b.block_id)}
              onRename={(name) => onRename && onRename(b.block_id, name)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function BlockRow({ block, index, selected, onSelect, onRemove, onRename }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.block_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon =
    block.type === "richtext"
      ? Type
      : SECTIONS_BY_ID[block.section_type]?.icon || Layers;

  const displayLabel = block.name || blockTypeLabel(block);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`block-item-${block.block_id}`}
      onClick={onSelect}
      className={`group flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer transition-colors ${
        selected
          ? "bg-white text-slate-900"
          : "text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        data-testid={`block-drag-${block.block_id}`}
        onClick={(e) => e.stopPropagation()}
        className={`p-0.5 cursor-grab active:cursor-grabbing ${
          selected ? "text-slate-400" : "text-slate-600 group-hover:text-slate-400"
        }`}
        title="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <InlineEditableLabel
          value={displayLabel}
          onCommit={(next) => onRename && onRename(next)}
          testid={`block-name-${block.block_id}`}
          className="block text-xs font-medium truncate leading-tight"
        />
        <p
          className={`text-[10px] uppercase tracking-wider truncate leading-tight ${
            selected ? "text-slate-500" : "text-slate-500"
          }`}
        >
          {block.name ? `${blockTypeLabel(block)} · B${index + 1}` : `Block ${index + 1}`}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        data-testid={`block-remove-${block.block_id}`}
        className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
          selected ? "text-slate-400 hover:bg-slate-100 hover:text-red-600" : "text-slate-500 hover:bg-white/10 hover:text-red-400"
        }`}
        title="Remove block"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function CollapsedBlockIcon({ block, selected, onSelect }) {
  const Icon =
    block.type === "richtext"
      ? Type
      : SECTIONS_BY_ID[block.section_type]?.icon || Layers;
  const label = block.name || blockTypeLabel(block);
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`block-item-${block.block_id}`}
      title={label}
      aria-label={label}
      className={`group relative w-11 h-11 rounded-md flex items-center justify-center transition-colors ${
        selected
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

// ── Pages list ───────────────────────────────────────────────────────────

function PagesList({ pages, loading, activePageId, expanded, onRename }) {
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
  if (!pages.length) {
    return (
      <div
        className={`text-slate-500 ${
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
                <InlineEditableLabel
                  value={p.name}
                  onCommit={(next) => onRename && onRename(p.page_id, next)}
                  testid={`page-rail-item-${p.page_id}-name`}
                  className="block text-xs font-medium truncate leading-tight"
                />
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
      })}
    </div>
  );
}
