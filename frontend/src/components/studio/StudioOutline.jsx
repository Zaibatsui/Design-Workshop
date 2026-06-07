/**
 * StudioOutline — left-rail navigator for the Studio Editor.
 *
 * Reads the StudioInspector's panel DOM (handed down via `panelRef`)
 * and surfaces every `FormGroup` (anything with `.ns-studio-group`
 * data-attrs) as a flat, click-to-jump list grouped by category
 * (Content / Design / Advanced).
 *
 * Clicking an item dispatches a window event the inspector listens
 * for; the inspector switches its active tab AND simulates a click on
 * the accordion trigger, so the form group opens and scrolls into
 * view. No prop drilling required.
 *
 * Re-scans on `signal` change (StudioEditor bumps it on
 * config / section / preview-mode changes) so conditionally rendered
 * groups (e.g. mobile-only) stay in sync.
 */
import { useEffect, useState } from "react";
import { STUDIO_TABS } from "@/lib/studioCategorize";

const CATEGORY_ORDER = ["content", "design", "advanced"];
const CATEGORY_LABEL = Object.fromEntries(
  STUDIO_TABS.map((t) => [t.id, t.label])
);

export default function StudioOutline({ panelRef, signal }) {
  const [groups, setGroups] = useState([]);

  // Re-scan the inspector's DOM for FormGroups after every render.
  // Use requestAnimationFrame so we read post-paint state and a small
  // backup setTimeout to catch the case where Shadcn Accordion content
  // mounts a tick later than the trigger.
  useEffect(() => {
    let raf = 0;
    let to = 0;
    const scan = () => {
      const root = panelRef?.current;
      if (!root) {
        setGroups([]);
        return;
      }
      const nodes = root.querySelectorAll("[data-studio-category]");
      const next = [];
      nodes.forEach((el) => {
        const value = (el.getAttribute("data-testid") || "").replace(
          /^form-group-/,
          ""
        );
        const category = el.getAttribute("data-studio-category");
        // Title sits on the AccordionTrigger button inside this item.
        const trigger = el.querySelector("button");
        const title = trigger?.textContent?.trim();
        if (value && category && title) {
          next.push({ value, category, title });
        }
      });
      setGroups(next);
    };
    raf = requestAnimationFrame(scan);
    to = window.setTimeout(scan, 80);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(to);
    };
  }, [panelRef, signal]);

  const jump = (group) => {
    window.dispatchEvent(
      new CustomEvent("ns-studio-jump-to-group", {
        detail: { category: group.category, groupValue: group.value },
      })
    );
  };

  if (groups.length === 0) {
    return (
      <p
        className="text-[11px] text-zinc-500 leading-relaxed px-2.5 mt-2"
        data-testid="studio-outline-empty"
      >
        This section has no editable groups — the defaults work out of the
        box. Tweak the canvas viewport above to preview it.
      </p>
    );
  }

  return (
    <div className="space-y-4" data-testid="studio-outline-list">
      {CATEGORY_ORDER.map((cat) => {
        const items = groups.filter((g) => g.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <div
              className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-zinc-400"
              data-testid={`studio-outline-cat-${cat}`}
            >
              {CATEGORY_LABEL[cat] || cat}
              <span className="ml-1.5 text-zinc-300 font-normal">
                {items.length}
              </span>
            </div>
            <div className="space-y-0.5">
              {items.map((g) => (
                <button
                  key={`${g.category}-${g.value}`}
                  type="button"
                  onClick={() => jump(g)}
                  data-testid={`studio-outline-item-${g.value}`}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-[12.5px] text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  <span className="h-1 w-1 rounded-full bg-zinc-300 flex-shrink-0" />
                  <span className="truncate">{g.title}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
