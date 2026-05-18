/**
 * Shared dashboard UI pieces — pagination, empty state, card scaling hooks.
 * Kept here so SectionsTab and PagesTab stay lean and consistent.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEscapeKey } from "@/lib/useEscapeKey";

// Internal iframe canvas width — every preview renders at this fixed virtual
// width so content layout matches what users see in the editor. Content
// height is measured at runtime (sections vary wildly: Logo Strip ~120px,
// Hero ~500px, etc.) so the card preview area can shrink-wrap to fit
// without leaving empty whitespace below the rendered section.
export const PREVIEW_INTERNAL_WIDTH = 1280;
// Used as the initial guess + the cap for unusually tall sections.
export const PREVIEW_INTERNAL_HEIGHT = 720;

export const PAGE_SIZE = 12;

/**
 * Hook: scales an iframe-in-a-card to fit the card width and reports the
 * iframe's actual rendered content height so the parent can shrink-wrap
 * the preview area. Returns:
 *   - wrapRef: ref for the card's preview wrapper (the link).
 *   - iframeRef: ref for the iframe itself (we read its body height).
 *   - scale: card_width / PREVIEW_INTERNAL_WIDTH.
 *   - contentHeight: measured body scrollHeight (px, in iframe coords);
 *     0 until the iframe loads, then real measured height.
 *   - visible: true once the wrapper enters the viewport (sticky). Consumers
 *     should only mount the iframe when `visible` is true so off-screen
 *     cards don't pay the parse/render/layout cost up-front.
 */
export function useIframeScale() {
  const wrapRef = useRef(null);
  const iframeRef = useRef(null);
  const [scale, setScale] = useState(0.3);
  const [contentHeight, setContentHeight] = useState(0);
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / PREVIEW_INTERNAL_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);

    // Only mount the iframe once the card is near the viewport. 400px
    // rootMargin keeps the experience "instant" while scrolling but
    // avoids mounting 12 iframes on first paint.
    let io;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setVisible(true);
            io.disconnect();
          }
        },
        { rootMargin: "400px 0px" }
      );
      io.observe(el);
    } else {
      setVisible(true);
    }
    return () => {
      ro.disconnect();
      if (io) io.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    if (!visible) return undefined;
    const ifr = iframeRef.current;
    if (!ifr) return undefined;
    let mo;
    let pollT;
    let tries = 0;
    const measure = () => {
      try {
        const body = ifr.contentDocument?.body;
        if (!body) return false;
        // Standards-mode body shrinks to its content, so body.scrollHeight
        // gives the section's natural rendered height. We deliberately do
        // NOT max with documentElement.scrollHeight — the latter always
        // equals the iframe viewport height (720) regardless of content,
        // which would defeat the shrink-wrap.
        const h = body.scrollHeight;
        if (h > 0) {
          setContentHeight(h);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };
    const attachMutationObserver = () => {
      try {
        const body = ifr.contentDocument?.body;
        if (!body) return;
        mo = new MutationObserver(measure);
        mo.observe(body, { childList: true, subtree: true, attributes: true });
    } catch (e) {
      // Cross-origin iframe access — expected for some sandboxed previews.
      // Log at debug level so noisy console isn't a regression for users
      // but the failure is still discoverable in dev tools.
      if (process.env.NODE_ENV !== "production") console.debug("MutationObserver attach skipped:", e);
    }
    };
    const onLoad = () => {
      measure();
      attachMutationObserver();
    };
    ifr.addEventListener("load", onLoad);
    // The iframe's `srcDoc` load can fire synchronously during the same
    // render cycle, before our `addEventListener` runs. Poll for up to
    // 1.5s as a fallback so we don't miss the initial measurement.
    const poll = () => {
      if (measure()) {
        attachMutationObserver();
        return;
      }
      tries += 1;
      if (tries < 30) pollT = setTimeout(poll, 50);
    };
    pollT = setTimeout(poll, 0);
    return () => {
      ifr.removeEventListener("load", onLoad);
      if (mo) mo.disconnect();
      if (pollT) clearTimeout(pollT);
    };
  }, [visible]);

  return { wrapRef, iframeRef, scale, contentHeight, visible };
}

/**
 * Merges multiple refs (function or object) into a single callback ref.
 * Needed when a DOM element already has a ref from dnd-kit's
 * `setNodeRef` and we want to attach another ref on top for measurement.
 */
export function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((r) => {
      if (!r) return;
      if (typeof r === "function") r(node);
      else r.current = node;
    });
  };
}

/**
 * Masonry helper — measures a card's total rendered height and returns
 * the `grid-row-end: span N` count required so the card fills exactly
 * that many auto-rows (no white gap below short cards, no clipping of
 * tall ones). Pair with a parent grid that sets:
 *   grid-auto-rows: {ROW_UNIT}px; row-gap: {ROW_GAP}px;
 */
export const MASONRY_ROW_UNIT = 8;
export const MASONRY_ROW_GAP = 20;

export function useGridRowSpan(
  rowUnit = MASONRY_ROW_UNIT,
  rowGap = MASONRY_ROW_GAP
) {
  const measureRef = useRef(null);
  const [span, setSpan] = useState(30);
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return undefined;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      if (h <= 0) return;
      setSpan(Math.max(1, Math.ceil((h + rowGap) / (rowUnit + rowGap))));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rowUnit, rowGap]);
  return { measureRef, span };
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
  // Split Pro / Nettailer-aware sections out into their own band at the
  // top so the live-scraped product blocks are easy to find and visually
  // distinct from the generic editorial sections.
  const PRO_IDS = new Set(["products", "productGrid"]);
  const proSections = sections.filter((s) => PRO_IDS.has(s.id));
  const regularSections = sections.filter((s) => !PRO_IDS.has(s.id));
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="section-picker"
      >
        <h2 className="font-heading text-xl font-semibold tracking-tight mb-1">
          Choose a section type
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          You can always change settings inside the editor.
        </p>

        {proSections.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.18em] uppercase text-white bg-[#E01839] px-1.5 py-0.5 rounded-sm">
                <Zap className="w-2.5 h-2.5" />
                Pro · Nettailer-aware
              </span>
              <span className="text-[11px] text-slate-500">
                Live-scraped prices · universal VAT toggle · gated-price fallback
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {proSections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    data-testid={`picker-${s.id}`}
                    onClick={() => onPick(s.id)}
                    className="text-left p-3 rounded-lg border-2 border-[#E01839]/30 bg-[#E01839]/[0.02] hover:border-[#E01839] hover:bg-[#E01839]/[0.06] transition-colors"
                  >
                    <Icon className="w-4 h-4 text-[#E01839] mb-1.5" />
                    <p className="text-[13px] font-medium text-slate-900 leading-tight">{s.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                      {s.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {regularSections.length > 0 && (
          <>
            {proSections.length > 0 && (
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400 mb-2">
                Editorial &amp; layout
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {regularSections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    data-testid={`picker-${s.id}`}
                    onClick={() => onPick(s.id)}
                    className="text-left p-3 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
                  >
                    <Icon className="w-4 h-4 text-[#E01839] mb-1.5" />
                    <p className="text-[13px] font-medium text-slate-900 leading-tight">{s.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                      {s.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
