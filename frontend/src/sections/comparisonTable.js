/**
 * Comparison Table — "Why us vs. them" section.
 *
 * Supports 1–4 competitor columns. The first column is always the
 * feature label; the second is always "our" (highlighted when toggled);
 * columns 3-N are competitor columns added/removed from the form.
 *
 * Layout (3-col example):
 *   ┌─────────────────────┬───────────────┬───────────────────┐
 *   │ Feature             │   [Logo]      │ Other Platforms   │
 *   ├─────────────────────┼───────────────┼───────────────────┤
 *   │ UK-Based Support    │ ✓ Real people │ ✗ Automated reply │
 *   └─────────────────────┴───────────────┴───────────────────┘
 *
 * Mobile (max 640px): collapses to cards titled by feature label.
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
  { feature: "UK-Based Support", ourValue: "Real people, real support", competitorValues: [{ value: "Automated replies", icon: "x" }] },
  { feature: "Expert-Led Design", ourValue: "Custom branding & professional design", competitorValues: [{ value: "Limited templates & DIY edits", icon: "x" }] },
  { feature: "All-in-One Pricing", ourValue: "One subscription, everything included", competitorValues: [{ value: "Extra costs for essential features", icon: "x" }] },
  { feature: "Tech & Security", ourValue: "Managed updates & secure hosting", competitorValues: [{ value: "You handle maintenance & security", icon: "x" }] },
  { feature: "Success-Driven Partnership", ourValue: "Your growth is our priority", competitorValues: [{ value: "Just another software subscription", icon: "x" }] },
  { feature: "Setup & Optimisation", ourValue: "Experts handle the hard work", competitorValues: [{ value: "Time-consuming DIY setup", icon: "x" }] },
];

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "",
  title: "Why leading businesses choose us",
  subheading: "",
  closingText:
    "This isn't just another tool — it's a growth partner. We succeed when you do.",
  featureColumnLabel: "Feature",
  brandLabel: "Us",
  brandLogoUrl: "",
  brandLogoAlt: "",
  brandLogoMaxHeight: 28,
  // Array of competitor columns — users can add up to 4.
  competitors: [{ id: makeUid(), label: "Other Platforms" }],
  rows: SAMPLE_ROWS.map((r) => ({
    id: makeUid(),
    feature: r.feature,
    ourValue: r.ourValue,
    ourIcon: "check",
    competitorValues: r.competitorValues,
  })),
  textAlign: "center",
  fullBleed: false,
  highlightOurColumn: true,
  showZebra: true,
  headingSize: 36,
  paddingTop: 80,
  paddingBottom: 80,
  paddingY: 80,
  titleColor: "#0f172a",
  eyebrowColor: "#E01839",
  bodyColor: "#475569",
  bgColor: "#ffffff",
  accentColor: "#E01839",
  mutedColor: "#94a3b8",
  borderColor: "#e2e8f0",
  // Header background image
  headerImage: "",
  headerImageAlt: "",
  headerHeight: 260,
  headerRadius: null,
  overlayType: "solid",
  headerOverlayColor: "#0f172a",
  overlayGradientFrom: "",
  overlayGradientTo: "",
  overlayGradientAngle: 135,
  headerOverlayOpacity: 0.45,
  headerTextColor: "#ffffff",
  footerLink: null,
});

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Normalise competitor columns — handles old single-competitor configs. */
function getCompetitors(c) {
  if (Array.isArray(c.competitors) && c.competitors.length > 0) return c.competitors;
  return [{ id: "compat0", label: c.competitorLabel || "Other Platforms" }];
}

/** Return per-competitor values for a row, padded/trimmed to match columns. */
function getRowCompetitorValues(row, competitors) {
  if (Array.isArray(row.competitorValues) && row.competitorValues.length > 0) {
    return competitors.map((_, i) => row.competitorValues[i] || { value: "", icon: "x" });
  }
  // Backward compat: old single competitorValue / competitorIcon fields.
  return competitors.map((_, i) =>
    i === 0
      ? { value: row.competitorValue || "", icon: row.competitorIcon || "x" }
      : { value: "", icon: "x" }
  );
}

// ─── SVG glyphs ───────────────────────────────────────────────────────────────

const TICK_SVG =
  '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS_SVG =
  '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function iconFor(kind) {
  if (kind === "check") return `<span class="ns-mark ns-mark-check" aria-hidden="true">${TICK_SVG}</span>`;
  if (kind === "x") return `<span class="ns-mark ns-mark-x" aria-hidden="true">${CROSS_SVG}</span>`;
  return "";
}

// ─── render ───────────────────────────────────────────────────────────────────

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

  const competitors = getCompetitors(c);
  // Grid: feature col (1.3fr) + our col (1fr) + one 1fr per competitor.
  const gridCols = `1.3fr 1fr ${competitors.map(() => "1fr").join(" ")}`;

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

  const brandLogo = safeUrl(c.brandLogoUrl);
  const brandHeader = brandLogo
    ? `<img class="ns-brand-logo" src="${escAttr(brandLogo)}" alt="${escAttr(c.brandLogoAlt || c.brandLabel || "Brand")}" style="max-height:${num(c.brandLogoMaxHeight, 28)}px"/>`
    : `<span class="ns-brand-text">${escHtml(c.brandLabel || "Us")}</span>`;

  // Header row — our column + one cell per competitor.
  const competitorHeadCells = competitors
    .map((comp) => `<div class="ns-cell ns-cell-them" role="columnheader">${escHtml(comp.label || "")}</div>`)
    .join("");

  const headRow = `<div class="ns-row ns-row-head" role="row">
    <div class="ns-cell ns-cell-feature" role="columnheader">${escHtml(c.featureColumnLabel || "Feature")}</div>
    <div class="ns-cell ns-cell-our" role="columnheader">${brandHeader}</div>
    ${competitorHeadCells}
  </div>`;

  // Body rows.
  const rowsHtml = (c.rows || [])
    .filter((r) => r && (r.feature || r.ourValue))
    .map((r, idx) => {
      const our = (r.ourValue || "").trim();
      const compCells = getRowCompetitorValues(r, competitors)
        .map((cv) => {
          const val = (cv.value || "").trim();
          const icon = cv.icon === "check" || cv.icon === "none" ? cv.icon : "x";
          return `<div class="ns-cell ns-cell-them" role="cell">
          ${iconFor(icon)}
          ${val ? `<span class="ns-cell-text">${escHtml(val)}</span>` : ""}
        </div>`;
        })
        .join("");
      return `<div class="ns-row" role="row" data-ns-list="compare" data-ns-item="${idx}">
        <div class="ns-cell ns-cell-feature" role="cell">${escHtml(r.feature || "")}</div>
        <div class="ns-cell ns-cell-our" role="cell">
          ${iconFor(r.ourIcon === "x" || r.ourIcon === "none" ? r.ourIcon : "check")}
          ${our ? `<span class="ns-cell-text">${escHtml(our)}</span>` : ""}
        </div>
        ${compCells}
      </div>`;
    })
    .join("");

  const closingHtml = (c.closingText || "").trim()
    ? `<p class="ns-closing">${escHtml(c.closingText)}</p>`
    : "";

  const highlightCss = c.highlightOurColumn
    ? `
.${cls} .ns-cell-our{background:color-mix(in srgb, var(--ns-accent) 6%, transparent)}
.${cls} .ns-row-head .ns-cell-our{background:color-mix(in srgb, var(--ns-accent) 10%, transparent)}
.${cls} .ns-col-our-border{border:1px solid color-mix(in srgb, var(--ns-accent) 25%, transparent);border-radius:14px;position:absolute;inset:0;pointer-events:none;z-index:1}
`
    : "";

  const zebraCss = c.showZebra
    ? `.${cls} .ns-row:nth-child(odd) .ns-cell-feature,.${cls} .ns-row:nth-child(odd) .ns-cell-them{background:color-mix(in srgb, #000000 2%, transparent)}`
    : "";

  const ourBorderHtml = c.highlightOurColumn
    ? `<div class="ns-col-our-wrap" aria-hidden="true"><div class="ns-col-our-border"></div></div>`
    : "";

  // ── header background image ──
  const hasHeaderImg = !!safeUrl(c.headerImage || "");
  const headerTextColor = safeColor(c.headerTextColor, "#ffffff");
  const headerOverlayColor = safeColor(c.headerOverlayColor, "#0f172a");
  const headerOverlayOpacity = Math.min(1, Math.max(0, num(c.headerOverlayOpacity, 0.45)));
  const headerHeight = Math.max(120, num(c.headerHeight, 260));
  const headerRadius = c.fullBleed ? 0 : (c.headerRadius == null ? 0 : num(c.headerRadius, 0));
  const overlayBg = c.overlayType === "gradient"
    ? `linear-gradient(${num(c.overlayGradientAngle, 135)}deg, ${safeColor(c.overlayGradientFrom, "#0f172a")}, ${safeColor(c.overlayGradientTo, "#1e3a5f")})`
    : headerOverlayColor;

  const headerContent = `${eyebrowHtml}${titleHtml}${subHtml}`;
  const photoHeader = hasHeaderImg
    ? `<header class="ns-header-bg" data-ns-group="header-bg"${c.headerImageAlt ? ` aria-label="${escAttr(c.headerImageAlt)}"` : ` role="presentation"`}>
      <div class="ns-header-overlay" aria-hidden="true"></div>
      <div class="ns-header-content" data-ns-group="header">${headerContent}</div>
    </header>`
    : "";
  const plainHeader = !hasHeaderImg
    ? `<div data-ns-group="header">${headerContent}</div>`
    : "";

  const css = `
${baseReset(cls)}
.${cls}{padding:${hasHeaderImg ? "0" : `${padTop}px`} ${padX}px ${padBot}px;width:100%;background:var(--ns-bg);color:var(--ns-title)}
.${cls} .ns-wrap{max-width:1100px;margin:0 auto;${hasHeaderImg ? `padding-top:${padTop}px;` : ""}text-align:${align}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-eyebrow);margin:0 0 10px}
.${cls} .ns-title{font-size:var(--ns-heading-size,36px);font-weight:700;line-height:1.15;letter-spacing:-0.02em;color:var(--ns-title);margin:0 0 12px;display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:${align}}
.${cls} .ns-sub{font-size:16px;line-height:1.6;color:var(--ns-body);margin:0 0 36px;max-width:680px;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}}
.${cls} .ns-table{position:relative;display:grid;grid-template-columns:${gridCols};border:1px solid var(--ns-border);border-radius:14px;overflow:hidden;background:var(--ns-bg);text-align:left;margin-top:24px}
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
.${cls} .ns-col-our-wrap{position:absolute;inset:0;display:grid;grid-template-columns:${gridCols};pointer-events:none}
.${cls} .ns-col-our-wrap > .ns-col-our-border{grid-column:2 / 3}
.${cls} .ns-closing{margin:30px auto 0;max-width:640px;font-size:15px;line-height:1.6;color:var(--ns-body);text-align:${align}}
${hasHeaderImg ? `
.${cls} .ns-header-bg{position:relative;min-height:${headerHeight}px;background-image:url("${escAttr(safeUrl(c.headerImage))}");background-size:cover;background-position:center;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:48px ${padX}px;margin-bottom:36px;border-radius:${headerRadius}px}
.${cls} .ns-header-overlay{position:absolute;inset:0;background:${overlayBg};opacity:${headerOverlayOpacity};pointer-events:none}
.${cls} .ns-header-content{position:relative;z-index:1;max-width:720px;width:100%;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
.${cls} .ns-header-bg .ns-title{color:${headerTextColor}}
.${cls} .ns-header-bg .ns-sub{color:${headerTextColor};opacity:.92;margin-bottom:0}
` : ""}
${highlightCss}
${zebraCss}
${footerLinkCss(cls, accent, safeColor(c.bodyColor, "#475569"))}
@media (max-width:720px){
  ${hasHeaderImg ? `.${cls} .ns-header-bg{min-height:${Math.max(120, Math.round(headerHeight * 0.75))}px;padding:32px 18px;margin-bottom:24px}` : ""}
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

  const html = `<section class="ns-comparison ${cls}${fullBleedClass(c)}" style="${styleVars}" data-ns-group="defaults">
  ${photoHeader}
  <div class="ns-wrap">
    ${plainHeader}
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

// ─── form panel ───────────────────────────────────────────────────────────────

function FormPanel({ config, onUpdate }) {
  const rows = config.rows || [];
  const competitors = getCompetitors(config);

  // ── row helpers ──
  const updateRow = (id, patch) =>
    onUpdate({ rows: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const updateRowCompetitorValue = (rowId, compIdx, patch) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    const vals = getRowCompetitorValues(row, competitors).map((v, i) =>
      i === compIdx ? { ...v, ...patch } : v
    );
    updateRow(rowId, { competitorValues: vals });
  };

  const addRow = () =>
    onUpdate({
      rows: [
        ...rows,
        {
          id: makeUid(),
          feature: "New feature",
          ourValue: "What we offer",
          ourIcon: "check",
          competitorValues: competitors.map(() => ({ value: "What they offer", icon: "x" })),
        },
      ],
    });

  const removeRow = (id) => onUpdate({ rows: rows.filter((r) => r.id !== id) });

  const duplicateRow = (id) => {
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const clone = { ...rows[idx], id: makeUid() };
    const arr = [...rows];
    arr.splice(idx + 1, 0, clone);
    onUpdate({ rows: arr });
  };

  // ── competitor column helpers ──
  const addCompetitor = () => {
    if (competitors.length >= 4) return;
    const newComp = { id: makeUid(), label: `Competitor ${competitors.length + 1}` };
    const newCompetitors = [...competitors, newComp];
    // Extend every row's competitorValues to include a blank entry.
    const newRows = rows.map((r) => {
      const vals = getRowCompetitorValues(r, competitors);
      return { ...r, competitorValues: [...vals, { value: "", icon: "x" }] };
    });
    onUpdate({ competitors: newCompetitors, rows: newRows });
  };

  const removeCompetitor = (compIdx) => {
    if (competitors.length <= 1) return;
    const newCompetitors = competitors.filter((_, i) => i !== compIdx);
    const newRows = rows.map((r) => {
      const vals = getRowCompetitorValues(r, competitors);
      return { ...r, competitorValues: vals.filter((_, i) => i !== compIdx) };
    });
    onUpdate({ competitors: newCompetitors, rows: newRows });
  };

  const updateCompetitor = (compIdx, patch) => {
    const newCompetitors = competitors.map((c, i) => (i === compIdx ? { ...c, ...patch } : c));
    onUpdate({ competitors: newCompetitors });
  };

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

        {/* ── Your column ── */}
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

        {/* ── Competitor columns ── */}
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Competitor columns ({competitors.length}/4)
          </p>
        </div>
        {competitors.map((comp, idx) => (
          <div key={comp.id} className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                label={`Competitor ${idx + 1} label`}
                value={comp.label || ""}
                onChange={(v) => updateCompetitor(idx, { label: v })}
                testid={`compare-competitor-label-${idx}`}
              />
            </div>
            {competitors.length > 1 && (
              <button
                type="button"
                onClick={() => removeCompetitor(idx)}
                className="mb-1 px-2 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 shrink-0"
                title="Remove this competitor column"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {competitors.length < 4 && (
          <button
            type="button"
            onClick={addCompetitor}
            className="mt-1 w-full py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-dashed border-slate-300 rounded"
          >
            + Add competitor column
          </button>
        )}
      </Group>

      <Group title={`Rows (${rows.length})`} value="rows">
        <ListEditor
          items={rows}
          onAdd={addRow}
          onRemove={removeRow}
          onReorder={(next) => onUpdate({ rows: next })}
          onDuplicate={duplicateRow}
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
                onChange={(v) => updateRow(r.id, { feature: v })}
                testid={`compare-row-feature-${r.id}`}
              />
              <TextAreaField
                label="Your value"
                value={r.ourValue || ""}
                rows={2}
                onChange={(v) => updateRow(r.id, { ourValue: v })}
                testid={`compare-row-our-${r.id}`}
              />
              <SelectField
                label="Your icon"
                value={r.ourIcon || "check"}
                onChange={(v) => updateRow(r.id, { ourIcon: v })}
                options={[
                  { value: "check", label: "✓ Tick" },
                  { value: "x", label: "✗ Cross" },
                  { value: "none", label: "No icon" },
                ]}
                testid={`compare-row-our-icon-${r.id}`}
              />
              {getRowCompetitorValues(r, competitors).map((cv, compIdx) => (
                <div key={competitors[compIdx]?.id || compIdx} className="pt-2 mt-1 border-t border-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    {competitors[compIdx]?.label || `Competitor ${compIdx + 1}`}
                  </p>
                  <TextAreaField
                    label="Value"
                    value={cv.value || ""}
                    rows={2}
                    onChange={(v) => updateRowCompetitorValue(r.id, compIdx, { value: v })}
                    testid={`compare-row-them-${r.id}-${compIdx}`}
                  />
                  <SelectField
                    label="Icon"
                    value={cv.icon || "x"}
                    onChange={(v) => updateRowCompetitorValue(r.id, compIdx, { icon: v })}
                    options={[
                      { value: "x", label: "✗ Cross" },
                      { value: "check", label: "✓ Tick" },
                      { value: "none", label: "No icon" },
                    ]}
                    testid={`compare-row-them-icon-${r.id}-${compIdx}`}
                  />
                </div>
              ))}
            </>
          )}
        />
      </Group>

      <Group title="Header background" value="header-bg">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Background image (optional)</p>
          <ImageUpload
            value={config.headerImage || ""}
            onChange={(v) => onUpdate({ headerImage: v })}
            testid="compare-header-image"
            compact
          />
        </div>
        {config.headerImage && (
          <>
            <TextField
              label="Image alt text"
              value={config.headerImageAlt || ""}
              onChange={(v) => onUpdate({ headerImageAlt: v })}
              testid="compare-header-image-alt"
            />
            <SliderField
              label="Header height"
              value={Number(config.headerHeight) || 260}
              min={120}
              max={520}
              suffix="px"
              onChange={(v) => onUpdate({ headerHeight: v })}
              testid="compare-header-height"
            />
            {!config.fullBleed && (
              <SliderField
                label="Corner radius"
                description="Disabled when 'Make wide' is on."
                value={config.headerRadius == null ? 0 : Number(config.headerRadius)}
                min={0}
                max={48}
                suffix="px"
                onChange={(v) => onUpdate({ headerRadius: v })}
                testid="compare-header-radius"
              />
            )}
            <SelectField
              label="Overlay style"
              value={config.overlayType || "solid"}
              options={[
                { value: "solid",    label: "Solid colour"     },
                { value: "gradient", label: "Linear gradient"  },
              ]}
              onChange={(v) => onUpdate({ overlayType: v })}
              testid="compare-overlay-type"
            />
            {config.overlayType === "gradient" ? (
              <>
                <ColorField
                  label="Gradient — from"
                  value={config.overlayGradientFrom || "#0f172a"}
                  onChange={(v) => onUpdate({ overlayGradientFrom: v })}
                  testid="compare-grad-from"
                />
                <ColorField
                  label="Gradient — to"
                  value={config.overlayGradientTo || "#1e3a5f"}
                  onChange={(v) => onUpdate({ overlayGradientTo: v })}
                  testid="compare-grad-to"
                />
                <SliderField
                  label="Gradient angle"
                  value={Number(config.overlayGradientAngle) || 135}
                  min={0}
                  max={360}
                  suffix="°"
                  onChange={(v) => onUpdate({ overlayGradientAngle: v })}
                  testid="compare-grad-angle"
                />
              </>
            ) : (
              <ColorField
                label="Overlay colour"
                value={config.headerOverlayColor || "#0f172a"}
                onChange={(v) => onUpdate({ headerOverlayColor: v })}
                testid="compare-header-overlay-color"
              />
            )}
            <SliderField
              label="Overlay opacity"
              value={Math.round((config.headerOverlayOpacity ?? 0.45) * 100)}
              min={0}
              max={100}
              suffix="%"
              onChange={(v) => onUpdate({ headerOverlayOpacity: v / 100 })}
              testid="compare-header-overlay-opacity"
            />
            <ColorField
              label="Header text colour"
              value={config.headerTextColor || "#ffffff"}
              onChange={(v) => onUpdate({ headerTextColor: v })}
              testid="compare-header-text-color"
            />
          </>
        )}
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

      <Group title="Layout">
        <ToggleField
          label="Make wide"
          description="Stretch the background to full viewport width."
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
  description: "You-vs-competitors matrix with tick / cross rows — add up to 4 competitor columns",
  icon: Columns3,
  defaults,
  render,
  FormPanel,
};
