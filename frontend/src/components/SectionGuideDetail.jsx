import { Info, Layout, Sparkles, Zap, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

/**
 * SectionGuideDetail — slides in from the right when the user clicks the ⓘ
 * icon on a section card in the User Guide. Each sectionId maps to a
 * full-length content component that explains what the section does, walks
 * through every editor setting, and calls out buried / powerful features.
 */
export default function SectionGuideDetail({ sectionId, onClose }) {
  return (
    <Sheet open={!!sectionId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full overflow-y-auto p-0"
      >
        {sectionId === "hero" && <HeroGuideContent />}
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Shared presentational helpers (scoped to this file)               */
/* ─────────────────────────────────────────────────────────────────── */

function DHeader({ Icon, name, children }) {
  return (
    <div className="px-7 pt-8 pb-6 border-b border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-[#E01839]/10 text-[#E01839] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4.5 h-4.5" />
        </div>
        <SheetTitle className="font-heading text-2xl font-semibold tracking-tight text-slate-900">
          {name}
        </SheetTitle>
      </div>
      <SheetDescription asChild>
        <div className="text-[15px] leading-relaxed text-slate-600 space-y-3">
          {children}
        </div>
      </SheetDescription>
    </div>
  );
}

function DSection({ title, children }) {
  return (
    <div className="px-7 py-6 border-b border-slate-100">
      <h3 className="font-heading text-[13px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-4">
        {title}
      </h3>
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function SettingRow({ name, children }) {
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <p className="text-[13px] font-semibold text-slate-800 mb-1">{name}</p>
      <p className="text-[13px] leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

function ProTip({ children }) {
  return (
    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5">
      <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-[13px] leading-relaxed text-slate-700">{children}</p>
    </div>
  );
}

function DNoteInline({ children }) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5">
      <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
      <p className="text-[13px] leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Hero guide content                                                 */
/* ─────────────────────────────────────────────────────────────────── */

function HeroGuideContent() {
  return (
    <div className="pb-12">
      <DHeader Icon={Layout} name="Hero">
        <p>
          The Hero is the most powerful section in Design Workshop — a
          full-bleed, slide-or-fade carousel built for your most important
          above-the-fold moments. Each slide gets its own background image,
          headline, subtitle, and CTA, and you can mix standard full-bleed
          and split-panel layouts inside the same carousel.
        </p>
        <p>
          Use it for homepage banners, campaign landing pages, or anywhere
          you want rich visual storytelling with multiple messages. A single-slide
          Hero is also a great static banner — the carousel chrome (arrows,
          dots, autoplay) disappears automatically when there's only one slide.
        </p>
      </DHeader>

      {/* ── Carousel & Transition ── */}
      <DSection title="Carousel & Transition">
        <SettingRow name="Transition">
          <strong>Slide</strong> swipes slides in horizontally — natural and familiar.{" "}
          <strong>Fade</strong> cross-dissolves between slides, which works beautifully
          when your slides share the same background photo but vary in copy
          (creates a layered editorial feel). Slide is the safer default for
          mixed photography.
        </SettingRow>
        <SettingRow name="Autoplay">
          Enables automatic slide advancement. Turn it off for slides with long
          headlines or detailed CTAs — give people time to read before the slide
          moves on.
        </SettingRow>
        <SettingRow name="Interval">
          How long (in milliseconds) each slide is visible before advancing.
          The default is 4,000 ms (4 seconds). For text-heavy slides, 6,000–8,000 ms
          gives readers a fighting chance. For purely visual/brand slides, 3,000 ms
          feels snappy.
        </SettingRow>
        <SettingRow name="Pause on hover">
          Stops autoplay while the pointer is resting over the section. Keep this
          on whenever your slides have CTAs — a user hovering to click shouldn't
          have the slide yanked away from them.
        </SettingRow>
        <SettingRow name="Arrows visibility">
          Controls when the previous / next navigation arrows are visible:{" "}
          <strong>Always</strong>, <strong>Desktop only</strong>,{" "}
          <strong>Mobile only</strong>, or <strong>Never</strong>. "Desktop only"
          is a common choice — desktop users expect arrows, mobile users swipe.
        </SettingRow>
        <SettingRow name="Dots">
          The row of small indicator dots below the slides. Useful orientation cue
          when you have 3 or more slides. Consider hiding them on a single-slide
          Hero (they're hidden automatically) or when you're using "Never" for
          arrows to keep the design clean.
        </SettingRow>
      </DSection>

      {/* ── Slide Defaults — Overlay ── */}
      <DSection title="Slide Defaults — Overlay">
        <SettingRow name="Overlay type">
          Sets the default overlay style for all slides that don't override it
          individually.{" "}
          <strong>Default</strong> is a plain semi-transparent black (legacy
          mode — fine, just less precise).{" "}
          <strong>Solid</strong> gives you a flat colour wash at a chosen opacity —
          use this when you want a branded tint over your photos.{" "}
          <strong>Gradient</strong> is the most flexible: a directional colour
          fade that can darken one side of the image while leaving the other
          clear.
        </SettingRow>
        <SettingRow name="Overlay colour & opacity">
          The colour and strength of the solid overlay. Start around 40% opacity
          and dial up if your text feels hard to read. Dark images may need as
          little as 20%; bright or pale photos may need 55–65%.
        </SettingRow>
        <SettingRow name="Gradient: from / to / angle">
          Defines the directional colour wash when overlay type is Gradient.
          The <strong>angle</strong> controls direction: 90° = left-to-right,
          0° = top-to-bottom, 135° = diagonal. Combine a dark
          "from" colour with a transparent "to" colour for a natural vignette
          effect.
        </SettingRow>
        <SettingRow name="Mobile overlay override">
          Portrait-cropped images on phones often need a heavier overlay than
          the landscape desktop version of the same photo. Enable the mobile
          override to set a completely separate overlay type, colour, and opacity
          for screens narrower than 768 px — without touching your desktop
          settings.
        </SettingRow>
      </DSection>

      {/* ── Slide Defaults — Split Panel ── */}
      <DSection title="Slide Defaults — Split Panel">
        <DNoteInline>
          These settings only apply when at least one slide uses the{" "}
          <strong>Split</strong> layout mode (set per-slide under each slide's
          expanded settings). Split layout puts the background image on one side
          and a solid panel holding the content on the other.
        </DNoteInline>
        <SettingRow name="Panel background type">
          <strong>Solid</strong> fills the content panel with a flat colour.{" "}
          <strong>Gradient</strong> lets you run a directional colour blend across
          the panel — great for brand-colour panels with a bit of depth.
        </SettingRow>
        <SettingRow name="Panel background / gradient">
          The colour(s) used for the split panel. Brand primary or a dark neutral
          (e.g. slate-900) tend to read cleanest against light text. The gradient
          controls mirror the overlay gradient controls: from / to / angle.
        </SettingRow>
        <SettingRow name="Mobile panel override">
          On mobile, split panels stack vertically (image above, panel below).
          You can swap to a different panel colour for the stacked view — useful
          when the desktop panel is very dark and you want something lighter
          beneath a phone-sized image.
        </SettingRow>
      </DSection>

      {/* ── Layout ── */}
      <DSection title="Layout">
        <SettingRow name="Height">
          Sets the section height in pixels (150–800). Taller heroes create
          more visual impact; shorter ones page faster and feel more editorial.
          500–600 px is the sweet spot for most homepage heroes on desktop.
        </SettingRow>
        <SettingRow name="Text alignment">
          <strong>Left</strong> suits split-panel layouts and text-left designs.{" "}
          <strong>Centre</strong> works for full-bleed heroes where the image
          is symmetrical and the message is short and punchy.
        </SettingRow>
        <SettingRow name="Content max width">
          Caps how wide the text block inside the slide can grow. On very wide
          screens, an uncapped block produces uncomfortably long line lengths.
          1,200 px is a good default; 800–960 px produces a more editorial,
          centred feel.
        </SettingRow>
        <SettingRow name="Border radius">
          Rounds the section corners. Only visible when <strong>Full bleed</strong>{" "}
          is off — when the section is inset inside a container. Useful for
          card-style embed contexts (e.g. a Shopify content block with its own
          border).
        </SettingRow>
        <SettingRow name="Full bleed">
          When on, the section stretches edge-to-edge regardless of what the
          host page's container width is. Turn it off if the host CMS wraps
          your embed block in a max-width container and you want to respect
          that boundary — border radius then kicks in as a nice frame.
        </SettingRow>
        <SettingRow name="Mobile layout override">
          Enable this to dial in a separate height, alignment, max-width, and
          border radius for mobile — without touching the desktop settings. The
          mobile preview in the editor switches to this context automatically
          when you toggle the preview to mobile view.
        </SettingRow>
        <SettingRow name="Image side (split layout)">
          In split-layout slides: which side the image goes on. <strong>Right</strong>{" "}
          is the western reading-direction convention — image draws the eye
          rightward while the text anchors left. <strong>Left</strong> can
          feel more editorial and works well when the image is a portrait
          or a person looking toward the text.
        </SettingRow>
        <SettingRow name="Panel ratio (split layout)">
          The percentage of the split allocated to the content panel: 40%, 50%,
          or 60%. A 60% panel is text-heavy and good for feature-rich content;
          a 40% panel is image-dominant and more visual. Applies globally across
          all split slides in this section.
        </SettingRow>
        <SettingRow name="Mobile image-panel gap (split layout)">
          The vertical gap in pixels between the stacked image and panel on
          mobile. Set to 0 for a flush, full-bleed stacked look. A small gap
          (8–16 px) can help if you're using a coloured panel that would otherwise
          read as a single block with the image.
        </SettingRow>
      </DSection>

      {/* ── Slides ── */}
      <DSection title="Slides (per-slide settings)">
        <DNoteInline>
          Click a slide row in the editor to expand it and access its full
          settings. The section defaults cover all slides that don't override
          individually — per-slide overrides layer on top of those defaults.
        </DNoteInline>
        <SettingRow name="Logo">
          An optional small brand or partner logo rendered above the title.
          Seeded automatically from your Brand Kit when you first create the
          section. Great for co-branded campaigns or trade-partner landing pages.
        </SettingRow>
        <SettingRow name="Eyebrow">
          A small label that appears above the title — e.g. "NEW ARRIVAL",
          "SUMMER 2025", or "EXCLUSIVE OFFER". Appears in a distinct typographic
          style (usually small caps or bold). Leave blank to hide it.
        </SettingRow>
        <SettingRow name="Title & Subtitle">
          The main headline and supporting copy for this slide. These are the
          primary reading moments — keep titles punchy (5–10 words) and subtitles
          supportive (1–2 short sentences).
        </SettingRow>
        <SettingRow name="Background image">
          The full-bleed photo behind the content. For best results use a
          landscape image at least 1920 px wide. Portrait subjects (faces, people)
          work well centred; busy scenes benefit from a heavier overlay.
        </SettingRow>
        <SettingRow name="CTA text & link">
          The primary call-to-action button. Text should be action-led:
          "Book a demo", "See the range", "Learn more". The link can be a full
          URL or a relative path (e.g. <code className="text-[12px] bg-slate-100 px-1 rounded">/products</code>).
        </SettingRow>
        <SettingRow name="Layout (per slide)">
          Override the section default for this slide only. Mix{" "}
          <strong>Standard</strong> (full-bleed text over image) and{" "}
          <strong>Split</strong> (image + panel side by side) in the same
          carousel — each slide can have its own layout mode.
        </SettingRow>
        <SettingRow name="Per-slide title / subtitle / eyebrow colours">
          Override the section default text colours for this slide only.
          Useful for carousels that mix slides on light and dark background
          images — a dark background slide needs white text while a pale
          background slide might need slate-900.
        </SettingRow>
        <SettingRow name="Per-slide CTA colours">
          Override the CTA button background and text colour for this slide.
          Helpful when one slide's background image clashes with the section's
          default brand-red button.
        </SettingRow>
        <SettingRow name="Per-slide overlay">
          Give this specific slide a different overlay type, colour, and opacity.
          When one photo in your carousel is bright and washed-out while another
          is very dark, each can dial in the right overlay independently — without
          changing the section defaults that cover the others.
        </SettingRow>
        <SettingRow name="Per-slide panel background">
          In split-layout mode, override the panel colour for just this slide.
          Perfect for multi-brand carousels where each brand has its own panel
          colour — one section, three slides, three panel colours.
        </SettingRow>
      </DSection>

      {/* ── Pro Tips ── */}
      <div className="px-7 py-6 space-y-3">
        <h3 className="font-heading text-[13px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-4">
          Hidden features & pro tips
        </h3>

        <ProTip>
          <strong>Mix layouts in one carousel.</strong> Set the section default
          to Standard (full-bleed), then flip individual slides to Split inside
          their expanded settings. A campaign opener as a dramatic full-bleed
          followed by a feature-detail split panel is a powerful two-slide
          combination.
        </ProTip>

        <ProTip>
          <strong>Per-slide overlay — the buried power move.</strong> Found
          inside each slide's expanded settings. When one photo in your carousel
          is naturally bright and another is dark, each slide can have its own
          overlay type and opacity without disturbing the section defaults that
          govern the rest.
        </ProTip>

        <ProTip>
          <strong>Gradient overlay for readability without boxing the image.</strong>{" "}
          A left-to-right gradient (dark left, transparent right) with text aligned
          left creates a natural "glass" readability effect — your photography stays
          visible on the right while the text is perfectly legible on the left. Far
          more elegant than a flat semi-opaque overlay.
        </ProTip>

        <ProTip>
          <strong>Mobile overlay overrides are worth the extra click.</strong>{" "}
          Portrait-cropped images on phones are usually much brighter and busier in
          the centre than the landscape crops used on desktop. A separate mobile
          overlay (typically heavier opacity or a gradient that darkens the top)
          makes the difference between text that's just readable and text that pops.
        </ProTip>

        <ProTip>
          <strong>Single-slide hero = zero carousel overhead.</strong> One slide
          disables arrows, dots, and autoplay automatically — you get a clean static
          banner with all of Hero's layout, overlay, split-panel, and mobile-override
          power. No need to reach for Split Banner unless you specifically want
          feature-point lists.
        </ProTip>

        <ProTip>
          <strong>prefers-reduced-motion is handled for you.</strong> The exported
          snippet reads the user's OS accessibility preference and automatically
          disables slide transitions and autoplay for users who have opted into
          reduced-motion mode. No extra settings, no extra code — it just works.
        </ProTip>

        <ProTip>
          <strong>Preview lock.</strong> When you open a slide row in the editor,
          the preview carousel locks to that slide so you can see your changes
          in context without it auto-advancing. The lock persists through the
          device toggle and hover events — it only releases when you close the
          slide row.
        </ProTip>

        <ProTip>
          <strong>Pause on hover — easy to overlook, very important.</strong>{" "}
          With autoplay on, a user hovering over a CTA button to read it shouldn't
          have the slide advance under their cursor. Pause on hover prevents that.
          Keep it on whenever your slides have calls to action.
        </ProTip>
      </div>
    </div>
  );
}
