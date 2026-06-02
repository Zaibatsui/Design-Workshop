/**
 * sectionBadges — derives "NEW" and "UPDATED" badges for the Add-Section
 * picker, automatically, from per-section date metadata.
 *
 * Contract for section authors (and the agent that ships changes):
 * Each section in the registry exports two ISO date strings:
 *   - `addedOn`:   the day this section was first added to the library.
 *                  Sections older than the platform's tracking start
 *                  date use a sentinel ("2025-12-01") that always reads
 *                  as "not new".
 *   - `updatedOn`: the day this section last received a user-visible
 *                  improvement (new field, new behaviour, visible bug
 *                  fix — NOT typo fixes or refactors). If never updated
 *                  since launch, set equal to `addedOn`.
 *
 * Both fields accept either a date (`"2026-05-28"`) or a full ISO
 * datetime (`"2026-05-28T16:00:00Z"`). Hour-precision is recommended
 * for batches of edits on the same day so the drawer can sort them
 * by actual edit recency rather than registry order.
 *
 * Badge rules (computed live, no human gardening needed):
 *   NEW      — `addedOn` is within the last `NEW_WINDOW_DAYS` days
 *   UPDATED  — section is NOT currently NEW, AND its `updatedOn` is
 *              within the last `UPDATED_WINDOW_DAYS` days
 *
 * Auto-rotation: edits naturally age out of the UPDATED window after
 * the configured number of days — no manual unflagging required, no
 * arbitrary TOP_N cliff that hides the 4th-most-recent edit.
 */
const NEW_WINDOW_DAYS = 7;
const UPDATED_WINDOW_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

function parseISO(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function daysSince(iso, now) {
  const d = parseISO(iso);
  if (!d) return Infinity;
  // Day-floored so a date-only string like "2026-05-28" reads as the
  // same "0 days ago" regardless of the time-of-day in `now`. Granular
  // hour-precision still works because the drawer uses raw Date deltas
  // for its sort, not this helper.
  return Math.floor((now.getTime() - d.getTime()) / DAY_MS);
}

/**
 * Returns { [sectionId]: "new" | "updated" | null } for every entry in
 * the supplied sections list.
 *
 * @param {Array<{id:string, addedOn?:string, updatedOn?:string}>} sections
 * @param {Date} [now] — injectable clock for tests, defaults to new Date()
 */
export function computeBadges(sections, now = new Date()) {
  if (!Array.isArray(sections)) return {};
  const out = {};

  // Pass 1 — flag NEW sections.
  const newIds = new Set();
  for (const s of sections) {
    if (!s || !s.id) continue;
    if (daysSince(s.addedOn, now) <= NEW_WINDOW_DAYS) {
      newIds.add(s.id);
      out[s.id] = "new";
    } else {
      out[s.id] = null;
    }
  }

  // Pass 2 — UPDATED window: any non-NEW section whose `updatedOn`
  // lands within the configured window. Window-based (not top-N) so
  // every recent edit surfaces and old ones age out on their own —
  // no arbitrary cap at edit #3.
  for (const s of sections) {
    if (!s || !s.id || newIds.has(s.id)) continue;
    if (daysSince(s.updatedOn, now) <= UPDATED_WINDOW_DAYS) {
      out[s.id] = "updated";
    }
  }

  return out;
}

export const BADGE_CONFIG = { NEW_WINDOW_DAYS, UPDATED_WINDOW_DAYS };
