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

const NETTAILER_PRODUCTS = [
  {
    name: "HP ZBook Firefly 16 G11",
    price: "£1,546.80",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Razer Huntsman Keyboard",
    price: "£300.00",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Apple iPhone 17 Pro Max",
    price: "£2,167.90",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Samsung Odyssey OLED G9",
    price: "£1,523.50",
    image: "https://images.unsplash.com/photo-1527443195645-1133f7f28990?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Lenovo Yoga 6 13ALC6",
    price: "£434.00",
    image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Microsoft Surface Pro Copilot+",
    price: "£1,415.20",
    image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?q=80&w=600&auto=format&fit=crop",
  },
];

const sampleProduct = (i = 1) => {
  const tmpl = NETTAILER_PRODUCTS[(i - 1) % NETTAILER_PRODUCTS.length];
  return {
    id: makeUid(),
    name: tmpl.name,
    price: tmpl.price,
    priceSuffix: "Excl VAT",
    image: tmpl.image,
    link: "#",
  };
};

const defaults = () => ({
  uid: makeUid(),
  title: "Top offers this week",
  titleColor: "#1f2937",
  priceColor: "#E01839",
  hoverBorder: "#E01839",
  columns: 5,
  showArrows: true,
  paddingY: 60,
  fullBleed: false,
  products: Array.from({ length: 6 }, (_, i) => sampleProduct(i + 1)),
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-products-${uid}`;
  const cols = Number(cfg.columns) === 4 ? 4 : 5;
  const gap = 18;

  const styleVars = [
    `--ns-title-color:${cfg.titleColor}`,
    `--ns-price-color:${cfg.priceColor}`,
    `--ns-hover-border:${cfg.hoverBorder}`,
    `--ns-pad:${cfg.paddingY}px`,
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
      return `<div class="ns-card"${liveAttr}>
  <a href="${escAttr(link)}" target="${target}"${rel}>
    <img src="${escAttr(img)}" alt="${escAttr(p.name || "")}"/>
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
.${cls} .ns-h{font-size:32px;font-weight:600;color:var(--ns-title-color);text-align:center;margin:0 0 28px}
.${cls} .ns-track{display:flex;align-items:stretch;gap:var(--ns-gap);overflow-x:auto;scroll-behavior:smooth;scrollbar-width:none;-ms-overflow-style:none}
.${cls} .ns-track::-webkit-scrollbar{display:none}
.${cls} .ns-card{flex:0 0 calc((100% - (var(--ns-cols) - 1) * var(--ns-gap)) / var(--ns-cols));border:1px solid #f2f2f2;border-radius:6px;background:#fff;overflow:hidden;transition:border-color .2s ease,box-shadow .2s ease;display:flex}
.${cls} .ns-card:hover{border-color:var(--ns-hover-border);box-shadow:0 4px 18px rgba(0,0,0,.06)}
.${cls} .ns-card a{display:flex;flex-direction:column;width:100%;color:inherit;text-decoration:none}
.${cls} .ns-card img{width:100%;height:170px;object-fit:contain;padding:16px;display:block;flex-shrink:0}
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
  const liveJs = apiBase
    ? `var TTL=18e5,API=${JSON.stringify(apiBase + "/api/scrape-product")};var live=root.querySelectorAll(".ns-card[data-ns-src]");if(live.length&&typeof fetch==="function"){live.forEach(function(card){var u=card.getAttribute("data-ns-src");if(!u)return;var k="ns-px:"+u,now=Date.now(),amt=card.querySelector(".ns-price-amount");function paint(p){if(amt&&p)amt.textContent=p;}try{var c=JSON.parse(localStorage.getItem(k)||"null");if(c&&c.t&&now-c.t<TTL){if(c.p)paint(c.p);return;}}catch(e){}fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:u})}).then(function(r){return r.ok?r.json():null;}).then(function(d){if(!d||!d.price)return;paint(d.price);try{localStorage.setItem(k,JSON.stringify({t:now,p:d.price}));}catch(e){}}).catch(function(){});});}`
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
      products: [
        ...config.products,
        sampleProduct(config.products.length + 1),
      ],
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
      <Group title="Section">
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="products-full-bleed"
        />
        <TextField
          label="Title"
          value={config.title}
          onChange={(v) => onUpdate({ title: v })}
          testid="products-title"
        />
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
        <ColorField
          label="Title color"
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
        <ToggleField
          label="Show arrows"
          checked={config.showArrows}
          onChange={(v) => onUpdate({ showArrows: v })}
          testid="products-arrows"
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
                label="Name"
                value={p.name}
                onChange={(v) => updateProduct(p.id, { name: v })}
                testid={`product-name-${p.id}`}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Price"
                  value={p.price}
                  onChange={(v) => updateProduct(p.id, { price: v })}
                  testid={`product-price-${p.id}`}
                />
                <TextField
                  label="Price suffix"
                  value={p.priceSuffix}
                  onChange={(v) => updateProduct(p.id, { priceSuffix: v })}
                  testid={`product-suffix-${p.id}`}
                />
              </div>
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
