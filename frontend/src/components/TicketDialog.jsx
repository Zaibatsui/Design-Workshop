import { useState } from "react";
import { Bug, Lightbulb, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useEscapeKey } from "@/lib/useEscapeKey";

// Soft client-side payload cap so a runaway base64 blob doesn't push
// the ticket document past Mongo's 16MB limit. Each screenshot also
// gets a 2MB pre-encoding check.
const MAX_PER_FILE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 6 * 1024 * 1024;

/**
 * TicketDialog — modal for filing a bug report or feature request.
 *
 * Open via `<TicketDialog open onClose={...} defaultType="bug"/>`.
 * Submits to POST /api/tickets and toasts on success or failure.
 * Screenshots are read as base64 data URLs (no separate upload pipeline).
 */
export default function TicketDialog({ open, onClose, defaultType = "bug" }) {
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [screenshots, setScreenshots] = useState([]); // data URLs
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(open ? onClose : null);

  if (!open) return null;

  const reset = () => {
    setType(defaultType);
    setTitle("");
    setDescription("");
    setScreenshots([]);
    setSubmitting(false);
  };

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // Validate each file before reading. We add them serially so the
    // cumulative size check is meaningful.
    let totalBytes = screenshots.reduce(
      (acc, s) => acc + Math.ceil((s.length * 3) / 4),
      0
    );
    const accepted = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`);
        continue;
      }
      if (f.size > MAX_PER_FILE_BYTES) {
        toast.error(`${f.name} is over 2MB`);
        continue;
      }
      if (totalBytes + f.size > MAX_TOTAL_BYTES) {
        toast.error("Total attachment size would exceed 6MB — drop one");
        break;
      }
      totalBytes += f.size;
      accepted.push(f);
    }
    if (!accepted.length) {
      e.target.value = "";
      return;
    }
    Promise.all(
      accepted.map(
        (f) =>
          new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = () => reject(new Error("Read failed"));
            r.readAsDataURL(f);
          })
      )
    )
      .then((urls) => setScreenshots((prev) => [...prev, ...urls]))
      .catch(() => toast.error("Could not read one of the images"));
    e.target.value = ""; // allow re-picking the same file later
  };

  const removeScreenshot = (idx) =>
    setScreenshots((prev) => prev.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e?.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSubmitting(true);
    try {
      await api.createTicket({
        type,
        title: title.trim(),
        description: description.trim(),
        screenshots,
      });
      toast.success(
        type === "bug"
          ? "Bug report submitted — thanks for the heads-up"
          : "Feature request submitted — we'll take a look"
      );
      reset();
      onClose?.();
    } catch (err) {
      toast.error("Could not submit", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      data-testid="ticket-dialog-backdrop"
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="ticket-dialog"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Report a bug or request a feature
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              The Zaibatsui team reads every submission. Screenshots help us
              fix things faster.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="ticket-dialog-close"
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type">
            <button
              type="button"
              role="radio"
              aria-checked={type === "bug"}
              onClick={() => setType("bug")}
              data-testid="ticket-type-bug"
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md border-2 text-sm font-medium transition-colors ${
                type === "bug"
                  ? "border-[#E01839] bg-[#E01839]/5 text-[#E01839]"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <Bug className="w-4 h-4" />
              Bug report
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={type === "feature"}
              onClick={() => setType("feature")}
              data-testid="ticket-type-feature"
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md border-2 text-sm font-medium transition-colors ${
                type === "feature"
                  ? "border-[#E01839] bg-[#E01839]/5 text-[#E01839]"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              Feature request
            </button>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "bug"
                  ? "e.g. Image upload fails on Insights cards"
                  : "e.g. Bulk-publish from the page builder"
              }
              maxLength={200}
              data-testid="ticket-title"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === "bug"
                  ? "What were you trying to do? What happened instead? Browser & section type help."
                  : "What problem would this solve? Where would you expect to find it in the UI?"
              }
              maxLength={8000}
              rows={6}
              data-testid="ticket-description"
              className="mt-1 resize-none"
            />
          </div>

          {/* Screenshots */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Screenshots (optional)
            </Label>
            <p className="text-xs text-slate-500 mt-1 mb-2">
              Up to 6MB total · PNG / JPG / WEBP
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {screenshots.map((src, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-md border border-slate-200 overflow-hidden bg-slate-50"
                  data-testid={`ticket-screenshot-${i}`}
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(i)}
                    aria-label={`Remove screenshot ${i + 1}`}
                    data-testid={`ticket-screenshot-remove-${i}`}
                    className="absolute top-0.5 right-0.5 bg-slate-900/70 text-white rounded-sm p-0.5 hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <label
              data-testid="ticket-attach-label"
              className="inline-flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-md px-3 py-2 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              Attach screenshots
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPickFiles}
                data-testid="ticket-attach-input"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              data-testid="ticket-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              data-testid="ticket-submit"
              className="bg-[#E01839] hover:bg-[#c81532] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending
                </>
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
