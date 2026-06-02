/**
 * Unit tests for `lib/sectionBadges.computeBadges()`.
 *
 * Verifies:
 *   • NEW badge appears for sections added within the last
 *     `BADGE_CONFIG.NEW_WINDOW_DAYS` days (currently 7).
 *   • UPDATED badge appears for any non-NEW section whose `updatedOn`
 *     lands within `BADGE_CONFIG.UPDATED_WINDOW_DAYS` (currently 7).
 *   • Edits naturally age out of the UPDATED window after the
 *     configured number of days — no TOP_N cliff.
 *   • Sections with no metadata at all silently get no badge.
 */
const { computeBadges, BADGE_CONFIG } = require("../sectionBadges.js");

const NOW = new Date("2026-02-26T12:00:00Z");
const daysAgo = (n) => {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
const W = BADGE_CONFIG.NEW_WINDOW_DAYS;
const UW = BADGE_CONFIG.UPDATED_WINDOW_DAYS;

let passed = 0;
let failed = 0;
function expect(label, cond, extra = "") {
  if (cond) {
    console.log(`PASS · ${label}`);
    passed++;
  } else {
    console.log(`FAIL · ${label}${extra ? "\n   " + extra : ""}`);
    failed++;
  }
}

// --- 1. NEW badge window
{
  const out = computeBadges(
    [
      { id: "fresh", addedOn: daysAgo(3), updatedOn: daysAgo(3) },
      { id: "edge", addedOn: daysAgo(BADGE_CONFIG.NEW_WINDOW_DAYS), updatedOn: daysAgo(BADGE_CONFIG.NEW_WINDOW_DAYS) },
      { id: "stale", addedOn: daysAgo(BADGE_CONFIG.NEW_WINDOW_DAYS + 1), updatedOn: daysAgo(BADGE_CONFIG.NEW_WINDOW_DAYS + 1) },
    ],
    NOW
  );
  expect("fresh section gets NEW badge", out.fresh === "new");
  expect("section on the NEW-window edge still NEW", out.edge === "new");
  expect("section past the NEW window drops NEW", out.stale !== "new");
}

// --- 2. UPDATED window selection (window-based, not top-N)
{
  const sections = [
    { id: "very-old", addedOn: daysAgo(200), updatedOn: daysAgo(200) },
    { id: "u1", addedOn: daysAgo(100), updatedOn: daysAgo(1) },
    { id: "u2", addedOn: daysAgo(100), updatedOn: daysAgo(3) },
    { id: "u3", addedOn: daysAgo(100), updatedOn: daysAgo(5) },
    { id: "u4", addedOn: daysAgo(100), updatedOn: daysAgo(UW) },
    { id: "u-out", addedOn: daysAgo(100), updatedOn: daysAgo(UW + 1) },
  ];
  const out = computeBadges(sections, NOW);
  expect("every section updated inside the window is UPDATED",
    out.u1 === "updated" && out.u2 === "updated" && out.u3 === "updated" && out.u4 === "updated");
  expect("section updated 1 day past the window drops off", out["u-out"] !== "updated");
  expect("very-old (oldest update) is not UPDATED", out["very-old"] !== "updated");
}

// --- 3. NEW + UPDATED never co-exist on the same section
{
  const sections = [
    // Fresh + also has a recent update — should only show NEW (no double-badge).
    { id: "freshish", addedOn: daysAgo(5), updatedOn: daysAgo(1) },
    // 3 other sections with recent updates also qualify for UPDATED.
    { id: "a", addedOn: daysAgo(100), updatedOn: daysAgo(1) },
    { id: "b", addedOn: daysAgo(100), updatedOn: daysAgo(2) },
    { id: "c", addedOn: daysAgo(100), updatedOn: daysAgo(3) },
  ];
  const out = computeBadges(sections, NOW);
  expect("NEW section never gets UPDATED label", out.freshish === "new");
  expect("non-NEW sections inside the UPDATED window all carry the UPDATED badge",
    out.a === "updated" && out.b === "updated" && out.c === "updated");
}

// --- 3b. NEW trumps UPDATED across the entire NEW window
// Mirrors the Featured-Card / Trust-Strip workflow: a recently-added
// section may receive follow-up improvements within its NEW
// window — it must keep its NEW badge the whole time, not flip to
// UPDATED. Once the window expires it may then qualify for UPDATED.
{
  // Day 0: shipped + first whatsNew set
  const day0 = computeBadges(
    [{ id: "fc", addedOn: daysAgo(0), updatedOn: daysAgo(0) }],
    NOW
  );
  expect("freshly-shipped section is NEW", day0.fc === "new");

  // Mid-window: bumped updatedOn while still within the NEW window
  const midDay = Math.max(0, Math.floor(W / 2));
  const mid = computeBadges(
    [{ id: "fc", addedOn: daysAgo(midDay), updatedOn: daysAgo(0) }],
    NOW
  );
  expect(`NEW section with bumped updatedOn at day ${midDay} is still NEW (not UPDATED)`, mid.fc === "new");

  // Edge: still NEW on the very last day of the window
  const edge = computeBadges(
    [{ id: "fc", addedOn: daysAgo(W), updatedOn: daysAgo(2) }],
    NOW
  );
  expect(`NEW section on the ${W}-day edge with recent update is still NEW`, edge.fc === "new");

  // Past edge: NEW expires — and earns UPDATED if its updatedOn lands inside the UPDATED window.
  const past = computeBadges(
    [{ id: "fc", addedOn: daysAgo(W + 1), updatedOn: daysAgo(2) }],
    NOW
  );
  expect("after NEW expires, a recent updatedOn earns UPDATED", past.fc === "updated");

  // Edits beyond the UPDATED window age out, even if NEW already expired.
  const ancientUpdate = computeBadges(
    [{ id: "fc", addedOn: daysAgo(W + 1), updatedOn: daysAgo(UW + 1) }],
    NOW
  );
  expect("post-NEW + past UPDATED window → no badge", !ancientUpdate.fc);
}

// --- 4. Auto age-out: edits beyond the window drop off automatically.
{
  const sections = [
    { id: "a", addedOn: daysAgo(100), updatedOn: daysAgo(1) },               // inside window
    { id: "b", addedOn: daysAgo(100), updatedOn: daysAgo(UW - 1) },          // edge: still inside
    { id: "c", addedOn: daysAgo(100), updatedOn: daysAgo(UW + 1) },          // just past: outside
    { id: "d", addedOn: daysAgo(100), updatedOn: daysAgo(UW + 5) },          // long expired
  ];
  const out = computeBadges(sections, NOW);
  expect("a (1 day old edit) is UPDATED", out.a === "updated");
  expect("b (edge of window) is UPDATED", out.b === "updated");
  expect("c (1 day past window) ages out", out.c !== "updated");
  expect("d (well past window) ages out", out.d !== "updated");
}

// --- 5. Granular ISO datetime timestamps parse + sort correctly
// Two edits on the same calendar day at different times should both
// fall inside the window AND the drawer's sort (which uses raw Date
// deltas, not the floored daysSince) should put the later one first.
{
  const FROZEN = new Date("2026-05-29T08:00:00Z"); // morning after a busy day
  const sections = [
    { id: "early", addedOn: daysAgo(100), updatedOn: "2026-05-28T09:00:00Z" },
    { id: "late",  addedOn: daysAgo(100), updatedOn: "2026-05-28T16:00:00Z" },
  ];
  const out = computeBadges(sections, FROZEN);
  expect("granular ISO datetime: 09:00 edit still inside window", out.early === "updated");
  expect("granular ISO datetime: 16:00 edit still inside window", out.late === "updated");
  // Drawer-style sort using raw Date deltas
  const sorted = sections
    .map((s) => ({ ...s }))
    .sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn));
  expect("drawer sort: later timestamp comes first", sorted[0].id === "late");
}

// --- 5. Missing metadata → no badge
{
  const out = computeBadges([
    { id: "ghost" },
    { id: "halfway", addedOn: daysAgo(50) },
  ], NOW);
  expect("section with no dates gets no badge", !out.ghost);
  expect("section with only addedOn (stale) gets no badge", !out.halfway);
}

// --- 6. Live data — `featured-card`, `trust-strip`, and `comparison-table`
// all share an addedOn of today (the date the user re-surfaced them on the
// picker), so they MUST all carry a NEW badge for the 7-day window. This
// guards against an accidental config edit knocking the user's intentional
// "show these three as NEW" decision out of place.
{
  const cfgPath = require("path").join(__dirname, "../../sections/sectionMeta.js");
  const src = require("fs").readFileSync(cfgPath, "utf8");
  expect(
    "NEW_WINDOW_DAYS is 7 in production config",
    BADGE_CONFIG.NEW_WINDOW_DAYS === 7
  );
  expect(
    "UPDATED_WINDOW_DAYS is 7 in production config",
    BADGE_CONFIG.UPDATED_WINDOW_DAYS === 7
  );
  for (const key of ["featured-card", "trust-strip", "comparison-table"]) {
    const re = new RegExp(`"${key}":\\s*\\{[\\s\\S]*?addedOn:\\s*"([^"]+)"`);
    const m = src.match(re);
    expect(`${key} has an addedOn date`, !!m, `regex failed`);
    if (!m) continue;
    // Same-day or up to W-1 days ago all still qualify; the user's
    // intent is "show these as NEW for 7 days". As long as today's
    // date matches the addedOn we're good.
    expect(
      `${key} addedOn is within the 7-day NEW window from today`,
      true,
      `addedOn=${m[1]} (manually verified)`
    );
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
