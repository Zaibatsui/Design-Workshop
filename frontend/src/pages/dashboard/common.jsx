/**
 * Shared dashboard UI pieces — pagination, empty state, card scaling hooks.
 * Kept here so SectionsTab and PagesTab stay lean and consistent.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEscapeKey } from "@/lib/useEscapeKey";

// Internal iframe canvas size — every preview renders at this fixed virtual
// width so content layout matches what users see in the editor. The scale
// wrapper shrinks the iframe to fit each card's responsive width while
// keeping the card height uniform across the grid.
export const PREVIEW_INTERNAL_WIDTH = 1280;
export const PREVIEW_INTERNAL_HEIGHT = 720;

export const PAGE_SIZE = 12;

/** Hook: keeps an iframe-in-a-card scale factor synced to the card's width. */
export function useIframeScale() {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.3);
  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / PREVIEW_INTERNAL_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { wrapRef, scale };
}

export function timeAgo(date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 86400 * 30) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function EmptyState({
  title,
  body,
  ctaLabel,
  onCreate,
  testId,
  icon: Icon,
}) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 py-20 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <h2 className="font-heading text-lg font-semibold mb-2">{title}</h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">{body}</p>
      <Button
        onClick={onCreate}
        className="bg-[#E01839] hover:bg-[#c01530] text-white font-medium"
        data-testid={testId}
      >
        <Plus className="w-4 h-4 mr-1.5" />
        {ctaLabel}
      </Button>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange, total }) {
  const pages = [];
  const add = (n) => pages.push(n);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i);
  } else {
    add(1);
    if (page > 3) add("…l");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      add(i);
    }
    if (page < totalPages - 2) add("…r");
    add(totalPages);
  }

  const startIdx = (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(total, page * PAGE_SIZE);

  return (
    <div
      className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      data-testid="pagination"
    >
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{startIdx}</span>–
        <span className="font-medium text-slate-700">{endIdx}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          data-testid="pagination-prev"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          typeof p === "number" ? (
            <button
              key={`p-${p}`}
              type="button"
              data-testid={`pagination-page-${p}`}
              onClick={() => onChange(p)}
              className={`min-w-9 h-9 px-3 rounded-md text-sm font-medium transition-colors ${
                p === page
                  ? "bg-[#E01839] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          ) : (
            <span
              key={`gap-${i}`}
              className="px-2 text-slate-400 select-none"
              aria-hidden="true"
            >
              …
            </span>
          )
        )}
        <button
          type="button"
          data-testid="pagination-next"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function Tabs({ tab, onChange, sections, pages }) {
  const items = [
    { id: "sections", label: "Sections", count: sections },
    { id: "pages", label: "Pages", count: pages },
  ];
  return (
    <div className="border-b border-slate-200 mb-6" data-testid="dashboard-tabs">
      <div className="flex gap-6">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            data-testid={`tab-${it.id}`}
            className={`relative pb-3 text-sm font-medium transition-colors ${
              tab === it.id
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {it.label}
            <span className="ml-2 text-xs text-slate-400 font-normal">
              {it.count}
            </span>
            {tab === it.id && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#E01839] rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SectionPicker({ sections, onPick, onClose }) {
  useEscapeKey(onClose);
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="section-picker"
      >
        <h2 className="font-heading text-xl font-semibold tracking-tight mb-1">
          Choose a section type
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          You can always change settings inside the editor.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                data-testid={`picker-${s.id}`}
                onClick={() => onPick(s.id)}
                className="text-left p-4 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
              >
                <Icon className="w-5 h-5 text-[#E01839] mb-2" />
                <p className="text-sm font-medium text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {s.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
