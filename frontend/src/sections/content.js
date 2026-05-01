/**
 * Content Block — heading + optional body + optional primary/secondary buttons.
 * Replaces the old content.js (heading only) and cta.js (heading + body + buttons).
 * Leaving body and buttons blank produces a pure heading block.
 */
import { AlignCenter } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  iife,
  makeUid,
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

const ID = "content";

const defaults = () => ({
  uid: makeUid(),
  heading:
    "From everyday essentials to tailored eCommerce technology, Nettailer helps your business find, manage and scale the right IT.",
  body: "",
  headingColor: "#E01839",
  bodyColor: "#555555",
  fontSize: 28,
  fontWeight: "600",
  textAlign: "center",
  background: "#ffffff",
  paddingY: 60,
  maxWidth: 820,
  primaryColor: "#E01839",
  primaryText: "",
  primaryLink: "#",
  primaryOpenInSameTab: false,
  secondaryText: "",
  secondaryLink: "#",
  secondaryOpenInSameTab: false,
  fullBleed: false,
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-content-${uid}`;

  const styleVars = [
    `--ns-h-color:${cfg.headingColor}`,
    `--ns-b-color:${cfg.bodyColor}`,
    `--ns-accent:${cfg.primaryColor}`,
    `--ns-bg:${cfg.background}`,
    `--ns-size:${cfg.fontSize}px`,
    `--ns-weight:${cfg.fontWeight}`,
    `--ns-align:${cfg.textAlign}`,
    `--ns-pad:${cfg.paddingY}px`,
    `--ns-max:${cfg.maxWidth}px`,
  ].join(";");

  const btn = (label, href, isPrimary, sameTab) => {
    if (!label) return "";
    const target = sameTab ? "_self" : "_blank";
    const rel = sameTab ? "" : ' rel="noopener noreferrer"';
    const klass = isPrimary ? "ns-btn ns-btn-primary" : "ns-btn ns-btn-secondary";
    return `<a class="${klass}" href="${escAttr(safeUrl(href || "#"))}" target="${target}"${rel}>${escHtml(label)}</a>`;
  };

  const hasButtons = (cfg.primaryText || cfg.secondaryText || "").trim();
  const btnsHtml = hasButtons
    ? `<div class="ns-btns">
        ${btn(cfg.primaryText, cfg.primaryLink, true, cfg.primaryOpenInSameTab)}
        ${btn(cfg.secondaryText, cfg.secondaryLink, false, cfg.secondaryOpenInSameTab)}
      </div>`
    : "";
  const bodyHtml = (cfg.body || "").trim()
    ? `<p class="ns-p">${escHtml(cfg.body)}</p>`
    : "";

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad) 20px;width:100%;background:var(--ns-bg)}
.${cls} .ns-inner{max-width:var(--ns-max);margin:0 auto;text-align:var(--ns-align)}
.${cls} .ns-h{margin:0 0 14px;font-size:var(--ns-size);font-weight:var(--ns-weight);line-height:1.3;color:var(--ns-h-color)}
.${cls} .ns-p{margin:0 0 24px;font-size:16px;line-height:1.55;color:var(--ns-b-color)}
.${cls} .ns-btns{display:flex;gap:12px;flex-wrap:wrap;justify-content:var(--ns-btn-justify,center)}
.${cls}[style*="--ns-align:left"] .ns-btns,.${cls} .ns-inner[style*="text-align:left"] .ns-btns{justify-content:flex-start}
.${cls} .ns-btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:.01em;transition:transform .15s ease,box-shadow .15s ease,opacity .15s ease;border:1px solid transparent}
.${cls} .ns-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.12)}
.${cls} .ns-btn-primary{background:var(--ns-accent);color:#fff;border-color:var(--ns-accent)}
.${cls} .ns-btn-secondary{background:#fff;color:var(--ns-accent);border-color:var(--ns-accent)}
@media (max-width:640px){.${cls} .ns-h{font-size:calc(var(--ns-size) * .82)}.${cls} .ns-p{font-size:15px}.${cls} .ns-btn{flex:1 1 140px}}
`.trim();

  const html = `<section class="ns-content ${cls}${fullBleedClass(cfg)}" style="${styleVars}">
  <div class="ns-inner">
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
    <div className="space-y-5">
      <Group title="Content">
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="content-full-bleed"
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
          rows={3}
          testid="content-body"
        />
      </Group>

      <Group title="Typography">
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
          label="Background"
          value={config.background}
          onChange={(v) => onUpdate({ background: v })}
          testid="content-bg"
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
        <SliderField
          label="Vertical padding"
          value={config.paddingY}
          min={10}
          max={140}
          suffix="px"
          onChange={(v) => onUpdate({ paddingY: v })}
          testid="content-pad"
        />
        <SliderField
          label="Max width"
          value={config.maxWidth}
          min={420}
          max={1400}
          step={10}
          suffix="px"
          onChange={(v) => onUpdate({ maxWidth: v })}
          testid="content-max"
        />
      </Group>

      <Group title="Primary button (optional)">
        <TextField
          label="Label"
          value={config.primaryText}
          onChange={(v) => onUpdate({ primaryText: v })}
          testid="content-primary-text"
        />
        <TextField
          label="URL"
          value={config.primaryLink}
          onChange={(v) => onUpdate({ primaryLink: v })}
          testid="content-primary-link"
        />
        <ColorField
          label="Button accent"
          value={config.primaryColor}
          onChange={(v) => onUpdate({ primaryColor: v })}
          testid="content-accent"
        />
        <ToggleField
          label="Open in same tab"
          checked={config.primaryOpenInSameTab}
          onChange={(v) => onUpdate({ primaryOpenInSameTab: v })}
          testid="content-primary-same-tab"
        />
      </Group>

      <Group title="Secondary button (optional)">
        <TextField
          label="Label"
          value={config.secondaryText}
          onChange={(v) => onUpdate({ secondaryText: v })}
          testid="content-secondary-text"
        />
        <TextField
          label="URL"
          value={config.secondaryLink}
          onChange={(v) => onUpdate({ secondaryLink: v })}
          testid="content-secondary-link"
        />
        <ToggleField
          label="Open in same tab"
          checked={config.secondaryOpenInSameTab}
          onChange={(v) => onUpdate({ secondaryOpenInSameTab: v })}
          testid="content-secondary-same-tab"
        />
      </Group>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
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
