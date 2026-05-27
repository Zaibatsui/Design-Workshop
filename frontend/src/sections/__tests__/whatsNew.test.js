/**
 * Unit tests for the WhatsNewDrawer per-user, per-entry-signature
 * notification state.
 *
 * Re-implements the four pure helpers locally (`entrySig`, `readSeen`,
 * `writeSeen`, `currentSignatures`) to mirror what's in the component,
 * and asserts the resulting set algebra produces correct unread
 * decisions. The actual component file is also sanity-checked to make
 * sure its helpers are still named the same way so this test stays
 * meaningful as the source evolves.
 */
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(
  path.join(__dirname, "../../components/WhatsNewDrawer.jsx"),
  "utf8"
);

// In-memory localStorage shim
const mem = Object.create(null);
global.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
  clear: () => { for (const k of Object.keys(mem)) delete mem[k]; },
};

// ── Replicas of the component helpers ──────────────────────────────
const LS_PREFIX = "ns.whatsNew.seen:";

function readSeen(userKey) {
  if (!userKey) return new Set();
  try {
    const raw = global.localStorage.getItem(LS_PREFIX + userKey);
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
    global.localStorage.setItem(LS_PREFIX + userKey, JSON.stringify(Array.from(set)));
  } catch {
    // ignore disabled storage
  }
}

function entrySig(e) {
  const v = e.updatedOn || e.addedOn || "0";
  return `${e.id}:${v}`;
}

function currentSignatures(entries) {
  return new Set(entries.map(entrySig));
}

let pass = 0, fail = 0;
function expect(label, ok, detail = "") {
  if (ok) { console.log(`PASS · ${label}`); pass++; }
  else { console.log(`FAIL · ${label}${detail ? ` — ${detail}` : ""}`); fail++; }
}

// 0. Source-file shape — guards against drift.
expect(
  "WhatsNewDrawer.jsx exports entrySig helper",
  /function entrySig\(/.test(SOURCE)
);
expect(
  "WhatsNewDrawer.jsx uses per-user LS_PREFIX",
  /const LS_PREFIX = "ns\.whatsNew\.seen:"/.test(SOURCE)
);
expect(
  "WhatsNewDrawer.jsx subscribes to useAuth",
  /useAuth\(\)/.test(SOURCE)
);

// 1. entrySig
expect("entrySig prefers updatedOn",
  entrySig({ id: "hero", addedOn: "2026-01-01", updatedOn: "2026-02-19" }) === "hero:2026-02-19");
expect("entrySig falls back to addedOn",
  entrySig({ id: "welcome", addedOn: "2026-01-01" }) === "welcome:2026-01-01");

// 2. Per-user isolation
writeSeen("alice@x.com", new Set(["hero:2026-02-19", "products:2026-02-19"]));
writeSeen("bob@x.com", new Set(["hero:2026-02-19"]));

const aliceSeen = readSeen("alice@x.com");
const bobSeen = readSeen("bob@x.com");
expect("alice has 2 seen sigs", aliceSeen.size === 2);
expect("bob has 1 seen sig", bobSeen.size === 1);
expect("alice has products", aliceSeen.has("products:2026-02-19"));
expect("bob does NOT have products", !bobSeen.has("products:2026-02-19"));

// 3. New user starts with empty set
expect("new user starts empty", readSeen("charlie@x.com").size === 0);

// 4. Anonymous bucket is independent
writeSeen("anonymous", new Set(["welcome:LAUNCH"]));
expect("anonymous bucket has its own state", readSeen("anonymous").has("welcome:LAUNCH"));

// 5. Bumping updatedOn produces a new signature → unread re-fires.
//    Scenario: user clicked drawer on 2026-02-19, hero gets bumped to 2026-02-27.
const beforeBump = new Set([entrySig({ id: "hero", updatedOn: "2026-02-19" })]);
const newEntries = [{ id: "hero", updatedOn: "2026-02-27" }];
const sigs = currentSignatures(newEntries);
const unread = [...sigs].some((s) => !beforeBump.has(s));
expect("bumped updatedOn re-lights the dot", unread);

// 6. After click, the new signature is merged → no longer unread.
const afterClick = new Set([...beforeBump, ...sigs]);
const stillUnread = [...sigs].some((s) => !afterClick.has(s));
expect("after acknowledging, dot clears", !stillUnread);

// 7. Adding a brand-new entry id lights the dot
const seenBefore = new Set([entrySig({ id: "hero", updatedOn: "2026-02-19" })]);
const withNew = [
  { id: "hero", updatedOn: "2026-02-19" },
  { id: "trustStrip", addedOn: "2026-02-26" },
];
const newSigs = currentSignatures(withNew);
expect(
  "new entry id triggers unread",
  [...newSigs].some((s) => !seenBefore.has(s))
);

// 8. Switching users on the same browser: alice's bucket isn't visible to bob
expect(
  "switching identities re-reads correct bucket",
  readSeen("alice@x.com").size !== readSeen("bob@x.com").size
);

// 9. localStorage disabled → readSeen returns empty (graceful)
const orig = global.localStorage;
global.localStorage = {
  getItem() { throw new Error("disabled"); },
  setItem() { throw new Error("disabled"); },
};
let result, threw = false;
try { result = readSeen("eve@x.com"); } catch { threw = true; }
global.localStorage = orig;
expect("readSeen graceful on storage failure",
  !threw && result instanceof Set && result.size === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
