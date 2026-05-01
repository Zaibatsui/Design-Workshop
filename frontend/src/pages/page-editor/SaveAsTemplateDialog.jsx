import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";

/**
 * Save-as-template dialog. Replaces the legacy `window.prompt` flow with a
 * proper shadcn Dialog — keyboard-friendly, dismissable on Esc/backdrop, and
 * accessible.
 */
export default function SaveAsTemplateDialog({
  open,
  onOpenChange,
  defaultName,
  blockCount,
  onSubmit,
}) {
  const [name, setName] = useState(defaultName || "");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset whenever the dialog (re-)opens so a previous draft doesn't bleed in.
  useEffect(() => {
    if (open) {
      setName(defaultName || "");
      setDescription("");
      setSubmitting(false);
    }
  }, [open, defaultName]);

  const canSubmit = name.trim().length > 0 && !submitting;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="save-template-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading tracking-tight">
            Save as template
          </DialogTitle>
          <DialogDescription>
            Snapshot this page's {blockCount} block{blockCount === 1 ? "" : "s"}{" "}
            as a reusable template. It'll appear in the New page picker.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Name
            </Label>
            <Input
              id="tpl-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product launch landing"
              data-testid="save-template-name"
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-desc" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Description <span className="text-slate-400 normal-case font-normal">(optional)</span>
            </Label>
            <Textarea
              id="tpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this template good for?"
              rows={3}
              data-testid="save-template-description"
              maxLength={400}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="save-template-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              data-testid="save-template-submit"
              className="bg-[#E01839] hover:bg-[#c01530] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save template
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
