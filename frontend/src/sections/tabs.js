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
  num,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import { TextField, TextAreaField, SelectField, SliderField, ToggleField } from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import { Label } from "@/components/ui/label";

const ID = "tabs";

const sampleTab = (label, heading, body, image) => ({
  id: makeUid(),
  label,
  heading,
  body,
  image,
});

const defaults = () => ({
  uid: makeUid(),
  bgColor: "#f7f7f8",
  accentColor: "#E01839",
  bodyColor: "#333333",
  paddingY: 60,
  fullBleed: false,
  // Tab-row horizontal alignment: "left" | "center" | "right".
  tabsAlign: "left",
  // Side-of-text the image lives on inside each panel: "left" | "right".
  imagePosition: "right",
  tabs: [
    sampleTab(
      "Essential",
      "Ideal for startups and small businesses",
      "All-in-one eCommerce for the IT and telecom industry — web shop, sales tool and purchasing system in one platform.\n\nGet online with your suppliers, manage your customers, and grow at your own pace.",
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=900&auto=format&fit=crop"
    ),
    sampleTab(
      "Business",
      "Powerful features for small to medium businesses",
      "The perfect solution for IT & telecom retail SMBs. Set up a web shop with seamless integration to your chosen IT distributors.\n\nLower transaction costs and streamlined procurement processes — all customisable to your needs.",
      "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=900&auto=format&fit=crop"
    ),
    sampleTab(
      "Professional",
      "Simplifying B2B IT eCommerce at scale",
      "Advanced add-ons that let you set up a web shop with seamless integration to five or more IT distributors of your choice.\n\nIdeal for medium to large businesses ready to optimise their B2B operations.",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=900&auto=format&fit=crop"
    ),
  ],
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-tabs-${uid}`;

  const styleVars = [
    `--ns-bg:${safeColor(cfg.bgColor, "#ffffff")}`,
    `--ns-accent:${safeColor(cfg.accentColor, "#E01839")}`,
    `--ns-body:${safeColor(cfg.bodyColor, "#1f2937")}`,
    `--ns-pad:${num(cfg.paddingY, 60)}px`,
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

  // Tab-row alignment maps directly to flex justify-content.
  const tabsAlign = cfg.tabsAlign === "center"
    ? "center"
    : cfg.tabsAlign === "right"
      ? "flex-end"
      : "flex-start";

  // When image lives on the left we flip the two grid columns. We keep
  // the source order copy → image (same as before) so the snippet's DOM
  // remains stable for analytics/SEO; CSS does the visual swap.
  const imageOnLeft = cfg.imagePosition === "left";

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad) 20px;width:100%;background:var(--ns-bg)}
.${cls} .ns-inner{max-width:1200px;margin:0 auto}
.${cls} .ns-tabs-row{display:flex;gap:12px;margin-bottom:30px;flex-wrap:wrap;justify-content:${tabsAlign}}
.${cls} .ns-tab{border:1px solid #e4e4e7;background:#fff;color:var(--ns-accent);padding:12px 18px;border-radius:6px;font-weight:600;font-size:14px;transition:background .15s ease,color .15s ease}
.${cls} .ns-tab:hover{background:#f9fafb}
.${cls} .ns-tab.is-active{background:var(--ns-accent);color:#fff;border-color:var(--ns-accent)}
.${cls} .ns-panel{display:none}
.${cls} .ns-panel.is-active{display:block}
.${cls} .ns-split{display:grid;grid-template-columns:${imageOnLeft ? ".9fr 1.1fr" : "1.1fr .9fr"};gap:40px;align-items:center}
${imageOnLeft ? `.${cls} .ns-copy{order:2}.${cls} .ns-image{order:1}` : ""}
.${cls} .ns-heading{font-size:30px;font-weight:600;color:var(--ns-accent);margin:0 0 16px;line-height:1.2}
.${cls} .ns-copy p{font-size:16px;color:var(--ns-body);line-height:1.6;margin:0}
.${cls} .ns-copy p + p{margin-top:16px}
.${cls} .ns-image img{width:100%;border-radius:6px;display:block}
@media (max-width:768px){.${cls} .ns-split{grid-template-columns:1fr}.${cls} .ns-copy{order:1}.${cls} .ns-image{order:2}.${cls} .ns-heading{font-size:24px}}
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
        sampleTab(
          `Tab ${config.tabs.length + 1}`,
          "New tab heading",
          "Add your description here.",
          ""
        ),
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
          label="Make wide"
          description="Stretch background to full viewport width"
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

      <Group title="Layout">
        <SelectField
          label="Tab alignment"
          value={config.tabsAlign || "left"}
          onChange={(v) => onUpdate({ tabsAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          testid="tabs-align"
        />
        <SelectField
          label="Image position"
          value={config.imagePosition || "right"}
          onChange={(v) => onUpdate({ imagePosition: v })}
          options={[
            { value: "right", label: "Right of text" },
            { value: "left", label: "Left of text" },
          ]}
          testid="tabs-image-position"
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
