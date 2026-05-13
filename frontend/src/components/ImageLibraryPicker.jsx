import { useEffect, useState } from "react";
import { X, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

/**
 * ImageLibraryPicker — modal grid of the user's saved images. Click a
 * thumbnail to commit a pick via `onPick(url)`. Falls back to a tasteful
 * empty state when the library is empty so the user knows where to add
 * images.
 *
 * Closes via the X button, the backdrop, or `Esc`. Renders nothing when
 * `open === false`.
 */
export default function ImageLibraryPicker({ open, onClose, onPick }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    api
      .listImageLibrary()
      .then((res) => !cancelled && setItems(res?.images || []))
      .catch(() => !cancelled && toast.error("Couldn't load library"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const remove = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this image from your library?")) return;
    try {
      await api.deleteImageFromLibrary(id);
      setItems((xs) => xs.filter((x) => x.image_id !== id));
      toast.success("Removed from library");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div
      data-testid="image-library-picker"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Pick from library
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {items.length} image{items.length === 1 ? "" : "s"} · click a thumbnail to use it
            </p>
          </div>
          <button
            onClick={onClose}
            data-testid="image-library-close"
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">
                Your library is empty
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Save an image to the library from any image field, or add one
                from the <strong>Brand Kit</strong> page.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((it) => (
                <button
                  key={it.image_id}
                  data-testid={`image-library-item-${it.image_id}`}
                  onClick={() => {
                    onPick(it.url);
                    onClose();
                  }}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-[#E01839] hover:shadow-md transition-all bg-slate-100"
                >
                  <img
                    src={it.url}
                    alt={it.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.opacity = "0.3";
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 text-left">
                    <p className="text-[11px] font-medium text-white truncate">
                      {it.name}
                    </p>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => remove(it.image_id, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") remove(it.image_id, e);
                    }}
                    title="Delete from library"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-700" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <footer className="px-6 py-3 border-t border-slate-200 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>
  );
}
