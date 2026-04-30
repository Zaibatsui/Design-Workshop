import { useMemo, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Copy, Sparkles, ExternalLink, RotateCcw } from "lucide-react";
import { SECTIONS, SECTIONS_BY_ID } from "@/sections/registry";
import { previewDoc, makeUid } from "@/sections/shared";
import SectionRail from "@/components/SectionRail";

export default function Editor() {
  // Per-section config. Each section type keeps its own config when user
  // switches away and back.
  const [sectionConfigs, setSectionConfigs] = useState(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.id, s.defaults()]))
  );
  const [activeId, setActiveId] = useState("hero-slide");
  const [previewWidth, setPreviewWidth] = useState("desktop");

  const def = SECTIONS_BY_ID[activeId];
  const config = sectionConfigs[activeId];

  const updateConfig = (patch) => {
    setSectionConfigs((prev) => ({
      ...prev,
      [activeId]:
        typeof patch === "function"
          ? patch(prev[activeId])
          : { ...prev[activeId], ...patch },
    }));
  };

  const resetSection = () => {
    setSectionConfigs((prev) => ({ ...prev, [activeId]: def.defaults() }));
    toast.success(`Reset ${def.name}`);
  };

  const snippet = useMemo(() => def.render(config), [def, config]);
  const previewHtml = useMemo(() => previewDoc(snippet), [snippet]);

  const copySnippet = async () => {
    // Fresh uid on every copy so each pasted snippet has its own scope.
    const fresh = { ...config, uid: makeUid() };
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

  const previewWidths = {
    desktop: "100%",
    tablet: "820px",
    mobile: "390px",
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-body text-slate-900">
      <SectionRail activeId={activeId} onSelect={setActiveId} />

      {/* Form sidebar */}
      <aside
        data-testid="editor-sidebar"
        className="w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 bg-white h-screen overflow-y-auto"
      >
        <div className="px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1
                  className="font-heading text-base font-semibold tracking-tight leading-none truncate"
                  data-testid="active-section-name"
                >
                  {def.name}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {def.description}
                </p>
              </div>
            </div>
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

        <div className="px-4 py-5">
          <def.FormPanel config={config} onUpdate={updateConfig} />
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
            <span className="text-xs text-slate-400 hidden md:inline">
              instance:{" "}
              <code className="font-mono text-slate-600">{config.uid}</code>
            </span>
            <Button
              data-testid="copy-snippet-button"
              onClick={copySnippet}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium"
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
            <PreviewFrame doc={previewHtml} sectionId={activeId} />
          </div>

          <SnippetDrawer snippet={snippet} onCopy={copySnippet} />
        </div>
      </main>

      <Toaster richColors position="top-center" />
    </div>
  );
}

function PreviewFrame({ doc, sectionId }) {
  // Adjust iframe height so each section type gets sensible default vertical
  // space without scrollbars in the canvas.
  const heightMap = {
    "hero-fade": 640,
    "hero-slide": 640,
    content: 240,
    products: 540,
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
                Self-contained · scoped CSS · multi-instance safe · Poppins import included
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
