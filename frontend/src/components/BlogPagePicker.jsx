import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, FileText, ExternalLink, Loader2, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { filterBlogPages } from "@/lib/pageBlogMeta";

/**
 * BlogPagePicker — Dialog that lists every Page in the user's library
 * that qualifies as a blog post (i.e. contains at least one blog-body
 * section). On pick, the parent receives the full Page document and
 * decides how to project it (Blog Index card vs. Related-articles item)
 * via the helpers in `lib/pageBlogMeta`.
 *
 * State machine:
 *   open=true → GET /api/pages → filter to blog pages → render
 *   user types → in-memory filter on name + public_url substring
 *   user clicks a row → onPick(page) → onOpenChange(false)
 *
 * Why a Dialog and not a Popover: Dialogs portal to document.body, so
 * they render cleanly above the editor sidebar without clipping, and
 * they're keyboard-trappable + Esc-dismissable for free.
 */
export default function BlogPagePicker({
  open,
  onOpenChange,
  onPick,
  excludePageIds = [],
  title = "Pick an existing blog post",
  description = "Pages with a Blog Body section show up here. We'll auto-fill the card from each page's content.",
}) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(false);
    api
      .listPages()
      .then((res) => {
        if (cancelled) return;
        setPages(filterBlogPages(res || []));
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        toast.error("Couldn't load your pages — try again");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const excludeSet = useMemo(
    () => new Set(excludePageIds || []),
    [excludePageIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pages
      .filter((p) => !excludeSet.has(p.page_id))
      .filter((p) => {
        if (!q) return true;
        return (
          (p.name || "").toLowerCase().includes(q) ||
          (p.public_url || "").toLowerCase().includes(q)
        );
      });
  }, [pages, query, excludeSet]);

  const handlePick = (page) => {
    try {
      onPick?.(page);
      onOpenChange?.(false);
      setQuery("");
    } catch {
      toast.error("Something went wrong adding that page");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] max-h-[80vh] flex flex-col p-0 gap-0"
        data-testid="blog-page-picker"
      >
        <DialogHeader className="px-6 pt-6 pb-3 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4 text-slate-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-3 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by page name or URL…"
              autoFocus
              data-testid="blog-page-picker-search"
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border-t border-slate-100 px-2 py-2 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your pages…
            </div>
          ) : error ? (
            <p className="text-center text-sm text-slate-500 py-10">
              Couldn't load your pages. Close this dialog and try again.
            </p>
          ) : filtered.length === 0 ? (
            <EmptyState hasPages={pages.length > 0} query={query} />
          ) : (
            <ul className="flex flex-col gap-1" data-testid="blog-page-picker-list">
              {filtered.map((p) => (
                <PageRow key={p.page_id} page={p} onPick={() => handlePick(p)} />
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-400">
            {filtered.length} blog page{filtered.length === 1 ? "" : "s"} available
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange?.(false)}
            data-testid="blog-page-picker-cancel"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PageRow({ page, onPick }) {
  const updatedLabel = page.updated_at
    ? new Date(page.updated_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        data-testid={`blog-page-picker-row-${page.page_id}`}
        className="w-full text-left px-3 py-2.5 rounded-md hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E01839]/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-slate-100 group-hover:bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">
              {page.name || "Untitled page"}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
              {page.public_url ? (
                <>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{page.public_url}</span>
                </>
              ) : (
                <span className="italic text-slate-400">
                  No public URL set — card link will be empty
                </span>
              )}
            </p>
          </div>
          {updatedLabel && (
            <span className="text-[11px] text-slate-400 flex-shrink-0">
              {updatedLabel}
            </span>
          )}
        </div>
      </button>
    </li>
  );
}

function EmptyState({ hasPages, query }) {
  if (query) {
    return (
      <p className="text-center text-sm text-slate-500 py-10">
        No blog pages match <span className="font-medium">"{query}"</span>.
      </p>
    );
  }
  if (!hasPages) {
    return (
      <div className="text-center py-10 px-6">
        <p className="text-sm text-slate-700 font-medium mb-1">
          No blog pages yet
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Create a page that contains a <strong>Blog Body</strong> section, give
          it a name and (optionally) a public URL, and it'll show up here.
        </p>
      </div>
    );
  }
  return (
    <p className="text-center text-sm text-slate-500 py-10">
      You've already added every available blog page.
    </p>
  );
}
