/**
 * BlockEditorDrawer — right-hand panel in the page editor. Renders either
 * the richtext form or a section's own FormPanel, with a name/close header.
 */
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { blockTypeLabel } from "@/sections/pageSnippet";
import RichTextBlockForm from "./RichTextBlockForm";

export default function BlockEditorDrawer({ block, onUpdate, onClose }) {
  const isRichText = block.type === "richtext";
  const def = !isRichText ? SECTIONS_BY_ID[block.section_type] : null;
  const typeLabel = blockTypeLabel(block);

  return (
    <aside
      data-testid="block-editor-drawer"
      className="w-96 flex-shrink-0 border-l border-slate-200 bg-white h-screen overflow-y-auto"
    >
      <div className="px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10 flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
            Editing · {typeLabel}
          </div>
          <Input
            value={block.name || ""}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={typeLabel}
            data-testid="block-name-input"
            className="font-heading text-base font-semibold tracking-tight border-0 px-0 h-auto py-0 shadow-none focus-visible:ring-0 truncate placeholder:text-slate-300"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          data-testid="block-editor-close"
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors flex-shrink-0"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        {isRichText ? (
          <RichTextBlockForm block={block} onUpdate={onUpdate} />
        ) : def ? (
          <def.FormPanel
            config={block.config || {}}
            onUpdate={(patch) =>
              onUpdate({
                replaceConfig:
                  typeof patch === "function"
                    ? patch(block.config || {})
                    : { ...(block.config || {}), ...patch },
              })
            }
          />
        ) : (
          <p className="text-xs text-slate-500">
            Unknown section type: {block.section_type}
          </p>
        )}
      </div>
    </aside>
  );
}
