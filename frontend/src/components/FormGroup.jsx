/**
 * FormAccordion + FormGroup — shared form-group container for section
 * editors. Replaces the per-section local `Group` divs with a
 * collapsible Shadcn Accordion so editors with many groups (Hero,
 * Split Banner, Products) don't require endless vertical scrolling.
 *
 * Behaviour:
 *   - `<FormAccordion sectionType="hero">` wraps a column of
 *     `<FormGroup title="...">` children.
 *   - Single-group-open at a time (Shadcn `type="single" collapsible`).
 *   - The user's last-opened group per section TYPE is remembered in
 *     `localStorage`, scoped by sectionType. So opening "Theme" on
 *     a hero stays sticky next time you edit any hero.
 *   - On first ever load of a section type, the FIRST group declared
 *     in source order is opened by default — friendlier than showing
 *     the user a wall of collapsed titles with nothing visible.
 *
 * Why one component instead of inline `<Accordion>` in every section?
 *   - The 15 section files all use the same group pattern. Centralising
 *     makes the visual + behavioural treatment consistent and is the
 *     single seam where we'd add e.g. keyboard shortcuts or "expand
 *     all" later.
 *   - The shared component handles the localStorage wiring once.
 */
import { Children, useEffect, useMemo, useState, isValidElement } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const STORAGE_PREFIX = "ns-form-open-group:";

/** Slugify a title into a stable accordion-item value. */
function slug(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function FormAccordion({ sectionType, children, defaultOpen }) {
  const storageKey = STORAGE_PREFIX + sectionType;

  // First valid FormGroup child becomes the default-open value when
  // the user has no localStorage preference yet.
  const firstChildValue = useMemo(() => {
    let found = null;
    Children.forEach(children, (child) => {
      if (found || !isValidElement(child)) return;
      const title = child.props?.title;
      if (title) found = slug(title);
    });
    return found;
  }, [children]);

  const [openValue, setOpenValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) return stored; // includes "" for "all collapsed"
    } catch {
      /* ignore */
    }
    return defaultOpen ? slug(defaultOpen) : firstChildValue || "";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, openValue || "");
    } catch {
      /* ignore */
    }
  }, [openValue, storageKey]);

  return (
    <Accordion
      type="single"
      collapsible
      value={openValue}
      onValueChange={(v) => setOpenValue(v || "")}
      className="space-y-2"
      data-testid={`form-accordion-${sectionType}`}
    >
      {children}
    </Accordion>
  );
}

/**
 * Drop-in replacement for the per-section local `Group` component.
 * Accepts the same `{ title, children }` interface so refactoring an
 * existing section is a one-line import change + a wrapper around the
 * whole panel.
 */
export function FormGroup({ title, children, value }) {
  const v = value || slug(title);
  return (
    <AccordionItem
      value={v}
      className="border border-slate-200 rounded-md bg-white overflow-hidden last:border-b"
      data-testid={`form-group-${v}`}
    >
      <AccordionTrigger
        className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:no-underline hover:bg-slate-50 [&[data-state=open]]:bg-slate-50"
      >
        {title}
      </AccordionTrigger>
      <AccordionContent className="px-3 pt-1 pb-3">
        <div className="space-y-3">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
