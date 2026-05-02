/**
 * CTA Banner — final-call conversion block. Centred (or left-aligned)
 * headline + subhead + 1 or 2 buttons. No JS required.
 */
import { Megaphone } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
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

const ID = "cta-banner";

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "",
  heading: "Start building today.",
  subheading:
    "Sign in with Google and have your first reusable section published in under five minutes.",
  bgColor: "#0f172a", // slate-900
  textColor: "#ffffff",
  bodyColor: "#cbd5e1",
  accentColor: "#E01839",
  paddingY: 96,
  fullBleed: false,
  textAlign: "center", // "left" | "center"
  // Buttons
  primaryLabel: "Get started",
  primaryUrl: "#",
  primaryOpenInSameTab: false,
  showSecondary: false,
  secondaryLabel: "Learn more",
  secondaryUrl: "#",
  secondaryOpenInSameTab: false,
});

const render = (cfg) => {
  const uid = cfg.uid || makeUid();
  const cls = `ns-cta-${uid}`;

  const buttonHtml = (label, url, sameTab, variant) => {
    if (!label) return "";
    const target = sameTab ? "_self" : "_blank";
    const rel = sameTab ? "" : ' rel="noopener noreferrer"';
    return `<a class="ns-btn ns-btn-${variant}" href="${escAttr(
      safeUrl(url) || "#"
    )}" target="${target}"${rel}>${escHtml(label)}</a>`;
  };

  const eyebrowHtml = cfg.eyebrow
    ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>`
    : "";
  const subHtml = cfg.subheading
    ? `<p class="ns-sub">${escHtml(cfg.subheading)}</p>`
    : "";
  const buttonsHtml = `<div class="ns-actions">${buttonHtml(
    cfg.primaryLabel,
    cfg.primaryUrl,
    cfg.primaryOpenInSameTab,
    "primary"
  )}${
    cfg.showSecondary
      ? buttonHtml(
          cfg.secondaryLabel,
          cfg.secondaryUrl,
          cfg.secondaryOpenInSameTab,
          "secondary"
        )
      : ""
  }</div>`;

  const html = `<section class="ns-cta ${cls}${fullBleedClass(cfg)}" data-ns-uid="${escAttr(
    uid
  )}"><div class="ns-inner">${eyebrowHtml}<h2 class="ns-heading">${escHtml(
    cfg.heading || ""
  )}</h2>${subHtml}${buttonsHtml}</div></section>`;

  // Detect if the background is dark to pick a contrast colour for the
  // secondary button border. Heuristic: hex luminance < 128.
  const isDarkBg = (() => {
    const m = String(cfg.bgColor || "")
      .replace("#", "")
      .padEnd(6, "0")
      .slice(0, 6);
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad,96px) 20px;background:${cfg.bgColor};color:${cfg.textColor};--ns-pad:${cfg.paddingY}px}
.${cls} .ns-inner{max-width:760px;margin:0 auto;text-align:${cfg.textAlign}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${cfg.accentColor};margin-bottom:14px}
.${cls} .ns-heading{font-size:36px;font-weight:600;letter-spacing:-0.015em;line-height:1.1;color:${cfg.textColor}}
.${cls} .ns-sub{margin-top:18px;font-size:16px;color:${cfg.bodyColor};line-height:1.65}
.${cls} .ns-actions{margin-top:32px;display:flex;flex-wrap:wrap;gap:12px;${cfg.textAlign === "center" ? "justify-content:center" : "justify-content:flex-start"}}
.${cls} .ns-btn{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 24px;font-size:15px;font-weight:500;border-radius:6px;text-decoration:none;transition:opacity .18s ease,transform .18s ease,background .18s ease,color .18s ease}
.${cls} .ns-btn:hover{transform:translateY(-1px);opacity:0.92}
.${cls} .ns-btn-primary{background:${cfg.accentColor};color:#fff}
.${cls} .ns-btn-secondary{background:transparent;color:${cfg.textColor};border:1px solid ${
    isDarkBg ? "rgba(255,255,255,0.25)" : "rgba(15,23,42,0.2)"
  }}
.${cls} .ns-btn-secondary:hover{border-color:${cfg.textColor}}
@media (max-width:640px){.${cls} .ns-heading{font-size:28px}.${cls} .ns-actions{flex-direction:column}.${cls} .ns-btn{width:100%}}
`.trim();

  return wrapSnippet({ html, css, js: "" });
};

function FormPanel({ config, onUpdate }) {
  return (
    <div className="space-y-6">
      <Group title="Copy">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="cta-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.heading}
          onChange={(v) => onUpdate({ heading: v })}
          testid="cta-heading"
        />
        <TextAreaField
          label="Subheading"
          value={config.subheading}
          onChange={(v) => onUpdate({ subheading: v })}
          testid="cta-sub"
        />
      </Group>

      <Group title="Primary button">
        <TextField
          label="Label"
          value={config.primaryLabel}
          onChange={(v) => onUpdate({ primaryLabel: v })}
          testid="cta-primary-label"
        />
        <TextField
          label="URL"
          placeholder="https://example.com"
          value={config.primaryUrl}
          onChange={(v) => onUpdate({ primaryUrl: v })}
          testid="cta-primary-url"
        />
        <ToggleField
          label="Open in same tab"
          checked={!!config.primaryOpenInSameTab}
          onChange={(v) => onUpdate({ primaryOpenInSameTab: v })}
          testid="cta-primary-same-tab"
        />
      </Group>

      <Group title="Secondary button">
        <ToggleField
          label="Show secondary button"
          checked={!!config.showSecondary}
          onChange={(v) => onUpdate({ showSecondary: v })}
          testid="cta-show-secondary"
        />
        {config.showSecondary && (
          <>
            <TextField
              label="Label"
              value={config.secondaryLabel}
              onChange={(v) => onUpdate({ secondaryLabel: v })}
              testid="cta-secondary-label"
            />
            <TextField
              label="URL"
              placeholder="https://example.com"
              value={config.secondaryUrl}
              onChange={(v) => onUpdate({ secondaryUrl: v })}
              testid="cta-secondary-url"
            />
            <ToggleField
              label="Open in same tab"
              checked={!!config.secondaryOpenInSameTab}
              onChange={(v) => onUpdate({ secondaryOpenInSameTab: v })}
              testid="cta-secondary-same-tab"
            />
          </>
        )}
      </Group>

      <Group title="Layout">
        <SelectField
          label="Alignment"
          value={config.textAlign}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "center", label: "Center" },
            { value: "left", label: "Left" },
          ]}
          testid="cta-text-align"
        />
        <SliderField
          label="Vertical padding"
          value={config.paddingY}
          min={40}
          max={160}
          suffix="px"
          onChange={(v) => onUpdate({ paddingY: v })}
          testid="cta-pad"
        />
        <ToggleField
          label="Make wide"
          description="Stretch section to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="cta-full-bleed"
        />
      </Group>

      <Group title="Theme">
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="cta-bg"
        />
        <ColorField
          label="Heading colour"
          value={config.textColor}
          onChange={(v) => onUpdate({ textColor: v })}
          testid="cta-text"
        />
        <ColorField
          label="Body colour"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="cta-body"
        />
        <ColorField
          label="Accent (button + eyebrow)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="cta-accent"
        />
      </Group>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export const ctaBanner = {
  id: ID,
  name: "CTA Banner",
  icon: Megaphone,
  description: "Final-call conversion block with 1 or 2 buttons",
  defaults,
  render,
  FormPanel,
};
