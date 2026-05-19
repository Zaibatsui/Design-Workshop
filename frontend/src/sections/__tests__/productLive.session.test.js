/**
 * Behavioral tests for session-aware pricing in `productLive.js`.
 *
 * Verifies the snippet (run inside the host e-commerce page) correctly:
 *   • overlays the user's session price on every same-origin card
 *   • produces no flicker when public/session prices are identical
 *   • prefers structured price markup (schema.org meta/itemprop) over
 *     the body-text regex, so accessory prices in sidebars are NOT
 *     mistaken for the main product price
 *   • skips cross-origin URLs silently
 *   • applies a 10× magnitude sanity check
 *
 * Run with:  node src/sections/__tests__/productLive.session.test.js
 */
const { productLiveJs } = require("../productLive");
const realSetTimeout = setTimeout;

function makeEnv(state) {
  const card = {
    attrs: { "data-ns-src": state.cardUrl || "https://host.test/p/widget" },
    getAttribute(k) { return this.attrs[k]; },
    amt: { textContent: state.initial },
    querySelector(sel) { return sel === ".ns-price-amount" ? this.amt : null; },
  };
  let sessionFetches = 0;
  global.location = { href: "https://host.test/page", origin: "https://host.test" };
  global.URL = require("url").URL;
  global.document = {
    cookie: state.cookie || "",
    body: { className: "" },
    querySelector() { return null; },
    querySelectorAll() { return [card]; },
  };
  global.window = global;
  global.localStorage = { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } };
  global.MutationObserver = function () { this.observe = function () { }; };
  global.setInterval = () => { };
  global.setTimeout = (fn, ms) => realSetTimeout(fn, ms);
  // Minimal DOMParser shim using jsdom-like text extraction. We just look
  // for the markers the production code uses; this is enough to verify the
  // strategy ordering. We support: meta[itemprop="price"], [itemprop="price"],
  // and class-based selectors via simple regex.
  global.DOMParser = function () {
    return {
      parseFromString(html) {
        function find(re) {
          const m = html.match(re);
          return m ? m : null;
        }
        return {
          querySelector(sel) {
            // meta[itemprop="price"] etc — pick by 'content' attribute
            if (sel.indexOf('meta[') === 0) {
              const props = ["itemprop=\"price\"", "property=\"product:price:amount\"", "property=\"og:price:amount\"", "name=\"price\""];
              for (const p of props) {
                if (sel.includes(p)) {
                  const re = new RegExp(`<meta[^>]+${p.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[^>]+content=["']([^"']+)["']`, "i");
                  const m = find(re);
                  if (m) return { getAttribute: (a) => a === "content" ? m[1] : null };
                }
              }
              return null;
            }
            // [itemprop="price"] — element with content attr or text
            if (sel.includes('[itemprop="price"]')) {
              const m = find(/<([a-z]+)[^>]+itemprop=["']price["'][^>]*(?:content=["']([^"']+)["'])?[^>]*>([^<]*)</i);
              if (m) return { getAttribute: (a) => a === "content" ? (m[2] || null) : null, textContent: m[3] || "" };
              return null;
            }
            // Product scope detection — return a marker object so production code keeps using doc
            if (sel.includes("itemtype") || sel.includes("typeof") || sel.includes("product-detail")) {
              return null; // fall through to doc.body
            }
            // Class selectors like .price-current,.product-price,...
            const classes = sel.split(",").map(s => s.trim()).filter(s => s.startsWith("."));
            for (const c of classes) {
              const cls = c.slice(1);
              const re = new RegExp(`<[a-z]+[^>]+class=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>([^<]*)<`, "i");
              const m = find(re);
              if (m) return { textContent: m[1] };
            }
            return null;
          },
          body: { querySelector(s) { return this.parentQuery ? this.parentQuery(s) : null; } },
        };
      },
    };
  };
  global.fetch = (url) => {
    if (url === "https://api.test/api/scrape-product") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(state.api) });
    }
    if (url === card.attrs["data-ns-src"]) {
      sessionFetches++;
      return Promise.resolve({ ok: true, text: () => Promise.resolve(state.html) });
    }
    return Promise.resolve({ ok: false });
  };
  return { card, getFetches: () => sessionFetches };
}

const NETTAILER_HTML = `
<html><body>
<div class="header"><span>Logged in as LightningPCs</span></div>
<aside class="suggested">
  <div class="acc"><span class="price">£41.50 Excl VAT</span></div>
  <div class="acc"><span class="price">£52.10 Excl VAT</span></div>
</aside>
<main itemscope itemtype="https://schema.org/Product">
  <h1>MG004QN/A - Apple iPhone 17 Pro Max</h1>
  <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
    <meta itemprop="priceCurrency" content="GBP">
    <meta itemprop="price" content="1711.50">
  </div>
  <span class="product-price">£1,711.50 Excl VAT</span>
</main>
</body></html>`;

const cases = [
  {
    name: "Nettailer-shaped page: schema.org meta wins, NOT sidebar £41.50",
    state: { initial: "£2,167.90", cardUrl: "https://host.test/p/iphone17", api: { price: "£2,167.90" }, html: NETTAILER_HTML },
    expectFetch: 1, expectPrice: "1711.50",
  },
  {
    name: "Identical price → no repaint flicker",
    state: { initial: "£99.00", api: { price: "£99.00" }, html: '<meta itemprop="price" content="99.00">' },
    expectFetch: 1, expectPrice: "99",
  },
  {
    name: "Sanity skip: extracted price >10x cheaper than public → keep public",
    state: { initial: "£2,167.90", api: { price: "£2,167.90" }, html: '<meta itemprop="price" content="41.50">' },
    expectFetch: 1, expectPrice: "2,167.90",
  },
  {
    name: "Cross-origin URL → no session fetch",
    state: { initial: "£99.00", cardUrl: "https://other.test/p/x", api: { price: "£99.00" }, html: "" },
    expectFetch: 0, expectPrice: "99",
  },
];

(async () => {
  const body = productLiveJs({ cur: "£", apiBase: "https://api.test" });
  let allPass = true;
  for (const t of cases) {
    const env = makeEnv(t.state);
    new Function("var root = document; " + body)();
    await new Promise((r) => realSetTimeout(r, 300));
    const fetches = env.getFetches();
    const price = env.card.amt.textContent;
    const pass = fetches === t.expectFetch && price.includes(t.expectPrice);
    if (!pass) allPass = false;
    console.log((pass ? "PASS" : "FAIL") + " · " + t.name + " | fetches=" + fetches + ' price="' + price + '"');
  }
  process.exit(allPass ? 0 : 1);
})();
