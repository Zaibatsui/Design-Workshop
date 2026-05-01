import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, FileStack, Plus, Save, Layers } from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { richtext } from "@/sections/richtext";
import { composePage } from "@/sections/pageSnippet";
import { previewDoc } from "@/sections/shared";
import { api } from "@/lib/api";
import { BRAND } from "@/lib/brand";

import PageRail from "./page-editor/PageRail";
import BlockAdder from "./page-editor/BlockAdder";
import BlockEditorDrawer from "./page-editor/BlockEditorDrawer";
import SaveIndicator from "./page-editor/SaveIndicator";
import PagePreviewFrame from "./page-editor/PagePreviewFrame";

const AUTOSAVE_MS = 1500;

// Module-level map of pending draft-delete timers keyed by page id.
// Deferred so StrictMode's dev-time double-mount can cancel them.
const PENDING_DRAFT_DELETES = new Map();
const DRAFT_DELETE_DELAY_MS = 250;

export default function PageEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isNewDraft = searchParams.get("new") === "1";

  const [page, setPage] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [savedAt, setSavedAt] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [adder, setAdder] = useState(false);
  const [librarySections, setLibrarySections] = useState([]);

  // Tracks whether the user has made ANY change since landing on this page.
  // Used to auto-delete empty "new=1" drafts on unmount.
  const hasDirty = useRef(false);
  const isNewRef = useRef(isNewDraft);
  const pageIdRef = useRef(pageId);
  useEffect(() => {
    pageIdRef.current = pageId;
    const pending = PENDING_DRAFT_DELETES.get(pageId);
    if (pending) {
      clearTimeout(pending);
      PENDING_DRAFT_DELETES.delete(pageId);
    }
  }, [pageId]);

  useEffect(() => {
    let cancelled = false;
    setPage(null);
    setLoadError(null);
    api
      .getPage(pageId)
      .then((doc) => !cancelled && setPage(doc))
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e.status === 404 ? "not_found" : "error");
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

  // ── Autosave ─────────────────────────────────────────────────────────────
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
    hasDirty.current = true;
    if (isNewRef.current) {
      isNewRef.current = false;
      setSearchParams({}, { replace: true });
    }
    dirty.current = { ...(dirty.current || {}), ...patch };
    setSaveStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(flushSave, AUTOSAVE_MS);
  };

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (isNewRef.current && !hasDirty.current && pageIdRef.current) {
        const id = pageIdRef.current;
        const t = setTimeout(() => {
          api.deletePage(id).catch(() => {});
          PENDING_DRAFT_DELETES.delete(id);
        }, DRAFT_DELETE_DELAY_MS);
        PENDING_DRAFT_DELETES.set(id, t);
      }
    },
    []
  );

  // ── Block mutation helpers ──────────────────────────────────────────────
  const renamePage = (name) => {
    setPage((prev) => (prev ? { ...prev, name } : prev));
    queueSave({ name });
  };

  const setBlocks = (nextBlocks) => {
    setPage((prev) => (prev ? { ...prev, blocks: nextBlocks } : prev));
    queueSave({ blocks: nextBlocks });
  };

  const makeBlockId = () => `blk_${Math.random().toString(36).slice(2, 10)}`;

  const addNewSectionBlock = (typeId) => {
    const def = SECTIONS_BY_ID[typeId];
    if (!def) return;
    const newBlock = {
      block_id: makeBlockId(),
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
      block_id: makeBlockId(),
      type: "section",
      section_type: section.type,
      // snapshot the library section's config at insertion time so editing
      // the library section doesn't retroactively mutate existing pages
      config: JSON.parse(JSON.stringify(section.config)),
    };
    setBlocks([...(page.blocks || []), newBlock]);
    setSelectedBlockId(newBlock.block_id);
    setAdder(false);
  };

  const addRichTextBlock = () => {
    const newBlock = {
      block_id: makeBlockId(),
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

  // ── Composed snippet + actions ──────────────────────────────────────────
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
    const description =
      window.prompt("Optional short description (leave blank to skip)") || null;
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

  // ── Render ──────────────────────────────────────────────────────────────
  if (loadError === "not_found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <p className="text-slate-700">This page no longer exists.</p>
        <Button onClick={() => navigate("/")}>Back to dashboard</Button>
      </div>
    );
  }
  if (loadError === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <p className="text-slate-700">Couldn't load this page.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
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
      <PageRail
        activePageId={page.page_id}
        blocks={page.blocks || []}
        selectedBlockId={selectedBlockId}
        onSelectBlock={setSelectedBlockId}
        onRemoveBlock={removeBlock}
        onReorderBlocks={reorderBlocks}
        onAddBlock={() => setAdder(true)}
      />

      {/* Left sidebar: block editor drawer when a block is selected, else
          a helpful empty state. Mirrors the Section editor's form-on-left
          layout for consistency. */}
      {selectedBlock ? (
        <BlockEditorDrawer
          block={selectedBlock}
          onUpdate={(patch) => updateBlock(selectedBlock.block_id, patch)}
          onClose={() => setSelectedBlockId(null)}
        />
      ) : (
        <EmptyBlockEditor onAdd={() => setAdder(true)} />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${BRAND.iconBoxClass}`}
            >
              <BRAND.Icon className="w-3 h-3" />
            </div>
            <Input
              value={page.name}
              onChange={(e) => renamePage(e.target.value)}
              data-testid="page-name-input"
              className="font-heading text-sm font-semibold tracking-tight border-0 px-0 h-auto py-0 shadow-none focus-visible:ring-0 truncate max-w-xs"
            />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 flex-shrink-0">
              <FileStack className="w-3 h-3" />
              {(page.blocks || []).length} block
              {(page.blocks || []).length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
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
              <EmptyPageState onAdd={() => setAdder(true)} />
            ) : (
              <PagePreviewFrame
                doc={previewHtml}
                blockCount={(page.blocks || []).length}
              />
            )}
          </div>
        </div>
      </main>

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

function EmptyBlockEditor({ onAdd }) {
  return (
    <aside
      data-testid="empty-block-editor"
      className="w-96 flex-shrink-0 border-r border-slate-200 bg-white h-screen flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
        <Layers className="w-5 h-5 text-slate-400" />
      </div>
      <h2 className="font-heading text-base font-semibold mb-2">
        No block selected
      </h2>
      <p className="text-sm text-slate-500 max-w-xs mb-6">
        Pick a block from the rail to edit its settings, or add a new one to
        start composing this page.
      </p>
      <Button
        onClick={onAdd}
        size="sm"
        className="bg-[#E01839] hover:bg-[#c01530] text-white font-medium"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Add block
      </Button>
    </aside>
  );
}

function EmptyPageState({ onAdd }) {
  return (
    <div className="py-24 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
        <FileStack className="w-5 h-5 text-slate-400" />
      </div>
      <h2 className="font-heading text-lg font-semibold mb-2">Empty page</h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
        Stack library sections, fresh sections, and rich-text blocks to build a
        full page. Export as a single HTML snippet.
      </p>
      <Button
        onClick={onAdd}
        className="bg-[#E01839] hover:bg-[#c01530] text-white font-medium"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Add your first block
      </Button>
    </div>
  );
}
