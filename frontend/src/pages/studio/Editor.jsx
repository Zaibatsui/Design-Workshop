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
  RotateCcw,
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
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

  const { brandKit } = useBrandKit();
  const skipNextLoadRef = useRef(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-50 text-zinc-900"
      style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
      data-testid="studio-editor"
    >
      {/* ── Top header (h-14, dense, Linear-flavour) ─────────────── */}
      <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-zinc-200 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/")}
            data-testid="studio-back-to-dashboard"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="h-5 w-px bg-zinc-200" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-zinc-500 flex-shrink-0">
              {def.name}
            </span>
            <Input
              value={section.name}
              onChange={(e) => renameSection(e.target.value)}
              data-testid="studio-section-name-input"
              className="font-medium text-[14px] tracking-tight border-0 px-2 h-7 py-0 shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 rounded-md min-w-[160px] max-w-[320px] bg-transparent hover:bg-zinc-50"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
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
          <div className="h-5 w-px bg-zinc-200 mx-1" />
          <SaveIndicator status={saveStatus} savedAt={savedAt} variant="studio" />
          <div className="h-5 w-px bg-zinc-200 mx-1" />
          <StudioToggle />
          <div className="h-5 w-px bg-zinc-200 mx-1" />
          <Button
            data-testid="studio-copy-snippet-button"
            onClick={copySnippet}
            className="h-8 bg-zinc-900 hover:bg-zinc-800 text-white text-[12px] font-medium gap-1.5 px-3"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy snippet
          </Button>
        </div>
      </header>

      {/* ── Workspace: 3-pane layout ───────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT — outline / section context */}
        <aside
          data-testid="studio-outline"
          className="w-64 flex-shrink-0 bg-white border-r border-zinc-200 flex flex-col"
        >
          <div className="flex items-center px-4 h-12 border-b border-zinc-200 flex-shrink-0">
            <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-zinc-500">
              Outline
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
            <p className="text-[11px] text-zinc-500 leading-relaxed px-2.5 mt-3">
              Studio currently edits a single section at a time. Multi-section
              page outlines are coming in Phase 2 — for now this rail mirrors
              the section you opened from the dashboard.
            </p>
          </div>
          <div className="border-t border-zinc-200 px-3 py-3">
            <AdminPreviewOverrideToggle section={section} />
          </div>
        </aside>

        {/* CENTER — canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-zinc-100">
          <div className="flex items-center justify-between h-12 px-4 bg-white border-b border-zinc-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-zinc-500">
                Canvas
              </span>
              <div className="flex items-center bg-zinc-100 rounded-md p-0.5">
                {["desktop", "tablet", "mobile"].map((w) => {
                  const Icon = VIEWPORT_ICONS[w];
                  return (
                    <button
                      key={w}
                      data-testid={`studio-viewport-${w}`}
                      onClick={() => setPreviewWidth(w)}
                      title={w.charAt(0).toUpperCase() + w.slice(1)}
                      className={`flex items-center justify-center h-7 w-9 rounded transition-colors ${
                        previewWidth === w
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  );
                })}
              </div>
              {section.type === "hero" && (
                <HeroPreviewToggle
                  heroIndex={heroIndex}
                  setHeroIndex={updateHeroIndex}
                  slideCount={section.config.slides?.length || 0}
                />
              )}
            </div>
            <div className="text-[11px] text-zinc-500">
              {previewWidth === "desktop"
                ? "Click an element below to fine-tune it on the right."
                : `Previewing ${previewWidth} — viewport-specific controls are highlighted in the inspector.`}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
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

        {/* RIGHT — inspector */}
        <aside className="w-80 flex-shrink-0 flex flex-col bg-white">
          <StudioInspector
            def={def}
            config={section.config}
            onUpdate={updateConfig}
            previewMode={previewWidth}
          />
        </aside>
      </div>

      <Toaster richColors position="top-center" />
    </div>
  );
}
