/**
 * SectionPreviewPopover — wraps a trigger element so that hovering it
 * shows a live thumbnail of the section's rendered snippet.
 *
 * Implementation notes:
 * - Lazy: the iframe only mounts on first hover so listing 20 of these
 *   on the landing page doesn't render 20 iframes upfront.
 * - Memoised: `section.render(section.defaults())` runs once per
 *   section id and the resulting HTML string is cached.
 * - Scaled: the iframe lays out at native desktop width (1280px) and
 *   we then CSS-transform it down to a 480×270 thumbnail. That keeps
 *   the snippet's design intact instead of squashing into a tiny
 *   viewport where breakpoints would misbehave.
 * - Pointer-events:none on the iframe so the user can't accidentally
 *   click into the preview and lose hover.
 * - Edge-aware: prefers right-of-trigger, flips left if it would
 *   overflow the viewport.
 *
 * Usage:
 *   <SectionPreviewPopover sectionId="hero">
 *     <button>Hero</button>
 *   </SectionPreviewPopover>
 *
 * Pass `disabled` to skip mounting entirely (used for `richtext` and
 * library snapshot tiles, where there's nothing meaningful to preview).
 */
import { useState, useRef, useEffect, useMemo, cloneElement, Children } from "react";
import { SECTIONS_BY_ID } from "@/sections/registry";

const NATIVE_W = 1280;
const NATIVE_H = 720;
const THUMB_W = 480;
const THUMB_H = 270;
const SCALE = THUMB_W / NATIVE_W; // 0.375
const HOVER_DELAY_MS = 220;

// Render-string cache. Each section's defaults are static config so
// the resulting HTML string is identical across mounts.
const HTML_CACHE = new Map();

function renderHtmlFor(sectionId) {
  if (HTML_CACHE.has(sectionId)) return HTML_CACHE.get(sectionId);
  const section = SECTIONS_BY_ID[sectionId];
  if (!section || typeof section.render !== "function") {
    HTML_CACHE.set(sectionId, "");
    return "";
  }
  try {
    const defaults = section.defaults ? section.defaults() : {};
    const html = section.render(defaults) || "";
    // Lock the body to native width so the snippet's responsive
    // breakpoints fire at the same place the editor would show.
    const wrapped =
      `<!doctype html><html><head><meta charset="utf-8"/>` +
      `<style>html,body{margin:0;padding:0;background:#fff;` +
      `width:${NATIVE_W}px;overflow:hidden;` +
      `font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}</style>` +
      `</head><body>${html}</body></html>`;
    HTML_CACHE.set(sectionId, wrapped);
    return wrapped;
  } catch {
    HTML_CACHE.set(sectionId, "");
    return "";
  }
}

export default function SectionPreviewPopover({
  sectionId,
  children,
  disabled,
  className = "",
}) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // gates the iframe
  const [pos, setPos] = useState({ top: 0, left: 0, flipped: false });
  const timerRef = useRef(null);

  // Pre-compute the cached HTML so the iframe srcdoc swap is instant
  // on first open. `useMemo` because the section id rarely changes.
  const html = useMemo(
    () => (disabled || !sectionId ? "" : renderHtmlFor(sectionId)),
    [sectionId, disabled]
  );

  // Cleanup any pending timer on unmount so we don't open a popover
  // for an element that just left the tree.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const computePos = () => {
    const el = triggerRef.current;
    if (!el) return { top: 0, left: 0, flipped: false };
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Default: pin to the right of the trigger, vertically centred.
    let left = r.right + 12;
    let flipped = false;
    if (left + THUMB_W + 12 > vw) {
      // Not enough room on the right — flip to the left side.
      left = r.left - THUMB_W - 12;
      flipped = true;
    }
    if (left < 8) left = 8;
    let top = r.top + r.height / 2 - THUMB_H / 2;
    if (top < 8) top = 8;
    if (top + THUMB_H + 8 > vh) top = vh - THUMB_H - 8;
    return { top, left, flipped };
  };

  const onEnter = () => {
    if (disabled || !html) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPos(computePos());
      setMounted(true);
      setOpen(true);
    }, HOVER_DELAY_MS);
  };

  const onLeave = () => {
    clearTimeout(timerRef.current);
    setOpen(false);
  };

  // Clone the child to attach our ref + listeners without forcing
  // callers to use a wrapping div (preserves their layout/grid).
  const child = Children.only(children);
  const cloned = cloneElement(child, {
    ref: (node) => {
      triggerRef.current = node;
      // Forward to caller's ref if any.
      const orig = child.ref;
      if (typeof orig === "function") orig(node);
      else if (orig && typeof orig === "object") orig.current = node;
    },
    onMouseEnter: (e) => {
      child.props.onMouseEnter?.(e);
      onEnter();
    },
    onMouseLeave: (e) => {
      child.props.onMouseLeave?.(e);
      onLeave();
    },
    onFocus: (e) => {
      child.props.onFocus?.(e);
      onEnter();
    },
    onBlur: (e) => {
      child.props.onBlur?.(e);
      onLeave();
    },
  });

  return (
    <>
      {cloned}
      {mounted && (
        <div
          role="tooltip"
          aria-hidden={!open}
          data-testid={`section-preview-${sectionId}`}
          className={`fixed z-[60] pointer-events-none transition-opacity duration-150 ${className}`}
          style={{
            top: pos.top,
            left: pos.left,
            width: THUMB_W,
            height: THUMB_H,
            opacity: open ? 1 : 0,
          }}
        >
          <div
            className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white"
            style={{
              boxShadow:
                "0 12px 32px -8px rgba(15, 23, 42, 0.18), 0 4px 12px -4px rgba(15, 23, 42, 0.08)",
            }}
          >
            <iframe
              title={`preview-${sectionId}`}
              srcDoc={html}
              sandbox="allow-same-origin"
              loading="lazy"
              style={{
                width: NATIVE_W,
                height: NATIVE_H,
                border: 0,
                transform: `scale(${SCALE})`,
                transformOrigin: "top left",
                pointerEvents: "none",
              }}
            />
          </div>
          <p className="absolute -bottom-5 left-0 right-0 text-[10px] font-medium text-slate-400 text-center">
            Live preview · scaled to fit
          </p>
        </div>
      )}
    </>
  );
}
