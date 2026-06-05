/**
 * sectionBadges — derives "NEW" and "UPDATED" badges for the Add-Section
 * picker, automatically, from per-section date metadata.
 *
 * Contract for section authors (and the agent that ships changes):
 * Each section in the registry exports two ISO date strings:
 *   - `addedOn`:   the day this section was first added to the library.
 *                  Sections shipped on launch day all share the same
 *                  "launch sentinel" date — those are NOT eligible for
 *                  NEW (they're not new any more, they're foundational).
 *   - `updatedOn`: the day this section last received a user-visible
 *                  improvement (new field, new behaviour, visible bug
 *                  fix — NOT typo fixes or refactors). If a section has
 *                  never been updated since launch, set it equal to
 *                  `addedOn` and it'll be excluded from the UPDATED set.
 *
 * Both fields accept either a date (`"2026-05-28"`) or a full ISO
 * datetime (`"2026-05-28T16:00:00Z"`). Hour-precision is recommended
 * when several edits ship on the same day so the drawer can sort them
 * by actual edit recency.
 *
 * Badge rules (computed live, no human gardening needed):
 *   NEW      — section's `addedOn` is one of the `NEW_COUNT` most-recent
 *              `addedOn` dates in the dataset, AND the date is strictly
 *              after the launch sentinel (the earliest `addedOn` seen).
 *   UPDATED  — section is NOT currently NEW, AND its `updatedOn` is
 *              one of the `UPDATED_COUNT` most-recent `updatedOn` dates
 *              in the dataset, AND `updatedOn > addedOn` (i.e. an
 *              actual follow-up edit happened — sections that have
 *              never been touched since launch don't qualify).
 *
 * Auto-rotation: each new feature shipped pushes the oldest NEW out of
 * the top-3, and each new edit shipped pushes the oldest UPDATED out
 * of the top-5. No manual unflagging required.
 */
const NEW_COUNT = 3;
const UPDATED_COUNT = 5;

function parseISO(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns { [sectionId]: "new" | "updated" | null } for every entry in
 * the supplied sections list.
 *
 * @param {Array<{id:string, addedOn?:string, updatedOn?:string}>} sections
 * @param {Date} [_now] — accepted for backward-compat with the previous
 *                       time-window implementation. Unused in the
 *                       top-N model (badges are purely relative to the
 *                       dataset, not the wall clock).
 */
export function computeBadges(sections /* , _now */) {
  if (!Array.isArray(sections)) return {};
  const out = {};

  // Launch sentinel — the earliest `addedOn` in the dataset. Sections
  // sharing that exact timestamp are treated as foundational (shipped
  // at platform launch) and are excluded from the NEW set even if they
  // happen to fall within the top-N.
  let earliest = null;
  for (const s of sections) {
    if (!s || !s.id) continue;
    const d = parseISO(s.addedOn);
    if (!d) continue;
    if (!earliest || d < earliest) earliest = d;
  }

  // Pass 1 — pick the top-N most-recent ADDED sections.
  const newRanked = sections
    .filter((s) => s && s.id && parseISO(s.addedOn))
    .filter((s) => !earliest || parseISO(s.addedOn) > earliest)
    .sort((a, b) => parseISO(b.addedOn) - parseISO(a.addedOn))
    .slice(0, NEW_COUNT);
  const newIds = new Set(newRanked.map((s) => s.id));

  // Seed every section with `null` so callers can `if (badges[id])`.
  for (const s of sections) {
    if (s && s.id) out[s.id] = newIds.has(s.id) ? "new" : null;
  }

  // Pass 2 — pick the top-N most-recent UPDATED sections, excluding
  // those already flagged NEW and those that haven't actually been
  // touched since they were added (`updatedOn <= addedOn`).
  const updatedRanked = sections
    .filter((s) => s && s.id && !newIds.has(s.id))
    .filter((s) => {
      const u = parseISO(s.updatedOn);
      const a = parseISO(s.addedOn);
      return u && a && u > a;
    })
    .sort((a, b) => parseISO(b.updatedOn) - parseISO(a.updatedOn))
    .slice(0, UPDATED_COUNT);

  for (const s of updatedRanked) {
    out[s.id] = "updated";
  }

  return out;
}

export const BADGE_CONFIG = { NEW_COUNT, UPDATED_COUNT };
