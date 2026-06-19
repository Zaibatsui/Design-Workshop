/*
 * Brand Grid — searchable, filterable grid of brand cards with an
 * optional Spotlight tier that sits above the main grid. Inspired by
 * the "Shop by Brand" pattern but with an editor-driven layout +
 * brand-kit aware visuals. Self-contained vanilla JS for the
 * search/filter (no external libs), scoped to a UID class so the
 * snippet stays inert outside its own DOM.
 */
import { Building2 } from "lucide-react";
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
import { FormAccordion, FormGroup } from "@/components/FormGroup";
import {
  SelectField,
  SliderField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/FormFields";
import PaddingFields from "@/components/PaddingFields";

const ID = "brand-grid";

const defaults = () => ({
  // Section header
  eyebrow: "",
  heading: "Shop by brand",
  subheading: "Find the right partner for every need.",
  // Items
  items: [
    {
      id: "logitech",
      name: "Logitech",
      category: "Accessories",
      description: "Webcams, headsets, keyboards and mice for hybrid work.",
      logo: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=500&q=70",
      logoAlt: "Logitech logo",
      link: "",
      openInSameTab: false,
      spotlight: true,
    },
    {
      id: "microsoft",
      name: "Microsoft",
      category: "Productivity",
      description: "Windows, 365 and cloud tools for secure collaboration.",
      logo: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?auto=format&fit=crop&w=500&q=70",
      logoAlt: "Microsoft logo",
      link: "",
      openInSameTab: false,
      spotlight: true,
    },
    {
      id: "lenovo",
      name: "Lenovo",
      category: "Computing",
      description: "Laptops, desktops and accessories built for productivity.",
      logo: "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&w=500&q=70",
      logoAlt: "Lenovo logo",
      link: "",
      openInSameTab: false,
      spotlight: true,
    },
    {
      id: "hp",
      name: "HP",
      category: "Computing",
      description: "PCs, printers and accessories trusted by businesses worldwide.",
      logo: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=500&q=70",
      logoAlt: "HP logo",
      link: "",
      openInSameTab: false,
      spotlight: false,
    },
    {
      id: "dell",
      name: "Dell",
      category: "Computing",
      description: "Business laptops, workstations and monitors for the workplace.",
      logo: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=500&q=70",
      logoAlt: "Dell logo",
      link: "",
      openInSameTab: false,
      spotlight: false,
    },
    {
      id: "jabra",
      name: "Jabra",
      category: "Collaboration",
      description: "Headsets and speakerphones for crystal-clear calls.",
      logo: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=70",
      logoAlt: "Jabra logo",
      link: "",
      openInSameTab: false,
      spotlight: false,
    },
  ],
  // Layout
  columns: 3,
  columnsMobile: 1,
  gap: 18,
  cardPadding: 22,
  cardRadius: 8,
  // Spotlight
  spotlightColumns: 4,
  spotlightHideFromMain: true,
  // Search + filter
  searchEnabled: true,
  searchPlaceholder: "Search brands…",
  categoryFilterEnabled: true,
  allChipLabel: "All",
  noMatchText: "No matches. Try a different category or search term.",
  // Hover affordance
  hoverEffect: "bar", // "lift" | "bar" | "none"
  barSide: "bottom", // "top" | "right" | "bottom" | "left"
  barThickness: 3,
  barColor: "",
  // Theme
  bgColor: "#ffffff",
  cardBg: "#ffffff",
  cardBorder: "#e5e7eb",
  titleColor: "#0f172a",
  bodyColor: "#475569",
  eyebrowAccentColor: "",
  // Spacing
  paddingY: 64,
  paddingTop: 64,
  paddingBottom: 64,
  paddingX: 20,
});

const safeId = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";

function render(cfg) {
  const cls = makeUid(ID);
  const padTop = padTopOf(cfg, 64);
  const padBot = padBotOf(cfg, 64);
  const padX = padXOf(cfg, 20);

  const items = (cfg.items || []).filter((x) => x && x.name);
  const spotlight = items.filter((i) => i.spotlight);
  const main = cfg.spotlightHideFromMain
    ? items.filter((i) => !i.spotlight)
    : items;

  // Unique categories preserve first-seen order so the chip row
  // reads in the order the editor chose, not alphabetically.
  const categories = [];
  for (const it of items) {
    const c = (it.category || "").trim();
    if (c && !categories.includes(c)) categories.push(c);
  }

  const cardHtml = (it, opts = {}) => {
    const link = safeUrl(it.link || "");
    const tag = link ? "a" : "div";
    const tgt = link && !it.openInSameTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    const href = link ? ` href="${escAttr(link)}"` : "";
    const cat = (it.category || "").trim();
    const nameLower = (it.name || "").toLowerCase();
    const descLower = (it.description || "").toLowerCase();
    const variant = opts.spotlight ? " is-spotlight" : "";
    return `<${tag} class="ns-card${variant}"${href}${tgt} data-cat="${escAttr(cat)}" data-haystack="${escAttr(`${nameLower} ${descLower}`)}">
      ${cfg.hoverEffect === "bar" ? `<span class="ns-bar" aria-hidden="true"></span>` : ""}
      ${it.logo ? `<img class="ns-logo" src="${escAttr(safeUrl(it.logo))}" alt="${escAttr(it.logoAlt || it.name + " logo")}" loading="lazy"/>` : `<div class="ns-logo ns-logo-placeholder" aria-hidden="true"></div>`}
      ${cat ? `<span class="ns-cat">${escHtml(cat)}</span>` : ""}
      <h3 class="ns-name">${escHtml(it.name)}</h3>
      ${it.description ? `<p class="ns-desc">${escHtml(it.description)}</p>` : ""}
    </${tag}>`;
  };

  const filterUi = (cfg.searchEnabled || (cfg.categoryFilterEnabled && categories.length)) ? `
    <div class="ns-controls">
      ${cfg.searchEnabled ? `<input type="search" class="ns-search" placeholder="${escAttr(cfg.searchPlaceholder || "Search…")}" aria-label="Search brands"/>` : ""}
      ${cfg.categoryFilterEnabled && categories.length ? `
        <div class="ns-chips" role="tablist">
          <button type="button" class="ns-chip is-active" data-cat="">${escHtml(cfg.allChipLabel || "All")}</button>
          ${categories.map((c) => `<button type="button" class="ns-chip" data-cat="${escAttr(c)}">${escHtml(c)}</button>`).join("")}
        </div>` : ""}
    </div>` : "";

  const spotlightHtml = spotlight.length ? `
    <div class="ns-spotlight">
      ${spotlight.map((it) => cardHtml(it, { spotlight: true })).join("")}
    </div>` : "";

  const html = `<section class="ns-brand-grid ${cls}${fullBleedClass(cfg)}" data-ns-group="defaults">
  <div class="ns-inner">
    ${(cfg.eyebrow || cfg.heading || cfg.subheading) ? `<header class="ns-header">
      ${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}
      ${cfg.heading ? `<h2 class="ns-heading">${escHtml(cfg.heading)}</h2>` : ""}
      ${cfg.subheading ? `<p class="ns-sub">${escHtml(cfg.subheading)}</p>` : ""}
    </header>` : ""}
    ${spotlightHtml}
    ${filterUi}
    <div class="ns-grid" data-ns-list="items">
      ${main.map((it) => cardHtml(it)).join("")}
    </div>
    <p class="ns-empty" hidden>${escHtml(cfg.noMatchText || "No matches.")}</p>
  </div>
</section>`;

  const cols = Math.max(1, Math.min(6, num(cfg.columns, 3)));
  const colsM = Math.max(1, Math.min(3, num(cfg.columnsMobile, 1)));
  const spCols = Math.max(1, Math.min(6, num(cfg.spotlightColumns, 4)));
  const barT = Math.max(1, num(cfg.barThickness, 3));
  const accent = safeColor(cfg.eyebrowAccentColor || cfg.theme?.titleColor, "#E01839");
  const barColor = safeColor(cfg.barColor || cfg.eyebrowAccentColor || cfg.theme?.titleColor, accent);

  // CSS per side for the optional accent bar. Initially scaled to 0
  // along the relevant axis; scales to 1 on hover via the transform
  // transition. CSS-only — no JS needed for the hover state.
  const barSide = ["top", "right", "bottom", "left"].includes(cfg.barSide) ? cfg.barSide : "bottom";
  const isHoriz = barSide === "top" || barSide === "bottom";
  const barRule = `
.${cls} .ns-bar{position:absolute;${barSide}:0;${isHoriz ? "left:0;right:0;height:" : "top:0;bottom:0;width:"}${barT}px;background:${barColor};transform:${isHoriz ? "scaleX(0)" : "scaleY(0)"};transform-origin:${barSide === "left" ? "top" : barSide === "right" ? "top" : "left"} ${barSide === "top" ? "top" : "bottom"};transition:transform .25s ease}
.${cls} .ns-card:hover .ns-bar{transform:scale(1)}`;

  const hoverLift = cfg.hoverEffect === "lift"
    ? `.${cls} .ns-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.06);border-color:${accent}}`
    : "";

  const css = `${FONT_IMPORT}
${baseReset(cls, cfg)}
.${cls}{background:${safeColor(cfg.bgColor, "#ffffff")};padding:${padTop}px ${padX}px ${padBot}px;font-family:${cfg.font ? `"${escAttr(cfg.font)}",` : ""}-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.${cls} .ns-inner{max-width:1200px;margin:0 auto}
.${cls} .ns-header{margin-bottom:24px;text-align:center}
.${cls} .ns-eyebrow{margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${accent}}
.${cls} .ns-heading{margin:0 0 6px;font-size:32px;font-weight:700;color:${safeColor(cfg.titleColor, "#0f172a")};line-height:1.2}
.${cls} .ns-sub{margin:0 auto;max-width:640px;color:${safeColor(cfg.bodyColor, "#475569")};font-size:15px;line-height:1.5}
.${cls} .ns-spotlight{display:grid;grid-template-columns:repeat(${spCols},minmax(0,1fr));gap:${num(cfg.gap, 18)}px;margin:8px 0 28px}
.${cls} .ns-controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:8px 0 18px}
.${cls} .ns-search{flex:0 1 280px;min-width:200px;padding:10px 14px;border:1px solid ${safeColor(cfg.cardBorder, "#e5e7eb")};border-radius:${num(cfg.cardRadius, 8)}px;font:inherit;font-size:14px;background:#fff;color:${safeColor(cfg.titleColor, "#0f172a")}}
.${cls} .ns-search:focus{outline:2px solid ${accent};outline-offset:1px}
.${cls} .ns-chips{display:flex;flex-wrap:wrap;gap:6px}
.${cls} .ns-chip{padding:8px 14px;border:1px solid ${safeColor(cfg.cardBorder, "#e5e7eb")};background:#fff;color:${safeColor(cfg.bodyColor, "#475569")};border-radius:9999px;font:inherit;font-size:13px;cursor:pointer;transition:background .15s ease,border-color .15s ease,color .15s ease}
.${cls} .ns-chip:hover{border-color:${accent};color:${accent}}
.${cls} .ns-chip.is-active{background:${accent};border-color:${accent};color:#fff}
.${cls} .ns-grid{display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${num(cfg.gap, 18)}px}
.${cls} .ns-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:8px;background:${safeColor(cfg.cardBg, "#ffffff")};border:1px solid ${safeColor(cfg.cardBorder, "#e5e7eb")};border-radius:${num(cfg.cardRadius, 8)}px;padding:${num(cfg.cardPadding, 22)}px;text-decoration:none;color:inherit;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;overflow:hidden}
.${cls} .ns-card.is-spotlight{padding:${num(cfg.cardPadding, 22) + 6}px;background:linear-gradient(135deg,${safeColor(cfg.cardBg, "#ffffff")} 0%,${safeColor(cfg.cardBorder, "#f8fafc")} 100%)}
.${cls} .ns-logo{height:48px;width:auto;max-width:160px;object-fit:contain;margin-bottom:4px}
.${cls} .ns-logo-placeholder{background:${safeColor(cfg.cardBorder, "#e5e7eb")};border-radius:6px;width:120px}
.${cls} .ns-cat{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${accent}}
.${cls} .ns-name{margin:0;font-size:17px;font-weight:700;color:${safeColor(cfg.titleColor, "#0f172a")};line-height:1.3}
.${cls} .ns-desc{margin:0;font-size:13px;color:${safeColor(cfg.bodyColor, "#475569")};line-height:1.5}
.${cls} .ns-empty{margin:24px auto 0;text-align:center;color:${safeColor(cfg.bodyColor, "#475569")};font-size:14px}
${hoverLift}
${cfg.hoverEffect === "bar" ? barRule : ""}
@media (max-width:767px){
  .${cls} .ns-grid{grid-template-columns:repeat(${colsM},minmax(0,1fr))}
  .${cls} .ns-spotlight{grid-template-columns:repeat(${Math.min(spCols, 2)},minmax(0,1fr))}
  .${cls} .ns-heading{font-size:24px}
  .${cls} .ns-controls{flex-direction:column;align-items:stretch}
  .${cls} .ns-search{flex:1 1 auto;width:100%}
}`;

  // Snippet JS — debounced search + chip filter. Scoped via the
  // unique class. No external libs.
  const js = `
(function(){
  var root=document.currentScript&&document.currentScript.previousElementSibling;
  while(root&&!root.classList.contains('${cls}'))root=root.previousElementSibling;
  if(!root)return;
  var search=root.querySelector('.ns-search');
  var chips=root.querySelectorAll('.ns-chip');
  var cards=root.querySelectorAll('.ns-card');
  var empty=root.querySelector('.ns-empty');
  var state={q:'',cat:''};
  function apply(){
    var visible=0;
    cards.forEach(function(card){
      var matchCat=!state.cat||card.getAttribute('data-cat')===state.cat;
      var matchQ=!state.q||(card.getAttribute('data-haystack')||'').indexOf(state.q)!==-1;
      var show=matchCat&&matchQ;
      card.style.display=show?'':'none';
      if(show)visible++;
    });
    if(empty)empty.hidden=visible!==0;
  }
  var t;
  if(search)search.addEventListener('input',function(e){
    clearTimeout(t);
    t=setTimeout(function(){state.q=(e.target.value||'').trim().toLowerCase();apply();},150);
  });
  chips.forEach(function(chip){
    chip.addEventListener('click',function(){
      chips.forEach(function(c){c.classList.remove('is-active');});
      chip.classList.add('is-active');
      state.cat=chip.getAttribute('data-cat')||'';
      apply();
    });
  });
})();`;

  return wrapSnippet({ css, html: html + `<script>${js}</script>` });
}

function FormPanel({ config, onUpdate }) {
  const cfg = { ...defaults(), ...config };
  return (
    <FormAccordion sectionType="brand-grid">
      <FormGroup title="Section header">
        <TextField label="Eyebrow" value={cfg.eyebrow} onChange={(v) => onUpdate({ eyebrow: v })} testid="bg-eyebrow" />
        <TextField label="Heading" value={cfg.heading} onChange={(v) => onUpdate({ heading: v })} testid="bg-heading" />
        <TextAreaField label="Subheading" value={cfg.subheading} onChange={(v) => onUpdate({ subheading: v })} testid="bg-subheading" />
      </FormGroup>

      <FormGroup title="Brands">
        <ListEditor
          items={cfg.items}
          onChange={(items) => onUpdate({ items })}
          newItem={() => ({ id: safeId(`brand-${Date.now()}`), name: "New brand", category: "", description: "", logo: "", logoAlt: "", link: "", openInSameTab: false, spotlight: false })}
          titleOf={(it) => it.name || "(unnamed)"}
          subtitleOf={(it) => [it.spotlight ? "Spotlight" : "", it.category].filter(Boolean).join(" · ")}
          renderForm={(item, set) => (
            <div className="space-y-3">
              <TextField label="Brand name" value={item.name} onChange={(v) => set({ name: v })} />
              <TextField label="Category" value={item.category} onChange={(v) => set({ category: v })} placeholder="e.g. Networking" />
              <TextAreaField label="Description" value={item.description} onChange={(v) => set({ description: v })} rows={2} />
              <ImageUpload label="Logo" value={item.logo} onChange={(v) => set({ logo: v })} />
              <TextField label="Logo alt text" value={item.logoAlt} onChange={(v) => set({ logoAlt: v })} />
              <TextField label="Link" value={item.link} onChange={(v) => set({ link: v })} placeholder="https://…" />
              <ToggleField label="Open in same tab" value={!!item.openInSameTab} onChange={(v) => set({ openInSameTab: v })} />
              <ToggleField label="Spotlight (show in top row)" value={!!item.spotlight} onChange={(v) => set({ spotlight: v })} />
            </div>
          )}
          testidPrefix="bg-item"
        />
      </FormGroup>

      <FormGroup title="Layout">
        <SliderField label="Main grid columns" value={cfg.columns} min={1} max={6} onChange={(v) => onUpdate({ columns: v })} />
        <SliderField label="Mobile columns" value={cfg.columnsMobile} min={1} max={3} onChange={(v) => onUpdate({ columnsMobile: v })} />
        <SliderField label="Spotlight row columns" value={cfg.spotlightColumns} min={1} max={6} onChange={(v) => onUpdate({ spotlightColumns: v })} />
        <ToggleField label="Hide spotlight brands from the main grid" value={!!cfg.spotlightHideFromMain} onChange={(v) => onUpdate({ spotlightHideFromMain: v })} />
        <SliderField label="Gap" value={cfg.gap} min={4} max={48} suffix="px" onChange={(v) => onUpdate({ gap: v })} />
        <SliderField label="Card padding" value={cfg.cardPadding} min={8} max={48} suffix="px" onChange={(v) => onUpdate({ cardPadding: v })} />
        <SliderField label="Card radius" value={cfg.cardRadius} min={0} max={32} suffix="px" onChange={(v) => onUpdate({ cardRadius: v })} />
      </FormGroup>

      <FormGroup title="Search & filters">
        <ToggleField label="Search box" value={!!cfg.searchEnabled} onChange={(v) => onUpdate({ searchEnabled: v })} />
        {cfg.searchEnabled && (
          <TextField label="Search placeholder" value={cfg.searchPlaceholder} onChange={(v) => onUpdate({ searchPlaceholder: v })} />
        )}
        <ToggleField label="Category chips" value={!!cfg.categoryFilterEnabled} onChange={(v) => onUpdate({ categoryFilterEnabled: v })} />
        {cfg.categoryFilterEnabled && (
          <TextField label="“All” chip label" value={cfg.allChipLabel} onChange={(v) => onUpdate({ allChipLabel: v })} />
        )}
        <TextField label="No-match message" value={cfg.noMatchText} onChange={(v) => onUpdate({ noMatchText: v })} />
      </FormGroup>

      <FormGroup title="Hover & card affordance">
        <SelectField
          label="Hover effect"
          value={cfg.hoverEffect}
          options={[
            { value: "bar", label: "Coloured bar on edge" },
            { value: "lift", label: "Lift + border highlight" },
            { value: "none", label: "None" },
          ]}
          onChange={(v) => onUpdate({ hoverEffect: v })}
        />
        {cfg.hoverEffect === "bar" && (
          <>
            <SelectField
              label="Bar side"
              value={cfg.barSide}
              options={[
                { value: "top", label: "Top" },
                { value: "right", label: "Right" },
                { value: "bottom", label: "Bottom" },
                { value: "left", label: "Left" },
              ]}
              onChange={(v) => onUpdate({ barSide: v })}
            />
            <SliderField label="Bar thickness" value={cfg.barThickness} min={1} max={12} suffix="px" onChange={(v) => onUpdate({ barThickness: v })} />
            <ColorField label="Bar colour" value={cfg.barColor || cfg.eyebrowAccentColor || "#E01839"} onChange={(v) => onUpdate({ barColor: v })} />
          </>
        )}
      </FormGroup>

      <FormGroup title="Colours">
        <ColorField label="Background" value={cfg.bgColor} onChange={(v) => onUpdate({ bgColor: v })} />
        <ColorField label="Card background" value={cfg.cardBg} onChange={(v) => onUpdate({ cardBg: v })} />
        <ColorField label="Card border" value={cfg.cardBorder} onChange={(v) => onUpdate({ cardBorder: v })} />
        <ColorField label="Heading & card name" value={cfg.titleColor} onChange={(v) => onUpdate({ titleColor: v })} />
        <ColorField label="Body & descriptions" value={cfg.bodyColor} onChange={(v) => onUpdate({ bodyColor: v })} />
        <ColorField label="Eyebrow / accent" value={cfg.eyebrowAccentColor || "#E01839"} onChange={(v) => onUpdate({ eyebrowAccentColor: v })} />
      </FormGroup>

      <FormGroup title="Spacing">
        <PaddingFields config={cfg} onUpdate={onUpdate} defaultValue={64} max={160} sideMax={120} testidPrefix="bg" />
      </FormGroup>
    </FormAccordion>
  );
}

export const brandGrid = {
  id: ID,
  name: "Brand grid",
  description: "Searchable, filterable brand cards with an optional spotlight row.",
  icon: Building2,
  defaults,
  render,
  FormPanel,
};
