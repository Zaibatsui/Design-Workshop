/**
 * StudioInspector — the right-pane settings inspector for Studio Editor.
 *
 * Strategy: each section type ships its own FormPanel React component
 * that renders a `<FormAccordion>` of one or more `<FormGroup>` blocks.
 * Rather than rewriting every section's FormPanel for the Studio shell,
 * we INVOKE the existing FormPanel function (it's just a function
 * component), WALK its returned React tree to pull out every FormGroup,
 * categorise each by title (content / design / advanced), and re-render
 * them inside Shadcn Tabs.
 *
 * Why this approach:
 *   • Zero changes to the 23 existing section files. The Classic editor
 *     and the Studio editor share the same form panels — Studio just
 *     reframes them.
 *   • Any new section that follows the existing FormAccordion +
 *     FormGroup convention is automatically Studio-ready.
 *   • If a title is unrecognised the heuristic defaults to "content",
 *     so no setting ever vanishes.
 *
 * The walk uses React.Children.toArray + recursion through children so
 * it handles FormAccordion wrappers, Fragments, conditional renders
 * (e.g. {hasOverlay && <FormGroup title="Overlay">…</FormGroup>}) and
 * arrays from map() calls uniformly.
 */
import { Children, isValidElement, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormGroup, FormAccordion } from "@/components/FormGroup";
import { categorizeGroupTitle, STUDIO_TABS } from "@/lib/studioCategorize";

/**
 * Walks a React tree breadth-first and returns every <FormGroup>
 * element it encounters. Children of FormGroups themselves are NOT
 * descended into (we only want the top-level groups, not nested ones).
 */
function collectFormGroups(node, out = []) {
  if (node == null || node === false) return out;
  if (Array.isArray(node)) {
    node.forEach((n) => collectFormGroups(n, out));
    return out;
  }
  if (!isValidElement(node)) return out;
  if (node.type === FormGroup) {
    out.push(node);
    return out; // skip descent — we treat each FormGroup as a leaf.
  }
  const kids = node.props && node.props.children;
  if (kids != null) collectFormGroups(kids, out);
  return out;
}

export default function StudioInspector({
  def,
  config,
  onUpdate,
  previewMode,
}) {
  // Invoke the section's FormPanel as a function to get its React tree
  // synchronously. This is a hard call to function-components which is
  // unusual in React land — but it's safe here because FormPanel is a
  // pure render function and we only use the tree for structural
  // inspection, NEVER to mount as a separate tree. We then re-render
  // each extracted FormGroup inside a tab below, so React still owns
  // the mount lifecycle.
  const tree = useMemo(() => {
    if (!def || !def.FormPanel) return null;
    try {
      return def.FormPanel({ config, onUpdate, previewMode });
    } catch (e) {
      // FormPanels are pure renderers in this codebase; the only path
      // that throws is a programming error. Swallow + leave the tree
      // empty so the editor still renders something.
      if (process.env.NODE_ENV !== "production") {
        console.warn("StudioInspector: FormPanel threw", e);
      }
      return null;
    }
  }, [def, config, onUpdate, previewMode]);

  const groups = useMemo(() => {
    const collected = collectFormGroups(tree);
    return collected.map((el, i) => ({
      el,
      key: el.props?.title || `group-${i}`,
      title: el.props?.title || "Settings",
      category: categorizeGroupTitle(el.props?.title),
    }));
  }, [tree]);

  const byCategory = useMemo(() => {
    const out = { content: [], design: [], advanced: [] };
    for (const g of groups) out[g.category].push(g);
    return out;
  }, [groups]);

  // Default tab: first non-empty one. Sticks per-session-and-section
  // type so flipping between sliders/colour pickers doesn't re-jump.
  const [active, setActive] = useState(() => {
    if (byCategory.content.length) return "content";
    if (byCategory.design.length) return "design";
    return "advanced";
  });

  if (!def) return null;

  const sectionTypeKey = def.id || "section";

  return (
    <div
      className="flex flex-col h-full bg-white border-l border-zinc-200"
      data-testid="studio-inspector"
    >
      <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-200 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {def.icon ? (
            <def.icon className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" strokeWidth={1.75} />
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
              disabled={byCategory[t.id].length === 0}
              className="text-[12px] font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-[5px] disabled:opacity-30"
            >
              {t.label}
              {byCategory[t.id].length > 0 && (
                <span className="ml-1.5 text-[10px] text-zinc-400 font-normal">
                  {byCategory[t.id].length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {STUDIO_TABS.map((t) => {
          const list = byCategory[t.id];
          return (
            <TabsContent
              key={t.id}
              value={t.id}
              className="flex-1 min-h-0 overflow-y-auto px-3 py-3 mt-0"
              data-testid={`inspector-content-${t.id}`}
            >
              {list.length === 0 ? (
                <EmptyTab category={t.id} />
              ) : (
                <FormAccordion sectionType={`studio-${sectionTypeKey}-${t.id}`}>
                  {list.map((g) => g.el)}
                </FormAccordion>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function EmptyTab({ category }) {
  const copy = {
    content: "Nothing to fill in here — this section has no content fields.",
    design: "Uses your brand kit. Open the Brand Kit page to fine-tune colours and typography across sections.",
    advanced: "No advanced controls for this section. The defaults work for most cases.",
  }[category];
  return (
    <div className="flex items-center justify-center h-32 text-[12px] text-zinc-500 text-center px-6 leading-relaxed">
      {copy}
    </div>
  );
}
