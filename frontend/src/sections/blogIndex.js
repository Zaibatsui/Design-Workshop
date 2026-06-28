/*
 * Blog Index — searchable grid of blog post cards.
 *
 * Built from the same DNA as the Brand Grid section (full-bleed
 * optional photo header, in-header or below-grid search input,
 * left/centre/right card alignment, lift / accent-bar / none hover
 * affordances, click-to-edit, full Brand Kit cascade) but swaps the
 * per-card shape from brand-logo cards to blog-post cards: image,
 * date + author meta line, headline, excerpt.
 *
 * Per user preference: no chip-style category filter — the search
 * input is the only discovery surface. Cards have an optional
 * `category` text field that's included in the search haystack so
 * typing "Networking" still narrows the list.
 *
 * No external runtime libs. Pure HTML/CSS/JS in a scoped IIFE.
 */
import { Newspaper } from "lucide-react";
import {
  FONT_IMPORT,
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  makeUid,
  num,
  padTopOf,
  padBotOf,
  padXOf,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import ListEditor from "@/components/ListEditor";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import { Label } from "@/components/ui/label";
import { FormAccordion, FormGroup } from "@/components/FormGroup";
import {
  SelectField,
  SliderField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/FormFields";
import PaddingFields from "@/components/PaddingFields";

const ID = "blog-index";

// Reasonably neutral office / editorial stock photos for the demo
// posts — same Unsplash CDN every other section uses for placeholders.
const PH = (id) => `https://images.unsplash.com/${id}?q=80&w=1200&auto=format&fit=crop`;

const DEFAULT_HEADER_IMAGE =
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1600&auto=format&fit=crop";

const SEARCH_ALIGN_TO_FLEX = { left: "flex-start", center: "center", right: "flex-end" };

const defaults = () => ({
  // Section header
  eyebrow: "INSIGHTS",
  heading: "From the blog",
  subheading: "Latest thinking on infrastructure, security and the unglamorous decisions that keep teams shipping.",

  // Header background — ships with a real photo so the section
  // reads as a finished blog landing the moment you drop it in.
  headerImage: DEFAULT_HEADER_IMAGE,
  headerImageAlt: "Editorial workspace",
  headerHeight: 360,
  headerRadius: null,
  overlayType: "solid",
  headerOverlayColor: "#0f172a",
  headerOverlayOpacity: 0.55,
  overlayGradientFrom: "#0f172a",
  overlayGradientTo: "rgba(15,23,42,0)",
  overlayGradientAngle: 180,
  headerTextColor: "#ffffff",

  // Posts. Order in the list = render order. `category` is metadata
  // shown in the meta line + included in the search haystack — no
  // chip-style filter UI.
  items: [
    {
      id: "p1",
      title: "How to scale a video surveillance estate without rebuilding",
      excerpt: "A practical framework for layering new cameras and storage onto legacy hardware without ripping anything out.",
      image: PH("photo-1518770660439-4636190af475"),
      imageAlt: "Network cabling close-up",
      category: "Infrastructure",
      author: "The editorial team",
      date: "2026-02-12",
      link: "#",
      openInSameTab: false,
    },
    {
      id: "p2",
      title: "Five questions to ask before a workplace refresh",
      excerpt: "What to align on with the rest of the business before you write a single line of the procurement brief.",
      image: PH("photo-1497366216548-37526070297c"),
      imageAlt: "Modern office",
      category: "Procurement",
      author: "Sam Reynolds",
      date: "2026-02-05",
      link: "#",
      openInSameTab: false,
    },
    {
      id: "p3",
      title: "The case for fewer vendors — and how to make it stick",
      excerpt: "Consolidation looks attractive on paper. Here's how to size the upside and survive the politics.",
      image: PH("photo-1556761175-5973dc0f32e7"),
      imageAlt: "Office meeting",
      category: "Strategy",
      author: "Editorial",
      date: "2026-01-29",
      link: "#",
      openInSameTab: false,
    },
    {
      id: "p4",
      title: "A practical guide to migration — plan in weeks, ship in days",
      excerpt: "Two-stage migrations are usually the safer bet. We unpack when to phase and when to rip-and-replace.",
      image: PH("photo-1551434678-e076c223a692"),
      imageAlt: "Server room",
      category: "Infrastructure",
      author: "Editorial",
      date: "2026-01-22",
      link: "#",
      openInSameTab: false,
    },
    {
      id: "p5",
      title: "Security baseline: the seven controls every estate needs",
      excerpt: "The non-negotiable list — and where most organisations are still falling short in 2026.",
      image: PH("photo-1563013544-824ae1b704d3"),
      imageAlt: "Security control room",
      category: "Security",
      author: "Editorial",
      date: "2026-01-15",
      link: "#",
      openInSameTab: false,
    },
    {
      id: "p6",
      title: "What 'hybrid work' actually costs (and where the savings hide)",
      excerpt: "We model real numbers across hardware, connectivity and AV — what to cut, what to keep, what to invest in.",
      image: PH("photo-1517245386807-bb43f82c33c4"),
      imageAlt: "Hybrid workspace",
      category: "Workplace",
      author: "Editorial",
      date: "2026-01-08",
      link: "#",
      openInSameTab: false,
    },
  ],

  // Layout
  columns: 3,
  columnsMobile: 1,
  gap: 24,
  cardPadding: 0,        // image is edge-to-edge; padding lives on `.ns-card-body`
  cardRadius: 10,
  cardAlign: "left",     // "left" | "center" | "right"
  fullBleed: false,

  // Search — ships INSIDE the photo header by default (matches the
  // brand-grid pattern + the user's stated preference for search
  // over chips).
  searchEnabled: true,
  searchPlaceholder: "Search articles…",
  searchPosition: "header", // "header" | "below"
  searchAlign: "center",
  searchWidth: 420,
  noMatchText: "No articles match. Try a different search term.",

  // Hover
  hoverEffect: "lift", // "lift" | "bar" | "none"
  barSide: "bottom",
  barThickness: 3,
  barColor: "",

  // Theme — matches the brand-kit cascade
  bgColor: "#ffffff",
  cardBg: "#ffffff",
  cardBorder: "#e5e7eb",
  titleColor: "#0f172a",
  bodyColor: "#475569",
  eyebrowAccentColor: "",

  // Spacing
  paddingY: 72,
  paddingTop: 72,
  paddingBottom: 72,
  paddingX: 20,
});

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function render(cfg) {
  const cls = `ns-blog-index-${makeUid()}`;
  const padTop = padTopOf(cfg, 72);
  const padBot = padBotOf(cfg, 72);
  const padX = padXOf(cfg, 20);

  const items = (cfg.items || []).filter((x) => x && x.title);
  const accent = safeColor(cfg.eyebrowAccentColor, "#E01839");
  const cardRadius = num(cfg.cardRadius, 10);
  const headerRadius = cfg.fullBleed
    ? 0
    : (cfg.headerRadius == null || cfg.headerRadius === "" ? cardRadius : num(cfg.headerRadius, cardRadius));

  const overlayBg = cfg.overlayType === "gradient"
    ? `linear-gradient(${num(cfg.overlayGradientAngle, 180)}deg, ${safeColor(cfg.overlayGradientFrom || "#0f172a", "#0f172a")} 0%, ${safeColor(cfg.overlayGradientTo || "rgba(15,23,42,0)", "#0f172a")} 100%)`
    : safeColor(cfg.headerOverlayColor, "#0f172a");

  const cardAlign = ["left", "center", "right"].includes(cfg.cardAlign) ? cfg.cardAlign : "left";
  const cardAlignItems = cardAlign === "left" ? "flex-start" : cardAlign === "right" ? "flex-end" : "center";
  const searchAlign = SEARCH_ALIGN_TO_FLEX[cfg.searchAlign] || "center";
  const searchWidth = Math.max(140, Math.min(1200, num(cfg.searchWidth, 420)));
  const cols = Math.max(1, Math.min(4, num(cfg.columns, 3)));
  const colsM = Math.max(1, Math.min(3, num(cfg.columnsMobile, 1)));
  const headerHeight = Math.max(120, num(cfg.headerHeight, 360));
  const headerOverlayOpacity = Math.min(1, Math.max(0, num(cfg.headerOverlayOpacity, 0.55)));
  const headerTextColor = safeColor(cfg.headerTextColor, "#ffffff");

  const cardHtml = (it, idx) => {
    const link = safeUrl(it.link || "");
    const tag = link ? "a" : "article";
    const tgt = link && !it.openInSameTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    const href = link ? ` href="${escAttr(link)}"` : "";
    const haystack = [it.title, it.excerpt, it.category, it.author].filter(Boolean).join(" ").toLowerCase();
    const metaBits = [it.date ? `<time class="ns-card-date" datetime="${escAttr(it.date)}">${escHtml(formatDate(it.date))}</time>` : "", it.author ? `<span class="ns-card-author">${escHtml(it.author)}</span>` : ""].filter(Boolean).join('<span class="ns-card-dot" aria-hidden="true">·</span>');
    return `<${tag} class="ns-card"${href}${tgt} data-ns-list="post" data-ns-item="${idx}" data-haystack="${escAttr(haystack)}">
      ${cfg.hoverEffect === "bar" ? `<span class="ns-bar" aria-hidden="true"></span>` : ""}
      <div class="ns-card-media">${it.image ? `<img src="${escAttr(safeUrl(it.image))}" alt="${escAttr(it.imageAlt || it.title || "")}" loading="lazy"/>` : `<div class="ns-card-ph" aria-hidden="true"></div>`}</div>
      <div class="ns-card-body">
        ${it.category ? `<p class="ns-card-cat">${escHtml(it.category)}</p>` : ""}
        <h3 class="ns-card-title">${escHtml(it.title)}</h3>
        ${it.excerpt ? `<p class="ns-card-excerpt">${escHtml(it.excerpt)}</p>` : ""}
        ${metaBits ? `<p class="ns-card-meta">${metaBits}</p>` : ""}
      </div>
    </${tag}>`;
  };

  const searchHtml = cfg.searchEnabled
    ? `<div class="ns-controls" data-ns-group="search"><input type="search" class="ns-search" placeholder="${escAttr(cfg.searchPlaceholder || "Search…")}" aria-label="Search articles"/></div>`
    : "";

  const hasHeaderImg = !!safeUrl(cfg.headerImage || "");
  const hasHeaderText = !!(cfg.eyebrow || cfg.heading || cfg.subheading);
  const searchInHeader = cfg.searchEnabled && cfg.searchPosition === "header" && hasHeaderImg;
  const headerInner = `
      ${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}
      ${cfg.heading ? `<h2 class="ns-heading">${escHtml(cfg.heading)}</h2>` : ""}
      ${cfg.subheading ? `<p class="ns-sub">${escHtml(cfg.subheading)}</p>` : ""}
      ${searchInHeader ? searchHtml : ""}`;
  const photoHeader = hasHeaderImg
    ? `<header class="ns-header ns-header-bg" data-ns-group="header-background"${cfg.headerImageAlt ? ` role="img" aria-label="${escAttr(cfg.headerImageAlt)}"` : ' role="presentation"'}>
        <div class="ns-header-overlay" aria-hidden="true"></div>
        <div class="ns-header-content" data-ns-group="header">${headerInner}</div>
      </header>`
    : "";
  const plainHeader = (!hasHeaderImg && hasHeaderText)
    ? `<header class="ns-header" data-ns-group="header">${headerInner}</header>`
    : "";
  const searchBelow = cfg.searchEnabled && !searchInHeader ? searchHtml : "";

  const html = `<section class="ns-blog-index ${cls}${fullBleedClass(cfg)}">
  ${photoHeader}
  <div class="ns-inner">
    ${plainHeader}
    ${searchBelow}
    <div class="ns-grid" data-ns-group="posts" data-ns-list="post">
      ${items.map((it, idx) => cardHtml(it, idx)).join("")}
    </div>
    <p class="ns-empty" data-ns-group="search" hidden>${escHtml(cfg.noMatchText || "No articles match.")}</p>
  </div>
</section>`;

  const barSide = ["top", "right", "bottom", "left"].includes(cfg.barSide) ? cfg.barSide : "bottom";
  const barT = Math.max(1, Math.min(12, num(cfg.barThickness, 3)));
  const barColor = safeColor(cfg.barColor || cfg.eyebrowAccentColor, accent);
  const isHoriz = barSide === "top" || barSide === "bottom";
  const barOrigin =
    barSide === "right" ? "right top" :
    barSide === "bottom" ? "left bottom" :
    "left top";
  const barSizing = isHoriz
    ? `left:0;right:0;height:${barT}px`
    : `top:0;bottom:0;width:${barT}px`;
  const barRule = `
.${cls} .ns-bar{position:absolute;${barSide}:0;${barSizing};background:${barColor};transform:${isHoriz ? "scaleX(0)" : "scaleY(0)"};transform-origin:${barOrigin};transition:transform .25s ease;z-index:1}
.${cls} .ns-card:hover .ns-bar{transform:scale(1)}`;
  const hoverLift = cfg.hoverEffect === "lift"
    ? `.${cls} .ns-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(0,0,0,.08);border-color:${accent}}`
    : "";

  const css = `${FONT_IMPORT}
${baseReset(cls, cfg)}
.${cls}{background:${safeColor(cfg.bgColor, "#ffffff")};padding:${padTop}px 0 ${padBot}px;font-family:${cfg.font ? `"${escAttr(cfg.font)}",` : ""}-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.${cls} .ns-inner{max-width:1200px;margin:0 auto;padding:0 ${padX}px}

.${cls} .ns-header{text-align:center;margin-bottom:36px}
.${cls} .ns-header.ns-header-bg{position:relative;min-height:${headerHeight}px;display:flex;align-items:center;justify-content:center;background-image:url("${escAttr(safeUrl(cfg.headerImage || ""))}");background-size:cover;background-position:center;overflow:hidden;padding:56px ${padX}px;margin:0 0 40px;border-radius:${headerRadius}px}
.${cls} .ns-header-overlay{position:absolute;inset:0;background:${overlayBg};opacity:${headerOverlayOpacity};pointer-events:none}
.${cls} .ns-header-content{position:relative;z-index:1;max-width:760px;width:100%;display:flex;flex-direction:column;align-items:center;gap:14px}
.${cls} .ns-header.ns-header-bg .ns-heading{color:${headerTextColor}}
.${cls} .ns-header.ns-header-bg .ns-sub{color:${headerTextColor};opacity:.92}

.${cls} .ns-eyebrow{margin:0;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${accent}}
.${cls} .ns-heading{margin:0;font-size:34px;font-weight:700;color:${safeColor(cfg.titleColor, "#0f172a")};line-height:1.15}
.${cls} .ns-sub{margin:0 auto;max-width:640px;color:${safeColor(cfg.bodyColor, "#475569")};font-size:16px;line-height:1.5}

.${cls} .ns-controls{display:flex;justify-content:${searchAlign};margin:0 0 28px}
.${cls} .ns-header-content .ns-controls{margin:6px 0 0;width:100%}
.${cls} .ns-search{flex:0 1 ${searchWidth}px;min-width:0;width:100%;max-width:${searchWidth}px;padding:12px 16px;border:1px solid ${safeColor(cfg.cardBorder, "#e5e7eb")};border-radius:${cardRadius}px;font:inherit;font-size:15px;background:#fff;color:${safeColor(cfg.titleColor, "#0f172a")}}
.${cls} .ns-search:focus{outline:2px solid ${accent};outline-offset:1px}

.${cls} .ns-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:${num(cfg.gap, 24)}px}
.${cls} .ns-card{position:relative;display:flex;flex-direction:column;align-items:${cardAlignItems};text-align:${cardAlign};background:${safeColor(cfg.cardBg, "#ffffff")};border:1px solid ${safeColor(cfg.cardBorder, "#e5e7eb")};border-radius:${cardRadius}px;text-decoration:none;color:inherit;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;overflow:hidden;flex:0 1 calc((100% - ${num(cfg.gap, 24)}px * (${cols} - 1)) / ${cols});max-width:calc((100% - ${num(cfg.gap, 24)}px * (${cols} - 1)) / ${cols});box-sizing:border-box}
.${cls} .ns-card-media{width:100%;aspect-ratio:16/10;background:${safeColor(cfg.cardBorder, "#e5e7eb")};overflow:hidden}
.${cls} .ns-card-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}
.${cls} .ns-card:hover .ns-card-media img{transform:scale(1.04)}
.${cls} .ns-card-body{display:flex;flex-direction:column;gap:8px;padding:20px 22px 22px;width:100%;box-sizing:border-box}
.${cls} .ns-card-cat{margin:0;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${accent}}
.${cls} .ns-card-title{margin:0;font-size:18px;font-weight:700;color:${safeColor(cfg.titleColor, "#0f172a")};line-height:1.35}
.${cls} .ns-card-excerpt{margin:0;font-size:14px;line-height:1.55;color:${safeColor(cfg.bodyColor, "#475569")};display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.${cls} .ns-card-meta{margin:4px 0 0;font-size:12px;color:${safeColor(cfg.bodyColor, "#475569")};opacity:.8;display:flex;flex-wrap:wrap;align-items:center;gap:6px;justify-content:${cardAlign === "left" ? "flex-start" : cardAlign === "right" ? "flex-end" : "center"}}
.${cls} .ns-card-date,.${cls} .ns-card-author{font-weight:500}
.${cls} .ns-card-dot{opacity:.6}
.${cls} .ns-empty{margin:32px auto 0;text-align:center;color:${safeColor(cfg.bodyColor, "#475569")};font-size:14px}
${hoverLift}
${cfg.hoverEffect === "bar" ? barRule : ""}

@media (max-width:767px){
  .${cls} .ns-card{flex-basis:calc((100% - ${num(cfg.gap, 24)}px * (${colsM} - 1)) / ${colsM});max-width:calc((100% - ${num(cfg.gap, 24)}px * (${colsM} - 1)) / ${colsM})}
  .${cls} .ns-heading{font-size:24px}
  .${cls} .ns-header.ns-header-bg{min-height:${Math.max(180, Math.round(headerHeight * 0.7))}px;padding:32px 18px;margin-bottom:28px}
  .${cls} .ns-search{flex:1 1 auto;max-width:100%}
  .${cls} .ns-controls{justify-content:stretch}
}`;

  const js = `
(function(){
  var root=document.currentScript&&document.currentScript.previousElementSibling;
  while(root&&!root.classList.contains('${cls}'))root=root.previousElementSibling;
  if(!root)return;
  var search=root.querySelector('.ns-search');
  var cards=root.querySelectorAll('.ns-card');
  var empty=root.querySelector('.ns-empty');
  function apply(q){
    var visible=0;
    cards.forEach(function(card){
      var show=!q||(card.getAttribute('data-haystack')||'').indexOf(q)!==-1;
      card.style.display=show?'':'none';
      if(show)visible++;
    });
    if(empty)empty.hidden=visible!==0;
  }
  var t;
  if(search)search.addEventListener('input',function(e){
    clearTimeout(t);
    t=setTimeout(function(){apply((e.target.value||'').trim().toLowerCase());},150);
  });
})();`;

  return wrapSnippet({ css, html: html + `<script>${js}</script>` });
}

function FormPanel({ config, onUpdate }) {
  const cfg = { ...defaults(), ...config };
  const items = cfg.items || [];

  const addItem = () => onUpdate({
    items: [...items, { id: makeUid(), title: "New article", excerpt: "Short summary.", image: "", imageAlt: "", category: "", author: "", date: "", link: "#", openInSameTab: false }],
  });
  const removeItem = (id) => onUpdate({ items: items.filter((i) => i.id !== id) });
  const moveItem = (id, dir) => {
    const idx = items.findIndex((i) => i.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= items.length) return;
    const arr = [...items];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    onUpdate({ items: arr });
  };
  const dup = (id) => {
    const i = items.findIndex((x) => x.id === id);
    if (i < 0) return;
    const arr = [...items];
    arr.splice(i + 1, 0, { ...arr[i], id: makeUid() });
    onUpdate({ items: arr });
  };
  const upd = (id, patch) => onUpdate({ items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  return (
    <FormAccordion sectionType="blog-index">
      <FormGroup title="Header">
        <TextField label="Eyebrow" value={cfg.eyebrow} onChange={(v) => onUpdate({ eyebrow: v })} />
        <TextField label="Heading" value={cfg.heading} onChange={(v) => onUpdate({ heading: v })} />
        <TextAreaField label="Subheading" value={cfg.subheading} onChange={(v) => onUpdate({ subheading: v })} />
      </FormGroup>

      <FormGroup title="Header background">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Background image</Label>
          <ImageUpload value={cfg.headerImage} onChange={(v) => onUpdate({ headerImage: v })} compact />
        </div>
        {cfg.headerImage && (<>
          <TextField label="Image alt text" value={cfg.headerImageAlt} onChange={(v) => onUpdate({ headerImageAlt: v })} />
          <SliderField label="Header height" value={cfg.headerHeight} min={140} max={520} suffix="px" onChange={(v) => onUpdate({ headerHeight: v })} />
          {!cfg.fullBleed && (
            <SliderField label="Header corner radius" description="Defaults to your card radius. Disabled when 'Make wide' is on."
              value={cfg.headerRadius == null ? (cfg.cardRadius ?? 10) : cfg.headerRadius}
              min={0} max={48} suffix="px" onChange={(v) => onUpdate({ headerRadius: v })} />
          )}
          <SelectField label="Overlay style" value={cfg.overlayType}
            options={[{ value: "solid", label: "Solid colour" }, { value: "gradient", label: "Linear gradient" }]}
            onChange={(v) => onUpdate({ overlayType: v })} />
          {cfg.overlayType === "gradient" ? (<>
            <ColorField label="Gradient — from" value={cfg.overlayGradientFrom} onChange={(v) => onUpdate({ overlayGradientFrom: v })} />
            <ColorField label="Gradient — to" value={cfg.overlayGradientTo} onChange={(v) => onUpdate({ overlayGradientTo: v })} />
            <SliderField label="Gradient angle" value={cfg.overlayGradientAngle} min={0} max={360} suffix="°" onChange={(v) => onUpdate({ overlayGradientAngle: v })} />
          </>) : (
            <ColorField label="Overlay colour" value={cfg.headerOverlayColor} onChange={(v) => onUpdate({ headerOverlayColor: v })} />
          )}
          <SliderField label="Overlay opacity" value={Math.round((cfg.headerOverlayOpacity ?? 0.55) * 100)} min={0} max={100} suffix="%" onChange={(v) => onUpdate({ headerOverlayOpacity: v / 100 })} />
          <ColorField label="Header text colour" value={cfg.headerTextColor} onChange={(v) => onUpdate({ headerTextColor: v })} />
        </>)}
      </FormGroup>

      <FormGroup title="Posts" value="posts">
        <ListEditor
          items={items}
          onAdd={addItem}
          onRemove={removeItem}
          onMove={moveItem}
          onDuplicate={dup}
          addLabel="Add post"
          testidPrefix="post"
          renderRow={(it) => (
            <div className="flex items-center gap-2">
              <div className="w-12 h-9 rounded-sm bg-slate-50 flex-shrink-0 overflow-hidden">
                {it.image && <img src={it.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">{it.title || "(untitled)"}</p>
            </div>
          )}
          renderForm={(it) => (
            <>
              <TextField label="Title" value={it.title} onChange={(v) => upd(it.id, { title: v })} />
              <TextAreaField label="Excerpt" value={it.excerpt} onChange={(v) => upd(it.id, { excerpt: v })} rows={3} />
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Thumbnail</Label>
                <ImageUpload value={it.image} onChange={(v) => upd(it.id, { image: v })} compact />
              </div>
              <TextField label="Image alt" value={it.imageAlt || ""} onChange={(v) => upd(it.id, { imageAlt: v })} />
              <TextField label="Category" placeholder="e.g. Infrastructure" value={it.category || ""} onChange={(v) => upd(it.id, { category: v })} />
              <TextField label="Author" value={it.author || ""} onChange={(v) => upd(it.id, { author: v })} />
              <TextField label="Date (YYYY-MM-DD)" placeholder="2026-02-19" value={it.date || ""} onChange={(v) => upd(it.id, { date: v })} />
              <TextField label="Link" placeholder="https://…" value={it.link || ""} onChange={(v) => upd(it.id, { link: v })} />
              <ToggleField label="Open in same tab" checked={!!it.openInSameTab} onChange={(v) => upd(it.id, { openInSameTab: v })} />
            </>
          )}
        />
      </FormGroup>

      <FormGroup title="Layout">
        <ToggleField label="Make wide" description="Stretch background to full viewport width" checked={!!cfg.fullBleed} onChange={(v) => onUpdate({ fullBleed: v })} />
        <SliderField label="Columns" value={cfg.columns} min={1} max={4} onChange={(v) => onUpdate({ columns: v })} />
        <SliderField label="Mobile columns" value={cfg.columnsMobile} min={1} max={3} onChange={(v) => onUpdate({ columnsMobile: v })} />
        <SliderField label="Gap" value={cfg.gap} min={8} max={48} suffix="px" onChange={(v) => onUpdate({ gap: v })} />
        <SliderField label="Card radius" value={cfg.cardRadius} min={0} max={32} suffix="px" onChange={(v) => onUpdate({ cardRadius: v })} />
        <SelectField label="Card content alignment" value={cfg.cardAlign}
          options={[{ value: "left", label: "Left" }, { value: "center", label: "Centre" }, { value: "right", label: "Right" }]}
          onChange={(v) => onUpdate({ cardAlign: v })} />
      </FormGroup>

      <FormGroup title="Search">
        <ToggleField label="Show search box" checked={!!cfg.searchEnabled} onChange={(v) => onUpdate({ searchEnabled: v })} />
        {cfg.searchEnabled && (<>
          <TextField label="Search placeholder" value={cfg.searchPlaceholder} onChange={(v) => onUpdate({ searchPlaceholder: v })} />
          <SelectField label="Position" value={cfg.searchPosition}
            options={[{ value: "below", label: "Below the header" }, { value: "header", label: "Inside the header (over the image)" }]}
            onChange={(v) => onUpdate({ searchPosition: v })} />
          <SelectField label="Alignment" value={cfg.searchAlign}
            options={[{ value: "left", label: "Left" }, { value: "center", label: "Centre" }, { value: "right", label: "Right" }]}
            onChange={(v) => onUpdate({ searchAlign: v })} />
          <SliderField label="Width" value={cfg.searchWidth} min={180} max={760} suffix="px" onChange={(v) => onUpdate({ searchWidth: v })} />
          <TextField label="No-match message" value={cfg.noMatchText} onChange={(v) => onUpdate({ noMatchText: v })} />
        </>)}
      </FormGroup>

      <FormGroup title="Hover effect">
        <SelectField label="On hover" value={cfg.hoverEffect}
          options={[{ value: "lift", label: "Lift + border highlight" }, { value: "bar", label: "Accent bar on edge" }, { value: "none", label: "None" }]}
          onChange={(v) => onUpdate({ hoverEffect: v })} />
        {cfg.hoverEffect === "bar" && (<>
          <SelectField label="Bar edge" value={cfg.barSide}
            options={[{ value: "top", label: "Top" }, { value: "right", label: "Right" }, { value: "bottom", label: "Bottom" }, { value: "left", label: "Left" }]}
            onChange={(v) => onUpdate({ barSide: v })} />
          <SliderField label="Bar thickness" value={cfg.barThickness} min={1} max={12} suffix="px" onChange={(v) => onUpdate({ barThickness: v })} />
          <ColorField label="Bar colour" value={cfg.barColor || cfg.eyebrowAccentColor || "#E01839"} onChange={(v) => onUpdate({ barColor: v })} />
        </>)}
      </FormGroup>

      <FormGroup title="Colours">
        <ColorField label="Section background" value={cfg.bgColor} onChange={(v) => onUpdate({ bgColor: v })} />
        <ColorField label="Card background" value={cfg.cardBg} onChange={(v) => onUpdate({ cardBg: v })} />
        <ColorField label="Card border" value={cfg.cardBorder} onChange={(v) => onUpdate({ cardBorder: v })} />
        <ColorField label="Heading & card title" value={cfg.titleColor} onChange={(v) => onUpdate({ titleColor: v })} />
        <ColorField label="Body & excerpts" value={cfg.bodyColor} onChange={(v) => onUpdate({ bodyColor: v })} />
        <ColorField label="Eyebrow / accent" value={cfg.eyebrowAccentColor || "#E01839"} onChange={(v) => onUpdate({ eyebrowAccentColor: v })} />
      </FormGroup>

      <FormGroup title="Spacing">
        <PaddingFields config={cfg} onUpdate={onUpdate} defaultValue={72} max={160} sideMax={120} testidPrefix="bi" />
      </FormGroup>
    </FormAccordion>
  );
}

export const blogIndex = {
  id: ID,
  name: "Blog index",
  description: "Searchable grid of blog post cards with an optional full-width photo header. Sister section to Brand Grid — image, title, excerpt, date and author per card. Search-only (no pill chips).",
  icon: Newspaper,
  defaults,
  render,
  FormPanel,
};
