/**
 * WhatsNewDrawer — Sheet-based side drawer listing every section that
 * currently carries a NEW or UPDATED badge, with a plain-English note
 * describing what's new or what changed.
 *
 * Reads from `SECTIONS` (which already carry the `addedOn` / `updatedOn`
 * metadata via the registry) plus the `whatsNew` notes added in
 * `sections/sectionMeta.js`.
 *
 * Tracks "seen" state PER USER and PER ENTRY SIGNATURE. A signature is
 * `<id>:<updatedOn||addedOn>` so every individual addition or bump is
 * its own dismissable thing. Two consequences:
 *   • Different users on the same browser get independent unread state
 *     (key is namespaced by the logged-in email).
 *   • Every time we ship a new entry — or bump `updatedOn` on an
 *     existing one — the dot re-lights for every user who hasn't
 *     clicked through that specific version yet.
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
import { useAuth } from "@/auth/AuthContext";

const LS_PREFIX = "ns.whatsNew.seen:";

function readSeen(userKey) {
  if (!userKey) return new Set();
  try {
    const raw = localStorage.getItem(LS_PREFIX + userKey);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeen(userKey, set) {
  if (!userKey) return;
  try {
    localStorage.setItem(LS_PREFIX + userKey, JSON.stringify(Array.from(set)));
  } catch {
    // localStorage disabled in private mode — fall back to in-memory only
  }
}

/**
 * Signature for an entry — uniquely identifies a *version* of the
 * entry. Bumping `updatedOn` changes the signature, which is what
 * makes the dot re-light when we ship an improvement.
 */
function entrySig(e) {
  const v = e.updatedOn || e.addedOn || "0";
  return `${e.id}:${v}`;
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
 * Returns the set of entry signatures currently shown — i.e. every
 * entry that has a NEW or UPDATED badge AND a whatsNew note. The
 * unread-dot fires when this set contains anything not already in
 * the user's "seen" set.
 */
function currentSignatures(entries) {
  return new Set(entries.map(entrySig));
}

export function WhatsNewTrigger({ "data-testid": testid = "open-whats-new" }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth() || {};
  // Per-user storage key — falls back to "anonymous" on the rare
  // logged-out paths that mount this trigger (e.g. shared previews).
  const userKey = (user && (user.email || user.id)) || "anonymous";
  const [seen, setSeen] = useState(() => readSeen(userKey));

  // When the logged-in identity changes (different user signs in on
  // the same browser, or initial /api/auth/me resolves), reload the
  // matching seen-set so each user's notification state is independent.
  useEffect(() => {
    setSeen(readSeen(userKey));
  }, [userKey]);

  // Recompute the entries lazily and memoise — the dataset only changes
  // on full reload because the dates are static config.
  const sectionEntries = useMemo(() => buildEntries(SECTIONS), []);
  const templateEntries = useMemo(() => buildEntries(PAGE_TEMPLATES), []);
  const allEntries = useMemo(
    () => [...sectionEntries, ...templateEntries],
    [sectionEntries, templateEntries]
  );
  const currentSigs = useMemo(() => currentSignatures(allEntries), [allEntries]);
  // Unread = any currently-shown signature the user hasn't acknowledged.
  const hasUnread = useMemo(() => {
    for (const sig of currentSigs) {
      if (!seen.has(sig)) return true;
    }
    return false;
  }, [currentSigs, seen]);

  // Mark every currently-shown entry as seen the moment the drawer
  // opens. Future updates (new entries or `updatedOn` bumps) will
  // produce signatures not in this set, re-lighting the dot.
  useEffect(() => {
    if (open) {
      const next = new Set(seen);
      for (const sig of currentSigs) next.add(sig);
      writeSeen(userKey, next);
      setSeen(next);
    }
    // We intentionally don't include `seen` in deps — we read it
    // through the closure, write the merged set, and seed React state
    // with the same merged set so subsequent opens see the latest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userKey]);

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
