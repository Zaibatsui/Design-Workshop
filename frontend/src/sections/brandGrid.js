/*
 * Brand Grid — clean grid of brand cards with an optional full-bleed
 * photo header band and a positionable debounced search input.
 *
 * Layout decisions:
 *   • The photo header band lives OUTSIDE `.ns-inner` so it reaches
 *     the section edges. The text inside is constrained to a 760px
 *     max-width column so it stays readable. The section's `fullBleed`
 *     flag (shared `is-full` class) makes the whole section span
 *     100vw, identical to the Hero section pattern.
 *   • Horizontal padding (`paddingX`) is applied to `.ns-inner` only,
 *     not the section root — so the header band and the section
 *     background colour reach the edges even when the inner column
 *     stays at 1200px.
 *   • The search input can sit either ABOVE the grid (default) or
 *     INSIDE the photo header (`searchPosition === "header"`). Width
 *     and horizontal alignment are author-controlled.
 *
 * No external runtime libs. JS lives in a scoped IIFE keyed by a
 * unique class so multiple instances on the same page don't collide.
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

const ID = "brand-grid";

// Default brand logos. Sourced from simpleicons.org's CDN which
// serves brand-coloured SVG glyphs at any size with no auth and no
// CORS headaches — perfect for a snippet that has to drop into
// arbitrary host sites. The set mirrors the most common B2B IT/AV
// vendors so the section reads cleanly on first preview.
const SI = (slug) => `https://cdn.simpleicons.org/${slug}`;

const defaults = () => ({
  // Section header
  eyebrow: "",
  heading: "Shop by brand",
  subheading: "Find the right partner for every need.",

  // Header background — when `headerImage` is set, the header band
  // renders as a full-width photo strip with an overlay tint and
  // light text. When blank, the header collapses to the same plain
  // centred block every other section uses.
  headerImage: "",
  headerImageAlt: "",
  headerHeight: 280,
  headerOverlayColor: "#0f172a",
  headerOverlayOpacity: 0.55,
  headerTextColor: "#ffffff",

  // Items — flat list, no spotlight tier. Order in the grid = order
  // in the editor.
  items: [
    { id: "hp", name: "HP", description: "PCs, printers and accessories trusted by businesses worldwide.", logo: SI("hp"), logoAlt: "HP logo", link: "", openInSameTab: false },
    { id: "dell", name: "Dell", description: "Business laptops, workstations and monitors for the workplace.", logo: SI("dell"), logoAlt: "Dell logo", link: "", openInSameTab: false },
    { id: "lenovo", name: "Lenovo", description: "Laptops, desktops and accessories built for productivity.", logo: SI("lenovo"), logoAlt: "Lenovo logo", link: "", openInSameTab: false },
    { id: "intel", name: "Intel", description: "Processors and platforms powering everyday computing.", logo: SI("intel"), logoAlt: "Intel logo", link: "", openInSameTab: false },
    { id: "nvidia", name: "Nvidia", description: "GPUs and accelerated computing for creators and developers.", logo: SI("nvidia"), logoAlt: "Nvidia logo", link: "", openInSameTab: false },
    { id: "cisco", name: "Cisco", description: "Networking, security and collaboration for connected teams.", logo: SI("cisco"), logoAlt: "Cisco logo", link: "", openInSameTab: false },
    { id: "apple", name: "Apple", description: "Mac, iPad and iPhone for businesses that put design first.", logo: SI("apple"), logoAlt: "Apple logo", link: "", openInSameTab: false },
  ],

  // Layout
  columns: 3,
  columnsMobile: 1,
  gap: 18,
  cardPadding: 22,
  cardRadius: 8,
  // Mirrors the hero `fullBleed` flag (shared `is-full` class). When
  // ON the section spans 100vw and the photo header reaches the
  // viewport edges; when OFF the section is contained by its
  // ancestor's width.
  fullBleed: false,

  // Search — optional, debounced. Position + alignment + width are
  // author-controlled so the input can sit anywhere from a tight
  // pill in the header to a full-width strip above the grid.
  searchEnabled: true,
  searchPlaceholder: "Search brands…",
  searchPosition: "below", // "header" | "below"
  searchAlign: "center",   // "left" | "center" | "right"
  searchWidth: 360,        // px; capped at 100% of available width
  noMatchText: "No matches. Try a different search term.",

  // Hover affordance. "lift" matches the Misco aesthetic; "bar" adds
  // a brand-coloured edge accent; "none" disables the affordance.
  hoverEffect: "lift",

  // Optional greyscale-until-hover treatment for the logos. Reads
  // cleanly on a busy page (especially with brand-coloured icons
  // from simpleicons.org) and the colour reveal on hover is a nice
  // tactile cue. Matches the Logo Strip section's same-named flag.
  greyscale: false,

  // Theme — field names match the brand-kit cascade in
  // `lib/brandKit.js` → "brand-grid" mapper.
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

const SEARCH_ALIGN_TO_FLEX = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

function render(cfg) {
  const cls = `ns-brand-grid-${makeUid()}`;
  const padTop = padTopOf(cfg, 64);
  const padBot = padBotOf(cfg, 64);
  const padX = padXOf(cfg, 20);

  const items = (cfg.items || []).filter((x) => x && x.name);

  const cardHtml = (it) => {
    const link = safeUrl(it.link || "");
    const tag = link ? "a" : "div";
    const tgt = link && !it.openInSameTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    const href = link ? ` href="${escAttr(link)}"` : "";
    const nameLower = (it.name || "").toLowerCase();
    const descLower = (it.description || "").toLowerCase();
    return `<${tag} class="ns-card"${href}${tgt} data-haystack="${escAttr(`${nameLower} ${descLower}`)}">
      ${cfg.hoverEffect === "bar" ? `<span class="ns-bar" aria-hidden="true"></span>` : ""}
      ${it.logo ? `<img class="ns-logo" src="${escAttr(safeUrl(it.logo))}" alt="${escAttr(it.logoAlt || it.name + " logo")}" loading="lazy"/>` : `<div class="ns-logo ns-logo-placeholder" aria-hidden="true"></div>`}
      <h3 class="ns-name">${escHtml(it.name)}</h3>
      ${it.description ? `<p class="ns-desc">${escHtml(it.description)}</p>` : ""}
    </${tag}>`;
  };

  // The search input markup. Used once — placed either inside the
  // photo header or above the grid, never both.
  const searchHtml = cfg.searchEnabled
    ? `<div class="ns-controls">
        <input type="search" class="ns-search" placeholder="${escAttr(cfg.searchPlaceholder || "Search…")}" aria-label="Search brands"/>
      </div>`
    : "";

  const hasHeaderImg = !!safeUrl(cfg.headerImage || "");
  const hasHeaderText = !!(cfg.eyebrow || cfg.heading || cfg.subheading);
  const searchInHeader = cfg.searchEnabled && cfg.searchPosition === "header" && hasHeaderImg;

  const headerInner = `
      ${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}
      ${cfg.heading ? `<h2 class="ns-heading">${escHtml(cfg.heading)}</h2>` : ""}
      ${cfg.subheading ? `<p class="ns-sub">${escHtml(cfg.subheading)}</p>` : ""}
      ${searchInHeader ? searchHtml : ""}`;

  // Photo header lives OUTSIDE `.ns-inner` so it spans the section
  // edge-to-edge. Plain header (no image) stays INSIDE `.ns-inner`
  // and gets the same max-width treatment as every other section.
  const photoHeader = hasHeaderImg
    ? `<header class="ns-header ns-header-bg" role="${cfg.headerImageAlt ? "img" : "presentation"}" ${cfg.headerImageAlt ? `aria-label="${escAttr(cfg.headerImageAlt)}"` : ""}>
        <div class="ns-header-overlay" aria-hidden="true"></div>
        <div class="ns-header-content">${headerInner}</div>
      </header>`
    : "";
  const plainHeader = (!hasHeaderImg && hasHeaderText)
    ? `<header class="ns-header">${headerInner}</header>`
    : "";

  // Search sits above the grid in two cases: position === "below", or
  // there's no photo header to host it.
  const searchBelow = cfg.searchEnabled && !searchInHeader ? searchHtml : "";

  const html = `<section class="ns-brand-grid ${cls}${fullBleedClass(cfg)}" data-ns-group="defaults">
  ${photoHeader}
  <div class="ns-inner">
    ${plainHeader}
    ${searchBelow}
    <div class="ns-grid" data-ns-list="items">
      ${items.map((it) => cardHtml(it)).join("")}
    </div>
    <p class="ns-empty" hidden>${escHtml(cfg.noMatchText || "No matches.")}</p>
  </div>
</section>`;

  const cols = Math.max(1, Math.min(6, num(cfg.columns, 3)));
  const colsM = Math.max(1, Math.min(3, num(cfg.columnsMobile, 1)));
  const accent = safeColor(cfg.eyebrowAccentColor, "#E01839");
  const headerTextColor = safeColor(cfg.headerTextColor, "#ffffff");
  const headerOverlay = safeColor(cfg.headerOverlayColor, "#0f172a");
  const headerOverlayOpacity = Math.min(1, Math.max(0, num(cfg.headerOverlayOpacity, 0.55)));
  const headerHeight = Math.max(80, num(cfg.headerHeight, 280));
  const searchAlign = SEARCH_ALIGN_TO_FLEX[cfg.searchAlign] || "center";
  const searchWidth = Math.max(140, Math.min(1200, num(cfg.searchWidth, 360)));

  const barRule = `
.${cls} .ns-bar{position:absolute;bottom:0;left:0;right:0;height:3px;background:${accent};transform:scaleX(0);transform-origin:left bottom;transition:transform .25s ease}
.${cls} .ns-card:hover .ns-bar{transform:scale(1)}`;

  const hoverLift = cfg.hoverEffect === "lift"
    ? `.${cls} .ns-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.06);border-color:${accent}}`
    : "";

  // Greyscale-until-hover. Targets `.ns-logo` only (placeholder /
  // wordmark / image alike) and reveals full colour on either pointer
  // hover or keyboard focus on the card so it's still accessible.
  const greyCss = cfg.greyscale
    ? `
.${cls} .ns-card .ns-logo{filter:grayscale(100%);opacity:.85;transition:filter .35s ease,opacity .35s ease}
.${cls} .ns-card:hover .ns-logo,.${cls} .ns-card:focus-visible .ns-logo{filter:none;opacity:1}`
    : "";

  // Horizontal padding lives on `.ns-inner`, NOT the section root,
  // so the photo header band can span the full section width
  // without a gap. The section root keeps the vertical padding +
  // the background colour.
  const css = `${FONT_IMPORT}
${baseReset(cls, cfg)}
.${cls}{background:${safeColor(cfg.bgColor, "#ffffff")};padding:${padTop}px 0 ${padBot}px;font-family:${cfg.font ? `"${escAttr(cfg.font)}",` : ""}-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.${cls} .ns-inner{max-width:1200px;margin:0 auto;padding:0 ${padX}px}

.${cls} .ns-header{text-align:center;margin-bottom:24px}
.${cls} .ns-header.ns-header-bg{position:relative;min-height:${headerHeight}px;display:flex;align-items:center;justify-content:center;background-image:url("${escAttr(safeUrl(cfg.headerImage || ""))}");background-size:cover;background-position:center;overflow:hidden;padding:48px ${padX}px;margin:0 0 36px}
.${cls} .ns-header-overlay{position:absolute;inset:0;background:${headerOverlay};opacity:${headerOverlayOpacity};pointer-events:none}
.${cls} .ns-header-content{position:relative;z-index:1;max-width:760px;width:100%;display:flex;flex-direction:column;align-items:center;gap:14px}
.${cls} .ns-header.ns-header-bg .ns-heading{color:${headerTextColor}}
.${cls} .ns-header.ns-header-bg .ns-sub{color:${headerTextColor};opacity:.92}

.${cls} .ns-eyebrow{margin:0;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${accent}}
.${cls} .ns-heading{margin:0;font-size:32px;font-weight:700;color:${safeColor(cfg.titleColor, "#0f172a")};line-height:1.2}
.${cls} .ns-sub{margin:0 auto;max-width:640px;color:${safeColor(cfg.bodyColor, "#475569")};font-size:15px;line-height:1.5}

.${cls} .ns-controls{display:flex;justify-content:${searchAlign};margin:0 0 22px}
.${cls} .ns-header-content .ns-controls{margin:6px 0 0;width:100%}
.${cls} .ns-search{flex:0 1 ${searchWidth}px;min-width:0;width:100%;max-width:${searchWidth}px;padding:10px 14px;border:1px solid ${safeColor(cfg.cardBorder, "#e5e7eb")};border-radius:${num(cfg.cardRadius, 8)}px;font:inherit;font-size:14px;background:#fff;color:${safeColor(cfg.titleColor, "#0f172a")}}
.${cls} .ns-search:focus{outline:2px solid ${accent};outline-offset:1px}

.${cls} .ns-grid{display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${num(cfg.gap, 18)}px}
.${cls} .ns-card{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;background:${safeColor(cfg.cardBg, "#ffffff")};border:1px solid ${safeColor(cfg.cardBorder, "#e5e7eb")};border-radius:${num(cfg.cardRadius, 8)}px;padding:${num(cfg.cardPadding, 22)}px;text-decoration:none;color:inherit;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;overflow:hidden}
.${cls} .ns-logo{height:56px;width:auto;max-width:170px;object-fit:contain;margin-bottom:4px}
.${cls} .ns-logo-placeholder{background:${safeColor(cfg.cardBorder, "#e5e7eb")};border-radius:6px;width:140px;height:56px}
.${cls} .ns-name{margin:0;font-size:17px;font-weight:700;color:${safeColor(cfg.titleColor, "#0f172a")};line-height:1.3}
.${cls} .ns-desc{margin:0;font-size:13px;color:${safeColor(cfg.bodyColor, "#475569")};line-height:1.5}
.${cls} .ns-empty{margin:24px auto 0;text-align:center;color:${safeColor(cfg.bodyColor, "#475569")};font-size:14px}
${hoverLift}
${greyCss}
${cfg.hoverEffect === "bar" ? barRule : ""}
@media (max-width:767px){
  .${cls} .ns-grid{grid-template-columns:repeat(${colsM},minmax(0,1fr))}
  .${cls} .ns-heading{font-size:24px}
  .${cls} .ns-header.ns-header-bg{min-height:${Math.max(160, Math.round(headerHeight * 0.75))}px;padding:32px 18px;margin-bottom:24px}
  .${cls} .ns-search{flex:1 1 auto;max-width:100%}
  .${cls} .ns-controls{justify-content:stretch}
}`;

  // Debounced search only — no chip / filter state.
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

  const addItem = () =>
    onUpdate({
      items: [
        ...items,
        {
          id: makeUid(),
          name: "New brand",
          description: "",
          logo: "",
          logoAlt: "",
          link: "",
          openInSameTab: false,
        },
      ],
    });
  const removeItem = (id) =>
    onUpdate({ items: items.filter((i) => i.id !== id) });
  const moveItem = (id, dir) => {
    const idx = items.findIndex((i) => i.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= items.length) return;
    const arr = [...items];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    onUpdate({ items: arr });
  };
  const duplicateItem = (id) => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const clone = { ...items[idx], id: makeUid() };
    const arr = [...items];
    arr.splice(idx + 1, 0, clone);
    onUpdate({ items: arr });
  };
  const updateItem = (id, patch) =>
    onUpdate({
      items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });

  return (
    <FormAccordion sectionType="brand-grid">
      <FormGroup title="Header">
        <TextField label="Eyebrow" value={cfg.eyebrow} onChange={(v) => onUpdate({ eyebrow: v })} testid="bg-eyebrow" />
        <TextField label="Heading" value={cfg.heading} onChange={(v) => onUpdate({ heading: v })} testid="bg-heading" />
        <TextAreaField label="Subheading" value={cfg.subheading} onChange={(v) => onUpdate({ subheading: v })} testid="bg-subheading" />
      </FormGroup>

      <FormGroup title="Header background">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Background image
          </Label>
          <ImageUpload
            value={cfg.headerImage}
            onChange={(v) => onUpdate({ headerImage: v })}
            testid="bg-header-image"
            compact
          />
        </div>
        {cfg.headerImage && (
          <>
            <TextField
              label="Image alt text"
              value={cfg.headerImageAlt}
              onChange={(v) => onUpdate({ headerImageAlt: v })}
              testid="bg-header-image-alt"
            />
            <SliderField
              label="Header height"
              value={cfg.headerHeight}
              min={140}
              max={520}
              suffix="px"
              onChange={(v) => onUpdate({ headerHeight: v })}
            />
            <ColorField
              label="Overlay colour"
              value={cfg.headerOverlayColor}
              onChange={(v) => onUpdate({ headerOverlayColor: v })}
            />
            <SliderField
              label="Overlay opacity"
              value={Math.round((cfg.headerOverlayOpacity ?? 0.55) * 100)}
              min={0}
              max={100}
              suffix="%"
              onChange={(v) => onUpdate({ headerOverlayOpacity: v / 100 })}
            />
            <ColorField
              label="Header text colour"
              value={cfg.headerTextColor}
              onChange={(v) => onUpdate({ headerTextColor: v })}
            />
          </>
        )}
      </FormGroup>

      <FormGroup title="Brands">
        <ListEditor
          items={items}
          onAdd={addItem}
          onRemove={removeItem}
          onMove={moveItem}
          onDuplicate={duplicateItem}
          addLabel="Add brand"
          testidPrefix="bg-item"
          renderRow={(it) => (
            <div className="flex items-center gap-2">
              <div className="w-10 h-7 rounded-sm bg-slate-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {it.logo && (
                  <img
                    src={it.logo}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">
                {it.name || "(unnamed)"}
              </p>
            </div>
          )}
          renderForm={(it) => (
            <>
              <TextField
                label="Brand name"
                value={it.name}
                onChange={(v) => updateItem(it.id, { name: v })}
                testid={`bg-name-${it.id}`}
              />
              <TextAreaField
                label="Description"
                value={it.description}
                onChange={(v) => updateItem(it.id, { description: v })}
                rows={2}
                testid={`bg-desc-${it.id}`}
              />
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Logo
                </Label>
                <ImageUpload
                  value={it.logo}
                  onChange={(v) => updateItem(it.id, { logo: v })}
                  testid={`bg-logo-${it.id}`}
                  compact
                />
              </div>
              <TextField
                label="Logo alt text"
                value={it.logoAlt}
                onChange={(v) => updateItem(it.id, { logoAlt: v })}
                testid={`bg-logoalt-${it.id}`}
              />
              <TextField
                label="Link (optional)"
                placeholder="https://example.com"
                value={it.link || ""}
                onChange={(v) => updateItem(it.id, { link: v })}
                testid={`bg-link-${it.id}`}
              />
              <ToggleField
                label="Open in same tab"
                checked={!!it.openInSameTab}
                onChange={(v) => updateItem(it.id, { openInSameTab: v })}
                testid={`bg-sametab-${it.id}`}
              />
            </>
          )}
        />
      </FormGroup>

      <FormGroup title="Layout">
        <ToggleField
          label="Make wide"
          description="Stretch background and header to full viewport width"
          checked={!!cfg.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="bg-full-bleed"
        />
        <SliderField label="Columns" value={cfg.columns} min={1} max={6} onChange={(v) => onUpdate({ columns: v })} />
        <SliderField label="Mobile columns" value={cfg.columnsMobile} min={1} max={3} onChange={(v) => onUpdate({ columnsMobile: v })} />
        <SliderField label="Gap" value={cfg.gap} min={4} max={48} suffix="px" onChange={(v) => onUpdate({ gap: v })} />
        <SliderField label="Card padding" value={cfg.cardPadding} min={8} max={48} suffix="px" onChange={(v) => onUpdate({ cardPadding: v })} />
        <SliderField label="Card radius" value={cfg.cardRadius} min={0} max={32} suffix="px" onChange={(v) => onUpdate({ cardRadius: v })} />
      </FormGroup>

      <FormGroup title="Search">
        <ToggleField
          label="Show search box"
          checked={!!cfg.searchEnabled}
          onChange={(v) => onUpdate({ searchEnabled: v })}
        />
        {cfg.searchEnabled && (
          <>
            <TextField
              label="Search placeholder"
              value={cfg.searchPlaceholder}
              onChange={(v) => onUpdate({ searchPlaceholder: v })}
            />
            <SelectField
              label="Position"
              value={cfg.searchPosition}
              options={[
                { value: "below", label: "Below the header" },
                { value: "header", label: "Inside the header (over the image)" },
              ]}
              onChange={(v) => onUpdate({ searchPosition: v })}
            />
            {cfg.searchPosition === "header" && !cfg.headerImage && (
              <p className="text-xs text-amber-600">
                Add a header background image to use this position. Falls back to
                "below" until then.
              </p>
            )}
            <SelectField
              label="Alignment"
              value={cfg.searchAlign}
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Centre" },
                { value: "right", label: "Right" },
              ]}
              onChange={(v) => onUpdate({ searchAlign: v })}
            />
            <SliderField
              label="Width"
              value={cfg.searchWidth}
              min={180}
              max={760}
              suffix="px"
              onChange={(v) => onUpdate({ searchWidth: v })}
            />
            <TextField
              label="No-match message"
              value={cfg.noMatchText}
              onChange={(v) => onUpdate({ noMatchText: v })}
            />
          </>
        )}
      </FormGroup>

      <FormGroup title="Hover effect">
        <SelectField
          label="On hover"
          value={cfg.hoverEffect}
          options={[
            { value: "lift", label: "Lift + border highlight" },
            { value: "bar", label: "Accent bar on edge" },
            { value: "none", label: "None" },
          ]}
          onChange={(v) => onUpdate({ hoverEffect: v })}
        />
        <ToggleField
          label="Greyscale until hover"
          description="Render every logo in greyscale; reveal full colour when the cursor lands on it."
          checked={!!cfg.greyscale}
          onChange={(v) => onUpdate({ greyscale: v })}
          testid="bg-greyscale"
        />
      </FormGroup>

      <FormGroup title="Colours">
        <ColorField label="Section background" value={cfg.bgColor} onChange={(v) => onUpdate({ bgColor: v })} />
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
  description: "Grid of brand cards with an optional full-width photo header and search.",
  icon: Building2,
  defaults,
  render,
  FormPanel,
};
