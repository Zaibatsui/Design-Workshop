/**
 * Comparison Table — "Why us vs. them" section.
 *
 * High-converting B2B pattern: a 3-column table that compares the
 * user's brand against a generic competitor on N feature rows.
 *
 * Layout:
 *   ┌─────────────────────┬───────────────┬───────────────────┐
 *   │ Feature             │   [Logo]      │ Other Platforms   │
 *   ├─────────────────────┼───────────────┼───────────────────┤
 *   │ UK-Based Support    │ ✓ Real people │ ✗ Automated reply │
 *   │ Expert Design       │ ✓ Custom UI   │ ✗ Limited tpl     │
 *   │ …                   │ …             │ …                 │
 *   └─────────────────────┴───────────────┴───────────────────┘
 *
 * The "our" column can be visually emphasised with a tinted background
 * + accent border so it reads as the winning option at a glance.
 *
 * Mobile (max 640px): the grid collapses to a single column where each
 * row becomes a card titled by the feature label, with two stacked
 * lines (✓ our / ✗ theirs).
 */
import { Columns3 } from "lucide-react";
import {
  baseReset,
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

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";

const ID = "comparison-table";

const SAMPLE_ROWS = [
  { feature: "UK-Based Support", ourValue: "Real people, real support", competitorValue: "Automated replies" },
  { feature: "Expert-Led Design", ourValue: "Custom branding & professional design", competitorValue: "Limited templates & DIY edits" },
  { feature: "All-in-One Pricing", ourValue: "One subscription, everything included", competitorValue: "Extra costs for essential features" },
  { feature: "Tech & Security", ourValue: "Managed updates & secure hosting", competitorValue: "You handle maintenance & security" },
  { feature: "Success-Driven Partnership", ourValue: "Your growth is our priority", competitorValue: "Just another software subscription" },
  { feature: "Setup & Optimisation", ourValue: "Experts handle the hard work", competitorValue: "Time-consuming DIY setup" },
];

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "",
  title: "Why leading businesses choose us",
  subheading: "",
  closingText:
    "This isn't just another tool — it's a growth partner. We succeed when you do.",
  // Header row labels (right of the feature column).
  featureColumnLabel: "Feature",
  brandLabel: "Us",
  brandLogoUrl: "",
  brandLogoAlt: "",
  brandLogoMaxHeight: 28,
  competitorLabel: "Other Platforms",
  // Per-row data
  rows: SAMPLE_ROWS.map((r) => ({
    id: makeUid(),
    feature: r.feature,
    ourValue: r.ourValue,
    ourIcon: "check",
    competitorValue: r.competitorValue,
    competitorIcon: "x",
  })),
  // Layout
  textAlign: "center",
  fullBleed: false,
  highlightOurColumn: true,
  showZebra: true,
  headingSize: 36,
  paddingTop: 80,
  paddingBottom: 80,
  paddingY: 80,
  // Theme
  titleColor: "#0f172a",
  eyebrowColor: "#E01839",
  bodyColor: "#475569",
  bgColor: "#ffffff",
  // Accent = the tint colour for the "our" column header + tick fills.
  accentColor: "#E01839",
  // Muted = the colour for the cross icon + competitor column header.
  mutedColor: "#94a3b8",
  borderColor: "#e2e8f0",
  // Optional footer link
  footerLink: null,
});

// Inline SVG glyphs — kept tiny and stroke-based so they pick up
// `currentColor` from the wrapping cell's text colour.
const TICK_SVG =
  '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS_SVG =
  '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function iconFor(kind) {
  if (kind === "check") return `<span class="ns-mark ns-mark-check" aria-hidden="true">${TICK_SVG}</span>`;
  if (kind === "x") return `<span class="ns-mark ns-mark-x" aria-hidden="true">${CROSS_SVG}</span>`;
  return "";
}

function render(cfg = {}) {
  const c = { ...defaults(), ...cfg };
  const uid = c.uid || makeUid();
  const cls = `ns-compare-${uid}`;
  const align = c.textAlign === "left" || c.textAlign === "right" ? c.textAlign : "center";
  const accent = safeColor(c.accentColor, "#E01839");
  const muted = safeColor(c.mutedColor, "#94a3b8");
  const bg = safeColor(c.bgColor, "#ffffff");
  const padTop = padTopOf(c, 80);
  const padBot = padBotOf(c, 80);
  const padX = padXOf(cfg);

  const styleVars = [
    `--ns-bg:${bg}`,
    `--ns-title:${safeColor(c.titleColor, "#0f172a")}`,
    `--ns-eyebrow:${safeColor(c.eyebrowColor, accent)}`,
    `--ns-body:${safeColor(c.bodyColor, "#475569")}`,
    `--ns-accent:${accent}`,
    `--ns-muted:${muted}`,
    `--ns-border:${safeColor(c.borderColor, "#e2e8f0")}`,
    `--ns-heading-size:${num(c.headingSize, 36)}px`,
  ].join(";");

  const eyebrowHtml = c.eyebrow
    ? `<p class="ns-eyebrow">${escHtml(c.eyebrow)}</p>`
    : "";
  const titleHtml = c.title
    ? `<h2 class="ns-title">${escHtml(c.title)}</h2>`
    : "";
  const subHtml = c.subheading
    ? `<p class="ns-sub">${escHtml(c.subheading)}</p>`
    : "";

  // Brand column header cell — logo (preferred) or text fallback.
  const brandLogo = safeUrl(c.brandLogoUrl);
  const brandHeader = brandLogo
    ? `<img class="ns-brand-logo" src="${escAttr(brandLogo)}" alt="${escAttr(c.brandLogoAlt || c.brandLabel || "Brand")}" style="max-height:${num(c.brandLogoMaxHeight, 28)}px"/>`
    : `<span class="ns-brand-text">${escHtml(c.brandLabel || "Us")}</span>`;

  const rowsHtml = (c.rows || [])
    .filter((r) => r && (r.feature || r.ourValue || r.competitorValue))
    .map((r, idx) => {
      const our = (r.ourValue || "").trim();
      const their = (r.competitorValue || "").trim();
      return `<div class="ns-row" role="row" data-ns-list="compare" data-ns-item="${idx}">
        <div class="ns-cell ns-cell-feature" role="cell">${escHtml(r.feature || "")}</div>
        <div class="ns-cell ns-cell-our" role="cell">
          ${iconFor(r.ourIcon === "x" || r.ourIcon === "none" ? r.ourIcon : "check")}
          ${our ? `<span class="ns-cell-text">${escHtml(our)}</span>` : ""}
        </div>
        <div class="ns-cell ns-cell-them" role="cell">
          ${iconFor(r.competitorIcon === "check" || r.competitorIcon === "none" ? r.competitorIcon : "x")}
          ${their ? `<span class="ns-cell-text">${escHtml(their)}</span>` : ""}
        </div>
      </div>`;
    })
    .join("");

  // Closing paragraph below the table.
  const closingHtml = (c.closingText || "").trim()
    ? `<p class="ns-closing">${escHtml(c.closingText)}</p>`
    : "";

  // Highlight column: tinted bg + accent border on the "our" column.
  // Implemented as cell-level overrides so the highlight survives the
  // mobile-card collapse (where columns become rows).
  const highlightCss = c.highlightOurColumn
    ? `
.${cls} .ns-cell-our{background:color-mix(in srgb, var(--ns-accent) 6%, transparent)}
.${cls} .ns-row-head .ns-cell-our{background:color-mix(in srgb, var(--ns-accent) 10%, transparent)}
.${cls} .ns-col-our-border{border:1px solid color-mix(in srgb, var(--ns-accent) 25%, transparent);border-radius:14px;position:absolute;inset:0;pointer-events:none;z-index:1}
`
    : "";

  // Zebra stripes — subtle alt-row background for legibility on long
  // tables. Only applies to feature & "them" cells so the "our"
  // column tint (if enabled) doesn't get washed out.
  const zebraCss = c.showZebra
    ? `.${cls} .ns-row:nth-child(odd) .ns-cell-feature,.${cls} .ns-row:nth-child(odd) .ns-cell-them{background:color-mix(in srgb, #000000 2%, transparent)}`
    : "";

  // The "our" column highlight border is rendered as an absolutely-
  // positioned overlay so it can span every row without affecting
  // the grid math. Only emitted when the toggle is on.
  const ourBorderHtml = c.highlightOurColumn
    ? `<div class="ns-col-our-wrap" aria-hidden="true"><div class="ns-col-our-border"></div></div>`
    : "";

  const css = `
${baseReset(cls)}
.${cls}{padding:${padTop}px ${padX}px ${padBot}px;width:100%;background:var(--ns-bg);color:var(--ns-title)}
.${cls} .ns-wrap{max-width:1100px;margin:0 auto;text-align:${align}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-eyebrow);margin:0 0 10px}
.${cls} .ns-title{font-size:var(--ns-heading-size,36px);font-weight:700;line-height:1.15;letter-spacing:-0.02em;color:var(--ns-title);margin:0 0 12px;display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:${align}}
.${cls} .ns-sub{font-size:16px;line-height:1.6;color:var(--ns-body);margin:0 0 36px;max-width:680px;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}}
.${cls} .ns-table{position:relative;display:grid;grid-template-columns:1.3fr 1fr 1fr;border:1px solid var(--ns-border);border-radius:14px;overflow:hidden;background:var(--ns-bg);text-align:left;margin-top:24px}
.${cls} .ns-row{display:contents}
.${cls} .ns-cell{padding:18px 22px;border-top:1px solid var(--ns-border);min-width:0;display:flex;align-items:center;gap:10px;font-size:15px;line-height:1.5;color:var(--ns-body);position:relative;z-index:0}
.${cls} .ns-row-head .ns-cell{padding:20px 22px;border-top:0;font-weight:700;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;color:var(--ns-title);background:color-mix(in srgb, var(--ns-title) 3%, transparent)}
.${cls} .ns-row-head .ns-cell-them{color:var(--ns-muted)}
.${cls} .ns-cell-feature{font-weight:600;color:var(--ns-title)}
.${cls} .ns-cell-our{color:var(--ns-title)}
.${cls} .ns-cell-them{color:var(--ns-muted)}
.${cls} .ns-cell-text{flex:1;min-width:0}
.${cls} .ns-mark{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%}
.${cls} .ns-mark-check{color:#fff;background:var(--ns-accent)}
.${cls} .ns-mark-x{color:#fff;background:var(--ns-muted)}
.${cls} .ns-brand-logo{display:inline-block;width:auto;max-width:160px;object-fit:contain}
.${cls} .ns-brand-text{font-weight:700;letter-spacing:0.04em;color:var(--ns-accent)}
.${cls} .ns-col-our-wrap{position:absolute;inset:0;display:grid;grid-template-columns:1.3fr 1fr 1fr;pointer-events:none}
.${cls} .ns-col-our-wrap > .ns-col-our-border{grid-column:2 / 3}
.${cls} .ns-closing{margin:30px auto 0;max-width:640px;font-size:15px;line-height:1.6;color:var(--ns-body);text-align:${align}}
${highlightCss}
${zebraCss}
${footerLinkCss(cls, accent, safeColor(c.bodyColor, "#475569"))}
@media (max-width:720px){
  .${cls} .ns-table{grid-template-columns:1fr;border-radius:12px}
  .${cls} .ns-col-our-wrap{display:none}
  .${cls} .ns-row{display:block;border-top:1px solid var(--ns-border);padding:6px 0}
  .${cls} .ns-row:first-child{border-top:0}
  .${cls} .ns-row-head{display:none}
  .${cls} .ns-cell{border-top:0;padding:8px 18px}
  .${cls} .ns-cell-feature{padding-top:18px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ns-title)}
  .${cls} .ns-cell-our,.${cls} .ns-cell-them{padding-bottom:8px;background:transparent!important}
}
`.trim();

  const headRow = `<div class="ns-row ns-row-head" role="row">
    <div class="ns-cell ns-cell-feature" role="columnheader">${escHtml(c.featureColumnLabel || "Feature")}</div>
    <div class="ns-cell ns-cell-our" role="columnheader">${brandHeader}</div>
    <div class="ns-cell ns-cell-them" role="columnheader">${escHtml(c.competitorLabel || "Other Platforms")}</div>
  </div>`;

  const html = `<section class="ns-comparison ${cls}${fullBleedClass(c)}" style="${styleVars}" data-ns-group="defaults">
  <div class="ns-wrap">
    <div data-ns-group="header">
    ${eyebrowHtml}
    ${titleHtml}
    ${subHtml}
    </div>
    <div class="ns-table" role="table" data-ns-group="rows">
      ${ourBorderHtml}
      ${headRow}
      ${rowsHtml}
    </div>
    <div data-ns-group="closing">${closingHtml}</div>
    ${footerLinkHtml(c, align)}
  </div>
</section>`;

  const js = iife(cls, `/* static */`);
  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  const rows = config.rows || [];
  const update = (id, patch) =>
    onUpdate({ rows: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const add = () =>
    onUpdate({
      rows: [
        ...rows,
        {
          id: makeUid(),
          feature: "New feature",
          ourValue: "What we offer",
          ourIcon: "check",
          competitorValue: "What they offer",
          competitorIcon: "x",
        },
      ],
    });
  const remove = (id) => onUpdate({ rows: rows.filter((r) => r.id !== id) });
  const reorder = (next) => onUpdate({ rows: next });

  return (
    <FormAccordion sectionType="comparison-table">
      <Group title="Header" value="header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="compare-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.title || ""}
          onChange={(v) => onUpdate({ title: v })}
          testid="compare-title"
        />
        <TextAreaField
          label="Subheading (optional)"
          value={config.subheading || ""}
          rows={2}
          onChange={(v) => onUpdate({ subheading: v })}
          testid="compare-subheading"
        />
        <SelectField
          label="Heading alignment"
          value={config.textAlign || "center"}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          testid="compare-text-align"
        />
      </Group>

      <Group title="Columns" value="columns">
        <TextField
          label="Feature column label"
          value={config.featureColumnLabel || ""}
          onChange={(v) => onUpdate({ featureColumnLabel: v })}
          testid="compare-feature-label"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Your column</p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Brand logo (optional)
          </label>
          <ImageUpload
            value={config.brandLogoUrl}
            onChange={(v) => onUpdate({ brandLogoUrl: v })}
            testid="compare-brand-logo"
            compact
          />
        </div>
        {config.brandLogoUrl ? (
          <>
            <TextField
              label="Logo alt text"
              value={config.brandLogoAlt || ""}
              onChange={(v) => onUpdate({ brandLogoAlt: v })}
              placeholder="Falls back to brand label"
              testid="compare-brand-logo-alt"
            />
            <SliderField
              label="Logo max height"
              value={Number(config.brandLogoMaxHeight) || 28}
              min={16}
              max={64}
              suffix="px"
              onChange={(v) => onUpdate({ brandLogoMaxHeight: v })}
              testid="compare-brand-logo-h"
            />
          </>
        ) : (
          <TextField
            label="Brand label (used when no logo)"
            value={config.brandLabel || ""}
            onChange={(v) => onUpdate({ brandLabel: v })}
            testid="compare-brand-label"
          />
        )}
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Competitor column</p>
        </div>
        <TextField
          label="Competitor label"
          value={config.competitorLabel || ""}
          onChange={(v) => onUpdate({ competitorLabel: v })}
          testid="compare-competitor-label"
        />
      </Group>

      <Group title={`Rows (${rows.length})`} value="rows">
        <ListEditor
          items={rows}
          onAdd={add}
          onRemove={remove}
          onReorder={reorder}
          itemLabel={(r) => r.feature || "Untitled row"}
          addLabel="Add row"
          testid="compare-rows"
          renderRow={(r) => (
            <div className="text-xs font-medium text-slate-700 truncate">
              {r.feature || "Untitled row"}
            </div>
          )}
          renderForm={(r) => (
            <>
              <TextField
                label="Feature"
                value={r.feature || ""}
                onChange={(v) => update(r.id, { feature: v })}
                testid={`compare-row-feature-${r.id}`}
              />
              <TextAreaField
                label="Your value"
                value={r.ourValue || ""}
                rows={2}
                onChange={(v) => update(r.id, { ourValue: v })}
                testid={`compare-row-our-${r.id}`}
              />
              <SelectField
                label="Your icon"
                value={r.ourIcon || "check"}
                onChange={(v) => update(r.id, { ourIcon: v })}
                options={[
                  { value: "check", label: "✓ Tick" },
                  { value: "x", label: "✗ Cross" },
                  { value: "none", label: "No icon" },
                ]}
                testid={`compare-row-our-icon-${r.id}`}
              />
              <TextAreaField
                label="Competitor value"
                value={r.competitorValue || ""}
                rows={2}
                onChange={(v) => update(r.id, { competitorValue: v })}
                testid={`compare-row-them-${r.id}`}
              />
              <SelectField
                label="Competitor icon"
                value={r.competitorIcon || "x"}
                onChange={(v) => update(r.id, { competitorIcon: v })}
                options={[
                  { value: "x", label: "✗ Cross" },
                  { value: "check", label: "✓ Tick" },
                  { value: "none", label: "No icon" },
                ]}
                testid={`compare-row-them-icon-${r.id}`}
              />
            </>
          )}
        />
      </Group>

      <Group title="Closing" value="closing">
        <TextAreaField
          label="Closing paragraph (optional)"
          value={config.closingText || ""}
          rows={2}
          onChange={(v) => onUpdate({ closingText: v })}
          placeholder="Single sentence summarising the value prop."
          testid="compare-closing"
        />
        <FooterLinkEditor
          value={config.footerLink}
          onChange={(v) => onUpdate({ footerLink: v })}
          testidPrefix="compare-footer-link"
        />
      </Group>

      <Group title="Defaults" value="defaults">
        <ToggleField
          label="Highlight your column"
          description="Tints the background and adds an accent border around your column to draw the eye."
          checked={config.highlightOurColumn !== false}
          onChange={(v) => onUpdate({ highlightOurColumn: v })}
          testid="compare-highlight-our"
        />
        <ToggleField
          label="Zebra stripes"
          description="Alternate row tint for easier scanning on long tables."
          checked={config.showZebra !== false}
          onChange={(v) => onUpdate({ showZebra: v })}
          testid="compare-zebra"
        />
        <ToggleField
          label="Make wide"
          description="Stretch the background to full viewport width"
          checked={!!config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="compare-full-bleed"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={80}
          max={160}
          testidPrefix="compare"
        />
        <SliderField
          label="Heading size"
          value={Number(config.headingSize) || 36}
          min={20}
          max={72}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="compare-heading-size"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="compare-bg"
        />
        <ColorField
          label="Title colour"
          value={config.titleColor}
          onChange={(v) => onUpdate({ titleColor: v })}
          testid="compare-title-color"
        />
        <ColorField
          label="Eyebrow colour"
          value={config.eyebrowColor}
          onChange={(v) => onUpdate({ eyebrowColor: v })}
          testid="compare-eyebrow-color"
        />
        <ColorField
          label="Body colour"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="compare-body-color"
        />
        <ColorField
          label="Accent (tick + your-column tint)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="compare-accent"
        />
        <ColorField
          label="Muted (cross + competitor column)"
          value={config.mutedColor}
          onChange={(v) => onUpdate({ mutedColor: v })}
          testid="compare-muted"
        />
        <ColorField
          label="Border colour"
          value={config.borderColor}
          onChange={(v) => onUpdate({ borderColor: v })}
          testid="compare-border"
        />
      </Group>
    </FormAccordion>
  );
}

export const comparisonTable = {
  id: ID,
  name: "Comparison Table",
  description: "3-column you-vs-competitor matrix with tick / cross rows",
  icon: Columns3,
  defaults,
  render,
  FormPanel,
};
