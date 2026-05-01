/**
 * Account CTA — centered heading + supporting copy + primary / secondary buttons.
 */
import { MousePointerClick } from "lucide-react";
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
  ToggleField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";

const ID = "cta";

const defaults = () => ({
  uid: makeUid(),
  heading: "Create an account to get more from Nettailer",
  body:
    "Access tailored pricing, faster checkout and exclusive offers designed for your business.",
  headingColor: "#1f2937",
  bodyColor: "#555555",
  primaryColor: "#E01839",
  primaryText: "Create Account",
  primaryLink: "#",
  primaryOpenInSameTab: false,
  secondaryText: "Login",
  secondaryLink: "#",
  secondaryOpenInSameTab: false,
  background: "#ffffff",
  paddingY: 60,
  maxWidth: 700,
  fullBleed: false,
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-cta-${uid}`;

  const styleVars = [
    `--ns-h-color:${cfg.headingColor}`,
    `--ns-b-color:${cfg.bodyColor}`,
    `--ns-accent:${cfg.primaryColor}`,
    `--ns-bg:${cfg.background}`,
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

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad) 20px;width:100%;background:var(--ns-bg);text-align:center}
.${cls} .ns-wrap{max-width:var(--ns-max);margin:0 auto}
.${cls} .ns-h{margin:0 0 14px;font-size:30px;font-weight:600;line-height:1.3;color:var(--ns-h-color)}
.${cls} .ns-p{margin:0 0 24px;font-size:16px;line-height:1.55;color:var(--ns-b-color)}
.${cls} .ns-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.${cls} .ns-btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:.01em;transition:transform .15s ease,box-shadow .15s ease,opacity .15s ease;border:1px solid transparent}
.${cls} .ns-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.12)}
.${cls} .ns-btn-primary{background:var(--ns-accent);color:#fff;border-color:var(--ns-accent)}
.${cls} .ns-btn-secondary{background:#fff;color:var(--ns-accent);border-color:var(--ns-accent)}
@media (max-width:640px){.${cls} .ns-h{font-size:24px}.${cls} .ns-p{font-size:15px}.${cls} .ns-btn{flex:1 1 140px}}
`.trim();

  const html = `<section class="ns-cta ${cls}${fullBleedClass(cfg)}" style="${styleVars}">
  <div class="ns-wrap">
    <h2 class="ns-h">${escHtml(cfg.heading)}</h2>
    ${cfg.body ? `<p class="ns-p">${escHtml(cfg.body)}</p>` : ""}
    <div class="ns-btns">
      ${btn(cfg.primaryText, cfg.primaryLink, true, cfg.primaryOpenInSameTab)}
      ${btn(cfg.secondaryText, cfg.secondaryLink, false, cfg.secondaryOpenInSameTab)}
    </div>
  </div>
</section>`;

  const js = iife(cls, `/* static cta */`);
  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  return (
    <div className="space-y-5">
      <Group title="Section">
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="cta-full-bleed"
        />
        <TextField
          label="Heading"
          value={config.heading}
          onChange={(v) => onUpdate({ heading: v })}
          testid="cta-heading"
        />
        <TextAreaField
          label="Body text"
          value={config.body}
          onChange={(v) => onUpdate({ body: v })}
          rows={3}
          testid="cta-body"
        />
        <ColorField
          label="Heading color"
          value={config.headingColor}
          onChange={(v) => onUpdate({ headingColor: v })}
          testid="cta-h-color"
        />
        <ColorField
          label="Body color"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="cta-b-color"
        />
        <ColorField
          label="Background"
          value={config.background}
          onChange={(v) => onUpdate({ background: v })}
          testid="cta-bg"
        />
        <ColorField
          label="Button accent"
          value={config.primaryColor}
          onChange={(v) => onUpdate({ primaryColor: v })}
          testid="cta-accent"
        />
        <SliderField
          label="Vertical padding"
          value={config.paddingY}
          min={30}
          max={140}
          suffix="px"
          onChange={(v) => onUpdate({ paddingY: v })}
          testid="cta-pad"
        />
        <SliderField
          label="Max width"
          value={config.maxWidth}
          min={420}
          max={1200}
          step={10}
          suffix="px"
          onChange={(v) => onUpdate({ maxWidth: v })}
          testid="cta-max"
        />
      </Group>

      <Group title="Primary button">
        <TextField
          label="Label"
          value={config.primaryText}
          onChange={(v) => onUpdate({ primaryText: v })}
          testid="cta-primary-text"
        />
        <TextField
          label="URL"
          value={config.primaryLink}
          onChange={(v) => onUpdate({ primaryLink: v })}
          testid="cta-primary-link"
        />
        <ToggleField
          label="Open in same tab"
          checked={config.primaryOpenInSameTab}
          onChange={(v) => onUpdate({ primaryOpenInSameTab: v })}
          testid="cta-primary-same-tab"
        />
      </Group>

      <Group title="Secondary button (optional)">
        <TextField
          label="Label"
          value={config.secondaryText}
          onChange={(v) => onUpdate({ secondaryText: v })}
          testid="cta-secondary-text"
        />
        <TextField
          label="URL"
          value={config.secondaryLink}
          onChange={(v) => onUpdate({ secondaryLink: v })}
          testid="cta-secondary-link"
        />
        <ToggleField
          label="Open in same tab"
          checked={config.secondaryOpenInSameTab}
          onChange={(v) => onUpdate({ secondaryOpenInSameTab: v })}
          testid="cta-secondary-same-tab"
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

export const cta = {
  id: ID,
  name: "Account CTA",
  description: "Heading + body + primary / secondary buttons",
  icon: MousePointerClick,
  defaults,
  render,
  FormPanel,
};
