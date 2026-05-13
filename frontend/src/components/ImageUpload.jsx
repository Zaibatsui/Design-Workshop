import { useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, Link as LinkIcon, Info, Library, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import ImageLibraryPicker from "@/components/ImageLibraryPicker";

// Backend URL is normally baked at build time from REACT_APP_BACKEND_URL.
// If that arg was missing during `docker compose build` (compose env file
// not picked up, etc.), fall back to the page's own origin at runtime —
// our deployment topology serves the SPA and /api/* from the same host,
// so window.location.origin is always the right answer when the env var
// is empty. This makes image URLs absolute regardless of how the bundle
// was built.
const buildTimeBackendUrl = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const BACKEND_URL =
  buildTimeBackendUrl ||
  (typeof window !== "undefined" ? window.location.origin : "");
const API = `${BACKEND_URL}/api`;

export default function ImageUpload({ value, onChange, testid, compact }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const onPickFile = () => fileRef.current?.click();

  const saveToLibrary = async () => {
    if (!value || saving) return;
    setSaving(true);
    try {
      // Best-effort name from URL — user can rename later in the library.
      const name =
        decodeURIComponent(value.split("?")[0].split("/").pop() || "Image")
          .replace(/\.[a-z0-9]+$/i, "")
          .slice(0, 80) || "Image";
      const source = value.startsWith(BACKEND_URL) ? "upload" : "url";
      await api.addImageToLibrary({ url: value, name, source });
      toast.success("Saved to library");
    } catch {
      toast.error("Couldn't save to library");
    } finally {
      setSaving(false);
    }
  };

  const onFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Image too large (max 10MB)");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await axios.post(`${API}/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // We need an absolute URL so the snippet works when pasted to any site.
      const absUrl = `${BACKEND_URL}${res.data.url}`;
      onChange(absUrl);
      toast.success("Image uploaded");
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.detail || "Upload failed. Try again."
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mt-1.5 space-y-2" data-testid={testid}>
      {value ? (
        <div className="relative group rounded-md overflow-hidden border border-slate-200 bg-slate-100">
          <img
            src={value}
            alt="preview"
            className={`w-full object-cover ${compact ? "h-20" : "h-32"}`}
          />
          <button
            type="button"
            onClick={saveToLibrary}
            disabled={saving}
            className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/95 hover:bg-white shadow text-[11px] font-medium text-slate-700 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
            aria-label="Save to library"
            data-testid={`${testid}-save-library`}
            title="Save this image to your library for reuse elsewhere"
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <BookmarkPlus className="w-3 h-3" />
            )}
            Save
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 hover:bg-white shadow flex items-center justify-center transition-transform hover:scale-105"
            aria-label="Remove image"
            data-testid={`${testid}-remove`}
          >
            <X className="w-3.5 h-3.5 text-slate-700" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onPickFile}
            disabled={uploading}
            data-testid={`${testid}-dropzone`}
            className={`w-full flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors ${
              compact ? "py-4" : "py-6"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                <span className="text-xs text-slate-500">Uploading…</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs text-slate-600 font-medium">
                  Click to upload
                </span>
                <span className="text-[10px] text-slate-400">
                  PNG, JPG, WEBP up to 10MB
                </span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            data-testid={`${testid}-pick-library`}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-xs text-slate-600 font-medium transition-colors"
          >
            <Library className="w-3.5 h-3.5" />
            Pick from library
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowUrl((v) => !v)}
          className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
          data-testid={`${testid}-url-toggle`}
        >
          <LinkIcon className="w-3 h-3" />
          {showUrl ? "Hide URL" : "Use a hosted URL instead"}
        </button>
        {!showUrl && !value && (
          <span className="text-[10px] text-slate-400 leading-snug">
            (recommended for durability)
          </span>
        )}
      </div>
      {showUrl && (
        <Input
          data-testid={`${testid}-url-input`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://images.example.com/photo.jpg"
          className="text-xs"
        />
      )}

      {/* Persistent advisory — uploaded images depend on this service
          staying online. URL-hosted images live wherever the user already
          stores them and outlive any disruption to Design Workshop. */}
      <p className="text-[10.5px] text-slate-400 leading-snug flex items-start gap-1.5">
        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span>
          Tip: where you can, paste a hosted image URL (your CDN, image
          library, product DAM…) instead of uploading. Uploaded images
          are served from this service and may be affected by any
          disruption to it.
        </span>
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={onFileChange}
        data-testid={`${testid}-input`}
      />

      <ImageLibraryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(url) => onChange(url)}
      />
    </div>
  );
}
