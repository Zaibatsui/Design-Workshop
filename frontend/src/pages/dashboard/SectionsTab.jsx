/**
 * SectionsTab — sections grid with drag-and-drop reordering, duplicate,
 * delete, and pagination.
 */
import { useCallback, useEffect, useMemo, useState, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DndContext,
  closestCorners,
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
import { Copy, Layers, Trash2, GripVertical } from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { previewDoc, makeUid } from "@/sections/shared";
import { api } from "@/lib/api";
import {
  EmptyState,
  mergeRefs,
  MASONRY_ROW_GAP,
  MASONRY_ROW_UNIT,
  PAGE_SIZE,
  Pagination,
  PREVIEW_INTERNAL_HEIGHT,
  PREVIEW_INTERNAL_WIDTH,
  timeAgo,
  useGridRowSpan,
  useIframeScale,
} from "./common";

export default function SectionsTab({
  sections,
  setSections,
  onCreateClick,
  loading,
}) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(sections.length / PAGE_SIZE));
  const pagedSections = useMemo(
    () =>
      sections.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE),
    [sections, page]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const removeSection = useCallback(
    async (id) => {
      if (!window.confirm("Delete this section permanently?")) return;
      try {
        await api.deleteSection(id);
        setSections((s) => s.filter((x) => x.section_id !== id));
        toast.success("Section deleted");
      } catch {
        toast.error("Delete failed");
      }
    },
    [setSections]
  );

  const duplicateSection = useCallback(
    async (id) => {
      try {
        const dup = await api.duplicateSection(id);
        // Duplicate is created with a head position; prepend optimistically
        setSections((s) => [dup, ...s]);
        toast.success("Section duplicated");
        navigate(`/edit/section/${dup.section_id}`);
      } catch {
        toast.error("Could not duplicate");
      }
    },
    [navigate, setSections]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const onDragEnd = useCallback(
    async (e) => {
      if (!e.over || e.active.id === e.over.id) return;
      // Reorder WITHIN the full list so positions survive pagination.
      const ids = sections.map((s) => s.section_id);
      const oldIndex = ids.indexOf(e.active.id);
      const newIndex = ids.indexOf(e.over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const nextIds = arrayMove(ids, oldIndex, newIndex);
      const byId = Object.fromEntries(sections.map((s) => [s.section_id, s]));
      // Optimistic UI + persist
      setSections(nextIds.map((id, i) => ({ ...byId[id], position: i })));
      try {
        await api.reorderSections(nextIds);
      } catch {
        toast.error("Could not save new order");
      }
    },
    [sections, setSections]
  );

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (sections.length === 0) {
    return (
      <EmptyState
        title="Nothing here yet"
        body="Create your first section — pick a type, customise it, and copy the snippet into your CMS. Everything autosaves."
        ctaLabel="Create your first section"
        onCreate={onCreateClick}
        testId="empty-create-button"
        icon={Layers}
      />
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={pagedSections.map((s) => s.section_id)}
          strategy={rectSortingStrategy}
        >
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            style={{
              gridAutoRows: `${MASONRY_ROW_UNIT}px`,
              columnGap: `${MASONRY_ROW_GAP}px`,
              rowGap: `${MASONRY_ROW_GAP}px`,
            }}
          >
            {pagedSections.map((s) => (
              <SectionCard
                key={s.section_id}
                section={s}
                onDelete={removeSection}
                onDuplicate={duplicateSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {sections.length > PAGE_SIZE && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          total={sections.length}
        />
      )}
    </>
  );
}

const SectionCard = memo(function SectionCard({ section, onDelete, onDuplicate }) {
  const def = SECTIONS_BY_ID[section.type];
  const { wrapRef, iframeRef, scale, contentHeight, visible } = useIframeScale();
  const { measureRef, span } = useGridRowSpan();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.section_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : undefined,
    gridRowEnd: `span ${span}`,
    alignSelf: "start",
  };

  // Memoize the heavy work — section.config is reference-stable across
  // parent re-renders (dnd/hover/pagination), so we only rebuild the
  // snippet + doc string when the section actually changes.
  const doc = useMemo(() => {
    if (!def) return "";
    const snippet = def.render({ ...section.config, uid: makeUid() });
    return previewDoc(snippet);
  }, [def, section.config]);

  if (!def) return null;
  const Icon = def.icon || Layers;
  const updated = new Date(section.updated_at);

  // Card preview area shrink-wraps to the actual scaled section height.
  // Before the iframe mounts/measures (contentHeight === 0), fall back
  // to a 16:9 placeholder so cards don't pop from 720px → real height.
  // Min: 90px keeps a usable click target for tiny sections.
  // Max: 4:3 of card width ceiling for unusually tall sections.
  const cardWidthVirtual = PREVIEW_INTERNAL_WIDTH * scale;
  const maxPreviewHeight = cardWidthVirtual * (4 / 3);
  const previewHeight =
    contentHeight > 0
      ? Math.min(maxPreviewHeight, Math.max(90, contentHeight * scale))
      : cardWidthVirtual * (9 / 16);

  return (
    <div
      ref={mergeRefs(setNodeRef, measureRef)}
      style={style}
      data-testid={`section-card-${section.section_id}`}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all flex flex-col relative"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        data-testid={`drag-section-${section.section_id}`}
        onClick={(e) => e.preventDefault()}
        className="absolute top-2 left-2 z-10 p-1.5 rounded-md bg-white/90 backdrop-blur text-slate-500 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shadow-sm"
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <Link
        ref={wrapRef}
        to={`/edit/section/${section.section_id}`}
        className="block bg-slate-100 overflow-hidden relative w-full"
        style={{ height: previewHeight ? `${previewHeight}px` : undefined }}
      >
        {visible && (
          <iframe
            ref={iframeRef}
            title={section.name}
            srcDoc={doc}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
            className="border-0 pointer-events-none block absolute top-0 left-0"
            style={{
              width: `${PREVIEW_INTERNAL_WIDTH}px`,
              height: `${contentHeight || PREVIEW_INTERNAL_HEIGHT}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
      <div className="p-4 flex items-center justify-between gap-3 flex-1">
        <Link
          to={`/edit/section/${section.section_id}`}
          className="min-w-0 flex-1"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <Icon className="w-3 h-3" />
            {def.name}
          </div>
          <p
            className="text-sm font-medium text-slate-900 truncate"
            data-testid="section-card-title"
          >
            {section.name}
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
              onDuplicate(section.section_id);
            }}
            data-testid={`duplicate-section-${section.section_id}`}
            className="p-2 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onDelete(section.section_id);
            }}
            data-testid={`delete-${section.section_id}`}
            className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
