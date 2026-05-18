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
import { ArrowLeft, Palette, Type as TypeIcon, RotateCcw, Save, Sparkles, Wand2, Image as ImageIcon, Library } from "lucide-react";
import { api } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import {
  DEFAULT_BRAND_KIT,
  FONTS,
  INHERIT_FONT,
  applyBrandKit,
  applyBrandKitToRichText,
  fontImportUrl,
} from "@/lib/brandKit";
import { useBrandKit } from "@/lib/BrandKitContext";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ImageLibrarySection from "./brand-kit/ImageLibrarySection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LandingDemoPicker from "./brand-kit/LandingDemoPicker";
import LandingSpotlightsPicker from "./brand-kit/LandingSpotlightsPicker";
import { useAuth } from "@/auth/AuthContext";

export default function BrandKitPage() {
  const { user } = useAuth();
  const { brandKit, setBrandKit } = useBrandKit();
  const [draft, setDraft] = useState(brandKit);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

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

  // Bulk re-apply the SAVED brand kit over every Section + every Page
  // block in the user's library. Uses the same `applyBrandKit` /
  // `applyBrandKitToRichText` helpers as the Editor's per-section button,
  // so the merge logic stays in one place. Only saved kits are applied —
  // dirty drafts could surprise the user.
  const applyToLibrary = async () => {
    if (dirty) {
      toast.warning("Save your brand kit first", {
        description: "Apply works against the saved kit, not the draft.",
      });
      return;
    }
    if (
      !window.confirm(
        "Re-apply the brand kit to every saved Section and Page in your library? This rewrites their colours, fonts and eyebrow defaults — content (text, images, products) is preserved."
      )
    ) {
      return;
    }
    setApplying(true);
    try {
      const [sections, pages] = await Promise.all([
        api.listSections(),
        api.listPages(),
      ]);

      // Sections: merge kit onto each saved config and PUT back. We pass
      // `seedLogos: true` so the brand kit's logos propagate into empty
      // logo fields. Per-customer logos that the user has already set
      // are preserved (the seeder only fills empty fields).
      const sectionPromises = sections.map((s) => {
        const merged = applyBrandKit(s.type, s.config || {}, brandKit, {
          seedLogos: true,
        });
        if (!merged.uid) merged.uid = s.config?.uid;
        return api.updateSection(s.section_id, { config: merged });
      });

      // Pages: walk each block. Section blocks → applyBrandKit; richtext
      // blocks → applyBrandKitToRichText. Untyped blocks pass through.
      const pagePromises = pages.map((p) => {
        const newBlocks = (p.blocks || []).map((b) => {
          if (!b) return b;
          if (b.type === "richtext") {
            return {
              ...b,
              config: applyBrandKitToRichText(b.config || {}, brandKit),
            };
          }
          if (b.type === "section") {
            const merged = applyBrandKit(
              b.section_type,
              b.config || {},
              brandKit,
              { seedLogos: true }
            );
            if (!merged.uid) merged.uid = b.config?.uid;
            return { ...b, config: merged };
          }
          return b;
        });
        return api.updatePage(p.page_id, { blocks: newBlocks });
      });

      await Promise.all([...sectionPromises, ...pagePromises]);
      toast.success("Brand kit applied to library", {
        description: `${sections.length} section${sections.length === 1 ? "" : "s"} and ${pages.length} page${pages.length === 1 ? "" : "s"} updated.`,
      });
    } catch (err) {
      toast.error("Apply failed", {
        description: err?.message || "Some items may not have been updated.",
      });
    } finally {
      setApplying(false);
    }
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
              variant="outline"
              onClick={applyToLibrary}
              disabled={dirty || applying}
              data-testid="brand-kit-apply-to-library"
              title={
                dirty
                  ? "Save the kit first — apply works against the saved kit"
                  : "Re-apply the kit to every saved Section and Page"
              }
            >
              <Wand2 className="w-4 h-4 mr-1.5" />
              {applying ? "Applying…" : "Apply to library"}
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

        <section data-testid="brand-kit-roles">
          <SectionHeader Icon={Wand2} title="Action colours" />
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <p className="text-sm text-slate-500 -mt-1">
              Optional role-specific overrides. Leave blank to inherit
              the primary colour — set one only when you want that
              element to break away from the rest of the palette.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <RoleColorField
                label="Link / inline accent"
                value={draft.link_color}
                fallback={draft.primary_color}
                onChange={(v) => set({ link_color: v })}
                testid="brand-link"
                help="Resource tags, inline pills."
              />
              <RoleColorField
                label="Button background"
                value={draft.button_color}
                fallback={draft.primary_color}
                onChange={(v) => set({ button_color: v })}
                testid="brand-button"
                help="Hero CTA, Content button, CTA Banner button."
              />
              <RoleColorField
                label="Accent (active tab + heading)"
                value={draft.accent_color}
                fallback={draft.primary_color}
                onChange={(v) => set({ accent_color: v })}
                testid="brand-accent"
                help="Active tab indicator, FAQ chevron, step circles, stars, product price."
              />
            </div>
          </div>
        </section>

        <section data-testid="brand-kit-logos">
          <SectionHeader Icon={ImageIcon} title="Brand logos" />
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <p className="text-sm text-slate-500 -mt-1">
              Two slots so the same kit works on light AND dark sections.
              Both flow into new sections automatically, and into your
              existing library when you press <strong>Apply to library</strong>.
              Per-customer logos that are already set never get overwritten.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  For dark backgrounds
                </Label>
                <div
                  className="rounded-md p-3 border border-slate-200 min-h-[80px] flex items-center justify-center"
                  style={{ backgroundColor: draft.secondary_color || "#1f2937" }}
                >
                  {draft.logo_dark ? (
                    <img
                      src={draft.logo_dark}
                      alt="Dark-bg logo preview"
                      className="max-h-16 max-w-full"
                    />
                  ) : (
                    <p className="text-xs text-white/60 text-center">
                      No logo yet
                    </p>
                  )}
                </div>
                <ImageUpload
                  value={draft.logo_dark}
                  onChange={(v) => set({ logo_dark: v })}
                  testid="brand-logo-dark"
                  compact
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  For light backgrounds
                </Label>
                <div
                  className="rounded-md p-3 border border-slate-200 min-h-[80px] flex items-center justify-center"
                  style={{ backgroundColor: draft.background_color || "#ffffff" }}
                >
                  {draft.logo_light ? (
                    <img
                      src={draft.logo_light}
                      alt="Light-bg logo preview"
                      className="max-h-16 max-w-full"
                    />
                  ) : (
                    <p className="text-xs text-slate-400 text-center">
                      No logo yet
                    </p>
                  )}
                </div>
                <ImageUpload
                  value={draft.logo_light}
                  onChange={(v) => set({ logo_light: v })}
                  testid="brand-logo-light"
                  compact
                />
              </div>
            </div>
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

        <section data-testid="brand-kit-eyebrow">
          <SectionHeader Icon={Sparkles} title="Eyebrow defaults" />
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <p className="text-sm text-slate-500 -mt-1">
              An eyebrow is the small uppercase accent line above a section's
              heading. Fill these in and every new section that supports one
              (Content, Products, Insights, Resources, Break, Feature Grid,
              Steps, FAQ, CTA Banner, Testimonials) starts with them
              pre-filled. Leave blank to skip.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Default text (optional)
                </Label>
                <Input
                  value={draft.eyebrow_text}
                  onChange={(e) => set({ eyebrow_text: e.target.value })}
                  placeholder="e.g. ZAIBATSUI LABS"
                  data-testid="brand-eyebrow-text"
                />
              </div>
              <ColorField
                label="Eyebrow color"
                value={draft.eyebrow_color || draft.primary_color}
                onChange={(v) => set({ eyebrow_color: v })}
                testid="brand-eyebrow-color"
              />
            </div>
            <p className="text-xs text-slate-500">
              The eyebrow inherits your brand <strong>heading font</strong> by
              default. See it live in the Preview below.
            </p>
          </div>
        </section>

        <section data-testid="brand-kit-button-shape">
          <SectionHeader title="Button shape" />
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Drives every CTA / button across every section. 0 = sharp,
                  9999 = full pill. Watch the buttons in the Preview below
                  morph as you drag.
                </p>
              </div>
              <span
                data-testid="brand-button-radius-value"
                className="text-sm tabular-nums text-slate-700 whitespace-nowrap"
              >
                {Number(draft.button_radius ?? 8) >= 9999
                  ? "Pill"
                  : `${Number(draft.button_radius ?? 8)}px`}
              </span>
            </div>
            <input
              data-testid="brand-button-radius"
              type="range"
              min={0}
              max={32}
              step={1}
              value={Math.min(Number(draft.button_radius ?? 8), 32)}
              onChange={(e) =>
                set({ button_radius: Number(e.target.value) })
              }
              className="w-full"
            />
            <div className="flex gap-2 pt-1">
              {[0, 6, 8, 12, 9999].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set({ button_radius: r })}
                  data-testid={`brand-button-radius-preset-${r}`}
                  className={`text-xs px-3 py-1.5 border rounded transition-colors ${
                    Number(draft.button_radius ?? 8) === r
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 hover:border-slate-400 text-slate-600"
                  }`}
                >
                  {r === 9999 ? "Pill" : r === 0 ? "Sharp" : `${r}px`}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section data-testid="brand-kit-preview">
          <SectionHeader title="Preview" />
          <div
            className="rounded-xl border border-slate-200 overflow-hidden"
            style={{ backgroundColor: draft.background_color }}
          >
          <div className="p-10">
            <p
              data-testid="brand-eyebrow-preview"
              className="mb-4"
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: draft.eyebrow_color || draft.primary_color,
                fontFamily:
                  draft.heading_font === INHERIT_FONT
                    ? "inherit"
                    : `"${draft.heading_font}", sans-serif`,
              }}
            >
              {draft.eyebrow_text || "Your eyebrow text here"}
            </p>
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
            <div className="flex gap-3 flex-wrap items-center">
              <span
                className="inline-flex items-center text-base font-semibold"
                style={{
                  backgroundColor: draft.button_color || draft.primary_color,
                  color: draft.background_color,
                  borderRadius: `${Number(draft.button_radius ?? 8)}px`,
                  padding: "14px 28px",
                  fontFamily:
                    draft.heading_font === INHERIT_FONT
                      ? "inherit"
                      : `"${draft.heading_font}", sans-serif`,
                }}
                data-testid="brand-preview-primary-btn"
              >
                Primary CTA
              </span>
              <span
                className="inline-flex items-center text-base font-semibold border-2"
                style={{
                  borderColor: draft.secondary_color,
                  color: draft.secondary_color,
                  borderRadius: `${Number(draft.button_radius ?? 8)}px`,
                  padding: "12px 26px",
                  fontFamily:
                    draft.heading_font === INHERIT_FONT
                      ? "inherit"
                      : `"${draft.heading_font}", sans-serif`,
                }}
                data-testid="brand-preview-secondary-btn"
              >
                Secondary
              </span>
              {/* Tall capsule — the same radius reads more dramatically
                  on a taller surface, so users get instant feedback even
                  for small px values. */}
              <span
                className="inline-flex items-center justify-center text-sm font-semibold"
                style={{
                  backgroundColor: draft.secondary_color,
                  color: draft.background_color,
                  borderRadius: `${Number(draft.button_radius ?? 8)}px`,
                  height: 56,
                  minWidth: 120,
                  padding: "0 24px",
                  fontFamily:
                    draft.heading_font === INHERIT_FONT
                      ? "inherit"
                      : `"${draft.heading_font}", sans-serif`,
                }}
                data-testid="brand-preview-tall-btn"
                title="Tall surface — exaggerates the radius for feedback"
              >
                Read more →
              </span>
            </div>
          </div>
          </div>
        </section>

        {user?.is_admin && <LandingDemoPicker />}
        {user?.is_admin && <LandingSpotlightsPicker />}

        <section data-testid="brand-kit-image-library">
          <SectionHeader Icon={Library} title="Image library" />
          <ImageLibrarySection />
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

/**
 * RoleColorField — a colour input that *may be blank*, in which case
 * it visually inherits from a fallback (primary_color). Shows the
 * effective colour with a "Inherits primary" badge when unset, and a
 * one-click "Reset to inherit" link when set. Keeps the brand kit's
 * "leave it blank to inherit" semantic obvious to the user.
 */
function RoleColorField({ label, value, fallback, onChange, testid, help }) {
  const effective = value || fallback;
  const isInherited = !value;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </Label>
        {!isInherited && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[10px] uppercase tracking-wider text-slate-400 hover:text-slate-900 font-medium"
            data-testid={`${testid}-reset`}
            title="Reset to inherit from primary"
          >
            Reset
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label
          className="relative w-9 h-9 rounded-md border border-slate-200 overflow-hidden cursor-pointer shrink-0"
          style={{ backgroundColor: effective }}
        >
          <input
            type="color"
            value={effective}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            data-testid={`${testid}-picker`}
          />
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isInherited ? `Inherits ${fallback}` : ""}
          className="text-xs font-mono"
          data-testid={`${testid}-hex`}
        />
      </div>
      {help && (
        <p className="text-[10.5px] leading-snug text-slate-400">{help}</p>
      )}
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
