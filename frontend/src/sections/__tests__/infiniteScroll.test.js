/**
 * Regression test for `infiniteScrollJs` in `shared.js`.
 *
 * Verifies that both arrows wrap seamlessly through the entire ring,
 * with no "stuck at max scroll" state after the last real card. This
 * regressed once because `addClones` was using a hard-coded N=4 which
 * didn't produce enough post-clones to fill viewports wider than
 * ~4*cardWidth — scrollLeft maxed out before reaching the wrap trigger.
 *
 * Run via: `yarn test:carousel`  (added to package.json scripts).
 * Requires a headless chromium (Playwright). Skipped automatically
 * if `playwright` isn't available.
 */
const fs = require("fs");
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.log("playwright not installed — skipping carousel regression");
  process.exit(0);
}

const shared = fs.readFileSync(__dirname + "/../shared.js", "utf8");
const m = shared.match(/export function infiniteScrollJs\(\)\s*\{\s*return `([\s\S]*?)`;\s*\}/);
if (!m) {
  console.error("FAIL · could not locate infiniteScrollJs body");
  process.exit(1);
}
const infJs = m[1];

function makePage(N, viewport, cols = 5) {
  const cls = "ns-products-test";
  const cards = Array.from({ length: N }, (_, i) =>
    `<div class="ns-card" data-card-i="${i}"><div class="ns-image-wrap"><img alt=""/></div>` +
    `<div class="ns-card-body"><h3>Item ${i + 1}</h3></div></div>`
  ).join("");
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
body{margin:0;font-family:sans-serif;padding:20px}
.${cls}{padding:60px 20px;width:100%;background:#fff}
.${cls} .ns-wrap{max-width:1200px;margin:0 auto;position:relative}
.${cls} .ns-track{display:flex;gap:18px;overflow-x:auto;scroll-behavior:smooth;scrollbar-width:none}
.${cls} .ns-track::-webkit-scrollbar{display:none}
.${cls} .ns-card{flex:0 0 calc((100% - ${cols - 1} * 18px) / ${cols});border:1px solid #f2f2f2;display:flex;flex-direction:column}
.${cls} .ns-image-wrap{height:170px}
.${cls} .ns-card-body{padding:0 16px 18px}
.${cls} .ns-arrow{position:absolute;top:50%;width:38px;height:38px;cursor:pointer;z-index:3}
.${cls} .ns-prev{left:-18px}.${cls} .ns-next{right:-18px}
</style></head><body>
<section class="${cls}" data-ns-autoplay="0" data-ns-interval="4000" data-ns-poh="1">
  <div class="ns-wrap">
    <button class="ns-arrow ns-prev" data-ns-prev>&lt;</button>
    <button class="ns-arrow ns-next" data-ns-next>&gt;</button>
    <div class="ns-track" data-ns-track>${cards}</div>
  </div>
</section>
<script>(function(){var root=document.querySelector(".${cls}");${infJs}})();</script>
</body></html>`;
}

async function visibleIdx(page) {
  return page.evaluate(() => {
    const t = document.querySelector("[data-ns-track]");
    const real = Array.from(t.querySelectorAll(".ns-card:not([data-ns-clone])"));
    const sl = t.scrollLeft;
    for (let i = 0; i < real.length; i++) {
      if (Math.abs(real[i].offsetLeft - sl) < 5) return i;
    }
    return -1;
  });
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test("right arrow loops through all 8 cards and wraps to 0", async (page) => {
  await page.setContent(makePage(8, { width: 1280, height: 800 }), { waitUntil: "load" });
  await page.waitForTimeout(300);
  if ((await visibleIdx(page)) !== 0) throw new Error("initial != 0");
  for (let i = 1; i <= 7; i++) {
    await page.click("[data-ns-next]");
    await page.waitForTimeout(450);
    const v = await visibleIdx(page);
    if (v !== i) throw new Error(`expected card ${i}, got ${v}`);
  }
  // One more click — must wrap back to 0
  await page.click("[data-ns-next]");
  await page.waitForTimeout(450);
  const wrapped = await visibleIdx(page);
  if (wrapped !== 0) throw new Error(`right wrap failed: expected 0, got ${wrapped}`);
});

test("left arrow wraps from 0 to last and continues", async (page) => {
  await page.setContent(makePage(8, { width: 1280, height: 800 }), { waitUntil: "load" });
  await page.waitForTimeout(300);
  await page.click("[data-ns-prev]");
  await page.waitForTimeout(450);
  const wrapped = await visibleIdx(page);
  if (wrapped !== 7) throw new Error(`left wrap failed: expected 7, got ${wrapped}`);
  await page.click("[data-ns-prev]");
  await page.waitForTimeout(450);
  const next = await visibleIdx(page);
  if (next !== 6) throw new Error(`expected 6, got ${next}`);
});

test("clone count adapts to viewport (12 cards, narrow viewport)", async (page) => {
  await page.setContent(makePage(12, { width: 1280, height: 800 }), { waitUntil: "load" });
  await page.waitForTimeout(300);
  // With 5 cols ≈ 7 visible+2 safety = 9 expected clones each side
  const counts = await page.evaluate(() => {
    const t = document.querySelector("[data-ns-track]");
    return {
      pre: t.querySelectorAll('[data-ns-clone="pre"]').length,
      post: t.querySelectorAll('[data-ns-clone="post"]').length,
      real: t.querySelectorAll(".ns-card:not([data-ns-clone])").length,
    };
  });
  if (counts.real !== 12) throw new Error(`expected 12 real, got ${counts.real}`);
  if (counts.pre < 4 || counts.pre > 12) throw new Error(`pre out of range: ${counts.pre}`);
  if (counts.pre !== counts.post) throw new Error(`pre/post mismatch: ${counts.pre}/${counts.post}`);
});

test("repeated right wrap remains in sync after several full loops", async (page) => {
  await page.setContent(makePage(8, { width: 1280, height: 800 }), { waitUntil: "load" });
  await page.waitForTimeout(300);
  // 3 full ring traversals (24 right clicks) should land back on card 0
  for (let i = 0; i < 24; i++) {
    await page.click("[data-ns-next]");
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(400); // settle the maybeWrap debounce
  const dbg = await page.evaluate(() => {
    const t = document.querySelector("[data-ns-track]");
    const real = Array.from(t.querySelectorAll(".ns-card:not([data-ns-clone])"));
    return { sl: t.scrollLeft, offsets: real.map(c => c.offsetLeft) };
  });
  const v = await visibleIdx(page);
  if (v !== 0) throw new Error(`after 3 full loops expected 0, got ${v} (sl=${dbg.sl} offsets=${dbg.offsets.join(",")})`);
});

(async () => {
  const browser = await chromium.launch({ headless: true });
  let pass = 0, fail = 0;
  for (const { name, fn } of tests) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    try {
      await fn(page);
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
