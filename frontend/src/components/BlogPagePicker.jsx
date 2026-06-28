import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, FileText, Component, ExternalLink, Loader2, BookOpen } from "lucide-react";
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
import { filterBlogContent } from "@/lib/pageBlogMeta";

/**
 * BlogPagePicker — Dialog that lists every piece of blog content in
 * the user's library, whether it lives as a multi-block Page (i.e. a
 * page that contains a blog-body section) OR as a standalone blog-body
 * Section. Picking either kind hands the parent a tagged envelope:
 *
 *   { kind: "page" | "section", doc }
 *
 * …and the parent (Blog Index FormPanel / Blog Body Related widget)
 * decides how to project that into a card via the helpers in
 * `lib/pageBlogMeta`. The dialog itself only knows how to list +
 * filter; projection lives in one place.
 */
export default function BlogPagePicker({
  open,
  onOpenChange,
  onPick,
  excludeIds = [],
  title = "Pick an existing blog post",
  description = "Both standalone blog-body sections and pages that contain one show up here. We'll auto-fill the card from the source content.",
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all([
      api.listPages().catch(() => []),
      api.listSections().catch(() => []),
    ])
      .then(([pages, sections]) => {
        if (cancelled) return;
        setEntries(filterBlogContent({ pages, sections }));
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        toast.error("Couldn't load your library — try again");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const excludeSet = useMemo(() => new Set(excludeIds || []), [excludeIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => !excludeSet.has(e.id))
      .filter((e) => {
        if (!q) return true;
        return (
          (e.name || "").toLowerCase().includes(q) ||
          (e.public_url || "").toLowerCase().includes(q)
        );
      });
  }, [entries, query, excludeSet]);

  const handlePick = (entry) => {
    try {
      onPick?.(entry);
      onOpenChange?.(false);
      setQuery("");
    } catch {
      toast.error("Something went wrong adding that item");
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
              placeholder="Search by name or URL…"
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
              Loading your library…
            </div>
          ) : error ? (
            <p className="text-center text-sm text-slate-500 py-10">
              Couldn't load your library. Close this dialog and try again.
            </p>
          ) : filtered.length === 0 ? (
            <EmptyState hasAny={entries.length > 0} query={query} />
          ) : (
            <ul className="flex flex-col gap-1" data-testid="blog-page-picker-list">
              {filtered.map((entry) => (
                <EntryRow
                  key={`${entry.kind}-${entry.id}`}
                  entry={entry}
                  onPick={() => handlePick(entry)}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-400">
            {filtered.length} blog item{filtered.length === 1 ? "" : "s"} available
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

function EntryRow({ entry, onPick }) {
  const isSection = entry.kind === "section";
  const Icon = isSection ? Component : FileText;
  const kindLabel = isSection ? "Section" : "Page";
  const updatedLabel = entry.updated_at
    ? new Date(entry.updated_at).toLocaleDateString("en-GB", {
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
        data-testid={`blog-page-picker-row-${entry.kind}-${entry.id}`}
        className="w-full text-left px-3 py-2.5 rounded-md hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E01839]/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-slate-100 group-hover:bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-slate-900 truncate">
                {entry.name || "Untitled"}
              </p>
              <span
                className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-px rounded ${
                  isSection
                    ? "bg-violet-50 text-violet-700"
                    : "bg-sky-50 text-sky-700"
                }`}
              >
                {kindLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
              {entry.public_url ? (
                <>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{entry.public_url}</span>
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

function EmptyState({ hasAny, query }) {
  if (query) {
    return (
      <p className="text-center text-sm text-slate-500 py-10">
        No blog content matches <span className="font-medium">"{query}"</span>.
      </p>
    );
  }
  if (!hasAny) {
    return (
      <div className="text-center py-10 px-6">
        <p className="text-sm text-slate-700 font-medium mb-1">
          No blog content yet
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Create a <strong>Blog Body</strong> section (or a page that
          contains one), give it a name and (optionally) a public URL, and
          it'll show up here.
        </p>
      </div>
    );
  }
  return (
    <p className="text-center text-sm text-slate-500 py-10">
      You've already added every available blog item.
    </p>
  );
}
