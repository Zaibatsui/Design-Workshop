/**
 * FAQ Accordion — N collapsible Q+A items. Uses native <details>/<summary>
 * for zero-JS accessibility (keyboard, screen readers) — works in every
 * modern browser without React. The "single open at a time" mode adds a
 * tiny IIFE that closes siblings when one opens.
 */
import { HelpCircle } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  iife,
  makeUid,
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

const ID = "faq";

const sampleItem = (i) => ({
  id: makeUid(),
  question: [
    "Do I need to install anything?",
    "Is the code I generate mine?",
    "Will the snippets slow my site down?",
  ][i % 3],
  answer:
    "Short, factual answer that addresses the question directly without marketing fluff. Two or three sentences max.",
});

const defaults = () => ({
  uid: makeUid(),
  eyebrow: "FAQ",
  heading: "Questions, answered.",
  subheading: "",
  bgColor: "#ffffff",
  textColor: "#1f2937",
  bodyColor: "#475569",
  accentColor: "#E01839",
  paddingY: 80,
  fullBleed: false,
  // Behaviour
  singleOpen: false, // close siblings when opening
  divider: "hairline", // "hairline" | "none"
  textAlign: "left",
  items: [sampleItem(0), sampleItem(1), sampleItem(2)],
});

const render = (cfg) => {
  const uid = cfg.uid || makeUid();
  const cls = `ns-faq-${uid}`;

  const itemsHtml = (cfg.items || [])
    .map(
      (it) =>
        `<details class="ns-item"><summary class="ns-q"><span class="ns-q-text">${escHtml(
          it.question || ""
        )}</span><span class="ns-q-mark" aria-hidden="true"></span></summary><div class="ns-a">${escHtml(
          it.answer || ""
        )}</div></details>`
    )
    .join("");

  const eyebrowHtml = cfg.eyebrow
    ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>`
    : "";
  const subHtml = cfg.subheading
    ? `<p class="ns-sub">${escHtml(cfg.subheading)}</p>`
    : "";

  const html = `<section class="ns-faq ${cls}${fullBleedClass(cfg)}" data-ns-uid="${escAttr(
    uid
  )}"><div class="ns-inner"><header class="ns-head"><div class="ns-head-inner">${eyebrowHtml}<h2 class="ns-heading">${escHtml(
    cfg.heading || ""
  )}</h2>${subHtml}</div></header><div class="ns-list">${itemsHtml}</div></div></section>`;

  const dividerCss =
    cfg.divider === "none"
      ? ""
      : `.${cls} .ns-list{border-top:1px solid #e2e8f0}.${cls} .ns-item{border-bottom:1px solid #e2e8f0}`;

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad,80px) 20px;background:${cfg.bgColor};color:${cfg.textColor};--ns-pad:${cfg.paddingY}px}
.${cls} .ns-inner{max-width:760px;margin:0 auto;text-align:${cfg.textAlign}}
.${cls} .ns-head{margin-bottom:40px}
.${cls} .ns-head-inner{${cfg.textAlign === "center" ? "max-width:560px;margin:0 auto;" : ""}}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${cfg.accentColor};margin-bottom:14px}
.${cls} .ns-heading{font-size:32px;font-weight:600;letter-spacing:-0.01em;line-height:1.15;color:${cfg.textColor}}
.${cls} .ns-sub{margin-top:14px;font-size:16px;color:${cfg.bodyColor};line-height:1.6}
${dividerCss}
.${cls} .ns-item{padding:0}
.${cls} .ns-item summary{list-style:none;cursor:pointer}
.${cls} .ns-item summary::-webkit-details-marker{display:none}
.${cls} .ns-q{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 0;font-size:16px;font-weight:600;color:${cfg.textColor};letter-spacing:-0.005em;line-height:1.4}
.${cls} .ns-q-text{flex:1;text-align:left}
.${cls} .ns-q-mark{position:relative;width:14px;height:14px;flex-shrink:0;color:${cfg.accentColor}}
.${cls} .ns-q-mark::before,.${cls} .ns-q-mark::after{content:"";position:absolute;background:currentColor;border-radius:1px;transition:transform .2s ease}
.${cls} .ns-q-mark::before{top:6px;left:0;right:0;height:2px}
.${cls} .ns-q-mark::after{top:0;bottom:0;left:6px;width:2px}
.${cls} .ns-item[open] .ns-q-mark::after{transform:scaleY(0)}
.${cls} .ns-a{padding:0 0 22px;font-size:14px;line-height:1.7;color:${cfg.bodyColor};max-width:680px}
@media (max-width:640px){.${cls} .ns-q{font-size:15px}}
`.trim();

  // Single-open mode: close any sibling <details> when one opens.
  const js = cfg.singleOpen
    ? iife(
        cls,
        `var items=root.querySelectorAll(".ns-item");items.forEach(function(it){it.addEventListener("toggle",function(){if(it.open){items.forEach(function(o){if(o!==it&&o.open)o.open=false;});}});});`
      )
    : "";

  return wrapSnippet({ html, css, js });
};

function FormPanel({ config, onUpdate }) {
  const items = config.items || [];
  const updateItem = (id, patch) =>
    onUpdate({
      items: items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    });
  const addItem = () =>
    onUpdate({ items: [...items, sampleItem(items.length)] });
  const removeItem = (id) =>
    onUpdate({ items: items.filter((it) => it.id !== id) });
  const reorderItems = (next) => onUpdate({ items: next });

  return (
    <div className="space-y-6">
      <Group title="Header">
        <TextField
          label="Eyebrow"
          value={config.eyebrow}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="faq-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.heading}
          onChange={(v) => onUpdate({ heading: v })}
          testid="faq-heading"
        />
        <TextAreaField
          label="Subheading"
          value={config.subheading}
          onChange={(v) => onUpdate({ subheading: v })}
          testid="faq-sub"
        />
      </Group>

      <Group title="Behaviour">
        <ToggleField
          label="Single open at a time"
          description="Opening one question closes the others (accordion style)."
          checked={!!config.singleOpen}
          onChange={(v) => onUpdate({ singleOpen: v })}
          testid="faq-single-open"
        />
        <SelectField
          label="Dividers"
          value={config.divider}
          onChange={(v) => onUpdate({ divider: v })}
          options={[
            { value: "hairline", label: "Hairline between items" },
            { value: "none", label: "None" },
          ]}
          testid="faq-divider"
        />
        <SelectField
          label="Header alignment"
          value={config.textAlign}
          onChange={(v) => onUpdate({ textAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
          ]}
          testid="faq-text-align"
        />
        <SliderField
          label="Vertical padding"
          value={config.paddingY}
          min={20}
          max={140}
          suffix="px"
          onChange={(v) => onUpdate({ paddingY: v })}
          testid="faq-pad"
        />
        <ToggleField
          label="Make wide"
          description="Stretch section to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="faq-full-bleed"
        />
      </Group>

      <Group title="Theme">
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="faq-bg"
        />
        <ColorField
          label="Heading + question"
          value={config.textColor}
          onChange={(v) => onUpdate({ textColor: v })}
          testid="faq-text"
        />
        <ColorField
          label="Answer"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="faq-body"
        />
        <ColorField
          label="Accent (eyebrow + +/− mark)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="faq-accent"
        />
      </Group>

      <Group title={`Questions (${items.length})`}>
        <ListEditor
          items={items}
          onReorder={reorderItems}
          onRemove={removeItem}
          onAdd={addItem}
          itemLabel={(it) => it.question || "Untitled question"}
          addLabel="Add question"
          testid="faq-items"
          renderRow={(it) => (
            <div className="text-xs font-medium text-slate-700 truncate">
              {it.question || "Untitled question"}
            </div>
          )}
          renderForm={(it) => (
            <>
              <TextField
                label="Question"
                value={it.question}
                onChange={(v) => updateItem(it.id, { question: v })}
                testid={`faq-q-${it.id}`}
              />
              <TextAreaField
                label="Answer"
                value={it.answer}
                onChange={(v) => updateItem(it.id, { answer: v })}
                testid={`faq-a-${it.id}`}
              />
            </>
          )}
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

export const faq = {
  id: ID,
  name: "FAQ",
  icon: HelpCircle,
  defaults,
  render,
  FormPanel,
};
