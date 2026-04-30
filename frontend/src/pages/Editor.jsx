import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { makeDefaultConfig, makeUid } from "@/lib/defaultConfig";
import { renderHero, renderPreviewDoc } from "@/lib/heroRender";
import ImageUpload from "@/components/ImageUpload";
import ColorField from "@/components/ColorField";

export default function Editor() {
  const [config, setConfig] = useState(() => makeDefaultConfig());
  const [activeSlideId, setActiveSlideId] = useState(null);
  const [previewWidth, setPreviewWidth] = useState("desktop");

  useEffect(() => {
    if (!activeSlideId && config.slides[0]) {
      setActiveSlideId(config.slides[0].id);
    }
  }, [config.slides, activeSlideId]);

  const previewDoc = useMemo(() => renderPreviewDoc(config), [config]);
  const snippet = useMemo(() => renderHero(config), [config]);

  const updateTheme = (patch) =>
    setConfig((c) => ({ ...c, theme: { ...c.theme, ...patch } }));
  const updateLayout = (patch) =>
    setConfig((c) => ({ ...c, layout: { ...c.layout, ...patch } }));
  const updateSettings = (patch) =>
    setConfig((c) => ({ ...c, settings: { ...c.settings, ...patch } }));

  const addSlide = () => {
    const id = makeUid();
    setConfig((c) => ({
      ...c,
      slides: [
        ...c.slides,
        {
          id,
          title: "New Slide",
          subtitle: "Add a compelling subtitle here.",
          image: "",
          logo: "",
          ctaText: "Shop now",
          ctaLink: "#",
        },
      ],
    }));
    setActiveSlideId(id);
  };
  const removeSlide = (id) =>
    setConfig((c) => ({
      ...c,
      slides: c.slides.filter((s) => s.id !== id),
    }));
  const moveSlide = (id, dir) => {
    setConfig((c) => {
      const idx = c.slides.findIndex((s) => s.id === id);
      const newIdx = idx + dir;
      if (idx < 0 || newIdx < 0 || newIdx >= c.slides.length) return c;
      const slides = [...c.slides];
      const [m] = slides.splice(idx, 1);
      slides.splice(newIdx, 0, m);
      return { ...c, slides };
    });
  };
  const updateSlide = (id, patch) =>
    setConfig((c) => ({
      ...c,
      slides: c.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));

  const copySnippet = async () => {
    // Fresh uid per copy — guarantees each pasted snippet has its own scoped
    // CSS class, even when the user copies the section more than once after
    // editing it. The IIFE is per-instance safe regardless.
    const fresh = { ...config, uid: makeUid() };
    const out = renderHero(fresh);
    try {
      await navigator.clipboard.writeText(out);
      toast.success("HTML snippet copied", {
        description: `${out.length.toLocaleString()} chars · paste into any CMS.`,
      });
    } catch {
      toast.error("Copy failed. Use the manual copy below.");
    }
  };

  const previewWidths = {
    desktop: "100%",
    tablet: "820px",
    mobile: "390px",
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-body text-slate-900">
      {/* Sidebar */}
      <aside
        data-testid="editor-sidebar"
        className="w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 bg-white h-screen overflow-y-auto"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-base font-semibold tracking-tight leading-none">
              Section Builder
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Hero Carousel</p>
          </div>
        </div>

        <Accordion
          type="multiple"
          defaultValue={["slides", "theme", "layout", "settings"]}
          className="px-2"
        >
          {/* Slides */}
          <AccordionItem value="slides" className="border-b border-slate-100">
            <AccordionTrigger
              data-testid="accordion-slides"
              className="px-3 hover:no-underline"
            >
              <span className="flex items-center gap-2 font-heading text-sm font-semibold">
                <Layers className="w-4 h-4" /> Slides
                <span className="text-xs font-normal text-slate-500">
                  ({config.slides.length})
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-4">
              <div className="space-y-2">
                {config.slides.map((slide, idx) => (
                  <SlideRow
                    key={slide.id}
                    slide={slide}
                    index={idx}
                    total={config.slides.length}
                    isActive={activeSlideId === slide.id}
                    onSelect={() => setActiveSlideId(slide.id)}
                    onMoveUp={() => moveSlide(slide.id, -1)}
                    onMoveDown={() => moveSlide(slide.id, 1)}
                    onRemove={() => removeSlide(slide.id)}
                  />
                ))}
                <Button
                  data-testid="add-slide-button"
                  onClick={addSlide}
                  variant="outline"
                  className="w-full mt-2 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add slide
                </Button>
              </div>

              {activeSlideId && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <SlideForm
                    slide={config.slides.find((s) => s.id === activeSlideId)}
                    onUpdate={(patch) => updateSlide(activeSlideId, patch)}
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Theme */}
          <AccordionItem value="theme" className="border-b border-slate-100">
            <AccordionTrigger
              data-testid="accordion-theme"
              className="px-3 hover:no-underline"
            >
              <span className="font-heading text-sm font-semibold">Theme</span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-4 space-y-4">
              <ColorField
                label="Title color"
                value={config.theme.titleColor}
                onChange={(v) => updateTheme({ titleColor: v })}
                testid="theme-title-color"
              />
              <ColorField
                label="Subtitle color"
                value={config.theme.subtitleColor}
                onChange={(v) => updateTheme({ subtitleColor: v })}
                testid="theme-subtitle-color"
              />
              <ColorField
                label="Button background"
                value={config.theme.primaryColor}
                onChange={(v) => updateTheme({ primaryColor: v })}
                testid="theme-primary-color"
              />
              <ColorField
                label="Button text"
                value={config.theme.primaryText}
                onChange={(v) => updateTheme({ primaryText: v })}
                testid="theme-primary-text"
              />
              <ColorField
                label="Overlay color"
                value={config.theme.overlayColor}
                onChange={(v) => updateTheme({ overlayColor: v })}
                testid="theme-overlay-color"
              />
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Overlay opacity
                  </Label>
                  <span className="text-xs text-slate-500">
                    {Math.round(config.theme.overlayOpacity * 100)}%
                  </span>
                </div>
                <Slider
                  data-testid="overlay-opacity-slider"
                  value={[config.theme.overlayOpacity * 100]}
                  onValueChange={(v) =>
                    updateTheme({ overlayOpacity: v[0] / 100 })
                  }
                  max={100}
                  step={1}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Layout */}
          <AccordionItem value="layout" className="border-b border-slate-100">
            <AccordionTrigger
              data-testid="accordion-layout"
              className="px-3 hover:no-underline"
            >
              <span className="font-heading text-sm font-semibold">Layout</span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-4 space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Text alignment
                </Label>
                <Select
                  value={config.layout.textAlign}
                  onValueChange={(v) => updateLayout({ textAlign: v })}
                >
                  <SelectTrigger
                    data-testid="text-align-select"
                    className="mt-2"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SliderField
                label="Section height"
                value={config.layout.height}
                min={320}
                max={800}
                step={10}
                suffix="px"
                onChange={(v) => updateLayout({ height: v })}
                testid="layout-height-slider"
              />
              <SliderField
                label="Content max width"
                value={config.layout.contentMaxWidth}
                min={400}
                max={1200}
                step={20}
                suffix="px"
                onChange={(v) => updateLayout({ contentMaxWidth: v })}
                testid="layout-content-width-slider"
              />
              <SliderField
                label="Border radius"
                value={config.layout.borderRadius}
                min={0}
                max={32}
                step={1}
                suffix="px"
                onChange={(v) => updateLayout({ borderRadius: v })}
                testid="layout-radius-slider"
              />
            </AccordionContent>
          </AccordionItem>

          {/* Settings */}
          <AccordionItem value="settings" className="border-b border-slate-100">
            <AccordionTrigger
              data-testid="accordion-settings"
              className="px-3 hover:no-underline"
            >
              <span className="font-heading text-sm font-semibold">
                Settings
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-6 space-y-4">
              <ToggleField
                label="Autoplay"
                description="Automatically advance slides"
                checked={config.settings.autoplay}
                onChange={(v) => updateSettings({ autoplay: v })}
                testid="autoplay-switch"
              />
              <SliderField
                label="Autoplay interval"
                value={config.settings.interval}
                min={2000}
                max={12000}
                step={500}
                suffix="ms"
                onChange={(v) => updateSettings({ interval: v })}
                testid="autoplay-interval-slider"
                disabled={!config.settings.autoplay}
              />
              <ToggleField
                label="Show arrows"
                description="Previous / next navigation"
                checked={config.settings.showArrows}
                onChange={(v) => updateSettings({ showArrows: v })}
                testid="arrows-switch"
              />
              <ToggleField
                label="Show dots"
                description="Pagination dots"
                checked={config.settings.showDots}
                onChange={(v) => updateSettings({ showDots: v })}
                testid="dots-switch"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </aside>

      {/* Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live preview
            </span>
            <div className="flex items-center bg-slate-100 rounded-md p-0.5">
              {["desktop", "tablet", "mobile"].map((w) => (
                <button
                  key={w}
                  data-testid={`viewport-${w}`}
                  onClick={() => setPreviewWidth(w)}
                  className={`px-3 py-1 text-xs font-medium rounded capitalize transition-colors ${
                    previewWidth === w
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              instance:{" "}
              <code className="font-mono text-slate-600">{config.uid}</code>
            </span>
            <Button
              data-testid="copy-snippet-button"
              onClick={copySnippet}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy HTML Snippet
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div
            className="mx-auto bg-white rounded-md border border-slate-200 overflow-hidden transition-all duration-300"
            style={{
              maxWidth: previewWidths[previewWidth],
              width: "100%",
            }}
            data-testid="preview-container"
          >
            <PreviewFrame doc={previewDoc} />
          </div>

          {/* Snippet drawer */}
          <SnippetDrawer snippet={snippet} onCopy={copySnippet} />
        </div>
      </main>

      <Toaster richColors position="top-center" />
    </div>
  );
}

/* ---------- subcomponents ---------- */

function SlideRow({
  slide,
  index,
  total,
  isActive,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
}) {
  return (
    <div
      data-testid={`slide-row-${index}`}
      className={`group flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer ${
        isActive
          ? "border-slate-900 bg-slate-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
      onClick={onSelect}
    >
      <div className="w-12 h-9 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
        {slide.image ? (
          <img
            src={slide.image}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="w-4 h-4 text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {slide.title || `Slide ${index + 1}`}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {slide.ctaText || "No CTA"}
        </p>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          data-testid={`slide-move-up-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={index === 0}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
        >
          <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          data-testid={`slide-move-down-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={index === total - 1}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
        >
          <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          data-testid={`slide-remove-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      </div>
    </div>
  );
}

function SlideForm({ slide, onUpdate }) {
  if (!slide) return null;
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Background image
        </Label>
        <ImageUpload
          value={slide.image}
          onChange={(url) => onUpdate({ image: url })}
          testid="slide-image-upload"
        />
      </div>
      <div>
        <Label
          htmlFor={`title-${slide.id}`}
          className="text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          Title
        </Label>
        <Input
          id={`title-${slide.id}`}
          data-testid="slide-title-input"
          value={slide.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label
          htmlFor={`subtitle-${slide.id}`}
          className="text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          Subtitle
        </Label>
        <Textarea
          id={`subtitle-${slide.id}`}
          data-testid="slide-subtitle-input"
          value={slide.subtitle}
          onChange={(e) => onUpdate({ subtitle: e.target.value })}
          rows={2}
          className="mt-1.5 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            CTA text
          </Label>
          <Input
            data-testid="slide-cta-text-input"
            value={slide.ctaText}
            onChange={(e) => onUpdate({ ctaText: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            CTA link
          </Label>
          <Input
            data-testid="slide-cta-link-input"
            value={slide.ctaLink}
            onChange={(e) => onUpdate({ ctaLink: e.target.value })}
            placeholder="https://"
            className="mt-1.5"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Logo (optional)
        </Label>
        <ImageUpload
          value={slide.logo}
          onChange={(url) => onUpdate({ logo: url })}
          testid="slide-logo-upload"
          compact
        />
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
  testid,
  disabled,
}) {
  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <div className="flex justify-between mb-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </Label>
        <span className="text-xs text-slate-500">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        data-testid={testid}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function ToggleField({ label, description, checked, onChange, testid }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-sm font-medium text-slate-900">{label}</Label>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <Switch
        data-testid={testid}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}

function PreviewFrame({ doc }) {
  const ref = useRef(null);
  // Use srcDoc — re-renders on every config change. iframe gives us perfect
  // style isolation so the preview matches the snippet output exactly.
  return (
    <iframe
      ref={ref}
      data-testid="preview-iframe"
      title="Live preview"
      srcDoc={doc}
      sandbox="allow-scripts allow-same-origin"
      className="w-full block border-0"
      style={{ height: "640px" }}
    />
  );
}

function SnippetDrawer({ snippet, onCopy }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 mx-auto max-w-5xl">
      <div className="bg-white rounded-md border border-slate-200">
        <button
          data-testid="toggle-snippet-button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <ExternalLink className="w-4 h-4" />
            Generated HTML snippet
            <span className="text-xs text-slate-500 font-normal">
              ({snippet.length.toLocaleString()} chars)
            </span>
          </span>
          <span className="text-xs text-slate-500">
            {open ? "Hide" : "Show"}
          </span>
        </button>
        {open && (
          <div className="border-t border-slate-200">
            <div className="flex items-center justify-between px-5 py-2 bg-slate-50 border-b border-slate-200">
              <span className="text-xs text-slate-500">
                Self-contained · scoped CSS · multi-instance safe
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={onCopy}
                data-testid="copy-snippet-inline-button"
              >
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>
            <pre
              data-testid="snippet-pre"
              className="p-5 text-xs font-mono text-slate-700 overflow-auto max-h-96 bg-slate-900/[0.02] whitespace-pre-wrap break-all"
            >
              {snippet}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
