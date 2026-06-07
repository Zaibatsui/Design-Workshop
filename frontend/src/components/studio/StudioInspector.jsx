/**
 * StudioInspector — the right-pane settings inspector for Studio Editor.
 *
 * Strategy (revised): render the section's existing `FormPanel` as a
 * normal React element so its hooks work, and gate per-group visibility
 * via a CSS rule keyed off `data-studio-category` (set on every
 * FormGroup via the shared FormGroup component) and `data-studio-tab`
 * on the wrapping container.
 *
 * Previously this component invoked FormPanel as a plain function to
 * walk its returned tree — that broke for any section whose FormPanel
 * uses internal hooks (useState for local search filters, useRef for
 * image-upload latches, etc.). React's hook engine assumes the
 * function is called via the renderer; calling it directly crashed
 * with "Cannot read properties of undefined (reading 'length')" inside
 * the dispatcher.
 *
 * The CSS-driven approach has three nice properties:
 *   1. Zero hook-rules violations — FormPanel renders normally.
 *   2. Toggling tabs is instant (no React re-render of the FormPanel),
 *      so form-input focus is preserved across tab switches.
 *   3. The per-tab counts are computed from the DOM after render, so
 *      they're always accurate regardless of conditional FormGroup
 *      rendering (e.g. {hasOverlay && <FormGroup …>}).
 */
import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { STUDIO_TABS } from "@/lib/studioCategorize";

export default function StudioInspector({
  def,
  config,
  onUpdate,
  previewMode,
  panelRef: externalPanelRef,
}) {
  const [active, setActive] = useState("content");
  const [counts, setCounts] = useState({ content: 0, design: 0, advanced: 0 });
  const internalPanelRef = useRef(null);
  const panelRef = externalPanelRef || internalPanelRef;

  // Recount groups whenever the panel re-renders. We schedule a single
  // microtask after each config change so we don't thrash setState
  // mid-render. The DOM query is cheap (handful of attrs).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const root = panelRef.current;
      if (!root) return;
      const next = { content: 0, design: 0, advanced: 0 };
      const groups = root.querySelectorAll("[data-studio-category]");
      groups.forEach((g) => {
        const c = g.getAttribute("data-studio-category");
        if (c && next[c] !== undefined) next[c] += 1;
      });
      setCounts(next);
    });
    return () => cancelAnimationFrame(id);
  }, [config, def?.id, previewMode]);

  // After counts settle, if the currently-active tab has 0 groups,
  // auto-switch to the first non-empty one. Stops the user landing on
  // an empty tab and seeing the "nothing here" empty-state when the
  // section type genuinely has no Content / Design / Advanced groups.
  useEffect(() => {
    const total = counts.content + counts.design + counts.advanced;
    if (total === 0) return;
    if (counts[active] === 0) {
      const fallback =
        counts.content > 0
          ? "content"
          : counts.design > 0
          ? "design"
          : "advanced";
      setActive(fallback);
    }
  }, [counts, active]);

  // Reset the active tab to "content" when the user opens a different
  // section type. Otherwise the inspector remembers the previous
  // section's active tab which can feel disorienting.
  const sectionTypeKey = def?.id || "section";
  useEffect(() => {
    setActive("content");
  }, [sectionTypeKey]);

  // Outline rail jump-to-group bridge. The outline dispatches a window
  // event with `{ category, groupValue }`; we switch to that tab and
  // simulate a click on the matching AccordionTrigger so the group
  // expands. Done via the DOM because Shadcn's Accordion state is
  // owned by `FormAccordion` (which is rendered deep inside the
  // section's FormPanel) — clicking the trigger is the lowest-friction
  // way to drive that state without a context refactor.
  useEffect(() => {
    const handler = (e) => {
      const { category, groupValue } = e.detail || {};
      if (category) setActive(category);
      requestAnimationFrame(() => {
        const root = panelRef.current;
        if (!root || !groupValue) return;
        const item = root.querySelector(
          `[data-testid="form-group-${groupValue}"]`
        );
        if (!item) return;
        const trigger = item.querySelector("button");
        if (trigger && trigger.getAttribute("data-state") === "closed") {
          trigger.click();
        }
        // Slight delay so the accordion expansion completes before scroll.
        setTimeout(() => {
          item.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 80);
      });
    };
    window.addEventListener("ns-studio-jump-to-group", handler);
    return () =>
      window.removeEventListener("ns-studio-jump-to-group", handler);
  }, [panelRef]);

  if (!def) return null;

  return (
    <div
      className="flex flex-col h-full bg-white border-l border-zinc-200"
      data-testid="studio-inspector"
    >
      <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-200 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {def.icon ? (
            <def.icon
              className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0"
              strokeWidth={1.75}
            />
          ) : null}
          <h2 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-zinc-500 truncate">
            {def.name} settings
          </h2>
        </div>
      </div>

      <Tabs
        value={active}
        onValueChange={setActive}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList
          className="grid grid-cols-3 m-3 mb-0 bg-zinc-100 rounded-md h-9 p-0.5 flex-shrink-0"
          data-testid="studio-inspector-tabs"
        >
          {STUDIO_TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              data-testid={`inspector-tab-${t.id}`}
              disabled={counts[t.id] === 0}
              className="text-[12px] font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-[5px] disabled:opacity-30"
            >
              {t.label}
              {counts[t.id] > 0 && (
                <span className="ml-1.5 text-[10px] text-zinc-400 font-normal">
                  {counts[t.id]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/*
         * Single FormPanel render with a CSS-controlled visibility gate.
         * The `data-studio-tab` attribute on the container, plus the
         * `data-studio-category` attribute on each FormGroup, drives the
         * CSS rule below — flipping tabs is a pure attribute swap, no
         * React work, so inputs keep focus across tab switches.
         */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
          <div
            ref={panelRef}
            data-studio-tab={active}
            className="ns-studio-panel"
            data-testid={`inspector-content-${active}`}
          >
            <def.FormPanel
              config={config}
              onUpdate={onUpdate}
              previewMode={previewMode}
            />
          </div>
          {counts[active] === 0 && (
            <EmptyTab category={active} />
          )}
        </div>

        {/* Hidden TabsContent so the TabsList knows the panel is mounted. */}
        {STUDIO_TABS.map((t) => (
          <TabsContent key={t.id} value={t.id} className="hidden" />
        ))}
      </Tabs>

      {/* Scoped CSS that hides FormGroups whose category doesn't match
          the active tab. Inline so it ships with the inspector and
          can't be forgotten in a separate stylesheet. */}
      <style>{`
        .ns-studio-panel[data-studio-tab="content"]  .ns-studio-group[data-studio-category="design"],
        .ns-studio-panel[data-studio-tab="content"]  .ns-studio-group[data-studio-category="advanced"],
        .ns-studio-panel[data-studio-tab="design"]   .ns-studio-group[data-studio-category="content"],
        .ns-studio-panel[data-studio-tab="design"]   .ns-studio-group[data-studio-category="advanced"],
        .ns-studio-panel[data-studio-tab="advanced"] .ns-studio-group[data-studio-category="content"],
        .ns-studio-panel[data-studio-tab="advanced"] .ns-studio-group[data-studio-category="design"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

function EmptyTab({ category }) {
  const copy = {
    content:
      "Nothing to fill in here — this section has no content fields.",
    design:
      "Uses your brand kit. Open the Brand Kit page to fine-tune colours and typography across sections.",
    advanced:
      "No advanced controls for this section. The defaults work for most cases.",
  }[category];
  return (
    <div className="flex items-center justify-center min-h-32 text-[12px] text-zinc-500 text-center px-6 leading-relaxed py-8">
      {copy}
    </div>
  );
}
