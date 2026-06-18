/**
 * Insights Grid — 2-column grid of icon + text + link cards with a left accent border.
 * Used for blog teasers, case study teasers, CTAs that bundle brand icon + copy.
 */
import { LayoutGrid } from "lucide-react";
import {
  baseReset,
  DEFAULT_ARROW_HTML,
  escAttr,
  escHtml,
  footerLinkCss,
  footerLinkHtml,
  fullBleedClass,
  iife,
  makeUid,
  num,
  padTopOf,
  padBotOf,
  padXOf,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import {
  TextField,
  TextAreaField,
  SliderField,
  SelectField,
  ToggleField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import FooterLinkEditor from "@/components/FooterLinkEditor";
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";
const ID = "insights";

const sampleCard = (i) => ({
  id: makeUid(),
  icon:
    i === 1
      ? "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop",
  iconAlt: "",
  // Per-card brand logo rendered ABOVE the heading inside the card
  // body. Optional — empty `logo` skips the markup entirely. Use case:
  // partner logos / customer logos on case-study teaser cards.
  logo: "",
  logoAlt: "",
  logoMaxHeight: 40,
  heading: i === 1 ? "Explore our latest articles" : "See how we support our customers",
  body:
    i === 1
      ? "Stay up to date with trends, insights and expert advice from the Nettailer team."
      : "Real-world success stories showing how Nettailer powers ecommerce at scale.",
  linkText: i === 1 ? "Read Articles" : "View Case Studies",
  link: "#",
  openInSameTab: false,
});

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "",
  title: "Insights and Resources",
  titleColor: "#1f2937",
  eyebrowColor: "#E01839",
  accentColor: "#E01839",
  // Colour of each card's H3 heading. Section-level so an Insights Grid
  // reads visually consistent — per-card overrides would add clutter
  // for negligible benefit.
  cardHeadingColor: "#1f1f1f",
  columns: 2,
  paddingY: 60,
  paddingTop: 60,
  paddingBottom: 60,
  fullBleed: false,
  // Heading + eyebrow alignment across the section width.
  // "left" | "center" | "right" — defaults to left so new sections
  // read like a normal article header. baseReset forces h-tags to
  // inherit text-align, so this value is applied to `.ns-wrap`.
  textAlign: "left",
  // Visual options (Philips-style intro cards / generic resource cards).
  // Defaults preserve prior behaviour: image-left, accent border ON.
  cardLayout: "image-left", // "image-left" | "image-top" | "image-right"
  imageWidth: 160, // px — only relevant for image-left / image-right
  showAccentBorder: true, // left/right strip in section accent colour
  cards: [sampleCard(1), sampleCard(2)],
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-insights-${uid}`;
  const cols = Math.max(1, Math.min(3, Number(cfg.columns) || 2));
  const align = cfg.textAlign === "center" || cfg.textAlign === "right" ? cfg.textAlign : "left";
  // Back-compat: if cardLayout / imageWidth are missing on older records
  // we treat them as the previous behaviour.
  const cardLayout =
    cfg.cardLayout === "image-top" || cfg.cardLayout === "image-right"
      ? cfg.cardLayout
      : "image-left";
  const imageWidth = num(cfg.imageWidth, 160);
  const showBorder = cfg.showAccentBorder !== false; // default true

  const styleVars = [
    `--ns-title-color:${safeColor(cfg.titleColor, "#1f2937")}`,
    `--ns-eyebrow-color:${safeColor(cfg.eyebrowColor || cfg.accentColor, "#E01839")}`,
    `--ns-accent:${safeColor(cfg.accentColor, "#E01839")}`,
    `--ns-heading-size:${num(cfg.headingSize, 30)}px`,
    `--ns-card-h-color:${safeColor(cfg.cardHeadingColor, "#1f1f1f")}`,
    `--ns-pad-t:${padTopOf(cfg, 60)}px;--ns-pad-b:${padBotOf(cfg, 60)}px;--ns-pad-x:${padXOf(cfg)}px`,
    `--ns-cols:${cols}`,
    `--ns-img-w:${imageWidth}px`,
  ].join(";");

  const cardsHtml = (cfg.cards || [])
    .map((c, idx) => {
      const rawLink = String(c.link || "").trim();
      const href = safeUrl(rawLink || "#");
      const target = c.openInSameTab ? "_self" : "_blank";
      const rel = c.openInSameTab ? "" : ' rel="noopener noreferrer"';
      const iconImg = c.icon
        ? `<img src="${escAttr(safeUrl(c.icon))}" alt="${escAttr(c.iconAlt || c.heading || "")}"/>`
        : "";
      const logoUrl = safeUrl(c.logo);
      const logoHtml = logoUrl
        ? `<img class="ns-card-logo" src="${escAttr(logoUrl)}" alt="${escAttr(c.logoAlt || "")}"${c.logoAlt ? "" : ' aria-hidden="true"'} style="max-height:${num(c.logoMaxHeight, 40)}px"/>`
        : "";
      const headingStyle = c.headingColor
        ? ` style="color:${safeColor(c.headingColor, "")}"`
        : "";
      const inner = `
  <div class="ns-icon">${iconImg}</div>
  <div class="ns-body">
    ${logoHtml}
    <h3 class="ns-ch"${headingStyle}>${escHtml(c.heading || "")}</h3>
    <p class="ns-cp">${escHtml(c.body || "")}</p>
    ${c.linkText ? `<span class="ns-link">${escHtml(c.linkText)} ${DEFAULT_ARROW_HTML}</span>` : ""}
  </div>`;
      const interactive = rawLink !== "";
      const itemAttrs = ` data-ns-list="insight" data-ns-item="${idx}"`;
      return interactive
        ? `<a class="ns-card is-link" href="${escAttr(href)}" target="${target}"${rel}${itemAttrs}>${inner}</a>`
        : `<div class="ns-card"${itemAttrs}>${inner}</div>`;
    })
    .join("");

  // Layout-specific styles.
  const layoutCss =
    cardLayout === "image-top"
      ? `
.${cls} .ns-card{flex-direction:column;min-height:0}
.${cls} .ns-icon{flex:0 0 auto;width:100%;aspect-ratio:16/9;align-self:auto}
.${cls} .ns-icon img{width:100%;height:100%;object-fit:cover}
.${cls} .ns-body{padding:24px}
`
      : cardLayout === "image-right"
        ? `
.${cls} .ns-card{flex-direction:row-reverse}
.${cls} .ns-icon{flex:0 0 var(--ns-img-w);align-self:stretch}
`
        : `
.${cls} .ns-card{flex-direction:row}
.${cls} .ns-icon{flex:0 0 var(--ns-img-w);align-self:stretch}
`;

  // Accent border placement adapts to layout so it always reads as
  // a leading strip on the side closest to reading order.
  const borderCss = showBorder
    ? cardLayout === "image-top"
      ? `border-top:6px solid var(--ns-accent)`
      : cardLayout === "image-right"
        ? `border-right:6px solid var(--ns-accent)`
        : `border-left:6px solid var(--ns-accent)`
    : ``;

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad-t) var(--ns-pad-x) var(--ns-pad-b);width:100%;background:#fff}
.${cls} .ns-wrap{max-width:1200px;margin:0 auto;text-align:${align}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-eyebrow-color);margin:0 0 10px}
.${cls} .ns-h{font-size:var(--ns-heading-size,30px);font-weight:600;color:var(--ns-title-color);margin:0 0 28px}
.${cls} .ns-grid{display:grid;grid-template-columns:repeat(var(--ns-cols),1fr);gap:20px;text-align:left}
.${cls} .ns-card{display:flex;align-items:stretch;min-height:175px;border:1px solid #f2f2f2;${borderCss};border-radius:${num(cfg.cardRadius, 6)}px;background:#fff;text-decoration:none;color:inherit;overflow:hidden;transition:border-color .2s ease,transform .2s ease}
.${cls} .ns-card.is-link:hover{border-color:var(--ns-accent);transform:translateY(-2px)}
.${cls} .ns-icon{background:#fafafa;overflow:hidden}
.${cls} .ns-icon img{width:100%;height:100%;object-fit:cover;display:block}
.${cls} .ns-body{padding:24px;flex:1;display:flex;flex-direction:column;justify-content:center}
.${cls} .ns-card-logo{display:block;margin:0 0 14px;object-fit:contain;width:auto;align-self:flex-start}
.${cls} .ns-ch{margin:0 0 8px;font-size:18px;font-weight:600;color:var(--ns-card-h-color,#1f1f1f)}
.${cls} .ns-cp{margin:0 0 12px;font-size:15px;line-height:1.5;color:#555}
.${cls} .ns-card:not(.is-link) .ns-cp:last-child{margin-bottom:0}
.${cls} .ns-link{font-size:14px;font-weight:600;color:var(--ns-accent);letter-spacing:.01em}
${layoutCss}
${footerLinkCss(cls, safeColor(cfg.accentColor, "#E01839"))}
@media (max-width:768px){.${cls} .ns-grid{grid-template-columns:1fr}.${cls} .ns-card{flex-direction:column}.${cls} .ns-icon{flex-basis:auto;width:100%;aspect-ratio:16/9}}
`.trim();

  const html = `<section class="ns-insights ${cls}${fullBleedClass(cfg)}" style="${styleVars}" data-ns-group="defaults">
  <div class="ns-wrap">
    ${cfg.eyebrow || cfg.title ? `<div data-ns-group="header">${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}${cfg.title ? `<h2 class="ns-h">${escHtml(cfg.title)}</h2>` : ""}</div>` : ""}
    <div class="ns-grid">
      ${cardsHtml}
    </div>
    ${footerLinkHtml(cfg, "center")}
  </div>
</section>`;

  const js = iife(cls, `/* static grid */`);
  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  const addCard = () =>
    onUpdate({ cards: [...config.cards, sampleCard(config.cards.length + 1)] });
  const removeCard = (id) =>
    onUpdate({ cards: config.cards.filter((c) => c.id !== id) });
  const moveCard = (id, dir) => {
    const idx = config.cards.findIndex((c) => c.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= config.cards.length) return;
    const arr = [...config.cards];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    onUpdate({ cards: arr });
  };
  const updateCard = (id, patch) =>
    onUpdate({
      cards: config.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  const duplicateCard = (id) => {
    const idx = config.cards.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const clone = { ...config.cards[idx], id: makeUid() };
    const arr = [...config.cards];
    arr.splice(idx + 1, 0, clone);
    onUpdate({ cards: arr });
  };

  return (
    <FormAccordion sectionType="insights">
      <Group title="Header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="insights-eyebrow"
        />
        <TextField
          label="Heading (optional)"
          value={config.title}
          onChange={(v) => onUpdate({ title: v })}
          testid="insights-title"
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
          testid="insights-text-align"
        />
      </Group>

      <Group title="Defaults" value="defaults">
        <SelectField
          label="Columns"
          value={config.columns}
          onChange={(v) => onUpdate({ columns: Number(v) })}
          options={[
            { value: 1, label: "1 column" },
            { value: 2, label: "2 columns" },
            { value: 3, label: "3 columns" },
          ]}
          testid="insights-columns"
        />
        <SelectField
          label="Card layout"
          value={config.cardLayout || "image-left"}
          onChange={(v) => onUpdate({ cardLayout: v })}
          options={[
            { value: "image-left", label: "Image left of text" },
            { value: "image-right", label: "Image right of text" },
            { value: "image-top", label: "Image above text" },
          ]}
          testid="insights-card-layout"
        />
        {config.cardLayout !== "image-top" ? (
          <SliderField
            label="Image width"
            value={config.imageWidth || 160}
            min={100}
            max={300}
            suffix="px"
            onChange={(v) => onUpdate({ imageWidth: v })}
            testid="insights-image-width"
          />
        ) : null}
        <ToggleField
          label="Show accent border"
          description="Coloured strip leading the card"
          checked={config.showAccentBorder !== false}
          onChange={(v) => onUpdate({ showAccentBorder: v })}
          testid="insights-accent-border"
        />
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="insights-full-bleed"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={60}
          max={120}
          testidPrefix="insights"
        />
        <SliderField
          label="Heading size"
          value={Number(config.headingSize) || 30}
          min={20}
          max={72}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="insights-heading-size"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <ColorField
          label="Eyebrow color"
          value={config.eyebrowColor || config.accentColor}
          onChange={(v) => onUpdate({ eyebrowColor: v })}
          testid="insights-eyebrow-color"
        />
        <ColorField
          label="Heading color"
          value={config.titleColor}
          onChange={(v) => onUpdate({ titleColor: v })}
          testid="insights-title-color"
        />
        <ColorField
          label="Accent color"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="insights-accent"
        />
        <ColorField
          label="Card heading colour"
          value={config.cardHeadingColor || "#1f1f1f"}
          onChange={(v) => onUpdate({ cardHeadingColor: v })}
          testid="insights-card-heading"
        />
      </Group>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Cards ({config.cards.length})
        </h3>
        <ListEditor
          items={config.cards}
          onAdd={addCard}
          onRemove={removeCard}
          onMove={moveCard}
          onDuplicate={duplicateCard}
          addLabel="Add card"
          testidPrefix="insight"
          renderRow={(c) => (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-sm bg-slate-100 flex-shrink-0 overflow-hidden">
                {c.icon && (
                  <img src={c.icon} alt="" className="w-full h-full object-contain" />
                )}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">
                {c.heading}
              </p>
            </div>
          )}
          renderForm={(c) => (
            <>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Icon / image
                </Label>
                <ImageUpload
                  value={c.icon}
                  onChange={(v) => updateCard(c.id, { icon: v })}
                  testid={`insight-icon-${c.id}`}
                  compact
                />
              </div>
              <TextField
                label="Image alt text (optional)"
                value={c.iconAlt || ""}
                onChange={(v) => updateCard(c.id, { iconAlt: v })}
                placeholder="Falls back to the card heading"
                testid={`insight-icon-alt-${c.id}`}
              />

              <div className="pt-2 border-t border-slate-200 mt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Brand logo (optional — sits above the heading)
                </p>
                <ImageUpload
                  value={c.logo || ""}
                  onChange={(v) => updateCard(c.id, { logo: v })}
                  testid={`insight-logo-${c.id}`}
                  compact
                />
                {c.logo ? (
                  <>
                    <TextField
                      label="Logo alt text"
                      value={c.logoAlt || ""}
                      onChange={(v) => updateCard(c.id, { logoAlt: v })}
                      placeholder="Leave blank if purely decorative"
                      testid={`insight-logo-alt-${c.id}`}
                    />
                    <SliderField
                      label="Logo size"
                      value={Number(c.logoMaxHeight) || 40}
                      min={20}
                      max={120}
                      suffix="px max-height"
                      onChange={(v) => updateCard(c.id, { logoMaxHeight: v })}
                      testid={`insight-logo-size-${c.id}`}
                    />
                  </>
                ) : null}
              </div>

              <TextField
                label="Heading"
                value={c.heading}
                onChange={(v) => updateCard(c.id, { heading: v })}
                testid={`insight-heading-${c.id}`}
              />
              <ToggleField
                label="Override heading colour"
                description="Use a different colour just for this card"
                checked={!!c.headingColor}
                onChange={(v) => {
                  if (v) {
                    updateCard(c.id, {
                      headingColor:
                        c.headingColor ||
                        config.cardHeadingColor ||
                        "#1f1f1f",
                    });
                  } else {
                    updateCard(c.id, { headingColor: "" });
                  }
                }}
                testid={`insight-heading-color-toggle-${c.id}`}
              />
              {c.headingColor ? (
                <ColorField
                  label="Heading colour (this card)"
                  value={c.headingColor}
                  onChange={(v) => updateCard(c.id, { headingColor: v })}
                  testid={`insight-heading-color-${c.id}`}
                />
              ) : null}
              <TextAreaField
                label="Body"
                value={c.body}
                onChange={(v) => updateCard(c.id, { body: v })}
                rows={2}
                testid={`insight-body-${c.id}`}
              />
              <TextField
                label="Link text"
                value={c.linkText}
                onChange={(v) => updateCard(c.id, { linkText: v })}
                testid={`insight-link-text-${c.id}`}
              />
              <TextField
                label="Link URL"
                value={c.link}
                onChange={(v) => updateCard(c.id, { link: v })}
                testid={`insight-link-${c.id}`}
              />
              <ToggleField
                label="Open in same tab"
                checked={c.openInSameTab}
                onChange={(v) => updateCard(c.id, { openInSameTab: v })}
                testid={`insight-same-tab-${c.id}`}
              />
            </>
          )}
        />
      </div>
      <FooterLinkEditor
        value={config.footerLink}
        onChange={(v) => onUpdate({ footerLink: v })}
        testidPrefix="insights-footer-link"
      />
    </FormAccordion>
  );
}

export const insights = {
  id: ID,
  name: "Insights Grid",
  description: "Icon + text + link cards with accent border",
  icon: LayoutGrid,
  defaults,
  render,
  FormPanel,
};
