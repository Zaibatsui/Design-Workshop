/**
 * Behavioral tests for session-aware pricing in `productLive.js`.
 *
 * Uses jsdom for a faithful DOMParser implementation so we accurately
 * reproduce real-world HTML structures (basket totals, accessory
 * sidebars, schema.org markup) and verify the snippet picks the right
 * price element.
 *
 * Run with:  node src/sections/__tests__/productLive.session.test.js
 */
const { JSDOM } = require("jsdom");
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
  // Use jsdom to provide a real DOMParser. The host page itself doesn't
  // need product markup — the snippet only inspects the FETCHED HTML.
  const hostDom = new JSDOM("<html><body></body></html>", { url: "https://host.test/page" });
  global.document = {
    cookie: state.cookie || "",
    body: { className: "" },
    querySelector() { return null; },
    querySelectorAll() { return [card]; },
  };
  global.DOMParser = hostDom.window.DOMParser;
  global.window = global;
  global.localStorage = { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } };
  global.MutationObserver = function () { this.observe = function () { }; };
  global.setInterval = () => { };
  global.setTimeout = (fn, ms) => realSetTimeout(fn, ms);
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

// HTML fixtures modelling real Nettailer-style markup.

// Logged-in product page with schema.org markup, a basket total in the
// header reading "£0.00", an accessories sidebar, AND the real product
// price. This is the exact shape the user is hitting.
const NETTAILER_HTML_LOGGED_IN = `
<html><body>
<header class="topbar">
  <div class="basket-total"><span class="price">£0.00 Excl VAT</span></div>
  <span class="user">Logged in as LightningPCs</span>
</header>
<aside class="suggested">
  <div class="acc"><span class="price">£41.50 Excl VAT</span></div>
  <div class="acc"><span class="price">£52.10 Excl VAT</span></div>
</aside>
<main class="product-detail" itemscope itemtype="https://schema.org/Product">
  <h1>MG004QN/A - Apple iPhone 17 Pro Max</h1>
  <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
    <meta itemprop="priceCurrency" content="GBP">
    <meta itemprop="price" content="1711.50">
  </div>
  <span class="product-price">£1,711.50 Excl VAT</span>
</main>
</body></html>`;

// Anonymous (logged-out) view of the same page — same structure, public price.
const NETTAILER_HTML_PUBLIC = NETTAILER_HTML_LOGGED_IN.replace("1711.50", "2167.90").replace("£1,711.50", "£2,167.90");

// Hostile case: page has a £0.00 in a basket WIDGET inside the product
// scope itself (rare but possible — e.g. a "your basket" widget shown
// on the product page). The snippet must NOT pick £0.00.
const HTML_WITH_ZERO_IN_SCOPE = `
<html><body>
<main class="product-detail" itemscope itemtype="https://schema.org/Product">
  <div class="basket-widget"><span class="product-price">£0.00</span></div>
  <meta itemprop="price" content="0.00">
  <span class="product-price">£500.00</span>
</main>
</body></html>`;

// Plain HTML with NO schema.org and NO product scope — only basket totals
// and the product price as a generic .price span. Must NOT pick £0.00.
const HTML_NO_SCHEMA = `
<html><body>
<header><div class="basket"><span class="price">£0.00 Excl VAT</span></div></header>
<div class="content"><span>Some product</span></div>
</body></html>`;

const cases = [
  {
    name: "Logged-in Nettailer: schema.org meta wins, ignores £0.00 basket + £41.50 sidebar",
    state: { initial: "£2,167.90", cardUrl: "https://host.test/p/iphone17", api: { price: "£2,167.90" }, html: NETTAILER_HTML_LOGGED_IN },
    expectFetch: 1, expectContains: "1711.50",
  },
  {
    name: "Logged-out Nettailer: extracts public price (no flicker)",
    state: { initial: "£2,167.90", cardUrl: "https://host.test/p/iphone17", api: { price: "£2,167.90" }, html: NETTAILER_HTML_PUBLIC },
    expectFetch: 1, expectContains: "2,167.90",
  },
  {
    name: "Page with £0.00 inside schema → skip zero, pick £500",
    state: { initial: "£999.00", api: { price: "£999.00" }, html: HTML_WITH_ZERO_IN_SCOPE },
    expectFetch: 1, expectContains: "500",
  },
  {
    name: "No schema + no scope: keep public price (no override on basket-£0.00)",
    state: { initial: "£99.00", api: { price: "£99.00" }, html: HTML_NO_SCHEMA },
    expectFetch: 1, expectContains: "99",
  },
  {
    name: "Cross-origin URL → no session fetch",
    state: { initial: "£99.00", cardUrl: "https://other.test/p/x", api: { price: "£99.00" }, html: "" },
    expectFetch: 0, expectContains: "99",
  },
  {
    name: "Sanity skip: extracted price >10x cheaper than public → keep public",
    state: { initial: "£2,167.90", api: { price: "£2,167.90" }, html: '<meta itemprop="price" content="41.50">' },
    expectFetch: 1, expectContains: "2,167.90",
  },
];

(async () => {
  const body = productLiveJs({ cur: "£", apiBase: "https://api.test" });
  let allPass = true;
  for (const t of cases) {
    const env = makeEnv(t.state);
    new Function("var root = document; " + body)();
    await new Promise((r) => realSetTimeout(r, 350));
    const fetches = env.getFetches();
    const price = env.card.amt.textContent;
    // Normalise both sides (strip commas / spaces) before comparing.
    const norm = (s) => String(s).replace(/[\s,]/g, "");
    const pass = fetches === t.expectFetch && norm(price).includes(norm(t.expectContains));
    if (!pass) allPass = false;
    console.log((pass ? "PASS" : "FAIL") + " · " + t.name + " | fetches=" + fetches + ' price="' + price + '"');
  }
  process.exit(allPass ? 0 : 1);
})();
