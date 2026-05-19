/**
 * Behavioral tests for session-aware pricing in `productLive.js`.
 *
 * The snippet is JS-string output that runs inside the host e-commerce
 * page (same-origin, same browser session). These tests construct a
 * fake DOM + fetch + cookie environment and execute the generated
 * snippet body to verify:
 *   • a logged-in host user gets their session price overlaid
 *   • a logged-out anonymous user is NOT subjected to an extra fetch
 *   • a "Log in for price" gate phrase still triggers the override
 *   • identical session/public prices don't cause flicker
 *
 * Run with:  node src/sections/__tests__/productLive.session.test.js
 */
const { productLiveJs } = require("../productLive");
const realSetTimeout = setTimeout;

function makeEnv(state) {
  const card = {
    attrs: { "data-ns-src": "https://host.test/p/widget" },
    getAttribute(k) { return this.attrs[k]; },
    amt: { textContent: state.initial },
    querySelector(sel) { return sel === ".ns-price-amount" ? this.amt : null; },
  };
  let trySessionCalled = 0;
  global.location = { href: "https://host.test/page", origin: "https://host.test" };
  global.URL = require("url").URL;
  global.document = {
    cookie: state.cookie || "",
    body: { className: "" },
    querySelector(sel) {
      return state.loggedIn && sel.includes("logout") ? { tagName: "A" } : null;
    },
    querySelectorAll() { return [card]; },
  };
  global.localStorage = { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } };
  global.MutationObserver = function () { this.observe = function () { }; };
  global.setInterval = () => { };
  global.setTimeout = (fn, ms) => realSetTimeout(fn, ms);
  global.fetch = (url) => {
    if (url === "https://api.test/api/scrape-product") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(state.api) });
    }
    if (url === "https://host.test/p/widget") {
      trySessionCalled++;
      const html = '<html><head><script type="application/ld+json">{"offers":{"price":"42.00"}}</script></head><body></body></html>';
      return Promise.resolve({ ok: true, text: () => Promise.resolve(html) });
    }
    return Promise.resolve({ ok: false });
  };
  return { card, getFetches: () => trySessionCalled };
}

const cases = [
  { name: "logged-in, public price → session override", state: { initial: "£99.00", cookie: "NetsetSession=x", loggedIn: true, api: { price: "£99.00" } }, expectFetch: 1, expectPrice: "42" },
  { name: "logged-out, public price → NO session fetch", state: { initial: "£99.00", cookie: "", loggedIn: false, api: { price: "£99.00" } }, expectFetch: 0, expectPrice: "99" },
  { name: "logged-out, gated price → session fetch fires", state: { initial: "Log in for price", cookie: "", loggedIn: false, api: { price: "Log in for price" } }, expectFetch: 1, expectPrice: "42" },
  { name: "logged-in, identical price → no flicker", state: { initial: "£42.00", cookie: "NetsetSession=x", loggedIn: true, api: { price: "£42.00" } }, expectFetch: 1, expectPrice: "42" },
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
