/**
 * WhatsNewDrawer — Sheet-based side drawer listing every section that
 * currently carries a NEW or UPDATED badge, with a plain-English note
 * describing what's new or what changed.
 *
 * Reads from `SECTIONS` (which already carry the `addedOn` / `updatedOn`
 * metadata via the registry) plus the `whatsNew` notes added in
 * `sections/sectionMeta.js`.
 *
 * Persists a "last seen" timestamp in localStorage so the trigger
 * button can show a small red dot when there's something the user
 * hasn't acknowledged yet.
 */
import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SECTIONS } from "@/sections/registry";
import { PAGE_TEMPLATES } from "@/sections/pageTemplates";
import { computeBadges } from "@/lib/sectionBadges";

const LS_KEY = "ns.whatsNew.lastSeenAt";

function readLastSeen() {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v ? new Date(v) : null;
  } catch {
    return null;
  }
}

function writeLastSeen(d) {
  try {
    localStorage.setItem(LS_KEY, d.toISOString());
  } catch {
    // localStorage disabled in private mode — fall back to in-memory only
  }
}

/**
 * Returns the list of items with badges + their friendly notes,
 * filtered to entries that actually have a `whatsNew` string. Sorted
 * with NEW first, then UPDATED by recency. Reusable across sections
 * and page templates — both data sources expose the same shape.
 */
function buildEntries(items) {
  const badges = computeBadges(items);
  return items
    .filter((s) => badges[s.id] && s.whatsNew)
    .map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      kind: badges[s.id],
      addedOn: s.addedOn,
      updatedOn: s.updatedOn,
      note: s.whatsNew,
    }))
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "new" ? -1 : 1;
      const key = a.kind === "new" ? "addedOn" : "updatedOn";
      return new Date(b[key]) - new Date(a[key]);
    });
}

/**
 * Returns the most recent date across all entries (used to decide
 * whether to show the unread-dot indicator on the trigger button).
 *
 * Takes max(addedOn, updatedOn) per entry so a NEW section whose
 * `whatsNew` note gets bumped mid-window still re-lights the dot
 * for users who already opened the drawer.
 */
function mostRecentDate(entries) {
  if (!entries.length) return null;
  return entries.reduce((acc, e) => {
    const added = e.addedOn ? new Date(e.addedOn) : null;
    const updated = e.updatedOn ? new Date(e.updatedOn) : null;
    const d = !added ? updated : !updated ? added : added > updated ? added : updated;
    if (!d) return acc;
    return !acc || d > acc ? d : acc;
  }, null);
}

export function WhatsNewTrigger({ "data-testid": testid = "open-whats-new" }) {
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => readLastSeen());
  // Recompute the entries lazily and memoise — the dataset only changes
  // on full reload because the dates are static config.
  const sectionEntries = useMemo(() => buildEntries(SECTIONS), []);
  const templateEntries = useMemo(() => buildEntries(PAGE_TEMPLATES), []);
  const allEntries = useMemo(
    () => [...sectionEntries, ...templateEntries],
    [sectionEntries, templateEntries]
  );
  const latest = useMemo(() => mostRecentDate(allEntries), [allEntries]);
  const hasUnread =
    allEntries.length > 0 && (!lastSeen || (latest && latest > lastSeen));

  // Mark everything as seen the moment the drawer opens — the user is
  // looking at the content right now.
  useEffect(() => {
    if (open) {
      const now = new Date();
      writeLastSeen(now);
      setLastSeen(now);
    }
  }, [open]);

  // Don't render the button if there's nothing to announce.
  if (allEntries.length === 0) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        data-testid={testid}
        className="relative text-slate-500 hover:text-slate-900"
      >
        <Sparkles className="w-4 h-4 mr-1.5" />
        What's new
        {hasUnread && (
          <span
            data-testid="whats-new-unread-dot"
            aria-label="New updates available"
            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"
          />
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto"
          data-testid="whats-new-drawer"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              What's new
            </SheetTitle>
            <SheetDescription>
              Recent additions and improvements to your library.
            </SheetDescription>
          </SheetHeader>

          {sectionEntries.length > 0 && (
            <EntryGroup
              title="Sections"
              entries={sectionEntries}
              testidPrefix="whats-new-entry"
            />
          )}
          {templateEntries.length > 0 && (
            <EntryGroup
              title="Page templates"
              entries={templateEntries}
              testidPrefix="whats-new-template-entry"
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * Renders a labelled list of WhatsNew entries — used for both the
 * Sections band and the Page templates band inside the drawer.
 */
function EntryGroup({ title, entries, testidPrefix }) {
  return (
    <div className="mt-6">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">
        {title}
      </h4>
      <div className="space-y-3">
        {entries.map((e) => {
          const Icon = e.icon;
          const isNew = e.kind === "new";
          return (
            <div
              key={e.id}
              data-testid={`${testidPrefix}-${e.id}`}
              className="flex gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center">
                {Icon ? <Icon className="w-4 h-4 text-slate-700" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {e.name}
                  </h3>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${
                      isNew
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {isNew ? "New" : "Updated"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {e.note}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WhatsNewTrigger;
