/**
 * Behavioral tests for session-aware pricing in `productLive.js`.
 *
 * Uses jsdom for a faithful DOMParser implementation. Each scenario
 * may define one or more product cards (with individual URLs, initial
 * text, API responses, and HTML payloads) so we can verify multi-card
 * behaviours like the gate-phrase harmoniser.
 *
 * Run with:  node src/sections/__tests__/productLive.session.test.js
 */
const { JSDOM } = require("jsdom");
const { productLiveJs } = require("../productLive");
const realSetTimeout = setTimeout;

function makeCard(cardSpec) {
  const amtAttrs = {};
  const amt = {
    textContent: cardSpec.initial,
    setAttribute(k, v) { amtAttrs[k] = v; },
    removeAttribute(k) { delete amtAttrs[k]; },
    getAttribute(k) { return amtAttrs[k] || null; },
  };
  const card = {
    attrs: { "data-ns-src": cardSpec.url },
    getAttribute(k) { return this.attrs[k] || null; },
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    amt,
    querySelector(sel) { return sel === ".ns-price-amount" ? this.amt : null; },
  };
  return card;
}

function makeEnv(scenario) {
  const cards = scenario.cards.map(makeCard);
  let sessionFetches = 0;
  global.location = { href: "https://host.test/page", origin: "https://host.test" };
  global.URL = require("url").URL;
  const hostDom = new JSDOM("<html><head></head><body></body></html>", { url: "https://host.test/page" });
  global.document = hostDom.window.document;
  global.DOMParser = hostDom.window.DOMParser;
  global.window = hostDom.window;
  const root = { querySelectorAll() { return cards; } };
  global.localStorage = { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } };
  global.MutationObserver = function () { this.observe = function () { }; };
  global.setInterval = () => { };
  global.setTimeout = (fn, ms) => realSetTimeout(fn, ms);
  global.fetch = (url) => {
    if (url === "https://api.test/api/scrape-product") {
      // We need to know which card we're fetching for — but the fetch
      // signature only carries the URL in the body. Re-derive from the
      // pending fetch by reading the body in a closure. Instead, return
      // the api response for the FIRST card whose response is still
      // pending; simpler: tag by passing through to the call site.
      // Since each card calls fetchOne separately, we serve them via a
      // queue keyed on call order.
      const idx = apiQ.shift();
      const c = scenario.cards[idx];
      return Promise.resolve({ ok: true, json: () => Promise.resolve(c.api) });
    }
    for (let i = 0; i < scenario.cards.length; i++) {
      if (url === scenario.cards[i].url) {
        sessionFetches++;
        return Promise.resolve({ ok: true, text: () => Promise.resolve(scenario.cards[i].html || "") });
      }
    }
    return Promise.resolve({ ok: false });
  };
  // apiQ tracks the order of fetchOne API calls (one per card on boot).
  const apiQ = scenario.cards.map((_, i) => i);
  return { cards, root, getFetches: () => sessionFetches };
}

// Single-card legacy fixtures still supported via `cards: [{...}]`.

const NETTAILER_HTML_LOGGED_IN = `
<html><body>
<header class="topbar">
  <div class="basket-total"><span class="price">£0.00 Excl VAT</span></div>
  <span class="user">Logged in as LightningPCs</span>
</header>
<aside class="suggested">
  <div class="acc"><span class="price">£41.50 Excl VAT</span></div>
</aside>
<main class="product-detail" itemscope itemtype="https://schema.org/Product">
  <h1>iPhone 17 Pro Max</h1>
  <div itemprop="offers"><meta itemprop="price" content="1711.50"></div>
</main>
</body></html>`;

const NETTAILER_HTML_PUBLIC = NETTAILER_HTML_LOGGED_IN.replace("1711.50", "2167.90");
const NETTAILER_HTML_GATED_ANON = `<html><body><main itemscope itemtype="https://schema.org/Product"><span>Log in for price</span></main></body></html>`;

const cases = [
  {
    name: "Single same-origin: schema.org meta wins (logged-in flow)",
    cards: [{ url: "https://host.test/p/iphone17", initial: "£2,167.90", api: { price: "£2,167.90" }, html: NETTAILER_HTML_LOGGED_IN }],
    expectFetch: 1,
    expectPrices: ["1711.50"],
  },
  {
    name: "Single same-origin: logged-out → no override, no flicker",
    cards: [{ url: "https://host.test/p/iphone17", initial: "£2,167.90", api: { price: "£2,167.90" }, html: NETTAILER_HTML_PUBLIC }],
    expectFetch: 1,
    expectPrices: ["2167.90"],
  },
  {
    name: "Cross-origin: no session fetch",
    cards: [{ url: "https://other.test/p/x", initial: "£99.00", api: { price: "£99.00" }, html: "" }],
    expectFetch: 0,
    expectPrices: ["99"],
  },
  {
    name: "Harmoniser: editor-time stale price next to gated card → both gated on boot",
    cards: [
      // Card A has a stale baked-in real price; card B is gated. Both same-origin.
      // The API returns gate phrase for both (host now gates all). Harmoniser
      // should propagate "Log in for price" to card A on boot/after API.
      { url: "https://host.test/p/a", initial: "£2,167.90", api: { price: "Log in for price" }, html: NETTAILER_HTML_GATED_ANON },
      { url: "https://host.test/p/b", initial: "Log in for price", api: { price: "Log in for price" }, html: NETTAILER_HTML_GATED_ANON },
    ],
    expectFetch: 2,
    expectPrices: ["Log in for price", "Log in for price"],
  },
  {
    name: "Harmoniser: logged-in customer sees real price on every card, no gate phrase",
    cards: [
      { url: "https://host.test/p/a", initial: "Log in for price", api: { price: "Log in for price" }, html: NETTAILER_HTML_LOGGED_IN },
      { url: "https://host.test/p/b", initial: "Log in for price", api: { price: "Log in for price" }, html: NETTAILER_HTML_LOGGED_IN.replace("1711.50", "899.00") },
    ],
    expectFetch: 2,
    expectPrices: ["1711.50", "899.00"],
  },
  {
    name: "Harmoniser: mixed — one card session-painted, one card gated → painted card keeps real price, other gated",
    cards: [
      // Card A: same-origin, session fetch returns valid price → painted.
      { url: "https://host.test/p/a", initial: "£500.00", api: { price: "£500.00" }, html: NETTAILER_HTML_LOGGED_IN },
      // Card B: same-origin, session fetch returns gated anon HTML → no paint.
      //   But fetchOne returns a real price for B. Then if any card's text
      //   is a gate phrase, it propagates. Since neither card ends up with a
      //   gate phrase here, both keep their real prices.
      { url: "https://host.test/p/b", initial: "£300.00", api: { price: "£300.00" }, html: NETTAILER_HTML_GATED_ANON },
    ],
    expectFetch: 2,
    // A gets session price 1711.50, B keeps its 300 (gate-html extraction fails so no override).
    expectPrices: ["1711.50", "300"],
  },
];

(async () => {
  const body = productLiveJs({ cur: "£", apiBase: "https://api.test" });
  let allPass = true;
  for (const t of cases) {
    const env = makeEnv(t);
    new Function("root", body)(env.root);
    await new Promise((r) => realSetTimeout(r, 500));
    const fetches = env.getFetches();
    const prices = env.cards.map((c) => c.amt.textContent);
    const norm = (s) => String(s).replace(/[\s,]/g, "");
    let pricesPass = true;
    for (let i = 0; i < t.expectPrices.length; i++) {
      if (!norm(prices[i]).includes(norm(t.expectPrices[i]))) pricesPass = false;
    }
    const fetchPass = fetches === t.expectFetch;
    const pass = pricesPass && fetchPass;
    if (!pass) allPass = false;
    console.log(
      (pass ? "PASS" : "FAIL") + " · " + t.name +
      " | fetches=" + fetches + " prices=" + JSON.stringify(prices),
    );
  }
  process.exit(allPass ? 0 : 1);
})();
