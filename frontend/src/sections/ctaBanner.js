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
  // Mobile-only override: when ON, the heading / sub / buttons sit
  // centred at ≤640px regardless of the desktop alignment setting.
  mobileCenterText: false,
  // ─── Email-capture mode ─────────────────────────────────────────────
  // "buttons" (default) = original primary/secondary button stack.
  // "email-form"        = inline <input type="email"> + submit button
  //                       that posts directly to a mailing-list provider
  //                       (Mailchimp / ConvertKit / Beehiiv / Substack
  //                       all expose a public form-action URL — paste it
  //                       in and the browser handles the rest).
  mode: "buttons",
  formAction: "",
  // Field name the provider expects. Mailchimp = "EMAIL" (caps),
  // Beehiiv = "email", ConvertKit = "email_address", Buttondown = "email".
  emailFieldName: "email",
  emailPlaceholder: "Enter your email",
  // Falls back to `primaryLabel` when blank so users who toggle modes
  // back and forth don't have to retype their CTA copy.
  submitLabel: "",
  // Open the provider's confirmation page in a new tab so the host site
  // doesn't navigate away when someone submits. Default ON — matches the
  // way Mailchimp / Beehiiv embed forms work out of the box.
  submitOpenInNewTab: true,
  // Tiny line under the form — common pattern: "No credit card · Unsubscribe anytime".
  formMicroTrust: "",
  // Optional hidden inputs for providers that need extra fields
  // (e.g. Mailchimp's list/audience honeypot field). Shape: [{ name, value }].
  formHiddenFields: [],
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

  // ─── Email-form mode ──────────────────────────────────────────────
  // Replaces the button stack with a real <form> that POSTs directly
  // to the user's mailing-list provider. Requires a valid http(s)
  // formAction; falls back to omitting the form entirely so we never
  // ship a broken / hijackable submit.
  // The field name is whitelisted to [A-Za-z0-9_-] so a malformed
  // provider config can't smuggle attribute injection into the input.
  const isEmailMode = cfg.mode === "email-form";
  const formActionRaw = (cfg.formAction || "").trim();
  let formActionSafe = "";
  if (isEmailMode && formActionRaw) {
    const cleaned = safeUrl(formActionRaw);
    if (/^https?:/i.test(cleaned)) formActionSafe = cleaned;
  }
  const emailFieldName =
    String(cfg.emailFieldName || "email").replace(/[^A-Za-z0-9_-]/g, "") ||
    "email";
  const submitLabel = (cfg.submitLabel || cfg.primaryLabel || "Subscribe").trim();
  const formTarget = cfg.submitOpenInNewTab === false ? "_self" : "_blank";
  const microTrust = (cfg.formMicroTrust || "").trim();
  const hiddenInputsHtml = Array.isArray(cfg.formHiddenFields)
    ? cfg.formHiddenFields
        .filter((h) => h && h.name)
        .map(
          (h) =>
            `<input type="hidden" name="${escAttr(
              String(h.name).replace(/[^A-Za-z0-9_\-[\]]/g, "")
            )}" value="${escAttr(h.value || "")}"/>`
        )
        .join("")
    : "";
  const emailFormHtml =
    isEmailMode && formActionSafe
      ? `<form class="ns-form" action="${escAttr(formActionSafe)}" method="POST" target="${formTarget}" novalidate>
  <label class="ns-form-label" for="ns-cta-email-${escAttr(uid)}">${escHtml(
        cfg.emailPlaceholder || "Enter your email"
      )}</label>
  <div class="ns-form-row">
    <input class="ns-form-input" type="email" id="ns-cta-email-${escAttr(
      uid
    )}" name="${escAttr(emailFieldName)}" placeholder="${escAttr(
        cfg.emailPlaceholder || "Enter your email"
      )}" required autocomplete="email" />
    <button class="ns-btn ns-btn-primary ns-form-submit" type="submit">${escHtml(
      submitLabel
    )}</button>
  </div>
  ${hiddenInputsHtml}
  ${
    microTrust
      ? `<p class="ns-form-trust">${escHtml(microTrust)}</p>`
      : ""
  }
</form>`
      : isEmailMode
        ? `<p class="ns-form-error">Add a form-action URL (Mailchimp / ConvertKit / Beehiiv embed URL) to enable the email capture form.</p>`
        : "";

  // In email-form mode the button stack is replaced; in buttons mode the
  // email form is empty — same .ns-inner wrapper, one of the two slots.
  const actionsSlot = isEmailMode ? emailFormHtml : buttonsHtml;
  const flAlign = cfg.textAlign === "left" ? "left" : "center";
  const flHtml = footerLinkHtml(cfg, flAlign);

  const html = `<section class="ns-cta ${cls}${fullBleedClass(cfg)}${cfg.mobileCenterText ? " is-m-center" : ""}" data-ns-uid="${escAttr(
    uid
  )}"><div class="ns-inner">${logoHtml}${eyebrowHtml}<h2 class="ns-heading">${escHtml(
    cfg.heading || ""
  )}</h2>${subHtml}${actionsSlot}${flHtml}</div></section>`;

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
/* Email-form mode */
.${cls} .ns-form{margin-top:32px;max-width:520px;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}text-align:${align}}
.${cls} .ns-form-label{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.${cls} .ns-form-row{display:flex;gap:8px;background:${isDarkBg ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.04)"};border:1px solid ${isDarkBg ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.12)"};border-radius:${num(cfg.buttonRadius, 8)}px;padding:6px;transition:border-color .18s ease}
.${cls} .ns-form-row:focus-within{border-color:${accent}}
.${cls} .ns-form-input{flex:1;min-width:0;height:48px;padding:0 14px;border:0;background:transparent;color:${textColor};font:inherit;font-size:15px;outline:none}
.${cls} .ns-form-input::placeholder{color:${isDarkBg ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.45)"}}
.${cls} .ns-form-submit{flex:0 0 auto}
.${cls} .ns-form-trust{margin:14px 0 0;font-size:13px;color:${bodyColor};line-height:1.5}
.${cls} .ns-form-error{margin-top:32px;padding:14px 18px;background:rgba(224,24,57,0.12);border:1px dashed rgba(224,24,57,0.5);color:#fda4af;border-radius:8px;font-size:14px;line-height:1.5}
${footerLinkCss(cls, accent, bodyColor)}
@media (max-width:640px){.${cls} .ns-heading{font-size:28px}.${cls} .ns-actions{flex-direction:column}.${cls} .ns-btn{width:100%}.${cls} .ns-form-row{flex-direction:column;padding:8px}.${cls} .ns-form-submit{width:100%}.${cls}.is-m-center .ns-inner{text-align:center!important}.${cls}.is-m-center .ns-actions{justify-content:center!important}.${cls}.is-m-center .ns-form{margin-left:auto;margin-right:auto}.${cls}.is-m-center .ns-logo{margin-left:auto;margin-right:auto}}
`.trim();

  return wrapSnippet({ html, css, js: "" });
};

function FormPanel({ config, onUpdate, previewMode }) {
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

      <Group title="Action style" value="action-style">
        <SelectField
          label="What should this section ask for?"
          value={config.mode || "buttons"}
          onChange={(v) => onUpdate({ mode: v })}
          options={[
            { value: "buttons", label: "Buttons (link to a page)" },
            { value: "email-form", label: "Email capture form" },
          ]}
          testid="cta-mode"
        />
      </Group>

      {config.mode !== "email-form" && (
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
      )}

      {config.mode !== "email-form" && (
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
      )}

      {config.mode === "email-form" && (
        <Group title="Email capture form" value="email-form">
          <TextField
            label="Form action URL (where emails go)"
            placeholder="https://yourdomain.us10.list-manage.com/subscribe/post?u=…&id=…"
            value={config.formAction || ""}
            onChange={(v) => onUpdate({ formAction: v })}
            testid="cta-form-action"
          />
          <p className="text-[11px] text-slate-500 leading-snug -mt-2">
            Paste the embed form URL from your mailing-list provider —
            <strong className="font-semibold"> Mailchimp</strong>{" "}
            (Audience → Signup forms → Embedded forms → copy the form&apos;s action URL),
            <strong className="font-semibold"> ConvertKit</strong>{" "}
            (Form → Embed → HTML → copy the action),
            <strong className="font-semibold"> Beehiiv</strong>{" "}
            (Subscribe forms → Embed → copy the action), or
            <strong className="font-semibold"> Buttondown</strong>.
            The browser POSTs the email straight to them — no backend on this side.
          </p>
          <TextField
            label="Email field name"
            value={config.emailFieldName || "email"}
            onChange={(v) => onUpdate({ emailFieldName: v })}
            placeholder="email"
            testid="cta-form-email-field"
          />
          <p className="text-[11px] text-slate-500 leading-snug -mt-2">
            Most providers use <code className="font-mono">email</code>.
            Mailchimp expects <code className="font-mono">EMAIL</code> (caps).
            ConvertKit uses <code className="font-mono">email_address</code>.
          </p>
          <TextField
            label="Email placeholder text"
            value={config.emailPlaceholder || ""}
            onChange={(v) => onUpdate({ emailPlaceholder: v })}
            placeholder="Enter your email"
            testid="cta-form-placeholder"
          />
          <TextField
            label="Submit button label"
            value={config.submitLabel || ""}
            onChange={(v) => onUpdate({ submitLabel: v })}
            placeholder="Falls back to the primary button label"
            testid="cta-form-submit-label"
          />
          <ToggleField
            label="Open provider's confirmation page in a new tab"
            description="Default ON — the host site stays put when the user submits. Turn OFF if you want users redirected straight to your thank-you page."
            checked={config.submitOpenInNewTab !== false}
            onChange={(v) => onUpdate({ submitOpenInNewTab: v })}
            testid="cta-form-new-tab"
          />
          <TextField
            label="Trust line under the form (optional)"
            value={config.formMicroTrust || ""}
            onChange={(v) => onUpdate({ formMicroTrust: v })}
            placeholder="No credit card · Unsubscribe anytime"
            testid="cta-form-trust"
          />
        </Group>
      )}

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
        {previewMode === "mobile" && (
          <ToggleField
            label="Centre text on mobile"
            description="Phones only — desktop is untouched."
            checked={!!config.mobileCenterText}
            onChange={(v) => onUpdate({ mobileCenterText: v })}
            testid="cta-mobile-center-text"
          />
        )}
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
