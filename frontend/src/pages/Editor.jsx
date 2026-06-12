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
} from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { previewDoc, makeUid } from "@/sections/shared";
import SectionRail from "@/components/SectionRail";
import { api } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { useBrandKit } from "@/lib/BrandKitContext";
import { applyBrandKit, applyFontToSnippet } from "@/lib/brandKit";
import {
  useDebouncedValue,
  SaveIndicator,
  HeroPreviewToggle,
  ViewportBanner,
  PreviewFrame,
  SnippetDrawer,
  AdminPreviewOverrideToggle,
} from "@/components/EditorBits";
import StudioToggle from "@/components/studio/StudioToggle";
import UserMenu from "@/components/UserMenu";

const AUTOSAVE_MS = 1500;
// Iframe-preview debounce window. While a slider is being dragged the
// snippet regenerates on every tick; without debouncing, each tick
// swaps the iframe's `srcDoc` and we get a brief flicker per swap.
// 180 ms feels instant for single edits (colour picker click, text
// input) yet collapses a full drag session into ~5 iframe swaps
// instead of dozens. Tuned together with `AUTOSAVE_MS` so the preview
// usually settles well before autosave fires.
const PREVIEW_DEBOUNCE_MS = 180;

export default function Editor() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewDraft = sectionId === "new";
  const newType = isNewDraft ? searchParams.get("type") : null;
  // Read the "save into this collection" hint from the dashboard's
  // active-chip context. Empty / null = leave unfiled. Validated
  // server-side on create — bad/unknown ids 422 there.
  const newCollectionId = isNewDraft
    ? searchParams.get("collection_id") || null
    : null;

  const [section, setSection] = useState(null); // { section_id, name, type, config, ... }
  const [loadError, setLoadError] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [savedAt, setSavedAt] = useState(null);
  const [previewWidth, setPreviewWidth] = useState("desktop");

  const { brandKit } = useBrandKit();

  // After the first save creates the DB record, we navigate-replace the URL
  // from /edit/section/new → /edit/section/<realId>. The load effect would
  // then re-fire and try to fetch — flip this ref to skip that one round.
  const skipNextLoadRef = useRef(false);

  // Initial fetch — or pristine init for new drafts.
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
      // Pristine in-memory draft. No DB record exists yet — it's only
      // created when the user makes their first edit.
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
    api
      .getSection(sectionId)
      .then((doc) => {
        if (!cancelled) setSection(doc);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e.status === 404) setLoadError("not_found");
        else setLoadError("error");
      });
    return () => {
      cancelled = true;
    };
    // brandKit only matters at first init; we intentionally don't
    // re-init the draft if the user changes their kit while a draft is
    // open (would clobber their in-progress edits).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, isNewDraft, newType]);

  const def = section ? SECTIONS_BY_ID[section.type] : null;

  // Debounced autosave
  const dirty = useRef(null); // pending patch
  const timer = useRef(null);
  const inflight = useRef(false);
  // True only between the first user edit on a 'new' draft and the moment
  // its create-POST resolves; queueSave can fire repeatedly during this
  // window so we serialize creates and just keep merging into dirty.
  const creatingRef = useRef(false);

  const flushSave = async () => {
    if (!section || inflight.current || creatingRef.current) return;

    // First save on a brand-new draft — POST instead of PATCH.
    if (!section.section_id) {
      if (!dirty.current) return;
      creatingRef.current = true;
      setSaveStatus("saving");
      // Merge any pending patch into the snapshot we're about to create.
      const snapshot = {
        name: section.name,
        type: section.type,
        config: section.config,
        ...dirty.current,
      };
      if (newCollectionId) {
        snapshot.collection_id = newCollectionId;
      }
      dirty.current = null;
      try {
        const created = await api.createSection(snapshot);
        // Skip the upcoming load-effect fetch caused by the URL change.
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
    if (
      !window.confirm(
        `Apply your brand kit to ${def.name}? Colors and fonts will be replaced with your saved brand values; content stays intact.`
      )
    ) {
      return;
    }
    // Overlay brand fields onto the USER'S CURRENT config (not def.defaults()
    // — that would wipe content arrays like products/slides/buttons since
    // the FIELD_MAP mappers spread `...cfg` as their starting point).
    // Defensive uid fallback covers legacy/corrupt records that lost theirs.
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
  // Debounce the snippet that drives the iframe. `useDeferredValue`
  // (what this replaces) only defers to React idle — it still flushes
  // dozens of updates per second during slider drags, each of which
  // swaps the iframe's `srcDoc` and produces a brief reload flicker.
  // A true debounce collapses bursts into a single update once the
  // user pauses for ~180 ms.
  const debouncedSnippet = useDebouncedValue(snippet, PREVIEW_DEBOUNCE_MS);
  // Hero-preview slide lock. Two ways it gets set:
  //   1. Auto: a slide row in the form panel is opened → we lock to
  //      that index. Closing the row used to clear the lock, which
  //      meant any non-slide edit (theme, layout, overlay) snapped
  //      the preview back to slide 1 — frustrating when fine-tuning
  //      settings against a specific slide. The lock is now sticky:
  //      it persists until the user explicitly toggles "Resume
  //      autoplay" via the preview toolbar.
  //   2. Manual: the preview toolbar button toggles between
  //      "Resume autoplay" (sets to null) and "Lock to slide N"
  //      (sets to a chosen index); the user can also nudge ±1 with
  //      the Prev / Next buttons while locked.
  // The state drives two paths into the iframe:
  //   - postMessage on change (no reload, fast).
  //   - `heroIndexRef` is read inside the `previewHtml` useMemo so
  //     iframe reloads (snippet regen) boot directly on the locked
  //     slide instead of flashing slide 0 between renders.
  const [heroIndex, setHeroIndex] = useState(null);
  const heroIndexRef = useRef(null);
  const updateHeroIndex = (next) => {
    heroIndexRef.current = next;
    setHeroIndex(next);
  };
  useEffect(() => {
    const h = (e) => {
      const idx = e.detail?.index;
      // Slide-row OPEN (numeric index) → adopt as the lock.
      // Slide-row CLOSE (index === null) → ignore; the lock stays
      // where the user last had it. This is the key behaviour
      // change from earlier sessions.
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
        withVatToggle:
          section?.type === "products" || section?.type === "productGrid",
        // Non-reactive read — keeps doc identity stable when only the
        // slide index changes (postMessage handles that case).
        heroIndex: heroIndexRef.current,
        // Classic editor: no click-to-edit affordances — preview behaves
        // identically to the exported snippet.
        withClickBridge: false,
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

  const previewWidths = { desktop: "100%", tablet: "820px", mobile: "390px" };

  if (loadError === "not_found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <p className="text-slate-700">This section no longer exists.</p>
        <Button onClick={() => navigate("/")}>Back to dashboard</Button>
      </div>
    );
  }
  if (!section || !def) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-body text-slate-900">
      <SectionRail activeSectionId={section.section_id} />

      {/* Form sidebar */}
      <aside
        data-testid="editor-sidebar"
        className="w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 bg-white h-screen overflow-y-auto"
      >
        <div className="px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <button
            onClick={() => navigate("/")}
            data-testid="back-to-dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All sections
          </button>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Input
                value={section.name}
                onChange={(e) => renameSection(e.target.value)}
                data-testid="section-name-input"
                className="font-heading text-base font-semibold tracking-tight border-0 px-0 h-auto py-0 shadow-none focus-visible:ring-0 truncate"
              />
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
                <BRAND.Icon className="w-3 h-3" />
                {def.name}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={resetToBrandKit}
                data-testid="apply-brand-kit"
                className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#E01839] transition-colors"
                title="Apply brand kit colors and fonts"
              >
                <Palette className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetSection}
                data-testid="reset-section"
                className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Reset to defaults"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-5">
          <def.FormPanel
            config={section.config}
            onUpdate={updateConfig}
            previewMode={previewWidth}
          />
          <AdminPreviewOverrideToggle section={section} />
        </div>
      </aside>

      {/* Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live preview
            </span>
            <div className="flex items-center bg-slate-100 rounded-md p-0.5">
              {["desktop", "tablet", "mobile"].map((w) => (
                <button
                  key={w}
                  data-testid={`viewport-${w}`}
                  onClick={() => setPreviewWidth(w)}
                  className={`px-3 py-1 text-xs font-medium rounded capitalize transition-colors ${
                    previewWidth === w
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
            {section.type === "hero" && (
              <HeroPreviewToggle
                heroIndex={heroIndex}
                setHeroIndex={updateHeroIndex}
                slideCount={section.config.slides?.length || 0}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <SaveIndicator status={saveStatus} savedAt={savedAt} />
            <Button
              data-testid="copy-snippet-button"
              onClick={copySnippet}
              className="bg-[#E01839] hover:bg-[#c01530] text-white font-medium"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy HTML Snippet
            </Button>
            <StudioToggle />
            <UserMenu />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <ViewportBanner
            previewWidth={previewWidth}
            hasViewportControls={section.type === "hero"}
          />
          <div
            className="mx-auto bg-white rounded-md border border-slate-200 overflow-hidden transition-all duration-300"
            style={{ maxWidth: previewWidths[previewWidth], width: "100%" }}
            data-testid="preview-container"
          >
            <PreviewFrame doc={previewHtml} sectionId={section.type} heroIndex={heroIndex} />
          </div>

          <SnippetDrawer snippet={snippet} onCopy={copySnippet} />
        </div>
      </main>

      <Toaster richColors position="top-center" />
    </div>
  );
}
