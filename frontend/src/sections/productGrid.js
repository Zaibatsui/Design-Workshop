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

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
const API_BASE = process.env.REACT_APP_BACKEND_URL;

const ID = "productGrid";

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
  title: "Trending products",
  titleColor: "#1f2937",
  eyebrowColor: "#E01839",
  priceColor: "#E01839",
  hoverBorder: "#E01839",
  columns: 4,
  paddingY: 60,
  fullBleed: false,
  textAlign: "left",
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
      <p class="ns-price"><span class="ns-price-amount">${escHtml(applyCur(p.price) || "")}</span>${p.priceSuffix ? `<span class="ns-price-suffix">${escHtml(p.priceSuffix)}</span>` : ""}</p>
    </div>
  </a>
</div>`;
    })
    .join("");

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad) 20px;width:100%;background:#fff}
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
.${cls} .ns-card-body{padding:0 16px 18px;display:flex;flex-direction:column;flex:1 1 auto}
.${cls} .ns-name{font-size:15px;line-height:1.4;font-weight:500;color:#1f1f1f;margin:0 0 12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:42px}
.${cls} .ns-price{font-size:18px;font-weight:600;color:var(--ns-price-color);margin:auto 0 0}
.${cls} .ns-price-amount{display:inline-block}
.${cls} .ns-price-suffix{font-size:12px;font-weight:400;color:#6b7280;margin-left:4px}
@media (max-width:1024px){.${cls} .ns-grid{grid-template-columns:repeat(${Math.min(cols, 3)},1fr)}}
@media (max-width:640px){.${cls} .ns-grid{grid-template-columns:repeat(${Math.min(cols, 2)},1fr)}}
`.trim();

  const html = `<section class="ns-pgrid ${cls}${fullBleedClass(cfg)}" style="${styleVars}">
  <div class="ns-wrap">
    ${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}
    <h2 class="ns-h">${escHtml(cfg.title)}</h2>
    <div class="ns-grid">
      ${cardsHtml}
    </div>
  </div>
</section>`;

  // Live price refresh — reuse the same logic as the Product Carousel.
  // For cards marked data-ns-src, scrape every 30 min, with same-origin
  // credentialed fallback for gated prices.
  const apiBase = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
  const liveJs =
    cardsHtml.indexOf("data-ns-src") >= 0
      ? `var live=root.querySelectorAll(".ns-card[data-ns-src]");if(live.length&&typeof fetch==="function"){live.forEach(function(c){fetchOne(c,false);setTimeout(function(){tryGated(c);},150);});}
function key(u){return"nsprice:"+u;}
function classify(t){if(!t)return null;var s=String(t).toLowerCase();if(/excl|exklusive|ex\\.\\s*vat|moms|netto/.test(s))return"excl";if(/incl|inklusive|inc\\.\\s*vat|tax|brutto/.test(s))return"incl";return null;}
function vatLabel(mode){return mode==="incl"?"Incl VAT":"Excl VAT";}
var CUR=${JSON.stringify(cur)};
var STRIP_RE=/^\\s*(?:[£$€¥₹₪₺₽]+|GBP|USD|EUR|JPY|SEK|NOK|DKK|CHF|AUD|CAD|NZD|HKD|SGD|kr|zł|Kč|Ft|R\\$|AED|SAR|ZAR|INR|PLN|CZK|HUF|RUB|TRY|ILS|CNY|MXN|BRL)\\s*/i;
function swapCur(p){return CUR?CUR+String(p||"").replace(STRIP_RE,""):p;}
function paint(card,p){var amt=card.querySelector(".ns-price-amount");var sfx=card.querySelector(".ns-price-suffix");if(amt&&p)amt.textContent=swapCur(p);var m=window.__nsVat||null;if(sfx&&m&&classify(sfx.textContent)!==null)sfx.textContent=vatLabel(m);}
function fromCache(u){try{var raw=localStorage.getItem(key(u));if(!raw)return null;var o=JSON.parse(raw);if(!o||!o.t)return null;if(Date.now()-o.t>1800000)return null;return o;}catch(e){return null;}}
function toCache(u,v){try{localStorage.setItem(key(u),JSON.stringify({t:Date.now(),v:v}));}catch(e){}}
function fetchOne(card,force){var u=card.getAttribute("data-ns-src");if(!u)return;if(!force){var c=fromCache(u);if(c){paint(card,c.v);return;}}fetch("${apiBase}/api/scrape-product?url="+encodeURIComponent(u)).then(function(r){return r.json();}).then(function(d){if(d&&d.price){toCache(u,d.price);paint(card,d.price);}}).catch(function(){});}
function tryGated(card){var u=card.getAttribute("data-ns-src");if(!u)return;try{var origin=new URL(u).origin;if(origin!==location.origin)return;}catch(e){return;}fetch(u,{credentials:"include"}).then(function(r){return r.text();}).then(function(t){var m=t.match(/(?:[£$€¥₹]\\s?|kr\\s?)([\\d.,]{3,})/i);if(m){var price=m[0].replace(/\\s+/g," ").trim();paint(card,price);}}).catch(function(){});}
setInterval(function(){live.forEach(function(c){fetchOne(c,true);});},1800000);
window.addEventListener("storage",function(e){if(e.key==="__nsVat")live.forEach(function(c){fetchOne(c,false);});});`
      : "";

  const js = liveJs ? iife(cls, liveJs) : "";

  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
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
      </Group>

      <Group title="Layout">
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
        <SliderField
          label="Vertical padding"
          value={config.paddingY}
          min={20}
          max={120}
          suffix="px"
          onChange={(v) => onUpdate({ paddingY: v })}
          testid="pgrid-pad"
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
      </Group>

      <Group title="Theme">
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
                label="Name"
                value={p.name}
                onChange={(v) => updateProduct(p.id, { name: v })}
                testid={`pgrid-name-${p.id}`}
              />
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
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Overlay badge (optional)
                </Label>
                <p className="text-xs text-slate-500 mt-1 mb-2">
                  An optional badge image (e.g. "Best seller") layered over the
                  product photo. Auto-detected when fetching from a URL.
                </p>
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
