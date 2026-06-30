/**
 * Pricing Table — tiered pricing section for SaaS and subscription products.
 *
 * Supports 2–4 tiers. One tier can be flagged as "highlighted" (best value),
 * which gives it a tinted column, accent border, and a filled CTA button.
 * All other tiers get an outline CTA.
 *
 * Layout:
 *   ┌──────────────┬─────────────┬───────────────┬──────────────┐
 *   │              │  Starter    │  Business ⭐  │  Enterprise  │
 *   │              │  £29/mo     │  £79/mo       │  Custom      │
 *   │              │  [Sign up]  │  [Get started]│  [Contact]   │
 *   ├──────────────┼─────────────┼───────────────┼──────────────┤
 *   │ Users        │  5 users    │  25 users     │  Unlimited   │
 *   │ Support      │  Email      │  Priority     │  Dedicated   │
 *   │ API access   │     ✗       │      ✓        │      ✓       │
 *   └──────────────┴─────────────┴───────────────┴──────────────┘
 *
 * Mobile (max 720px): horizontally scrollable so all columns stay visible.
 */
import { LayoutGrid } from "lucide-react";
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

const ID = "pricing-table";

const SAMPLE_TIERS = [
  {
    name: "Starter",
    price: "£29",
    period: "/month",
    description: "Everything you need to get started.",
    ctaLabel: "Sign up free",
    ctaUrl: "#",
    highlighted: false,
    highlightLabel: "",
  },
  {
    name: "Business",
    price: "£79",
    period: "/month",
    description: "For growing teams that need more power.",
    ctaLabel: "Get started",
    ctaUrl: "#",
    highlighted: true,
    highlightLabel: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored pricing for large organisations.",
    ctaLabel: "Contact us",
    ctaUrl: "#",
    highlighted: false,
    highlightLabel: "",
  },
];

const SAMPLE_FEATURES = [
  { label: "Users",          values: [{ text: "5 users",          icon: "none" }, { text: "25 users",       icon: "none" }, { text: "Unlimited",        icon: "none" }] },
  { label: "Storage",        values: [{ text: "10 GB",            icon: "none" }, { text: "100 GB",         icon: "none" }, { text: "Unlimited",        icon: "none" }] },
  { label: "Support",        values: [{ text: "Email",            icon: "none" }, { text: "Priority email", icon: "none" }, { text: "Dedicated manager",icon: "none" }] },
  { label: "API access",     values: [{ text: "",                 icon: "x"    }, { text: "",               icon: "check" }, { text: "",                icon: "check" }] },
  { label: "Custom branding",values: [{ text: "",                 icon: "x"    }, { text: "",               icon: "x"    }, { text: "",                icon: "check" }] },
  { label: "Uptime SLA",     values: [{ text: "",                 icon: "x"    }, { text: "99.9%",          icon: "none" }, { text: "99.99%",          icon: "none" }] },
];

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "Pricing",
  title: "Simple, transparent pricing",
  subheading: "No hidden fees. Cancel any time.",
  closingText: "",
  tiers: SAMPLE_TIERS.map((t) => ({ id: makeUid(), ...t })),
  features: SAMPLE_FEATURES.map((f) => ({ id: makeUid(), label: f.label, values: f.values })),
  // "top" | "bottom" | "both" | "none"
  ctaPosition: "top",
  featureColumnLabel: "Feature",
  textAlign: "center",
  fullBleed: false,
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

function getTiers(c) {
  return Array.isArray(c.tiers) && c.tiers.length > 0 ? c.tiers : [];
}

function getFeatureValues(feature, tiers) {
  const vals = Array.isArray(feature.values) ? feature.values : [];
  return tiers.map((_, i) => vals[i] || { text: "", icon: "x" });
}

function moveItem(arr, id, dir) {
  const idx = arr.findIndex((it) => it.id === id);
  if (idx < 0) return arr;
  const next = idx + dir;
  if (next < 0 || next >= arr.length) return arr;
  const out = [...arr];
  [out[idx], out[next]] = [out[next], out[idx]];
  return out;
}

// ─── SVG glyphs ───────────────────────────────────────────────────────────────

const TICK_SVG =
  '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS_SVG =
  '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DASH_SVG =
  '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4 8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

function iconFor(kind) {
  if (kind === "check") return `<span class="ns-mark ns-mark-check" aria-hidden="true">${TICK_SVG}</span>`;
  if (kind === "x")     return `<span class="ns-mark ns-mark-x"     aria-hidden="true">${CROSS_SVG}</span>`;
  if (kind === "dash")  return `<span class="ns-mark ns-mark-dash"  aria-hidden="true">${DASH_SVG}</span>`;
  return "";
}

// ─── render ───────────────────────────────────────────────────────────────────

function render(cfg = {}) {
  const c = { ...defaults(), ...cfg };
  const uid = c.uid || makeUid();
  const cls = `ns-pricing-${uid}`;
  const align = c.textAlign === "left" || c.textAlign === "right" ? c.textAlign : "center";
  const accent = safeColor(c.accentColor, "#E01839");
  const muted  = safeColor(c.mutedColor,  "#94a3b8");
  const bg     = safeColor(c.bgColor,     "#ffffff");
  const padTop = padTopOf(c, 80);
  const padBot = padBotOf(c, 80);
  const padX   = padXOf(cfg);

  const tiers = getTiers(c);
  const highlightedIdx = tiers.findIndex((t) => t.highlighted);

  // When ANY tier has a visible badge we render an invisible spacer in
  // every other tier so the tier-name / price / description / CTA all
  // start at the same vertical position across every column.
  const anyBadge = tiers.some((t) => t.highlighted && (t.highlightLabel || "").trim());

  const ctaPos = c.ctaPosition || "top";
  const showTopCta    = ctaPos === "top"    || ctaPos === "both";
  const showBottomCta = ctaPos === "bottom" || ctaPos === "both";

  // Grid: feature label col + one 1fr per tier.
  const gridCols = `1.2fr ${tiers.map(() => "1fr").join(" ")}`;

  const styleVars = [
    `--ns-bg:${bg}`,
    `--ns-title:${safeColor(c.titleColor,  "#0f172a")}`,
    `--ns-eyebrow:${safeColor(c.eyebrowColor, accent)}`,
    `--ns-body:${safeColor(c.bodyColor,   "#475569")}`,
    `--ns-accent:${accent}`,
    `--ns-muted:${muted}`,
    `--ns-border:${safeColor(c.borderColor, "#e2e8f0")}`,
    `--ns-heading-size:${num(c.headingSize, 36)}px`,
  ].join(";");

  const eyebrowHtml = c.eyebrow  ? `<p class="ns-eyebrow">${escHtml(c.eyebrow)}</p>`  : "";
  const titleHtml   = c.title    ? `<h2 class="ns-title">${escHtml(c.title)}</h2>`    : "";
  const subHtml     = c.subheading ? `<p class="ns-sub">${escHtml(c.subheading)}</p>` : "";

  // ── tier header row ──
  const tierHeaderCells = tiers.map((tier, idx) => {
    const isHl   = !!tier.highlighted;
    const hlClass = isHl ? " ns-cell-hl" : "";
    const badgeLabel = (tier.highlightLabel || "").trim();

    // Always emit a badge-height element so all columns share the same
    // starting point. Use an identical element (same classes, non-empty
    // content) with visibility:hidden so line-height metrics are the same.
    let badgeHtml = "";
    if (anyBadge) {
      badgeHtml = isHl && badgeLabel
        ? `<span class="ns-hl-badge">${escHtml(badgeLabel)}</span>`
        : `<span class="ns-hl-badge" aria-hidden="true" style="visibility:hidden">&nbsp;</span>`;
    }

    const priceHtml = tier.price
      ? `<div class="ns-price-row">
           <span class="ns-price">${escHtml(tier.price)}</span>${tier.period ? `<span class="ns-period">${escHtml(tier.period)}</span>` : ""}
         </div>` : "";
    const descHtml = tier.description
      ? `<p class="ns-tier-desc">${escHtml(tier.description)}</p>` : "";
    const ctaUrl = safeUrl(tier.ctaUrl || "#") || "#";
    const ctaHtml = showTopCta && tier.ctaLabel
      ? `<a class="ns-tier-cta" href="${escAttr(ctaUrl)}">${escHtml(tier.ctaLabel)}</a>` : "";

    return `<div class="ns-cell ns-cell-tier${hlClass}" role="columnheader" data-ns-group="tiers" data-ns-list="pricing-tiers" data-ns-item="${idx}">
        ${badgeHtml}
        <span class="ns-tier-name">${escHtml(tier.name || "")}</span>
        ${priceHtml}
        ${descHtml}
        ${ctaHtml}
      </div>`;
  }).join("");

  const headRow = `<div class="ns-row ns-row-head" role="row">
    <div class="ns-cell ns-cell-feature-label" role="columnheader">${escHtml(c.featureColumnLabel || "")}</div>
    ${tierHeaderCells}
  </div>`;

  // ── feature rows ──
  const featureRowsHtml = (c.features || [])
    .filter((f) => f && f.label)
    .map((f, rowIdx) => {
      const valueCells = getFeatureValues(f, tiers).map((v, tierIdx) => {
        const isHl   = tiers[tierIdx] && tiers[tierIdx].highlighted;
        const hlClass = isHl ? " ns-cell-hl" : "";
        const txt  = (v.text || "").trim();
        const icon = ["none", "dash", "check", "x"].includes(v.icon) ? v.icon : "none";
        return `<div class="ns-cell ns-cell-value${hlClass}" role="cell">
            ${iconFor(icon)}
            ${txt ? `<span class="ns-cell-text">${escHtml(txt)}</span>` : ""}
          </div>`;
      }).join("");
      return `<div class="ns-row" role="row" data-ns-group="features" data-ns-list="pricing-features" data-ns-item="${rowIdx}">
        <div class="ns-cell ns-cell-feature" role="cell">${escHtml(f.label)}</div>
        ${valueCells}
      </div>`;
    }).join("");

  // ── optional bottom CTA row ──
  const bottomCtaRow = showBottomCta && tiers.length > 0 ? (() => {
    const cells = tiers.map((tier, idx) => {
      const isHl   = !!tier.highlighted;
      const hlClass = isHl ? " ns-cell-hl" : "";
      const ctaUrl = safeUrl(tier.ctaUrl || "#") || "#";
      const ctaHtml = tier.ctaLabel
        ? `<a class="ns-tier-cta" href="${escAttr(ctaUrl)}">${escHtml(tier.ctaLabel)}</a>` : "";
      return `<div class="ns-cell ns-cell-bottom-cta${hlClass}" role="cell">${ctaHtml}</div>`;
    }).join("");
    return `<div class="ns-row ns-row-bottom-cta" role="row">
      <div class="ns-cell ns-cell-feature" role="cell"></div>
      ${cells}
    </div>`;
  })() : "";

  // ── highlight column border overlay ──
  const highlightCss = highlightedIdx >= 0 ? `
.${cls} .ns-cell-hl{background:color-mix(in srgb, var(--ns-accent) 5%, transparent)}
.${cls} .ns-cell-tier.ns-cell-hl{background:color-mix(in srgb, var(--ns-accent) 9%, transparent)}
.${cls} .ns-hl-col-border{border:2px solid color-mix(in srgb, var(--ns-accent) 35%, transparent);border-radius:14px;position:absolute;inset:0;pointer-events:none;z-index:1}
` : "";

  const ourBorderHtml = highlightedIdx >= 0
    ? `<div class="ns-hl-col-wrap" aria-hidden="true"><div class="ns-hl-col-border"></div></div>`
    : "";

  const hlColStart = highlightedIdx + 2; // feature col = 1, tiers start at 2

  const closingHtml = (c.closingText || "").trim()
    ? `<p class="ns-closing">${escHtml(c.closingText)}</p>` : "";

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
.${cls} .ns-title{font-size:var(--ns-heading-size,36px);font-weight:700;line-height:1.15;letter-spacing:-0.02em;color:var(--ns-title);margin:0 0 10px}
.${cls} .ns-sub{font-size:16px;line-height:1.6;color:var(--ns-body);margin:0 0 36px;max-width:620px;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}}
.${cls} .ns-table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:24px}
.${cls} .ns-table{position:relative;display:grid;grid-template-columns:${gridCols};border:1px solid var(--ns-border);border-radius:14px;overflow:hidden;background:var(--ns-bg);text-align:left;min-width:480px}
.${cls} .ns-row{display:contents}
.${cls} .ns-cell{padding:18px 20px;border-top:1px solid var(--ns-border);min-width:0;display:flex;align-items:center;gap:8px;font-size:15px;line-height:1.5;color:var(--ns-body);position:relative;z-index:0}
.${cls} .ns-cell-feature-label{border-top:0;font-weight:700;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:var(--ns-title);background:color-mix(in srgb, var(--ns-title) 3%, transparent);padding:20px;align-items:flex-start}
.${cls} .ns-cell-feature{font-weight:600;color:var(--ns-title);font-size:14px}
.${cls} .ns-cell-value{justify-content:flex-start}
.${cls} .ns-cell-tier{flex-direction:column;align-items:flex-start;gap:6px;padding:24px 20px;border-top:0;background:color-mix(in srgb, var(--ns-title) 3%, transparent)}
.${cls} .ns-tier-name{font-weight:700;font-size:16px;color:var(--ns-title);letter-spacing:-0.01em}
.${cls} .ns-price-row{display:flex;align-items:baseline;gap:3px;line-height:1}
.${cls} .ns-price{font-size:32px;font-weight:800;color:var(--ns-title);letter-spacing:-0.03em}
.${cls} .ns-period{font-size:13px;color:var(--ns-muted);font-weight:500}
.${cls} .ns-tier-desc{font-size:13px;line-height:1.5;color:var(--ns-body);margin:0}
.${cls} .ns-hl-badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;background:var(--ns-accent);color:#fff;align-self:flex-start}
.${cls} .ns-hl-badge-spacer{display:inline-block;padding:3px 10px;font-size:11px;visibility:hidden;pointer-events:none;user-select:none}
.${cls} .ns-tier-cta{display:block;width:100%;padding:9px 16px;border-radius:8px;font-size:14px;font-weight:600;text-align:center;text-decoration:none;cursor:pointer;box-sizing:border-box;transition:opacity 0.15s;background:transparent;border:1.5px solid var(--ns-border);color:var(--ns-title);margin-top:4px}
.${cls} .ns-cell-tier.ns-cell-hl .ns-tier-cta{background:var(--ns-accent);border-color:var(--ns-accent);color:#fff}
.${cls} .ns-tier-cta:hover{opacity:0.82}
.${cls} .ns-cell-bottom-cta{padding:16px 20px;justify-content:center}
.${cls} .ns-cell-text{flex:1;min-width:0}
.${cls} .ns-mark{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%}
.${cls} .ns-mark-check{color:#fff;background:var(--ns-accent)}
.${cls} .ns-mark-x{color:#fff;background:var(--ns-muted)}
.${cls} .ns-mark-dash{color:var(--ns-muted);background:transparent}
.${cls} .ns-hl-col-wrap{position:absolute;inset:0;display:grid;grid-template-columns:${gridCols};pointer-events:none}
.${cls} .ns-hl-col-wrap > .ns-hl-col-border{grid-column:${hlColStart} / ${hlColStart + 1}}
.${cls} .ns-closing{margin:28px auto 0;max-width:600px;font-size:15px;line-height:1.6;color:var(--ns-body);text-align:${align}}
${hasHeaderImg ? `
.${cls} .ns-header-bg{position:relative;min-height:${headerHeight}px;background-image:url("${escAttr(safeUrl(c.headerImage))}");background-size:cover;background-position:center;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:48px ${padX}px;margin-bottom:36px;border-radius:${headerRadius}px}
.${cls} .ns-header-overlay{position:absolute;inset:0;background:${overlayBg};opacity:${headerOverlayOpacity};pointer-events:none}
.${cls} .ns-header-content{position:relative;z-index:1;max-width:720px;width:100%;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
.${cls} .ns-header-bg .ns-title{color:${headerTextColor}}
.${cls} .ns-header-bg .ns-sub{color:${headerTextColor};opacity:.92;margin-bottom:0}
` : ""}
${highlightCss}
${footerLinkCss(cls, accent, safeColor(c.bodyColor, "#475569"))}
@media (max-width:720px){
  ${hasHeaderImg ? `.${cls} .ns-header-bg{min-height:${Math.max(120, Math.round(headerHeight * 0.75))}px;padding:32px 18px;margin-bottom:24px}` : ""}
  .${cls} .ns-table-scroll{border-radius:14px;border:1px solid var(--ns-border)}
  .${cls} .ns-table{border:0;border-radius:0;min-width:${Math.max(480, tiers.length * 130 + 160)}px}
  .${cls} .ns-cell{padding:14px 14px}
  .${cls} .ns-cell-tier{padding:18px 14px}
  .${cls} .ns-price{font-size:26px}
}
`.trim();

  const html = `<section class="ns-pricing ${cls}${fullBleedClass(c)}" style="${styleVars}" data-ns-group="defaults">
  ${photoHeader}
  <div class="ns-wrap">
    ${plainHeader}
    <div class="ns-table-scroll">
      <div class="ns-table" role="table">
        ${ourBorderHtml}
        ${headRow}
        ${featureRowsHtml}
        ${bottomCtaRow}
      </div>
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
  const tiers    = getTiers(config);
  const features = config.features || [];

  // ── tier helpers ──
  const updateTier = (id, patch) => {
    let newTiers = tiers.map((t) => (t.id === id ? { ...t, ...patch } : t));
    // Only one tier can be highlighted at a time.
    if (patch.highlighted) {
      newTiers = newTiers.map((t) => (t.id === id ? t : { ...t, highlighted: false }));
    }
    onUpdate({ tiers: newTiers });
  };

  const addTier = () => {
    if (tiers.length >= 4) return;
    const newTier = {
      id: makeUid(),
      name: `Tier ${tiers.length + 1}`,
      price: "£0",
      period: "/month",
      description: "",
      ctaLabel: "Get started",
      ctaUrl: "#",
      highlighted: false,
      highlightLabel: "Most Popular",
    };
    const newFeatures = features.map((f) => ({
      ...f,
      values: [...getFeatureValues(f, tiers), { text: "", icon: "x" }],
    }));
    onUpdate({ tiers: [...tiers, newTier], features: newFeatures });
  };

  const removeTier = (id) => {
    if (tiers.length <= 2) return;
    const idx = tiers.findIndex((t) => t.id === id);
    const newTiers = tiers.filter((t) => t.id !== id);
    const newFeatures = features.map((f) => {
      const vals = getFeatureValues(f, tiers);
      return { ...f, values: vals.filter((_, i) => i !== idx) };
    });
    onUpdate({ tiers: newTiers, features: newFeatures });
  };

  const moveTier = (id, dir) => {
    const idx = tiers.findIndex((t) => t.id === id);
    const newTiers = moveItem(tiers, id, dir);
    if (newTiers === tiers) return;
    const newIdx = idx + dir;
    const newFeatures = features.map((f) => {
      const vals = getFeatureValues(f, tiers);
      const newVals = [...vals];
      [newVals[idx], newVals[newIdx]] = [newVals[newIdx], newVals[idx]];
      return { ...f, values: newVals };
    });
    onUpdate({ tiers: newTiers, features: newFeatures });
  };

  const duplicateTier = (id) => {
    if (tiers.length >= 4) return;
    const idx = tiers.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const clone = { ...tiers[idx], id: makeUid(), highlighted: false };
    const newTiers = [...tiers];
    newTiers.splice(idx + 1, 0, clone);
    const newFeatures = features.map((f) => {
      const vals = getFeatureValues(f, tiers);
      const newVals = [...vals];
      newVals.splice(idx + 1, 0, { ...vals[idx] });
      return { ...f, values: newVals };
    });
    onUpdate({ tiers: newTiers, features: newFeatures });
  };

  // ── feature helpers ──
  const updateFeature = (id, patch) =>
    onUpdate({ features: features.map((f) => (f.id === id ? { ...f, ...patch } : f)) });

  const updateFeatureValue = (featureId, tierIdx, patch) => {
    const feature = features.find((f) => f.id === featureId);
    if (!feature) return;
    const vals = getFeatureValues(feature, tiers).map((v, i) =>
      i === tierIdx ? { ...v, ...patch } : v
    );
    updateFeature(featureId, { values: vals });
  };

  const addFeature = () =>
    onUpdate({
      features: [
        ...features,
        {
          id: makeUid(),
          label: "New feature",
          values: tiers.map(() => ({ text: "", icon: "check" })),
        },
      ],
    });

  const removeFeature = (id) =>
    onUpdate({ features: features.filter((f) => f.id !== id) });

  const moveFeature = (id, dir) =>
    onUpdate({ features: moveItem(features, id, dir) });

  const duplicateFeature = (id) => {
    const idx = features.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const clone = { ...features[idx], id: makeUid() };
    const arr = [...features];
    arr.splice(idx + 1, 0, clone);
    onUpdate({ features: arr });
  };

  return (
    <FormAccordion sectionType="pricing-table">
      <Group title="Header" value="header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="pricing-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.title || ""}
          onChange={(v) => onUpdate({ title: v })}
          testid="pricing-title"
        />
        <TextAreaField
          label="Subheading (optional)"
          value={config.subheading || ""}
          rows={2}
          onChange={(v) => onUpdate({ subheading: v })}
          testid="pricing-subheading"
        />
        <SelectField
          label="Heading alignment"
          value={config.textAlign || "center"}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "left",   label: "Left"   },
            { value: "center", label: "Center" },
            { value: "right",  label: "Right"  },
          ]}
          testid="pricing-text-align"
        />
      </Group>

      <Group title={`Tiers (${tiers.length}/4)`} value="tiers">
        <ListEditor
          items={tiers}
          onAdd={tiers.length < 4 ? addTier : undefined}
          onRemove={tiers.length > 2 ? removeTier : undefined}
          onMove={moveTier}
          onDuplicate={tiers.length < 4 ? duplicateTier : undefined}
          itemLabel={(t) => t.name || "Untitled tier"}
          addLabel="Add tier"
          testidPrefix="pricing-tiers"
          renderRow={(t) => (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-slate-700 truncate">{t.name || "Untitled tier"}</span>
              {t.highlighted && (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-600">Best value</span>
              )}
            </div>
          )}
          renderForm={(t) => (
            <>
              <TextField
                label="Tier name"
                value={t.name || ""}
                onChange={(v) => updateTier(t.id, { name: v })}
                testid={`pricing-tier-name-${t.id}`}
              />
              <TextField
                label="Price"
                value={t.price || ""}
                onChange={(v) => updateTier(t.id, { price: v })}
                placeholder="e.g. £79 or Custom"
                testid={`pricing-tier-price-${t.id}`}
              />
              <TextField
                label="Billing period (optional)"
                value={t.period || ""}
                onChange={(v) => updateTier(t.id, { period: v })}
                placeholder="e.g. /month"
                testid={`pricing-tier-period-${t.id}`}
              />
              <TextAreaField
                label="Description (optional)"
                value={t.description || ""}
                rows={2}
                onChange={(v) => updateTier(t.id, { description: v })}
                testid={`pricing-tier-desc-${t.id}`}
              />
              <TextField
                label="CTA button label"
                value={t.ctaLabel || ""}
                onChange={(v) => updateTier(t.id, { ctaLabel: v })}
                testid={`pricing-tier-cta-label-${t.id}`}
              />
              <TextField
                label="CTA link URL"
                value={t.ctaUrl || ""}
                onChange={(v) => updateTier(t.id, { ctaUrl: v })}
                placeholder="https://…"
                testid={`pricing-tier-cta-url-${t.id}`}
              />
              <ToggleField
                label="Best value / highlighted"
                description="Tints this column and gives the CTA a filled accent style."
                checked={!!t.highlighted}
                onChange={(v) => updateTier(t.id, { highlighted: v })}
                testid={`pricing-tier-hl-${t.id}`}
              />
              {t.highlighted && (
                <TextField
                  label="Highlight badge text"
                  value={t.highlightLabel || ""}
                  onChange={(v) => updateTier(t.id, { highlightLabel: v })}
                  placeholder="e.g. Most Popular"
                  testid={`pricing-tier-hl-label-${t.id}`}
                />
              )}
            </>
          )}
        />
      </Group>

      <Group title={`Features (${features.length})`} value="features">
        <ListEditor
          items={features}
          onAdd={addFeature}
          onRemove={removeFeature}
          onMove={moveFeature}
          onDuplicate={duplicateFeature}
          itemLabel={(f) => f.label || "Untitled feature"}
          addLabel="Add feature row"
          testidPrefix="pricing-features"
          renderRow={(f) => (
            <div className="text-xs font-medium text-slate-700 truncate">{f.label || "Untitled feature"}</div>
          )}
          renderForm={(f) => (
            <>
              <TextField
                label="Feature label"
                value={f.label || ""}
                onChange={(v) => updateFeature(f.id, { label: v })}
                testid={`pricing-feat-label-${f.id}`}
              />
              {getFeatureValues(f, tiers).map((v, tierIdx) => (
                <div key={tiers[tierIdx]?.id || tierIdx} className="pt-2 mt-1 border-t border-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    {tiers[tierIdx]?.name || `Tier ${tierIdx + 1}`}
                  </p>
                  <TextAreaField
                    label="Value text (optional)"
                    value={v.text || ""}
                    rows={2}
                    onChange={(val) => updateFeatureValue(f.id, tierIdx, { text: val })}
                    placeholder="e.g. 5 users, Unlimited, 100 GB"
                    testid={`pricing-feat-val-${f.id}-${tierIdx}`}
                  />
                  <SelectField
                    label="Icon"
                    value={v.icon || "none"}
                    onChange={(val) => updateFeatureValue(f.id, tierIdx, { icon: val })}
                    options={[
                      { value: "none",  label: "No icon" },
                      { value: "check", label: "✓ Tick"  },
                      { value: "x",     label: "✗ Cross" },
                      { value: "dash",  label: "— Dash"  },
                    ]}
                    testid={`pricing-feat-icon-${f.id}-${tierIdx}`}
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
            testid="pricing-header-image"
            compact
          />
        </div>
        {config.headerImage && (
          <>
            <TextField
              label="Image alt text"
              value={config.headerImageAlt || ""}
              onChange={(v) => onUpdate({ headerImageAlt: v })}
              testid="pricing-header-image-alt"
            />
            <SliderField
              label="Header height"
              value={Number(config.headerHeight) || 260}
              min={120}
              max={520}
              suffix="px"
              onChange={(v) => onUpdate({ headerHeight: v })}
              testid="pricing-header-height"
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
                testid="pricing-header-radius"
              />
            )}
            <SelectField
              label="Overlay style"
              value={config.overlayType || "solid"}
              options={[
                { value: "solid",    label: "Solid colour"    },
                { value: "gradient", label: "Linear gradient" },
              ]}
              onChange={(v) => onUpdate({ overlayType: v })}
              testid="pricing-overlay-type"
            />
            {config.overlayType === "gradient" ? (
              <>
                <ColorField
                  label="Gradient — from"
                  value={config.overlayGradientFrom || "#0f172a"}
                  onChange={(v) => onUpdate({ overlayGradientFrom: v })}
                  testid="pricing-grad-from"
                />
                <ColorField
                  label="Gradient — to"
                  value={config.overlayGradientTo || "#1e3a5f"}
                  onChange={(v) => onUpdate({ overlayGradientTo: v })}
                  testid="pricing-grad-to"
                />
                <SliderField
                  label="Gradient angle"
                  value={Number(config.overlayGradientAngle) || 135}
                  min={0}
                  max={360}
                  suffix="°"
                  onChange={(v) => onUpdate({ overlayGradientAngle: v })}
                  testid="pricing-grad-angle"
                />
              </>
            ) : (
              <ColorField
                label="Overlay colour"
                value={config.headerOverlayColor || "#0f172a"}
                onChange={(v) => onUpdate({ headerOverlayColor: v })}
                testid="pricing-header-overlay-color"
              />
            )}
            <SliderField
              label="Overlay opacity"
              value={Math.round((config.headerOverlayOpacity ?? 0.45) * 100)}
              min={0}
              max={100}
              suffix="%"
              onChange={(v) => onUpdate({ headerOverlayOpacity: v / 100 })}
              testid="pricing-header-overlay-opacity"
            />
            <ColorField
              label="Header text colour"
              value={config.headerTextColor || "#ffffff"}
              onChange={(v) => onUpdate({ headerTextColor: v })}
              testid="pricing-header-text-color"
            />
          </>
        )}
      </Group>

      <Group title="Closing" value="closing">
        <TextAreaField
          label="Closing text (optional)"
          value={config.closingText || ""}
          rows={2}
          onChange={(v) => onUpdate({ closingText: v })}
          placeholder="e.g. All plans include a 14-day free trial."
          testid="pricing-closing"
        />
        <FooterLinkEditor
          value={config.footerLink}
          onChange={(v) => onUpdate({ footerLink: v })}
          testidPrefix="pricing-footer-link"
        />
      </Group>

      <Group title="Layout">
        <ToggleField
          label="Make wide"
          description="Stretch the background to full viewport width."
          checked={!!config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="pricing-full-bleed"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={80}
          max={160}
          testidPrefix="pricing"
        />
        <SliderField
          label="Heading size"
          value={Number(config.headingSize) || 36}
          min={20}
          max={72}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="pricing-heading-size"
        />
      </Group>

      <Group title="Defaults" value="defaults">
        <TextField
          label="Feature column label"
          value={config.featureColumnLabel || ""}
          onChange={(v) => onUpdate({ featureColumnLabel: v })}
          testid="pricing-feature-col-label"
        />
        <SelectField
          label="CTA button position"
          value={config.ctaPosition || "top"}
          onChange={(v) => onUpdate({ ctaPosition: v })}
          options={[
            { value: "top",    label: "Top only (inside tier header)"    },
            { value: "bottom", label: "Bottom only (after feature rows)" },
            { value: "both",   label: "Both top and bottom"              },
            { value: "none",   label: "No CTA button"                   },
          ]}
          testid="pricing-cta-position"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="pricing-bg"
        />
        <ColorField
          label="Title colour"
          value={config.titleColor}
          onChange={(v) => onUpdate({ titleColor: v })}
          testid="pricing-title-color"
        />
        <ColorField
          label="Eyebrow colour"
          value={config.eyebrowColor}
          onChange={(v) => onUpdate({ eyebrowColor: v })}
          testid="pricing-eyebrow-color"
        />
        <ColorField
          label="Body colour"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="pricing-body-color"
        />
        <ColorField
          label="Accent (highlight column + tick + CTA)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="pricing-accent"
        />
        <ColorField
          label="Muted (cross icon + billing period)"
          value={config.mutedColor}
          onChange={(v) => onUpdate({ mutedColor: v })}
          testid="pricing-muted"
        />
        <ColorField
          label="Border colour"
          value={config.borderColor}
          onChange={(v) => onUpdate({ borderColor: v })}
          testid="pricing-border"
        />
      </Group>
    </FormAccordion>
  );
}

export const pricingTable = {
  id: ID,
  name: "Pricing Table",
  description: "2–4 tier pricing comparison with feature rows, highlighted best-value column and per-tier CTA",
  icon: LayoutGrid,
  defaults,
  render,
  FormPanel,
};
