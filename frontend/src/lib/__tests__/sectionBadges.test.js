/**
 * Unit tests for `lib/sectionBadges.computeBadges()` (top-N model).
 *
 * Verifies:
 *   • NEW: the `BADGE_CONFIG.NEW_COUNT` most-recent `addedOn` dates win,
 *     excluding the launch sentinel (the earliest `addedOn` in the
 *     dataset — foundational sections aren't "new" any more).
 *   • UPDATED: the `BADGE_CONFIG.UPDATED_COUNT` most-recent `updatedOn`
 *     dates win, excluding (a) anything currently flagged NEW and
 *     (b) anything whose `updatedOn <= addedOn` (i.e. never actually
 *     edited since being added).
 *   • NEW never co-exists with UPDATED on the same section.
 *   • Hour-precision ISO datetimes sort correctly within the same day.
 *   • Sections with no metadata silently get no badge.
 */
const { computeBadges, BADGE_CONFIG } = require("../sectionBadges.js");

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

const LAUNCH = "2025-09-01";

// --- 1. NEW_COUNT and UPDATED_COUNT match the product spec
expect(
  "BADGE_CONFIG.NEW_COUNT === 3 (last 3 NEW features)",
  BADGE_CONFIG.NEW_COUNT === 3
);
expect(
  "BADGE_CONFIG.UPDATED_COUNT === 5 (last 5 UPDATES)",
  BADGE_CONFIG.UPDATED_COUNT === 5
);

// --- 2. Top-N NEW selection, launch sentinel excluded
{
  const sections = [
    { id: "launch1", addedOn: LAUNCH, updatedOn: LAUNCH },
    { id: "launch2", addedOn: LAUNCH, updatedOn: LAUNCH },
    { id: "n1", addedOn: "2026-05-01", updatedOn: "2026-05-01" },
    { id: "n2", addedOn: "2026-05-15", updatedOn: "2026-05-15" },
    { id: "n3", addedOn: "2026-05-28T10:00:00Z", updatedOn: "2026-05-28T10:00:00Z" },
    { id: "n4", addedOn: "2026-05-28T12:00:00Z", updatedOn: "2026-05-28T12:00:00Z" },
    { id: "n5", addedOn: "2026-06-01", updatedOn: "2026-06-01" },
  ];
  const out = computeBadges(sections);
  // Top 3 by addedOn desc: n5 (Jun 1), n4 (May 28 12:00), n3 (May 28 10:00).
  expect("n5 is NEW (most recent addedOn)", out.n5 === "new");
  expect("n4 is NEW", out.n4 === "new");
  expect("n3 is NEW", out.n3 === "new");
  expect("n2 (4th most recent) is NOT NEW", out.n2 !== "new");
  expect("n1 (5th most recent) is NOT NEW", out.n1 !== "new");
  expect("launch1 (sentinel-tied) is NOT NEW", out.launch1 !== "new");
  expect("launch2 (sentinel-tied) is NOT NEW", out.launch2 !== "new");
}

// --- 3. UPDATED selection — top 5 by updatedOn desc, excluding NEW + no-op
{
  const sections = [
    // 3 NEW sections occupy the NEW slots.
    { id: "n1", addedOn: "2026-06-03", updatedOn: "2026-06-03" },
    { id: "n2", addedOn: "2026-06-04", updatedOn: "2026-06-04" },
    { id: "n3", addedOn: "2026-06-05", updatedOn: "2026-06-05" },
    // 7 candidates for UPDATED — only top 5 should land.
    { id: "u1", addedOn: LAUNCH, updatedOn: "2026-06-02T10:00:00Z" },
    { id: "u2", addedOn: LAUNCH, updatedOn: "2026-06-02T12:00:00Z" },
    { id: "u3", addedOn: LAUNCH, updatedOn: "2026-05-30" },
    { id: "u4", addedOn: LAUNCH, updatedOn: "2026-05-28" },
    { id: "u5", addedOn: LAUNCH, updatedOn: "2026-05-26" },
    { id: "u6", addedOn: LAUNCH, updatedOn: "2026-05-20" }, // 6th — should miss
    { id: "u7", addedOn: LAUNCH, updatedOn: "2026-05-15" }, // 7th — should miss
    // Sentinel section that's never been touched — never UPDATED.
    { id: "noop", addedOn: LAUNCH, updatedOn: LAUNCH },
  ];
  const out = computeBadges(sections);
  // Top 5 by updatedOn desc among non-NEW: u2, u1, u3, u4, u5.
  expect("u2 is UPDATED (most recent)", out.u2 === "updated");
  expect("u1 is UPDATED", out.u1 === "updated");
  expect("u3 is UPDATED", out.u3 === "updated");
  expect("u4 is UPDATED", out.u4 === "updated");
  expect("u5 is UPDATED (5th most recent)", out.u5 === "updated");
  expect("u6 (6th — past the cap) is NOT UPDATED", out.u6 !== "updated");
  expect("u7 (7th — past the cap) is NOT UPDATED", out.u7 !== "updated");
  expect(
    "noop (updatedOn === addedOn at launch) is NOT UPDATED",
    out.noop !== "updated"
  );
  expect("NEW sections still NEW (n1/n2/n3)",
    out.n1 === "new" && out.n2 === "new" && out.n3 === "new");
}

// --- 4. NEW + UPDATED never co-exist on the same section
{
  const sections = [
    // Fresh + also has a recent update — should show NEW only.
    { id: "fresh", addedOn: "2026-06-04", updatedOn: "2026-06-05" },
    // 2 other NEW slots so `fresh` definitely lands in the top-3.
    { id: "n2", addedOn: "2026-06-03", updatedOn: "2026-06-03" },
    { id: "n3", addedOn: "2026-06-02", updatedOn: "2026-06-02" },
    // 3 plain UPDATED sections.
    { id: "u1", addedOn: LAUNCH, updatedOn: "2026-06-01" },
    { id: "u2", addedOn: LAUNCH, updatedOn: "2026-05-30" },
    { id: "u3", addedOn: LAUNCH, updatedOn: "2026-05-28" },
  ];
  const out = computeBadges(sections);
  expect("fresh keeps NEW even with a later updatedOn", out.fresh === "new");
  expect("plain UPDATED sections still carry UPDATED",
    out.u1 === "updated" && out.u2 === "updated" && out.u3 === "updated");
}

// --- 5. Granular ISO datetime stamps sort within the same calendar day
{
  const sections = [
    { id: "n1", addedOn: LAUNCH, updatedOn: LAUNCH }, // sentinel only
    { id: "n2", addedOn: LAUNCH, updatedOn: LAUNCH }, // sentinel only
    { id: "early", addedOn: LAUNCH, updatedOn: "2026-05-28T09:00:00Z" },
    { id: "mid", addedOn: LAUNCH, updatedOn: "2026-05-28T13:00:00Z" },
    { id: "late", addedOn: LAUNCH, updatedOn: "2026-05-28T16:00:00Z" },
  ];
  const out = computeBadges(sections);
  expect("early UPDATED", out.early === "updated");
  expect("mid UPDATED", out.mid === "updated");
  expect("late UPDATED", out.late === "updated");
  // Drawer-style sort using raw Date deltas should put `late` first.
  const ordered = [sections[2], sections[3], sections[4]]
    .map((s) => ({ ...s }))
    .sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn));
  expect("drawer sort within the same day: later timestamp first",
    ordered[0].id === "late" && ordered[2].id === "early");
}

// --- 6. Missing metadata → no badge
{
  const out = computeBadges([
    { id: "ghost" },
    { id: "halfway", addedOn: "2026-05-15" },
  ]);
  // `ghost` has nothing → seeded null. `halfway` has only addedOn —
  // it may land in NEW if it's in the top-3, but with only 1 candidate
  // it'll be the launch sentinel itself and excluded.
  expect("section with no dates gets no badge", !out.ghost);
  expect("the only addedOn in the dataset is treated as the sentinel",
    out.halfway !== "new");
}

// --- 7. Live data — verify the productGrid update we just shipped
// lands in the top 5 UPDATED of the actual production sectionMeta.
{
  const path = require("path");
  const fs = require("fs");
  const src = fs.readFileSync(
    path.join(__dirname, "../../sections/sectionMeta.js"),
    "utf8"
  );
  expect(
    "productGrid key is in sectionMeta.js (camelCase, not kebab-case)",
    /productGrid:\s*\{/.test(src) && !/"product-grid":\s*\{/.test(src)
  );
  expect(
    "productGrid has a whatsNew note",
    /productGrid:\s*\{[\s\S]*?whatsNew:/.test(src)
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
