import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Palette, Type as TypeIcon, RotateCcw, Save } from "lucide-react";
import { api } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { DEFAULT_BRAND_KIT, FONTS, INHERIT_FONT, fontImportUrl } from "@/lib/brandKit";
import { useBrandKit } from "@/lib/BrandKitContext";
import ColorField from "@/components/ColorField";

export default function BrandKitPage() {
  const { brandKit, setBrandKit } = useBrandKit();
  const [draft, setDraft] = useState(brandKit);
  const [saving, setSaving] = useState(false);

  // Re-hydrate on initial fetch / external updates.
  useEffect(() => {
    setDraft(brandKit);
  }, [brandKit]);

  // Inject the live preview's font @import once per font choice. Skip the
  // inherit sentinel — there's nothing to load for it.
  const previewFonts = useMemo(
    () =>
      Array.from(
        new Set(
          [draft.heading_font, draft.body_font].filter(
            (f) => f && f !== INHERIT_FONT
          )
        )
      ),
    [draft.heading_font, draft.body_font]
  );
  useEffect(() => {
    const links = previewFonts.map((f) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = fontImportUrl(f);
      link.dataset.brandPreview = "1";
      document.head.appendChild(link);
      return link;
    });
    return () => links.forEach((l) => l.remove());
  }, [previewFonts]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(brandKit);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await api.updateBrandKit(draft);
      setBrandKit({ ...DEFAULT_BRAND_KIT, ...saved });
      toast.success("Brand kit saved", {
        description: "New sections will pick this up automatically.",
      });
    } catch {
      toast.error("Could not save brand kit");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    if (
      !window.confirm(
        "Restore the brand kit to factory defaults? Your in-progress changes will be lost."
      )
    ) {
      return;
    }
    setDraft(DEFAULT_BRAND_KIT);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              data-testid="brand-kit-back"
              className="w-9 h-9 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${BRAND.iconBoxClass}`}>
                <BRAND.Icon className="w-4 h-4" />
              </div>
              <span className="font-heading text-base font-semibold tracking-tight leading-none">
                Brand kit
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={resetDefaults}
              data-testid="brand-kit-reset"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset to defaults
            </Button>
            <Button
              onClick={save}
              disabled={!dirty || saving}
              data-testid="brand-kit-save"
              className="bg-[#E01839] hover:bg-[#c01530] text-white"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight mb-1">
            Your brand kit
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Set your colors and typography once — every new section and page
            picks them up automatically. You can still override any field per
            section in the editor.
          </p>
        </div>

        <section data-testid="brand-kit-colors">
          <SectionHeader Icon={Palette} title="Colors" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-200 rounded-xl p-6">
            <ColorField
              label="Primary"
              value={draft.primary_color}
              onChange={(v) => set({ primary_color: v })}
              testid="brand-primary"
            />
            <ColorField
              label="Secondary"
              value={draft.secondary_color}
              onChange={(v) => set({ secondary_color: v })}
              testid="brand-secondary"
            />
            <ColorField
              label="Text"
              value={draft.text_color}
              onChange={(v) => set({ text_color: v })}
              testid="brand-text"
            />
            <ColorField
              label="Background"
              value={draft.background_color}
              onChange={(v) => set({ background_color: v })}
              testid="brand-background"
            />
          </div>
        </section>

        <section data-testid="brand-kit-fonts">
          <SectionHeader Icon={TypeIcon} title="Typography" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-200 rounded-xl p-6">
            <FontField
              label="Heading font"
              value={draft.heading_font}
              onChange={(v) => set({ heading_font: v })}
              testid="brand-heading-font"
              sample="Aa Bb Cc"
              size="2xl"
            />
            <FontField
              label="Body font"
              value={draft.body_font}
              onChange={(v) => set({ body_font: v })}
              testid="brand-body-font"
              sample="The quick brown fox jumps over the lazy dog."
              size="base"
            />
          </div>
        </section>

        <section data-testid="brand-kit-preview">
          <SectionHeader title="Preview" />
          <div
            className="rounded-xl border border-slate-200 overflow-hidden"
            style={{ backgroundColor: draft.background_color }}
          >
          <div className="p-10">
            <h2
              className="text-3xl mb-3"
              style={{
                color: draft.primary_color,
                fontFamily:
                  draft.heading_font === INHERIT_FONT
                    ? "inherit"
                    : `"${draft.heading_font}", sans-serif`,
                fontWeight: 600,
              }}
            >
              Tailor-made for your brand
            </h2>
            <p
              className="text-base max-w-xl mb-6"
              style={{
                color: draft.text_color,
                fontFamily:
                  draft.body_font === INHERIT_FONT
                    ? "inherit"
                    : `"${draft.body_font}", sans-serif`,
              }}
            >
              Every new section starts from these colors and fonts. Tweak the
              kit and watch the rest of your library stay on-brand without
              touching a single block.
            </p>
            <div className="flex gap-3 flex-wrap">
              <span
                className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-semibold"
                style={{
                  backgroundColor: draft.primary_color,
                  color: draft.background_color,
                  fontFamily:
                    draft.heading_font === INHERIT_FONT
                      ? "inherit"
                      : `"${draft.heading_font}", sans-serif`,
                }}
              >
                Primary CTA
              </span>
              <span
                className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-semibold border"
                style={{
                  borderColor: draft.secondary_color,
                  color: draft.secondary_color,
                  fontFamily:
                    draft.heading_font === INHERIT_FONT
                      ? "inherit"
                      : `"${draft.heading_font}", sans-serif`,
                }}
              >
                Secondary
              </span>
            </div>
          </div>
          </div>
        </section>
      </main>

      <Toaster richColors position="top-center" />
    </div>
  );
}

function SectionHeader({ Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h2>
    </div>
  );
}

function FontField({ label, value, onChange, testid, sample, size }) {
  const isInherit = value === INHERIT_FONT;
  const previewStyle = isInherit
    ? { fontFamily: "inherit" }
    : { fontFamily: `"${value}", sans-serif` };
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger data-testid={testid} className="bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem
            value={INHERIT_FONT}
            data-testid={`${testid}-option-inherit`}
          >
            <span className="italic text-slate-500">
              Inherit from site
            </span>
          </SelectItem>
          <div className="my-1 border-t border-slate-200" />
          {FONTS.map((f) => (
            <SelectItem
              key={f.name}
              value={f.name}
              data-testid={`${testid}-option-${f.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <span style={{ fontFamily: `"${f.name}", sans-serif` }}>
                {f.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div
        data-testid={`${testid}-preview`}
        className={`mt-2 px-3 py-2.5 rounded-md bg-slate-50 border border-slate-200 ${
          size === "2xl" ? "text-2xl font-semibold" : "text-base"
        }`}
        style={previewStyle}
      >
        {isInherit ? (
          <span className="text-slate-400 italic text-sm font-normal">
            Will use the embedding site's font
          </span>
        ) : (
          sample
        )}
      </div>
    </div>
  );
}
