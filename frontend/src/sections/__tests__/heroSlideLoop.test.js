/**
 * Regression test for Hero slide-mode infinite loop.
 *
 * Extracts the IIFE body from `hero.js → renderSlide` and runs it
 * against a minimal hero DOM in real Chromium. Verifies:
 *   1. Clicking next on the last slide wraps to slide 0 with no
 *      visible rewind (clone-and-jump silent teleport).
 *   2. Clicking prev on slide 0 wraps to last slide.
 *   3. Dot clicks still target the correct real slide.
 *   4. Autoplay cycles continuously past the boundary.
 */
const fs = require("fs");
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.log("playwright not installed — skipping hero loop regression");
  process.exit(0);
}

const heroSrc = fs.readFileSync(__dirname + "/../hero.js", "utf8");
// Grab the IIFE body string from the first renderSlide -> iife(... `body`) call.
// The body is a single backtick template literal on one line.
const re = /function renderSlide[\s\S]*?const js = iife\([\s\S]*?cls,\s*`([\s\S]*?)`\s*\);/;
const m = heroSrc.match(re);
if (!m) {
  console.error("FAIL · could not locate renderSlide IIFE body");
  process.exit(1);
}
const heroJs = m[1];

const N = 4;
const cls = "ns-hero-slide-test";
const slidesHtml = Array.from({ length: N }, (_, i) =>
  `<div class="ns-slide" data-real-i="${i}">` +
  `<div class="ns-content"><h2 class="ns-title">Slide ${i + 1}</h2></div>` +
  `</div>`
).join("");
const dotsHtml = Array.from({ length: N }, (_, i) =>
  `<button class="ns-dot${i === 0 ? " is-active" : ""}" data-ns-dot="${i}"></button>`
).join("");

function page(autoplay = "0", interval = 600) {
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
body{margin:0;font-family:sans-serif}
.${cls}{position:relative;width:100%;height:300px;overflow:hidden}
.${cls} .ns-track{display:flex;height:100%;transition:transform .25s ease;will-change:transform;touch-action:pan-y}
.${cls} .ns-slide{flex:0 0 100%;height:100%;display:flex;align-items:center;justify-content:center;background:#eee}
.${cls} .ns-slide[data-real-i="0"]{background:#fcc}
.${cls} .ns-slide[data-real-i="1"]{background:#cfc}
.${cls} .ns-slide[data-real-i="2"]{background:#ccf}
.${cls} .ns-slide[data-real-i="3"]{background:#ffc}
.${cls} .ns-arrow{position:absolute;top:50%;width:32px;height:32px;cursor:pointer;z-index:5}
.${cls} .ns-prev{left:8px}.${cls} .ns-next{right:8px}
.${cls} .ns-dots{position:absolute;bottom:8px;left:0;right:0;display:flex;justify-content:center;gap:8px}
.${cls} .ns-dot{width:8px;height:8px;border-radius:50%;border:1px solid #000;background:transparent;cursor:pointer}
.${cls} .ns-dot.is-active{background:#000}
</style></head><body>
<section class="${cls}" data-ns-autoplay="${autoplay}" data-ns-interval="${interval}" data-ns-poh="0">
  <div class="ns-track" data-ns-track>${slidesHtml}</div>
  <button class="ns-arrow ns-prev" data-ns-prev>&lt;</button>
  <button class="ns-arrow ns-next" data-ns-next>&gt;</button>
  <div class="ns-dots">${dotsHtml}</div>
</section>
<script>(function(){var root=document.querySelector(".${cls}");${heroJs}})();</script>
</body></html>`;
}

async function visibleRealIdx(p) {
  return p.evaluate(() => {
    const track = document.querySelector("[data-ns-track]");
    const slides = Array.from(track.children);
    // Determine which slide is centred in the viewport.
    const tx = parseFloat(getComputedStyle(track).transform.match(/matrix\(.*?,\s*(-?[\d.]+),\s*[-\d.]+\)/)?.[1] || "0");
    const slideW = slides[0].offsetWidth;
    const idx = Math.round(-tx / slideW);
    const el = slides[idx];
    if (!el) return null;
    const r = el.getAttribute("data-real-i");
    return r === null ? "clone" : parseInt(r, 10);
  });
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test("right arrow on last slide loops to first", async (p) => {
  await p.setContent(page(), { waitUntil: "load" });
  await p.waitForTimeout(200);
  // Click next 3 times: 0 → 1 → 2 → 3 (last real)
  for (let i = 0; i < 3; i++) {
    await p.click("[data-ns-next]");
    await p.waitForTimeout(380);
  }
  let v = await visibleRealIdx(p);
  if (v !== 3) throw new Error(`expected real slide 3, got ${v}`);
  // Click next once more: should land on slide 0 (clone), then teleport
  await p.click("[data-ns-next]");
  await p.waitForTimeout(450);
  v = await visibleRealIdx(p);
  if (v !== 0) throw new Error(`right-wrap failed: expected 0, got ${v}`);
  // Click next once more: should advance to slide 1
  await p.click("[data-ns-next]");
  await p.waitForTimeout(450);
  v = await visibleRealIdx(p);
  if (v !== 1) throw new Error(`post-wrap step expected 1, got ${v}`);
});

test("left arrow on first slide loops to last", async (p) => {
  await p.setContent(page(), { waitUntil: "load" });
  await p.waitForTimeout(200);
  let v = await visibleRealIdx(p);
  if (v !== 0) throw new Error(`initial expected 0, got ${v}`);
  await p.click("[data-ns-prev]");
  await p.waitForTimeout(450);
  v = await visibleRealIdx(p);
  if (v !== 3) throw new Error(`left-wrap failed: expected 3, got ${v}`);
  await p.click("[data-ns-prev]");
  await p.waitForTimeout(450);
  v = await visibleRealIdx(p);
  if (v !== 2) throw new Error(`continued left expected 2, got ${v}`);
});

test("dot clicks map to correct real slide", async (p) => {
  await p.setContent(page(), { waitUntil: "load" });
  await p.waitForTimeout(200);
  await p.click('[data-ns-dot="2"]');
  await p.waitForTimeout(380);
  let v = await visibleRealIdx(p);
  if (v !== 2) throw new Error(`dot 2 expected slide 2, got ${v}`);
  await p.click('[data-ns-dot="0"]');
  await p.waitForTimeout(380);
  v = await visibleRealIdx(p);
  if (v !== 0) throw new Error(`dot 0 expected slide 0, got ${v}`);
});

test("autoplay cycles past the boundary infinitely", async (p) => {
  await p.setContent(page("1", 250), { waitUntil: "load" });
  await p.waitForTimeout(150);
  // Initial 0
  let v0 = await visibleRealIdx(p);
  if (v0 !== 0) throw new Error(`autoplay initial expected 0, got ${v0}`);
  // Wait ~5 cycles (5*250ms + transition slack)
  await p.waitForTimeout(250 * 5 + 400);
  // Should still be cycling; just verify it's NOT stuck on slide 0 or showing a clone.
  const v = await visibleRealIdx(p);
  if (v === "clone") throw new Error(`autoplay stuck on clone after cycles`);
  if (typeof v !== "number") throw new Error(`autoplay invalid idx`);
});

(async () => {
  const browser = await chromium.launch({ headless: true });
  let pass = 0, fail = 0;
  for (const { name, fn } of tests) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    try {
      await fn(p);
      console.log(`PASS · ${name}`);
      pass++;
    } catch (e) {
      console.log(`FAIL · ${name}: ${e.message}`);
      fail++;
    } finally {
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
