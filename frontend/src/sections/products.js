/**
 * Product Carousel — horizontal scroll with prev/next arrows.
 * Supports 4 or 5 columns. Per-card image, name, price, link.
 */
import { useState } from "react";
import { ShoppingBag, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  iife,
  makeUid,
  num,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import {
  TextField,
  SliderField,
  SelectField,
  ToggleField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const ID = "products";

const sampleProduct = () => ({
  id: makeUid(),
  name: "",
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
  title: "Top offers this week",
  titleColor: "#1f2937",
  eyebrowColor: "#E01839",
  priceColor: "#E01839",
  hoverBorder: "#E01839",
  columns: 5,
  showArrows: true,
  paddingY: 60,
  fullBleed: false,
  products: [],
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-products-${uid}`;
  const cols = Number(cfg.columns) === 4 ? 4 : 5;
  const gap = 18;

  const styleVars = [
    `--ns-title-color:${safeColor(cfg.titleColor, "#1f2937")}`,
    `--ns-eyebrow-color:${safeColor(cfg.eyebrowColor || cfg.priceColor, "#E01839")}`,
    `--ns-price-color:${safeColor(cfg.priceColor, "#E01839")}`,
    `--ns-hover-border:${safeColor(cfg.hoverBorder, "#E01839")}`,
    `--ns-pad:${num(cfg.paddingY, 60)}px`,
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
      <h3 class="ns-name">${escHtml(p.name || "")}</h3>
      <p class="ns-price"><span class="ns-price-amount">${escHtml(p.price || "")}</span>${p.priceSuffix ? `<span class="ns-price-suffix">${escHtml(p.priceSuffix)}</span>` : ""}</p>
    </div>
  </a>
</div>`;
    })
    .join("");

  const arrowsHtml = cfg.showArrows
    ? `<button class="ns-arrow ns-prev" type="button" data-ns-prev aria-label="Previous">‹</button>
<button class="ns-arrow ns-next" type="button" data-ns-next aria-label="Next">›</button>`
    : "";

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad) 20px;width:100%;background:#fff}
.${cls} .ns-wrap{max-width:1200px;margin:0 auto;position:relative}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-eyebrow-color);text-align:center;margin:0 0 10px}
.${cls} .ns-h{font-size:32px;font-weight:600;color:var(--ns-title-color);text-align:center;margin:0 0 28px}
.${cls} .ns-track{display:flex;align-items:stretch;gap:var(--ns-gap);overflow-x:auto;scroll-behavior:smooth;scrollbar-width:none;-ms-overflow-style:none}
.${cls} .ns-track::-webkit-scrollbar{display:none}
.${cls} .ns-card{flex:0 0 calc((100% - (var(--ns-cols) - 1) * var(--ns-gap)) / var(--ns-cols));border:1px solid #f2f2f2;border-radius:6px;background:#fff;overflow:hidden;transition:border-color .2s ease,box-shadow .2s ease;display:flex}
.${cls} .ns-card:hover{border-color:var(--ns-hover-border);box-shadow:0 4px 18px rgba(0,0,0,.06)}
.${cls} .ns-card a{display:flex;flex-direction:column;width:100%;color:inherit;text-decoration:none}
.${cls} .ns-image-wrap{position:relative;flex-shrink:0}
.${cls} .ns-image-wrap > img{width:100%;height:170px;object-fit:contain;padding:16px;display:block}
.${cls} .ns-overlay{position:absolute;height:auto;width:auto;pointer-events:none;z-index:2}
.${cls} .ns-overlay-top-left{top:0;left:0}
.${cls} .ns-overlay-top-right{top:0;right:0}
.${cls} .ns-overlay-bottom-left{bottom:0;left:0}
.${cls} .ns-overlay-bottom-right{bottom:0;right:0}
.${cls} .ns-card-body{padding:0 16px 18px;display:flex;flex-direction:column;flex:1 1 auto}
.${cls} .ns-name{font-size:15px;line-height:1.4;font-weight:500;color:#1f1f1f;margin:0 0 12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:42px}
.${cls} .ns-price{font-size:18px;font-weight:600;color:var(--ns-price-color);margin:auto 0 0}
.${cls} .ns-price-amount{display:inline-block}
.${cls} .ns-price-suffix{font-size:12px;font-weight:400;color:#6b7280;margin-left:4px}
.${cls} .ns-arrow{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;border:1px solid #f2f2f2;background:#fff;color:var(--ns-price-color);font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.08);z-index:3;transition:background .15s ease}
.${cls} .ns-arrow:hover{background:#f8fafc}
.${cls} .ns-prev{left:-18px}
.${cls} .ns-next{right:-18px}
@media (max-width:1024px){.${cls} .ns-card{flex-basis:calc((100% - 36px) / 3)}}
@media (max-width:640px){.${cls} .ns-card{flex-basis:80%}.${cls} .ns-prev{left:0}.${cls} .ns-next{right:0}}
`.trim();

  const html = `<section class="ns-products ${cls}${fullBleedClass(cfg)}" style="${styleVars}">
  <div class="ns-wrap">
    ${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}
    <h2 class="ns-h">${escHtml(cfg.title)}</h2>
    ${arrowsHtml}
    <div class="ns-track" data-ns-track>
      ${cardsHtml}
    </div>
  </div>
</section>`;

  const apiBase = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
  // Live price refresh: for cards marked with data-ns-src, periodically
  // call the scrape endpoint and update the price text. Cached 30 min in
  // localStorage. Failures are silent so the snippet always renders.
  //
  // Also reactive to the host page's VAT toggle. We intentionally keep
  // the detection logic broad so this works on ANY Nettailer-flavoured
  // host (not just demo.nettailer.com):
  //
  //   1. `vatMode()` reads three independent signals — label text, then
  //      `.vat-switcher` data/class/aria attributes, then a body-level
  //      class. Whichever the storefront uses, we'll pick it up.
  //   2. A broad MutationObserver on `document.body` watches text +
  //      class + data + aria changes so we catch node-replacement
  //      toggles (where the switcher element is re-rendered, not
  //      mutated) as well as text-only toggles.
  //   3. A 500ms polling fallback guarantees the toggle still flips
  //      prices on any host whose DOM updates we don't observe (e.g.
  //      JS-driven state held outside the DOM).
  //
  // The first scrape pre-warms both `::incl` and `::excl` keys in
  // localStorage, so a toggle flips prices instantly from cache (no
  // round-trip) — we call `fetchOne(c, false)` on mode change to hit
  // that cache first and fall back to the backend only on miss.
  const liveJs = apiBase
    ? `var TTL=18e5,API=${JSON.stringify(apiBase + "/api/scrape-product")};` +
      `function vatMode(){try{` +
        // 1. Label text (works on demo.nettailer.com and standard skins).
        `var el=document.querySelector(".vat-switcher-label");` +
        `if(el){var t=(el.textContent||"").toLowerCase();` +
          `if(t.indexOf("incl")>=0)return"incl";` +
          `if(t.indexOf("excl")>=0)return"excl";}` +
        // 2. .vat-switcher data/class/aria attributes (covers skins
        // that replace the label node on toggle, or signal state via
        // attributes instead of text).
        `var sw=document.querySelector(".vat-switcher");` +
        `if(sw){` +
          `var ds=(sw.getAttribute("data-state")||sw.getAttribute("data-vat")||sw.getAttribute("aria-pressed")||"").toLowerCase();` +
          `if(ds.indexOf("incl")>=0||ds==="true")return"incl";` +
          `if(ds.indexOf("excl")>=0||ds==="false")return"excl";` +
          `var cn=(sw.className||"").toLowerCase();` +
          `if(cn.indexOf("incl")>=0||cn.indexOf("inc-vat")>=0)return"incl";` +
          `if(cn.indexOf("excl")>=0||cn.indexOf("exc-vat")>=0)return"excl";}` +
        // 3. Body-level class (some white-labels toggle on <body>).
        `var bc=(document.body.className||"").toLowerCase();` +
        `if(bc.indexOf("inc-vat")>=0||bc.indexOf("incl-vat")>=0)return"incl";` +
        `if(bc.indexOf("exc-vat")>=0||bc.indexOf("excl-vat")>=0)return"excl";` +
      `}catch(e){}return null;}` +
      `function ckey(u,m){return"ns-px:"+u+"::"+(m||"default");}` +
      `function fetchOne(card,force){var u=card.getAttribute("data-ns-src");if(!u)return;var m=vatMode();var k=ckey(u,m),now=Date.now(),amt=card.querySelector(".ns-price-amount"),sfx=card.querySelector(".ns-price-suffix");function paint(p){if(amt&&p)amt.textContent=p;if(sfx&&m){var s=(sfx.textContent||"").toLowerCase();if(s.indexOf("vat")>=0){sfx.textContent=m==="incl"?"Incl VAT":"Excl VAT";}}}if(!force){try{var c=JSON.parse(localStorage.getItem(k)||"null");if(c&&c.t&&now-c.t<TTL){if(c.p)paint(c.p);return;}}catch(e){}}` +
      `fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:u,vat_mode:m})}).then(function(r){return r.ok?r.json():null;}).then(function(d){if(!d||!d.price)return;paint(d.price);try{localStorage.setItem(k,JSON.stringify({t:now,p:d.price}));if(d.priceInc)localStorage.setItem(ckey(u,"incl"),JSON.stringify({t:now,p:d.priceInc}));if(d.priceExc)localStorage.setItem(ckey(u,"excl"),JSON.stringify({t:now,p:d.priceExc}));}catch(e){}}).catch(function(){});}` +
      `var live=root.querySelectorAll(".ns-card[data-ns-src]");if(live.length&&typeof fetch==="function"){live.forEach(function(c){fetchOne(c,false);});` +
      // Watch for VAT-toggle changes via a broad MutationObserver +
      // polling fallback. Both call the same tick() which short-circuits
      // when the detected mode hasn't actually changed, so the combined
      // cost is two cheap DOM reads per change at most.
      `var lastV=vatMode();function tick(){var v=vatMode();if(v===lastV)return;lastV=v;live.forEach(function(c){fetchOne(c,false);});}` +
      `try{if(typeof MutationObserver!=="undefined"){var mo=new MutationObserver(tick);mo.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class","data-state","data-vat","aria-pressed","aria-checked"]});}}catch(e){}` +
      `setInterval(tick,500);` +
      `}`
    : "";

  const js = iife(
    cls,
    `var track=root.querySelector("[data-ns-track]");var prev=root.querySelector("[data-ns-prev]");var next=root.querySelector("[data-ns-next]");if(track){function step(dir){var c=track.querySelector(".ns-card");if(!c)return;var amt=c.offsetWidth+18;track.scrollBy({left:dir*amt,behavior:"smooth"});}if(prev)prev.addEventListener("click",function(){step(-1);});if(next)next.addEventListener("click",function(){step(1);});}${liveJs}`
  );

  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetching, setFetching] = useState(false);

  const addProduct = () =>
    onUpdate({
      products: [...config.products, sampleProduct()],
    });
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
    if (!url) {
      toast.error("Paste a product URL first");
      return;
    }
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
      if (!res.ok) {
        throw new Error(data?.detail || "Fetch failed");
      }
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
      if (!data.image) {
        toast.success(`Added "${newProduct.name}" — please upload an image`);
      } else {
        toast.success(`Added "${newProduct.name}"`);
      }
    } catch (e) {
      toast.error(e.message || "Could not fetch product");
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-5">
      <Group title="Header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="products-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.title}
          onChange={(v) => onUpdate({ title: v })}
          testid="products-title"
        />
      </Group>

      <Group title="Layout">
        <SelectField
          label="Columns"
          value={config.columns}
          onChange={(v) => onUpdate({ columns: Number(v) })}
          options={[
            { value: 4, label: "4 columns" },
            { value: 5, label: "5 columns" },
          ]}
          testid="products-columns"
        />
        <ToggleField
          label="Show arrows"
          checked={config.showArrows}
          onChange={(v) => onUpdate({ showArrows: v })}
          testid="products-arrows"
        />
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="products-full-bleed"
        />
        <SliderField
          label="Vertical padding"
          value={config.paddingY}
          min={20}
          max={120}
          suffix="px"
          onChange={(v) => onUpdate({ paddingY: v })}
          testid="products-pad"
        />
      </Group>

      <Group title="Theme">
        <ColorField
          label="Eyebrow color"
          value={config.eyebrowColor || config.priceColor}
          onChange={(v) => onUpdate({ eyebrowColor: v })}
          testid="products-eyebrow-color"
        />
        <ColorField
          label="Heading color"
          value={config.titleColor}
          onChange={(v) => onUpdate({ titleColor: v })}
          testid="products-title-color"
        />
        <ColorField
          label="Price color"
          value={config.priceColor}
          onChange={(v) => onUpdate({ priceColor: v })}
          testid="products-price-color"
        />
        <ColorField
          label="Card hover border"
          value={config.hoverBorder}
          onChange={(v) => onUpdate({ hoverBorder: v })}
          testid="products-hover"
        />
      </Group>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Products ({config.products.length})
        </h3>

        <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
          <Label
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
            data-testid="product-fetch-label"
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
              data-testid="product-fetch-url-input"
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
              data-testid="product-fetch-button"
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
          testidPrefix="product"
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
                  testid={`product-image-${p.id}`}
                  compact
                />
              </div>
              <TextField
                label="Image alt text (optional)"
                value={p.imageAlt || ""}
                onChange={(v) => updateProduct(p.id, { imageAlt: v })}
                placeholder="Falls back to the product name"
                testid={`product-image-alt-${p.id}`}
              />
              <TextField
                label="Name"
                value={p.name}
                onChange={(v) => updateProduct(p.id, { name: v })}
                testid={`product-name-${p.id}`}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Price"
                  value={p.price}
                  onChange={(v) =>
                    updateProduct(p.id, {
                      price: v,
                      // Manually editing the price implies the user
                      // wants that exact value — turn off the snippet's
                      // 30-min live refresh so it doesn't get clobbered
                      // by the next scrape. They can re-enable below.
                      liveRefresh: false,
                    })
                  }
                  testid={`product-price-${p.id}`}
                />
                <TextField
                  label="Price suffix"
                  value={p.priceSuffix}
                  onChange={(v) => updateProduct(p.id, { priceSuffix: v })}
                  testid={`product-suffix-${p.id}`}
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
                onChange={(v) =>
                  updateProduct(p.id, { liveRefresh: v })
                }
                testid={`product-live-refresh-${p.id}`}
              />
              <TextField
                label="Link"
                value={p.link}
                onChange={(v) => updateProduct(p.id, { link: v })}
                testid={`product-link-${p.id}`}
              />
              <ToggleField
                label="Open in same tab"
                checked={p.openInSameTab}
                onChange={(v) =>
                  updateProduct(p.id, { openInSameTab: v })
                }
                testid={`product-same-tab-${p.id}`}
              />
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Overlay badge (optional)
                </Label>
                <p className="text-xs text-slate-500 mt-1 mb-2">
                  An optional badge image (e.g. "In stock") layered over the
                  product photo. Auto-detected when fetching from a URL.
                </p>
                <ImageUpload
                  value={p.overlay}
                  onChange={(v) => updateProduct(p.id, { overlay: v })}
                  testid={`product-overlay-${p.id}`}
                  compact
                />
              </div>
              {p.overlay ? (
                <>
                  <TextField
                    label="Overlay alt text (optional)"
                    value={p.overlayAlt || ""}
                    onChange={(v) => updateProduct(p.id, { overlayAlt: v })}
                    placeholder='e.g. "In stock" — leave blank if purely decorative'
                    testid={`product-overlay-alt-${p.id}`}
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
                    testid={`product-overlay-pos-${p.id}`}
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
                    testid={`product-overlay-size-${p.id}`}
                  />
                </>
              ) : null}
            </>
          )}
        />
      </div>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export const products = {
  id: ID,
  name: "Product Carousel",
  description: "Horizontal scroll product cards",
  icon: ShoppingBag,
  defaults,
  render,
  FormPanel,
};
