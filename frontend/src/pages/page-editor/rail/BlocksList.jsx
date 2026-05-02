import { useState } from "react";
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
import { LIBRARY_DRAG_MIME } from "./LibraryList";

/**
 * BlocksList — the page-content side of the PageRail. Drag-reorderable
 * sortable rows when expanded, stacked icon buttons when collapsed.
 *
 * Also accepts HTML5-native drops from the Library tab (see LibraryList).
 * When a library tile is dragged over the list, thin drop indicators
 * appear above each row and below the last row — dropping calls
 * `onInsertLibrarySection(sectionId, index)` so the parent PageEditor
 * can clone the section into the page at that position.
 *
 * Selecting a row tells the parent PageEditor to open the matching
 * BlockEditorDrawer; renaming updates the block's `name` field via the
 * shared autosave queue.
 */
export default function BlocksList({
  blocks,
  selectedBlockId,
  onSelect,
  onRemove,
  onReorder,
  onRename,
  onInsertLibrarySection,
  expanded,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  // -1 = no drop indicator visible. 0..blocks.length = insert position.
  const [dropIndex, setDropIndex] = useState(-1);

  const libraryDragPresent = (e) => {
    // Custom MIME can't be inspected during dragover in all browsers
    // (only types list is readable), so we sniff the types array.
    return Array.from(e.dataTransfer?.types || []).includes(LIBRARY_DRAG_MIME);
  };

  const onContainerDragOver = (e) => {
    if (!libraryDragPresent(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const onContainerDragLeave = (e) => {
    // Only clear when leaving the outer container entirely.
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDropIndex(-1);
  };

  const onContainerDrop = (e) => {
    if (!libraryDragPresent(e)) return;
    e.preventDefault();
    const sectionId = e.dataTransfer.getData(LIBRARY_DRAG_MIME);
    const target = dropIndex < 0 ? blocks.length : dropIndex;
    setDropIndex(-1);
    if (sectionId && onInsertLibrarySection) {
      onInsertLibrarySection(sectionId, target);
    }
  };

  if (!blocks.length) {
    return (
      <div
        onDragOver={onContainerDragOver}
        onDragLeave={onContainerDragLeave}
        onDrop={onContainerDrop}
        className={`text-slate-500 transition-colors rounded-md ${
          expanded ? "px-3 py-3 text-xs leading-relaxed" : "py-2 text-[10px]"
        } ${libraryDropActive(dropIndex) ? "bg-[#E01839]/10 outline outline-2 outline-[#E01839]/50 outline-offset-[-2px]" : ""}`}
        onDragEnter={(e) => {
          if (libraryDragPresent(e)) setDropIndex(0);
        }}
      >
        {expanded
          ? "No blocks yet. Add one below, or drag a library section in."
          : ""}
      </div>
    );
  }

  if (!expanded) {
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
        <div
          data-testid="blocks-list-drop-host"
          onDragOver={onContainerDragOver}
          onDragLeave={onContainerDragLeave}
          onDrop={onContainerDrop}
          className="space-y-1"
        >
          {blocks.map((b, i) => (
            <BlockSlot
              key={b.block_id}
              block={b}
              index={i}
              selected={selectedBlockId === b.block_id}
              onSelect={() => onSelect(b.block_id)}
              onRemove={() => onRemove(b.block_id)}
              onRename={(name) => onRename && onRename(b.block_id, name)}
              dropIndex={dropIndex}
              setDropIndex={setDropIndex}
              libraryDragPresent={libraryDragPresent}
            />
          ))}
          <DropZone
            index={blocks.length}
            active={dropIndex === blocks.length}
            onEnter={() => setDropIndex(blocks.length)}
          />
        </div>
      </SortableContext>
    </DndContext>
  );
}

function libraryDropActive(dropIndex) {
  return dropIndex >= 0;
}

function DropZone({ index, active, onEnter }) {
  return (
    <div
      data-testid={`blocks-drop-zone-${index}`}
      onDragEnter={onEnter}
      onDragOver={(e) => {
        e.preventDefault();
        onEnter();
      }}
      className={`h-2 rounded-full transition-all ${
        active ? "bg-[#E01839] opacity-100" : "opacity-0"
      }`}
    />
  );
}

function BlockSlot({
  block,
  index,
  selected,
  onSelect,
  onRemove,
  onRename,
  dropIndex,
  setDropIndex,
  libraryDragPresent,
}) {
  return (
    <>
      <DropZone
        index={index}
        active={dropIndex === index}
        onEnter={() => setDropIndex(index)}
      />
      <div
        onDragEnter={(e) => {
          if (libraryDragPresent(e)) setDropIndex(index);
        }}
      >
        <BlockRow
          block={block}
          index={index}
          selected={selected}
          onSelect={onSelect}
          onRemove={onRemove}
          onRename={onRename}
        />
      </div>
    </>
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
