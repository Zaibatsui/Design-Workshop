/**
 * BlockEditorDrawer — right-pane block settings for the page editor.
 *
 * Two modes:
 *   • Classic (`studio={false}`)  → renders the section's FormPanel
 *     directly inside a slate-bordered drawer (legacy behaviour).
 *   • Studio (`studio={true}`)    → wraps the FormPanel in
 *     `<StudioInspector>` so the user gets the same Content / Design /
 *     Advanced tab UI that StudioEditor uses, plus a `<StudioOutline>`
 *     quick-jump rail above it for fast navigation across FormGroups.
 *
 * Rich-text blocks share the same chrome but skip both wrappers and
 * fall back to `RichTextBlockForm` since they don't expose FormGroups.
 */
import { useRef } from "react";
import { Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { blockTypeLabel } from "@/sections/pageSnippet";
import RichTextBlockForm from "./RichTextBlockForm";
import StudioInspector from "@/components/studio/StudioInspector";

export default function BlockEditorDrawer({
  studio = false,
  block,
  onUpdate,
  onClose,
}) {
  const isRichText = block.type === "richtext";
  const def = !isRichText ? SECTIONS_BY_ID[block.section_type] : null;
  const typeLabel = blockTypeLabel(block);
  const inspectorPanelRef = useRef(null);

  // Outer aside skips its own left border in Studio + section-block
  // mode because the embedded <StudioInspector> already paints one;
  // doubling them up would draw a 2px hairline.
  const studioSectionMode = studio && !isRichText && !!def;
  const asideCls = studio
    ? studioSectionMode
      ? "w-96 flex-shrink-0 bg-white h-screen overflow-hidden flex flex-col"
      : "w-96 flex-shrink-0 border-l border-zinc-200 bg-white h-screen overflow-hidden flex flex-col"
    : "w-96 flex-shrink-0 border-l border-slate-200 bg-white h-screen overflow-y-auto";
  const headerCls = studio
    ? "px-5 py-4 border-b border-zinc-200 bg-white flex items-start justify-between flex-shrink-0"
    : "px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10 flex items-start justify-between";
  const eyebrowCls = studio
    ? "text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5"
    : "text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5";
  const closeCls = studio
    ? "p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors flex-shrink-0"
    : "p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors flex-shrink-0";

  // FormPanel onUpdate adapter — page blocks store config under
  // `block.config` and propagate replacements via `replaceConfig`.
  const formOnUpdate = (patch) =>
    onUpdate({
      replaceConfig:
        typeof patch === "function"
          ? patch(block.config || {})
          : { ...(block.config || {}), ...patch },
    });

  return (
    <aside data-testid="block-editor-drawer" className={asideCls}>
      <div className={headerCls}>
        <div className="min-w-0 flex-1 pr-3">
          <div className={eyebrowCls}>Editing · {typeLabel}</div>
          {studio ? (
            <div
              className="group relative flex items-center"
              data-testid="block-name-field"
            >
              <Input
                value={block.name || ""}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder={typeLabel}
                data-testid="block-name-input"
                className="font-heading text-base font-semibold tracking-tight border border-zinc-200 hover:border-[#E01839] focus-visible:border-[#E01839] focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-8 py-0 shadow-none rounded-md bg-white hover:bg-red-50/40 transition-colors pr-8 placeholder:text-zinc-300"
              />
              <Pencil
                className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#E01839] group-focus-within:text-[#E01839] absolute right-2.5 pointer-events-none transition-colors"
                strokeWidth={2}
              />
            </div>
          ) : (
            <Input
              value={block.name || ""}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder={typeLabel}
              data-testid="block-name-input"
              className="font-heading text-base font-semibold tracking-tight border-0 px-0 h-auto py-0 shadow-none focus-visible:ring-0 truncate placeholder:text-slate-300"
            />
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          data-testid="block-editor-close"
          className={closeCls}
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {studio && def ? (
        // Studio: section's FormPanel wrapped in <StudioInspector> so the
        // user gets the Content / Design / Advanced tab UI — same as the
        // standalone section editor.
        <div className="flex-1 min-h-0">
          <StudioInspector
            def={def}
            config={block.config || {}}
            onUpdate={formOnUpdate}
            panelRef={inspectorPanelRef}
            hideHeader
          />
        </div>
      ) : (
        // Classic mode OR rich-text block in Studio: render the legacy
        // form-panel surface directly.
        <div className={studio ? "flex-1 overflow-y-auto p-4 space-y-4" : "p-4 space-y-4"}>
          {isRichText ? (
            <RichTextBlockForm block={block} onUpdate={onUpdate} />
          ) : def ? (
            <def.FormPanel
              config={block.config || {}}
              onUpdate={formOnUpdate}
            />
          ) : (
            <p className="text-xs text-slate-500">
              Unknown section type: {block.section_type}
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
