/**
 * Logo Strip — auto-scrolling infinite logo bar.
 * JS pads the base set so it's ≥ viewport width, then clones it once.
 * Pure-CSS animation loops translateX(0 → -50%), so the clone lands
 * where the original was — seamless without any JS measurement.
 */
import { Building2 } from "lucide-react";
import {
  baseReset,
  escAttr,
  footerLinkCss,
  footerLinkHtml,
  fullBleedClass,
  iife,
  makeUid,
  num,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import { TextField, SliderField, ToggleField } from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import FooterLinkEditor from "@/components/FooterLinkEditor";
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
const ID = "logos";

const defaults = () => ({
  uid: makeUid(),
  speedSeconds: 40,
  itemHeight: 50,
  itemWidth: 140,
  itemGap: 24,
  paddingY: 30,
  bgColor: "#ffffff",
  accentColor: "#E01839",
  fullBleed: true,
  greyscale: false,
  // Empty by default — users add their own logos via the editor's
  // "Add logo" button. The strip renders a "no logos yet" hint when
  // the array is empty (see render() below).
  logos: [],
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-logos-${uid}`;

  const styleVars = [
    `--ns-speed:${num(cfg.speedSeconds, 40)}s`,
    `--ns-h:${num(cfg.itemHeight, 50)}px`,
    `--ns-w:${num(cfg.itemWidth, 140)}px`,
    `--ns-gap:${num(cfg.itemGap, 24)}px`,
    `--ns-pad:${num(cfg.paddingY, 30)}px`,
    `--ns-bg:${safeColor(cfg.bgColor, "#ffffff")}`,
  ].join(";");

  const itemsHtml = (cfg.logos || [])
    .map((logo) => {
      const img = safeUrl(logo.image);
      const imgTag = `<img src="${escAttr(img)}" alt="${escAttr(logo.alt || "")}"/>`;
      // Wrap in an <a> only when a link is set. safeUrl rejects javascript:
      // and other unsafe schemes; alt text doubles as accessible label.
      const linkHref = (logo.link || "").trim();
      const inner = linkHref
        ? `<a href="${escAttr(safeUrl(linkHref))}" target="_blank" rel="noopener noreferrer" aria-label="${escAttr(logo.alt || "Visit link")}">${imgTag}</a>`
        : imgTag;
      return `<div class="ns-item" data-ns-original>${inner}</div>`;
    })
    .join("");

  // Animation name is suffixed with uid so multiple instances don't collide
  const animName = `nsLogoScroll_${uid.replace(/[^a-z0-9]/gi, "")}`;

  // Optional greyscale-until-hover. Applies to both bare <img> and the
  // <img> inside an <a>. Hover state covers both pointer hover (mouse)
  // and keyboard focus on the link wrapper for a11y.
  const greyCss = cfg.greyscale
    ? `
.${cls} .ns-item img{filter:grayscale(100%);opacity:0.85;transition:filter 0.35s ease, opacity 0.35s ease}
.${cls} .ns-item:hover img,.${cls} .ns-item a:focus-visible img{filter:none;opacity:1}
`.trim()
    : "";

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad) 0;width:100%;background:var(--ns-bg);overflow:hidden}
.${cls} .ns-track{display:flex;width:max-content;animation:${animName} var(--ns-speed) linear infinite;will-change:transform}
.${cls} .ns-item{flex:0 0 auto;width:var(--ns-w);display:flex;justify-content:center;align-items:center;margin:0 calc(var(--ns-gap) / 2)}
.${cls} .ns-item img{height:var(--ns-h);width:auto;object-fit:contain}
.${cls} .ns-item a{display:flex;align-items:center;justify-content:center;width:100%;height:100%;text-decoration:none;outline-offset:4px}
@keyframes ${animName}{to{transform:translateX(-50%)}}
.${cls}:hover .ns-track{animation-play-state:paused}
${greyCss}
${footerLinkCss(cls, safeColor(cfg.accentColor, "#E01839"))}
`.trim();

  const flHtml = footerLinkHtml(cfg, "center");

  const html = `<section class="ns-logos ${cls}${fullBleedClass(cfg)}" style="${styleVars}">
  <div class="ns-track" data-ns-track>${itemsHtml}</div>${flHtml}
</section>`;

  // Infinite marquee pattern: ensure the base set covers the viewport,
  // then clone it once. CSS animates translateX(0 → -50%), which lands
  // the clone exactly where the original was — seamless loop, pure CSS.
  const js = iife(
    cls,
    `var track=root.querySelector("[data-ns-track]");if(!track)return;var origItems=track.querySelectorAll("[data-ns-original]");if(!origItems.length)return;var orig=Array.prototype.map.call(origItems,function(el){return el.outerHTML;}).join("");var base=orig;track.innerHTML=base;var safety=0;while(track.scrollWidth<window.innerWidth&&safety<10){base+=orig;track.innerHTML=base;safety++;}track.innerHTML=base+base;`
  );

  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  const addLogo = () =>
    onUpdate({
      logos: [
        ...config.logos,
        { id: makeUid(), image: "", alt: "Logo", link: "" },
      ],
    });
  const removeLogo = (id) =>
    onUpdate({ logos: config.logos.filter((l) => l.id !== id) });
  const moveLogo = (id, dir) => {
    const idx = config.logos.findIndex((l) => l.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= config.logos.length) return;
    const arr = [...config.logos];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    onUpdate({ logos: arr });
  };
  const updateLogo = (id, patch) =>
    onUpdate({
      logos: config.logos.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });

  return (
    <FormAccordion sectionType="logos">
      <Group title="Settings">
        <ToggleField
          label="Make wide"
          description="Stretch strip to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="logos-full-bleed"
        />
        <ToggleField
          label="Greyscale until hover"
          description="Render every logo in greyscale; reveal full colour when the cursor lands on it."
          checked={!!config.greyscale}
          onChange={(v) => onUpdate({ greyscale: v })}
          testid="logos-greyscale"
        />
        <SliderField
          label="Scroll speed"
          value={config.speedSeconds}
          min={10}
          max={120}
          suffix="s per loop"
          onChange={(v) => onUpdate({ speedSeconds: v })}
          testid="logos-speed"
        />
        <SliderField
          label="Logo height"
          value={config.itemHeight}
          min={20}
          max={120}
          suffix="px"
          onChange={(v) => onUpdate({ itemHeight: v })}
          testid="logos-h"
        />
        <SliderField
          label="Logo cell width"
          value={config.itemWidth}
          min={80}
          max={260}
          suffix="px"
          onChange={(v) => onUpdate({ itemWidth: v })}
          testid="logos-w"
        />
        <SliderField
          label="Gap"
          value={config.itemGap}
          min={0}
          max={80}
          suffix="px"
          onChange={(v) => onUpdate({ itemGap: v })}
          testid="logos-gap"
        />
        <SliderField
          label="Vertical padding"
          value={config.paddingY}
          min={0}
          max={80}
          suffix="px"
          onChange={(v) => onUpdate({ paddingY: v })}
          testid="logos-pad"
        />
        {/* eslint-disable-next-line */}
      </Group>
      <Group title="Theme">
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="logos-bg"
        />
        <ColorField
          label="Accent (footer link)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="logos-accent"
        />
      </Group>
      <FooterLinkEditor
        value={config.footerLink}
        onChange={(v) => onUpdate({ footerLink: v })}
        testidPrefix="logos-footer-link"
      />
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Logos ({config.logos.length})
        </h3>
        <ListEditor
          items={config.logos}
          onAdd={addLogo}
          onRemove={removeLogo}
          onMove={moveLogo}
          addLabel="Add logo"
          testidPrefix="logo"
          renderRow={(l) => (
            <div className="flex items-center gap-2">
              <div className="w-10 h-7 rounded-sm bg-slate-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {l.image && (
                  <img
                    src={l.image}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">
                {l.alt || "Untitled"}
              </p>
            </div>
          )}
          renderForm={(l) => (
            <>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Logo image
                </Label>
                <ImageUpload
                  value={l.image}
                  onChange={(v) => updateLogo(l.id, { image: v })}
                  testid={`logo-image-${l.id}`}
                  compact
                />
              </div>
              <TextField
                label="Alt text"
                value={l.alt}
                onChange={(v) => updateLogo(l.id, { alt: v })}
                testid={`logo-alt-${l.id}`}
              />
              <TextField
                label="Link (optional)"
                placeholder="https://example.com"
                value={l.link || ""}
                onChange={(v) => updateLogo(l.id, { link: v })}
                testid={`logo-link-${l.id}`}
              />
            </>
          )}
        />
      </div>
    </FormAccordion>
  );
}

export const logos = {
  id: ID,
  name: "Logo Strip",
  description: "Auto-scrolling brand logos",
  icon: Building2,
  defaults,
  render,
  FormPanel,
};
