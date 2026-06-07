/**
 * Steps — N steps with big numbers (01, 02…), optional icon, title, body.
 * Horizontal "process strip" or vertical stack. No JS required.
 */
import { ListOrdered } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
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
const ID = "steps";

const sampleStep = (i) => ({
  id: makeUid(),
  icon: ["zap", "rocket", "check"][i % 3],
  title: ["Sign up", "Build & autosave", "Ship"][i % 3],
  body: "Short paragraph explaining what happens at this step. Keep it scannable — readers compare steps side by side.",
});

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "How it works",
  heading: "Three steps from idea to live.",
  subheading: "",
  bgColor: "#ffffff",
  textColor: "#1f2937",
  bodyColor: "#64748b",
  accentColor: "#E01839",
  paddingY: 80,
  paddingTop: 80,
  paddingBottom: 80,
  fullBleed: false,
  // Layout
  layout: "horizontal", // "horizontal" | "vertical"
  numberStyle: "large", // "large" | "small" | "none"
  divider: "hairline", // "hairline" | "none"
  textAlign: "left",
  steps: [sampleStep(0), sampleStep(1), sampleStep(2)],
});

const render = (cfg) => {
  const uid = cfg.uid || makeUid();
  const cls = `ns-steps-${uid}`;
  const horizontal = cfg.layout !== "vertical";
  const showNumber = cfg.numberStyle !== "none";
  const numberSize = cfg.numberStyle === "large" ? 36 : 18;
  const divider = cfg.divider !== "none";

  const stepsHtml = (cfg.steps || [])
    .map((s, i) => {
      const numTxt = String(i + 1).padStart(2, "0");
      const numHtml = showNumber
        ? `<span class="ns-num" aria-hidden="true">${numTxt}</span>`
        : "";
      const iconHtml = svgIcon(s.icon || "none", 16);
      const iconBox = iconHtml
        ? `<span class="ns-icon" aria-hidden="true">${iconHtml}</span>`
        : "";
      return `<article class="ns-step"><div class="ns-step-head">${numHtml}${iconBox}</div><h3 class="ns-step-title">${escHtml(
        s.title || ""
      )}</h3><p class="ns-step-body">${escHtml(s.body || "")}</p></article>`;
    })
    .join("");

  const eyebrowHtml = cfg.eyebrow
    ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>`
    : "";
  const subHtml = cfg.subheading
    ? `<p class="ns-sub">${escHtml(cfg.subheading)}</p>`
    : "";

  const html = `<section class="ns-steps ${cls}${fullBleedClass(cfg)}" data-ns-uid="${escAttr(
    uid
  )}" data-ns-group="defaults"><div class="ns-inner"><header class="ns-head" data-ns-group="header"><div class="ns-head-inner">${eyebrowHtml}<h2 class="ns-heading">${escHtml(
    cfg.heading || ""
  )}</h2>${subHtml}</div></header><div class="ns-track">${stepsHtml}</div></div></section>`;

  const stepCount = (cfg.steps || []).length || 1;
  const bg = safeColor(cfg.bgColor, "#ffffff");
  const textColor = safeColor(cfg.textColor, "#1f2937");
  const accent = safeColor(cfg.accentColor, "#E01839");
  const bodyColor = safeColor(cfg.bodyColor, "#64748b");
  const align = cfg.textAlign === "center" ? "center" : "left";
  const padTop = padTopOf(cfg, 80);
  const padBot = padBotOf(cfg, 80);

  const css = `
${baseReset(cls)}
.${cls}{padding:${padTop}px 20px ${padBot}px;background:${bg};color:${textColor}}
.${cls} .ns-inner{max-width:1200px;margin:0 auto;text-align:${align}}
.${cls} .ns-head{margin-bottom:40px}
.${cls} .ns-head-inner{max-width:720px;${align === "center" ? "margin:0 auto;" : ""}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${accent};margin-bottom:14px}
.${cls} .ns-heading{font-size:${num(cfg.headingSize, 32)}px;font-weight:600;letter-spacing:-0.01em;line-height:1.15;color:${textColor}}
.${cls} .ns-sub{margin-top:14px;font-size:16px;color:${bodyColor};line-height:1.6}
.${cls} .ns-track{display:grid;${horizontal ? `grid-template-columns:repeat(${stepCount},minmax(0,1fr));gap:0` : "gap:32px"};${divider && horizontal ? "border:1px solid #e2e8f0;border-radius:8px;overflow:hidden" : ""}}
.${cls} .ns-step{padding:${horizontal ? "32px" : "0"};text-align:left;${divider && horizontal ? "background:#fff" : ""}}
.${cls} .ns-step + .ns-step{${horizontal && divider ? "border-left:1px solid #e2e8f0" : !horizontal && divider ? "padding-top:32px;border-top:1px solid #e2e8f0" : ""}}
.${cls} .ns-step-head{display:flex;align-items:baseline;gap:12px;margin-bottom:${cfg.numberStyle === "large" ? 20 : 14}px}
.${cls} .ns-num{font-size:${numberSize}px;font-weight:600;color:${accent};line-height:1;letter-spacing:-0.02em;font-variant-numeric:tabular-nums}
.${cls} .ns-icon{display:inline-flex;color:${bodyColor}}
.${cls} .ns-step-title{font-size:18px;font-weight:600;letter-spacing:-0.005em;line-height:1.3;margin-bottom:8px;color:${textColor}}
.${cls} .ns-step-body{font-size:14px;line-height:1.6;color:${bodyColor}}
@media (max-width:880px){.${cls} .ns-track{grid-template-columns:1fr;${divider ? "border:0;border-radius:0" : ""}}.${cls} .ns-step + .ns-step{border-left:0;${divider ? "border-top:1px solid #e2e8f0;padding-top:28px;margin-top:28px" : ""}}}
`.trim();

  return wrapSnippet({ html, css, js: "" });
};

function FormPanel({ config, onUpdate }) {
  const steps = config.steps || [];
  const updateStep = (id, patch) =>
    onUpdate({
      steps: steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  const addStep = () =>
    onUpdate({ steps: [...steps, sampleStep(steps.length)] });
  const removeStep = (id) =>
    onUpdate({ steps: steps.filter((s) => s.id !== id) });
  const reorderSteps = (next) => onUpdate({ steps: next });

  return (
    <FormAccordion sectionType="steps">
      <Group title="Header">
        <TextField
          label="Eyebrow (optional)"
          value={config.eyebrow}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="steps-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.heading}
          onChange={(v) => onUpdate({ heading: v })}
          testid="steps-heading"
        />
        <TextAreaField
          label="Subheading"
          value={config.subheading}
          onChange={(v) => onUpdate({ subheading: v })}
          testid="steps-sub"
        />
      </Group>

      <Group title="Defaults" value="defaults">
        <SelectField
          label="Direction"
          value={config.layout}
          onChange={(v) => onUpdate({ layout: v })}
          options={[
            { value: "horizontal", label: "Horizontal strip" },
            { value: "vertical", label: "Vertical stack" },
          ]}
          testid="steps-layout"
        />
        <SelectField
          label="Number style"
          value={config.numberStyle}
          onChange={(v) => onUpdate({ numberStyle: v })}
          options={[
            { value: "large", label: "Large (01, 02 — editorial)" },
            { value: "small", label: "Small inline" },
            { value: "none", label: "Hide numbers" },
          ]}
          testid="steps-number-style"
        />
        <SelectField
          label="Dividers"
          value={config.divider}
          onChange={(v) => onUpdate({ divider: v })}
          options={[
            { value: "hairline", label: "Hairline divider" },
            { value: "none", label: "None" },
          ]}
          testid="steps-divider"
        />
        <SelectField
          label="Header alignment"
          value={config.textAlign}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
          ]}
          testid="steps-text-align"
        />
        <SliderField
          label="Heading size"
          value={Number(config.headingSize) || 32}
          min={20}
          max={72}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="steps-heading-size"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={80}
          max={140}
          testidPrefix="steps"
        />
        <ToggleField
          label="Make wide"
          description="Stretch section to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="steps-full-bleed"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="steps-bg"
        />
        <ColorField
          label="Heading + title"
          value={config.textColor}
          onChange={(v) => onUpdate({ textColor: v })}
          testid="steps-text"
        />
        <ColorField
          label="Body colour"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="steps-body"
        />
        <ColorField
          label="Accent (numbers + eyebrow)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="steps-accent"
        />
      </Group>

      <Group title={`Steps (${steps.length})`}>
        <ListEditor
          items={steps}
          onReorder={reorderSteps}
          onRemove={removeStep}
          onAdd={addStep}
          itemLabel={(s) => s.title || "Untitled step"}
          addLabel="Add step"
          testid="steps-list"
          renderRow={(s) => (
            <div className="text-xs font-medium text-slate-700 truncate">
              {s.title || "Untitled step"}
            </div>
          )}
          renderForm={(s) => (
            <>
              <SelectField
                label="Icon"
                value={s.icon || "none"}
                onChange={(v) => updateStep(s.id, { icon: v })}
                options={ICON_OPTIONS}
                testid={`steps-icon-${s.id}`}
              />
              <TextField
                label="Title"
                value={s.title}
                onChange={(v) => updateStep(s.id, { title: v })}
                testid={`steps-title-${s.id}`}
              />
              <TextAreaField
                label="Body"
                value={s.body}
                onChange={(v) => updateStep(s.id, { body: v })}
                testid={`steps-body-${s.id}`}
              />
            </>
          )}
        />
      </Group>
    </FormAccordion>
  );
}

export const steps = {
  id: ID,
  name: "Steps",
  icon: ListOrdered,
  description: "Numbered process strip — horizontal or vertical",
  defaults,
  render,
  FormPanel,
};
