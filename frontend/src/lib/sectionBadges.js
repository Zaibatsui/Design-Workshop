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
 * Badge rules (computed live, no human gardening needed):
 *   NEW      — `addedOn` is within the last 14 days
 *   UPDATED  — section is NOT currently NEW, AND its `updatedOn` is
 *              one of the 3 most-recent `updatedOn` dates across the
 *              whole library
 *
 * Auto-rotation: the moment a 4th section gets an `updatedOn` more
 * recent than the previous 3, the oldest UPDATED badge drops off on
 * its own — no manual unflagging required.
 */
const NEW_WINDOW_DAYS = 14;
const UPDATED_TOP_N = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

function parseISO(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function daysSince(iso, now) {
  const d = parseISO(iso);
  if (!d) return Infinity;
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

  // Pass 2 — pick the top-N most recent `updatedOn` among sections that
  // are NOT already NEW (a fresh section doesn't need both badges).
  const candidates = sections
    .filter((s) => s && s.id && !newIds.has(s.id) && parseISO(s.updatedOn))
    .sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn))
    .slice(0, UPDATED_TOP_N);

  for (const s of candidates) {
    out[s.id] = "updated";
  }

  return out;
}

export const BADGE_CONFIG = { NEW_WINDOW_DAYS, UPDATED_TOP_N };
