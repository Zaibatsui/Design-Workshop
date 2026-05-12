/**
 * Welcome — post-login welcome banner with positionable blocks.
 *
 * Three independent blocks (heading group / customer logo / account
 * manager card) can each be placed in one of nine grid cells, with a
 * per-block card style (transparent / glass / solid). Lets one tool
 * serve very different brand looks without changing the underlying
 * snippet contract.
 *
 * Snippet is pure HTML+CSS — no JS interactions besides native
 * `mailto:` / `tel:` links rendered as anchors.
 */
import { Sparkles, Mail, Phone, User as UserIcon } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  iife,
  makeUid,
  num,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import {
  TextField,
  TextAreaField,
  SliderField,
  ToggleField,
  SelectField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import { Label } from "@/components/ui/label";

const ID = "welcome";

const POSITION_OPTIONS = [
  { value: "tl", label: "Top left" },
  { value: "tc", label: "Top center" },
  { value: "tr", label: "Top right" },
  { value: "cl", label: "Middle left" },
  { value: "cc", label: "Middle center" },
  { value: "cr", label: "Middle right" },
  { value: "bl", label: "Bottom left" },
  { value: "bc", label: "Bottom center" },
  { value: "br", label: "Bottom right" },
];

const CARD_STYLE_OPTIONS = [
  { value: "transparent", label: "Transparent" },
  { value: "glass", label: "Glass" },
  { value: "solid", label: "Solid card" },
];

// Allow-list for position values used in classnames. Any unknown value
// falls back to a safe default — prevents user-controlled CSS class
// names from being injected into the snippet.
const safePos = (v, fallback = "tl") =>
  POSITION_OPTIONS.some((o) => o.value === v) ? v : fallback;

const safeCardStyle = (v, fallback = "transparent") =>
  CARD_STYLE_OPTIONS.some((o) => o.value === v) ? v : fallback;

const defaults = () => ({
  uid: makeUid(),

  // Header block
  eyebrow: "WELCOME ABOARD",
  heading: "Welcome, Acme Industries",
  body:
    "Your customer dashboard is ready. Explore your products, downloads and account team — we're glad to have you with us.",
  headerPos: "tl",
  headerStyle: "transparent",
  headerTextColor: "#ffffff",
  eyebrowColor: "#a5f3fc",

  // Customer logo block
  showLogo: true,
  logo: "",
  logoAlt: "Customer logo",
  logoMaxWidth: 180,
  logoPos: "tr",
  logoStyle: "glass",

  // Account manager block
  showAm: true,
  amAvatar: "",
  amAvatarAlt: "Account manager",
  amName: "Sarah Henderson",
  amRole: "Senior Account Manager",
  amEmail: "sarah@acme.com",
  amPhone: "+44 20 7946 0123",
  amPos: "br",
  amStyle: "solid",
  amAccentColor: "#0ea5e9",

  // Layout / theme
  height: 560,
  fullBleed: false,
  image:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
  overlayColor: "#0f172a",
  overlayOpacity: 0.55,
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-welcome-${uid}`;

  const headerPos = safePos(cfg.headerPos, "tl");
  const logoPos = safePos(cfg.logoPos, "tr");
  const amPos = safePos(cfg.amPos, "br");

  const headerStyle = safeCardStyle(cfg.headerStyle, "transparent");
  const logoStyle = safeCardStyle(cfg.logoStyle, "glass");
  const amStyle = safeCardStyle(cfg.amStyle, "solid");

  const styleVars = [
    `--ns-h:${num(cfg.height, 560)}px`,
    `--ns-text:${safeColor(cfg.headerTextColor, "#ffffff")}`,
    `--ns-eyebrow:${safeColor(cfg.eyebrowColor || cfg.headerTextColor, "#ffffff")}`,
    `--ns-overlay:${safeColor(cfg.overlayColor, "#0f172a")}`,
    `--ns-overlay-op:${num(cfg.overlayOpacity, 0.55)}`,
    `--ns-am-accent:${safeColor(cfg.amAccentColor, "#0ea5e9")}`,
    `--ns-logo-w:${num(cfg.logoMaxWidth, 180)}px`,
  ].join(";");

  const css = `
${baseReset(cls)}
.${cls}{position:relative;width:100%;min-height:var(--ns-h);background-size:cover;background-position:center;overflow:hidden;color:var(--ns-text)}
.${cls} .ns-overlay{position:absolute;inset:0;background:var(--ns-overlay);opacity:var(--ns-overlay-op);pointer-events:none}
.${cls} .ns-grid{position:relative;z-index:2;display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr 1fr;gap:24px;padding:40px;min-height:var(--ns-h);box-sizing:border-box}
.${cls} .ns-block{max-width:480px}
.${cls} .ns-block.is-card{padding:24px;border-radius:14px;background:rgba(255,255,255,.12);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.18);box-shadow:0 12px 32px rgba(0,0,0,.18)}
.${cls} .ns-block.is-solid{padding:24px;border-radius:14px;background:#ffffff;color:#0f172a;box-shadow:0 18px 40px rgba(0,0,0,.22)}
.${cls} .pos-tl{grid-area:1/1;align-self:start;justify-self:start;text-align:left}
.${cls} .pos-tc{grid-area:1/2;align-self:start;justify-self:center;text-align:center}
.${cls} .pos-tr{grid-area:1/3;align-self:start;justify-self:end;text-align:right}
.${cls} .pos-cl{grid-area:2/1;align-self:center;justify-self:start;text-align:left}
.${cls} .pos-cc{grid-area:2/2;align-self:center;justify-self:center;text-align:center}
.${cls} .pos-cr{grid-area:2/3;align-self:center;justify-self:end;text-align:right}
.${cls} .pos-bl{grid-area:3/1;align-self:end;justify-self:start;text-align:left}
.${cls} .pos-bc{grid-area:3/2;align-self:end;justify-self:center;text-align:center}
.${cls} .pos-br{grid-area:3/3;align-self:end;justify-self:end;text-align:right}
.${cls} .ns-eyebrow{margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--ns-eyebrow);opacity:.95}
.${cls} .ns-h{margin:0 0 12px;font-size:36px;line-height:1.2;font-weight:600;color:var(--ns-text)}
.${cls} .ns-block.is-solid .ns-h{color:#0f172a}
.${cls} .ns-body{margin:0;font-size:16px;line-height:1.55;color:var(--ns-text);opacity:.92;max-width:48ch}
.${cls} .ns-block.is-solid .ns-body{color:#475569;opacity:1}
.${cls} .ns-logo-wrap{display:inline-flex;align-items:center;justify-content:center}
.${cls} .ns-logo-img{max-width:var(--ns-logo-w);max-height:120px;width:auto;height:auto;display:block}
.${cls} .ns-am{display:flex;gap:16px;align-items:center;min-width:260px}
.${cls} .ns-am-avatar{width:64px;height:64px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#e2e8f0}
.${cls} .ns-am-avatar-fb{width:64px;height:64px;border-radius:50%;background:var(--ns-am-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:24px;flex-shrink:0}
.${cls} .ns-am-info{display:flex;flex-direction:column;gap:2px;text-align:left}
.${cls} .ns-am-name{font-size:16px;font-weight:600;color:inherit;line-height:1.3}
.${cls} .ns-am-role{font-size:13px;opacity:.7;color:inherit;line-height:1.3;margin-bottom:6px}
.${cls} .ns-am-link{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:inherit;text-decoration:none;line-height:1.6}
.${cls} .ns-am-link:hover{color:var(--ns-am-accent)}
.${cls} .ns-am-link svg{width:14px;height:14px;flex-shrink:0;color:var(--ns-am-accent)}
@media (max-width:780px){
  .${cls} .ns-grid{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;padding:24px;gap:18px}
  .${cls} .ns-block{max-width:100%;text-align:left!important;justify-self:stretch!important;align-self:stretch!important}
  .${cls} .ns-h{font-size:26px}
  .${cls} .ns-am{min-width:0}
}
`.trim();

  // ---- block markup --------------------------------------------------
  const headerCardClass = headerStyle === "glass" ? " is-card" : headerStyle === "solid" ? " is-solid" : "";
  const headerBlock = (cfg.heading || cfg.body || cfg.eyebrow)
    ? `<div class="ns-block pos-${headerPos}${headerCardClass}">
      ${cfg.eyebrow ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>` : ""}
      ${cfg.heading ? `<h1 class="ns-h">${escHtml(cfg.heading)}</h1>` : ""}
      ${cfg.body ? `<p class="ns-body">${escHtml(cfg.body)}</p>` : ""}
    </div>`
    : "";

  const logoCardClass = logoStyle === "glass" ? " is-card" : logoStyle === "solid" ? " is-solid" : "";
  const logoBlock = (cfg.showLogo && cfg.logo)
    ? `<div class="ns-block pos-${logoPos}${logoCardClass}">
      <div class="ns-logo-wrap">
        <img class="ns-logo-img" src="${escAttr(safeUrl(cfg.logo))}" alt="${escAttr(cfg.logoAlt || "Customer logo")}"/>
      </div>
    </div>`
    : "";

  const amCardClass = amStyle === "glass" ? " is-card" : amStyle === "solid" ? " is-solid" : "";
  const amInitial = String(cfg.amName || "?").trim().charAt(0).toUpperCase() || "?";
  const amAvatarMarkup = cfg.amAvatar
    ? `<img class="ns-am-avatar" src="${escAttr(safeUrl(cfg.amAvatar))}" alt="${escAttr(cfg.amAvatarAlt || cfg.amName || "Account manager")}"/>`
    : `<div class="ns-am-avatar-fb" aria-hidden="true">${escHtml(amInitial)}</div>`;
  const amEmailLink = cfg.amEmail
    ? `<a class="ns-am-link" href="mailto:${escAttr(cfg.amEmail)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/></svg>${escHtml(cfg.amEmail)}</a>`
    : "";
  const amPhoneLink = cfg.amPhone
    ? `<a class="ns-am-link" href="tel:${escAttr(String(cfg.amPhone).replace(/[^\d+]/g, ""))}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${escHtml(cfg.amPhone)}</a>`
    : "";

  const amBlock = cfg.showAm
    ? `<div class="ns-block pos-${amPos}${amCardClass}">
      <div class="ns-am">
        ${amAvatarMarkup}
        <div class="ns-am-info">
          ${cfg.amName ? `<div class="ns-am-name">${escHtml(cfg.amName)}</div>` : ""}
          ${cfg.amRole ? `<div class="ns-am-role">${escHtml(cfg.amRole)}</div>` : ""}
          ${amEmailLink}
          ${amPhoneLink}
        </div>
      </div>
    </div>`
    : "";

  const html = `<section class="ns-welcome ${cls}${fullBleedClass(cfg)}" style="${styleVars};background-image:url('${escAttr(safeUrl(cfg.image))}')">
  <div class="ns-overlay"></div>
  <div class="ns-grid">
    ${headerBlock}
    ${logoBlock}
    ${amBlock}
  </div>
</section>`;

  const js = iife(cls, `/* static */`);
  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  return (
    <div className="space-y-5">
      <Group title="Header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="welcome-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.heading}
          onChange={(v) => onUpdate({ heading: v })}
          testid="welcome-heading"
        />
        <TextAreaField
          label="Welcome text"
          value={config.body}
          onChange={(v) => onUpdate({ body: v })}
          rows={4}
          testid="welcome-body"
        />
      </Group>

      <Group title="Layout">
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="welcome-full-bleed"
        />
        <SliderField
          label="Section height"
          value={config.height}
          min={320}
          max={900}
          step={10}
          suffix="px"
          onChange={(v) => onUpdate({ height: v })}
          testid="welcome-h"
        />
        <SelectField
          label="Header position"
          value={config.headerPos}
          onChange={(v) => onUpdate({ headerPos: v })}
          options={POSITION_OPTIONS}
          testid="welcome-header-pos"
        />
        <SelectField
          label="Header style"
          value={config.headerStyle}
          onChange={(v) => onUpdate({ headerStyle: v })}
          options={CARD_STYLE_OPTIONS}
          testid="welcome-header-style"
        />
        <SelectField
          label="Logo position"
          value={config.logoPos}
          onChange={(v) => onUpdate({ logoPos: v })}
          options={POSITION_OPTIONS}
          testid="welcome-logo-pos"
        />
        <SelectField
          label="Logo style"
          value={config.logoStyle}
          onChange={(v) => onUpdate({ logoStyle: v })}
          options={CARD_STYLE_OPTIONS}
          testid="welcome-logo-style"
        />
        <SelectField
          label="Account manager position"
          value={config.amPos}
          onChange={(v) => onUpdate({ amPos: v })}
          options={POSITION_OPTIONS}
          testid="welcome-am-pos"
        />
        <SelectField
          label="Account manager style"
          value={config.amStyle}
          onChange={(v) => onUpdate({ amStyle: v })}
          options={CARD_STYLE_OPTIONS}
          testid="welcome-am-style"
        />
      </Group>

      <Group title="Theme">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Background image
          </Label>
          <ImageUpload
            value={config.image}
            onChange={(v) => onUpdate({ image: v })}
            testid="welcome-image"
          />
        </div>
        <ColorField
          label="Eyebrow color"
          value={config.eyebrowColor || config.headerTextColor}
          onChange={(v) => onUpdate({ eyebrowColor: v })}
          testid="welcome-eyebrow-color"
        />
        <ColorField
          label="Heading & body color"
          value={config.headerTextColor}
          onChange={(v) => onUpdate({ headerTextColor: v })}
          testid="welcome-text-color"
        />
        <ColorField
          label="AM accent color"
          value={config.amAccentColor}
          onChange={(v) => onUpdate({ amAccentColor: v })}
          testid="welcome-am-accent"
        />
        <ColorField
          label="Overlay color"
          value={config.overlayColor}
          onChange={(v) => onUpdate({ overlayColor: v })}
          testid="welcome-overlay-color"
        />
        <SliderField
          label="Overlay opacity"
          value={Math.round((config.overlayOpacity ?? 0.55) * 100)}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => onUpdate({ overlayOpacity: v / 100 })}
          testid="welcome-overlay-op"
        />
      </Group>

      <Group title="Customer logo">
        <ToggleField
          label="Show customer logo"
          checked={!!config.showLogo}
          onChange={(v) => onUpdate({ showLogo: v })}
          testid="welcome-show-logo"
        />
        {config.showLogo && (
          <>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Logo image
              </Label>
              <ImageUpload
                value={config.logo}
                onChange={(v) => onUpdate({ logo: v })}
                testid="welcome-logo"
              />
            </div>
            <TextField
              label="Logo alt text"
              value={config.logoAlt || ""}
              onChange={(v) => onUpdate({ logoAlt: v })}
              testid="welcome-logo-alt"
            />
            <SliderField
              label="Logo max width"
              value={config.logoMaxWidth}
              min={80}
              max={360}
              step={5}
              suffix="px"
              onChange={(v) => onUpdate({ logoMaxWidth: v })}
              testid="welcome-logo-w"
            />
          </>
        )}
      </Group>

      <Group title="Account manager">
        <ToggleField
          label="Show account manager"
          checked={!!config.showAm}
          onChange={(v) => onUpdate({ showAm: v })}
          testid="welcome-show-am"
        />
        {config.showAm && (
          <>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Avatar (optional)
              </Label>
              <ImageUpload
                value={config.amAvatar}
                onChange={(v) => onUpdate({ amAvatar: v })}
                testid="welcome-am-avatar"
              />
            </div>
            <TextField
              label="Avatar alt text"
              value={config.amAvatarAlt || ""}
              onChange={(v) => onUpdate({ amAvatarAlt: v })}
              testid="welcome-am-avatar-alt"
            />
            <TextField
              label="Name"
              value={config.amName || ""}
              onChange={(v) => onUpdate({ amName: v })}
              testid="welcome-am-name"
            />
            <TextField
              label="Role / title"
              value={config.amRole || ""}
              onChange={(v) => onUpdate({ amRole: v })}
              testid="welcome-am-role"
            />
            <TextField
              label="Email"
              value={config.amEmail || ""}
              onChange={(v) => onUpdate({ amEmail: v })}
              placeholder="name@company.com"
              testid="welcome-am-email"
            />
            <TextField
              label="Phone"
              value={config.amPhone || ""}
              onChange={(v) => onUpdate({ amPhone: v })}
              placeholder="+44 20 7946 0000"
              testid="welcome-am-phone"
            />
          </>
        )}
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

// Quiet unused-import warning — these icons are referenced from snippet
// SVG strings, not as React components.
void Mail;
void Phone;
void UserIcon;

export const welcome = {
  id: ID,
  name: "Welcome",
  description: "Post-login welcome banner with positionable header, logo and account manager",
  icon: Sparkles,
  defaults,
  render,
  FormPanel,
};
