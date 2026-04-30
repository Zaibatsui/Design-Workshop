/**
 * Tabs section — toggle buttons that swap between split (image + copy) panels.
 */
import { SquareStack } from "lucide-react";
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
import { TextField, TextAreaField, SliderField, ToggleField } from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import { Label } from "@/components/ui/label";

const ID = "tabs";

const sampleTab = (label, heading) => ({
  id: makeUid(),
  label,
  heading,
  body: "Deliver clear, consistent communication in high-stakes environments.\n\nDesigned for seamless integration and reliable performance.",
  image: "https://media.misco.co.uk/images/shure_vocalist_web_banner.png",
});

const defaults = () => ({
  uid: makeUid(),
  bgColor: "#f7f7f8",
  accentColor: "#015f9b",
  bodyColor: "#333333",
  paddingY: 60,
  fullBleed: false,
  tabs: [
    sampleTab("Board room", "Audio video conferencing for unmatched clarity"),
    sampleTab("Home office", "Professional audio for remote working"),
    sampleTab("Classroom", "Clear communication for modern learning"),
  ],
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-tabs-${uid}`;

  const styleVars = [
    `--ns-bg:${cfg.bgColor}`,
    `--ns-accent:${cfg.accentColor}`,
    `--ns-body:${cfg.bodyColor}`,
    `--ns-pad:${cfg.paddingY}px`,
  ].join(";");

  const tabs = cfg.tabs || [];

  const buttonsHtml = tabs
    .map(
      (tab, i) =>
        `<button class="ns-tab${i === 0 ? " is-active" : ""}" type="button" data-ns-tab="${escAttr(tab.id)}">${escHtml(tab.label)}</button>`
    )
    .join("");

  const panelsHtml = tabs
    .map((tab, i) => {
      const paragraphs = String(tab.body || "")
        .split(/\n\s*\n/)
        .filter((p) => p.trim())
        .map((p) => `<p>${escHtml(p)}</p>`)
        .join("");
      const img = safeUrl(tab.image);
      return `<div class="ns-panel${i === 0 ? " is-active" : ""}" data-ns-panel="${escAttr(tab.id)}">
  <div class="ns-split">
    <div class="ns-copy">
      <h2 class="ns-heading">${escHtml(tab.heading)}</h2>
      ${paragraphs}
    </div>
    <div class="ns-image">${img ? `<img src="${escAttr(img)}" alt="${escAttr(tab.label)}"/>` : ""}</div>
  </div>
</div>`;
    })
    .join("");

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad) 20px;width:100%;background:var(--ns-bg)}
.${cls} .ns-inner{max-width:1200px;margin:0 auto}
.${cls} .ns-tabs-row{display:flex;gap:12px;margin-bottom:30px;flex-wrap:wrap}
.${cls} .ns-tab{border:1px solid #e4e4e7;background:#fff;color:var(--ns-accent);padding:12px 18px;border-radius:6px;font-weight:600;font-size:14px;transition:background .15s ease,color .15s ease}
.${cls} .ns-tab:hover{background:#f9fafb}
.${cls} .ns-tab.is-active{background:var(--ns-accent);color:#fff;border-color:var(--ns-accent)}
.${cls} .ns-panel{display:none}
.${cls} .ns-panel.is-active{display:block}
.${cls} .ns-split{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}
.${cls} .ns-heading{font-size:30px;font-weight:600;color:var(--ns-accent);margin:0 0 16px;line-height:1.2}
.${cls} .ns-copy p{font-size:16px;color:var(--ns-body);line-height:1.6;margin:0}
.${cls} .ns-copy p + p{margin-top:16px}
.${cls} .ns-image img{width:100%;border-radius:6px;display:block}
@media (max-width:768px){.${cls} .ns-split{grid-template-columns:1fr}.${cls} .ns-heading{font-size:24px}}
`.trim();

  const html = `<section class="ns-tabs ${cls}${fullBleedClass(cfg)}" style="${styleVars}">
  <div class="ns-inner">
    <div class="ns-tabs-row">${buttonsHtml}</div>
    <div class="ns-panels">${panelsHtml}</div>
  </div>
</section>`;

  const js = iife(
    cls,
    `var btns=root.querySelectorAll(".ns-tab");var panels=root.querySelectorAll(".ns-panel");btns.forEach(function(b,i){b.classList.toggle("is-active",i===0);});panels.forEach(function(p,i){p.classList.toggle("is-active",i===0);});btns.forEach(function(btn){btn.addEventListener("click",function(){var id=btn.getAttribute("data-ns-tab");btns.forEach(function(b){b.classList.toggle("is-active",b===btn);});panels.forEach(function(p){p.classList.toggle("is-active",p.getAttribute("data-ns-panel")===id);});});});`
  );

  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  const addTab = () =>
    onUpdate({
      tabs: [
        ...config.tabs,
        sampleTab(`Tab ${config.tabs.length + 1}`, "New tab heading"),
      ],
    });
  const removeTab = (id) =>
    onUpdate({ tabs: config.tabs.filter((t) => t.id !== id) });
  const moveTab = (id, dir) => {
    const idx = config.tabs.findIndex((t) => t.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= config.tabs.length) return;
    const arr = [...config.tabs];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    onUpdate({ tabs: arr });
  };
  const updateTab = (id, patch) =>
    onUpdate({
      tabs: config.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });

  return (
    <div className="space-y-5">
      <Group title="Theme">
        <ToggleField
          label="Full bleed (100vw)"
          description="Background spans full viewport"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="tabs-full-bleed"
        />
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="tabs-bg"
        />
        <ColorField
          label="Accent (active tab + heading)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="tabs-accent"
        />
        <ColorField
          label="Body text"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="tabs-body"
        />
        <SliderField
          label="Vertical padding"
          value={config.paddingY}
          min={20}
          max={120}
          suffix="px"
          onChange={(v) => onUpdate({ paddingY: v })}
          testid="tabs-pad"
        />
      </Group>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Tabs ({config.tabs.length})
        </h3>
        <ListEditor
          items={config.tabs}
          onAdd={addTab}
          onRemove={removeTab}
          onMove={moveTab}
          addLabel="Add tab"
          testidPrefix="tab"
          renderRow={(t) => (
            <p className="text-sm font-medium text-slate-900 truncate">
              {t.label || "Untitled tab"}
            </p>
          )}
          renderForm={(t) => (
            <>
              <TextField
                label="Tab label"
                value={t.label}
                onChange={(v) => updateTab(t.id, { label: v })}
                testid={`tab-label-${t.id}`}
              />
              <TextField
                label="Heading"
                value={t.heading}
                onChange={(v) => updateTab(t.id, { heading: v })}
                testid={`tab-heading-${t.id}`}
              />
              <TextAreaField
                label="Body (use blank line between paragraphs)"
                value={t.body}
                onChange={(v) => updateTab(t.id, { body: v })}
                rows={5}
                testid={`tab-body-${t.id}`}
              />
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Image
                </Label>
                <ImageUpload
                  value={t.image}
                  onChange={(v) => updateTab(t.id, { image: v })}
                  testid={`tab-image-${t.id}`}
                  compact
                />
              </div>
            </>
          )}
        />
      </div>
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

export const tabs = {
  id: ID,
  name: "Tabs Section",
  description: "Toggle buttons with split image+copy",
  icon: SquareStack,
  defaults,
  render,
  FormPanel,
};
