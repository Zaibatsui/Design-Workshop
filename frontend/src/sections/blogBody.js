/*
 * Blog body — long-form article block with an optional sidebar.
 *
 * A self-contained section that renders a main rich-text article
 * column with an optional sidebar containing four widget types:
 * CTA card, Related articles, Tag cluster, Author card. The
 * sidebar can sit Left / Right / Below the main column, with an
 * optional sticky-on-scroll mode for desktop.
 *
 * Architecture decision: this is ONE section that owns both
 * columns internally (rather than a wrapper section that contains
 * other sections from the registry). That keeps the page rail
 * flat and lets all the layout / responsive logic live in one
 * place, with no page-editor changes.
 *
 * Brand-kit cascade: every colour, font, radius and accent flows
 * from `lib/brandKit.js` → "blog-body" mapper. No Misco styling
 * or branding — defaults follow the same neutral slate / accent
 * palette every other section ships with.
 *
 * Responsive: below 768px the sidebar collapses below the main
 * column and turns into a horizontal scroll-snap carousel so users
 * can swipe through widgets one at a time. Pure CSS, no JS.
 */
import { BookOpen } from "lucide-react";
import { useState } from "react";
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
  richBodyResetCss,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import ListEditor from "@/components/ListEditor";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import BlogPagePicker from "@/components/BlogPagePicker";
import { Button } from "@/components/ui/button";
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
import RichTextEditor from "@/components/RichTextEditor";
import { pageToRelatedItem, entryToRelatedItem } from "@/lib/pageBlogMeta";

const ID = "blog-body";

const WIDGET_TYPES = [
  { value: "cta", label: "Get-in-touch CTA card" },
  { value: "related", label: "Related articles" },
  { value: "tags", label: "Tag cluster" },
  { value: "author", label: "Author card" },
];

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=240&auto=format&fit=crop";

const defaults = () => ({
  // Section header — optional. When all three fields are empty the
  // section starts straight on the body column.
  eyebrow: "",
  heading: "",
  subheading: "",

  // Main column body — rich text, sanitized at render-time.
  body:
    "<p>Open with the idea that would make a reader nod. Then back it up with one concrete example of the problem — something specific enough that it's obvious you've actually run into it.</p>" +
    "<h2>The argument</h2>" +
    "<p>Make the case in tight paragraphs. Use <strong>bold</strong> for the numbers that matter and link out <a href=\"#\">only when it's genuinely useful</a>.</p>" +
    "<ul><li>A punchy list when you need to slow the reader down</li><li>One item per thought — no smuggled sub-clauses</li><li>Three to five items max, otherwise it's a spreadsheet</li></ul>" +
    "<h2>What it looks like in practice</h2>" +
    "<p>Ground the idea in a scenario your reader would recognise. This is usually the section people screenshot and share.</p>",

  // Sidebar layout
  sidebarPosition: "right", // "left" | "right" | "below"
  sidebarWidth: 320,        // px; capped at 480 to keep the body readable
  sidebarSticky: false,     // opt-in — pins the sidebar to the viewport on desktop
  sidebarGap: 48,           // gutter between the two columns

  // Sidebar widgets — order in the list = render order, top to bottom
  widgets: [
    {
      id: "w-cta",
      type: "cta",
      heading: "Talk to a specialist",
      body: "Tell us about your project and we'll come back with a tailored brief within one working day.",
      ctaLabel: "Get in touch",
      ctaUrl: "#",
      bgColor: "", // empty → falls back to brand-kit accent
    },
    {
      id: "w-related",
      type: "related",
      heading: "Related articles",
      items: [
        { id: makeUid(), title: "Five questions to ask before a refresh", excerpt: "What to align on before you procure.", image: "", link: "#" },
        { id: makeUid(), title: "The case for fewer vendors", excerpt: "Consolidation, when it works and when it doesn't.", image: "", link: "#" },
        { id: makeUid(), title: "A practical guide to migration", excerpt: "Plan in weeks, ship in days.", image: "", link: "#" },
      ],
    },
    {
      id: "w-tags",
      type: "tags",
      heading: "Topics",
      items: [
        { id: makeUid(), label: "Infrastructure", link: "#" },
        { id: makeUid(), label: "Security", link: "#" },
        { id: makeUid(), label: "Storage", link: "#" },
        { id: makeUid(), label: "Networking", link: "#" },
        { id: makeUid(), label: "Procurement", link: "#" },
      ],
    },
    {
      id: "w-author",
      type: "author",
      avatar: DEFAULT_AVATAR,
      avatarAlt: "Author portrait",
      name: "Sam Reynolds",
      role: "Editorial team",
      bio: "Writes about IT strategy, infrastructure and the unglamorous decisions that keep teams shipping.",
      linkLabel: "All posts by Sam",
      linkUrl: "#",
    },
  ],

  // Theme — these mirror the field names that the brand-kit cascade
  // (`lib/brandKit.js` → "blog-body" mapper) writes into.
  bgColor: "#ffffff",
  cardBg: "#ffffff",
  cardBorder: "#e5e7eb",
  titleColor: "#0f172a",
  bodyColor: "#475569",
  eyebrowAccentColor: "",
  cardRadius: 8,
  font: "",

  // Spacing
  paddingY: 64,
  paddingTop: 64,
  paddingBottom: 64,
  paddingX: 20,
  fullBleed: false,
});

function renderWidget(w, accent, cardBg, cardBorder, titleColor, bodyColor, radius) {
  const headHtml = w.heading
    ? `<h3 class="ns-w-head">${escHtml(w.heading)}</h3>`
    : "";

  if (w.type === "cta") {
    const bg = safeColor(w.bgColor, accent);
    const url = safeUrl(w.ctaUrl || "#") || "#";
    return `<aside class="ns-widget ns-w-cta" data-ns-list="widget" data-ns-item="${escAttr(w.id)}" style="background:${bg};color:#ffffff">
      <h3 class="ns-w-head ns-w-cta-head">${escHtml(w.heading || "Get in touch")}</h3>
      ${w.body ? `<p class="ns-w-cta-body">${escHtml(w.body)}</p>` : ""}
      <a class="ns-w-cta-btn" href="${escAttr(url)}">${escHtml(w.ctaLabel || "Contact us")}</a>
    </aside>`;
  }

  if (w.type === "related") {
    const items = (w.items || []).map((it) => {
      const url = safeUrl(it.link || "#") || "#";
      const img = safeUrl(it.image || "");
      return `<a class="ns-w-rel-item" href="${escAttr(url)}">
        ${img ? `<img class="ns-w-rel-img" src="${escAttr(img)}" alt="" loading="lazy"/>` : `<div class="ns-w-rel-img ns-w-rel-img-ph" aria-hidden="true"></div>`}
        <div class="ns-w-rel-text">
          <p class="ns-w-rel-title">${escHtml(it.title || "Untitled")}</p>
          ${it.excerpt ? `<p class="ns-w-rel-excerpt">${escHtml(it.excerpt)}</p>` : ""}
        </div>
      </a>`;
    }).join("");
    return `<aside class="ns-widget ns-w-related" data-ns-list="widget" data-ns-item="${escAttr(w.id)}">
      ${headHtml}
      <div class="ns-w-rel-list">${items}</div>
    </aside>`;
  }

  if (w.type === "tags") {
    const chips = (w.items || []).map((it) => {
      const url = safeUrl(it.link || "#") || "#";
      return `<a class="ns-w-tag" href="${escAttr(url)}">${escHtml(it.label || "tag")}</a>`;
    }).join("");
    return `<aside class="ns-widget ns-w-tags" data-ns-list="widget" data-ns-item="${escAttr(w.id)}">
      ${headHtml}
      <div class="ns-w-tag-cluster">${chips}</div>
    </aside>`;
  }

  if (w.type === "author") {
    const avatar = safeUrl(w.avatar || "");
    const url = safeUrl(w.linkUrl || "");
    return `<aside class="ns-widget ns-w-author" data-ns-list="widget" data-ns-item="${escAttr(w.id)}">
      ${avatar ? `<img class="ns-w-author-avatar" src="${escAttr(avatar)}" alt="${escAttr(w.avatarAlt || w.name || "")}" loading="lazy"/>` : ""}
      <p class="ns-w-author-name">${escHtml(w.name || "Author")}</p>
      ${w.role ? `<p class="ns-w-author-role">${escHtml(w.role)}</p>` : ""}
      ${w.bio ? `<p class="ns-w-author-bio">${escHtml(w.bio)}</p>` : ""}
      ${url && w.linkLabel ? `<a class="ns-w-author-link" href="${escAttr(url)}">${escHtml(w.linkLabel)}</a>` : ""}
    </aside>`;
  }

  return "";
}

function render(cfg) {
  const cls = `ns-blog-body-${makeUid()}`;
  const padTop = padTopOf(cfg, 64);
  const padBot = padBotOf(cfg, 64);
  const padX = padXOf(cfg, 20);

  const accent = safeColor(cfg.eyebrowAccentColor, "#E01839");
  const cardBg = safeColor(cfg.cardBg, "#ffffff");
  const cardBorder = safeColor(cfg.cardBorder, "#e5e7eb");
  const titleColor = safeColor(cfg.titleColor, "#0f172a");
  const bodyColor = safeColor(cfg.bodyColor, "#475569");
  const radius = num(cfg.cardRadius, 8);

  const pos = ["left", "right", "below"].includes(cfg.sidebarPosition) ? cfg.sidebarPosition : "right";
  const widgets = cfg.widgets || [];
  const hasSidebar = pos !== "below" || widgets.length > 0;
  const sidebarWidth = Math.max(220, Math.min(480, num(cfg.sidebarWidth, 320)));
  const gap = Math.max(16, Math.min(96, num(cfg.sidebarGap, 48)));

  const headerHtml =
    cfg.eyebrow || cfg.heading || cfg.subheading
      ? `<header class="ns-head" data-ns-group="header">
          ${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}
          ${cfg.heading ? `<h1 class="ns-heading">${escHtml(cfg.heading)}</h1>` : ""}
          ${cfg.subheading ? `<p class="ns-sub">${escHtml(cfg.subheading)}</p>` : ""}
        </header>`
      : "";

  const bodyHtml = `<article class="ns-main" data-ns-group="body">${String(cfg.body || "")}</article>`;

  const sidebarHtml = widgets.length
    ? `<aside class="ns-sidebar" data-ns-group="widgets" data-ns-list="widget">
        ${widgets.map((w) => renderWidget(w, accent, cardBg, cardBorder, titleColor, bodyColor, radius)).join("")}
      </aside>`
    : "";

  const html = `<section class="ns-blog-body ${cls}${fullBleedClass(cfg)} ns-pos-${pos}${cfg.sidebarSticky ? " ns-sticky" : ""}">
  ${headerHtml}
  <div class="ns-inner">
    ${pos === "left" ? sidebarHtml + bodyHtml : ""}
    ${pos === "right" ? bodyHtml + sidebarHtml : ""}
    ${pos === "below" ? bodyHtml + sidebarHtml : ""}
  </div>
</section>`;

  // CSS — two-column flex layout on desktop, single column with a
  // scroll-snap carousel for the sidebar on mobile. `ns-pos-left` /
  // `ns-pos-right` flip the visual order (DOM order stays
  // sidebar-then-body for `left` to give correct tab order). When
  // `ns-sticky` is set the sidebar is `position: sticky` with a
  // `top: 24px` offset; falls back gracefully when the body is
  // shorter than the sidebar.
  const css = `${FONT_IMPORT}
${baseReset(cls, cfg)}
.${cls}{background:${safeColor(cfg.bgColor, "#ffffff")};padding:${padTop}px 0 ${padBot}px;font-family:${cfg.font ? `"${escAttr(cfg.font)}",` : ""}-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:${bodyColor}}
.${cls} .ns-head{max-width:1200px;margin:0 auto 28px;padding:0 ${padX}px;text-align:left}
.${cls} .ns-eyebrow{margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${accent}}
.${cls} .ns-heading{margin:0 0 8px;font-size:36px;font-weight:700;color:${titleColor};line-height:1.15}
.${cls} .ns-sub{margin:0;font-size:16px;color:${bodyColor};line-height:1.5}
.${cls} .ns-inner{max-width:1200px;margin:0 auto;padding:0 ${padX}px;display:flex;gap:${gap}px;align-items:flex-start}
.${cls}.ns-pos-below .ns-inner{flex-direction:column;gap:48px}
.${cls} .ns-main{flex:1 1 auto;min-width:0;font-size:16px;line-height:1.65;color:${bodyColor}}
.${cls} .ns-main h1,.${cls} .ns-main h2,.${cls} .ns-main h3,.${cls} .ns-main h4{color:${titleColor};margin:1.6em 0 .5em;line-height:1.25}
.${cls} .ns-main h2{font-size:24px;font-weight:700}
.${cls} .ns-main h3{font-size:19px;font-weight:600}
.${cls} .ns-main strong{color:${titleColor}}
${richBodyResetCss(`.${cls} .ns-main`, { paraSpacing: 16, linkColor: accent })}
.${cls} .ns-sidebar{flex:0 0 ${sidebarWidth}px;max-width:${sidebarWidth}px;display:flex;flex-direction:column;gap:20px}
.${cls}.ns-pos-below .ns-sidebar{flex-basis:auto;max-width:none}
.${cls}.ns-sticky .ns-sidebar{position:sticky;top:24px;align-self:flex-start}

.${cls} .ns-widget{background:${cardBg};border:1px solid ${cardBorder};border-radius:${radius}px;padding:20px;color:${bodyColor}}
.${cls} .ns-w-head{margin:0 0 12px;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${titleColor}}

.${cls} .ns-w-cta{border:0}
.${cls} .ns-w-cta-head{color:#ffffff;margin:0 0 8px;font-size:18px;text-transform:none;letter-spacing:0}
.${cls} .ns-w-cta-body{margin:0 0 14px;font-size:14px;line-height:1.5;color:#ffffff;opacity:.92}
.${cls} .ns-w-cta-btn{display:inline-block;padding:10px 18px;border-radius:${Math.max(4, radius - 2)}px;background:#ffffff;color:${accent};font-weight:700;font-size:14px;text-decoration:none;transition:transform .18s ease,opacity .18s ease}
.${cls} .ns-w-cta-btn:hover{transform:translateY(-1px);opacity:.92}

.${cls} .ns-w-rel-list{display:flex;flex-direction:column;gap:14px}
.${cls} .ns-w-rel-item{display:flex;gap:12px;align-items:flex-start;text-decoration:none;color:inherit;transition:transform .18s ease}
.${cls} .ns-w-rel-item:hover{transform:translateX(2px)}
.${cls} .ns-w-rel-img{flex:0 0 64px;width:64px;height:64px;object-fit:cover;border-radius:6px;background:${cardBorder}}
.${cls} .ns-w-rel-img-ph{}
.${cls} .ns-w-rel-text{min-width:0}
.${cls} .ns-w-rel-title{margin:0 0 4px;font-size:14px;font-weight:600;color:${titleColor};line-height:1.35}
.${cls} .ns-w-rel-excerpt{margin:0;font-size:13px;color:${bodyColor};line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

.${cls} .ns-w-tag-cluster{display:flex;flex-wrap:wrap;gap:8px}
.${cls} .ns-w-tag{display:inline-block;padding:6px 12px;border-radius:999px;background:${cardBorder};color:${titleColor};font-size:13px;font-weight:500;text-decoration:none;transition:background .18s ease,color .18s ease}
.${cls} .ns-w-tag:hover{background:${accent};color:#ffffff}

.${cls} .ns-w-author{text-align:center}
.${cls} .ns-w-author-avatar{display:block;width:72px;height:72px;border-radius:50%;object-fit:cover;margin:0 auto 10px}
.${cls} .ns-w-author-name{margin:0;font-size:16px;font-weight:700;color:${titleColor}}
.${cls} .ns-w-author-role{margin:2px 0 8px;font-size:12px;color:${accent};font-weight:600;text-transform:uppercase;letter-spacing:.08em}
.${cls} .ns-w-author-bio{margin:0 0 12px;font-size:13px;line-height:1.5;color:${bodyColor}}
.${cls} .ns-w-author-link{display:inline-block;font-size:13px;font-weight:600;color:${accent};text-decoration:none}
.${cls} .ns-w-author-link:hover{text-decoration:underline}

@media (max-width:767px){
  .${cls} .ns-heading{font-size:26px}
  .${cls} .ns-inner{flex-direction:column;gap:32px}
  .${cls}.ns-sticky .ns-sidebar{position:static;top:auto}
  .${cls} .ns-sidebar{flex-basis:auto;max-width:none;flex-direction:row;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;margin:0 -${padX}px;padding-left:${padX}px;padding-right:${padX}px;scrollbar-width:none}
  .${cls} .ns-sidebar::-webkit-scrollbar{display:none}
  .${cls} .ns-widget{flex:0 0 calc(100% - 32px);max-width:calc(100% - 32px);scroll-snap-align:start}
}`;

  return wrapSnippet({ css, html });
}

function FormPanel({ config, onUpdate }) {
  const cfg = { ...defaults(), ...config };
  const widgets = cfg.widgets || [];
  // When non-null, the BlogPagePicker dialog is open and any pick will
  // be appended to the related-widget whose id is stored here. Keyed
  // by widget id (rather than a boolean) so multiple related widgets
  // can each have their own "Pick" button without colliding.
  const [pickerForWidgetId, setPickerForWidgetId] = useState(null);

  // Generic mutators for the widget list. Each widget is a tagged
  // union keyed off `type`; the per-widget form renders different
  // fields based on that key.
  const addWidget = (type = "cta") =>
    onUpdate({
      widgets: [
        ...widgets,
        type === "cta"
          ? { id: makeUid(), type, heading: "New CTA", body: "Short pitch.", ctaLabel: "Contact us", ctaUrl: "#", bgColor: "" }
          : type === "related"
          ? { id: makeUid(), type, heading: "Related", items: [] }
          : type === "tags"
          ? { id: makeUid(), type, heading: "Topics", items: [] }
          : { id: makeUid(), type: "author", avatar: "", avatarAlt: "", name: "Author name", role: "Role", bio: "", linkLabel: "", linkUrl: "" },
      ],
    });
  const removeW = (id) => onUpdate({ widgets: widgets.filter((w) => w.id !== id) });
  const moveW = (id, dir) => {
    const i = widgets.findIndex((w) => w.id === id);
    const ni = i + dir;
    if (i < 0 || ni < 0 || ni >= widgets.length) return;
    const arr = [...widgets];
    const [m] = arr.splice(i, 1);
    arr.splice(ni, 0, m);
    onUpdate({ widgets: arr });
  };
  const dupW = (id) => {
    const i = widgets.findIndex((w) => w.id === id);
    if (i < 0) return;
    const clone = { ...widgets[i], id: makeUid() };
    const arr = [...widgets];
    arr.splice(i + 1, 0, clone);
    onUpdate({ widgets: arr });
  };
  const upW = (id, patch) =>
    onUpdate({ widgets: widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)) });
  const upSubList = (wid, items) => upW(wid, { items });

  // Append a related-articles item populated from an existing blog
  // page. Called by the BlogPagePicker's `onPick` when the user picks
  // a page after clicking "Pick from your pages" inside a related
  // widget. The widget id is captured in `pickerForWidgetId`.
  const addRelatedFromPage = (entry) => {
    if (!pickerForWidgetId) return;
    const w = widgets.find((x) => x.id === pickerForWidgetId);
    if (!w) return;
    const item = {
      id: makeUid(),
      ...entryToRelatedItem(entry),
      source_kind: entry.kind,
      source_id: entry.id,
      // Keep page_id for backwards-compat with the previous shape.
      page_id: entry.kind === "page" ? entry.id : undefined,
    };
    upSubList(w.id, [...(w.items || []), item]);
  };
  const pickerWidget = pickerForWidgetId
    ? widgets.find((w) => w.id === pickerForWidgetId)
    : null;
  const pickerExcludeIds = (pickerWidget?.items || [])
    .map((i) => i.source_id || i.page_id)
    .filter(Boolean);

  return (
    <FormAccordion sectionType="blog-body">
      <FormGroup title="Header">
        <TextField label="Eyebrow" value={cfg.eyebrow} onChange={(v) => onUpdate({ eyebrow: v })} testid="bb-eyebrow" />
        <TextField label="Heading" value={cfg.heading} onChange={(v) => onUpdate({ heading: v })} testid="bb-heading" />
        <TextAreaField label="Subheading" value={cfg.subheading} onChange={(v) => onUpdate({ subheading: v })} testid="bb-subheading" />
      </FormGroup>

      <FormGroup title="Body" value="body">
        <RichTextEditor
          html={cfg.body}
          onChange={(v) => onUpdate({ body: v })}
          tools={["h2", "h3", "bold", "italic", "ul", "ol", "link", "align"]}
          inheritedAlign="left"
        />
      </FormGroup>

      <FormGroup title="Sidebar layout">
        <SelectField
          label="Sidebar position"
          value={cfg.sidebarPosition}
          options={[
            { value: "right", label: "Right" },
            { value: "left", label: "Left" },
            { value: "below", label: "Below the body (full-width)" },
          ]}
          onChange={(v) => onUpdate({ sidebarPosition: v })}
        />
        <SliderField label="Sidebar width" value={cfg.sidebarWidth} min={220} max={480} suffix="px" onChange={(v) => onUpdate({ sidebarWidth: v })} />
        <SliderField label="Column gap" value={cfg.sidebarGap} min={16} max={96} suffix="px" onChange={(v) => onUpdate({ sidebarGap: v })} />
        <ToggleField
          label="Sticky on scroll"
          description="Pin the sidebar to the viewport as the body scrolls (desktop only)."
          checked={!!cfg.sidebarSticky}
          onChange={(v) => onUpdate({ sidebarSticky: v })}
        />
      </FormGroup>

      <FormGroup title={`Widgets (${widgets.length})`} value="widgets">
        <ListEditor
          items={widgets}
          onAdd={() => addWidget("cta")}
          onRemove={removeW}
          onMove={moveW}
          onDuplicate={dupW}
          addLabel="Add widget"
          testidPrefix="widget"
          renderRow={(w) => (
            <p className="text-sm font-medium text-slate-900 truncate">
              {WIDGET_TYPES.find((t) => t.value === w.type)?.label || w.type}
              {w.heading ? <span className="text-slate-500 font-normal"> — {w.heading}</span> : null}
            </p>
          )}
          renderForm={(w) => (
            <>
              <SelectField
                label="Widget type"
                value={w.type}
                options={WIDGET_TYPES}
                onChange={(v) => upW(w.id, { type: v })}
              />
              {w.type === "cta" && (
                <>
                  <TextField label="Heading" value={w.heading || ""} onChange={(v) => upW(w.id, { heading: v })} />
                  <TextAreaField label="Body" value={w.body || ""} onChange={(v) => upW(w.id, { body: v })} rows={3} />
                  <TextField label="Button label" value={w.ctaLabel || ""} onChange={(v) => upW(w.id, { ctaLabel: v })} />
                  <TextField label="Button URL" value={w.ctaUrl || ""} onChange={(v) => upW(w.id, { ctaUrl: v })} placeholder="https://…" />
                  <ColorField label="Background (blank = brand accent)" value={w.bgColor || ""} onChange={(v) => upW(w.id, { bgColor: v })} />
                </>
              )}
              {(w.type === "related" || w.type === "tags") && (
                <TextField label="Heading" value={w.heading || ""} onChange={(v) => upW(w.id, { heading: v })} />
              )}
              {w.type === "related" && (
                <>
                  <div className="flex items-center justify-end -mt-1 mb-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPickerForWidgetId(w.id)}
                      data-testid={`related-pick-from-page-${w.id}`}
                      className="h-8 gap-1.5 text-[12px]"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Pick from your pages
                    </Button>
                  </div>
                  <ListEditor
                  items={w.items || []}
                  onAdd={() => upSubList(w.id, [...(w.items || []), { id: makeUid(), title: "New article", excerpt: "", image: "", link: "#" }])}
                  onRemove={(rid) => upSubList(w.id, (w.items || []).filter((i) => i.id !== rid))}
                  onMove={(rid, dir) => {
                    const arr = [...(w.items || [])];
                    const i = arr.findIndex((it) => it.id === rid);
                    const ni = i + dir;
                    if (i < 0 || ni < 0 || ni >= arr.length) return;
                    const [m] = arr.splice(i, 1);
                    arr.splice(ni, 0, m);
                    upSubList(w.id, arr);
                  }}
                  onDuplicate={(rid) => {
                    const arr = [...(w.items || [])];
                    const i = arr.findIndex((it) => it.id === rid);
                    if (i < 0) return;
                    arr.splice(i + 1, 0, { ...arr[i], id: makeUid() });
                    upSubList(w.id, arr);
                  }}
                  addLabel="Add article"
                  testidPrefix={`rel-${w.id}`}
                  renderRow={(it) => <p className="text-sm truncate">{it.title || "Untitled"}</p>}
                  renderForm={(it) => (
                    <>
                      <TextField label="Title" value={it.title} onChange={(v) => upSubList(w.id, (w.items || []).map((x) => (x.id === it.id ? { ...x, title: v } : x)))} />
                      <TextField label="Excerpt" value={it.excerpt || ""} onChange={(v) => upSubList(w.id, (w.items || []).map((x) => (x.id === it.id ? { ...x, excerpt: v } : x)))} />
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Thumbnail</Label>
                        <ImageUpload value={it.image} onChange={(v) => upSubList(w.id, (w.items || []).map((x) => (x.id === it.id ? { ...x, image: v } : x)))} compact />
                      </div>
                      <TextField label="Link" value={it.link || ""} onChange={(v) => upSubList(w.id, (w.items || []).map((x) => (x.id === it.id ? { ...x, link: v } : x)))} placeholder="https://…" />
                    </>
                  )}
                />
                </>
              )}
              {w.type === "tags" && (
                <ListEditor
                  items={w.items || []}
                  onAdd={() => upSubList(w.id, [...(w.items || []), { id: makeUid(), label: "Tag", link: "#" }])}
                  onRemove={(rid) => upSubList(w.id, (w.items || []).filter((i) => i.id !== rid))}
                  onMove={(rid, dir) => {
                    const arr = [...(w.items || [])];
                    const i = arr.findIndex((it) => it.id === rid);
                    const ni = i + dir;
                    if (i < 0 || ni < 0 || ni >= arr.length) return;
                    const [m] = arr.splice(i, 1);
                    arr.splice(ni, 0, m);
                    upSubList(w.id, arr);
                  }}
                  onDuplicate={(rid) => {
                    const arr = [...(w.items || [])];
                    const i = arr.findIndex((it) => it.id === rid);
                    if (i < 0) return;
                    arr.splice(i + 1, 0, { ...arr[i], id: makeUid() });
                    upSubList(w.id, arr);
                  }}
                  addLabel="Add tag"
                  testidPrefix={`tag-${w.id}`}
                  renderRow={(it) => <p className="text-sm truncate">{it.label || "tag"}</p>}
                  renderForm={(it) => (
                    <>
                      <TextField label="Label" value={it.label} onChange={(v) => upSubList(w.id, (w.items || []).map((x) => (x.id === it.id ? { ...x, label: v } : x)))} />
                      <TextField label="Link" value={it.link || ""} onChange={(v) => upSubList(w.id, (w.items || []).map((x) => (x.id === it.id ? { ...x, link: v } : x)))} placeholder="https://…" />
                    </>
                  )}
                />
              )}
              {w.type === "author" && (
                <>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avatar</Label>
                    <ImageUpload value={w.avatar} onChange={(v) => upW(w.id, { avatar: v })} compact />
                  </div>
                  <TextField label="Avatar alt" value={w.avatarAlt || ""} onChange={(v) => upW(w.id, { avatarAlt: v })} />
                  <TextField label="Name" value={w.name || ""} onChange={(v) => upW(w.id, { name: v })} />
                  <TextField label="Role" value={w.role || ""} onChange={(v) => upW(w.id, { role: v })} />
                  <TextAreaField label="Bio" value={w.bio || ""} onChange={(v) => upW(w.id, { bio: v })} rows={3} />
                  <TextField label="Link label" value={w.linkLabel || ""} onChange={(v) => upW(w.id, { linkLabel: v })} />
                  <TextField label="Link URL" value={w.linkUrl || ""} onChange={(v) => upW(w.id, { linkUrl: v })} placeholder="https://…" />
                </>
              )}
            </>
          )}
        />
      </FormGroup>

      <FormGroup title="Colours">
        <ColorField label="Section background" value={cfg.bgColor} onChange={(v) => onUpdate({ bgColor: v })} />
        <ColorField label="Widget card background" value={cfg.cardBg} onChange={(v) => onUpdate({ cardBg: v })} />
        <ColorField label="Widget card border" value={cfg.cardBorder} onChange={(v) => onUpdate({ cardBorder: v })} />
        <ColorField label="Headings" value={cfg.titleColor} onChange={(v) => onUpdate({ titleColor: v })} />
        <ColorField label="Body text" value={cfg.bodyColor} onChange={(v) => onUpdate({ bodyColor: v })} />
        <ColorField label="Accent (eyebrow, links, tags)" value={cfg.eyebrowAccentColor || "#E01839"} onChange={(v) => onUpdate({ eyebrowAccentColor: v })} />
        <SliderField label="Card radius" value={cfg.cardRadius} min={0} max={24} suffix="px" onChange={(v) => onUpdate({ cardRadius: v })} />
      </FormGroup>

      <FormGroup title="Spacing">
        <ToggleField label="Make wide" description="Stretch background to full viewport width" checked={!!cfg.fullBleed} onChange={(v) => onUpdate({ fullBleed: v })} />
        <PaddingFields config={cfg} onUpdate={onUpdate} defaultValue={64} max={160} sideMax={120} testidPrefix="bb" />
      </FormGroup>

      <BlogPagePicker
        open={pickerForWidgetId !== null}
        onOpenChange={(o) => !o && setPickerForWidgetId(null)}
        onPick={addRelatedFromPage}
        excludeIds={pickerExcludeIds}
        title="Pick a related article"
        description="Pull from a standalone blog-body section or a page that contains one. Title, content and first image fill the related-card automatically."
      />
    </FormAccordion>
  );
}

export const blogBody = {
  id: ID,
  name: "Blog body",
  description: "Long-form article with an optional sidebar of CTA, related-article, tag-cluster and author-card widgets. Sidebar can sit left, right or below; sticky-on-scroll is opt-in.",
  icon: BookOpen,
  defaults,
  render,
  FormPanel,
};
