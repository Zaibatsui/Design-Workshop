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
import InlineEditableLabel from "@/components/InlineEditableLabel";

/**
 * BlocksList — the page-content side of the PageRail. Drag-reorderable
 * sortable rows when expanded, stacked icon buttons when collapsed.
 *
 * Selecting a row tells the parent PageEditor to open the matching
 * BlockEditorDrawer; renaming updates the block's `name` field via the
 * shared autosave queue.
 */
export default function BlocksList({
  studio,
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
        className={`${studio ? "text-zinc-500" : "text-slate-500"} ${
          expanded ? "px-3 py-3 text-xs leading-relaxed" : "py-2 text-[10px]"
        }`}
      >
        {expanded ? "No blocks yet. Add one below." : ""}
      </div>
    );
  }

  if (!expanded) {
    return (
      <>
        {blocks.map((b) => (
          <CollapsedBlockIcon
            key={b.block_id}
            studio={studio}
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
              studio={studio}
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

function BlockRow({ studio, block, index, selected, onSelect, onRemove, onRename }) {
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

  const rowCls = studio
    ? selected
      ? "bg-blue-50 text-blue-900 border border-blue-200"
      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent"
    : selected
    ? "bg-white text-slate-900"
    : "text-slate-400 hover:bg-white/10 hover:text-white";

  const gripCls = studio
    ? selected
      ? "text-blue-400"
      : "text-zinc-400 group-hover:text-zinc-500"
    : selected
    ? "text-slate-400"
    : "text-slate-600 group-hover:text-slate-400";

  const captionCls = studio
    ? selected
      ? "text-blue-700"
      : "text-zinc-400"
    : "text-slate-500";

  const removeCls = studio
    ? selected
      ? "text-blue-400 hover:bg-blue-100 hover:text-red-600"
      : "text-zinc-400 hover:bg-zinc-200 hover:text-red-600"
    : selected
    ? "text-slate-400 hover:bg-slate-100 hover:text-red-600"
    : "text-slate-500 hover:bg-white/10 hover:text-red-400";

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`block-item-${block.block_id}`}
      onClick={onSelect}
      className={`group flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer transition-colors ${rowCls}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        data-testid={`block-drag-${block.block_id}`}
        onClick={(e) => e.stopPropagation()}
        className={`p-0.5 cursor-grab active:cursor-grabbing ${gripCls}`}
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
          className={`text-[10px] uppercase tracking-wider truncate leading-tight ${captionCls}`}
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
        className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${removeCls}`}
        title="Remove block"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function CollapsedBlockIcon({ studio, block, selected, onSelect }) {
  const Icon =
    block.type === "richtext"
      ? Type
      : SECTIONS_BY_ID[block.section_type]?.icon || Layers;
  const label = block.name || blockTypeLabel(block);
  const cls = studio
    ? selected
      ? "bg-blue-50 text-blue-900 border border-blue-200"
      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
    : selected
    ? "bg-white text-slate-900"
    : "text-slate-400 hover:bg-white/10 hover:text-white";
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`block-item-${block.block_id}`}
      title={label}
      aria-label={label}
      className={`group relative w-11 h-11 rounded-md flex items-center justify-center transition-colors ${cls}`}
    >
      <Icon className="w-4 h-4" />
      <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
        {label}
      </span>
    </button>
  );
}
