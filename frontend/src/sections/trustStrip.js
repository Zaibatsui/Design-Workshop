/**
 * Trust Strip — a compact full-width row of N icon + title + 1-line
 * items, designed to sit between heavier sections as a credibility /
 * social-proof reinforcement bar.
 *
 * Deliberately flat: no card shadows, no rounded panels, just
 * iconography + tight copy on a clean background. The visual
 * counterweight to Feature Grid (which is a "cards" section).
 */
import { ShieldCheck } from "lucide-react";
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
  wrapSnippet,
} from "./shared";
import { ICON_OPTIONS, svgIcon } from "./iconLib";
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

const ID = "trust-strip";

const SAMPLE = [
  { icon: "shield", title: "Established & reliable", body: "Over 20 years of supporting businesses across the UK." },
  { icon: "users", title: "Thousands of happy customers", body: "Proud to build long-term partnerships with businesses of all sizes." },
  { icon: "star", title: "Highly rated service", body: "Consistent 5-star feedback for our service and support." },
  { icon: "lock", title: "Secure & compliant", body: "Safe, secure ordering with industry-leading standards." },
];

const defaults = () => ({
  uid: makeUid(),
  items: SAMPLE.map((s) => ({ id: makeUid(), ...s })),
  // Layout
  columns: 4, // 2 | 3 | 4 | 5
  iconSize: 28,
  iconStyle: "tinted", // "tinted" (circle bg) | "flat" (no bg)
  alignment: "left", // "left" | "center"
  showDividers: false,
  fullBleed: false,
  // Outer spacing (replaces the legacy single Vertical padding)
  paddingTop: 30,
  paddingBottom: 30,
  paddingY: 30, // legacy fallback for migrations
  // Theme
  bgColor: "#ffffff",
  textColor: "#0f172a",
  bodyColor: "#475569",
  accentColor: "#E01839",
  borderColor: "#e2e8f0", // used when showDividers is on
});

function render(cfg = {}) {
  const c = { ...defaults(), ...cfg };
  const uid = c.uid || makeUid();
  const cls = `ns-trust-${uid}`;
  const cols = Math.max(2, Math.min(5, num(c.columns, 4)));
  const align = c.alignment === "center" ? "center" : "left";
  const accent = safeColor(c.accentColor, "#E01839");
  const padTop = padTopOf(c, 30);
  const padBot = padBotOf(c, 30);

  const styleVars = [
    `--ns-bg:${safeColor(c.bgColor, "#ffffff")}`,
    `--ns-text:${safeColor(c.textColor, "#0f172a")}`,
    `--ns-body:${safeColor(c.bodyColor, "#475569")}`,
    `--ns-accent:${accent}`,
    `--ns-border:${safeColor(c.borderColor, "#e2e8f0")}`,
    `--ns-cols:${cols}`,
    `--ns-icon-size:${num(c.iconSize, 28)}px`,
  ].join(";");

  const itemsHtml = (c.items || [])
    .filter((it) => it && (it.title || it.body))
    .map((it) => {
      const iconWrapClass =
        c.iconStyle === "flat" ? "ns-ico ns-ico-flat" : "ns-ico ns-ico-tinted";
      return `
    <li class="ns-item">
      <span class="${iconWrapClass}" aria-hidden="true">${svgIcon(it.icon || "check", num(c.iconSize, 28))}</span>
      <div class="ns-item-text">
        ${it.title ? `<h3 class="ns-item-title">${escHtml(it.title)}</h3>` : ""}
        ${it.body ? `<p class="ns-item-body">${escHtml(it.body)}</p>` : ""}
      </div>
    </li>`;
    })
    .join("");

  // Dividers between items — vertical hairline on desktop. Disabled on
  // mobile because the layout collapses to a single column there.
  const dividerCss = c.showDividers
    ? `.${cls} .ns-list > li + li{border-left:1px solid var(--ns-border);padding-left:24px}@media (max-width:767px){.${cls} .ns-list > li + li{border-left:none;border-top:1px solid var(--ns-border);padding-left:0;padding-top:18px}}`
    : "";

  const css = `
${baseReset(cls)}
.${cls}{padding:${padTop}px 20px ${padBot}px;width:100%;background:var(--ns-bg);color:var(--ns-text)}
.${cls} .ns-wrap{max-width:1200px;margin:0 auto;text-align:${align}}
.${cls} .ns-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(var(--ns-cols), minmax(0, 1fr));gap:24px;align-items:start}
.${cls} .ns-item{display:flex;flex-direction:${align === "center" ? "column" : "row"};gap:14px;align-items:${align === "center" ? "center" : "flex-start"};text-align:${align}}
.${cls} .ns-ico{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;color:var(--ns-accent)}
.${cls} .ns-ico-tinted{width:calc(var(--ns-icon-size) + 18px);height:calc(var(--ns-icon-size) + 18px);border-radius:50%;background:color-mix(in srgb, var(--ns-accent) 12%, transparent)}
.${cls} .ns-ico-flat{width:var(--ns-icon-size);height:var(--ns-icon-size)}
.${cls} .ns-ico svg{width:var(--ns-icon-size);height:var(--ns-icon-size)}
.${cls} .ns-item-text{min-width:0}
.${cls} .ns-item-title{margin:0 0 4px;font-size:15px;font-weight:600;color:var(--ns-text);line-height:1.3;letter-spacing:-0.005em}
.${cls} .ns-item-body{margin:0;font-size:13.5px;line-height:1.55;color:var(--ns-body)}
${dividerCss}
@media (max-width:980px){.${cls} .ns-list{grid-template-columns:repeat(2, minmax(0, 1fr))}}
@media (max-width:600px){.${cls} .ns-list{grid-template-columns:1fr;gap:18px}}
`.trim();

  const html = `<section class="ns-trust-strip ${cls}${fullBleedClass(c)}" style="${styleVars}">
  <div class="ns-wrap">
    <ul class="ns-list">${itemsHtml}</ul>
  </div>
</section>`;

  const js = iife(cls, `/* static */`);
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
          icon: "check-circle",
          title: "New trust point",
          body: "Short supporting line.",
        },
      ],
    });
  const remove = (id) => onUpdate({ items: items.filter((it) => it.id !== id) });
  const reorder = (next) => onUpdate({ items: next });

  return (
    <FormAccordion sectionType="trust-strip">
      <Group title={`Items (${items.length})`} value="items">
        <ListEditor
          items={items}
          onAdd={add}
          onRemove={remove}
          onReorder={reorder}
          itemLabel={(it) => it.title || "Untitled item"}
          addLabel="Add item"
          testid="trust-items"
          renderRow={(it) => (
            <div className="text-xs font-medium text-slate-700 truncate">
              {it.title || "Untitled item"}
            </div>
          )}
          renderForm={(it) => (
            <>
              <SelectField
                label="Icon"
                value={it.icon || "check"}
                onChange={(v) => update(it.id, { icon: v })}
                options={ICON_OPTIONS}
                testid={`trust-item-icon-${it.id}`}
              />
              <TextField
                label="Title"
                value={it.title || ""}
                onChange={(v) => update(it.id, { title: v })}
                testid={`trust-item-title-${it.id}`}
              />
              <TextAreaField
                label="Body"
                value={it.body || ""}
                rows={2}
                onChange={(v) => update(it.id, { body: v })}
                testid={`trust-item-body-${it.id}`}
              />
            </>
          )}
        />
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
          testid="trust-columns"
        />
        <SelectField
          label="Item alignment"
          value={config.alignment || "left"}
          onChange={(v) => onUpdate({ alignment: v })}
          options={[
            { value: "left", label: "Left (icon beside text)" },
            { value: "center", label: "Center (icon above text)" },
          ]}
          testid="trust-alignment"
        />
        <SelectField
          label="Icon style"
          value={config.iconStyle || "tinted"}
          onChange={(v) => onUpdate({ iconStyle: v })}
          options={[
            { value: "tinted", label: "Tinted circle" },
            { value: "flat", label: "Flat (no background)" },
          ]}
          testid="trust-icon-style"
        />
        <SliderField
          label="Icon size"
          value={config.iconSize}
          min={18}
          max={48}
          suffix="px"
          onChange={(v) => onUpdate({ iconSize: v })}
          testid="trust-icon-size"
        />
        <ToggleField
          label="Show dividers between items"
          checked={!!config.showDividers}
          onChange={(v) => onUpdate({ showDividers: v })}
          testid="trust-dividers"
        />
        <ToggleField
          label="Make wide"
          description="Stretch the background to full viewport width"
          checked={!!config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="trust-full-bleed"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={30}
          min={0}
          max={120}
          testidPrefix="trust"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="trust-bg"
        />
        <ColorField
          label="Title colour"
          value={config.textColor}
          onChange={(v) => onUpdate({ textColor: v })}
          testid="trust-text"
        />
        <ColorField
          label="Body colour"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="trust-body"
        />
        <ColorField
          label="Accent (icon tint)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="trust-accent"
        />
        {config.showDividers && (
          <ColorField
            label="Divider colour"
            value={config.borderColor}
            onChange={(v) => onUpdate({ borderColor: v })}
            testid="trust-border-color"
          />
        )}
      </Group>
    </FormAccordion>
  );
}

export const trustStrip = {
  id: ID,
  name: "Trust Strip",
  description: "Compact row of icon + title + 1-line credibility callouts",
  icon: ShieldCheck,
  defaults,
  render,
  FormPanel,
};
