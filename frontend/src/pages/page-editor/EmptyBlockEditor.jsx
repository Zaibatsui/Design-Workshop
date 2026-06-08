import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Placeholder rendered in the BlockEditorDrawer slot when no block is
 * selected. Mirrors the dimensions of the drawer so the layout stays
 * stable as the user navigates between blocks.
 */
export default function EmptyBlockEditor({ studio = false, onAdd }) {
  return (
    <aside
      data-testid="empty-block-editor"
      className={`flex-shrink-0 h-screen flex flex-col items-center justify-center p-8 text-center ${
        studio
          ? "w-[350px] bg-white border-l border-zinc-200"
          : "w-96 bg-white border-r border-slate-200"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-4 ${
          studio ? "bg-zinc-100" : "bg-slate-100"
        }`}
      >
        <Layers className={`w-5 h-5 ${studio ? "text-zinc-400" : "text-slate-400"}`} />
      </div>
      <h2 className="font-heading text-base font-semibold mb-2">
        No block selected
      </h2>
      <p className={`text-sm max-w-xs mb-6 ${studio ? "text-zinc-500" : "text-slate-500"}`}>
        Pick a block from the rail to edit its settings, or add a new one to
        start composing this page.
      </p>
      <Button
        onClick={onAdd}
        size="sm"
        className={
          studio
            ? "bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
            : "bg-[#E01839] hover:bg-[#c01530] text-white font-medium"
        }
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Add block
      </Button>
    </aside>
  );
}
