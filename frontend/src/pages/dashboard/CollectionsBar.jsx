/**
 * CollectionsBar — horizontal chip row above the dashboard tabs that
 * filters sections + pages by user-owned collection (a flat folder).
 *
 * Single source of truth: the parent (`Dashboard`) owns the list of
 * collections and the currently-active collection id (`null` = All
 * items). This component only emits change events.
 *
 * Companion: `<ManageCollectionsDialog>` opens via the "Manage" button
 * at the end of the row.
 */
import { useState } from "react";
import { Plus, Settings2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";

// Canonical palette — KEEP IN SYNC WITH backend/routers/collections.py
// `_ALLOWED_COLORS`. Each entry maps the backend key to the tailwind
// class fragment for the dot.
export const COLLECTION_COLORS = [
  { key: "slate",   dot: "bg-slate-400",   ring: "ring-slate-400" },
  { key: "red",     dot: "bg-red-500",     ring: "ring-red-500" },
  { key: "amber",   dot: "bg-amber-500",   ring: "ring-amber-500" },
  { key: "emerald", dot: "bg-emerald-500", ring: "ring-emerald-500" },
  { key: "sky",     dot: "bg-sky-500",     ring: "ring-sky-500" },
  { key: "indigo",  dot: "bg-indigo-500",  ring: "ring-indigo-500" },
  { key: "violet",  dot: "bg-violet-500",  ring: "ring-violet-500" },
  { key: "pink",    dot: "bg-pink-500",    ring: "ring-pink-500" },
];

const COLOR_BY_KEY = Object.fromEntries(
  COLLECTION_COLORS.map((c) => [c.key, c])
);

/**
 * Resolve a backend color key to its dot class. Falls back to slate so
 * an orphaned reference (deleted palette entry) still renders.
 */
export function colorDotClass(key) {
  return (COLOR_BY_KEY[key] || COLOR_BY_KEY.slate).dot;
}

export default function CollectionsBar({
  collections,
  activeId,
  onChange,
  onManage,
  countByCollection, // { [collection_id]: number, _all: number, _unfiled: number }
}) {
  return (
    <div
      className="max-w-7xl mx-auto px-6 mt-4 flex items-center gap-2 flex-wrap"
      data-testid="collections-bar"
    >
      <Chip
        active={activeId === null}
        onClick={() => onChange(null)}
        testid="collections-chip-all"
      >
        <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
        All items
        <Count n={countByCollection?._all ?? 0} />
      </Chip>
      <Chip
        active={activeId === "__unfiled__"}
        onClick={() => onChange("__unfiled__")}
        testid="collections-chip-unfiled"
      >
        <span className="w-2 h-2 rounded-full border border-slate-300" />
        Unfiled
        <Count n={countByCollection?._unfiled ?? 0} />
      </Chip>
      {collections.map((c) => (
        <Chip
          key={c.collection_id}
          active={activeId === c.collection_id}
          onClick={() => onChange(c.collection_id)}
          testid={`collections-chip-${c.collection_id}`}
        >
          <span className={`w-2 h-2 rounded-full ${colorDotClass(c.color)}`} />
          <span className="truncate max-w-[140px]">{c.name}</span>
          <Count n={countByCollection?.[c.collection_id] ?? 0} />
        </Chip>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onManage}
        data-testid="collections-manage-button"
        className="h-8 text-xs text-slate-500 hover:text-slate-900 ml-1"
      >
        <Settings2 className="w-3.5 h-3.5 mr-1" />
        Manage
      </Button>
    </div>
  );
}

function Chip({ active, onClick, children, testid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      data-active={active ? "true" : "false"}
      className={[
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors",
        active
          ? "bg-slate-900 text-white"
          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Count({ n }) {
  if (!n) return null;
  return (
    <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 leading-none">
      {n}
    </span>
  );
}

/**
 * ManageCollectionsDialog — create / rename / recolor / delete.
 * Keep it modal because the dashboard counts depend on which
 * collection exists; closing forces a refetch via `onDirty`.
 */
export function ManageCollectionsDialog({
  open,
  onClose,
  collections,
  setCollections,
  onDirty,
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("slate");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setNewName("");
    setNewColor("slate");
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const created = await api.createCollection({ name, color: newColor });
      setCollections((cs) => [...cs, created].sort((a, b) => a.name.localeCompare(b.name)));
      reset();
      onDirty?.();
    } catch {
      toast.error("Could not create collection");
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const target = collections.find((c) => c.collection_id === id);
    if (!target || target.name === trimmed) return;
    try {
      const updated = await api.updateCollection(id, {
        name: trimmed,
        color: target.color,
      });
      setCollections((cs) =>
        cs.map((c) => (c.collection_id === id ? updated : c))
      );
      onDirty?.();
    } catch {
      toast.error("Rename failed");
    }
  };

  const handleRecolor = async (id, color) => {
    const target = collections.find((c) => c.collection_id === id);
    if (!target || target.color === color) return;
    try {
      const updated = await api.updateCollection(id, {
        name: target.name,
        color,
      });
      setCollections((cs) =>
        cs.map((c) => (c.collection_id === id ? updated : c))
      );
      onDirty?.();
    } catch {
      toast.error("Could not change colour");
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Delete the "${name}" collection? Items inside will become unfiled (they are NOT deleted).`
      )
    )
      return;
    try {
      await api.deleteCollection(id);
      setCollections((cs) => cs.filter((c) => c.collection_id !== id));
      onDirty?.();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="manage-collections-dialog">
        <DialogHeader>
          <DialogTitle>Manage collections</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              New collection
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Arcserve, Q4 campaign"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                disabled={busy}
                data-testid="new-collection-name"
                className="flex-1 h-9"
                maxLength={40}
              />
              <ColorPicker
                value={newColor}
                onChange={setNewColor}
                testidPrefix="new-collection-color"
              />
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={busy || !newName.trim()}
                data-testid="create-collection-button"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create
              </Button>
            </div>
          </div>
          {collections.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Existing
              </p>
              <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {collections.map((c) => (
                  <CollectionRow
                    key={c.collection_id}
                    collection={c}
                    onRename={handleRename}
                    onRecolor={handleRecolor}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="close-manage-dialog">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CollectionRow({ collection, onRename, onRecolor, onDelete }) {
  const [name, setName] = useState(collection.name);
  return (
    <li
      className="flex items-center gap-2 py-1.5"
      data-testid={`collection-row-${collection.collection_id}`}
    >
      <ColorPicker
        value={collection.color}
        onChange={(v) => onRecolor(collection.collection_id, v)}
        testidPrefix={`recolor-${collection.collection_id}`}
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => onRename(collection.collection_id, name)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.target.blur();
          }
        }}
        maxLength={40}
        className="h-8 text-sm flex-1"
        data-testid={`rename-${collection.collection_id}`}
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDelete(collection.collection_id, collection.name)}
        data-testid={`delete-collection-${collection.collection_id}`}
        className="text-slate-400 hover:text-red-600 h-8 px-2"
      >
        Delete
      </Button>
    </li>
  );
}

function ColorPicker({ value, onChange, testidPrefix }) {
  return (
    <div className="flex items-center gap-1">
      {COLLECTION_COLORS.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.key)}
          data-testid={`${testidPrefix}-${c.key}`}
          aria-label={c.key}
          aria-pressed={value === c.key ? "true" : "false"}
          className={[
            "w-4 h-4 rounded-full ring-offset-1 transition-shadow",
            c.dot,
            value === c.key ? `ring-2 ${c.ring}` : "ring-0",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
