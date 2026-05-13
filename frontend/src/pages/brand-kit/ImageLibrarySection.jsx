import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { Plus, Upload, Link as LinkIcon, Trash2, Loader2, AlertTriangle, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

/**
 * ImageLibrarySection — full-page card on the Brand Kit page that lets
 * the user manage their reusable image library. Mirrors the picker
 * dialog used inside ImageUpload fields, but with full add/rename/delete
 * controls. Soft cap surfaced as a non-blocking warning banner.
 */
export default function ImageLibrarySection() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [softCap, setSoftCap] = useState(100);
  const [overCap, setOverCap] = useState(false);
  const [adding, setAdding] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const refresh = async () => {
    try {
      const res = await api.listImageLibrary();
      setItems(res?.images || []);
      setSoftCap(res?.soft_cap || 100);
      setOverCap(Boolean(res?.over_cap));
    } catch {
      toast.error("Couldn't load library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const addFromUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setAdding(true);
    try {
      await api.addImageToLibrary({ url, name: "", source: "url" });
      setUrlInput("");
      setShowUrlForm(false);
      toast.success("Added to library");
      await refresh();
    } catch (err) {
      toast.error(err?.message || "Couldn't add image");
    } finally {
      setAdding(false);
    }
  };

  const addFromUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Image too large (max 10MB)");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await axios.post(`${BACKEND_URL}/api/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const absUrl = `${BACKEND_URL}${res.data.url}`;
      await api.addImageToLibrary({
        url: absUrl,
        name: f.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 80),
        source: "upload",
      });
      toast.success("Uploaded and saved");
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this image from your library?")) return;
    try {
      await api.deleteImageFromLibrary(id);
      setItems((xs) => xs.filter((x) => x.image_id !== id));
      toast.success("Removed");
    } catch {
      toast.error("Delete failed");
    }
  };

  const beginRename = (item) => {
    setRenamingId(item.image_id);
    setRenameValue(item.name);
  };

  const commitRename = async () => {
    const name = renameValue.trim();
    if (!name || !renamingId) {
      setRenamingId(null);
      return;
    }
    try {
      const next = await api.renameImageInLibrary(renamingId, name);
      setItems((xs) => xs.map((x) => (x.image_id === next.image_id ? next : x)));
      toast.success("Renamed");
    } catch {
      toast.error("Rename failed");
    } finally {
      setRenamingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <p className="text-sm text-slate-500 -mt-1">
        Save images you reuse often — partner logos, product mock-ups,
        hero photography — and pick them in one click from any image
        field. Hosted URLs are recommended over uploads for durability.
      </p>

      {overCap && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            You have <strong>{items.length}</strong> images saved — over the
            recommended {softCap}. Consider deleting older entries to keep
            the picker quick to scan.
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          data-testid="library-upload-btn"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5 mr-1.5" />
          )}
          Upload image
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUrlForm((v) => !v)}
          data-testid="library-add-url-btn"
        >
          <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
          Add by URL
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={addFromUpload}
        />
      </div>

      {showUrlForm && (
        <div className="flex gap-2" data-testid="library-add-url-form">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://images.example.com/logo.png"
            onKeyDown={(e) => e.key === "Enter" && addFromUrl()}
            className="text-xs"
          />
          <Button
            size="sm"
            onClick={addFromUrl}
            disabled={adding || !urlInput.trim()}
            data-testid="library-add-url-submit"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {adding ? "Adding…" : "Add"}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-700">
            Library is empty
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Add your first image above, or click "Save" on any image inside
            a section to capture it here.
          </p>
        </div>
      ) : (
        <ul
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          data-testid="library-grid"
        >
          {items.map((it) => (
            <li
              key={it.image_id}
              className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
              data-testid={`library-item-${it.image_id}`}
            >
              <div className="aspect-square">
                <img
                  src={it.url}
                  alt={it.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0.3";
                  }}
                />
              </div>
              <div className="px-2 py-1.5 border-t border-slate-200 flex items-center gap-1 bg-white">
                {renamingId === it.image_id ? (
                  <>
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="h-6 text-[11px] px-1.5"
                    />
                    <button
                      onClick={commitRename}
                      className="w-5 h-5 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded"
                      title="Save"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="w-5 h-5 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded"
                      title="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="text-[11px] font-medium text-slate-700 truncate flex-1"
                      title={it.name}
                    >
                      {it.name}
                    </span>
                    <button
                      onClick={() => beginRename(it)}
                      className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Rename"
                      data-testid={`library-item-${it.image_id}-rename`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => remove(it.image_id)}
                      className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                      data-testid={`library-item-${it.image_id}-delete`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
