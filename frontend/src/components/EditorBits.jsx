/**
 * EditorBits — shared building blocks used by both the Classic Editor
 * and the Studio Editor prototype. Extracted from the original
 * `pages/Editor.jsx` so the two shells don't drift on the iframe-handling
 * and save-indicator logic.
 *
 * Public exports:
 *   - useDebouncedValue        — throttle a value so slider drags don't
 *                                spam the iframe with srcDoc swaps.
 *   - SaveIndicator            — "Saving…" / "Saved 12s ago" / "Save failed"
 *                                status pill.
 *   - ViewportBanner           — slim contextual strip above the preview.
 *   - HeroPreviewToggle        — hero-only autoplay-vs-locked-slide toolbar.
 *   - PreviewFrame             — iframe with srcDoc + drag-to-resize handle
 *                                + per-section-type height memory.
 *   - SnippetDrawer            — collapsible "show generated HTML" panel
 *                                under the preview.
 *   - AdminPreviewOverrideToggle — admin checkbox to publish this section
 *                                as the hover-preview thumbnail across
 *                                the picker/guide/landing surfaces.
 */
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Copy, Check, Loader2, Play, Pause, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { previewHeightFor } from "@/sections/previewHeights";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { usePreviewOverrides } from "@/lib/PreviewOverridesContext";
import { SECTIONS_BY_ID } from "@/sections/registry";

export function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function SaveIndicator({ status, savedAt, variant = "default" }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (status !== "saved") return;
    const i = setInterval(() => force((n) => n + 1), 15000);
    return () => clearInterval(i);
  }, [status]);

  const baseCls =
    variant === "studio"
      ? "text-[11px] text-zinc-500 flex items-center gap-1.5 tabular-nums"
      : "text-xs text-slate-500 flex items-center gap-1.5";

  if (status === "saving") {
    return (
      <span data-testid="save-indicator" title="Saving…" className={baseCls}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="hidden xl:inline">Saving…</span>
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        data-testid="save-indicator"
        title="Save failed"
        className={baseCls + " text-red-600"}
      >
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        <span className="hidden xl:inline">Save failed</span>
      </span>
    );
  }
  if (status === "saved" && savedAt) {
    const sec = Math.floor((Date.now() - savedAt) / 1000);
    const label = `Saved ${sec < 5 ? "just now" : `${sec}s ago`}`;
    return (
      <span data-testid="save-indicator" title={label} className={baseCls}>
        <Check className="w-3 h-3 text-emerald-500" />
        <span className="hidden xl:inline">{label}</span>
      </span>
    );
  }
  return null;
}

export function HeroPreviewToggle({ heroIndex, setHeroIndex, slideCount }) {
  if (slideCount <= 0) return null;
  const locked = typeof heroIndex === "number";
  const safe = locked ? Math.max(0, Math.min(slideCount - 1, heroIndex)) : 0;
  const next = () => setHeroIndex((safe + 1) % slideCount);
  const prev = () => setHeroIndex((safe - 1 + slideCount) % slideCount);
  return (
    <div className="flex items-center gap-1.5 bg-slate-100 rounded-md p-0.5">
      <button
        type="button"
        data-testid="hero-preview-toggle"
        onClick={() => setHeroIndex(locked ? null : 0)}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
          locked ? "text-slate-500 hover:text-slate-700" : "bg-white text-slate-900 shadow-sm"
        }`}
        title={locked ? "Resume autoplay" : "Lock to current slide"}
      >
        {locked ? (<><Play className="w-3 h-3" /> Autoplay</>) : (<><Pause className="w-3 h-3" /> Lock</>)}
      </button>
      {locked && (
        <div className="flex items-center gap-0.5 px-1">
          <button type="button" data-testid="hero-preview-prev" onClick={prev} disabled={slideCount < 2}
            className="p-1 rounded hover:bg-white text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent" title="Previous slide">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-600 tabular-nums px-1 min-w-[34px] text-center" data-testid="hero-preview-indicator">
            {safe + 1}/{slideCount}
          </span>
          <button type="button" data-testid="hero-preview-next" onClick={next} disabled={slideCount < 2}
            className="p-1 rounded hover:bg-white text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent" title="Next slide">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function ViewportBanner({ previewWidth, hasViewportControls }) {
  const label = previewWidth === "mobile" ? "Mobile view" : previewWidth === "tablet" ? "Tablet view" : "Desktop view";
  const detail = hasViewportControls
    ? previewWidth === "mobile"
      ? "Mobile-specific form controls are active in the panel on the left."
      : "Desktop / tablet form controls are active. Switch viewport to edit mobile-specific overrides."
    : "Switch viewport to preview how this section will render.";
  const dotColor = previewWidth === "mobile" ? "bg-amber-500" : previewWidth === "tablet" ? "bg-sky-500" : "bg-emerald-500";
  return (
    <div
      data-testid={`viewport-banner-${previewWidth}`}
      className="mx-auto mb-3 max-w-[640px] flex items-center justify-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-[11px] leading-tight"
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="font-semibold text-slate-700">{label}</span>
      <span className="text-slate-500">·</span>
      <span className="text-slate-500">{detail}</span>
    </div>
  );
}

export function PreviewFrame({ doc, sectionId, heroIndex }) {
  const defaultH = previewHeightFor(sectionId);
  const storageKey = `dw:preview-h:${sectionId}`;
  const [h, setH] = useState(() => {
    try {
      const stored = parseInt(localStorage.getItem(storageKey) || "", 10);
      if (Number.isFinite(stored) && stored >= 120 && stored <= 1600) return stored;
    } catch (_) { /* ignore */ }
    return defaultH;
  });
  useEffect(() => {
    try {
      const stored = parseInt(localStorage.getItem(storageKey) || "", 10);
      setH(Number.isFinite(stored) && stored >= 120 && stored <= 1600 ? stored : defaultH);
    } catch (_) { setH(defaultH); }
  }, [storageKey, defaultH]);

  const iframeRef = useRef(null);
  // Remember the latest `ns-editor-focus-item` payload so we can
  // replay it after every iframe reload. Without this the iframe
  // would always boot back to row 0 (e.g. tab 1 active, slide 0
  // active) and the editor → preview sync would only hold until the
  // next config change.
  const lastFocusRef = useRef(null);
  useEffect(() => {
    const f = iframeRef.current;
    if (!f || !f.contentWindow) return;
    f.contentWindow.postMessage({ ns: "hero", index: typeof heroIndex === "number" ? heroIndex : null }, "*");
  }, [heroIndex]);
  const onIframeLoad = () => {
    const f = iframeRef.current;
    if (!f || !f.contentWindow) return;
    f.contentWindow.postMessage({ ns: "hero", index: typeof heroIndex === "number" ? heroIndex : null }, "*");
    // Replay the last list-row focus into the freshly-loaded iframe
    // so things like the active tab stay sticky across config edits.
    if (lastFocusRef.current) {
      f.contentWindow.postMessage(
        { type: "ns-focus-item", ...lastFocusRef.current },
        "*"
      );
    }
  };

  // Editor → preview bridge: when a ListEditor row opens (the user
  // clicked a slide / card in the inspector), it dispatches
  // `ns-editor-focus-item` on the window. Forward it into the iframe
  // so the preview can smoothly scroll that item into view — closing
  // the click-to-edit loop in both directions.
  useEffect(() => {
    const handler = (e) => {
      const f = iframeRef.current;
      const d = e.detail || {};
      // Persist for replay on the next iframe (re)load.
      if (typeof d.list === "string" && typeof d.index === "number") {
        lastFocusRef.current = { list: d.list, index: d.index };
      }
      if (!f || !f.contentWindow) return;
      f.contentWindow.postMessage(
        { type: "ns-focus-item", list: d.list, index: d.index },
        "*"
      );
    };
    window.addEventListener("ns-editor-focus-item", handler);
    return () => window.removeEventListener("ns-editor-focus-item", handler);
  }, []);

  const drag = useRef(null);
  const onPointerDown = (e) => {
    e.preventDefault();
    const handle = e.currentTarget;
    try { handle.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    drag.current = { startY: e.clientY, startH: h, lastH: h, pointerId: e.pointerId, handle };
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev) => {
      if (!drag.current) return;
      const next = Math.min(1600, Math.max(120, drag.current.startH + (ev.clientY - drag.current.startY)));
      drag.current.lastH = next;
      setH(next);
    };
    const onUp = () => {
      const finalH = drag.current?.lastH;
      try { drag.current?.handle?.releasePointerCapture(drag.current.pointerId); } catch (_) { /* ignore */ }
      drag.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointercancel", onUp);
      if (finalH != null) {
        try { localStorage.setItem(storageKey, String(finalH)); } catch (_) { /* ignore */ }
      }
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp, { once: true });
    handle.addEventListener("pointercancel", onUp, { once: true });
  };

  const resetH = () => {
    try { localStorage.removeItem(storageKey); } catch (_) { /* ignore */ }
    setH(defaultH);
  };

  return (
    <div className="relative">
      <iframe
        key={sectionId}
        ref={iframeRef}
        onLoad={onIframeLoad}
        data-testid="preview-iframe"
        title="Live preview"
        srcDoc={doc}
        sandbox="allow-scripts allow-same-origin"
        className="w-full block border-0"
        style={{ height: `${h}px` }}
      />
      <div
        data-testid="preview-resize-handle"
        onPointerDown={onPointerDown}
        onDoubleClick={resetH}
        title="Drag to resize · double-click to reset"
        className="group h-3 w-full flex items-center justify-center cursor-ns-resize bg-slate-50 border-t border-slate-200 hover:bg-slate-100 transition-colors"
      >
        <span className="block w-12 h-1 rounded-full bg-slate-300 group-hover:bg-slate-500 transition-colors" />
      </div>
      <span className="absolute right-2 -bottom-5 text-[10px] font-mono text-slate-400 select-none">{h}px</span>
    </div>
  );
}

export function SnippetDrawer({ snippet, onCopy }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 mx-auto max-w-5xl">
      <div className="bg-white rounded-md border border-slate-200">
        <button
          data-testid="toggle-snippet-button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <ExternalLink className="w-4 h-4" />
            Generated HTML snippet
            <span className="text-xs text-slate-500 font-normal">({snippet.length.toLocaleString()} chars)</span>
          </span>
          <span className="text-xs text-slate-500">{open ? "Hide" : "Show"}</span>
        </button>
        {open && (
          <div className="border-t border-slate-200">
            <div className="flex items-center justify-between px-5 py-2 bg-slate-50 border-b border-slate-200">
              <span className="text-xs text-slate-500">
                Self-contained · scoped CSS · multi-instance safe · Poppins import included
              </span>
              <Button size="sm" variant="outline" onClick={onCopy} data-testid="copy-snippet-inline-button">
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>
            <pre data-testid="snippet-pre" className="p-5 text-xs font-mono text-slate-700 overflow-auto max-h-96 bg-slate-50/50 whitespace-pre-wrap break-all">
              {snippet}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminPreviewOverrideToggle({ section }) {
  const { user } = useAuth() || {};
  const { refresh: refreshOverrides } = usePreviewOverrides();
  const [isCurrent, setIsCurrent] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const visible = !!(user && user.is_admin) && !!(section && section.section_id);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    api.getAdminPreviewOverrides()
      .then((rows) => {
        if (cancelled) return;
        const match = (rows || []).find((r) => r.section_type === section.type);
        setIsCurrent(!!(match && match.section_id === section.section_id));
      })
      .catch(() => { if (!cancelled) setIsCurrent(false); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [visible, section?.type, section?.section_id]);

  if (!visible) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = !isCurrent;
    setIsCurrent(next);
    try {
      await api.setPreviewOverride(section.type, next ? section.section_id : null);
      refreshOverrides();
      toast.success(next ? "Set as the global hover preview" : "Cleared — hovers will use the section's defaults again");
    } catch (e) {
      setIsCurrent(!next);
      toast.error(e?.body?.detail || "Could not update the preview override");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 pt-5 border-t border-slate-200" data-testid="admin-preview-override">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
        <Eye className="w-3 h-3" />
        Admin · hover preview
      </p>
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isCurrent}
          disabled={!loaded || busy}
          onChange={toggle}
          data-testid="admin-preview-override-checkbox"
          className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[#E01839] cursor-pointer disabled:cursor-wait"
        />
        <span className="text-[13px] leading-snug text-slate-700">
          Use this section as the hover-preview thumbnail for every{" "}
          <strong>{SECTIONS_BY_ID[section.type]?.name || section.type}</strong>{" "}
          tile across the dashboard, user guide and public landing page.
        </span>
      </label>
      {isCurrent && loaded && (
        <p className="mt-2 text-[11px] text-emerald-600 font-medium">
          ✓ This section is the current preview for {SECTIONS_BY_ID[section.type]?.name || section.type}
        </p>
      )}
    </div>
  );
}
