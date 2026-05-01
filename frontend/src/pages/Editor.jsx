import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  ExternalLink,
  RotateCcw,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { previewDoc, makeUid } from "@/sections/shared";
import SectionRail from "@/components/SectionRail";
import { api } from "@/lib/api";
import { BRAND } from "@/lib/brand";

const AUTOSAVE_MS = 1500;

export default function Editor() {
  const { sectionId } = useParams();
  const navigate = useNavigate();

  const [section, setSection] = useState(null); // { section_id, name, type, config, ... }
  const [loadError, setLoadError] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [savedAt, setSavedAt] = useState(null);
  const [previewWidth, setPreviewWidth] = useState("desktop");

  // Initial fetch
  useEffect(() => {
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
  }, [sectionId]);

  const def = section ? SECTIONS_BY_ID[section.type] : null;

  // Debounced autosave
  const dirty = useRef(null); // pending patch
  const timer = useRef(null);
  const inflight = useRef(false);

  const flushSave = async () => {
    if (!dirty.current || inflight.current) return;
    const patch = dirty.current;
    dirty.current = null;
    inflight.current = true;
    setSaveStatus("saving");
    try {
      const updated = await api.updateSection(sectionId, patch);
      setSection(updated);
      setSavedAt(Date.now());
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      inflight.current = false;
      // If changes piled up while saving, schedule another flush
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

  const snippet = useMemo(
    () => (def && section ? def.render(section.config) : ""),
    [def, section]
  );
  const previewHtml = useMemo(() => previewDoc(snippet), [snippet]);

  const copySnippet = async () => {
    if (!def || !section) return;
    const fresh = { ...section.config, uid: makeUid() };
    const out = def.render(fresh);
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

  // The rail's "switch type" semantics changes meaning here: it should NAVIGATE
  // to a different section of the user's library or a new section. Disable for now.
  const onSelectFromRail = () => {
    // No-op in single-section editor mode. The rail still shows visual context.
  };

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
      <SectionRail activeId={section.type} onSelect={onSelectFromRail} />

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
            <button
              type="button"
              onClick={resetSection}
              data-testid="reset-section"
              className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors flex-shrink-0"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-5">
          <def.FormPanel config={section.config} onUpdate={updateConfig} />
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
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div
            className="mx-auto bg-white rounded-md border border-slate-200 overflow-hidden transition-all duration-300"
            style={{ maxWidth: previewWidths[previewWidth], width: "100%" }}
            data-testid="preview-container"
          >
            <PreviewFrame doc={previewHtml} sectionId={section.type} />
          </div>

          <SnippetDrawer snippet={snippet} onCopy={copySnippet} />
        </div>
      </main>

      <Toaster richColors position="top-center" />
    </div>
  );
}

function SaveIndicator({ status, savedAt }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (status !== "saved") return;
    const i = setInterval(() => force((n) => n + 1), 15000);
    return () => clearInterval(i);
  }, [status]);

  if (status === "saving") {
    return (
      <span
        data-testid="save-indicator"
        className="text-xs text-slate-500 flex items-center gap-1.5"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        data-testid="save-indicator"
        className="text-xs text-red-600 flex items-center gap-1.5"
      >
        Save failed
      </span>
    );
  }
  if (status === "saved" && savedAt) {
    const sec = Math.floor((Date.now() - savedAt) / 1000);
    return (
      <span
        data-testid="save-indicator"
        className="text-xs text-slate-500 flex items-center gap-1.5"
      >
        <Check className="w-3 h-3 text-emerald-500" />
        Saved {sec < 5 ? "just now" : `${sec}s ago`}
      </span>
    );
  }
  return null;
}

function PreviewFrame({ doc, sectionId }) {
  const heightMap = {
    hero: 640,
    content: 300,
    products: 540,
    resources: 480,
    insights: 320,
    placeholder: 480,
    logos: 160,
    break: 380,
    tabs: 560,
  };
  const h = heightMap[sectionId] || 600;
  return (
    <iframe
      key={sectionId}
      data-testid="preview-iframe"
      title="Live preview"
      srcDoc={doc}
      sandbox="allow-scripts allow-same-origin"
      className="w-full block border-0"
      style={{ height: `${h}px` }}
    />
  );
}

function SnippetDrawer({ snippet, onCopy }) {
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
            <span className="text-xs text-slate-500 font-normal">
              ({snippet.length.toLocaleString()} chars)
            </span>
          </span>
          <span className="text-xs text-slate-500">
            {open ? "Hide" : "Show"}
          </span>
        </button>
        {open && (
          <div className="border-t border-slate-200">
            <div className="flex items-center justify-between px-5 py-2 bg-slate-50 border-b border-slate-200">
              <span className="text-xs text-slate-500">
                Self-contained · scoped CSS · multi-instance safe · Poppins
                import included
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={onCopy}
                data-testid="copy-snippet-inline-button"
              >
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>
            <pre
              data-testid="snippet-pre"
              className="p-5 text-xs font-mono text-slate-700 overflow-auto max-h-96 bg-slate-50/50 whitespace-pre-wrap break-all"
            >
              {snippet}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
