/**
 * Stat Counter — a row of big numbers (e.g. "36%", "£2.4M", "5×") each
 * paired with a short label and an optional description.
 *
 * Designed as the visual counterweight to Trust Strip. Trust Strip is
 * "icon + tight copy" all at equal visual weight; Stat Counter makes
 * the NUMBER the hero element at 48–96 px with the supporting copy
 * deliberately small.
 *
 * Optional count-up animation: when the section scrolls into view each
 * number ramps from 0 to its target over ~1.2 s using
 * requestAnimationFrame. Respects `prefers-reduced-motion` (jumps
 * straight to the final value). Pure HTML/CSS/JS — no libs.
 *
 * High-converting B2B pattern: every consulting / agency / SaaS page
 * has a "we saved customers 36% / cut their tooling by 50% / etc." band.
 */
import { Hash } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  iife,
  makeUid,
  num,
  padTopOf,
  padBotOf,
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
import ListEditor from "@/components/ListEditor";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";

const ID = "stat-counter";

const SAMPLE = [
  {
    prefix: "",
    value: "23",
    suffix: "",
    label: "Composable section types",
    body: "Hero, Split Banner, Comparison Table, Video Embed and many more — every one a self-contained snippet.",
  },
  {
    prefix: "",
    value: "5",
    suffix: " min",
    label: "From paste to live snippet",
    body: "Open the editor, pick a section, theme it with your brand kit, copy the HTML drop-in.",
  },
  {
    prefix: "",
    value: "0",
    suffix: "",
    label: "External runtime libraries",
    body: "No React, jQuery or build step on the host site. Every snippet ships scoped CSS + a tiny IIFE.",
  },
  {
    prefix: "",
    value: "100",
    suffix: "%",
    label: "Self-contained HTML / CSS / JS",
    body: "Drops into Nettailer, Shopify, WordPress, plain HTML — and survives a host CSS reset.",
  },
];

const defaults = () => ({
  uid: makeUid(),
  // Optional section header — keeps the layout flexible: a Stat Counter
  // can sit on its own or sit under an eyebrow/heading combo.
  eyebrow: "By the numbers",
  heading: "Build pages, not boilerplate.",
  body:
    "Every section ships as one paste-ready snippet — fully scoped CSS, zero runtime libraries, and a Hybrid Page Builder that lets you compose entire pages without writing front-end code.",
  // Optional trailing CTA below the numbers row.
  ctaText: "Browse the section library",
  ctaLink: "#",
  ctaOpenInSameTab: false,
  // Items.
  items: SAMPLE.map((s) => ({ id: makeUid(), ...s })),
  // Layout
  columns: 4, // 2 | 3 | 4 | 5
  alignment: "center", // "left" | "center"
  showDividers: false,
  fullBleed: false,
  // Outer spacing.
  paddingTop: 80,
  paddingBottom: 80,
  paddingY: 80, // legacy fallback for migrations
  // Number presentation.
  numberSize: 72, // px
  numberWeight: "700", // 400 / 500 / 600 / 700
  animate: true, // count-up on scroll
  animateDuration: 1200, // ms
  // Theme.
  bgColor: "#0f172a", // dark navy (matches Xeretec's IT-That-Delivers band)
  textColor: "#ffffff", // section heading + body
  numberColor: "#ffffff", // the big number itself
  labelColor: "#ffffff", // label under each number
  bodyColor: "#cbd5e1", // description line
  accentColor: "#E01839", // eyebrow + CTA + divider hairline
  borderColor: "rgba(255,255,255,0.18)",
});

/**
 * Parse a number string like "36" / "36.5" / "2,400" into a target the
 * count-up animation can interpolate against. Returns { num, decimals }
 * so we can preserve the visual format (e.g. "36" stays "36", "36.5"
 * stays "36.5", "2400" formats to "2,400" with the thousands separator
 * preserved on the way up).
 */
function parseTarget(value) {
  if (value == null) return { num: 0, decimals: 0 };
  const clean = String(value).replace(/,/g, "").trim();
  const n = parseFloat(clean);
  if (!Number.isFinite(n)) return { num: 0, decimals: 0 };
  const dotIdx = clean.indexOf(".");
  const decimals = dotIdx === -1 ? 0 : clean.length - dotIdx - 1;
  return { num: n, decimals };
}

function render(cfg = {}) {
  const c = { ...defaults(), ...cfg };
  const uid = c.uid || makeUid();
  const cls = `ns-stat-${uid}`;
  const cols = Math.max(2, Math.min(5, num(c.columns, 4)));
  const align = c.alignment === "left" ? "left" : "center";
  const accent = safeColor(c.accentColor, "#E01839");
  const padTop = padTopOf(c, 80);
  const padBot = padBotOf(c, 80);
  const numSize = num(c.numberSize, 72);
  const numWeight = ["400", "500", "600", "700"].includes(String(c.numberWeight))
    ? String(c.numberWeight)
    : "700";
  const animate = !!c.animate;
  const animateMs = Math.max(200, Math.min(4000, num(c.animateDuration, 1200)));

  const styleVars = [
    `--ns-bg:${safeColor(c.bgColor, "#0f172a")}`,
    `--ns-text:${safeColor(c.textColor, "#ffffff")}`,
    `--ns-num:${safeColor(c.numberColor, "#ffffff")}`,
    `--ns-label:${safeColor(c.labelColor, "#ffffff")}`,
    `--ns-body:${safeColor(c.bodyColor, "#cbd5e1")}`,
    `--ns-accent:${accent}`,
    `--ns-border:${safeColor(c.borderColor, "rgba(255,255,255,0.18)")}`,
    `--ns-cols:${cols}`,
    `--ns-num-size:${numSize}px`,
    `--ns-num-weight:${numWeight}`,
  ].join(";");

  const itemsHtml = (c.items || [])
    .filter((it) => it && (it.value || it.label))
    .map((it) => {
      const target = parseTarget(it.value);
      const prefix = it.prefix ? escHtml(it.prefix) : "";
      const suffix = it.suffix ? escHtml(it.suffix) : "";
      const initial = animate ? "0" : escHtml(String(it.value || ""));
      // Per-item accent override (optional). Default to the section accent.
      const colorVar = it.accent
        ? ` style="--ns-stat-color:${safeColor(it.accent, accent)}"`
        : "";
      return `
    <li class="ns-stat-item"${colorVar}>
      <div class="ns-stat-num" data-ns-target="${escAttr(String(target.num))}" data-ns-decimals="${target.decimals}">
        ${prefix ? `<span class="ns-stat-prefix">${prefix}</span>` : ""}<span class="ns-stat-value">${initial}</span>${suffix ? `<span class="ns-stat-suffix">${suffix}</span>` : ""}
      </div>
      ${it.label ? `<h3 class="ns-stat-label">${escHtml(it.label)}</h3>` : ""}
      ${it.body ? `<p class="ns-stat-body">${escHtml(it.body)}</p>` : ""}
    </li>`;
    })
    .join("");

  const dividerCss = c.showDividers
    ? `.${cls} .ns-stat-list > li + li{border-left:1px solid var(--ns-border);padding-left:24px}@media (max-width:767px){.${cls} .ns-stat-list > li + li{border-left:none;border-top:1px solid var(--ns-border);padding-left:0;padding-top:24px}}`
    : "";

  const ctaText = (c.ctaText || "").trim();
  const ctaHref = safeUrl(c.ctaLink || "#");
  const ctaTarget = c.ctaOpenInSameTab ? "_self" : "_blank";
  const ctaRel = c.ctaOpenInSameTab ? "" : ' rel="noopener noreferrer"';
  const ctaHtml = ctaText
    ? `<a class="ns-stat-cta" href="${escAttr(ctaHref)}" target="${ctaTarget}"${ctaRel}>${escHtml(ctaText)}</a>`
    : "";

  // Header is only emitted when at least one field is filled — keeps the
  // section "numbers-only" by default and lets users hide the header
  // entirely just by blanking the fields.
  const headerHtml =
    c.eyebrow || c.heading || c.body
      ? `<div class="ns-stat-header">
      ${c.eyebrow ? `<p class="ns-stat-eyebrow">${escHtml(c.eyebrow)}</p>` : ""}
      ${c.heading ? `<h2 class="ns-stat-heading">${escHtml(c.heading)}</h2>` : ""}
      ${c.body ? `<p class="ns-stat-intro">${escHtml(c.body)}</p>` : ""}
    </div>`
      : "";

  const css = `
${baseReset(cls)}
.${cls}{padding:${padTop}px 20px ${padBot}px;width:100%;background:var(--ns-bg);color:var(--ns-text)}
.${cls} .ns-stat-wrap{max-width:1200px;margin:0 auto;text-align:${align}}
.${cls} .ns-stat-header{margin:0 auto 48px;max-width:680px;text-align:${align}}
.${cls} .ns-stat-eyebrow{margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-accent)}
.${cls} .ns-stat-heading{margin:0 0 14px;font-size:clamp(1.6rem,3vw,2.25rem);font-weight:600;letter-spacing:-0.015em;line-height:1.15;color:var(--ns-text)}
.${cls} .ns-stat-intro{margin:0;font-size:16px;line-height:1.6;color:var(--ns-body)}
.${cls} .ns-stat-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(var(--ns-cols), minmax(0, 1fr));gap:40px 24px;align-items:start}
.${cls} .ns-stat-item{display:flex;flex-direction:column;gap:10px;text-align:${align};align-items:${align === "center" ? "center" : "flex-start"};--ns-stat-color:var(--ns-accent)}
.${cls} .ns-stat-num{display:inline-flex;align-items:baseline;gap:2px;font-size:var(--ns-num-size);font-weight:var(--ns-num-weight);line-height:1;letter-spacing:-0.025em;color:var(--ns-stat-color);font-variant-numeric:tabular-nums}
.${cls} .ns-stat-prefix,.${cls} .ns-stat-suffix{font-size:0.55em;font-weight:600;line-height:1;align-self:flex-start;margin-top:0.45em}
.${cls} .ns-stat-prefix{margin-right:2px;margin-top:0.55em}
.${cls} .ns-stat-suffix{margin-left:2px}
.${cls} .ns-stat-label{margin:4px 0 0;font-size:16px;font-weight:600;line-height:1.3;color:var(--ns-label);letter-spacing:-0.005em}
.${cls} .ns-stat-body{margin:0;font-size:14px;line-height:1.55;color:var(--ns-body);max-width:36ch}
.${cls} .ns-stat-cta{display:inline-flex;align-items:center;justify-content:center;margin-top:40px;padding:13px 28px;background:var(--ns-accent);color:#fff;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;transition:transform .15s ease,filter .15s ease}
.${cls} .ns-stat-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}
${dividerCss}
@media (max-width:980px){.${cls} .ns-stat-list{grid-template-columns:repeat(2, minmax(0, 1fr));gap:36px 20px}}
@media (max-width:560px){.${cls} .ns-stat-list{grid-template-columns:1fr;gap:32px}.${cls} .ns-stat-num{font-size:calc(var(--ns-num-size) * 0.78)}}
@media (prefers-reduced-motion: reduce){.${cls} .ns-stat-cta{transition:none}}
`.trim();

  const html = `<section class="ns-stat-counter ${cls}${fullBleedClass(c)}" style="${styleVars}" data-ns-animate="${animate ? "1" : "0"}" data-ns-dur="${animateMs}">
  <div class="ns-stat-wrap">
    ${headerHtml}
    <ul class="ns-stat-list">${itemsHtml}</ul>
    ${ctaHtml ? `<div class="ns-stat-cta-row">${ctaHtml}</div>` : ""}
  </div>
</section>`;

  // Count-up: ramp each .ns-stat-value from 0 to its data-ns-target over
  // the section's data-ns-dur (default 1200ms) when the section enters
  // the viewport. Respects prefers-reduced-motion (jumps to final).
  // Idempotent: only runs once per section via root.__nsCounted.
  const js = iife(
    cls,
    `if(root.getAttribute("data-ns-animate")!=="1")return;var dur=parseInt(root.getAttribute("data-ns-dur"),10)||1200;var reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;function fmt(n,d){if(d===0)return String(Math.round(n));var s=n.toFixed(d);return s;}function run(){if(root.__nsCounted)return;root.__nsCounted=true;var vals=root.querySelectorAll(".ns-stat-num");if(reduced){for(var i=0;i<vals.length;i++){var v=vals[i].querySelector(".ns-stat-value");var t=parseFloat(vals[i].getAttribute("data-ns-target"))||0;var d=parseInt(vals[i].getAttribute("data-ns-decimals"),10)||0;v.textContent=fmt(t,d);}return;}var start=null;function step(ts){if(start===null)start=ts;var p=Math.min(1,(ts-start)/dur);var ease=1-Math.pow(1-p,3);for(var i=0;i<vals.length;i++){var vv=vals[i].querySelector(".ns-stat-value");var tt=parseFloat(vals[i].getAttribute("data-ns-target"))||0;var dd=parseInt(vals[i].getAttribute("data-ns-decimals"),10)||0;vv.textContent=fmt(tt*ease,dd);}if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++){if(es[i].isIntersecting){run();io.disconnect();break;}}},{threshold:0.25});io.observe(root);}else{run();}`
  );

  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  const items = config.items || [];
  const update = (id, patch) =>
    onUpdate({ items: items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  const add = () =>
    onUpdate({
      items: [
        ...items,
        {
          id: makeUid(),
          prefix: "",
          value: "100",
          suffix: "%",
          label: "New stat",
          body: "Short supporting line.",
        },
      ],
    });
  const remove = (id) => onUpdate({ items: items.filter((it) => it.id !== id) });
  const reorder = (next) => onUpdate({ items: next });

  return (
    <FormAccordion sectionType="stat-counter">
      <Group title="Header (optional)">
        <TextField
          label="Eyebrow"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="stat-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.heading || ""}
          onChange={(v) => onUpdate({ heading: v })}
          testid="stat-heading"
        />
        <TextAreaField
          label="Body"
          value={config.body || ""}
          onChange={(v) => onUpdate({ body: v })}
          rows={3}
          testid="stat-body"
        />
      </Group>

      <Group title={`Numbers (${items.length})`} value="items">
        <ListEditor
          items={items}
          onAdd={add}
          onRemove={remove}
          onReorder={reorder}
          itemLabel={(it) =>
            `${it.prefix || ""}${it.value || "?"}${it.suffix || ""} — ${it.label || "Untitled"}`
          }
          addLabel="Add number"
          testid="stat-items"
          renderRow={(it) => (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {it.prefix || ""}
                {it.value || "?"}
                {it.suffix || ""}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {it.label || "Untitled"}
              </span>
            </div>
          )}
          renderForm={(it) => (
            <>
              <div className="grid grid-cols-3 gap-2">
                <TextField
                  label="Prefix"
                  value={it.prefix || ""}
                  onChange={(v) => update(it.id, { prefix: v })}
                  placeholder="£ / $ / +"
                  testid={`stat-item-prefix-${it.id}`}
                />
                <TextField
                  label="Number"
                  value={it.value || ""}
                  onChange={(v) => update(it.id, { value: v })}
                  placeholder="36"
                  testid={`stat-item-value-${it.id}`}
                />
                <TextField
                  label="Suffix"
                  value={it.suffix || ""}
                  onChange={(v) => update(it.id, { suffix: v })}
                  placeholder="% / + / x"
                  testid={`stat-item-suffix-${it.id}`}
                />
              </div>
              <TextField
                label="Label"
                value={it.label || ""}
                onChange={(v) => update(it.id, { label: v })}
                testid={`stat-item-label-${it.id}`}
              />
              <TextAreaField
                label="Body (optional)"
                value={it.body || ""}
                rows={2}
                onChange={(v) => update(it.id, { body: v })}
                testid={`stat-item-body-${it.id}`}
              />
              <ColorField
                label="Accent override (optional)"
                value={it.accent || ""}
                onChange={(v) => update(it.id, { accent: v })}
                testid={`stat-item-accent-${it.id}`}
              />
            </>
          )}
        />
      </Group>

      <Group title="CTA (optional)">
        <TextField
          label="Button label (leave blank to hide)"
          value={config.ctaText || ""}
          onChange={(v) => onUpdate({ ctaText: v })}
          testid="stat-cta-text"
        />
        {config.ctaText ? (
          <>
            <TextField
              label="Button link"
              value={config.ctaLink || "#"}
              onChange={(v) => onUpdate({ ctaLink: v })}
              testid="stat-cta-link"
            />
            <ToggleField
              label="Open in same tab"
              checked={!!config.ctaOpenInSameTab}
              onChange={(v) => onUpdate({ ctaOpenInSameTab: v })}
              testid="stat-cta-same-tab"
            />
          </>
        ) : null}
      </Group>

      <Group title="Defaults" value="defaults">
        <SelectField
          label="Columns (desktop)"
          value={String(config.columns || 4)}
          onChange={(v) => onUpdate({ columns: Number(v) })}
          options={[
            { value: "2", label: "2 columns" },
            { value: "3", label: "3 columns" },
            { value: "4", label: "4 columns" },
            { value: "5", label: "5 columns" },
          ]}
          testid="stat-columns"
        />
        <SelectField
          label="Alignment"
          value={config.alignment || "center"}
          onChange={(v) => onUpdate({ alignment: v })}
          options={[
            { value: "center", label: "Center" },
            { value: "left", label: "Left" },
          ]}
          testid="stat-alignment"
        />
        <SliderField
          label="Number size"
          value={config.numberSize || 72}
          min={36}
          max={120}
          suffix="px"
          onChange={(v) => onUpdate({ numberSize: v })}
          testid="stat-number-size"
        />
        <SelectField
          label="Number weight"
          value={String(config.numberWeight || "700")}
          onChange={(v) => onUpdate({ numberWeight: v })}
          options={[
            { value: "400", label: "Regular" },
            { value: "500", label: "Medium" },
            { value: "600", label: "Semibold" },
            { value: "700", label: "Bold" },
          ]}
          testid="stat-number-weight"
        />
        <ToggleField
          label="Animate count-up on scroll"
          description="Numbers ramp from zero when the section enters view. Respects prefers-reduced-motion."
          checked={!!config.animate}
          onChange={(v) => onUpdate({ animate: v })}
          testid="stat-animate"
        />
        {config.animate && (
          <SliderField
            label="Animation duration"
            value={config.animateDuration || 1200}
            min={400}
            max={3000}
            step={100}
            suffix="ms"
            onChange={(v) => onUpdate({ animateDuration: v })}
            testid="stat-animate-duration"
          />
        )}
        <ToggleField
          label="Show dividers between numbers"
          checked={!!config.showDividers}
          onChange={(v) => onUpdate({ showDividers: v })}
          testid="stat-dividers"
        />
        <ToggleField
          label="Make wide"
          description="Stretch the background to full viewport width"
          checked={!!config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="stat-full-bleed"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={80}
          min={20}
          max={160}
          testidPrefix="stat"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="stat-bg"
        />
        <ColorField
          label="Heading & intro colour"
          value={config.textColor}
          onChange={(v) => onUpdate({ textColor: v })}
          testid="stat-text"
        />
        <ColorField
          label="Number colour"
          value={config.numberColor}
          onChange={(v) => onUpdate({ numberColor: v })}
          testid="stat-number-color"
        />
        <ColorField
          label="Number label colour"
          value={config.labelColor}
          onChange={(v) => onUpdate({ labelColor: v })}
          testid="stat-label-color"
        />
        <ColorField
          label="Body / description colour"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="stat-body-color"
        />
        <ColorField
          label="Accent (eyebrow + CTA + per-stat default)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="stat-accent"
        />
        {config.showDividers && (
          <ColorField
            label="Divider colour"
            value={config.borderColor}
            onChange={(v) => onUpdate({ borderColor: v })}
            testid="stat-border-color"
          />
        )}
      </Group>
    </FormAccordion>
  );
}

export const statCounter = {
  id: ID,
  name: "Stat Counter",
  description: "Row of big numbers with labels — optional count-up on scroll",
  icon: Hash,
  defaults,
  render,
  FormPanel,
};
