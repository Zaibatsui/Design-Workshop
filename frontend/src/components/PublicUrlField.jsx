import { useState, useEffect } from "react";
import { Link2, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * PublicUrlField — compact popover-trigger that lets the user set
 * the page's published URL. Used in the PageEditor header next to
 * the page name. Auto-shows when the page contains a `blog-body`
 * section (i.e. it's a blog post that's likely to be referenced from
 * a Blog Index or Related-articles widget).
 *
 * The URL is plain text — we don't validate scheme/host because users
 * may not have published yet, may use relative paths inside their CMS,
 * or may want to paste a hash anchor. The Blog Index / Related-articles
 * card renderer already sanitises URLs via shared.js → safeUrl().
 */
export default function PublicUrlField({ value, onChange, compact = false }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");

  // Sync local draft when the parent value changes (e.g. after a
  // page reload finishes and the saved URL arrives from the server).
  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const commit = () => {
    onChange?.(draft.trim());
    setOpen(false);
  };
  const clear = () => {
    setDraft("");
    onChange?.("");
    setOpen(false);
  };

  const hasUrl = !!(value && value.trim());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid="page-public-url-trigger"
          className={`h-8 gap-1.5 px-2 text-[12px] ${
            hasUrl
              ? "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
          title={
            hasUrl
              ? `Public URL: ${value}`
              : "Set the public URL so this page can be linked from your Blog Index"
          }
        >
          <Link2 className="w-3.5 h-3.5" />
          {!compact && (
            <span className="hidden md:inline truncate max-w-[140px]">
              {hasUrl ? value : "Set public URL"}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[360px] p-3"
        data-testid="page-public-url-popover"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Public URL
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
          Where this page lives once published on your own CMS. The Blog
          Index and Related-articles pickers copy this URL into card
          links automatically.
        </p>
        <div className="flex items-center gap-1.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://your-site.com/blog/your-post"
            autoFocus
            data-testid="page-public-url-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setOpen(false);
            }}
            className="h-8 text-[12px]"
          />
          <Button
            type="button"
            size="sm"
            onClick={commit}
            data-testid="page-public-url-save"
            className="h-8 w-8 p-0 bg-[#E01839] hover:bg-[#c01530] text-white flex-shrink-0"
            title="Save URL"
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
          {hasUrl && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clear}
              data-testid="page-public-url-clear"
              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 flex-shrink-0"
              title="Clear URL"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
