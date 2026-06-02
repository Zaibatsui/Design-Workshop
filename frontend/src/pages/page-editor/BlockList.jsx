/**
 * BlockList — drag-and-drop sortable list of the page's blocks, rendered in
 * the Page editor's sidebar between the page name header and the "Add block"
 * button. Pure presentation — all block mutation flows through the parent.
 */
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
import { GripVertical, Layers, Trash2, Type } from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { blockTypeLabel } from "@/sections/pageSnippet";

export default function BlockList({
  blocks,
  selectedBlockId,
  onSelect,
  onRemove,
  onReorder,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-xs text-slate-500 text-center py-8 px-4">
        No blocks yet. Add one below.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
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
        <div className="space-y-1.5">
          {blocks.map((b, i) => (
            <BlockListItem
              key={b.block_id}
              block={b}
              index={i}
              selected={selectedBlockId === b.block_id}
              onSelect={() => onSelect(b.block_id)}
              onRemove={() => onRemove(b.block_id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function BlockListItem({ block, index, selected, onSelect, onRemove }) {
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
  const subLabel = block.name
    ? `${blockTypeLabel(block)} · Block ${index + 1}`
    : `Block ${index + 1}`;

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
          {displayLabel}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 truncate">
          {subLabel}
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
