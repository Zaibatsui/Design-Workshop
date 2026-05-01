import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Save,
  Trash2,
  GripVertical,
  FileStack,
  Type,
  Layers,
  X,
} from "lucide-react";
import { SECTIONS, SECTIONS_BY_ID } from "@/sections/registry";
import { richtext } from "@/sections/richtext";
import { composePage, renderBlock, blockTypeLabel } from "@/sections/pageSnippet";
import { previewDoc, makeUid } from "@/sections/shared";
import ColorField from "@/components/ColorField";
import {
  SliderField,
  SelectField,
  ToggleField,
} from "@/components/FormFields";
import RichTextEditor from "@/components/RichTextEditor";
import { api } from "@/lib/api";
import { BRAND } from "@/lib/brand";

const AUTOSAVE_MS = 1500;

export default function PageEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [savedAt, setSavedAt] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [adder, setAdder] = useState(false);

  // Sidebar sections list (for the "Insert from library" picker)
  const [librarySections, setLibrarySections] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setPage(null);
    setLoadError(null);
    api
      .getPage(pageId)
      .then((doc) => {
        if (!cancelled) setPage(doc);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e.status === 404) setLoadError("not_found");
        else setLoadError("error");
      });
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  useEffect(() => {
    api
      .listSections()
      .then(setLibrarySections)
      .catch(() => {});
  }, []);

  // Debounced autosave
  const dirty = useRef(null);
  const timer = useRef(null);
  const inflight = useRef(false);

  const flushSave = async () => {
    if (!dirty.current || inflight.current) return;
    const patch = dirty.current;
    dirty.current = null;
    inflight.current = true;
    setSaveStatus("saving");
    try {
      const updated = await api.updatePage(pageId, patch);
      setPage(updated);
      setSavedAt(Date.now());
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      inflight.current = false;
      if (dirty.current) {
        clearTimeout(timer.current);
        timer.current = setTimeout(flushSave, AUTOSAVE_MS);
      }
    }
  };

  const queueSave = (patch) => {
    dirty.current = { ...(dirty.current || {}), ...patch };
    setSaveStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(flushSave, AUTOSAVE_MS);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const renamePage = (name) => {
    setPage((prev) => (prev ? { ...prev, name } : prev));
    queueSave({ name });
  };

  const setBlocks = (nextBlocks) => {
    setPage((prev) => (prev ? { ...prev, blocks: nextBlocks } : prev));
    queueSave({ blocks: nextBlocks });
  };

  const addNewSectionBlock = (typeId) => {
    const def = SECTIONS_BY_ID[typeId];
    if (!def) return;
    const newBlock = {
      block_id: `blk_${Math.random().toString(36).slice(2, 10)}`,
      type: "section",
      section_type: typeId,
      config: def.defaults(),
    };
    setBlocks([...(page.blocks || []), newBlock]);
    setSelectedBlockId(newBlock.block_id);
    setAdder(false);
  };

  const addLibrarySectionBlock = (section) => {
    const newBlock = {
      block_id: `blk_${Math.random().toString(36).slice(2, 10)}`,
      type: "section",
      section_type: section.type,
      // snapshot the library section's config at insertion time (design choice
      // per user scope: inserted blocks are independent copies so editing the
      // library section doesn't retroactively mutate existing pages)
      config: JSON.parse(JSON.stringify(section.config)),
    };
    setBlocks([...(page.blocks || []), newBlock]);
    setSelectedBlockId(newBlock.block_id);
    setAdder(false);
  };

  const addRichTextBlock = () => {
    const newBlock = {
      block_id: `blk_${Math.random().toString(36).slice(2, 10)}`,
      type: "richtext",
      config: richtext.defaults(),
    };
    setBlocks([...(page.blocks || []), newBlock]);
    setSelectedBlockId(newBlock.block_id);
    setAdder(false);
  };

  const updateBlock = (blockId, patch) => {
    const next = (page.blocks || []).map((b) =>
      b.block_id === blockId
        ? {
            ...b,
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.config !== undefined
              ? { config: { ...(b.config || {}), ...patch.config } }
              : {}),
            ...(patch.replaceConfig !== undefined
              ? { config: patch.replaceConfig }
              : {}),
          }
        : b
    );
    setBlocks(next);
  };

  const removeBlock = (blockId) => {
    setBlocks((page.blocks || []).filter((b) => b.block_id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  const reorderBlocks = (activeId, overId) => {
    const arr = page.blocks || [];
    const oldIndex = arr.findIndex((b) => b.block_id === activeId);
    const newIndex = arr.findIndex((b) => b.block_id === overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    setBlocks(arrayMove(arr, oldIndex, newIndex));
  };

  const snippet = useMemo(
    () => (page ? composePage(page.blocks || []) : ""),
    [page]
  );
  const previewHtml = useMemo(() => previewDoc(snippet), [snippet]);

  const copySnippet = async () => {
    if (!page) return;
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Page HTML copied", {
        description: `${snippet.length.toLocaleString()} chars · paste into any CMS.`,
      });
    } catch {
      toast.error("Copy failed.");
    }
  };

  const saveAsTemplate = async () => {
    if (!page || (page.blocks || []).length === 0) return;
    const name = window.prompt(
      "Template name",
      page.name && page.name !== "Untitled page" ? page.name : ""
    );
    if (!name) return;
    const description = window.prompt("Optional short description (leave blank to skip)") || null;
    try {
      await api.createPageTemplate({
        name,
        description,
        blocks: page.blocks,
      });
      toast.success("Template saved", {
        description: "It'll show up in the New page picker.",
      });
    } catch {
      toast.error("Could not save template");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (loadError === "not_found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <p className="text-slate-700">This page no longer exists.</p>
        <Button onClick={() => navigate("/")}>Back to dashboard</Button>
      </div>
    );
  }
  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  const selectedBlock = (page.blocks || []).find(
    (b) => b.block_id === selectedBlockId
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-body text-slate-900">
      {/* Left sidebar — block list (canvas-on-the-side) */}
      <aside
        data-testid="page-blocks-sidebar"
        className="w-72 flex-shrink-0 border-r border-slate-200 bg-white h-screen flex flex-col"
      >
        <div className="px-5 py-4 border-b border-slate-200">
          <button
            onClick={() => navigate("/")}
            data-testid="back-to-dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All pages
          </button>
          <Input
            value={page.name}
            onChange={(e) => renamePage(e.target.value)}
            data-testid="page-name-input"
            className="font-heading text-base font-semibold tracking-tight border-0 px-0 h-auto py-0 shadow-none focus-visible:ring-0 truncate"
          />
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
            <FileStack className="w-3 h-3" />
            Page · {(page.blocks || []).length} block
            {(page.blocks || []).length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {(page.blocks || []).length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-8 px-4">
              No blocks yet. Add one below.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => {
                if (e.over && e.active.id !== e.over.id) {
                  reorderBlocks(e.active.id, e.over.id);
                }
              }}
            >
              <SortableContext
                items={(page.blocks || []).map((b) => b.block_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {(page.blocks || []).map((b, i) => (
                    <BlockListItem
                      key={b.block_id}
                      block={b}
                      index={i}
                      selected={selectedBlockId === b.block_id}
                      onSelect={() => setSelectedBlockId(b.block_id)}
                      onRemove={() => removeBlock(b.block_id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="p-3 border-t border-slate-200">
          <Button
            onClick={() => setAdder(true)}
            data-testid="add-block-button"
            className="w-full bg-[#E01839] hover:bg-[#c01530] text-white font-medium"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add block
          </Button>
        </div>
      </aside>

      {/* Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center ${BRAND.iconBoxClass}`}
            >
              <BRAND.Icon className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Page preview
            </span>
          </div>
          <div className="flex items-center gap-3">
            <SaveIndicator status={saveStatus} savedAt={savedAt} />
            <Button
              variant="outline"
              onClick={saveAsTemplate}
              disabled={(page.blocks || []).length === 0}
              data-testid="save-as-template-button"
              className="font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              Save as template
            </Button>
            <Button
              data-testid="copy-page-snippet-button"
              onClick={copySnippet}
              disabled={(page.blocks || []).length === 0}
              className="bg-[#E01839] hover:bg-[#c01530] text-white font-medium"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy page snippet
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div
            className="mx-auto bg-white rounded-md border border-slate-200 overflow-hidden"
            style={{ maxWidth: "100%", width: "100%" }}
            data-testid="page-preview-container"
          >
            {(page.blocks || []).length === 0 ? (
              <div className="py-24 px-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
                  <FileStack className="w-5 h-5 text-slate-400" />
                </div>
                <h2 className="font-heading text-lg font-semibold mb-2">
                  Empty page
                </h2>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  Stack library sections, fresh sections, and rich-text blocks
                  to build a full page. Export as a single HTML snippet.
                </p>
                <Button
                  onClick={() => setAdder(true)}
                  className="bg-[#E01839] hover:bg-[#c01530] text-white font-medium"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add your first block
                </Button>
              </div>
            ) : (
              <PagePreviewFrame doc={previewHtml} blockCount={(page.blocks || []).length} />
            )}
          </div>
        </div>
      </main>

      {/* Right drawer — edit selected block */}
      {selectedBlock && (
        <BlockEditorDrawer
          block={selectedBlock}
          onUpdate={(patch) => updateBlock(selectedBlock.block_id, patch)}
          onClose={() => setSelectedBlockId(null)}
        />
      )}

      {adder && (
        <BlockAdder
          librarySections={librarySections}
          onAddNewSection={addNewSectionBlock}
          onAddLibrarySection={addLibrarySectionBlock}
          onAddRichText={addRichTextBlock}
          onClose={() => setAdder(false)}
        />
      )}

      <Toaster richColors position="top-center" />
    </div>
  );
}

function BlockListItem({ block, index, selected, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.block_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon =
    block.type === "richtext"
      ? Type
      : (SECTIONS_BY_ID[block.section_type]?.icon || Layers);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`block-item-${block.block_id}`}
      onClick={onSelect}
      className={`group flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
        selected
          ? "bg-[#E01839]/[0.06] border-[#E01839]/40"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        data-testid={`block-drag-${block.block_id}`}
        onClick={(e) => e.stopPropagation()}
        className="p-1 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-900 truncate">
          {block.name || blockTypeLabel(block)}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-slate-400">
          {block.name ? `${blockTypeLabel(block)} · ` : ""}Block {index + 1}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        data-testid={`block-remove-${block.block_id}`}
        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove block"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function BlockEditorDrawer({ block, onUpdate, onClose }) {
  const isRichText = block.type === "richtext";
  const def = !isRichText ? SECTIONS_BY_ID[block.section_type] : null;
  const typeLabel = blockTypeLabel(block);

  return (
    <aside
      data-testid="block-editor-drawer"
      className="w-96 flex-shrink-0 border-l border-slate-200 bg-white h-screen overflow-y-auto"
    >
      <div className="px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10 flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
            Editing · {typeLabel}
          </div>
          <Input
            value={block.name || ""}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={typeLabel}
            data-testid="block-name-input"
            className="font-heading text-base font-semibold tracking-tight border-0 px-0 h-auto py-0 shadow-none focus-visible:ring-0 truncate placeholder:text-slate-300"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          data-testid="block-editor-close"
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors flex-shrink-0"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        {isRichText ? (
          <RichTextBlockForm block={block} onUpdate={onUpdate} />
        ) : def ? (
          <def.FormPanel
            config={block.config || {}}
            onUpdate={(patch) =>
              onUpdate({
                replaceConfig:
                  typeof patch === "function"
                    ? patch(block.config || {})
                    : { ...(block.config || {}), ...patch },
              })
            }
          />
        ) : (
          <p className="text-xs text-slate-500">
            Unknown section type: {block.section_type}
          </p>
        )}
      </div>
    </aside>
  );
}

function RichTextBlockForm({ block, onUpdate }) {
  const cfg = block.config || {};
  const setCfg = (patch) => onUpdate({ config: patch });
  const mode = cfg.mode || "visual";
  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit"
        data-testid="rt-mode-toggle"
      >
        <ModeTab
          active={mode === "visual"}
          onClick={() => setCfg({ mode: "visual" })}
          testid="rt-mode-visual"
        >
          Visual
        </ModeTab>
        <ModeTab
          active={mode === "source"}
          onClick={() => setCfg({ mode: "source" })}
          testid="rt-mode-source"
        >
          HTML source
        </ModeTab>
      </div>
      {mode === "source" ? (
        <div>
          <textarea
            data-testid="rt-source-textarea"
            value={cfg.html || ""}
            onChange={(e) => setCfg({ html: e.target.value })}
            spellCheck={false}
            className="w-full h-64 p-3 font-mono text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:border-[#E01839] resize-y bg-slate-50"
            placeholder="<section>Paste any HTML — script, iframe, inline handlers all allowed.</section>"
          />
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Raw HTML renders verbatim. Scripts and iframes will execute in the
            preview and in the exported snippet.
          </p>
        </div>
      ) : (
        <RichTextEditor
          html={cfg.html || ""}
          onChange={(html) => setCfg({ html })}
        />
      )}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Layout
        </h3>
        <SliderField
          label="Max width"
          value={cfg.maxWidth ?? 820}
          min={480}
          max={1200}
          step={20}
          unit="px"
          onChange={(v) => setCfg({ maxWidth: v })}
          testid="rt-maxwidth"
        />
        <SliderField
          label="Vertical padding"
          value={cfg.padY ?? 48}
          min={0}
          max={160}
          step={4}
          unit="px"
          onChange={(v) => setCfg({ padY: v })}
          testid="rt-pady"
        />
        <SelectField
          label="Alignment"
          value={cfg.align || "left"}
          onChange={(v) => setCfg({ align: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
          ]}
          testid="rt-align"
        />
        <ToggleField
          label="Full-bleed background"
          checked={!!cfg.fullBleed}
          onChange={(v) => setCfg({ fullBleed: v })}
          testid="rt-fullbleed"
        />
      </div>
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Colors
        </h3>
        <ColorField
          label="Background"
          value={cfg.bg || "#ffffff"}
          onChange={(v) => setCfg({ bg: v })}
          testid="rt-bg"
        />
        <ColorField
          label="Text"
          value={cfg.fg || "#1f2937"}
          onChange={(v) => setCfg({ fg: v })}
          testid="rt-fg"
        />
        <ColorField
          label="Link / accent"
          value={cfg.accent || "#E01839"}
          onChange={(v) => setCfg({ accent: v })}
          testid="rt-accent"
        />
      </div>
    </div>
  );
}

function BlockAdder({
  librarySections,
  onAddNewSection,
  onAddLibrarySection,
  onAddRichText,
  onClose,
}) {
  const [mode, setMode] = useState("new"); // new | library | richtext

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="block-adder"
      >
        <div className="px-8 py-6 border-b border-slate-200">
          <h2 className="font-heading text-xl font-semibold tracking-tight mb-1">
            Add a block
          </h2>
          <p className="text-sm text-slate-500">
            Pick a fresh section type, drop in a saved section from your
            library, or add free-flowing rich text.
          </p>
          <div className="flex gap-1 mt-4 border-b border-slate-200 -mb-6">
            <AdderTab
              active={mode === "new"}
              onClick={() => setMode("new")}
              testid="adder-tab-new"
            >
              New section
            </AdderTab>
            <AdderTab
              active={mode === "library"}
              onClick={() => setMode("library")}
              testid="adder-tab-library"
            >
              From library ({librarySections.length})
            </AdderTab>
            <AdderTab
              active={mode === "richtext"}
              onClick={() => setMode("richtext")}
              testid="adder-tab-richtext"
            >
              Rich text
            </AdderTab>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {mode === "new" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    data-testid={`adder-new-${s.id}`}
                    onClick={() => onAddNewSection(s.id)}
                    className="text-left p-4 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
                  >
                    <Icon className="w-5 h-5 text-[#E01839] mb-2" />
                    <p className="text-sm font-medium text-slate-900">
                      {s.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {s.description}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : mode === "library" ? (
            librarySections.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Layers className="w-6 h-6 mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  No saved sections yet. Create one from the Sections tab.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {librarySections.map((s) => {
                  const def = SECTIONS_BY_ID[s.type];
                  const Icon = def?.icon || Layers;
                  return (
                    <button
                      key={s.section_id}
                      data-testid={`adder-library-${s.section_id}`}
                      onClick={() => onAddLibrarySection(s)}
                      className="text-left p-4 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-[#E01839]" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {def?.name || s.type}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Snapshot — edits to library section won't affect this
                        copy.
                      </p>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="max-w-md">
              <button
                data-testid="adder-richtext-confirm"
                onClick={onAddRichText}
                className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
              >
                <Type className="w-5 h-5 text-[#E01839] mb-2" />
                <p className="text-sm font-medium text-slate-900">
                  Rich-text block
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Headings, paragraphs, lists and links — WYSIWYG editor.
                </p>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdderTab({ active, onClick, testid, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`relative px-3 py-2 text-sm font-medium transition-colors ${
        active ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
      {active && (
        <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#E01839] rounded-full" />
      )}
    </button>
  );
}

function ModeTab({ active, onClick, testid, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function SaveIndicator({ status, savedAt }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (status !== "saved") return;
    const i = setInterval(() => force((n) => n + 1), 15000);
    return () => clearInterval(i);
  }, [status]);

  if (status === "saving") {
    return (
      <span
        data-testid="save-indicator"
        className="text-xs text-slate-500 flex items-center gap-1.5"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        data-testid="save-indicator"
        className="text-xs text-red-600 flex items-center gap-1.5"
      >
        Save failed
      </span>
    );
  }
  if (status === "saved" && savedAt) {
    const sec = Math.floor((Date.now() - savedAt) / 1000);
    return (
      <span
        data-testid="save-indicator"
        className="text-xs text-slate-500 flex items-center gap-1.5"
      >
        <Check className="w-3 h-3 text-emerald-500" />
        Saved {sec < 5 ? "just now" : `${sec}s ago`}
      </span>
    );
  }
  return null;
}

function PagePreviewFrame({ doc, blockCount }) {
  // Size the iframe generously — content can be arbitrarily tall. 280px per
  // block is a rough floor; user can scroll within the iframe for the real
  // rendered height.
  const h = Math.max(640, blockCount * 320);
  return (
    <iframe
      data-testid="page-preview-iframe"
      title="Page preview"
      srcDoc={doc}
      sandbox="allow-scripts allow-same-origin"
      className="w-full block border-0"
      style={{ height: `${h}px` }}
    />
  );
}
