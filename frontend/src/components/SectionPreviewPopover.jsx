/**
 * SectionPreviewPopover — renders a small Eye-icon trigger button that,
 * when hovered, focused, or clicked, pops a live thumbnail of the
 * section's rendered snippet next to it.
 *
 * History: this used to wrap the whole card so the entire tile would
 * trigger a preview on hover. That proved noisy in practice (users
 * scanning the picker grid got an unsolicited iframe every time their
 * cursor crossed a card). The new shape is an opt-in 28px icon
 * positioned in the corner of the parent card — same internal popover
 * machinery, but the trigger surface is small and explicit.
 *
 * Implementation notes (preserved from the original):
 * - Lazy: the iframe only mounts on first activation so a grid of 20
 *   tiles doesn't spin up 20 iframes upfront.
 * - Memoised: `section.render(section.defaults())` runs once per
 *   section id and the resulting HTML string is cached.
 * - Scaled: the iframe lays out at native desktop width (1280px) and
 *   we then CSS-transform it down to a 480×270 thumbnail, preserving
 *   the snippet's responsive breakpoints.
 * - Pointer-events:none on the iframe so the user can't accidentally
 *   click into the preview and lose hover.
 * - Edge-aware: prefers right-of-trigger, flips left if it would
 *   overflow the viewport.
 *
 * Usage (caller must give the wrapping card `position: relative`):
 *   <button className="relative ...">
 *     <Icon/> <p>Hero</p>
 *     <SectionPreviewPopover sectionId="hero" />
 *   </button>
 *
 * Pass `disabled` to skip mounting entirely (used for `richtext` and
 * library snapshot tiles, where there's nothing meaningful to preview).
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { Eye } from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { useBrandKit } from "@/lib/BrandKitContext";
import { usePreviewOverrides } from "@/lib/PreviewOverridesContext";
import { applyBrandKit, DEFAULT_BRAND_KIT } from "@/lib/brandKit";

const NATIVE_W = 1280;
const NATIVE_H = 720;
const THUMB_W = 480;
const THUMB_H = 270;
const SCALE = THUMB_W / NATIVE_W; // 0.375
const HOVER_DELAY_MS = 220;

// Render-string cache keyed by (sectionId, overrideSig, brandKitSig).
// `overrideSig` flips when an admin re-curates the preview, busting
// the cache for that single section without nuking everything else.
const HTML_CACHE = new Map();

function brandKitSig(kit) {
  // Cheap, stable signature — only the keys we care about for snippet
  // rendering. Keeps the cache key small and avoids stringifying noise.
  if (!kit) return "default";
  return [
    kit.primary_color, kit.secondary_color, kit.text_color,
    kit.body_color, kit.background_color,
    kit.heading_font, kit.body_font,
    kit.accent_color, kit.eyebrow_color, kit.link_color,
  ].join("|");
}

function buildSrcDoc(html) {
  // Lock the body to native width so the snippet's responsive
  // breakpoints fire at the same place the editor would show.
  return (
    `<!doctype html><html><head><meta charset="utf-8"/>` +
    `<style>html,body{margin:0;padding:0;background:#fff;` +
    `width:${NATIVE_W}px;overflow:hidden;` +
    `font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}</style>` +
    `</head><body>${html}</body></html>`
  );
}

/**
 * Computes the HTML to render for a section preview.
 *
 * Resolution order:
 *   1. Admin override exists for the section type → render the
 *      override's full config (admin's curated version is the truth;
 *      brand kit is NOT applied on top — the admin chose the
 *      colours).
 *   2. Brand kit available → render `defaults() ⨉ brand kit` so the
 *      dashboard preview reflects the current user's palette/fonts.
 *   3. Otherwise → plain `defaults()`. Used for the public landing
 *      page where no brand kit is in context.
 */
function renderHtmlFor(sectionId, override, brandKit) {
  const cacheKey = `${sectionId}::${override ? override.section_id : "_"}::${brandKitSig(brandKit)}`;
  if (HTML_CACHE.has(cacheKey)) return HTML_CACHE.get(cacheKey);
  const section = SECTIONS_BY_ID[sectionId];
  if (!section || typeof section.render !== "function") {
    HTML_CACHE.set(cacheKey, "");
    return "";
  }
  try {
    let config;
    if (override && override.config) {
      config = override.config;
    } else {
      const base = section.defaults ? section.defaults() : {};
      config = brandKit
        ? applyBrandKit(sectionId, base, brandKit)
        : base;
    }
    const html = section.render(config) || "";
    const wrapped = buildSrcDoc(html);
    HTML_CACHE.set(cacheKey, wrapped);
    return wrapped;
  } catch {
    HTML_CACHE.set(cacheKey, "");
    return "";
  }
}

export default function SectionPreviewPopover({
  sectionId,
  disabled,
  // Default places the icon in the top-left corner so it doesn't
  // collide with the NEW/UPDATED badges callers tend to pin top-right.
  className = "absolute top-1.5 left-1.5 z-10",
}) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // gates the iframe
  const [pos, setPos] = useState({ top: 0, left: 0, flipped: false });
  const timerRef = useRef(null);
  const { brandKit, loaded: brandKitLoaded } = useBrandKit();
  const { overrides } = usePreviewOverrides();

  // The override (if any) is keyed by section TYPE, not by the
  // library-section instance id. SECTIONS_BY_ID maps `sectionId →
  // section def` where the def's id IS the type. So lookup is direct.
  const override = sectionId ? overrides[sectionId] : null;
  // Only overlay brand kit on top of defaults when:
  //  - the user actually has a brand kit (i.e. we're inside the
  //    authenticated app, not the public landing page); and
  //  - there's no admin override (admin's choice supersedes brand
  //    kit so the curated preview never gets re-tinted).
  const effectiveBrandKit =
    !override && brandKitLoaded && brandKit && brandKit !== DEFAULT_BRAND_KIT
      ? brandKit
      : null;

  // Pre-compute the cached HTML so the iframe srcdoc swap is instant
  // on first open. `useMemo` because the section id rarely changes.
  const html = useMemo(
    () => (disabled || !sectionId ? "" : renderHtmlFor(sectionId, override, effectiveBrandKit)),
    [sectionId, disabled, override, effectiveBrandKit]
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

  const openNow = () => {
    setPos(computePos());
    setMounted(true);
    setOpen(true);
  };

  const onEnter = () => {
    if (disabled || !html) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(openNow, HOVER_DELAY_MS);
  };

  const onLeave = () => {
    clearTimeout(timerRef.current);
    setOpen(false);
  };

  const onClick = (e) => {
    // Stop the click from bubbling to the parent card (which usually
    // wires `onClick` to "pick this section" — we don't want previewing
    // to accidentally create a new section).
    e.preventDefault();
    e.stopPropagation();
    if (disabled || !html) return;
    clearTimeout(timerRef.current);
    if (open) {
      setOpen(false);
    } else {
      openNow();
    }
  };

  if (disabled || !sectionId) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-testid={`section-preview-trigger-${sectionId}`}
        aria-label={`Preview ${sectionId} section`}
        aria-expanded={open}
        title="Preview"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        onClick={onClick}
        className={`${className} inline-flex items-center justify-center w-7 h-7 rounded-md bg-white/90 backdrop-blur border border-slate-200 text-slate-500 hover:text-[#E01839] hover:border-[#E01839] hover:bg-white shadow-sm opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E01839]/40 transition-opacity`}
      >
        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {mounted && (
        <div
          role="tooltip"
          aria-hidden={!open}
          data-testid={`section-preview-${sectionId}`}
          className="fixed z-[60] pointer-events-none transition-opacity duration-150"
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
