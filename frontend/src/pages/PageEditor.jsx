import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, FileStack, Monitor, Pencil, Plus, Save, Smartphone, Tablet, Layers } from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { richtext } from "@/sections/richtext";
import { composePage } from "@/sections/pageSnippet";
import { previewDoc } from "@/sections/shared";
import { api } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { useBrandKit } from "@/lib/BrandKitContext";
import {
  applyBrandKit,
  applyBrandKitToRichText,
  applyFontToSnippet,
} from "@/lib/brandKit";

import PageRail from "./page-editor/PageRail";
import BlockAdder from "./page-editor/BlockAdder";
import BlockEditorDrawer from "./page-editor/BlockEditorDrawer";
import EmptyBlockEditor from "./page-editor/EmptyBlockEditor";
import SaveIndicator from "./page-editor/SaveIndicator";
import StudioToggle from "@/components/studio/StudioToggle";
import UserMenu from "@/components/UserMenu";
import CollectionPicker from "@/components/CollectionPicker";
import PagePreviewFrame from "./page-editor/PagePreviewFrame";
import SaveAsTemplateDialog from "./page-editor/SaveAsTemplateDialog";

const AUTOSAVE_MS = 1500;

export default function PageEditor({ studio = false }) {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isNewDraft = pageId === "new";

  const [page, setPage] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [savedAt, setSavedAt] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [adder, setAdder] = useState(false);
  const [librarySections, setLibrarySections] = useState([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState("desktop");
  const { brandKit } = useBrandKit();

  // After first save POSTs the new page, we navigate-replace from
  // /edit/page/new → /edit/page/<realId>. Skip the load effect's fetch on
  // that one round so it doesn't clobber state we just set locally.
  const skipNextLoadRef = useRef(false);

  useEffect(() => {
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return undefined;
    }
    if (isNewDraft) {
      // Pristine in-memory draft. Template payload comes via React Router
      // state (set by Dashboard / PageRail when invoking 'New page').
      const template = location.state?.template || null;
      const name =
        template && template.id !== "blank" ? template.name : "Untitled page";
      // Template blocks live in memory until first save — stamp a block_id
      // on each one now so they can be selected, dragged, deleted, and
      // edited in the rail before the DB-side normalization runs. Also
      // overlay the user's brand kit so a freshly-templated page picks
      // up the user's colours / fonts / logo immediately instead of
      // showing the section's shipped defaults.
      const blocks = (template?.blocks || []).map((b) => {
        const stamped = {
          ...b,
          block_id: b.block_id || `blk_${Math.random().toString(36).slice(2, 10)}`,
        };
        if (!brandKit) return stamped;
        if (stamped.type === "section" && stamped.section_type) {
          return {
            ...stamped,
            config: applyBrandKit(
              stamped.section_type,
              stamped.config || {},
              brandKit,
              { seedLogos: true }
            ),
          };
        }
        if (stamped.type === "richtext") {
          return {
            ...stamped,
            config: applyBrandKitToRichText(stamped.config || {}, brandKit),
          };
        }
        return stamped;
      });
      setPage({ page_id: null, name, blocks });
      setLoadError(null);
      return undefined;
    }
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
    // location.state intentionally excluded — only relevant at first init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, isNewDraft]);

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
  const creatingRef = useRef(false);

  const flushSave = async () => {
    if (!page || inflight.current || creatingRef.current) return;

    // First save on a brand-new draft — POST instead of PATCH.
    if (!page.page_id) {
      if (!dirty.current) return;
      creatingRef.current = true;
      setSaveStatus("saving");
      const snapshot = {
        name: page.name,
        blocks: page.blocks || [],
        ...dirty.current,
      };
      // Carry through the "save into collection" hint set by the
      // dashboard at the New-page click. The collection_id is verified
      // on the server; bad values 422.
      const newCollectionId = location.state?.collection_id || null;
      if (newCollectionId) {
        snapshot.collection_id = newCollectionId;
      }
      dirty.current = null;
      try {
        const created = await api.createPage(snapshot);
        skipNextLoadRef.current = true;
        setPage(created);
        setSavedAt(Date.now());
        setSaveStatus("saved");
        navigate(`/edit/page/${created.page_id}`, { replace: true });
      } catch {
        setSaveStatus("error");
      } finally {
        creatingRef.current = false;
        if (dirty.current) {
          clearTimeout(timer.current);
          timer.current = setTimeout(flushSave, AUTOSAVE_MS);
        }
      }
      return;
    }

    if (!dirty.current) return;
    const patch = dirty.current;
    dirty.current = null;
    inflight.current = true;
    setSaveStatus("saving");
    try {
      const updated = await api.updatePage(page.page_id, patch);
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
      config: applyBrandKit(typeId, def.defaults(), brandKit, { seedLogos: true, seedDefaults: true }),
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
      config: applyBrandKitToRichText(richtext.defaults(), brandKit),
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
    () =>
      page
        ? applyFontToSnippet(
            composePage(page.blocks || []),
            brandKit?.heading_font
          )
        : "",
    [page, brandKit]
  );
  // Deferred snippet keeps form interactions (drag, slider, color pickers)
  // smooth while the iframe re-render is non-urgent.
  const deferredSnippet = useDeferredValue(snippet);
  // Show the editor-only VAT toggle pill in the preview if any block on
  // this page is a Product Carousel or Product Grid — so editors can
  // verify how host-page VAT toggling affects scraped prices without
  // leaving Design Workshop.
  const hasProducts = useMemo(
    () =>
      (page?.blocks || []).some(
        (b) => b?.type === "products" || b?.type === "productGrid"
      ),
    [page]
  );
  const previewHtml = useMemo(
    () =>
      previewDoc(deferredSnippet, {
        withVatToggle: hasProducts,
        // Click-to-edit affordances are Studio-only. In Classic mode
        // the page preview matches the exported snippet behaviour
        // (no hover outlines, no click-to-jump, no postMessage chatter).
        withClickBridge: studio,
      }),
    [deferredSnippet, hasProducts, studio]
  );

  // ── Click-to-edit bridge ─────────────────────────────────────────
  // The preview iframe posts a message whenever the user clicks any
  // element with a `data-ns-block-id`, `data-ns-group`, or
  // `data-ns-list`/`data-ns-item` ancestor. Translate that into
  // editor state: select the block (so the right pane swaps to its
  // editor) AND dispatch the same studio jump-event the outline rail
  // uses so the matching FormGroup expands AND — when a per-row
  // marker was hit — expand that specific list row.
  useEffect(() => {
    const onMessage = (e) => {
      const d = e?.data;
      if (!d || d.type !== "ns-preview-click") return;
      if (d.blockId) {
        setSelectedBlockId(d.blockId);
      }
      // Defer all subsequent dispatches until React has had a tick to
      // mount the inspector for the newly selected block, so listeners
      // are in place when the events fire.
      setTimeout(() => {
        if (d.group) {
          window.dispatchEvent(
            new CustomEvent("ns-studio-jump-to-group", {
              detail: { groupValue: d.group },
            })
          );
        }
        if (d.list && Number.isInteger(d.itemIndex)) {
          window.dispatchEvent(
            new CustomEvent("ns-studio-expand-item", {
              detail: { list: d.list, itemIndex: d.itemIndex },
            })
          );
        }
      }, 80);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

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

  const saveAsTemplate = async ({ name, description }) => {
    if (!page || (page.blocks || []).length === 0) return;
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
      throw new Error("save-failed"); // keeps dialog open for retry
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
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        studio ? "bg-zinc-50 text-zinc-900" : "bg-slate-50 font-body text-slate-900"
      }`}
      style={studio ? { fontFamily: "'IBM Plex Sans', system-ui, sans-serif" } : undefined}
      data-testid={studio ? "studio-page-editor" : undefined}
    >
      <PageRail
        studio={studio}
        activePageId={page.page_id}
        blocks={page.blocks || []}
        selectedBlockId={selectedBlockId}
        onSelectBlock={setSelectedBlockId}
        onRemoveBlock={removeBlock}
        onReorderBlocks={reorderBlocks}
        onAddBlock={() => setAdder(true)}
        onRenameBlock={(blockId, name) => updateBlock(blockId, { name })}
      />

      {/* Classic mode keeps the form drawer pinned to the LEFT (between
          PageRail and the canvas) — mirrors the original layout. Studio
          mode moves the drawer to the RIGHT for parity with StudioEditor
          (rendered after the <main> below). */}
      {!studio && (selectedBlock ? (
        <BlockEditorDrawer
          studio={false}
          block={selectedBlock}
          onUpdate={(patch) => updateBlock(selectedBlock.block_id, patch)}
          onClose={() => setSelectedBlockId(null)}
        />
      ) : (
        <EmptyBlockEditor studio={false} onAdd={() => setAdder(true)} />
      ))}

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {studio ? (
          <div className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 gap-4 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="group relative flex items-center"
                data-testid="page-name-field"
              >
                <Input
                  value={page.name}
                  onChange={(e) => renamePage(e.target.value)}
                  data-testid="page-name-input"
                  placeholder="Untitled page"
                  className="font-semibold text-[14px] tracking-tight border border-zinc-200 hover:border-[#E01839] focus-visible:border-[#E01839] focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-8 py-0 shadow-none rounded-md min-w-[180px] max-w-[360px] bg-white hover:bg-red-50/40 transition-colors pr-8"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                />
                <Pencil
                  className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#E01839] group-focus-within:text-[#E01839] absolute right-2.5 pointer-events-none transition-colors"
                  strokeWidth={2}
                />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 hidden lg:flex items-center gap-1 flex-shrink-0">
                <FileStack className="w-3 h-3" />
                {(page.blocks || []).length} block
                {(page.blocks || []).length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <SaveIndicator status={saveStatus} savedAt={savedAt} />
              <div className="hidden md:block h-5 w-px bg-zinc-200 mx-1" />
              <CollectionPicker
                itemType="page"
                itemId={page.page_id}
                collectionId={page.collection_id ?? null}
                onChange={(newId) =>
                  setPage((prev) =>
                    prev ? { ...prev, collection_id: newId } : prev
                  )
                }
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTemplateDialogOpen(true)}
                disabled={(page.blocks || []).length === 0}
                data-testid="save-as-template-button"
                title="Save as template"
                className="h-8 text-[12px] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 gap-1.5 font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Save as template</span>
              </Button>
              <div className="hidden md:block h-5 w-px bg-zinc-200 mx-1" />
              <StudioToggle />
              <div className="hidden md:block h-5 w-px bg-zinc-200 mx-1" />
              <Button
                data-testid="copy-page-snippet-button"
                onClick={copySnippet}
                disabled={(page.blocks || []).length === 0}
                title="Copy snippet"
                className="h-8 xl:w-[200px] justify-center bg-[#E01839] hover:bg-[#c01530] text-white text-[12px] font-medium gap-1.5 px-3 ml-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Copy snippet</span>
              </Button>
            </div>
          </div>
        ) : (
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
            <CollectionPicker
              itemType="page"
              itemId={page.page_id}
              collectionId={page.collection_id ?? null}
              onChange={(newId) =>
                setPage((prev) =>
                  prev ? { ...prev, collection_id: newId } : prev
                )
              }
            />
            <Button
              variant="outline"
              onClick={() => setTemplateDialogOpen(true)}
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
            <StudioToggle />
            <UserMenu />
          </div>
        </div>
        )}

        <div className={`flex-1 overflow-auto p-6 ${studio ? "bg-zinc-100" : "bg-slate-50"}`}>
          {studio && (
            <div
              className="max-w-7xl mx-auto mb-3 flex items-center justify-between"
              data-testid="page-canvas-toolbar"
            >
              <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-zinc-500">
                Canvas
              </span>
              <div className="flex items-center bg-white rounded-md p-0.5 border border-zinc-200">
                {[
                  { id: "desktop", Icon: Monitor },
                  { id: "tablet", Icon: Tablet },
                  { id: "mobile", Icon: Smartphone },
                ].map(({ id, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPreviewWidth(id)}
                    data-testid={`page-viewport-${id}`}
                    title={id.charAt(0).toUpperCase() + id.slice(1)}
                    className={`flex items-center justify-center h-7 w-9 rounded transition-colors ${
                      previewWidth === id
                        ? "bg-zinc-100 text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div
            className={`mx-auto bg-white overflow-hidden transition-[max-width] duration-300 ${
              studio
                ? "rounded-xl border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.06)]"
                : "rounded-md border border-slate-200"
            }`}
            style={{
              maxWidth: studio
                ? previewWidth === "tablet"
                  ? "820px"
                  : previewWidth === "mobile"
                  ? "390px"
                  : "100%"
                : "100%",
              width: "100%",
            }}
            data-testid="page-preview-container"
          >
            {(page.blocks || []).length === 0 ? (
              <EmptyPageState studio={studio} onAdd={() => setAdder(true)} />
            ) : (
              <PagePreviewFrame
                doc={previewHtml}
                blockCount={(page.blocks || []).length}
              />
            )}
          </div>
        </div>
      </main>

      {/* Studio mode: block editor lives on the RIGHT for parity with
          StudioEditor's Outline · Canvas · Inspector layout. */}
      {studio && (selectedBlock ? (
        <BlockEditorDrawer
          studio
          block={selectedBlock}
          onUpdate={(patch) => updateBlock(selectedBlock.block_id, patch)}
          onClose={() => setSelectedBlockId(null)}
        />
      ) : (
        <EmptyBlockEditor studio onAdd={() => setAdder(true)} />
      ))}

      {adder && (
        <BlockAdder
          librarySections={librarySections}
          onAddNewSection={addNewSectionBlock}
          onAddLibrarySection={addLibrarySectionBlock}
          onAddRichText={addRichTextBlock}
          onClose={() => setAdder(false)}
        />
      )}

      <SaveAsTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        defaultName={
          page.name && page.name !== "Untitled page" ? page.name : ""
        }
        blockCount={(page.blocks || []).length}
        onSubmit={saveAsTemplate}
      />

      <Toaster richColors position="top-center" />
    </div>
  );
}

function EmptyPageState({ studio = false, onAdd }) {
  return (
    <div className="py-24 px-6 text-center">
      <div
        className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-4 ${
          studio ? "bg-zinc-100" : "bg-slate-100"
        }`}
      >
        <FileStack className={`w-5 h-5 ${studio ? "text-zinc-400" : "text-slate-400"}`} />
      </div>
      <h2 className="font-heading text-lg font-semibold mb-2">Empty page</h2>
      <p className={`text-sm max-w-sm mx-auto mb-6 ${studio ? "text-zinc-500" : "text-slate-500"}`}>
        Stack library sections, fresh sections, and rich-text blocks to build a
        full page. Export as a single HTML snippet.
      </p>
      <Button
        onClick={onAdd}
        className={
          studio
            ? "bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
            : "bg-[#E01839] hover:bg-[#c01530] text-white font-medium"
        }
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Add your first block
      </Button>
    </div>
  );
}
