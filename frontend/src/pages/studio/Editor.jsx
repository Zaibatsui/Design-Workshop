/**
 * Studio Editor — admin-only experimental UI shell for the section
 * editor. Mirrors the Classic Editor's state management exactly (load,
 * autosave, snippet generation, hero-slide lock) but presents the
 * editing surface as a Figma-/Linear-flavoured "Workspace + Inspector"
 * 3-pane layout:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  HEADER   ◀ Back · Section name pill · Brand · Toggle · Save │
 *   ├───────────┬─────────────────────────────────────┬────────────┤
 *   │  OUTLINE  │             CANVAS                  │ INSPECTOR  │
 *   │  (w-64)   │  Viewport switcher · Live iframe    │  (w-80)    │
 *   │           │  Section snippet drawer             │  3 tabs    │
 *   └───────────┴─────────────────────────────────────┴────────────┘
 *
 * The Inspector groups every existing FormGroup into Content / Design /
 * Advanced via the heuristic in `lib/studioCategorize` — no section
 * file is touched. Toggling back to Classic via the header pill
 * persists on the user record and reloads to the original layout.
 *
 * NOTE: state-management code is duplicated from `pages/Editor.jsx`
 * deliberately, so the Classic Editor stays unmodified during the
 * prototype phase. Once Studio is confirmed as the winner, the
 * autosave/load logic will be lifted into a shared `useSectionEditor`
 * hook.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Palette,
  Pencil,
  RotateCcw,
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { previewDoc, makeUid } from "@/sections/shared";
import { api } from "@/lib/api";
import { useBrandKit } from "@/lib/BrandKitContext";
import { applyBrandKit, applyFontToSnippet } from "@/lib/brandKit";
import {
  useDebouncedValue,
  SaveIndicator,
  HeroPreviewToggle,
  PreviewFrame,
  SnippetDrawer,
  AdminPreviewOverrideToggle,
} from "@/components/EditorBits";
import StudioToggle from "@/components/studio/StudioToggle";
import StudioInspector from "@/components/studio/StudioInspector";
import StudioOutline from "@/components/studio/StudioOutline";

const AUTOSAVE_MS = 1500;
const PREVIEW_DEBOUNCE_MS = 180;

const VIEWPORT_WIDTHS = { desktop: "100%", tablet: "820px", mobile: "390px" };
const VIEWPORT_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };

export default function StudioEditor() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewDraft = sectionId === "new";
  const newType = isNewDraft ? searchParams.get("type") : null;

  const [section, setSection] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [savedAt, setSavedAt] = useState(null);
  const [previewWidth, setPreviewWidth] = useState("desktop");

  // Outline column starts collapsed (matches the Page Editor's rail
  // pattern — users opt-in to expand by clicking the panel-toggle).
  // Persisted so it survives reloads.
  const [outlineExpanded, setOutlineExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("ns-studio-outline-expanded") === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "ns-studio-outline-expanded",
        outlineExpanded ? "1" : "0"
      );
    } catch {
      /* ignore quota / disabled storage */
    }
  }, [outlineExpanded]);

  const { brandKit } = useBrandKit();
  const skipNextLoadRef = useRef(false);
  const inspectorPanelRef = useRef(null);

  // ─── Section load / pristine init ──────────────────────────────
  useEffect(() => {
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return undefined;
    }
    if (isNewDraft) {
      const def = SECTIONS_BY_ID[newType];
      if (!def) {
        setLoadError("not_found");
        return undefined;
      }
      setSection({
        section_id: null,
        name: `New ${def.name}`,
        type: newType,
        config: applyBrandKit(newType, def.defaults(), brandKit, { seedLogos: true }),
      });
      setLoadError(null);
      return undefined;
    }
    let cancelled = false;
    setSection(null);
    setLoadError(null);
    api.getSection(sectionId)
      .then((doc) => { if (!cancelled) setSection(doc); })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e.status === 404 ? "not_found" : "error");
      });
    return () => { cancelled = true; };
  }, [sectionId, isNewDraft, newType]);

  const def = section ? SECTIONS_BY_ID[section.type] : null;

  // ─── Autosave ──────────────────────────────────────────────────
  const dirty = useRef(null);
  const timer = useRef(null);
  const inflight = useRef(false);
  const creatingRef = useRef(false);

  const flushSave = async () => {
    if (!section || inflight.current || creatingRef.current) return;
    if (!section.section_id) {
      if (!dirty.current) return;
      creatingRef.current = true;
      setSaveStatus("saving");
      const snapshot = {
        name: section.name,
        type: section.type,
        config: section.config,
        ...dirty.current,
      };
      dirty.current = null;
      try {
        const created = await api.createSection(snapshot);
        skipNextLoadRef.current = true;
        setSection(created);
        setSavedAt(Date.now());
        setSaveStatus("saved");
        navigate(`/edit/section/${created.section_id}`, { replace: true });
      } catch {
        setSaveStatus("error");
      } finally {
        creatingRef.current = false;
        if (dirty.current) {
          clearTimeout(timer.current);
          timer.current = setTimeout(flushSave, AUTOSAVE_MS);
        }
      }
      return;
    }
    if (!dirty.current) return;
    const patch = dirty.current;
    dirty.current = null;
    inflight.current = true;
    setSaveStatus("saving");
    try {
      const updated = await api.updateSection(section.section_id, patch);
      setSection(updated);
      setSavedAt(Date.now());
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      inflight.current = false;
      if (dirty.current) {
        clearTimeout(timer.current);
        timer.current = setTimeout(flushSave, AUTOSAVE_MS);
      }
    }
  };

  const queueSave = (patch) => {
    dirty.current = { ...(dirty.current || {}), ...patch };
    setSaveStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(flushSave, AUTOSAVE_MS);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const updateConfig = (patch) => {
    setSection((prev) => {
      if (!prev) return prev;
      const nextConfig =
        typeof patch === "function" ? patch(prev.config) : { ...prev.config, ...patch };
      queueSave({ config: nextConfig });
      return { ...prev, config: nextConfig };
    });
  };

  const renameSection = (name) => {
    setSection((prev) => (prev ? { ...prev, name } : prev));
    queueSave({ name });
  };

  const resetSection = () => {
    if (!def) return;
    if (!window.confirm(`Reset ${def.name} to defaults? This will overwrite the current settings.`)) return;
    const fresh = def.defaults();
    setSection((prev) => (prev ? { ...prev, config: fresh } : prev));
    queueSave({ config: fresh });
    toast.success(`Reset ${def.name}`);
  };

  const resetToBrandKit = () => {
    if (!def) return;
    if (!window.confirm(`Apply your brand kit to ${def.name}? Colors and fonts will be replaced with your saved brand values; content stays intact.`)) return;
    const merged = applyBrandKit(section.type, section.config, brandKit);
    if (!merged.uid) merged.uid = section.config?.uid ?? makeUid();
    setSection((prev) => (prev ? { ...prev, config: merged } : prev));
    queueSave({ config: merged });
    toast.success("Brand kit applied");
  };

  const snippet = useMemo(
    () =>
      def && section
        ? applyFontToSnippet(def.render(section.config), brandKit?.heading_font)
        : "",
    [def, section, brandKit]
  );
  const debouncedSnippet = useDebouncedValue(snippet, PREVIEW_DEBOUNCE_MS);

  // ─── Hero-slide lock (same contract as Classic) ────────────────
  const [heroIndex, setHeroIndex] = useState(null);
  const heroIndexRef = useRef(null);
  const updateHeroIndex = (next) => {
    heroIndexRef.current = next;
    setHeroIndex(next);
  };
  useEffect(() => {
    const h = (e) => {
      const idx = e.detail?.index;
      if (typeof idx === "number") {
        heroIndexRef.current = idx;
        setHeroIndex(idx);
      }
    };
    window.addEventListener("ns-editor-slide-control", h);
    return () => window.removeEventListener("ns-editor-slide-control", h);
  }, []);

  const previewHtml = useMemo(
    () =>
      previewDoc(debouncedSnippet, {
        withVatToggle: section?.type === "products" || section?.type === "productGrid",
        heroIndex: heroIndexRef.current,
      }),
    [debouncedSnippet, section?.type]
  );

  // Preview click-to-edit bridge. Each section renders its own
  // `data-ns-group="..."` / `data-ns-list="..."` markers on key wrapper
  // elements; when the user clicks inside the preview iframe, the
  // bridge in `previewDoc` posts a message which we translate into:
  //   • the same jump-to-group event the outline rail uses; and
  //   • a list-row expand event handled by ListEditor instances.
  useEffect(() => {
    const onMessage = (e) => {
      const d = e?.data;
      if (!d || d.type !== "ns-preview-click") return;
      if (d.group) {
        window.dispatchEvent(
          new CustomEvent("ns-studio-jump-to-group", {
            detail: { groupValue: d.group },
          })
        );
      }
      if (d.list && Number.isInteger(d.itemIndex)) {
        window.dispatchEvent(
          new CustomEvent("ns-studio-expand-item", {
            detail: { list: d.list, itemIndex: d.itemIndex },
          })
        );
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const copySnippet = async () => {
    if (!def || !section) return;
    const fresh = { ...section.config, uid: makeUid() };
    const out = applyFontToSnippet(def.render(fresh), brandKit?.heading_font);
    try {
      await navigator.clipboard.writeText(out);
      toast.success("HTML snippet copied", {
        description: `${out.length.toLocaleString()} chars · paste into any CMS.`,
      });
    } catch {
      toast.error("Copy failed. Use the manual copy below.");
    }
  };

  // ─── Error / loading screens ───────────────────────────────────
  if (loadError === "not_found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 gap-3">
        <p className="text-zinc-700">This section no longer exists.</p>
        <Button onClick={() => navigate("/")}>Back to dashboard</Button>
      </div>
    );
  }
  if (!section || !def) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-sm text-zinc-500">Loading…</div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-zinc-50 text-zinc-900"
      style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
      data-testid="studio-editor"
    >
      {/* ── LEFT RAIL — collapsible outline (full height) ─────────── */}
      <aside
        data-testid="studio-outline"
        className={`flex-shrink-0 h-screen flex flex-col bg-white border-r border-zinc-200 overflow-hidden transition-[width] duration-200 ease-out ${
          outlineExpanded ? "w-64" : "w-16"
        }`}
      >
        {/* Top: back + collapse toggle */}
        <div
          className={`flex items-center py-3 ${
            outlineExpanded
              ? "px-3 justify-between"
              : "px-0 justify-center flex-col gap-1"
          }`}
        >
          <button
            type="button"
            onClick={() => navigate("/")}
            data-testid="studio-back-to-dashboard"
            className="w-9 h-9 rounded-md flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            title="Back to dashboard"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="studio-outline-toggle"
            onClick={() => setOutlineExpanded((v) => !v)}
            className="w-9 h-9 rounded-md flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            title={outlineExpanded ? "Collapse outline" : "Expand outline"}
            aria-label={outlineExpanded ? "Collapse outline" : "Expand outline"}
          >
            {outlineExpanded ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Outline header label (expanded only) */}
        {outlineExpanded && (
          <div className="px-4 pb-2 flex-shrink-0">
            <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-zinc-500">
              Outline
            </span>
          </div>
        )}

        {/* Active section indicator + jump-to-group list */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto ${
            outlineExpanded ? "px-3 pb-2 space-y-2" : "px-0 pb-2 flex flex-col items-center gap-1"
          }`}
        >
          {outlineExpanded ? (
            <>
              <button
                type="button"
                data-testid="studio-outline-active"
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md bg-blue-50 text-blue-900 border border-blue-200"
              >
                {def.icon ? (
                  <def.icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
                ) : null}
                <span className="text-[13px] font-medium truncate flex-1 text-left">
                  {def.name}
                </span>
                <Sparkles className="w-3 h-3 text-blue-500 flex-shrink-0" strokeWidth={2} />
              </button>
              <div className="pt-2">
                <StudioOutline
                  panelRef={inspectorPanelRef}
                  signal={`${def.id}:${previewWidth}:${JSON.stringify(section.config).length}`}
                />
              </div>
            </>
          ) : (
            <button
              type="button"
              data-testid="studio-outline-active"
              title={def.name}
              aria-label={def.name}
              className="w-9 h-9 rounded-md flex items-center justify-center bg-blue-50 text-blue-900 border border-blue-200"
            >
              {def.icon ? (
                <def.icon className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <Sparkles className="w-4 h-4" strokeWidth={2} />
              )}
            </button>
          )}
        </div>

        {/* Footer: admin override (expanded only) */}
        {outlineExpanded && (
          <div className="border-t border-zinc-200 px-3 py-3 flex-shrink-0">
            <AdminPreviewOverrideToggle section={section} />
          </div>
        )}
      </aside>

      {/* ── CENTER — canvas with consolidated header ─────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <div className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="group relative flex items-center"
              data-testid="studio-section-name-field"
            >
              <Input
                value={section.name}
                onChange={(e) => renameSection(e.target.value)}
                data-testid="studio-section-name-input"
                placeholder="Untitled section"
                className="font-semibold text-[14px] tracking-tight border border-zinc-200 hover:border-[#E01839] focus-visible:border-[#E01839] focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-8 py-0 shadow-none rounded-md min-w-[180px] max-w-[360px] bg-white hover:bg-red-50/40 transition-colors pr-8"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              />
              <Pencil
                className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#E01839] group-focus-within:text-[#E01839] absolute right-2.5 pointer-events-none transition-colors"
                strokeWidth={2}
              />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1 flex-shrink-0">
              {def.icon ? <def.icon className="w-3 h-3" strokeWidth={2} /> : null}
              {def.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {section.type === "hero" && (
              <HeroPreviewToggle
                heroIndex={heroIndex}
                setHeroIndex={updateHeroIndex}
                slideCount={section.config.slides?.length || 0}
              />
            )}
            <button
              type="button"
              onClick={resetToBrandKit}
              data-testid="studio-apply-brand-kit"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              title="Apply brand kit colours and fonts"
            >
              <Palette className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={resetSection}
              data-testid="studio-reset-section"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <SaveIndicator status={saveStatus} savedAt={savedAt} variant="studio" />
            <div className="h-5 w-px bg-zinc-200 mx-1" />
            <StudioToggle />
            <Button
              data-testid="studio-copy-snippet-button"
              onClick={copySnippet}
              className="h-8 bg-[#E01839] hover:bg-[#c01530] text-white text-[12px] font-medium gap-1.5 px-3 ml-1"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy snippet
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-zinc-100">
          <div
            className="max-w-7xl mx-auto mb-3 flex items-center justify-between"
            data-testid="studio-canvas-toolbar"
          >
            <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-zinc-500">
              Canvas
            </span>
            <div className="flex items-center bg-white rounded-md p-0.5 border border-zinc-200">
              {["desktop", "tablet", "mobile"].map((w) => {
                const Icon = VIEWPORT_ICONS[w];
                return (
                  <button
                    key={w}
                    type="button"
                    data-testid={`studio-viewport-${w}`}
                    onClick={() => setPreviewWidth(w)}
                    title={w.charAt(0).toUpperCase() + w.slice(1)}
                    className={`flex items-center justify-center h-7 w-9 rounded transition-colors ${
                      previewWidth === w
                        ? "bg-zinc-100 text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          </div>
          <div
            className="mx-auto bg-white rounded-xl border border-zinc-200 overflow-hidden transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.06)]"
            style={{ maxWidth: VIEWPORT_WIDTHS[previewWidth], width: "100%" }}
            data-testid="studio-preview-container"
          >
            <PreviewFrame doc={previewHtml} sectionId={section.type} heroIndex={heroIndex} />
          </div>
          <SnippetDrawer snippet={snippet} onCopy={copySnippet} />
        </div>
      </main>

      {/* ── RIGHT — inspector (full height) ──────────────────────── */}
      <aside className="w-80 flex-shrink-0 h-screen flex flex-col bg-white border-l border-zinc-200">
        <StudioInspector
          def={def}
          config={section.config}
          onUpdate={updateConfig}
          previewMode={previewWidth}
          panelRef={inspectorPanelRef}
        />
      </aside>

      <Toaster richColors position="top-center" />
    </div>
  );
}
