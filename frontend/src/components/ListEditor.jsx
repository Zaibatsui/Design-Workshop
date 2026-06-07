import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Generic editor for arrays of items (slides, products, logos, tabs).
 * Each item is rendered as a collapsible row using `renderRow` for the
 * compact summary and `renderForm` for the expanded form.
 *
 * UX detail: when a new item is added (the items array grows), the
 * newly-appended row auto-expands AND scrolls into view, so users can
 * start editing it immediately instead of scrolling down and hunting
 * for the new (collapsed) row. Reorder / remove operations don't
 * trigger this behaviour.
 *
 * Props:
 *   - `defaultOpenFirst` (bool, default true): opens the first row on
 *     mount. Set to false for editors where the user should pick which
 *     row to edit (hero slides — preview should track the open row).
 *   - `onOpenChange(id|null)`: optional callback fired whenever the
 *     active row changes. Lets parents synchronise other UI (e.g.
 *     hero live-preview slide index) with the editor state.
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
  defaultOpenFirst = true,
  onOpenChange,
}) {
  const [openId, setOpenId] = useState(
    defaultOpenFirst ? items[0]?.id || null : null
  );
  const prevLen = useRef(items.length);
  const rowRefs = useRef({});

  useEffect(() => {
    if (items.length > prevLen.current) {
      const last = items[items.length - 1];
      if (last) {
        setOpenId(last.id);
        // Scroll the new row into view once it has rendered expanded.
        // `block: "center"` so the top edge of the now-tall row doesn't
        // butt up against the editor toolbar / sticky header.
        requestAnimationFrame(() => {
          const el = rowRefs.current[last.id];
          if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      }
    }
    prevLen.current = items.length;
  }, [items]);

  // Notify parents (e.g. hero editor) when the active row changes so
  // they can drive the live preview to the matching slide and pause
  // autoplay while a row is being edited.
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });
  useEffect(() => {
    if (typeof onOpenChangeRef.current === "function") {
      onOpenChangeRef.current(openId);
    }
    // Tell the live preview iframe to scroll the matching row into
    // view — closes the loop: clicking a card in the preview opens its
    // editor (handled below), and opening a row in the editor scrolls
    // the preview to it. `openId` is the row's stable list-item id; we
    // resolve it back to a zero-based index because `data-ns-item`
    // values in the rendered snippet are positional.
    const idx = items.findIndex((it) => it.id === openId);
    if (idx >= 0) {
      window.dispatchEvent(
        new CustomEvent("ns-editor-focus-item", {
          detail: { list: testidPrefix, index: idx },
        })
      );
    }
  }, [openId, items, testidPrefix]);
  // Reset the parent's "active row" tracker when this editor unmounts
  // (e.g. the user collapses the surrounding accordion group) — without
  // this, the parent would stay locked to the last-opened row.
  useEffect(() => {
    return () => {
      if (typeof onOpenChangeRef.current === "function") {
        onOpenChangeRef.current(null);
      }
    };
  }, []);

  // Preview click-to-edit bridge: when the user clicks a specific list
  // row in the preview iframe (a hero slide, a product card, an FAQ
  // row), the editor dispatches `ns-studio-expand-item` with the
  // matching `testidPrefix` + zero-based index. We open that row and
  // scroll it into view so the user lands directly on its editor.
  useEffect(() => {
    const handler = (e) => {
      const d = e.detail || {};
      if (d.list !== testidPrefix) return;
      const idx = Number.isInteger(d.itemIndex) ? d.itemIndex : -1;
      if (idx < 0 || idx >= items.length) return;
      const target = items[idx];
      if (!target) return;
      setOpenId(target.id);
      requestAnimationFrame(() => {
        const el = rowRefs.current[target.id];
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    };
    window.addEventListener("ns-studio-expand-item", handler);
    return () => window.removeEventListener("ns-studio-expand-item", handler);
  }, [items, testidPrefix]);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            ref={(el) => {
              if (el) rowRefs.current[item.id] = el;
              else delete rowRefs.current[item.id];
            }}
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
