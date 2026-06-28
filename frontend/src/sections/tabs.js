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
  padTopOf,
  padBotOf,
  padXOf,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import { TextField, TextAreaField, SelectField, SliderField, ToggleField } from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";
const ID = "tabs";

const sampleTab = (label, heading, body, image) => ({
  id: makeUid(),
  label,
  heading,
  body,
  image,
  imageAlt: "",
  // Optional image link — when imageUrl is set the image renders inside
  // an <a> tag so users can click it. Hidden behind a toggle in the
  // editor so the URL/same-tab fields only appear when needed.
  imageUrl: "",
  imageOpenInSameTab: false,
  // Per-tab CTAs — both optional. Empty label = button is dropped from
  // render. Primary inherits the section accent colour; secondary is an
  // outlined variant for the "Learn more"-style secondary action.
  primaryLabel: "",
  primaryUrl: "",
  primaryOpenInSameTab: false,
  secondaryLabel: "",
  secondaryUrl: "",
  secondaryOpenInSameTab: false,
});

const defaults = () => ({
  uid: makeUid(),
  bgColor: "#f7f7f8",
  accentColor: "#E01839",
  bodyColor: "#333333",
  // Section header (eyebrow + heading + intro) — all optional. When
  // none are set the renderer drops the header block entirely so the
  // section starts straight at the tabs row (current behaviour).
  eyebrow: "",
  heading: "",
  subheading: "",
  // Header alignment (desktop): "left" | "center" | "right". Keeps
  // `tabsAlign` independent so the tab row and the section title can
  // align differently.
  headerAlign: "left",
  paddingY: 60,
  paddingTop: 60,
  paddingBottom: 60,
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
    `--ns-pad-t:${padTopOf(cfg, 60)}px;--ns-pad-b:${padBotOf(cfg, 60)}px;--ns-pad-x:${padXOf(cfg)}px`,
    `--ns-heading-size:${num(cfg.headingSize, 30)}px`,
  ].join(";");

  const tabs = cfg.tabs || [];

  const buttonsHtml = tabs
    .map(
      (tab, i) =>
        `<button class="ns-tab${i === 0 ? " is-active" : ""}" type="button" role="tab" aria-selected="${i === 0 ? "true" : "false"}" aria-controls="ns-panel-${escAttr(tab.id)}" id="ns-tab-${escAttr(tab.id)}" data-ns-tab="${escAttr(tab.id)}" data-ns-list="tab" data-ns-item="${i}">${escHtml(tab.label)}</button>`
    )
    .join("");

  const buttonHtml = (label, url, sameTab, variant, bgOverride, textOverride) => {
    if (!label) return "";
    const target = sameTab ? "_self" : "_blank";
    const rel = sameTab ? "" : ' rel="noopener noreferrer"';
    // Per-button colour override — inline style overrides the CSS rule
    // values that come from `--ns-accent`. Empty override = use CSS var.
    const styleParts = [];
    if (bgOverride) {
      if (variant === "primary") {
        styleParts.push(`background:${safeColor(bgOverride, "")};border-color:${safeColor(bgOverride, "")}`);
      } else {
        styleParts.push(`color:${safeColor(bgOverride, "")};border-color:${safeColor(bgOverride, "")}`);
      }
    }
    if (textOverride && variant === "primary") {
      styleParts.push(`color:${safeColor(textOverride, "")}`);
    }
    const style = styleParts.length ? ` style="${styleParts.join(";")}"` : "";
    return `<a class="ns-btn ns-btn-${variant}" href="${escAttr(
      safeUrl(url) || "#"
    )}" target="${target}"${rel}${style}>${escHtml(label)}</a>`;
  };

  const panelsHtml = tabs
    .map((tab, i) => {
      const paragraphs = String(tab.body || "")
        .split(/\n\s*\n/)
        .filter((p) => p.trim())
        .map((p) => `<p>${escHtml(p)}</p>`)
        .join("");
      const img = safeUrl(tab.image);
      const primaryBtn = buttonHtml(
        tab.primaryLabel,
        tab.primaryUrl,
        tab.primaryOpenInSameTab,
        "primary",
        tab.primaryBgColor,
        tab.primaryTextColor
      );
      const secondaryBtn = buttonHtml(
        tab.secondaryLabel,
        tab.secondaryUrl,
        tab.secondaryOpenInSameTab,
        "secondary",
        tab.secondaryBgColor,
        null
      );
      const ctasHtml =
        primaryBtn || secondaryBtn
          ? `<div class="ns-ctas">${primaryBtn}${secondaryBtn}</div>`
          : "";
      const imgTag = img ? `<img src="${escAttr(img)}" alt="${escAttr(tab.imageAlt || tab.label || "")}"/>` : "";
      const imgUrl = safeUrl(tab.imageUrl);
      const imgHtml = imgTag && imgUrl
        ? `<a class="ns-image-link" href="${escAttr(imgUrl)}" target="${tab.imageOpenInSameTab ? "_self" : "_blank"}"${tab.imageOpenInSameTab ? "" : ' rel="noopener noreferrer"'}>${imgTag}</a>`
        : imgTag;
      return `<div class="ns-panel${i === 0 ? " is-active" : ""}" role="tabpanel" id="ns-panel-${escAttr(tab.id)}" aria-labelledby="ns-tab-${escAttr(tab.id)}" data-ns-panel="${escAttr(tab.id)}">
  <div class="ns-split">
    <div class="ns-copy">
      <h2 class="ns-heading">${escHtml(tab.heading)}</h2>
      ${paragraphs}
      ${ctasHtml}
    </div>
    <div class="ns-image">${imgHtml}</div>
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

  // Section header (eyebrow + title + intro). Each field is optional;
  // the whole `<header>` is dropped when none are set so existing
  // configurations render identically to before. Each paragraph in
  // the intro is split on a blank line so users can write multi-para
  // intros in the textarea.
  const eyebrowHtml = cfg.eyebrow
    ? `<p class="ns-eyebrow">${escHtml(cfg.eyebrow)}</p>`
    : "";
  const sectionHeadingHtml = cfg.heading
    ? `<h2 class="ns-section-heading">${escHtml(cfg.heading)}</h2>`
    : "";
  const subHtml = cfg.subheading
    ? String(cfg.subheading)
        .split(/\n\s*\n/)
        .filter((p) => p.trim())
        .map((p) => `<p class="ns-section-sub">${escHtml(p)}</p>`)
        .join("")
    : "";
  const headerHtml =
    eyebrowHtml || sectionHeadingHtml || subHtml
      ? `<header class="ns-section-head" data-ns-group="header"><div class="ns-section-head-inner">${eyebrowHtml}${sectionHeadingHtml}${subHtml}</div></header>`
      : "";

  const headerAlign =
    cfg.headerAlign === "center"
      ? "center"
      : cfg.headerAlign === "right"
        ? "right"
        : "left";

  // When image lives on the left we flip the two grid columns. We keep
  // the source order copy → image (same as before) so the snippet's DOM
  // remains stable for analytics/SEO; CSS does the visual swap.
  const imageOnLeft = cfg.imagePosition === "left";

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad-t) var(--ns-pad-x) var(--ns-pad-b);width:100%;background:var(--ns-bg)}
.${cls} .ns-inner{max-width:1200px;margin:0 auto}
.${cls} .ns-section-head{margin-bottom:32px;text-align:${headerAlign}}
.${cls} .ns-section-head-inner{max-width:720px;${headerAlign === "center" ? "margin:0 auto;" : headerAlign === "right" ? "margin:0 0 0 auto;" : ""}}
.${cls} .ns-section-head .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-accent);margin:0 0 12px}
.${cls} .ns-section-heading{font-size:var(--ns-heading-size,30px);font-weight:600;letter-spacing:-0.01em;line-height:1.15;color:var(--ns-accent);margin:0 0 12px}
.${cls} .ns-section-sub{font-size:16px;line-height:1.6;color:var(--ns-body);margin:0 0 10px}
.${cls} .ns-section-sub:last-child{margin-bottom:0}
.${cls} .ns-tabs-row{display:flex;gap:12px;margin-bottom:30px;flex-wrap:wrap;justify-content:${tabsAlign}}
.${cls} .ns-tab{border:1px solid #e4e4e7;background:#fff;color:var(--ns-accent);padding:12px 18px;border-radius:6px;font-weight:600;font-size:14px;transition:background .15s ease,color .15s ease}
.${cls} .ns-tab:hover{background:#f9fafb}
.${cls} .ns-tab.is-active{background:var(--ns-accent);color:#fff;border-color:var(--ns-accent)}
.${cls} .ns-panel{display:none}
.${cls} .ns-panel.is-active{display:block}
.${cls} .ns-split{display:grid;grid-template-columns:${imageOnLeft ? ".9fr 1.1fr" : "1.1fr .9fr"};gap:40px;align-items:center}
${imageOnLeft ? `.${cls} .ns-copy{order:2}.${cls} .ns-image{order:1}` : ""}
.${cls} .ns-heading{font-size:var(--ns-heading-size,30px);font-weight:600;color:var(--ns-accent);margin:0 0 16px;line-height:1.2}
.${cls} .ns-copy p{font-size:16px;color:var(--ns-body);line-height:1.6;margin:0}
.${cls} .ns-copy p + p{margin-top:16px}
.${cls} .ns-ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}
.${cls} .ns-btn{display:inline-flex;align-items:center;justify-content:center;height:46px;padding:0 22px;font-size:14px;font-weight:600;border-radius:${num(cfg.buttonRadius, 8)}px;text-decoration:none;transition:transform .15s ease,filter .15s ease,background .15s ease,color .15s ease,border-color .15s ease}
.${cls} .ns-btn:hover{transform:translateY(-1px);filter:brightness(1.05)}
.${cls} .ns-tab:focus-visible{outline:2px solid var(--ns-accent);outline-offset:2px}
.${cls} .ns-btn:focus-visible{outline:2px solid var(--ns-accent);outline-offset:2px}
.${cls} .ns-btn-primary{background:var(--ns-accent);color:#fff;border:1px solid var(--ns-accent)}
.${cls} .ns-btn-secondary{background:transparent;color:var(--ns-accent);border:1px solid var(--ns-accent)}
.${cls} .ns-btn-secondary:hover{background:var(--ns-accent);color:#fff}
.${cls} .ns-image img{width:100%;border-radius:6px;display:block}
.${cls} .ns-image-link{display:block;line-height:0;transition:transform .15s ease,filter .15s ease}
.${cls} .ns-image-link:hover{transform:translateY(-1px);filter:brightness(1.03)}
@media (max-width:768px){.${cls} .ns-split{grid-template-columns:1fr;gap:24px}.${cls} .ns-copy{order:2}.${cls} .ns-image{order:1}.${cls} .ns-heading{margin:0 0 12px}.${cls} .ns-ctas{flex-direction:column;align-items:stretch}.${cls} .ns-btn{width:100%}}
`.trim();

  const html = `<section class="ns-tabs ${cls}${fullBleedClass(cfg)}" style="${styleVars}" data-ns-group="defaults">
  <div class="ns-inner">
    ${headerHtml}<div class="ns-tabs-row" role="tablist">${buttonsHtml}</div>
    <div class="ns-panels">${panelsHtml}</div>
  </div>
</section>`;

  const js = iife(
    cls,
    `var btns=root.querySelectorAll(".ns-tab");var panels=root.querySelectorAll(".ns-panel");function activate(i){if(i<0||i>=btns.length)return;btns.forEach(function(b,j){b.classList.toggle("is-active",j===i);b.setAttribute("aria-selected",j===i?"true":"false");});var id=btns[i]&&btns[i].getAttribute("data-ns-tab");panels.forEach(function(p){p.classList.toggle("is-active",p.getAttribute("data-ns-panel")===id);});}activate(0);btns.forEach(function(btn,i){btn.addEventListener("click",function(){activate(i);});});window.addEventListener("message",function(e){var d=e&&e.data;if(!d||typeof d!=="object")return;if(d.type==="ns-focus-item"&&d.list==="tab"&&typeof d.index==="number"){activate(d.index);}});`
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
  const duplicateTab = (id) => {
    const idx = config.tabs.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const clone = { ...config.tabs[idx], id: makeUid() };
    const arr = [...config.tabs];
    arr.splice(idx + 1, 0, clone);
    onUpdate({ tabs: arr });
  };

  return (
    <FormAccordion sectionType="tabs">
      <Group title="Section header" value="section-header">
        <p className="text-[11px] text-slate-500 mb-2 leading-snug">
          Optional eyebrow / title / intro shown above the tab row.
          Leave all three empty to hide the header entirely.
        </p>
        <TextField
          label="Eyebrow (small label above title)"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          placeholder="e.g. Compare plans"
          testid="tabs-eyebrow"
        />
        <TextField
          label="Title"
          value={config.heading || ""}
          onChange={(v) => onUpdate({ heading: v })}
          placeholder="e.g. Choose the right plan for you"
          testid="tabs-heading"
        />
        <TextAreaField
          label="Intro"
          value={config.subheading || ""}
          onChange={(v) => onUpdate({ subheading: v })}
          placeholder="One or two short sentences. Leave a blank line between paragraphs to split."
          rows={3}
          testid="tabs-subheading"
        />
        <SelectField
          label="Header alignment"
          value={config.headerAlign || "left"}
          onChange={(v) => onUpdate({ headerAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          testid="tabs-header-align"
        />
      </Group>

      <Group title="Defaults" value="defaults">
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
        <SliderField
          label="Heading size"
          value={Number(config.headingSize) || 30}
          min={20}
          max={72}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="tabs-heading-size"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={60}
          max={120}
          testidPrefix="tabs"
        />
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="tabs-full-bleed"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
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
          onDuplicate={duplicateTab}
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
              <TextField
                label="Image alt text (optional)"
                value={t.imageAlt || ""}
                onChange={(v) => updateTab(t.id, { imageAlt: v })}
                placeholder="Falls back to the tab label"
                testid={`tab-image-alt-${t.id}`}
              />
              <ToggleField
                label="Link image"
                description="Make the image clickable"
                checked={!!t.imageUrl}
                onChange={(v) => {
                  if (v) {
                    updateTab(t.id, { imageUrl: t.imageUrl || "#" });
                  } else {
                    updateTab(t.id, { imageUrl: "", imageOpenInSameTab: false });
                  }
                }}
                testid={`tab-image-link-toggle-${t.id}`}
              />
              {t.imageUrl ? (
                <>
                  <TextField
                    label="Image URL"
                    value={t.imageUrl || ""}
                    onChange={(v) => updateTab(t.id, { imageUrl: v })}
                    placeholder="https://example.com/product"
                    testid={`tab-image-url-${t.id}`}
                  />
                  <ToggleField
                    label="Open in same tab"
                    checked={!!t.imageOpenInSameTab}
                    onChange={(v) => updateTab(t.id, { imageOpenInSameTab: v })}
                    testid={`tab-image-same-tab-${t.id}`}
                  />
                </>
              ) : null}

              <div className="pt-2 border-t border-slate-200 mt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Primary button (optional)
                </p>
                <TextField
                  label="Label (leave blank to hide)"
                  value={t.primaryLabel || ""}
                  onChange={(v) => updateTab(t.id, { primaryLabel: v })}
                  placeholder="Request a conversation"
                  testid={`tab-primary-label-${t.id}`}
                />
                {t.primaryLabel ? (
                  <>
                    <TextField
                      label="URL"
                      value={t.primaryUrl || ""}
                      onChange={(v) => updateTab(t.id, { primaryUrl: v })}
                      placeholder="https://example.com/contact"
                      testid={`tab-primary-url-${t.id}`}
                    />
                    <ToggleField
                      label="Open in same tab"
                      checked={!!t.primaryOpenInSameTab}
                      onChange={(v) => updateTab(t.id, { primaryOpenInSameTab: v })}
                      testid={`tab-primary-same-tab-${t.id}`}
                    />
                  </>
                ) : null}
              </div>

              <div className="pt-2 border-t border-slate-200 mt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Secondary button (optional)
                </p>
                <TextField
                  label="Label (leave blank to hide)"
                  value={t.secondaryLabel || ""}
                  onChange={(v) => updateTab(t.id, { secondaryLabel: v })}
                  placeholder="Learn more"
                  testid={`tab-secondary-label-${t.id}`}
                />
                {t.secondaryLabel ? (
                  <>
                    <TextField
                      label="URL"
                      value={t.secondaryUrl || ""}
                      onChange={(v) => updateTab(t.id, { secondaryUrl: v })}
                      placeholder="https://example.com/learn"
                      testid={`tab-secondary-url-${t.id}`}
                    />
                    <ToggleField
                      label="Open in same tab"
                      checked={!!t.secondaryOpenInSameTab}
                      onChange={(v) => updateTab(t.id, { secondaryOpenInSameTab: v })}
                      testid={`tab-secondary-same-tab-${t.id}`}
                    />
                  </>
                ) : null}
              </div>
            </>
          )}
        />
      </div>
    </FormAccordion>
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
