/**
 * Grid section — N rectangular cells, each optionally linked + with an image.
 * Empty cells render as a coloured placeholder; cells with an image render as
 * an `<a>` wrapping the image so users can link them anywhere.
 */
import { LayoutGrid } from "lucide-react";
import {
  baseReset,
  escAttr,
  fullBleedClass,
  iife,
  makeUid,
  safeUrl,
  wrapSnippet,
} from "./shared";
import {
  TextField,
  SliderField,
  SelectField,
  ToggleField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import { Label } from "@/components/ui/label";

const ID = "placeholder";

const blankItem = () => ({
  id: makeUid(),
  image: "",
  link: "",
  alt: "",
  openInSameTab: false,
});

const defaults = () => ({
  uid: makeUid(),
  columns: 2,
  rows: 2,
  itemHeight: 180,
  bgColor: "#fafafa",
  borderRadius: 6,
  paddingY: 60,
  gap: 20,
  fullBleed: false,
  items: [blankItem(), blankItem(), blankItem(), blankItem()],
});

function render(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-placeholder-${uid}`;

  const cols = Math.max(1, Number(cfg.columns) || 1);
  const rows = Math.max(1, Number(cfg.rows) || 1);
  const total = cols * rows;

  const styleVars = [
    `--ns-cols:${cols}`,
    `--ns-rows:${rows}`,
    `--ns-h:${cfg.itemHeight}px`,
    `--ns-bg:${cfg.bgColor}`,
    `--ns-r:${cfg.borderRadius}px`,
    `--ns-pad:${cfg.paddingY}px`,
    `--ns-gap:${cfg.gap}px`,
  ].join(";");

  // Take first `total` items; pad with empty cells if shorter.
  const items = (cfg.items || []).slice(0, total);
  while (items.length < total) items.push({});

  const itemsHtml = items
    .map((item) => {
      const img = safeUrl(item.image);
      const link = safeUrl(item.link);
      const alt = escAttr(item.alt || "");
      const target = item.openInSameTab ? "_self" : "_blank";
      const rel = item.openInSameTab ? "" : ' rel="noopener noreferrer"';

      if (img && link) {
        return `<a class="ns-cell ns-cell-link" href="${escAttr(link)}" target="${target}"${rel}><img src="${escAttr(img)}" alt="${alt}"/></a>`;
      }
      if (img) {
        return `<div class="ns-cell"><img src="${escAttr(img)}" alt="${alt}"/></div>`;
      }
      if (link) {
        return `<a class="ns-cell ns-cell-empty ns-cell-link" href="${escAttr(link)}" target="${target}"${rel}></a>`;
      }
      return `<div class="ns-cell ns-cell-empty"></div>`;
    })
    .join("");

  const css = `
${baseReset(cls)}
.${cls}{padding:var(--ns-pad) 20px;width:100%;background:#fff}
.${cls} .ns-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(var(--ns-cols),1fr);grid-auto-rows:var(--ns-h);gap:var(--ns-gap)}
.${cls} .ns-cell{height:var(--ns-h);border-radius:var(--ns-r);overflow:hidden;display:block;background:var(--ns-bg)}
.${cls} .ns-cell img{width:100%;height:100%;object-fit:cover;display:block}
.${cls} .ns-cell-link{transition:transform .2s ease,box-shadow .2s ease;cursor:pointer}
.${cls} .ns-cell-link:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
.${cls} .ns-cell-empty{background:var(--ns-bg)}
@media (max-width:768px){.${cls} .ns-grid{grid-template-columns:1fr}}
`.trim();

  const html = `<section class="ns-placeholder ${cls}${fullBleedClass(cfg)}" style="${styleVars}">
  <div class="ns-grid">${itemsHtml}</div>
</section>`;

  const js = iife(cls, `/* static */`);
  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  const items = config.items || [];
  const cols = Math.max(1, Number(config.columns) || 1);
  const rows = Math.max(1, Number(config.rows) || 1);
  const visible = cols * rows;

  const addItem = () => onUpdate({ items: [...items, blankItem()] });
  const removeItem = (id) =>
    onUpdate({ items: items.filter((i) => i.id !== id) });
  const moveItem = (id, dir) => {
    const idx = items.findIndex((i) => i.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= items.length) return;
    const arr = [...items];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    onUpdate({ items: arr });
  };
  const updateItem = (id, patch) =>
    onUpdate({
      items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="placeholder-full-bleed"
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Columns"
            value={config.columns}
            onChange={(v) => onUpdate({ columns: Number(v) })}
            options={[
              { value: 1, label: "1" },
              { value: 2, label: "2" },
              { value: 3, label: "3" },
              { value: 4, label: "4" },
              { value: 5, label: "5" },
              { value: 6, label: "6" },
            ]}
            testid="placeholder-cols"
          />
          <SelectField
            label="Rows"
            value={config.rows}
            onChange={(v) => onUpdate({ rows: Number(v) })}
            options={[
              { value: 1, label: "1" },
              { value: 2, label: "2" },
              { value: 3, label: "3" },
              { value: 4, label: "4" },
              { value: 5, label: "5" },
              { value: 6, label: "6" },
            ]}
            testid="placeholder-rows"
          />
        </div>
        <SliderField
          label="Item height"
          value={config.itemHeight}
          min={80}
          max={400}
          suffix="px"
          onChange={(v) => onUpdate({ itemHeight: v })}
          testid="placeholder-h"
        />
        <SliderField
          label="Gap"
          value={config.gap}
          min={0}
          max={48}
          suffix="px"
          onChange={(v) => onUpdate({ gap: v })}
          testid="placeholder-gap"
        />
        <SliderField
          label="Border radius"
          value={config.borderRadius}
          min={0}
          max={32}
          suffix="px"
          onChange={(v) => onUpdate({ borderRadius: v })}
          testid="placeholder-radius"
        />
        <SliderField
          label="Vertical padding"
          value={config.paddingY}
          min={10}
          max={120}
          suffix="px"
          onChange={(v) => onUpdate({ paddingY: v })}
          testid="placeholder-pad"
        />
        <ColorField
          label="Empty cell colour"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="placeholder-bg"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cells
          </h3>
          <span
            className="text-xs text-slate-500"
            data-testid="placeholder-cells-hint"
          >
            Showing {Math.min(items.length, visible)} of {visible}
            {items.length > visible
              ? ` (${items.length - visible} extra)`
              : items.length < visible
                ? ` (+${visible - items.length} empty)`
                : ""}
          </span>
        </div>
        <ListEditor
          items={items}
          onAdd={addItem}
          onRemove={removeItem}
          onMove={moveItem}
          addLabel="Add cell"
          testidPrefix="grid-cell"
          renderRow={(item, i) => (
            <div className="flex items-center gap-2">
              <div className="w-10 h-7 rounded-sm bg-slate-100 flex-shrink-0 overflow-hidden">
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <p
                className={`text-sm font-medium truncate ${
                  i >= visible ? "text-slate-400" : "text-slate-900"
                }`}
              >
                Cell {i + 1}
                {i >= visible ? " (hidden)" : ""}
              </p>
              {item.link && (
                <span className="text-xs text-slate-400 ml-auto truncate max-w-[80px]">
                  → {item.link}
                </span>
              )}
            </div>
          )}
          renderForm={(item) => (
            <>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Image
                </Label>
                <ImageUpload
                  value={item.image}
                  onChange={(v) => updateItem(item.id, { image: v })}
                  testid={`grid-cell-image-${item.id}`}
                  compact
                />
              </div>
              <TextField
                label="Alt text"
                value={item.alt}
                onChange={(v) => updateItem(item.id, { alt: v })}
                testid={`grid-cell-alt-${item.id}`}
              />
              <TextField
                label="Link"
                value={item.link}
                onChange={(v) => updateItem(item.id, { link: v })}
                placeholder="https://"
                testid={`grid-cell-link-${item.id}`}
              />
              <ToggleField
                label="Open in same tab"
                checked={item.openInSameTab}
                onChange={(v) => updateItem(item.id, { openInSameTab: v })}
                testid={`grid-cell-same-tab-${item.id}`}
              />
            </>
          )}
        />
      </div>
    </div>
  );
}

export const placeholder = {
  id: ID,
  name: "Grid",
  description: "Image + link grid (or placeholder boxes)",
  icon: LayoutGrid,
  defaults,
  render,
  FormPanel,
};
