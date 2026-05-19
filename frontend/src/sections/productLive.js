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
 *   • do a same-origin credentialed fetch when EITHER the rendered
 *     price is a gate phrase ("Log in for price") OR the host user is
 *     logged in (logged-in users often see contract/discount prices).
 *     The session price is read from the user's own browser cookies,
 *     so no backend session-passing is required.
 *
 * The output string assumes `root` is in scope (provided by `iife()`).
 */
export function productLiveJs({ cur = "", apiBase = "" } = {}) {
  if (!apiBase) return "";

  return (
    `var TTL=18e5,API=${JSON.stringify(apiBase + "/api/scrape-product")};` +
    `var CUR=${JSON.stringify(cur)};` +
    // swapCur(s) — replace leading currency token with CUR (if set).
    // Mirrors the server-side strip regex.
    `function swapCur(s){if(!CUR||!s)return s;return CUR+String(s).replace(/^\\s*(?:[£$€¥₹₪₺₽]+|GBP|USD|EUR|JPY|SEK|NOK|DKK|CHF|AUD|CAD|NZD|HKD|SGD|kr|zł|Kč|Ft|R\\$|AED|SAR|ZAR|INR|PLN|CZK|HUF|RUB|TRY|ILS|CNY|MXN|BRL)\\s*/i,"");}` +
    // classify(text) → "incl" | "excl" | null. Accepts a wide range of
    // real-world VAT labels (English, Swedish, Norwegian, French…).
    `function classify(s){if(!s)return null;var t=String(s).toLowerCase();` +
      `if(/\\binc(?:l|\\.|\\s|$)/.test(t)||/\\binkl\\b/.test(t))return"incl";` +
      `if(/\\bex(?:c|\\.|\\s|$)/.test(t)||/\\bexkl\\b/.test(t))return"excl";` +
    `return null;}` +
    // vatMode() — detect the host page's current VAT mode via three
    // independent signals (label text, switcher attrs/class, body class).
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
    // vatLabel(mode) — pull the actual label string the host uses (e.g.
    // "Inkl. moms"). Fall back to canonical English when missing.
    `function vatLabel(mode){try{var el=document.querySelector(".vat-switcher-label");` +
      `if(el){var t=(el.textContent||"").trim();if(t&&classify(t)===mode)return t;}` +
    `}catch(e){}return mode==="incl"?"Incl VAT":"Excl VAT";}` +
    `function ckey(u,m){return"ns-px:"+u+"::"+(m||"default");}` +
    // GATE — phrases that indicate the host hides prices behind login.
    `var GATE=/(log\\s*in|sign\\s*in|price\\s+on|\\bPOA\\b|contact\\s+us\\s+for\\s+(?:price|pricing|quote))/i;` +
    // loggedIn() — best-effort host-site session detection. Returns true
    // when common logout links, body classes, or session cookies are present.
    `function loggedIn(){try{` +
      `if(document.querySelector('a[href*="logout" i],a[href*="signout" i],a[href*="sign-out" i],a[href*="log-out" i],.logged-in,body.logged-in,.user-logged-in,[data-logged-in="true"]'))return true;` +
      `var c=document.cookie||"";` +
      `if(/(?:^|;)\\s*(?:wordpress_logged_in|woocommerce_session|customer_session|Customer|NetsetSession|nettailer_session|sessionid|JSESSIONID)/i.test(c))return true;` +
    `}catch(e){}return false;}` +
    // extractP(html) — extract a price from a fetched page (JSON-LD,
    // meta tags, then first currency-prefixed number outside script/style).
    `function extractP(h){try{var m=h.match(/<script[^>]+application\\/ld\\+json[^>]*>([\\s\\S]*?)<\\/script>/i);if(m){var j=JSON.parse(m[1].trim());var a=Array.isArray(j)?j:[j];for(var i=0;i<a.length;i++){var n=a[i]&&a[i].offers;if(n){var o=Array.isArray(n)?n[0]:n;if(o&&o.price&&!GATE.test(String(o.price)))return String(o.price);}}}}catch(e){}var mm=h.match(/<meta[^>]+(?:product:price:amount|og:price:amount)[^>]+content=["']([^"']+)["']/i);if(mm&&!GATE.test(mm[1]))return mm[1];var s=h.replace(/<(script|style)\\b[^>]*>[\\s\\S]*?<\\/\\1>/gi," ");mm=s.match(/[£$€¥₹₪₺₽]\\s?\\d[\\d,]*(?:\\.\\d{1,2})?/);return mm?mm[0]:null;}` +
    // trySession(card) — same-origin credentialed fetch to surface the
    // user's session price. Runs when the displayed price is gated OR
    // when the host user is logged in. Skips silently on cross-origin
    // or any error. No localStorage cache — relies on browser HTTP cache.
    `function trySession(card){var u=card.getAttribute("data-ns-src");if(!u)return;var amt=card.querySelector(".ns-price-amount");if(!amt)return;var isGate=GATE.test(amt.textContent||"");if(!isGate&&!loggedIn())return;try{var pu=new URL(u,location.href);if(pu.origin!==location.origin)return;}catch(e){return;}fetch(u,{credentials:"include",headers:{"Accept":"text/html"}}).then(function(r){return r.ok?r.text():null;}).then(function(h){if(!h)return;var p=extractP(h);if(!p)return;var fp=String(p);if(/^\\d+(?:[.,]\\d+)?$/.test(fp.trim())){fp=(CUR||"")+fp;}var next=swapCur(fp);var curT=String(amt.textContent||"").replace(/\\s+/g," ").trim();var nxtT=String(next).replace(/\\s+/g," ").trim();if(curT!==nxtT)amt.textContent=next;}).catch(function(){});}` +
    // fetchOne(card, force) — main scraper hit with per-VAT cache. Pre-warms
    // both incl/excl keys so subsequent toggles flip instantly from cache.
    `function fetchOne(card,force){var u=card.getAttribute("data-ns-src");if(!u)return;var m=vatMode();var k=ckey(u,m),now=Date.now(),amt=card.querySelector(".ns-price-amount"),sfx=card.querySelector(".ns-price-suffix");function paint(p){if(amt&&p)amt.textContent=swapCur(p);if(sfx&&m&&classify(sfx.textContent)!==null){sfx.textContent=vatLabel(m);}}if(!force){try{var c=JSON.parse(localStorage.getItem(k)||"null");if(c&&c.t&&now-c.t<TTL){if(c.p)paint(c.p);return;}}catch(e){}}` +
    `fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:u,vat_mode:m})}).then(function(r){return r.ok?r.json():null;}).then(function(d){if(!d||!d.price)return;paint(d.price);try{localStorage.setItem(k,JSON.stringify({t:now,p:d.price}));if(d.priceInc)localStorage.setItem(ckey(u,"incl"),JSON.stringify({t:now,p:d.priceInc}));if(d.priceExc)localStorage.setItem(ckey(u,"excl"),JSON.stringify({t:now,p:d.priceExc}));}catch(e){}}).catch(function(){});}` +
    // Boot: scrape every live card now, then attempt session fetch shortly
    // after. Watch the DOM + poll for VAT-toggle / login-state changes and
    // re-fetch when anything relevant changes.
    `var live=root.querySelectorAll(".ns-card[data-ns-src]");if(live.length&&typeof fetch==="function"){live.forEach(function(c){fetchOne(c,false);setTimeout(function(){trySession(c);},150);});` +
    `var lastV=vatMode(),lastL=loggedIn();function tick(){var v=vatMode(),l=loggedIn();var changed=false;if(v!==lastV){lastV=v;changed=true;}if(l!==lastL){lastL=l;changed=true;}if(!changed)return;live.forEach(function(c){fetchOne(c,false);setTimeout(function(){trySession(c);},150);});}` +
    `try{if(typeof MutationObserver!=="undefined"){var mo=new MutationObserver(tick);mo.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class","data-state","data-vat","aria-pressed","aria-checked","data-logged-in"]});}}catch(e){}` +
    `setInterval(tick,500);` +
    `}`
  );
}
