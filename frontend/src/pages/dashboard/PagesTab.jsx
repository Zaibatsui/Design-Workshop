/**
 * PagesTab — pages grid with drag-and-drop reordering, duplicate, delete,
 * and pagination. Mirrors SectionsTab but for Pages entity.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, FileStack, Trash2, GripVertical } from "lucide-react";
import { previewDoc } from "@/sections/shared";
import { composePage } from "@/sections/pageSnippet";
import { api } from "@/lib/api";
import {
  EmptyState,
  PAGE_SIZE,
  Pagination,
  PREVIEW_INTERNAL_HEIGHT,
  PREVIEW_INTERNAL_WIDTH,
  timeAgo,
  useIframeScale,
} from "./common";

export default function PagesTab({ pages, setPages, onCreateClick, loading }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(pages.length / PAGE_SIZE));
  const pagedPages = useMemo(
    () =>
      pages.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE),
    [pages, page]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const removePage = async (id) => {
    if (!window.confirm("Delete this page permanently?")) return;
    try {
      await api.deletePage(id);
      setPages((p) => p.filter((x) => x.page_id !== id));
      toast.success("Page deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const duplicatePage = async (id) => {
    try {
      const dup = await api.duplicatePage(id);
      setPages((p) => [dup, ...p]);
      toast.success("Page duplicated");
      navigate(`/edit/page/${dup.page_id}`);
    } catch {
      toast.error("Could not duplicate");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const onDragEnd = async (e) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = pages.map((p) => p.page_id);
    const oldIndex = ids.indexOf(e.active.id);
    const newIndex = ids.indexOf(e.over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const nextIds = arrayMove(ids, oldIndex, newIndex);
    const byId = Object.fromEntries(pages.map((p) => [p.page_id, p]));
    setPages(nextIds.map((id, i) => ({ ...byId[id], position: i })));
    try {
      await api.reorderPages(nextIds);
    } catch {
      toast.error("Could not save new order");
    }
  };

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (pages.length === 0) {
    return (
      <EmptyState
        title="No pages yet"
        body="Build multi-section pages by stacking library sections or fresh blocks, with rich text in between. Export as one self-contained HTML snippet."
        ctaLabel="Create your first page"
        onCreate={onCreateClick}
        testId="empty-create-page-button"
        icon={FileStack}
      />
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={pagedPages.map((p) => p.page_id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pagedPages.map((p) => (
              <PageCard
                key={p.page_id}
                page={p}
                onDelete={() => removePage(p.page_id)}
                onDuplicate={() => duplicatePage(p.page_id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {pages.length > PAGE_SIZE && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          total={pages.length}
        />
      )}
    </>
  );
}

function PageCard({ page, onDelete, onDuplicate }) {
  const { wrapRef, scale } = useIframeScale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.page_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  const snippet = useMemo(() => composePage(page.blocks || []), [page.blocks]);
  const doc = previewDoc(snippet);
  const updated = new Date(page.updated_at);
  const blockCount = (page.blocks || []).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`page-card-${page.page_id}`}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all flex flex-col relative"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        data-testid={`drag-page-${page.page_id}`}
        onClick={(e) => e.preventDefault()}
        className="absolute top-2 left-2 z-10 p-1.5 rounded-md bg-white/90 backdrop-blur text-slate-500 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shadow-sm"
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <Link
        ref={wrapRef}
        to={`/edit/page/${page.page_id}`}
        className="block bg-slate-100 overflow-hidden relative w-full"
        style={{ aspectRatio: "20 / 9" }}
      >
        {blockCount > 0 ? (
          <iframe
            title={page.name}
            srcDoc={doc}
            sandbox="allow-scripts allow-same-origin"
            className="border-0 pointer-events-none block absolute top-0 left-0"
            style={{
              width: `${PREVIEW_INTERNAL_WIDTH}px`,
              height: `${PREVIEW_INTERNAL_HEIGHT}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
            <FileStack className="w-6 h-6" />
            <span className="text-xs font-medium">Empty page</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
      <div className="p-4 flex items-center justify-between gap-3 flex-1">
        <Link to={`/edit/page/${page.page_id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <FileStack className="w-3 h-3" />
            Page · {blockCount} block{blockCount === 1 ? "" : "s"}
          </div>
          <p
            className="text-sm font-medium text-slate-900 truncate"
            data-testid="page-card-name"
          >
            {page.name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Edited {timeAgo(updated)}
          </p>
        </Link>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onDuplicate();
            }}
            data-testid={`duplicate-page-${page.page_id}`}
            className="p-2 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            data-testid={`delete-page-${page.page_id}`}
            className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
