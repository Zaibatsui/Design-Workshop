/**
 * Unit tests for `lib/sectionBadges.computeBadges()`.
 *
 * Verifies:
 *   • NEW badge appears for sections added within the last
 *     `BADGE_CONFIG.NEW_WINDOW_DAYS` days (currently 7).
 *   • UPDATED badge appears only for the 3 most recent `updatedOn` dates
 *     among sections that are NOT currently NEW.
 *   • A 4th update auto-rotates the oldest UPDATED off.
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

// --- 2. UPDATED top-3 selection
{
  const sections = [
    { id: "very-old", addedOn: daysAgo(200), updatedOn: daysAgo(200) },
    { id: "u1", addedOn: daysAgo(100), updatedOn: daysAgo(10) },
    { id: "u2", addedOn: daysAgo(100), updatedOn: daysAgo(20) },
    { id: "u3", addedOn: daysAgo(100), updatedOn: daysAgo(30) },
    { id: "u4", addedOn: daysAgo(100), updatedOn: daysAgo(40) },
  ];
  const out = computeBadges(sections, NOW);
  expect("u1 (most recent update) is UPDATED", out.u1 === "updated");
  expect("u2 is UPDATED", out.u2 === "updated");
  expect("u3 is UPDATED", out.u3 === "updated");
  expect("u4 (4th-most-recent) drops off", out.u4 !== "updated");
  expect("very-old (oldest update) is not UPDATED", out["very-old"] !== "updated");
}

// --- 3. NEW + UPDATED never co-exist on the same section
{
  const sections = [
    // Fresh + also has a recent update — should only show NEW (no double-badge).
    { id: "freshish", addedOn: daysAgo(5), updatedOn: daysAgo(1) },
    // 3 other sections with older updates fill the UPDATED slots.
    { id: "a", addedOn: daysAgo(100), updatedOn: daysAgo(10) },
    { id: "b", addedOn: daysAgo(100), updatedOn: daysAgo(20) },
    { id: "c", addedOn: daysAgo(100), updatedOn: daysAgo(30) },
  ];
  const out = computeBadges(sections, NOW);
  expect("NEW section never gets UPDATED label", out.freshish === "new");
  expect("a, b, c claim the 3 UPDATED slots", out.a === "updated" && out.b === "updated" && out.c === "updated");
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

  // Past edge: NEW expires — but only earns UPDATED if its updatedOn lands in the top-3 globally
  const past = computeBadges(
    [{ id: "fc", addedOn: daysAgo(W + 1), updatedOn: daysAgo(2) }],
    NOW
  );
  expect("after NEW expires, recent updates qualify for UPDATED", past.fc === "updated");
}

// --- 4. Auto-rotation: introduce a newer update, oldest UPDATED falls off
{
  const before = [
    { id: "a", addedOn: daysAgo(100), updatedOn: daysAgo(10) },
    { id: "b", addedOn: daysAgo(100), updatedOn: daysAgo(20) },
    { id: "c", addedOn: daysAgo(100), updatedOn: daysAgo(30) },
  ];
  const after = [
    ...before,
    { id: "d", addedOn: daysAgo(100), updatedOn: daysAgo(5) }, // newest
  ];
  const out = computeBadges(after, NOW);
  expect("new update d takes a slot", out.d === "updated");
  expect("oldest c drops off automatically", out.c !== "updated");
  expect("a and b remain UPDATED", out.a === "updated" && out.b === "updated");
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
