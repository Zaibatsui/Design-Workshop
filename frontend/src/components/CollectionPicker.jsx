import { useEffect, useRef, useState } from "react";
import { Check, Folder, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { colorDotClass } from "@/pages/dashboard/CollectionsBar";

/**
 * CollectionPicker — small dropdown button shown in the section + page
 * editor chrome. Lets the user file the current item into one of their
 * Collections (or "Unfiled"), and create a new collection inline
 * without leaving the editor.
 *
 * Props:
 *   itemType     "section" | "page"
 *   itemId       id of the saved item (omit for unsaved drafts)
 *   collectionId current collection_id (null = unfiled)
 *   onChange     (newCollectionId | null) => void — fires AFTER the
 *                server PUT succeeds so the parent can sync state
 *
 * The picker is intentionally lightweight: no portal, no overlay —
 * just an inline absolute-positioned panel. Close-on-outside-click
 * is handled by a single document listener that's torn down on close.
 */
export default function CollectionPicker({
  itemType,
  itemId,
  collectionId,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [pending, setPending] = useState(false);
  const rootRef = useRef(null);

  const current = collections.find((c) => c.collection_id === collectionId);

  // Lazy load on first open — keeps the editor's initial load lean.
  const reload = async () => {
    setLoading(true);
    try {
      const rows = await api.listCollections();
      setCollections(rows || []);
    } catch (e) {
      toast.error("Could not load collections", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && collections.length === 0) reload();
    // Intentional shallow deps — we only refetch when the picker
    // re-opens, not every time `collections.length` flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const move = async (targetId) => {
    if (!itemId || pending) return;
    setPending(true);
    try {
      if (itemType === "page") {
        await api.movePageToCollection(itemId, targetId);
      } else {
        await api.moveSectionToCollection(itemId, targetId);
      }
      onChange?.(targetId);
      setOpen(false);
      toast.success(
        targetId
          ? `Moved to ${
              collections.find((c) => c.collection_id === targetId)?.name ||
              "collection"
            }`
          : "Moved to Unfiled"
      );
    } catch (e) {
      toast.error("Could not move", { description: e.message });
    } finally {
      setPending(false);
    }
  };

  const createAndMove = async (e) => {
    e?.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setPending(true);
    try {
      const fresh = await api.createCollection({
        name: trimmed,
        color: "slate",
      });
      setCollections((prev) => [...prev, fresh]);
      setNewName("");
      setCreating(false);
      await move(fresh.collection_id);
    } catch (err) {
      toast.error("Could not create collection", { description: err.message });
    } finally {
      setPending(false);
    }
  };

  // Drafts (no DB id yet) get a disabled affordance — the picker can't
  // PUT a non-existent record. The first autosave creates the row and
  // re-enables this.
  const disabled = !itemId;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        data-testid="collection-picker-button"
        title={
          disabled
            ? "Save the draft first to file it"
            : "File into a collection"
        }
        className={`inline-flex items-center gap-2 px-3 h-9 rounded-md border text-sm transition-colors ${
          disabled
            ? "border-slate-200 text-slate-300 cursor-not-allowed"
            : current
            ? "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            : "border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50"
        }`}
      >
        {current ? (
          <>
            <span
              className={`w-2 h-2 rounded-full ${colorDotClass(current.color)}`}
              aria-hidden="true"
            />
            <span className="truncate max-w-[140px]">{current.name}</span>
          </>
        ) : (
          <>
            <Folder className="w-3.5 h-3.5" />
            <span>Unfiled</span>
          </>
        )}
      </button>

      {open && (
        <div
          data-testid="collection-picker-menu"
          className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1.5"
        >
          {loading ? (
            <div className="px-3 py-2 text-xs text-slate-500">Loading…</div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => move(null)}
                disabled={pending}
                data-testid="collection-picker-unfiled"
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 ${
                  collectionId === null ? "font-semibold" : ""
                }`}
              >
                <span className="w-2 h-2 rounded-full border border-slate-300" />
                <span className="flex-1 text-left">Unfiled</span>
                {collectionId === null && (
                  <Check className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
              {collections.length > 0 && (
                <div className="my-1 border-t border-slate-100" />
              )}
              {collections.map((c) => (
                <button
                  key={c.collection_id}
                  type="button"
                  onClick={() => move(c.collection_id)}
                  disabled={pending}
                  data-testid={`collection-picker-option-${c.collection_id}`}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 ${
                    collectionId === c.collection_id ? "font-semibold" : ""
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${colorDotClass(c.color)}`}
                  />
                  <span className="flex-1 text-left truncate">{c.name}</span>
                  {collectionId === c.collection_id && (
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              ))}
              <div className="my-1 border-t border-slate-100" />
              {creating ? (
                <form
                  onSubmit={createAndMove}
                  className="px-3 py-1.5 flex items-center gap-1.5"
                >
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New collection name"
                    maxLength={40}
                    data-testid="collection-picker-new-input"
                    className="flex-1 min-w-0 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!newName.trim() || pending}
                    data-testid="collection-picker-new-submit"
                    className="text-xs font-semibold bg-slate-900 text-white px-2 py-1 rounded disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setNewName("");
                    }}
                    aria-label="Cancel"
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  disabled={pending}
                  data-testid="collection-picker-new"
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New collection…
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
