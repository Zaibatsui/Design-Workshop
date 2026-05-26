/**
 * Content Block — heading + optional body + 0–N buttons (any number).
 * Each button is { id, label, url, variant: primary|secondary, openInSameTab }.
 * Legacy primary/secondary flat fields are auto-migrated on read.
 */
import { AlignCenter } from "lucide-react";
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
const ID = "content";

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "",
  heading:
    "From everyday essentials to tailored eCommerce technology, Nettailer helps your business find, manage and scale the right IT.",
  body: "",
  headingColor: "#E01839",
  bodyColor: "#555555",
  eyebrowColor: "#E01839",
  fontSize: 28,
  fontWeight: "600",
  textAlign: "center",
  background: "#ffffff",
  paddingY: 60,
  maxWidth: 1200,
  primaryColor: "#E01839",
  buttons: [],
  fullBleed: false,
});

// Back-compat: older sections used {primaryText,primaryLink,primaryOpenInSameTab,
// secondaryText,secondaryLink,secondaryOpenInSameTab}. We collapse those into
// the unified buttons[] at read time so legacy records still render + edit.
function normalizeButtons(cfg) {
  if (Array.isArray(cfg.buttons) && cfg.buttons.length) return cfg.buttons;
  const out = [];
  if (cfg.primaryText)
    out.push({
      id: `btn_${Math.random().toString(36).slice(2, 8)}`,
      label: cfg.primaryText,
      url: cfg.primaryLink || "#",
      variant: "primary",
      openInSameTab: !!cfg.primaryOpenInSameTab,
    });
  if (cfg.secondaryText)
    out.push({
      id: `btn_${Math.random().toString(36).slice(2, 8)}`,
      label: cfg.secondaryText,
      url: cfg.secondaryLink || "#",
      variant: "secondary",
      openInSameTab: !!cfg.secondaryOpenInSameTab,
    });
  return out;
}

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-content-${uid}`;

  const styleVars = [
    `--ns-h-color:${safeColor(cfg.headingColor, "#E01839")}`,
    `--ns-b-color:${safeColor(cfg.bodyColor, "#555555")}`,
    `--ns-eyebrow-color:${safeColor(cfg.eyebrowColor || cfg.headingColor, "#E01839")}`,
    `--ns-accent:${safeColor(cfg.primaryColor, "#E01839")}`,
    `--ns-bg:${safeColor(cfg.background, "#ffffff")}`,
    `--ns-size:${num(cfg.fontSize, 28)}px`,
    `--ns-weight:${num(cfg.fontWeight, 600)}`,
    `--ns-align:${cfg.textAlign === "right" || cfg.textAlign === "center" ? cfg.textAlign : "left"}`,
    `--ns-pad-t:${padTopOf(cfg, 60)}px;--ns-pad-b:${padBotOf(cfg, 60)}px`,
    `--ns-max:${num(cfg.maxWidth, 1200)}px`,
  ].join(";");

  const btn = (label, href, variant, sameTab) => {
    if (!label) return "";
    const target = sameTab ? "_self" : "_blank";
    const rel = sameTab ? "" : ' rel="noopener noreferrer"';
    const klass =
      variant === "secondary"
        ? "ns-btn ns-btn-secondary"
        : "ns-btn ns-btn-primary";
    return `<a class="${klass}" href="${escAttr(safeUrl(href || "#"))}" target="${target}"${rel}>${escHtml(label)}</a>`;
  };

  const buttons = normalizeButtons(cfg);
  const btnsHtml = buttons.length
    ? `<div class="ns-btns">
        ${buttons
          .map((b) => btn(b.label, b.url, b.variant, b.openInSameTab))
          .join("\n        ")}
      </div>`
    : "";
  const bodyHtml = (cfg.body || "").trim()
    ? `<p class="ns-p">${escHtml(cfg.body)}</p>`
    : "";
  const eyebrowHtml = cfg.eyebrow
    ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>`
    : "";

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad-t) 20px var(--ns-pad-b);width:100%;background:var(--ns-bg)}
.${cls} .ns-inner{max-width:var(--ns-max);margin:0 auto;text-align:var(--ns-align)}
.${cls} .ns-eyebrow{margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-eyebrow-color)}
.${cls} .ns-h{margin:0 0 14px;font-size:var(--ns-size);font-weight:var(--ns-weight);line-height:1.3;color:var(--ns-h-color)}
.${cls} .ns-p{margin:0 0 24px;font-size:16px;line-height:1.55;color:var(--ns-b-color);white-space:pre-line}
.${cls} .ns-btns{display:flex;gap:12px;flex-wrap:wrap;justify-content:var(--ns-btn-justify,center)}
.${cls}[style*="--ns-align:left"] .ns-btns,.${cls} .ns-inner[style*="text-align:left"] .ns-btns{justify-content:flex-start}
.${cls} .ns-btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 24px;border-radius:${num(cfg.buttonRadius, 8)}px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:.01em;transition:transform .15s ease,box-shadow .15s ease,opacity .15s ease;border:1px solid transparent}
.${cls} .ns-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.12)}
.${cls} .ns-btn-primary{background:var(--ns-accent);color:#fff;border-color:var(--ns-accent)}
.${cls} .ns-btn-secondary{background:#fff;color:var(--ns-accent);border-color:var(--ns-accent)}
@media (max-width:640px){.${cls} .ns-h{font-size:calc(var(--ns-size) * .82)}.${cls} .ns-p{font-size:15px}.${cls} .ns-btn{flex:1 1 140px}}
`.trim();

  const html = `<section class="ns-content ${cls}${fullBleedClass(cfg)}" style="${styleVars}">
  <div class="ns-inner">
    ${eyebrowHtml}
    <h2 class="ns-h">${escHtml(cfg.heading)}</h2>
    ${bodyHtml}
    ${btnsHtml}
  </div>
</section>`;

  const js = iife(cls, `/* static content block */`);
  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  return (
    <FormAccordion sectionType="content">
      <Group title="Header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="content-eyebrow"
        />
        <TextAreaField
          label="Heading"
          value={config.heading}
          onChange={(v) => onUpdate({ heading: v })}
          rows={3}
          testid="content-heading"
        />
        <TextAreaField
          label="Body (optional)"
          value={config.body}
          onChange={(v) => onUpdate({ body: v })}
          rows={4}
          hint="Press Enter for a line break, blank line for a paragraph gap."
          testid="content-body"
        />
      </Group>

      <Group title="Defaults" value="defaults">
        <SelectField
          label="Alignment"
          value={config.textAlign}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          testid="content-align"
        />
        <SelectField
          label="Heading weight"
          value={config.fontWeight}
          onChange={(v) => onUpdate({ fontWeight: v })}
          options={[
            { value: "400", label: "Regular" },
            { value: "500", label: "Medium" },
            { value: "600", label: "Semibold" },
            { value: "700", label: "Bold" },
          ]}
          testid="content-weight"
        />
        <SliderField
          label="Heading size"
          value={config.fontSize}
          min={16}
          max={56}
          suffix="px"
          onChange={(v) => onUpdate({ fontSize: v })}
          testid="content-size"
        />
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="content-full-bleed"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={60}
          min={10}
          max={140}
          testidPrefix="content"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <ColorField
          label="Background"
          value={config.background}
          onChange={(v) => onUpdate({ background: v })}
          testid="content-bg"
        />
        <ColorField
          label="Eyebrow color"
          value={config.eyebrowColor || config.headingColor}
          onChange={(v) => onUpdate({ eyebrowColor: v })}
          testid="content-eyebrow-color"
        />
        <ColorField
          label="Heading color"
          value={config.headingColor}
          onChange={(v) => onUpdate({ headingColor: v })}
          testid="content-h-color"
        />
        <ColorField
          label="Body color"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="content-b-color"
        />
        <ColorField
          label="Primary button accent"
          value={config.primaryColor}
          onChange={(v) => onUpdate({ primaryColor: v })}
          testid="content-accent"
        />
      </Group>

      <Group title={`Buttons (${(config.buttons || []).length})`}>
        <ButtonsList config={config} onUpdate={onUpdate} />
      </Group>
    </FormAccordion>
  );
}

function ButtonsList({ config, onUpdate }) {
  const items = normalizeButtons(config);
  const commit = (next) => onUpdate({ buttons: next });

  const addButton = () =>
    commit([
      ...items,
      {
        id: `btn_${Math.random().toString(36).slice(2, 8)}`,
        label: "New button",
        url: "#",
        variant: items.length === 0 ? "primary" : "secondary",
        openInSameTab: false,
      },
    ]);
  const removeButton = (id) => commit(items.filter((b) => b.id !== id));
  const moveButton = (id, dir) => {
    const idx = items.findIndex((b) => b.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= items.length) return;
    const arr = [...items];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    commit(arr);
  };
  const updateButton = (id, patch) =>
    commit(items.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  return (
    <ListEditor
      items={items}
      onAdd={addButton}
      onRemove={removeButton}
      onMove={moveButton}
      addLabel="Add button"
      testidPrefix="content-btn"
      renderRow={(b) => (
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              b.variant === "secondary"
                ? "bg-slate-100 text-slate-600"
                : "bg-[#E01839] text-white"
            }`}
          >
            {b.variant || "primary"}
          </span>
          <p className="text-sm font-medium text-slate-900 truncate">
            {b.label || "Untitled button"}
          </p>
        </div>
      )}
      renderForm={(b) => (
        <>
          <TextField
            label="Label"
            value={b.label}
            onChange={(v) => updateButton(b.id, { label: v })}
            testid={`content-btn-label-${b.id}`}
          />
          <TextField
            label="URL"
            value={b.url}
            onChange={(v) => updateButton(b.id, { url: v })}
            testid={`content-btn-url-${b.id}`}
          />
          <SelectField
            label="Style"
            value={b.variant || "primary"}
            onChange={(v) => updateButton(b.id, { variant: v })}
            options={[
              { value: "primary", label: "Primary (filled)" },
              { value: "secondary", label: "Secondary (outline)" },
            ]}
            testid={`content-btn-variant-${b.id}`}
          />
          <ToggleField
            label="Open in same tab"
            checked={!!b.openInSameTab}
            onChange={(v) => updateButton(b.id, { openInSameTab: v })}
            testid={`content-btn-same-tab-${b.id}`}
          />
        </>
      )}
    />
  );
}

export const content = {
  id: ID,
  name: "Content Block",
  description: "Heading + optional body + optional buttons",
  icon: AlignCenter,
  defaults,
  render,
  FormPanel,
};
