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
  infiniteScrollJs,
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

const ID = "products";

/**
 * Coerces a stored per-product description into safe HTML for rendering
 * / Tiptap loading. Mirrors the FAQ section's `coerceAnswerHtml`:
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
  // Optional per-card eyebrow — short uppercase label rendered above
  // the product name in the section's `eyebrowColor`. Use it for
  // category tags ("AI ENABLED", "FOR EDUCATION"), badge-style status
  // ("EXCLUSIVE"), or product line ("PRO SERIES"). Empty by default;
  // the renderer suppresses the wrapper element when blank.
  eyebrow: "",
  // Optional rich-text blurb shown between the name and the price.
  // HTML payload from the same Tiptap editor used by FAQ answers and
  // Rich-text blocks — bold / italic / lists / links. Empty by default;
  // the renderer suppresses the wrapper element when blank.
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
  title: "Top offers this week",
  titleColor: "#1f2937",
  eyebrowColor: "#E01839",
  priceColor: "#E01839",
  hoverBorder: "#E01839",
  columns: 5,
  showArrows: true,
  // Carousel autoplay — off by default; if turned on, the section
  // auto-advances by one card every `autoplayInterval` ms.
  autoplay: false,
  autoplayInterval: 4000,
  pauseOnHover: true,
  paddingY: 60,
  paddingTop: 60,
  paddingBottom: 60,
  fullBleed: false,
  // Heading + eyebrow alignment across the section width.
  // "left" | "center" | "right" — defaults to left so new sections
  // read like a normal article header. baseReset forces h-tags to
  // inherit text-align, so this value is applied to `.ns-wrap`.
  textAlign: "left",
  // Horizontal alignment of the per-card body content (eyebrow,
  // name, description, price). Independent of the section-level
  // `textAlign` (which only affects the section heading + eyebrow at
  // the top). "left" matches the historical look; "center" mimics
  // the layout where every card reads like a small product page.
  cardTextAlign: "left",
  // Vertical gap between the product name and the description (or
  // the price, when no description is set). Surfaced as a slider in
  // the editor so authors can dial in the card density they want —
  // tighter on shop fronts, more breathing room on storytelling
  // landing pages. Default of 12px matches the historical look.
  nameSpacing: 12,
  // "" = Auto (use whatever the scraper / user input already shows).
  // Anything else REPLACES the leading currency token on every rendered
  // price, including live-refreshed prices. See `swapCur` in the snippet
  // JS below.
  currencyOverride: "",
  products: [],
});

// The exact strings we'll prepend when an override is active. Trailing
// space (where present) gives "kr 1234.56" rather than "kr1234.56".
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
  const cls = `ns-products-${uid}`;
  const cols = Number(cfg.columns) === 4 ? 4 : 5;
  const gap = 18;
  const align = cfg.textAlign === "center" || cfg.textAlign === "right" ? cfg.textAlign : "left";
  // Per-card body alignment — drives `.ns-card-body` text-align so the
  // eyebrow / name / description / price all centre (or right-align)
  // together. Description bullet markers are kept LEFT-aligned via an
  // override on .ns-desc ul/ol so list lines don't end up centred with
  // floating bullets — same pattern as richtext.js.
  const cardAlign = cfg.cardTextAlign === "center" || cfg.cardTextAlign === "right" ? cfg.cardTextAlign : "left";

  // Currency override — empty means "Auto" (use whatever the scraper or
  // editor produced). Matching JS in the IIFE below uses the SAME regex
  // so server-rendered prices and live-refreshed prices stay consistent.
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

  const arrowsHtml = cfg.showArrows
    ? `<button class="ns-arrow ns-prev" type="button" data-ns-prev aria-label="Previous">‹</button>
<button class="ns-arrow ns-next" type="button" data-ns-next aria-label="Next">›</button>`
    : "";

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad-t) 20px var(--ns-pad-b);width:100%;background:#fff}
.${cls} .ns-wrap{max-width:1200px;margin:0 auto;position:relative;text-align:${align}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-eyebrow-color);margin:0 0 10px}
.${cls} .ns-h{font-size:var(--ns-heading-size,32px);font-weight:600;color:var(--ns-title-color);margin:0 0 28px}
.${cls} .ns-track{display:flex;align-items:stretch;gap:var(--ns-gap);overflow-x:auto;scroll-behavior:smooth;scrollbar-width:none;-ms-overflow-style:none;text-align:left}
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
.${cls} .ns-card-body{padding:0 16px 18px;display:flex;flex-direction:column;flex:1 1 auto;text-align:${cardAlign}}
.${cls} .ns-card-eyebrow{font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--ns-eyebrow-color);margin:0 0 6px}
.${cls} .ns-name{font-size:15px;line-height:1.4;font-weight:500;color:#1f1f1f;margin:0 0 ${num(cfg.nameSpacing, 12)}px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.${cls} .ns-desc{font-size:13px;line-height:1.55;color:#4b5563;margin:0 0 12px}
.${cls} .ns-desc>*:first-child{margin-top:0}
.${cls} .ns-desc>*:last-child{margin-bottom:0}
.${cls} .ns-desc p{margin:0 0 8px}
.${cls} .ns-desc strong{font-weight:600;color:#1f1f1f}
.${cls} .ns-desc em{font-style:italic}
.${cls} .ns-desc ul,.${cls} .ns-desc ol{margin:0 0 8px;padding-left:20px${cardAlign === "center" ? ";text-align:left;display:inline-block" : ""}}
.${cls} .ns-desc ul{list-style:disc!important}
.${cls} .ns-desc ol{list-style:decimal!important}
.${cls} .ns-desc li{display:list-item;margin:0 0 4px}
.${cls} .ns-desc li>p{margin:0}
.${cls} .ns-desc a{color:var(--ns-price-color);text-decoration:underline;text-underline-offset:2px}
.${cls} .ns-desc a:hover{opacity:.85}
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

  const html = `<section class="ns-products ${cls}${fullBleedClass(cfg)}" style="${styleVars}" data-ns-autoplay="${cfg.autoplay ? "1" : "0"}" data-ns-interval="${num(cfg.autoplayInterval, 4000)}" data-ns-poh="${cfg.pauseOnHover === false ? "0" : "1"}">
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
  // Live price refresh + VAT-toggle reactivity. Logic lives in
  // `./productLive.js` so the Product Grid section can reuse it byte-
  // for-byte. See that file for the full design notes.
  const liveJs = productLiveJs({ cur, apiBase });

  const js = iife(
    cls,
    `${infiniteScrollJs()}${liveJs}`
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
    <FormAccordion sectionType="products">
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
        <SelectField
          label="Heading alignment"
          value={config.textAlign || "left"}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          testid="products-text-align"
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
          testid="products-card-text-align"
        />
      </Group>

      <Group title="Defaults" value="defaults">
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
          label="Autoplay"
          description="Auto-advance through cards on a timer"
          checked={!!config.autoplay}
          onChange={(v) => onUpdate({ autoplay: v })}
          testid="products-autoplay"
        />
        {config.autoplay ? (
          <>
            <SliderField
              label="Interval"
              value={Number(config.autoplayInterval) || 4000}
              min={2000}
              max={12000}
              step={500}
              suffix="ms"
              onChange={(v) => onUpdate({ autoplayInterval: v })}
              testid="products-autoplay-interval"
            />
            <ToggleField
              label="Pause on hover"
              checked={config.pauseOnHover !== false}
              onChange={(v) => onUpdate({ pauseOnHover: v })}
              testid="products-pause-on-hover"
            />
          </>
        ) : null}
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="products-full-bleed"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={60}
          min={20}
          max={120}
          testidPrefix="products"
        />
        <SliderField
          label="Heading size"
          value={Number(config.headingSize) || 32}
          min={20}
          max={72}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="products-heading-size"
        />
        <SliderField
          label="Space below product name"
          value={Number(config.nameSpacing ?? 12)}
          min={0}
          max={40}
          suffix="px"
          onChange={(v) => onUpdate({ nameSpacing: v })}
          testid="products-name-spacing"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
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
        <SelectField
          label="Currency"
          value={config.currencyOverride ?? ""}
          onChange={(v) => onUpdate({ currencyOverride: v })}
          options={CURRENCY_OPTIONS}
          testid="products-currency-override"
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
                label="Eyebrow (optional)"
                placeholder='e.g. "AI ENABLED" or "EXCLUSIVE"'
                value={p.eyebrow || ""}
                onChange={(v) => updateProduct(p.id, { eyebrow: v })}
                testid={`product-eyebrow-${p.id}`}
              />
              <TextField
                label="Name"
                value={p.name}
                onChange={(v) => updateProduct(p.id, { name: v })}
                testid={`product-name-${p.id}`}
              />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <RichTextEditor
                  html={coerceDescHtml(p.description)}
                  onChange={(v) => updateProduct(p.id, { description: v })}
                  tools={["bold", "italic", "ul", "ol", "link"]}
                />
                <p className="text-[11px] text-slate-500">
                  Short blurb shown between the product name and price. Select
                  text to add links, bold or italics — links inherit the card's
                  price colour by default.
                </p>
              </div>
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
              <ToggleField
                label="Add corner badge"
                description='A small graphic in a corner of the card (e.g. "In stock", "Sale"). Not the product photo — use the Image field above for that.'
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
                testid={`product-overlay-toggle-${p.id}`}
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
                </div>
              )}
            </>
          )}
        />
      </div>
    </FormAccordion>
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
