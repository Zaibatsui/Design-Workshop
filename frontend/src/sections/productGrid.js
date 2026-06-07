/**
 * Product Grid — static CSS-grid of product cards (no carousel).
 * Mirrors the Product Carousel's card rendering, live-price refresh,
 * gated-price fallback and VAT toggle. The user picks columns (2-5)
 * and adds as many products as needed — rows wrap automatically.
 */
import { useState } from "react";
import { LayoutGrid, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  iife,
  makeUid,
  num,
  padTopOf,
  padBotOf,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import { productLiveJs } from "./productLive";
import {
  TextField,
  SliderField,
  SelectField,
  ToggleField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import RichTextEditor from "@/components/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";
const API_BASE = process.env.REACT_APP_BACKEND_URL;

const ID = "productGrid";

/**
 * Coerces a stored per-product description into safe HTML for rendering
 * / Tiptap loading. Identical contract to the Product Carousel helper
 * of the same name (kept duplicated rather than imported across so each
 * section file remains a self-contained snippet generator).
 *  - Empty / whitespace → "" (caller suppresses the wrapper element).
 *  - HTML-looking string → trusted, passed through (it came from our
 *    own editor, identical trust model to the Rich Text block).
 *  - Plain text → escaped, paragraph-split on blank lines, `\n` becomes
 *    `<br/>` so legacy hand-typed values still render sensibly.
 */
function coerceDescHtml(desc) {
  const s = String(desc || "");
  if (!s.trim()) return "";
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(s);
  if (looksLikeHtml) return s;
  return s
    .split(/\n{2,}/)
    .map((para) => `<p>${escHtml(para).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

const sampleProduct = () => ({
  id: makeUid(),
  name: "",
  // Optional per-card eyebrow — short uppercase label rendered above the
  // product name in the section's `eyebrowColor`. Same contract as the
  // Product Carousel: blank by default; the renderer suppresses the
  // wrapper element when empty.
  eyebrow: "",
  // Optional rich-text blurb shown between the name and the price.
  // HTML payload from the same Tiptap editor used by FAQ answers and
  // Rich-text blocks — bold / italic / lists / links / alignment.
  description: "",
  price: "",
  priceSuffix: "Excl VAT",
  image: "",
  imageAlt: "",
  link: "#",
  overlay: "",
  overlayAlt: "",
  overlayPosition: "top-left",
  overlaySize: 38,
});

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "",
  title: "Trending products",
  titleColor: "#1f2937",
  eyebrowColor: "#E01839",
  priceColor: "#E01839",
  hoverBorder: "#E01839",
  columns: 4,
  paddingY: 60,
  paddingTop: 60,
  paddingBottom: 60,
  fullBleed: false,
  // Section-heading alignment (the header eyebrow + h2 above the grid).
  textAlign: "left",
  // Horizontal alignment of the per-card body content (eyebrow, name,
  // description, price). Independent of `textAlign` — mirrors the
  // Product Carousel so the two sections feel identical to author.
  cardTextAlign: "left",
  // Vertical gap between the product name and the description (or
  // the price, when no description is set). Default 12px matches the
  // historical look of the grid card.
  nameSpacing: 12,
  // Vertical spacing between elements INSIDE the per-product
  // description block — paragraphs, bullet / numbered list items, and
  // the trailing margin under each list. 6px = today's loose default,
  // mirrors the Product Carousel.
  descSpacing: 6,
  // ─── Mobile carousel mode ──────────────────────────────────────────
  // When ON, the grid layout collapses into a horizontal swipe-strip at
  // ≤640px viewports (cards at 80% width with a 20% peek of the next
  // card) while staying a normal stacked grid on desktop. OFF by
  // default — existing sections continue to render as the legacy
  // 2-up mobile grid. Mirrors the carousel section's clone-and-jump
  // engine for a seamless forward infinite loop.
  mobileCarousel: false,
  // Sub-controls — only consulted when `mobileCarousel` is ON.
  // Arrows: small ‹ / › buttons stacked over the bottom-right of the
  // strip. They're CSS-hidden on desktop so they never leak into the
  // grid layout.
  mobileCarouselArrows: true,
  // Autoplay: forward auto-advance on a timer. Pauses when the
  // section is off-screen (IntersectionObserver, saves battery) and
  // stops cleanly when the viewport widens past 640px.
  mobileCarouselAutoplay: false,
  mobileCarouselAutoplayInterval: 4000,
  currencyOverride: "",
  products: [],
});

// Mirrors products.js — keep the same options so currency behaviour
// is identical across both sections.
const CURRENCY_OPTIONS = [
  { value: "",       label: "Auto-detect from source" },
  { value: "£",      label: "£ — GBP" },
  { value: "$",      label: "$ — USD" },
  { value: "€",      label: "€ — EUR" },
  { value: "¥",      label: "¥ — JPY / CNY" },
  { value: "kr ",    label: "kr — SEK / NOK / DKK" },
  { value: "CHF ",   label: "CHF — Swiss franc" },
  { value: "R$ ",    label: "R$ — BRL" },
  { value: "₹",      label: "₹ — INR" },
  { value: "zł ",    label: "zł — PLN" },
  { value: "Kč ",    label: "Kč — CZK" },
  { value: "Ft ",    label: "Ft — HUF" },
];

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-pgrid-${uid}`;
  const cols = Math.max(2, Math.min(6, Number(cfg.columns) || 4));
  const gap = 18;
  const align =
    cfg.textAlign === "center" || cfg.textAlign === "right"
      ? cfg.textAlign
      : "left";
  // Per-card body alignment — drives `.ns-card-body` text-align so the
  // eyebrow / name / description / price all align together. Mirrors
  // the Product Carousel contract.
  const cardAlign =
    cfg.cardTextAlign === "center" || cfg.cardTextAlign === "right"
      ? cfg.cardTextAlign
      : "left";

  // Mobile-only carousel mode. When ON, ≤640px viewports collapse the
  // grid into a horizontal swipe-strip with optional arrows + autoplay;
  // desktop layout is untouched. We emit the modifier class, arrow
  // markup and autoplay data-attrs unconditionally so the snippet
  // doesn't need to be re-rendered when the toggle flips — the CSS
  // gates everything via `.is-m-carousel` and a `@media (max-width:640px)`
  // block, and the JS gates itself via `matchMedia`.
  const isMCarousel = !!cfg.mobileCarousel;
  const mArrows = isMCarousel && cfg.mobileCarouselArrows !== false;
  const mAutoplay = isMCarousel && !!cfg.mobileCarouselAutoplay;
  const mInterval = num(cfg.mobileCarouselAutoplayInterval, 4000);

  const cur = typeof cfg.currencyOverride === "string" ? cfg.currencyOverride : "";
  const CUR_STRIP_RE = /^\s*(?:[£$€¥₹₪₺₽]+|GBP|USD|EUR|JPY|SEK|NOK|DKK|CHF|AUD|CAD|NZD|HKD|SGD|kr|zł|Kč|Ft|R\$|AED|SAR|ZAR|INR|PLN|CZK|HUF|RUB|TRY|ILS|CNY|MXN|BRL)\s*/i;
  const applyCur = (p) => {
    if (!p) return p;
    if (!cur) return p;
    return cur + String(p).replace(CUR_STRIP_RE, "");
  };

  const styleVars = [
    `--ns-title-color:${safeColor(cfg.titleColor, "#1f2937")}`,
    `--ns-eyebrow-color:${safeColor(cfg.eyebrowColor || cfg.priceColor, "#E01839")}`,
    `--ns-price-color:${safeColor(cfg.priceColor, "#E01839")}`,
    `--ns-hover-border:${safeColor(cfg.hoverBorder, "#E01839")}`,
    `--ns-heading-size:${num(cfg.headingSize, 32)}px`,
    `--ns-pad-t:${padTopOf(cfg, 60)}px;--ns-pad-b:${padBotOf(cfg, 60)}px`,
    `--ns-cols:${cols}`,
    `--ns-gap:${gap}px`,
  ].join(";");

  const cardsHtml = (cfg.products || [])
    .map((p) => {
      const img = safeUrl(p.image);
      const link = safeUrl(p.link || "#");
      const target = p.openInSameTab ? "_self" : "_blank";
      const rel = p.openInSameTab ? "" : ' rel="noopener noreferrer"';
      const liveAttr =
        p.liveRefresh && /^https?:\/\//i.test(link)
          ? ` data-ns-src="${escAttr(link)}"`
          : "";
      const overlaySrc = safeUrl(p.overlay);
      const overlayAlt = (p.overlayAlt || "").trim();
      const overlayPos = ["top-left", "top-right", "bottom-left", "bottom-right"].includes(
        p.overlayPosition
      )
        ? p.overlayPosition
        : "top-left";
      const overlaySize = num(p.overlaySize, 38);
      const overlayHtml = overlaySrc
        ? `<img class="ns-overlay ns-overlay-${overlayPos}" src="${escAttr(overlaySrc)}" alt="${escAttr(overlayAlt)}"${overlayAlt ? "" : ' aria-hidden="true"'} style="max-width:${overlaySize}%;max-height:${overlaySize}%"/>`
        : "";
      return `<div class="ns-card"${liveAttr}>
  <a href="${escAttr(link)}" target="${target}"${rel}>
    <div class="ns-image-wrap">
      <img src="${escAttr(img)}" alt="${escAttr(p.imageAlt || p.name || "")}"/>
      ${overlayHtml}
    </div>
    <div class="ns-card-body">
      ${p.eyebrow ? `<p class="ns-card-eyebrow">${escHtml(p.eyebrow)}</p>` : ""}
      <h3 class="ns-name">${escHtml(p.name || "")}</h3>
      ${(() => { const d = coerceDescHtml(p.description); return d ? `<div class="ns-desc">${d}</div>` : ""; })()}
      <p class="ns-price"><span class="ns-price-amount">${escHtml(applyCur(p.price) || "")}</span>${p.priceSuffix ? `<span class="ns-price-suffix">${escHtml(p.priceSuffix)}</span>` : ""}</p>
    </div>
  </a>
</div>`;
    })
    .join("");

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad-t) 20px var(--ns-pad-b);width:100%;background:#fff}
.${cls} .ns-wrap{max-width:1200px;margin:0 auto;position:relative;text-align:${align}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-eyebrow-color);margin:0 0 10px}
.${cls} .ns-h{font-size:var(--ns-heading-size,32px);font-weight:600;color:var(--ns-title-color);margin:0 0 28px}
.${cls} .ns-grid{display:grid;grid-template-columns:repeat(var(--ns-cols),1fr);gap:var(--ns-gap);text-align:left}
.${cls} .ns-card{border:1px solid #f2f2f2;border-radius:6px;background:#fff;overflow:hidden;transition:border-color .2s ease,box-shadow .2s ease;display:flex}
.${cls} .ns-card:hover{border-color:var(--ns-hover-border);box-shadow:0 4px 18px rgba(0,0,0,.06)}
.${cls} .ns-card a{display:flex;flex-direction:column;width:100%;color:inherit;text-decoration:none}
.${cls} .ns-image-wrap{position:relative;flex-shrink:0}
.${cls} .ns-image-wrap > img{width:100%;height:170px;object-fit:contain;padding:16px;display:block}
.${cls} .ns-overlay{position:absolute;height:auto;width:auto;pointer-events:none;z-index:2}
.${cls} .ns-overlay-top-left{top:0;left:0}
.${cls} .ns-overlay-top-right{top:0;right:0}
.${cls} .ns-overlay-bottom-left{bottom:0;left:0}
.${cls} .ns-overlay-bottom-right{bottom:0;right:0}
.${cls} .ns-card-body{padding:0 16px 18px;display:flex;flex-direction:column;flex:1 1 auto;text-align:${cardAlign}}
.${cls} .ns-card-eyebrow{font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--ns-eyebrow-color);margin:0 0 6px}
.${cls} .ns-name{font-size:15px;line-height:1.4;font-weight:500;color:#1f1f1f;margin:0 0 ${num(cfg.nameSpacing, 12)}px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:42px}
.${cls} .ns-desc{font-size:13px;line-height:1.55;color:#4b5563;margin:0 0 ${num(cfg.descSpacing, 6)}px}
.${cls} .ns-desc>*:first-child{margin-top:0}
.${cls} .ns-desc>*:last-child{margin-bottom:0}
.${cls} .ns-desc p{margin:0 0 ${num(cfg.descSpacing, 6)}px}
.${cls} .ns-desc strong{font-weight:600;color:#1f1f1f}
.${cls} .ns-desc em{font-style:italic}
.${cls} .ns-desc ul,.${cls} .ns-desc ol{margin:0 0 ${num(cfg.descSpacing, 6)}px;padding-left:0;list-style-position:inside}
.${cls} .ns-desc ul{list-style:disc inside!important}
.${cls} .ns-desc ol{list-style:decimal inside!important}
.${cls} .ns-desc li{display:list-item;margin:0 0 ${num(cfg.descSpacing, 6)}px}
.${cls} .ns-desc li>p{display:inline;margin:0}
.${cls} .ns-desc a{color:var(--ns-price-color);text-decoration:underline;text-underline-offset:2px}
.${cls} .ns-desc a:hover{opacity:.85}
.${cls} .ns-price{font-size:18px;font-weight:600;color:var(--ns-price-color);margin:auto 0 0}
.${cls} .ns-price-amount{display:inline-block}
.${cls} .ns-price-suffix{font-size:12px;font-weight:400;color:#6b7280;margin-left:4px}
/* Mobile carousel arrows — hidden on desktop, shown only when
   .is-m-carousel + viewport ≤640px (see media query below). */
.${cls} .ns-marrow{display:none}
@media (max-width:1024px){.${cls} .ns-grid{grid-template-columns:repeat(${Math.min(cols, 3)},1fr)}}
@media (max-width:640px){
  .${cls} .ns-grid{grid-template-columns:repeat(${Math.min(cols, 2)},1fr)}
  /* ── Mobile carousel mode ────────────────────────────────────────
     When .is-m-carousel is set on the root section, the grid collapses
     into a horizontal swipe-strip. Cards take 80% of the viewport so
     the next one peeks in from the right and hints "swipe me". Scroll
     snap keeps each gesture landing on a whole card. */
  .${cls}.is-m-carousel{position:relative}
  .${cls}.is-m-carousel .ns-mcwrap{position:relative}
  .${cls}.is-m-carousel .ns-grid{display:flex;grid-template-columns:none;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;-ms-overflow-style:none;gap:12px;padding:4px 4px 8px;-webkit-overflow-scrolling:touch}
  .${cls}.is-m-carousel .ns-grid::-webkit-scrollbar{display:none}
  .${cls}.is-m-carousel .ns-card{flex:0 0 80%;scroll-snap-align:start}
  /* Arrows: classic carousel position — vertically centred on the
     product image (which sits at the top of each card and is 170px
     content tall + 16px image padding-top, so its visual centre is
     ~105px from the top of the track). Anchored to the wrapper so a
     long description or heading doesn't drag them lower. */
  .${cls}.is-m-carousel .ns-marrow{display:flex;position:absolute;top:105px;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;border:1px solid #e5e7eb;background:#fff;color:var(--ns-price-color);font-size:20px;line-height:1;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.08);z-index:3;padding:0;transition:background .15s ease}
  .${cls}.is-m-carousel .ns-marrow:hover{background:#f8fafc}
  .${cls}.is-m-carousel .ns-mprev{left:4px}
  .${cls}.is-m-carousel .ns-mnext{right:4px}
}
`.trim();

  const mArrowsHtml = mArrows
    ? `<button class="ns-marrow ns-mprev" type="button" data-ns-mprev aria-label="Previous">‹</button><button class="ns-marrow ns-mnext" type="button" data-ns-mnext aria-label="Next">›</button>`
    : "";

  // When the mobile-carousel mode is active we wrap the arrows + grid
  // in a `<div class="ns-mcwrap">` so the arrows can be positioned
  // relative to the TRACK rather than `.ns-wrap` (which also contains
  // the heading + eyebrow). Without the wrapper, vertically centring
  // the arrows would shift them down past the cards whenever a long
  // heading or description was present. The wrapper is omitted entirely
  // when mobile-carousel is off, so existing snippets keep the
  // unchanged `<h2>` → `<.ns-grid>` markup.
  const trackBlock = isMCarousel
    ? `<div class="ns-mcwrap">${mArrowsHtml}<div class="ns-grid" data-ns-mtrack>
      ${cardsHtml}
    </div></div>`
    : `<div class="ns-grid">
      ${cardsHtml}
    </div>`;

  const html = `<section class="ns-pgrid ${cls}${fullBleedClass(cfg)}${isMCarousel ? " is-m-carousel" : ""}" style="${styleVars}"${isMCarousel ? ` data-ns-m-autoplay="${mAutoplay ? "1" : "0"}" data-ns-m-interval="${mInterval}"` : ""} data-ns-group="defaults">
  <div class="ns-wrap">
    ${cfg.eyebrow || (cfg.title || "").trim() ? `<div data-ns-group="header">${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}${(cfg.title || "").trim() ? `<h2 class="ns-h">${escHtml(cfg.title)}</h2>` : ""}</div>` : ""}
    ${trackBlock}
  </div>
</section>`;

  // Live price refresh + VAT-toggle reactivity — identical logic to
  // the Product Carousel (shared in `./productLive.js`).
  const apiBase = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
  const liveJs =
    cardsHtml.indexOf("data-ns-src") >= 0
      ? productLiveJs({ cur, apiBase })
      : "";

  // ─── Mobile-carousel engine ──────────────────────────────────────
  // Activates only when:
  //   • `mobileCarousel` toggle is ON (modifier class on root)
  //   • viewport matches `(max-width: 640px)` (matchMedia gate)
  // On a mobile match: clones cards at both ends so forward scroll
  // never hits a hard edge (clone-and-jump infinite loop), wires the
  // optional arrow buttons, and optionally autoplays with an
  // IntersectionObserver pause-when-off-screen. When the viewport
  // crosses back to >640px the engine tears down its clones and
  // resets the track scroll so the desktop grid layout is pristine.
  //
  // Kept inline here (rather than promoted to `shared.js`) because it's
  // the only section that needs a mobile-only carousel today; if
  // another section grows the same feature we'll lift it out then.
  const mCarouselJs = isMCarousel
    ? `var mq=window.matchMedia?window.matchMedia("(max-width: 640px)"):null;
var mTrack=root.querySelector("[data-ns-mtrack]");
var mPrev=root.querySelector("[data-ns-mprev]");
var mNext=root.querySelector("[data-ns-mnext]");
if(mTrack){
  var mRealCards=Array.prototype.slice.call(mTrack.querySelectorAll(".ns-card"));
  var mAp=root.getAttribute("data-ns-m-autoplay")==="1";
  var mInt=parseInt(root.getAttribute("data-ns-m-interval"),10)||4000;
  var mTimer=null,mIsVis=true,mActive=false,mIo=null,mScrollT=null;
  var mReduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mSmooth=mReduced?"auto":"smooth";
  function mGapPx(){return parseInt(getComputedStyle(mTrack).gap,10)||12;}
  function mCardStep(){var cs=mTrack.querySelectorAll(".ns-card");if(cs.length>=2)return cs[1].offsetLeft-cs[0].offsetLeft;return cs[0]?cs[0].offsetWidth+mGapPx():0;}
  function mCloneCount(){var st=mCardStep()||1;var vis=Math.ceil((mTrack.clientWidth||0)/st);return Math.min(mRealCards.length,Math.max(2,vis+1));}
  function mRemoveClones(){var cs=mTrack.querySelectorAll("[data-ns-clone]");for(var i=0;i<cs.length;i++)cs[i].parentNode.removeChild(cs[i]);}
  function mAddClones(){if(mRealCards.length<2)return;mRemoveClones();var N=mCloneCount();var fp=document.createDocumentFragment();var fq=document.createDocumentFragment();for(var i=mRealCards.length-N;i<mRealCards.length;i++){var c=mRealCards[i].cloneNode(true);c.setAttribute("data-ns-clone","pre");c.removeAttribute("id");c.removeAttribute("data-ns-src");fp.appendChild(c);}for(var j=0;j<N;j++){var c2=mRealCards[j].cloneNode(true);c2.setAttribute("data-ns-clone","post");c2.removeAttribute("id");c2.removeAttribute("data-ns-src");fq.appendChild(c2);}mTrack.insertBefore(fp,mTrack.firstChild);mTrack.appendChild(fq);}
  function mSyncStart(){var f=mTrack.querySelector(".ns-card:not([data-ns-clone])");if(!f)return;mTrack.style.scrollBehavior="auto";mTrack.scrollLeft=f.offsetLeft;void mTrack.offsetWidth;mTrack.style.scrollBehavior=mSmooth;}
  function mGo(dir){var cards=mTrack.querySelectorAll(".ns-card");if(!cards.length)return;var sl=mTrack.scrollLeft;var curIdx=0,bd=Infinity;for(var i=0;i<cards.length;i++){var dd=Math.abs(cards[i].offsetLeft-sl);if(dd<bd){bd=dd;curIdx=i;}}var nx=Math.max(0,Math.min(cards.length-1,curIdx+dir));mTrack.scrollTo({left:cards[nx].offsetLeft,behavior:mSmooth});}
  function mMaybeWrap(){if(mRealCards.length<2)return;var fr=mTrack.querySelector(".ns-card:not([data-ns-clone])");if(!fr)return;var fpst=mTrack.querySelector('.ns-card[data-ns-clone="post"]');if(!fpst)return;var d=fpst.offsetLeft-fr.offsetLeft;var sl=mTrack.scrollLeft;if(sl>=fpst.offsetLeft-2){mTrack.style.scrollBehavior="auto";mTrack.scrollLeft=sl-d;void mTrack.offsetWidth;mTrack.style.scrollBehavior=mSmooth;}else if(sl<fr.offsetLeft-2){mTrack.style.scrollBehavior="auto";mTrack.scrollLeft=sl+d;void mTrack.offsetWidth;mTrack.style.scrollBehavior=mSmooth;}}
  function mOnScroll(){clearTimeout(mScrollT);mScrollT=setTimeout(mMaybeWrap,120);}
  function mStartTimer(){if(!mAp||!mActive||mRealCards.length<2)return;mStopTimer();mTimer=setInterval(function(){if(mIsVis&&mActive)mGo(1);},mInt);}
  function mStopTimer(){if(mTimer){clearInterval(mTimer);mTimer=null;}}
  function mPrevClick(){mGo(-1);mStartTimer();}
  function mNextClick(){mGo(1);mStartTimer();}
  function mActivate(){if(mActive)return;mActive=true;mAddClones();mTrack.addEventListener("scroll",mOnScroll,{passive:true});if(mPrev)mPrev.addEventListener("click",mPrevClick);if(mNext)mNext.addEventListener("click",mNextClick);if(typeof IntersectionObserver==="function"){mIo=new IntersectionObserver(function(es){mIsVis=!!(es[0]&&es[0].isIntersecting);if(!mIsVis)mStopTimer();else mStartTimer();});mIo.observe(root);}requestAnimationFrame(function(){mSyncStart();mStartTimer();});}
  function mDeactivate(){if(!mActive)return;mActive=false;mStopTimer();mTrack.removeEventListener("scroll",mOnScroll);if(mPrev)mPrev.removeEventListener("click",mPrevClick);if(mNext)mNext.removeEventListener("click",mNextClick);if(mIo){mIo.disconnect();mIo=null;}mRemoveClones();mTrack.style.scrollBehavior="auto";mTrack.scrollLeft=0;mTrack.style.scrollBehavior="";}
  function mSync(){if(mq&&mq.matches)mActivate();else mDeactivate();}
  if(mq){mSync();if(mq.addEventListener)mq.addEventListener("change",mSync);else if(mq.addListener)mq.addListener(mSync);}
}
`
    : "";

  const body = `${mCarouselJs}${liveJs}`;
  const js = body ? iife(cls, body) : "";

  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate, previewMode }) {
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetching, setFetching] = useState(false);

  const addProduct = () =>
    onUpdate({ products: [...config.products, sampleProduct()] });
  const removeProduct = (id) =>
    onUpdate({ products: config.products.filter((p) => p.id !== id) });
  const moveProduct = (id, dir) => {
    const idx = config.products.findIndex((p) => p.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= config.products.length) return;
    const arr = [...config.products];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    onUpdate({ products: arr });
  };
  const updateProduct = (id, patch) =>
    onUpdate({
      products: config.products.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    });

  const fetchFromUrl = async () => {
    const url = fetchUrl.trim();
    if (!url) { toast.error("Paste a product URL first"); return; }
    if (!/^https?:\/\//i.test(url)) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE}/api/scrape-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Fetch failed");
      if (!data.name && !data.image && !data.price) {
        toast.error("No product data found on that page");
        return;
      }
      const newProduct = {
        id: makeUid(),
        name: data.name || "Untitled product",
        price: data.price || "",
        priceSuffix: "Excl VAT",
        image: data.image || "",
        link: url,
        liveRefresh: true,
        overlay: data.overlay?.src || "",
        overlayPosition: data.overlay?.position || "top-left",
      };
      onUpdate({ products: [...config.products, newProduct] });
      setFetchUrl("");
      toast.success(
        data.image ? `Added "${newProduct.name}"` : `Added "${newProduct.name}" — please upload an image`
      );
    } catch (e) {
      toast.error(e.message || "Could not fetch product");
    } finally {
      setFetching(false);
    }
  };

  return (
    <FormAccordion sectionType="productGrid">
      <Group title="Header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="pgrid-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.title}
          onChange={(v) => onUpdate({ title: v })}
          testid="pgrid-title"
        />
        <SelectField
          label="Heading alignment"
          value={config.textAlign || "left"}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          testid="pgrid-text-align"
        />
        <SelectField
          label="Card text alignment"
          value={config.cardTextAlign || "left"}
          onChange={(v) => onUpdate({ cardTextAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          testid="pgrid-card-text-align"
        />
      </Group>

      <Group title="Defaults" value="defaults">
        <SelectField
          label="Products per row"
          value={config.columns}
          onChange={(v) => onUpdate({ columns: Number(v) })}
          options={[
            { value: 2, label: "2 per row" },
            { value: 3, label: "3 per row" },
            { value: 4, label: "4 per row" },
            { value: 5, label: "5 per row" },
            { value: 6, label: "6 per row" },
          ]}
          testid="pgrid-columns"
        />
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="pgrid-full-bleed"
        />
        {previewMode === "mobile" && (
          <>
            <ToggleField
              label="Use carousel on mobile"
              description="Phones only — at ≤640px the grid becomes a horizontal swipe-strip (80% card width with a peek of the next). Desktop layout is untouched."
              checked={!!config.mobileCarousel}
              onChange={(v) => onUpdate({ mobileCarousel: v })}
              testid="pgrid-mobile-carousel"
            />
            {config.mobileCarousel && (
              <div className="pl-4 border-l-2 border-slate-200 space-y-3">
                <ToggleField
                  label="Show arrows"
                  description="Small ‹ / › buttons stacked over the bottom-right of the strip."
                  checked={config.mobileCarouselArrows !== false}
                  onChange={(v) => onUpdate({ mobileCarouselArrows: v })}
                  testid="pgrid-mobile-carousel-arrows"
                />
                <ToggleField
                  label="Autoplay"
                  description="Forward auto-advance on a timer. Pauses when the section scrolls off-screen."
                  checked={!!config.mobileCarouselAutoplay}
                  onChange={(v) => onUpdate({ mobileCarouselAutoplay: v })}
                  testid="pgrid-mobile-carousel-autoplay"
                />
                {config.mobileCarouselAutoplay && (
                  <SliderField
                    label="Autoplay interval"
                    value={Number(config.mobileCarouselAutoplayInterval) || 4000}
                    min={2000}
                    max={12000}
                    step={500}
                    suffix="ms"
                    onChange={(v) =>
                      onUpdate({ mobileCarouselAutoplayInterval: v })
                    }
                    testid="pgrid-mobile-carousel-interval"
                  />
                )}
              </div>
            )}
          </>
        )}
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={60}
          min={20}
          max={120}
          testidPrefix="pgrid"
        />
        <SliderField
          label="Heading size"
          value={Number(config.headingSize) || 32}
          min={20}
          max={72}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="pgrid-heading-size"
        />
        <SliderField
          label="Space below product name"
          value={Number(config.nameSpacing ?? 12)}
          min={0}
          max={40}
          suffix="px"
          onChange={(v) => onUpdate({ nameSpacing: v })}
          testid="pgrid-name-spacing"
        />
        <SliderField
          label="Description line spacing"
          value={Number(config.descSpacing ?? 6)}
          min={0}
          max={20}
          suffix="px"
          onChange={(v) => onUpdate({ descSpacing: v })}
          testid="pgrid-desc-spacing"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <ColorField
          label="Eyebrow color"
          value={config.eyebrowColor || config.priceColor}
          onChange={(v) => onUpdate({ eyebrowColor: v })}
          testid="pgrid-eyebrow-color"
        />
        <ColorField
          label="Heading color"
          value={config.titleColor}
          onChange={(v) => onUpdate({ titleColor: v })}
          testid="pgrid-title-color"
        />
        <ColorField
          label="Price color"
          value={config.priceColor}
          onChange={(v) => onUpdate({ priceColor: v })}
          testid="pgrid-price-color"
        />
        <ColorField
          label="Card hover border"
          value={config.hoverBorder}
          onChange={(v) => onUpdate({ hoverBorder: v })}
          testid="pgrid-hover"
        />
        <SelectField
          label="Currency"
          value={config.currencyOverride ?? ""}
          onChange={(v) => onUpdate({ currencyOverride: v })}
          options={CURRENCY_OPTIONS}
          testid="pgrid-currency-override"
        />
      </Group>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Products ({config.products.length})
        </h3>

        <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
          <Label
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
            data-testid="pgrid-fetch-label"
          >
            <Link2 className="w-3.5 h-3.5" />
            Add from product URL
          </Label>
          <div className="flex gap-2">
            <Input
              value={fetchUrl}
              onChange={(e) => setFetchUrl(e.target.value)}
              placeholder="https://nettailer.com/..."
              disabled={fetching}
              data-testid="pgrid-fetch-url-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  fetchFromUrl();
                }
              }}
              className="bg-white"
            />
            <Button
              type="button"
              onClick={fetchFromUrl}
              disabled={fetching || !fetchUrl.trim()}
              data-testid="pgrid-fetch-button"
              className="shrink-0"
            >
              {fetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Fetching
                </>
              ) : (
                "Fetch"
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Paste product page URL — name, price &amp; image will auto-fill. All
            fields stay editable.
          </p>
        </div>

        <ListEditor
          items={config.products}
          onAdd={addProduct}
          onRemove={removeProduct}
          onMove={moveProduct}
          addLabel="Add product"
          testidPrefix="pgrid-product"
          renderRow={(p) => (
            <div className="flex items-center gap-2">
              <div className="w-10 h-7 rounded-sm bg-slate-100 flex-shrink-0 overflow-hidden">
                {p.image && (
                  <img
                    src={p.image}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">
                {p.name}
              </p>
              <span className="text-xs text-slate-500 ml-auto">{p.price}</span>
            </div>
          )}
          renderForm={(p) => (
            <>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Image
                </Label>
                <ImageUpload
                  value={p.image}
                  onChange={(v) => updateProduct(p.id, { image: v })}
                  testid={`pgrid-image-${p.id}`}
                  compact
                />
              </div>
              <TextField
                label="Image alt text (optional)"
                value={p.imageAlt || ""}
                onChange={(v) => updateProduct(p.id, { imageAlt: v })}
                placeholder="Falls back to the product name"
                testid={`pgrid-image-alt-${p.id}`}
              />
              <TextField
                label="Eyebrow (optional)"
                placeholder='e.g. "AI ENABLED" or "EXCLUSIVE"'
                value={p.eyebrow || ""}
                onChange={(v) => updateProduct(p.id, { eyebrow: v })}
                testid={`pgrid-eyebrow-${p.id}`}
              />
              <TextField
                label="Name"
                value={p.name}
                onChange={(v) => updateProduct(p.id, { name: v })}
                testid={`pgrid-name-${p.id}`}
              />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <RichTextEditor
                  html={coerceDescHtml(p.description)}
                  onChange={(v) => updateProduct(p.id, { description: v })}
                  tools={["bold", "italic", "ul", "ol", "link", "align"]}
                  inheritedAlign={config.cardTextAlign || "left"}
                />
                <p className="text-[11px] text-slate-500">
                  Short blurb shown between the product name and price. Select
                  text to add links, bold or italics — links inherit the card&apos;s
                  price colour by default.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Price"
                  value={p.price}
                  onChange={(v) =>
                    updateProduct(p.id, { price: v, liveRefresh: false })
                  }
                  testid={`pgrid-price-${p.id}`}
                />
                <TextField
                  label="Price suffix"
                  value={p.priceSuffix}
                  onChange={(v) => updateProduct(p.id, { priceSuffix: v })}
                  testid={`pgrid-suffix-${p.id}`}
                />
              </div>
              <ToggleField
                label="Auto-refresh price from URL"
                description={
                  p.liveRefresh
                    ? "Snippet re-scrapes the linked URL every 30 minutes and overwrites this price."
                    : "Price stays exactly as set above. Recommended when you've typed a price manually."
                }
                checked={Boolean(p.liveRefresh)}
                onChange={(v) => updateProduct(p.id, { liveRefresh: v })}
                testid={`pgrid-live-refresh-${p.id}`}
              />
              <TextField
                label="Link"
                value={p.link}
                onChange={(v) => updateProduct(p.id, { link: v })}
                testid={`pgrid-link-${p.id}`}
              />
              <ToggleField
                label="Open in same tab"
                checked={p.openInSameTab}
                onChange={(v) =>
                  updateProduct(p.id, { openInSameTab: v })
                }
                testid={`pgrid-same-tab-${p.id}`}
              />
              <ToggleField
                label="Add corner badge"
                description='A small graphic in a corner of the card (e.g. "Best seller", "Sale"). Not the product photo — use the Image field above for that.'
                checked={Boolean(p.overlay) || Boolean(p.showOverlay)}
                onChange={(v) =>
                  updateProduct(
                    p.id,
                    v
                      ? { showOverlay: true }
                      : {
                          showOverlay: false,
                          overlay: "",
                          overlayAlt: "",
                          overlayPosition: "top-left",
                          overlaySize: 38,
                        }
                  )
                }
                testid={`pgrid-overlay-toggle-${p.id}`}
              />
              {(Boolean(p.overlay) || Boolean(p.showOverlay)) && (
                <div className="pl-4 border-l-2 border-slate-200 space-y-3">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Badge image
                    </Label>
                    <ImageUpload
                      value={p.overlay}
                      onChange={(v) => updateProduct(p.id, { overlay: v })}
                      testid={`pgrid-overlay-${p.id}`}
                      compact
                    />
                  </div>
                  {p.overlay ? (
                    <>
                      <TextField
                        label="Overlay alt text (optional)"
                        value={p.overlayAlt || ""}
                        onChange={(v) => updateProduct(p.id, { overlayAlt: v })}
                        placeholder='e.g. "Best seller" — leave blank if purely decorative'
                        testid={`pgrid-overlay-alt-${p.id}`}
                      />
                      <SelectField
                        label="Overlay position"
                        value={p.overlayPosition || "top-left"}
                        onChange={(v) =>
                          updateProduct(p.id, { overlayPosition: v })
                        }
                        options={[
                          { value: "top-left", label: "Top left" },
                          { value: "top-right", label: "Top right" },
                          { value: "bottom-left", label: "Bottom left" },
                          { value: "bottom-right", label: "Bottom right" },
                        ]}
                        testid={`pgrid-overlay-pos-${p.id}`}
                      />
                      <SliderField
                        label="Overlay size"
                        value={Number(p.overlaySize) || 38}
                        min={10}
                        max={80}
                        suffix="% of card"
                        onChange={(v) =>
                          updateProduct(p.id, { overlaySize: v })
                        }
                        testid={`pgrid-overlay-size-${p.id}`}
                      />
                    </>
                  ) : null}
                </div>
              )}
            </>
          )}
        />
      </div>
    </FormAccordion>
  );
}

export const productGrid = {
  id: ID,
  name: "Product Grid",
  description: "Static grid of product cards (2-6 per row, wraps to multiple rows)",
  icon: LayoutGrid,
  defaults,
  render,
  FormPanel,
};
