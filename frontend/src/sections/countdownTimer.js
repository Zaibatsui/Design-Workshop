/**
 * Countdown Timer — urgency block for sale deadlines, product launches,
 * or events. Renders a live ticking countdown (days / hours / minutes /
 * seconds) with an optional heading, subheading, eyebrow, CTA button,
 * flanking side images/logos, background image with overlay, and
 * post-expiry action.
 *
 * Two display styles:
 *   blocks  — digits sit inside rounded cards with a separate background
 *   minimal — plain large numbers with colon separators, no card chrome
 *
 * Pure HTML/CSS/JS — no dependencies. Ticks every second via setInterval.
 */
import { Timer } from "lucide-react";
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
import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";

const ID = "countdown-timer";

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "LIMITED TIME OFFER",
  title: "Sale ends in",
  subheading: "",
  targetDate: "",
  showDays: true,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
  showLabels: true,
  expiredAction: "message",
  expiredMessage: "This offer has ended.",
  ctaText: "Shop the sale",
  ctaLink: "",
  ctaOpenInSameTab: false,
  sectionRadius: 0,
  displayStyle: "blocks",
  textAlign: "center",
  headingSize: 36,
  digitSize: 64,
  fullBleed: false,
  paddingTop: 80,
  paddingBottom: 80,
  paddingX: 20,
  // Element spacing
  aboveDigitsGap: 36,
  belowDigitsGap: 36,
  // Side images / logos
  leftImage: "",
  leftImageAlt: "",
  leftImageScale: 100,
  rightImage: "",
  rightImageAlt: "",
  rightImageScale: 100,
  sideImageAlign: "center",
  hideSideImagesOnMobile: true,
  // Background image
  bgImage: "",
  bgImageAlt: "",
  overlayType: "solid",
  overlayColor: "#0f172a",
  overlayOpacity: 0.65,
  overlayGradientFrom: "#0f172a",
  overlayGradientTo: "#1e3a5f",
  overlayGradientAngle: 135,
  // Colours
  bgColor: "#0f172a",
  titleColor: "#ffffff",
  eyebrowColor: "#94a3b8",
  subColor: "#cbd5e1",
  digitBgColor: "#1e293b",
  digitColor: "#ffffff",
  labelColor: "#ffffff",
  accentColor: "#3b82f6",
});

function render(cfg = {}) {
  const c = { ...defaults(), ...cfg };
  const uid = c.uid || makeUid();
  const cls = `ns-cd-${uid}`;

  const align = c.textAlign === "left" ? "left"
    : c.textAlign === "right" ? "right"
    : "center";
  const flexJustify = align === "left" ? "flex-start"
    : align === "right" ? "flex-end"
    : "center";

  const displayStyle  = c.displayStyle === "minimal" ? "minimal" : "blocks";
  const showLabels    = c.showLabels !== false;
  const showDays      = c.showDays !== false;
  const showHours     = c.showHours !== false;
  const showMinutes   = c.showMinutes !== false;
  const showSeconds   = c.showSeconds !== false;
  const expiredAction  = c.expiredAction === "hide" ? "hide" : "message";
  const sectionRadius  = Math.max(0, num(c.sectionRadius, 0));

  const bgColor      = safeColor(c.bgColor,      "#0f172a");
  const titleColor   = safeColor(c.titleColor,   "#ffffff");
  const eyebrowColor = safeColor(c.eyebrowColor, "#94a3b8");
  const subColor     = safeColor(c.subColor,     "#cbd5e1");
  const digitBgColor = safeColor(c.digitBgColor, "#1e293b");
  const digitColor   = safeColor(c.digitColor,   "#ffffff");
  const labelColor   = safeColor(c.labelColor,   "#94a3b8");
  const accentColor  = safeColor(c.accentColor,  "#3b82f6");

  const headingSize    = Math.max(16, num(c.headingSize, 36));
  const digitSize      = Math.max(24, num(c.digitSize, 64));
  const aboveDigitsGap = Math.max(0, num(c.aboveDigitsGap, 36));
  const belowDigitsGap = Math.max(0, num(c.belowDigitsGap, 36));
  const padTop = padTopOf(c, 80);
  const padBot = padBotOf(c, 80);
  const padX   = padXOf(c, 20);

  // Background image + overlay
  const bgImgUrl      = safeUrl(c.bgImage || "");
  const overlayOpacity = Math.min(1, Math.max(0, num(c.overlayOpacity, 0.65)));
  const overlayColor  = safeColor(c.overlayColor, "#0f172a");
  const overlayBg     = c.overlayType === "gradient"
    ? `linear-gradient(${num(c.overlayGradientAngle, 135)}deg,${safeColor(c.overlayGradientFrom, "#0f172a")},${safeColor(c.overlayGradientTo, "#1e3a5f")})`
    : overlayColor;

  // Side images
  const leftImgUrl   = safeUrl(c.leftImage  || "");
  const rightImgUrl  = safeUrl(c.rightImage || "");
  const BASE_IMG_W   = 200;
  const leftImgW     = Math.round(BASE_IMG_W * Math.max(10, num(c.leftImageScale,  100)) / 100);
  const rightImgW    = Math.round(BASE_IMG_W * Math.max(10, num(c.rightImageScale, 100)) / 100);
  const sideAlign    = ["flex-start","center","flex-end"].includes(c.sideImageAlign)
    ? c.sideImageAlign : "center";
  const hideMobile   = c.hideSideImagesOnMobile !== false;

  const hasSide = leftImgUrl || rightImgUrl;

  const targetISO = c.targetDate ? JSON.stringify(c.targetDate) : "''";

  // Digit card dimensions
  const numPadV = Math.round(digitSize * 0.22);
  const numPadH = Math.round(digitSize * 0.28);
  const numMinW = Math.round(digitSize * 1.5);
  const gapPx   = displayStyle === "blocks" ? 12 : 4;
  const sepSize  = Math.round(digitSize * 0.75);

  const unitSlots = [
    showDays    && { key: "days",    label: "Days" },
    showHours   && { key: "hours",   label: "Hours" },
    showMinutes && { key: "minutes", label: "Mins" },
    showSeconds && { key: "seconds", label: "Secs" },
  ].filter(Boolean);

  const digitsHtml = unitSlots.map((u, i) => {
    const sep = displayStyle === "minimal" && i < unitSlots.length - 1
      ? `<span class="${cls}-sep" aria-hidden="true">:</span>` : "";
    return `<div class="${cls}-unit" data-unit="${u.key}">
          <span class="${cls}-num">00</span>${showLabels ? `\n          <span class="${cls}-lbl">${u.label}</span>` : ""}
        </div>${sep}`;
  }).join("\n        ");

  const eyebrowHtml = c.eyebrow
    ? `<p class="${cls}-eyebrow">${escHtml(c.eyebrow)}</p>` : "";
  const titleHtml = c.title
    ? `<h2 class="${cls}-title">${escHtml(c.title)}</h2>` : "";
  const subHtml = c.subheading
    ? `<p class="${cls}-sub">${escHtml(c.subheading)}</p>` : "";
  const headerHtml = eyebrowHtml || titleHtml || subHtml
    ? `<div class="${cls}-header" data-ns-group="header">${eyebrowHtml}${titleHtml}${subHtml}</div>` : "";

  const ctaText   = (c.ctaText || "").trim();
  const ctaHref   = safeUrl(c.ctaLink || "") || "#";
  const ctaTarget = c.ctaOpenInSameTab ? "_self" : "_blank";
  const ctaRel    = c.ctaOpenInSameTab ? "" : ' rel="noopener noreferrer"';
  const ctaHtml   = ctaText
    ? `<div class="${cls}-cta-row" data-ns-group="cta" style="margin-top:${belowDigitsGap}px">
        <a class="ns-btn ns-btn-primary" href="${escAttr(ctaHref)}" target="${ctaTarget}"${ctaRel}>${escHtml(ctaText)}</a>
      </div>` : "";

  const expiredMsg = escHtml(c.expiredMessage || "This offer has ended.");

  const numBg = displayStyle === "blocks"
    ? `background:${digitBgColor};border-radius:10px;padding:${numPadV}px ${numPadH}px;` : "";

  const sectionBg = bgImgUrl
    ? `background:${bgColor} url('${escAttr(bgImgUrl)}') center/cover no-repeat`
    : `background:${bgColor}`;

  const overlayHtml = bgImgUrl
    ? `<div class="${cls}-overlay" aria-hidden="true"></div>` : "";

  // Side image elements — always rendered so the grid columns are always present.
  // Width is an inline style so it wins over baseReset's max-width:100% rule.
  const leftSideHtml = `<div class="${cls}-side ${cls}-side-l"${leftImgUrl ? ` data-ns-group="side-images"` : ` aria-hidden="true"`}>
    ${leftImgUrl ? `<img src="${escAttr(leftImgUrl)}" alt="${escAttr(c.leftImageAlt || "")}" style="width:${leftImgW}px;height:auto;display:block;object-fit:contain;max-width:100%" />` : ""}
  </div>`;
  const rightSideHtml = `<div class="${cls}-side ${cls}-side-r"${rightImgUrl ? ` data-ns-group="side-images"` : ` aria-hidden="true"`}>
    ${rightImgUrl ? `<img src="${escAttr(rightImgUrl)}" alt="${escAttr(c.rightImageAlt || "")}" style="width:${rightImgW}px;height:auto;display:block;object-fit:contain;max-width:100%" />` : ""}
  </div>`;

  // Center content
  const centerHtml = `<div class="${cls}-center">
    ${headerHtml}
    <div class="${cls}-dw" data-ns-group="timer" style="margin-top:${aboveDigitsGap}px">
      <div class="${cls}-digits">${digitsHtml}</div>
    </div>
    <p class="${cls}-expired" style="display:none">${expiredMsg}</p>
    ${ctaHtml}
  </div>`;

  const css = `
${baseReset(cls)}
.${cls}{${sectionBg};padding:${padTop}px ${padX}px ${padBot}px;position:relative${sectionRadius ? `;border-radius:${sectionRadius}px;overflow:hidden` : ""}}
.${cls}.ns-full-bleed{padding-left:0;padding-right:0}
.${cls}-overlay{position:absolute;inset:0;background:${overlayBg};opacity:${overlayOpacity};pointer-events:none}
.${cls} .ns-wrap{max-width:1100px;margin:0 auto;padding:0 ${padX}px;position:relative;z-index:1}
.${cls}.ns-full-bleed .ns-wrap{padding:0 ${padX}px}
.${cls}-inner{display:grid;grid-template-columns:${Math.max(leftImgUrl?leftImgW:0,rightImgUrl?rightImgW:0)}px 1fr ${Math.max(leftImgUrl?leftImgW:0,rightImgUrl?rightImgW:0)}px;align-items:${sideAlign};gap:${(leftImgUrl||rightImgUrl)?24:0}px}
.${cls}-center{min-width:0;text-align:${align}}
.${cls}-side{display:flex;align-items:${sideAlign === "flex-end" ? "flex-end" : sideAlign === "flex-start" ? "flex-start" : "center"};justify-content:center}
.${cls}-side-l{justify-content:flex-start}
.${cls}-side-r{justify-content:flex-end}
.${cls}-header{margin-bottom:0}
.${cls}-eyebrow{color:${eyebrowColor};font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;margin:0 0 10px}
.${cls}-title{color:${titleColor};font-size:${headingSize}px;font-weight:700;line-height:1.15;margin:0 0 12px}
.${cls}-sub{color:${subColor};font-size:16px;line-height:1.6;margin:0}
.${cls}-dw{margin-top:${aboveDigitsGap}px}
.${cls}-digits{display:flex;align-items:center;justify-content:${flexJustify};gap:${gapPx}px;flex-wrap:wrap}
.${cls}-unit{display:flex;flex-direction:column;align-items:center;gap:8px}
.${cls}-num{display:block;font-size:${digitSize}px;font-weight:800;line-height:1;min-width:${numMinW}px;text-align:center;color:${digitColor};${numBg}font-variant-numeric:tabular-nums}
.${cls}-sep{font-size:${sepSize}px;font-weight:800;color:${digitColor};line-height:1;padding:${showLabels ? Math.round(digitSize * 0.125) : 0}px 6px 0;align-self:${showLabels ? "flex-start" : "center"}}
.${cls}-lbl{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:${labelColor}}
.${cls}-expired{display:none;color:${titleColor};font-size:20px;font-weight:600;padding:28px 0;line-height:1.5}
.${cls}-cta-row{margin-top:${belowDigitsGap}px}
.${cls} .ns-btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:.01em;border:1px solid transparent;transition:transform .15s ease,box-shadow .15s ease,opacity .15s ease}
.${cls} .ns-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.2)}
.${cls} .ns-btn-primary{background:${accentColor};color:#fff;border-color:${accentColor}}
${hideMobile ? `@media(max-width:640px){.${cls}-side{display:none}}` : ""}
@media(max-width:640px){
  .${cls}-inner{grid-template-columns:1fr;gap:16px}
  .${cls}-num{font-size:${Math.round(digitSize * .68)}px;min-width:${Math.round(numMinW * .68)}px}
  .${cls}-sep{font-size:${Math.round(sepSize * .68)}px}
  .${cls}-title{font-size:${Math.round(headingSize * .8)}px}
  .${cls}-digits{gap:${Math.max(4, Math.round(gapPx * .75))}px}
}`.trim();

  const html = `<section class="${cls}${fullBleedClass(c)}" data-ns-group="layout">
  ${overlayHtml}
  <div class="ns-wrap">
    <div class="${cls}-inner">
      ${leftSideHtml}
      ${centerHtml}
      ${rightSideHtml}
    </div>
  </div>
</section>`;

  const jsBody = [
    "var targetMs=" + targetISO + "?new Date(" + targetISO + ").getTime():0;",
    "var ea=" + JSON.stringify(expiredAction) + ";",
    "var sD=" + (showDays ? "1" : "0") + ";",
    "var sH=" + (showHours ? "1" : "0") + ";",
    "var sM=" + (showMinutes ? "1" : "0") + ";",
    "var sS=" + (showSeconds ? "1" : "0") + ";",
    "function pad(n){return n<10?'0'+n:''+n;}",
    "function set(sel,v){var x=root.querySelector(sel);if(x)x.textContent=v;}",
    "function tick(){",
    "  var now=Date.now();",
    "  var diff=targetMs>0?Math.max(0,Math.floor((targetMs-now)/1000)):0;",
    "  var d=Math.floor(diff/86400);",
    "  var h=Math.floor((diff%86400)/3600);",
    "  var m=Math.floor((diff%3600)/60);",
    "  var s=diff%60;",
    "  if(!sD)h+=d*24;",
    "  if(!sH)m+=h*60;",
    "  if(!sM)s+=m*60;",
    "  if(sD)set('[data-unit=\"days\"] ." + cls + "-num',d);",
    "  if(sH)set('[data-unit=\"hours\"] ." + cls + "-num',pad(h));",
    "  if(sM)set('[data-unit=\"minutes\"] ." + cls + "-num',pad(m));",
    "  if(sS)set('[data-unit=\"seconds\"] ." + cls + "-num',pad(s));",
    "  if(diff<=0&&targetMs>0){",
    "    clearInterval(timer);",
    "    if(ea==='hide'){root.style.display='none';}",
    "    else{",
    "      var dw=root.querySelector('." + cls + "-dw');",
    "      var em=root.querySelector('." + cls + "-expired');",
    "      if(dw)dw.style.display='none';",
    "      if(em)em.style.display='block';",
    "    }",
    "  }",
    "}",
    "tick();",
    "var timer=setInterval(tick,1000);",
  ].join("\n");

  return wrapSnippet({ html, css, js: iife(cls, jsBody) });
}

function FormPanel({ config, onUpdate }) {
  const hasBgImg    = !!(config.bgImage    || "").trim();
  const hasLeftImg  = !!(config.leftImage  || "").trim();
  const hasRightImg = !!(config.rightImage || "").trim();

  return (
    <FormAccordion sectionType="countdown-timer">

      {/* ── Header ─────────────────────────────────────────────── */}
      <Group value="header" title="Section header">
        <TextField
          label="Eyebrow"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          placeholder="LIMITED TIME OFFER"
        />
        <TextField
          label="Title"
          value={config.title || ""}
          onChange={(v) => onUpdate({ title: v })}
          placeholder="Sale ends in"
        />
        <TextAreaField
          label="Subheading"
          value={config.subheading || ""}
          onChange={(v) => onUpdate({ subheading: v })}
          rows={2}
        />
      </Group>

      {/* ── Timer ──────────────────────────────────────────────── */}
      <Group value="timer" title="Timer">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Target date &amp; time
          </label>
          <input
            type="datetime-local"
            value={config.targetDate ? config.targetDate.slice(0, 16) : ""}
            onChange={(e) =>
              onUpdate({ targetDate: e.target.value ? e.target.value + ":00" : "" })
            }
            className="border border-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1.5"
          />
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Uses your device&apos;s local timezone.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Show units
          </p>
          <ToggleField label="Days"    checked={config.showDays    !== false} onChange={(v) => onUpdate({ showDays: v })} />
          <ToggleField label="Hours"   checked={config.showHours   !== false} onChange={(v) => onUpdate({ showHours: v })} />
          <ToggleField label="Minutes" checked={config.showMinutes !== false} onChange={(v) => onUpdate({ showMinutes: v })} />
          <ToggleField label="Seconds" checked={config.showSeconds !== false} onChange={(v) => onUpdate({ showSeconds: v })} />
          <ToggleField label="Show labels (Days / Hours / …)" checked={config.showLabels !== false} onChange={(v) => onUpdate({ showLabels: v })} />
        </div>

        <SelectField
          label="When the timer expires"
          value={config.expiredAction || "message"}
          onChange={(v) => onUpdate({ expiredAction: v })}
          options={[
            { value: "message", label: "Show a message" },
            { value: "hide",    label: "Hide the section" },
          ]}
        />
        {(config.expiredAction || "message") === "message" && (
          <TextField
            label="Expired message"
            value={config.expiredMessage || ""}
            onChange={(v) => onUpdate({ expiredMessage: v })}
            placeholder="This offer has ended."
          />
        )}
      </Group>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <Group value="cta" title="Button">
        <TextField
          label="Button label"
          value={config.ctaText || ""}
          onChange={(v) => onUpdate({ ctaText: v })}
          placeholder="Shop the sale"
        />
        <TextField
          label="Button URL"
          value={config.ctaLink || ""}
          onChange={(v) => onUpdate({ ctaLink: v })}
          placeholder="https://…"
        />
        <ToggleField
          label="Open in same tab"
          checked={!!config.ctaOpenInSameTab}
          onChange={(v) => onUpdate({ ctaOpenInSameTab: v })}
        />
      </Group>

      {/* ── Side images ────────────────────────────────────────── */}
      <Group value="side-images" title="Side images">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 -mb-1">Left</p>
        <ImageUpload
          label="Left image / logo"
          value={config.leftImage || ""}
          onChange={(v) => onUpdate({ leftImage: v })}
        />
        {hasLeftImg && (
          <TextField
            label="Alt text"
            value={config.leftImageAlt || ""}
            onChange={(v) => onUpdate({ leftImageAlt: v })}
            placeholder="Describe the image…"
          />
        )}
        {hasLeftImg && (
          <SliderField
            label="Scale"
            value={num(config.leftImageScale, 100)}
            min={10} max={300} step={5}
            suffix="%"
            onChange={(v) => onUpdate({ leftImageScale: v })}
          />
        )}

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-2 -mb-1">Right</p>
        <ImageUpload
          label="Right image / logo"
          value={config.rightImage || ""}
          onChange={(v) => onUpdate({ rightImage: v })}
        />
        {hasRightImg && (
          <TextField
            label="Alt text"
            value={config.rightImageAlt || ""}
            onChange={(v) => onUpdate({ rightImageAlt: v })}
            placeholder="Describe the image…"
          />
        )}
        {hasRightImg && (
          <SliderField
            label="Scale"
            value={num(config.rightImageScale, 100)}
            min={10} max={300} step={5}
            suffix="%"
            onChange={(v) => onUpdate({ rightImageScale: v })}
          />
        )}

        {(hasLeftImg || hasRightImg) && (<>
          <SelectField
            label="Vertical alignment"
            value={config.sideImageAlign || "center"}
            onChange={(v) => onUpdate({ sideImageAlign: v })}
            options={[
              { value: "flex-start", label: "Top" },
              { value: "center",     label: "Middle" },
              { value: "flex-end",   label: "Bottom" },
            ]}
          />
          <ToggleField
            label="Hide on mobile"
            checked={config.hideSideImagesOnMobile !== false}
            onChange={(v) => onUpdate({ hideSideImagesOnMobile: v })}
          />
        </>)}
      </Group>

      {/* ── Background ─────────────────────────────────────────── */}
      <Group value="background" title="Background">
        <ImageUpload
          label="Background image"
          value={config.bgImage || ""}
          onChange={(v) => onUpdate({ bgImage: v })}
          hint="Leave blank for a flat colour background."
        />
        {hasBgImg && (
          <TextField
            label="Image alt text"
            value={config.bgImageAlt || ""}
            onChange={(v) => onUpdate({ bgImageAlt: v })}
            placeholder="Describe the image…"
          />
        )}
        {hasBgImg && (
          <SelectField
            label="Overlay style"
            value={config.overlayType || "solid"}
            onChange={(v) => onUpdate({ overlayType: v })}
            options={[
              { value: "solid",    label: "Solid colour" },
              { value: "gradient", label: "Gradient" },
            ]}
          />
        )}
        {hasBgImg && (config.overlayType || "solid") === "solid" && (
          <ColorField
            label="Overlay colour"
            value={config.overlayColor || "#0f172a"}
            onChange={(v) => onUpdate({ overlayColor: v })}
          />
        )}
        {hasBgImg && (config.overlayType || "solid") === "gradient" && (<>
          <ColorField
            label="Gradient from"
            value={config.overlayGradientFrom || "#0f172a"}
            onChange={(v) => onUpdate({ overlayGradientFrom: v })}
          />
          <ColorField
            label="Gradient to"
            value={config.overlayGradientTo || "#1e3a5f"}
            onChange={(v) => onUpdate({ overlayGradientTo: v })}
          />
          <SliderField
            label="Gradient angle"
            value={num(config.overlayGradientAngle, 135)}
            min={0} max={360} step={5}
            suffix="°"
            onChange={(v) => onUpdate({ overlayGradientAngle: v })}
          />
        </>)}
        {hasBgImg && (
          <SliderField
            label="Overlay opacity"
            value={Math.round(num(config.overlayOpacity, 0.65) * 100)}
            min={0} max={100} step={1}
            suffix="%"
            onChange={(v) => onUpdate({ overlayOpacity: v / 100 })}
          />
        )}
        {!hasBgImg && (
          <ColorField
            label="Background colour"
            value={config.bgColor || "#0f172a"}
            onChange={(v) => onUpdate({ bgColor: v })}
          />
        )}
      </Group>

      {/* ── Layout ─────────────────────────────────────────────── */}
      <Group value="layout" title="Layout">
        <SelectField
          label="Display style"
          value={config.displayStyle || "blocks"}
          onChange={(v) => onUpdate({ displayStyle: v })}
          options={[
            { value: "blocks",  label: "Blocks — digits in cards" },
            { value: "minimal", label: "Minimal — plain numbers" },
          ]}
        />
        <SelectField
          label="Alignment"
          value={config.textAlign || "center"}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "left",   label: "Left" },
            { value: "center", label: "Centre" },
            { value: "right",  label: "Right" },
          ]}
        />
        <ToggleField
          label="Make wide"
          description="Extends the section background to full viewport width"
          checked={!!config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
        />
        <SliderField
          label="Section corner radius"
          value={num(config.sectionRadius, 0)}
          min={0} max={48} step={2}
          suffix="px"
          onChange={(v) => onUpdate({ sectionRadius: v })}
        />
        <SliderField
          label="Heading size"
          value={num(config.headingSize, 36)}
          min={18} max={64} step={1}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
        />
        <SliderField
          label="Digit size"
          value={num(config.digitSize, 64)}
          min={32} max={120} step={2}
          suffix="px"
          onChange={(v) => onUpdate({ digitSize: v })}
        />
        <SliderField
          label="Gap above digits"
          value={num(config.aboveDigitsGap, 36)}
          min={0} max={80} step={4}
          suffix="px"
          onChange={(v) => onUpdate({ aboveDigitsGap: v })}
        />
        <SliderField
          label="Gap below digits"
          value={num(config.belowDigitsGap, 36)}
          min={0} max={80} step={4}
          suffix="px"
          onChange={(v) => onUpdate({ belowDigitsGap: v })}
        />
        <PaddingFields config={config} onUpdate={onUpdate} />
      </Group>

      {/* ── Colours ────────────────────────────────────────────── */}
      <Group value="colors" title="Colours">
        <ColorField label="Title"      value={config.titleColor   || "#ffffff"} onChange={(v) => onUpdate({ titleColor: v })} />
        <ColorField label="Eyebrow"    value={config.eyebrowColor || "#94a3b8"} onChange={(v) => onUpdate({ eyebrowColor: v })} />
        <ColorField label="Subheading" value={config.subColor     || "#cbd5e1"} onChange={(v) => onUpdate({ subColor: v })} />
        <ColorField label="Digit"      value={config.digitColor   || "#ffffff"} onChange={(v) => onUpdate({ digitColor: v })} />
        {(config.displayStyle || "blocks") === "blocks" && (
          <ColorField label="Digit card background" value={config.digitBgColor || "#1e293b"} onChange={(v) => onUpdate({ digitBgColor: v })} />
        )}
        <ColorField label="Unit labels"    value={config.labelColor  || "#94a3b8"} onChange={(v) => onUpdate({ labelColor: v })} />
        <ColorField label="Button / accent" value={config.accentColor || "#3b82f6"} onChange={(v) => onUpdate({ accentColor: v })} />
      </Group>

    </FormAccordion>
  );
}

export const countdownTimer = {
  id: ID,
  name: "Countdown Timer",
  description:
    "Live ticking countdown to a target date — for sale deadlines, launches, or events. Two display styles, optional side images, background image, CTA, and a post-expiry action.",
  icon: Timer,
  defaults,
  render,
  FormPanel,
};
