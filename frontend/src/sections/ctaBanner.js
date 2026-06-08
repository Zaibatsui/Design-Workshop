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
  // "buttons" (default)  = original primary/secondary button stack.
  // "email-capture"      = inline <input type="email"> + a single
  //                        capture button. On click, a `mailto:` is
  //                        opened pointing at the store owner's
  //                        address with the visitor's email pre-filled
  //                        into the body, so the owner just clicks
  //                        Send in their mail client and has the
  //                        visitor's address in their inbox — ready
  //                        to drop into Mailchimp / Klaviyo / whatever
  //                        list tool they already use. Zero third-
  //                        party signup required from the author.
  mode: "buttons",
  // Where captured emails land. Required for email-capture mode;
  // when blank the snippet renders a clear configuration hint instead
  // of a broken capture.
  destinationEmail: "",
  // Subject + body templates the visitor's mail client will pre-fill.
  // `{email}` placeholder is substituted with the typed address at
  // click time, client-side.
  emailSubject: "New newsletter signup",
  emailBodyTemplate:
    "A visitor wants to subscribe to your list.\n\nEmail: {email}\n\nSent from your website.",
  // Placeholder + button text. Button text falls back to "Subscribe"
  // when blank so authors flipping modes don't have to retype it.
  emailPlaceholder: "Enter your email",
  emailButtonText: "",
  // Small confirmation shown inline after the visitor clicks (their
  // mail client opens in the background; they may need to switch to
  // it to finish sending). Tiny line under the row.
  emailSuccessText: "Thanks! Check your email client to confirm.",
  formMicroTrust: "",
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

  // ─── Email-capture mode ───────────────────────────────────────────
  // Single input + single button. On click the snippet builds a
  // `mailto:` URL targeting the store owner with the visitor's typed
  // email substituted into a subject/body template, then navigates
  // the visitor's browser to it. Their mail client opens with the
  // address / subject / body already populated — they just need to
  // hit Send. The store owner receives a normal email in their
  // inbox containing the captured address, which they can paste into
  // whatever mailing-list tool they actually use. Zero third-party
  // integration required; zero backend dependency.
  //
  // Light security: destinationEmail is validated to look like an
  // email (basic shape only — the visitor's browser is doing the
  // final RFC compliance check at click time), and rejected if it
  // contains the characters that would let an attacker smuggle
  // additional headers into the mailto URL (newlines, `?`/`&` for
  // header injection). The visitor's typed email goes through the
  // same gate in the IIFE before substitution.
  const isEmailMode = cfg.mode === "email-capture" || cfg.mode === "email-form";
  const rawDest = (cfg.destinationEmail || "").trim();
  const destEmailSafe =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(rawDest) ? rawDest : "";
  const emailSubject = (cfg.emailSubject || "New newsletter signup").trim();
  const emailBody = (
    cfg.emailBodyTemplate ||
    "A visitor wants to subscribe to your list.\n\nEmail: {email}\n\nSent from your website."
  ).trim();
  const emailButtonText = (cfg.emailButtonText || "Subscribe").trim();
  const emailPlaceholder = (cfg.emailPlaceholder || "Enter your email").trim();
  const emailSuccessText = (
    cfg.emailSuccessText || "Thanks! Check your email client to confirm."
  ).trim();
  const microTrust = (cfg.formMicroTrust || "").trim();

  const emailFormHtml =
    isEmailMode && destEmailSafe
      ? `<div class="ns-capture" data-ns-dest="${escAttr(destEmailSafe)}" data-ns-subject="${escAttr(
          emailSubject
        )}" data-ns-body="${escAttr(emailBody)}" data-ns-success="${escAttr(
          emailSuccessText
        )}">
  <div class="ns-capture-row">
    <input class="ns-capture-input" type="email" inputmode="email" autocomplete="email" placeholder="${escAttr(
      emailPlaceholder
    )}" aria-label="${escAttr(emailPlaceholder)}" />
    <button class="ns-btn ns-btn-primary ns-capture-btn" type="button">${escHtml(
      emailButtonText
    )}</button>
  </div>
  <p class="ns-capture-msg" data-ns-msg role="status" aria-live="polite"></p>
  ${microTrust ? `<p class="ns-form-trust">${escHtml(microTrust)}</p>` : ""}
</div>`
      : isEmailMode
        ? `<p class="ns-form-error">Add a destination email address (where captured signups should land) to enable the email-capture form.</p>`
        : "";

  // In email-capture mode the button stack is replaced; in buttons mode the
  // capture form is empty — same .ns-inner wrapper, one of the two slots.
  const actionsSlot = isEmailMode ? emailFormHtml : buttonsHtml;
  const flAlign = cfg.textAlign === "left" ? "left" : "center";
  const flHtml = footerLinkHtml(cfg, flAlign);

  const html = `<section class="ns-cta ${cls}${fullBleedClass(cfg)}${cfg.mobileCenterText ? " is-m-center" : ""}" data-ns-uid="${escAttr(
    uid
  )}" data-ns-group="defaults"><div class="ns-inner"><div data-ns-group="brand-logo-optional">${logoHtml}</div><div data-ns-group="copy">${eyebrowHtml}<h2 class="ns-heading">${escHtml(
    cfg.heading || ""
  )}</h2>${subHtml}</div>${actionsSlot}${flHtml}</div></section>`;

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
  const padX = padXOf(cfg);
  const logoMaxW = num(cfg.logoMaxWidth, 150);

  const css = `
${baseReset(cls)}
.${cls}{padding:${padTop}px ${padX}px ${padBot}px;background:${bg};color:${textColor};border-radius:${num(cfg.borderRadius, 0)}px;overflow:hidden}
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
.${cls} .ns-capture{margin-top:32px;max-width:520px;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}text-align:${align}}
.${cls} .ns-capture-row{display:flex;gap:8px;background:${isDarkBg ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.04)"};border:1px solid ${isDarkBg ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.12)"};border-radius:${num(cfg.buttonRadius, 8)}px;padding:6px;transition:border-color .18s ease}
.${cls} .ns-capture-row:focus-within{border-color:${accent}}
.${cls} .ns-capture-input{flex:1;min-width:0;height:48px;padding:0 14px;border:0;background:transparent;color:${textColor};font:inherit;font-size:15px;outline:none}
.${cls} .ns-capture-input::placeholder{color:${isDarkBg ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.45)"}}
.${cls} .ns-capture-btn{flex:0 0 auto}
.${cls} .ns-capture-msg{margin:10px 0 0;font-size:13px;line-height:1.5;color:${bodyColor};min-height:0}
.${cls} .ns-capture-msg.is-error{color:${accent}}
.${cls} .ns-form-trust{margin:14px 0 0;font-size:13px;color:${bodyColor};line-height:1.5}
.${cls} .ns-form-error{margin-top:32px;padding:14px 18px;background:rgba(224,24,57,0.12);border:1px dashed rgba(224,24,57,0.5);color:#fda4af;border-radius:8px;font-size:14px;line-height:1.5}
${footerLinkCss(cls, accent, bodyColor)}
@media (max-width:640px){.${cls} .ns-heading{font-size:28px}.${cls} .ns-actions{flex-direction:column}.${cls} .ns-btn{width:100%}.${cls} .ns-capture-row{flex-direction:column;padding:8px}.${cls} .ns-capture-btn{width:100%}.${cls}.is-m-center .ns-inner{text-align:center!important}.${cls}.is-m-center .ns-actions{justify-content:center!important}.${cls}.is-m-center .ns-capture{margin-left:auto;margin-right:auto}.${cls}.is-m-center .ns-logo{margin-left:auto;margin-right:auto}}
`.trim();

  // ─── Email-capture click handler ────────────────────────────────
  // Reads the destination email + subject/body templates from data-*
  // attributes on the .ns-capture wrapper, validates the visitor's
  // input client-side, then navigates the browser to a `mailto:` URL.
  // The visitor's mail client opens with everything pre-filled — they
  // just need to hit Send. No third-party form provider, no backend
  // dependency. Only rendered when email-capture mode is active AND
  // the destination email is set, so the JS is dead weight in the
  // common button-stack case.
  const js =
    isEmailMode && destEmailSafe
      ? `(function(){
  var root=document.querySelector(".${cls} .ns-capture");
  if(!root||root.__nsBound)return;
  root.__nsBound=true;
  var dest=root.getAttribute("data-ns-dest");
  var subject=root.getAttribute("data-ns-subject")||"";
  var bodyTpl=root.getAttribute("data-ns-body")||"{email}";
  var successText=root.getAttribute("data-ns-success")||"";
  var input=root.querySelector(".ns-capture-input");
  var btn=root.querySelector(".ns-capture-btn");
  var msg=root.querySelector("[data-ns-msg]");
  if(!input||!btn)return;
  var EMAIL_RE=/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$/;
  function show(text,err){if(!msg)return;msg.textContent=text||"";msg.className="ns-capture-msg"+(err?" is-error":"");}
  function clean(s){return String(s||"").replace(/[\\r\\n]+/g," ").trim();}
  function submit(){
    var email=clean(input.value);
    if(!EMAIL_RE.test(email)){show("Please enter a valid email address.",true);input.focus();return;}
    var body=bodyTpl.replace(/\\{email\\}/g,email);
    var href="mailto:"+encodeURIComponent(dest)+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
    try{window.location.href=href;}catch(e){}
    show(successText,false);
    input.value="";
  }
  btn.addEventListener("click",submit);
  input.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();submit();}});
})();`
      : "";

  return wrapSnippet({ html, css, js });
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
            { value: "email-form", label: "Email capture (sent to your inbox)" },
          ]}
          testid="cta-mode"
        />
        {config.mode === "email-form" && (
          <p className="text-[11px] text-slate-500 leading-snug">
            Visitors type their email and hit submit. Their mail client opens
            with a pre-filled message to you — they just press Send and the
            address lands in your inbox, ready to drop into Mailchimp / Klaviyo
            / whatever list tool you already use. No third-party signup, no
            backend.
          </p>
        )}
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
        <Group title="Email capture" value="email-form">
          <TextField
            label="Send captured emails to"
            placeholder="you@yourstore.com"
            value={config.destinationEmail || ""}
            onChange={(v) => onUpdate({ destinationEmail: v })}
            testid="cta-form-destination"
          />
          <p className="text-[11px] text-slate-500 leading-snug -mt-2">
            Where the visitor&apos;s email lands. When they hit submit, their
            mail client opens a new message addressed to you with their email
            inside — they just press Send. Required for the form to work.
          </p>
          <TextField
            label="Submit button label"
            value={config.emailButtonText || ""}
            onChange={(v) => onUpdate({ emailButtonText: v })}
            placeholder="Subscribe"
            testid="cta-form-button-text"
          />
          <TextField
            label="Email placeholder text"
            value={config.emailPlaceholder || ""}
            onChange={(v) => onUpdate({ emailPlaceholder: v })}
            placeholder="Enter your email"
            testid="cta-form-placeholder"
          />
          <TextField
            label="Email subject (sent to you)"
            value={config.emailSubject || ""}
            onChange={(v) => onUpdate({ emailSubject: v })}
            placeholder="New newsletter signup"
            testid="cta-form-subject"
          />
          <TextAreaField
            label="Email body template"
            value={config.emailBodyTemplate || ""}
            onChange={(v) => onUpdate({ emailBodyTemplate: v })}
            placeholder="A visitor wants to subscribe to your list.&#10;&#10;Email: {email}&#10;&#10;Sent from your website."
            testid="cta-form-body"
          />
          <p className="text-[11px] text-slate-500 leading-snug -mt-2">
            Use <code className="font-mono">{"{email}"}</code> as a placeholder
            for the visitor&apos;s typed address — it&apos;s substituted in
            automatically.
          </p>
          <TextField
            label="Confirmation message"
            value={config.emailSuccessText || ""}
            onChange={(v) => onUpdate({ emailSuccessText: v })}
            placeholder="Thanks! Check your email client to confirm."
            testid="cta-form-success"
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
