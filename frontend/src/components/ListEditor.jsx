import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Generic editor for arrays of items (slides, products, logos, tabs).
 * Each item is rendered as a collapsible row using `renderRow` for the
 * compact summary and `renderForm` for the expanded form.
 */
export default function ListEditor({
  items,
  onAdd,
  onRemove,
  onMove,
  renderRow,
  renderForm,
  addLabel = "Add item",
  testidPrefix = "list",
}) {
  const [openId, setOpenId] = useState(items[0]?.id || null);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            data-testid={`${testidPrefix}-row-${idx}`}
            className={`rounded-md border transition-colors ${
              isOpen ? "border-slate-900" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 p-2">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex-1 flex items-center gap-2 min-w-0 text-left hover:bg-slate-50 rounded px-1 py-1 transition-colors"
                data-testid={`${testidPrefix}-toggle-${idx}`}
              >
                <div className="flex-1 min-w-0">{renderRow(item, idx)}</div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  data-testid={`${testidPrefix}-up-${idx}`}
                  onClick={() => onMove(item.id, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  type="button"
                  data-testid={`${testidPrefix}-down-${idx}`}
                  onClick={() => onMove(item.id, 1)}
                  disabled={idx === items.length - 1}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  type="button"
                  data-testid={`${testidPrefix}-remove-${idx}`}
                  onClick={() => onRemove(item.id)}
                  className="p-1 rounded hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="p-3 pt-0 border-t border-slate-100 mt-2 space-y-3">
                {renderForm(item, idx)}
              </div>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        data-testid={`${testidPrefix}-add`}
        className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      >
        <Plus className="w-4 h-4 mr-1" /> {addLabel}
      </Button>
    </div>
  );
}
