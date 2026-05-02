/**
 * SectionsTab — sections grid with drag-and-drop reordering, duplicate,
 * delete, and pagination.
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
import { Copy, Layers, Trash2, GripVertical } from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { previewDoc, makeUid } from "@/sections/shared";
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

  const removeSection = async (id) => {
    if (!window.confirm("Delete this section permanently?")) return;
    try {
      await api.deleteSection(id);
      setSections((s) => s.filter((x) => x.section_id !== id));
      toast.success("Section deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const duplicateSection = async (id) => {
    try {
      const dup = await api.duplicateSection(id);
      // Duplicate is created with a head position; prepend optimistically
      setSections((s) => [dup, ...s]);
      toast.success("Section duplicated");
      navigate(`/edit/section/${dup.section_id}`);
    } catch {
      toast.error("Could not duplicate");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const onDragEnd = async (e) => {
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
  };

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
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={pagedSections.map((s) => s.section_id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {pagedSections.map((s) => (
              <SectionCard
                key={s.section_id}
                section={s}
                onDelete={() => removeSection(s.section_id)}
                onDuplicate={() => duplicateSection(s.section_id)}
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

function SectionCard({ section, onDelete, onDuplicate }) {
  const def = SECTIONS_BY_ID[section.type];
  const { wrapRef, scale } = useIframeScale();
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
  };

  if (!def) return null;
  const Icon = def.icon || Layers;
  const previewSnippet = def.render({ ...section.config, uid: makeUid() });
  const doc = previewDoc(previewSnippet);
  const updated = new Date(section.updated_at);

  return (
    <div
      ref={setNodeRef}
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
        style={{ aspectRatio: "20 / 9" }}
      >
        <iframe
          title={section.name}
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
              onDuplicate();
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
              onDelete();
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
}
