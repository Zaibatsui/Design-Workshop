/**
 * Shared live-price refresh + VAT-toggle JS used by `products.js`
 * (Product Carousel) and `productGrid.js` (Product Grid).
 *
 * Returns a JS body string (no IIFE wrapper) that, when injected into a
 * snippet's IIFE, will:
 *   • find every `.ns-card[data-ns-src]` inside `root`
 *   • re-scrape the linked URL every 30 minutes via the backend API
 *   • read the host page's VAT toggle (label text, .vat-switcher data
 *     attrs, body class) and re-stamp suffix + flip cached prices
 *   • do a same-origin credentialed fetch on every card so logged-in
 *     host users see their session price (contract / discount / gated).
 *     The session price is read from the user's own browser cookies, so
 *     no backend session-passing is required. When the user is logged
 *     out, the response matches the public scrape and the in-place
 *     diff check prevents any visible flicker.
 *
 * The output string assumes `root` is in scope (provided by `iife()`).
 *
 * Debug: set `window.NS_DEBUG = true` in DevTools on the host page to
 * log extraction decisions and fetch outcomes.
 */
export function productLiveJs({ cur = "", apiBase = "" } = {}) {
  if (!apiBase) return "";

  return (
    `var TTL=18e5,API=${JSON.stringify(apiBase + "/api/scrape-product")};` +
    `var CUR=${JSON.stringify(cur)};` +
    `function dbg(){try{if(window.NS_DEBUG)console.log.apply(console,["[ns]"].concat([].slice.call(arguments)));}catch(e){}}` +
    // swapCur(s) — replace leading currency token with CUR (if set).
    `function swapCur(s){if(!CUR||!s)return s;return CUR+String(s).replace(/^\\s*(?:[£$€¥₹₪₺₽]+|GBP|USD|EUR|JPY|SEK|NOK|DKK|CHF|AUD|CAD|NZD|HKD|SGD|kr|zł|Kč|Ft|R\\$|AED|SAR|ZAR|INR|PLN|CZK|HUF|RUB|TRY|ILS|CNY|MXN|BRL)\\s*/i,"");}` +
    // classify(text) → "incl" | "excl" | null.
    `function classify(s){if(!s)return null;var t=String(s).toLowerCase();` +
      `if(/\\binc(?:l|\\.|\\s|$)/.test(t)||/\\binkl\\b/.test(t))return"incl";` +
      `if(/\\bex(?:c|\\.|\\s|$)/.test(t)||/\\bexkl\\b/.test(t))return"excl";` +
    `return null;}` +
    // vatMode() — detect host page's current VAT mode.
    `function vatMode(){try{` +
      `var el=document.querySelector(".vat-switcher-label");` +
      `if(el){var r=classify(el.textContent);if(r)return r;}` +
      `var sw=document.querySelector(".vat-switcher");` +
      `if(sw){` +
        `var ds=sw.getAttribute("data-state")||sw.getAttribute("data-vat")||sw.getAttribute("aria-pressed")||"";` +
        `if(ds==="true")return"incl";if(ds==="false")return"excl";` +
        `var r2=classify(ds);if(r2)return r2;` +
        `var r3=classify(sw.className);if(r3)return r3;` +
      `}` +
      `var bc=String(document.body.className||"").toLowerCase();` +
      `if(bc.indexOf("vat")>=0){var r4=classify(bc);if(r4)return r4;}` +
    `}catch(e){}return null;}` +
    // vatLabel(mode) — pull the actual label string used on host.
    `function vatLabel(mode){try{var el=document.querySelector(".vat-switcher-label");` +
      `if(el){var t=(el.textContent||"").trim();if(t&&classify(t)===mode)return t;}` +
    `}catch(e){}return mode==="incl"?"Incl VAT":"Excl VAT";}` +
    `function ckey(u,m){return"ns-px:"+u+"::"+(m||"default");}` +
    // GATE — phrases that indicate the host hides prices behind login.
    `var GATE=/(log\\s*in|sign\\s*in|price\\s+on|\\bPOA\\b|contact\\s+us\\s+for\\s+(?:price|pricing|quote))/i;` +
    // numVal(s) — extract numeric portion of a price string for magnitude sanity checks.
    `function numVal(s){if(!s)return null;var m=String(s).replace(/[\\s,]/g,"").match(/(\\d+(?:\\.\\d+)?)/);return m?parseFloat(m[1]):null;}` +
    // okP(s) — accept a candidate price only if it parses to > 0 and is
    // not a gate phrase. Rejects "£0.00", basket-total placeholders, etc.
    `function okP(s){if(!s)return false;if(GATE.test(String(s)))return false;var v=numVal(s);return v!==null&&v>0;}` +
    // extractP(html) — robust price extraction from a fetched product page.
    // Order of strategies (most reliable first):
    //  1. Schema.org meta[itemprop="price"] or [itemprop="price"] anywhere
    //     in the document (Nettailer + most B2B carts emit this for SEO)
    //  2. JSON-LD offers.price
    //  3. og:price / product:price meta tags
    //  4. Class-based extraction — ONLY within a recognised product
    //     container, so we never grab basket-total / minicart / sidebar
    //     accessory prices from the page chrome
    //  5. Body-text regex (last resort), excluding basket/cart/header
    //     regions to avoid £0.00 basket totals
    // Every strategy validates `okP()` (>0, not gated) before returning.
    `function extractP(h){var found=null;` +
    // 1+2: DOMParser-based structured extraction (schema.org first)
    `try{if(typeof DOMParser!=="undefined"){var doc=new DOMParser().parseFromString(h,"text/html");` +
      // 1a) meta with explicit price content (search whole doc — these are usually in <head>)
      `var ms=doc.querySelectorAll('meta[itemprop="price"],meta[property="product:price:amount"],meta[property="og:price:amount"],meta[name="price"]');` +
      `for(var mi=0;mi<ms.length;mi++){var mc=ms[mi].getAttribute("content");if(okP(mc)){dbg("extractP: meta itemprop=",mc);return mc;}}` +
      // 1b) [itemprop="price"] element (content attr or text)
      `var ips=doc.querySelectorAll('[itemprop="price"]');` +
      `for(var ii=0;ii<ips.length;ii++){var ip=ips[ii];var ic=ip.getAttribute("content");if(okP(ic)){dbg("extractP: itemprop content=",ic);return ic;}var it=(ip.textContent||"").trim();if(it&&!GATE.test(it)){var im=it.match(/[£$€¥₹₪₺₽]\\s?\\d[\\d,]*(?:\\.\\d{1,2})?/);if(im&&okP(im[0])){dbg("extractP: itemprop text=",im[0]);return im[0];}}}` +
      // 4) class-based — ONLY within a recognised product scope
      `var scope=doc.querySelector('[itemtype*="Product" i]')||doc.querySelector('[typeof*="Product" i]')||doc.querySelector("#product-detail,.product-detail,.product-info,.product-main,.product-summary,.product__info,.product-page,.product-card,.product-view,#productView,.productView");` +
      `if(scope){var sels=[".price-current",".product-price",".main-price",".price-main",".price__current",".price-value",".price-now",".product__price"];` +
      `for(var si=0;si<sels.length;si++){var cps=scope.querySelectorAll(sels[si]);for(var ci=0;ci<cps.length;ci++){var tt=(cps[ci].textContent||"").trim();if(tt&&!GATE.test(tt)){var cm=tt.match(/[£$€¥₹₪₺₽]\\s?\\d[\\d,]*(?:\\.\\d{1,2})?/);if(cm&&okP(cm[0])){dbg("extractP: class",sels[si],"=",cm[0]);return cm[0];}}}}}` +
    `}}catch(e){dbg("extractP DOMParser err",e&&e.message);}` +
    // 2: JSON-LD offers.price (fallback if DOMParser was unavailable)
    `try{var jm=h.match(/<script[^>]+application\\/ld\\+json[^>]*>([\\s\\S]*?)<\\/script>/i);if(jm){var j=JSON.parse(jm[1].trim());var a=Array.isArray(j)?j:[j];for(var i=0;i<a.length;i++){var n=a[i]&&a[i].offers;if(n){var o=Array.isArray(n)?n[0]:n;if(o&&o.price&&okP(o.price)){dbg("extractP: JSON-LD offers.price=",o.price);return String(o.price);}}}}}catch(e){}` +
    // 3: meta tag regex (raw text)
    `var mm=h.match(/<meta[^>]+(?:product:price:amount|og:price:amount)[^>]+content=["']([^"']+)["']/i);if(mm&&okP(mm[1])){dbg("extractP: meta regex=",mm[1]);return mm[1];}` +
    // 5: full-text first non-zero currency-prefixed number, with header/cart
    // chrome stripped out so we don't pick basket totals like "£0.00 Excl VAT".
    `var s=h.replace(/<(script|style|header|nav|aside)\\b[^>]*>[\\s\\S]*?<\\/\\1>/gi," ").replace(/<[^>]+class=["'][^"']*(?:basket|cart|minicart|header|navbar|topbar|toolbar)[^"']*["'][^>]*>[\\s\\S]{0,2000}?<\\/[a-z]+>/gi," ");` +
    `var pxs=s.match(/[£$€¥₹₪₺₽]\\s?\\d[\\d,]*(?:\\.\\d{1,2})?/g);if(pxs){for(var pi=0;pi<pxs.length;pi++){if(okP(pxs[pi])){dbg("extractP: regex fallback=",pxs[pi]);return pxs[pi];}}}` +
    `return null;}` +
    // trySession(card) — same-origin credentialed fetch to surface the
    // user's session price. Always runs when same-origin (no login-state
    // gate); when the host user is logged out, the response matches the
    // public scrape and the in-place diff check prevents flicker.
    // Sanity: if new price magnitude differs >10× from public price,
    // skip — guards against picking an accessory's price by mistake.
    `function trySession(card){var u=card.getAttribute("data-ns-src");if(!u)return;var amt=card.querySelector(".ns-price-amount");if(!amt)return;try{var pu=new URL(u,location.href);if(pu.origin!==location.origin){dbg("trySession skip cross-origin",pu.origin);return;}}catch(e){return;}` +
    `fetch(u,{credentials:"include",headers:{"Accept":"text/html"}}).then(function(r){return r.ok?r.text():null;}).then(function(h){` +
      `if(!h){dbg("trySession empty html",u);return;}` +
      `var p=extractP(h);if(!p){dbg("trySession extractP=null",u);return;}` +
      `var pv=numVal(p);if(!pv||pv<=0){dbg("trySession reject zero/neg price",p);return;}` +
      `var fp=String(p);if(/^\\d+(?:[.,]\\d+)?$/.test(fp.trim())){fp=(CUR||"")+fp;}` +
      `var next=swapCur(fp);` +
      `var curT=String(amt.textContent||"").replace(/\\s+/g," ").trim();` +
      `var nxtT=String(next).replace(/\\s+/g," ").trim();` +
      `if(curT===nxtT){dbg("trySession unchanged",curT);return;}` +
      `var cv=numVal(curT),nv=numVal(nxtT);` +
      `if(cv&&nv&&(nv/cv>10||cv/nv>10)){dbg("trySession sanity-skip cur=",cv,"new=",nv);return;}` +
      `dbg("trySession update",curT,"→",nxtT,"url=",u);` +
      `amt.textContent=next;` +
    `}).catch(function(err){dbg("trySession err",err&&err.message);});}` +
    // fetchOne(card, force) — main scraper hit with per-VAT cache.
    `function fetchOne(card,force){var u=card.getAttribute("data-ns-src");if(!u)return;var m=vatMode();var k=ckey(u,m),now=Date.now(),amt=card.querySelector(".ns-price-amount"),sfx=card.querySelector(".ns-price-suffix");function paint(p){if(amt&&p)amt.textContent=swapCur(p);if(sfx&&m&&classify(sfx.textContent)!==null){sfx.textContent=vatLabel(m);}}if(!force){try{var c=JSON.parse(localStorage.getItem(k)||"null");if(c&&c.t&&now-c.t<TTL){if(c.p)paint(c.p);return;}}catch(e){}}` +
    `fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:u,vat_mode:m})}).then(function(r){return r.ok?r.json():null;}).then(function(d){if(!d||!d.price)return;paint(d.price);try{localStorage.setItem(k,JSON.stringify({t:now,p:d.price}));if(d.priceInc)localStorage.setItem(ckey(u,"incl"),JSON.stringify({t:now,p:d.priceInc}));if(d.priceExc)localStorage.setItem(ckey(u,"excl"),JSON.stringify({t:now,p:d.priceExc}));}catch(e){}}).catch(function(){});}` +
    // Boot: scrape every live card now, then attempt session fetch shortly
    // after. Watch DOM for VAT-toggle changes and re-fetch when relevant.
    `var live=root.querySelectorAll(".ns-card[data-ns-src]");if(live.length&&typeof fetch==="function"){dbg("boot live cards=",live.length);live.forEach(function(c){fetchOne(c,false);setTimeout(function(){trySession(c);},250);});` +
    `var lastV=vatMode();function tick(){var v=vatMode();if(v===lastV)return;lastV=v;live.forEach(function(c){fetchOne(c,false);setTimeout(function(){trySession(c);},250);});}` +
    `try{if(typeof MutationObserver!=="undefined"){var mo=new MutationObserver(tick);mo.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class","data-state","data-vat","aria-pressed","aria-checked"]});}}catch(e){}` +
    `setInterval(tick,500);` +
    `}`
  );
}
