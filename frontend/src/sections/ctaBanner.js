/**
 * CTA Banner — final-call conversion block. Centred (or left-aligned)
 * headline + subhead + 1 or 2 buttons. No JS required.
 */
import { Megaphone } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  footerLinkCss,
  footerLinkHtml,
  fullBleedClass,
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
import ImageUpload from "@/components/ImageUpload";
import FooterLinkEditor from "@/components/FooterLinkEditor";
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";
const ID = "cta-banner";

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "",
  heading: "Start building today.",
  subheading:
    "Sign in with Google and have your first reusable section published in under five minutes.",
  // Logo (optional) — renders above the heading. Useful for brand-banner blocks
  // like "Committed to the environment" where no CTA is required.
  logoUrl: "",
  logoAlt: "",
  logoMaxWidth: 150,
  // Background — "solid" preserves prior behaviour, "gradient" unlocks
  // brand-banner gradients (e.g. Philips blue 135deg #0267d7 → #0b3e80).
  backgroundType: "solid", // "solid" | "gradient"
  bgColor: "#0f172a", // slate-900 (solid mode)
  gradientFrom: "#0267d7",
  gradientTo: "#0b3e80",
  gradientAngle: 135,
  textColor: "#ffffff",
  bodyColor: "#cbd5e1",
  accentColor: "#E01839",
  paddingY: 96,
  paddingTop: 96,
  paddingBottom: 96,
  fullBleed: false,
  borderRadius: 0,
  textAlign: "center", // "left" | "center"
  // Buttons — both are optional now; empty label = button is dropped.
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
  // Optional brand logo above the heading.
  const logoUrl = safeUrl(cfg.logoUrl);
  const logoHtml = logoUrl
    ? `<img class="ns-logo" src="${escAttr(logoUrl)}" alt="${escAttr(
        cfg.logoAlt || ""
      )}"${cfg.logoAlt ? "" : ' aria-hidden="true"'}/>`
    : "";
  // Buttons are individually optional — empty label = no button rendered.
  // If neither primary nor (enabled) secondary has a label, the entire
  // .ns-actions wrapper is dropped so the spacing collapses cleanly.
  const primaryBtn = buttonHtml(
    cfg.primaryLabel,
    cfg.primaryUrl,
    cfg.primaryOpenInSameTab,
    "primary"
  );
  const secondaryBtn = cfg.showSecondary
    ? buttonHtml(
        cfg.secondaryLabel,
        cfg.secondaryUrl,
        cfg.secondaryOpenInSameTab,
        "secondary"
      )
    : "";
  const buttonsHtml =
    primaryBtn || secondaryBtn
      ? `<div class="ns-actions">${primaryBtn}${secondaryBtn}</div>`
      : "";
  const flAlign = cfg.textAlign === "left" ? "left" : "center";
  const flHtml = footerLinkHtml(cfg, flAlign);

  const html = `<section class="ns-cta ${cls}${fullBleedClass(cfg)}" data-ns-uid="${escAttr(
    uid
  )}"><div class="ns-inner">${logoHtml}${eyebrowHtml}<h2 class="ns-heading">${escHtml(
    cfg.heading || ""
  )}</h2>${subHtml}${buttonsHtml}${flHtml}</div></section>`;

  // Detect if the background is dark to pick a contrast colour for the
  // secondary button border. Heuristic: hex luminance < 128. When in
  // gradient mode we sample the "from" stop since that's the dominant
  // visual at top-left where the secondary button typically sits.
  const luminanceSourceColor =
    cfg.backgroundType === "gradient" ? cfg.gradientFrom : cfg.bgColor;
  const isDarkBg = (() => {
    const m = String(luminanceSourceColor || "")
      .replace("#", "")
      .padEnd(6, "0")
      .slice(0, 6);
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();

  const bg =
    cfg.backgroundType === "gradient"
      ? `linear-gradient(${num(cfg.gradientAngle, 135)}deg, ${safeColor(
          cfg.gradientFrom,
          "#0267d7"
        )} 0%, ${safeColor(cfg.gradientTo, "#0b3e80")} 100%)`
      : safeColor(cfg.bgColor, "#0f172a");
  const textColor = safeColor(cfg.textColor, "#ffffff");
  const accent = safeColor(cfg.accentColor, "#E01839");
  const bodyColor = safeColor(cfg.bodyColor, "rgba(255,255,255,0.7)");
  const align = cfg.textAlign === "left" ? "left" : "center";
  const padTop = padTopOf(cfg, 96);
  const padBot = padBotOf(cfg, 96);
  const logoMaxW = num(cfg.logoMaxWidth, 150);

  const css = `
${baseReset(cls)}
.${cls}{padding:${padTop}px 20px ${padBot}px;background:${bg};color:${textColor};border-radius:${num(cfg.borderRadius, 0)}px;overflow:hidden}
.${cls} .ns-inner{max-width:760px;margin:0 auto;text-align:${align}}
.${cls} .ns-logo{display:block;max-width:${logoMaxW}px;max-height:64px;width:auto;height:auto;margin:0 0 20px;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}object-fit:contain}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${accent};margin-bottom:14px}
.${cls} .ns-heading{font-size:${num(cfg.headingSize, 36)}px;font-weight:600;letter-spacing:-0.015em;line-height:1.1;color:${textColor}}
.${cls} .ns-sub{margin-top:18px;font-size:16px;color:${bodyColor};line-height:1.65}
.${cls} .ns-actions{margin-top:32px;display:flex;flex-wrap:wrap;gap:12px;${align === "center" ? "justify-content:center" : "justify-content:flex-start"}}
.${cls} .ns-btn{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 24px;font-size:15px;font-weight:500;border-radius:${num(cfg.buttonRadius, 8)}px;text-decoration:none;transition:opacity .18s ease,transform .18s ease,background .18s ease,color .18s ease}
.${cls} .ns-btn:hover{transform:translateY(-1px);opacity:0.92}
.${cls} .ns-btn-primary{background:${accent};color:#fff}
.${cls} .ns-btn-secondary{background:transparent;color:${textColor};border:1px solid ${
    isDarkBg ? "rgba(255,255,255,0.25)" : "rgba(15,23,42,0.2)"
  }}
.${cls} .ns-btn-secondary:hover{border-color:${textColor}}
${footerLinkCss(cls, accent, bodyColor)}
@media (max-width:640px){.${cls} .ns-heading{font-size:28px}.${cls} .ns-actions{flex-direction:column}.${cls} .ns-btn{width:100%}}
`.trim();

  return wrapSnippet({ html, css, js: "" });
};

function FormPanel({ config, onUpdate }) {
  return (
    <FormAccordion sectionType="cta-banner">
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

      <Group title="Brand logo (optional)">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Logo image
          </Label>
          <ImageUpload
            value={config.logoUrl || ""}
            onChange={(v) => onUpdate({ logoUrl: v })}
            testid="cta-logo"
            compact
          />
        </div>
        {config.logoUrl ? (
          <>
            <TextField
              label="Logo alt text (optional)"
              value={config.logoAlt || ""}
              onChange={(v) => onUpdate({ logoAlt: v })}
              placeholder="Leave blank if purely decorative"
              testid="cta-logo-alt"
            />
            <SliderField
              label="Logo max width"
              value={config.logoMaxWidth || 150}
              min={60}
              max={280}
              suffix="px"
              onChange={(v) => onUpdate({ logoMaxWidth: v })}
              testid="cta-logo-width"
            />
          </>
        ) : null}
      </Group>

      <Group title="Primary button (optional)">
        <TextField
          label="Label (leave blank to hide)"
          value={config.primaryLabel}
          onChange={(v) => onUpdate({ primaryLabel: v })}
          testid="cta-primary-label"
        />
        {config.primaryLabel ? (
          <>
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
          </>
        ) : null}
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

      <FooterLinkEditor
        value={config.footerLink}
        onChange={(v) => onUpdate({ footerLink: v })}
        testidPrefix="cta-footer-link"
      />

      <Group title="Defaults" value="defaults">
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
          label="Heading size"
          value={Number(config.headingSize) || 36}
          min={20}
          max={72}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="cta-heading-size"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={96}
          min={40}
          max={160}
          testidPrefix="cta"
        />
        <ToggleField
          label="Make wide"
          description="Stretch section to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="cta-full-bleed"
        />
        {!config.fullBleed && (
          <SliderField
            label="Border radius"
            value={Number(config.borderRadius) || 0}
            min={0}
            max={32}
            suffix="px"
            onChange={(v) => onUpdate({ borderRadius: v })}
            testid="cta-border-radius"
          />
        )}
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <SelectField
          label="Background style"
          value={config.backgroundType || "solid"}
          onChange={(v) => onUpdate({ backgroundType: v })}
          options={[
            { value: "solid", label: "Solid colour" },
            { value: "gradient", label: "Linear gradient" },
          ]}
          testid="cta-bg-type"
        />
        {config.backgroundType === "gradient" ? (
          <>
            <ColorField
              label="Gradient from"
              value={config.gradientFrom}
              onChange={(v) => onUpdate({ gradientFrom: v })}
              testid="cta-grad-from"
            />
            <ColorField
              label="Gradient to"
              value={config.gradientTo}
              onChange={(v) => onUpdate({ gradientTo: v })}
              testid="cta-grad-to"
            />
            <SliderField
              label="Gradient angle"
              value={config.gradientAngle ?? 135}
              min={0}
              max={360}
              step={5}
              suffix="°"
              onChange={(v) => onUpdate({ gradientAngle: v })}
              testid="cta-grad-angle"
            />
          </>
        ) : (
          <ColorField
            label="Background"
            value={config.bgColor}
            onChange={(v) => onUpdate({ bgColor: v })}
            testid="cta-bg"
          />
        )}
        <ColorField
          label="Heading colour"
          value={config.textColor}
          onChange={(v) => onUpdate({ textColor: v })}
          testid="cta-text"
        />
        <ColorField
          label="Subheading colour"
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
    </FormAccordion>
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
