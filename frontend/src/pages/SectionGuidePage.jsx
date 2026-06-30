import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Layout, Zap, Settings, LayoutTemplate, Layers,
  SlidersHorizontal, Sparkles, Star, AlignLeft, Boxes, LayoutGrid,
  BookMarked, BookOpen, Shield, Hash, PlayCircle, Columns3,
  ListOrdered, Quote, HelpCircle, Megaphone, FileStack, Building2,
  Image, Type, Palette, Search, MousePointer, List, DollarSign, Timer,
} from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function SectionGuidePage({ chromeless = false }) {
  const { sectionId } = useParams();
  return (
    <div className={chromeless ? "bg-white text-slate-900" : "min-h-screen bg-white text-slate-900"}>
      {!chromeless && <PageHeader />}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-10 md:py-14">
        <BackLink />
        {sectionId === "hero"             && <HeroGuideContent />}
        {sectionId === "split-banner"     && <SplitBannerGuideContent />}
        {sectionId === "featured-card"    && <FeaturedCardGuideContent />}
        {sectionId === "welcome"          && <WelcomeGuideContent />}
        {sectionId === "content"          && <ContentGuideContent />}
        {sectionId === "products"         && <ProductCarouselGuideContent />}
        {sectionId === "productGrid"      && <ProductGridGuideContent />}
        {sectionId === "blog-index"       && <BlogIndexGuideContent />}
        {sectionId === "blog-body"        && <BlogBodyGuideContent />}
        {sectionId === "insights"         && <InsightsGridGuideContent />}
        {sectionId === "resources"        && <ResourcesGuideContent />}
        {sectionId === "feature-grid"     && <FeatureGridGuideContent />}
        {sectionId === "trust-strip"      && <TrustStripGuideContent />}
        {sectionId === "stat-counter"     && <StatCounterGuideContent />}
        {sectionId === "video-embed"      && <VideoEmbedGuideContent />}
        {sectionId === "comparison-table" && <ComparisonTableGuideContent />}
        {sectionId === "pricing-table"    && <PricingTableGuideContent />}
        {sectionId === "countdown-timer"  && <CountdownTimerGuideContent />}
        {sectionId === "steps"            && <StepsGuideContent />}
        {sectionId === "testimonials"     && <TestimonialsGuideContent />}
        {sectionId === "faq"              && <FAQGuideContent />}
        {sectionId === "cta-banner"       && <CTABannerGuideContent />}
        {sectionId === "logos"            && <LogoStripGuideContent />}
        {sectionId === "break"            && <BreakBannerGuideContent />}
        {sectionId === "tabs"             && <TabsGuideContent />}
        {sectionId === "placeholder"      && <GridGuideContent />}
        {sectionId === "brand-grid"       && <BrandGridGuideContent />}
      </div>
    </div>
  );
}

function PageHeader() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="px-8 md:px-14 h-16 flex items-center justify-between">
        <button onClick={() => navigate("/guide#section-types")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to user guide</span>
        </button>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${BRAND.iconBoxClass}`}>
            <BRAND.Icon className="w-full h-full object-contain" />
          </div>
          <span className="font-heading text-sm font-semibold tracking-tight text-slate-900">{BRAND.name} Guide</span>
        </div>
      </div>
    </header>
  );
}

function BackLink() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate("/guide#section-types")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-10">
      <ArrowLeft className="w-4 h-4" />
      Back to user guide
    </button>
  );
}

/* ── Shared helpers ── */

function GuideH1({ Icon, children }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-md bg-[#E01839]/10 text-[#E01839] flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <h1 className="font-heading text-4xl md:text-5xl font-semibold tracking-tighter text-slate-900 leading-[1.1]">{children}</h1>
    </div>
  );
}

function Lead({ children }) {
  return <p className="text-base md:text-lg leading-relaxed text-slate-600 mb-12">{children}</p>;
}

function GuideSection({ Icon, title, children }) {
  return (
    <section className="mt-14">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-md bg-[#E01839]/10 text-[#E01839] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 leading-tight">{title}</h2>
      </div>
      <div className="text-[15px] leading-relaxed text-slate-700 space-y-4">{children}</div>
    </section>
  );
}

function Note({ children }) {
  return <div className="border-l-2 border-[#E01839] bg-[#E01839]/5 px-4 py-3 rounded-r-md text-[14px] text-slate-700">{children}</div>;
}

function SettingsTable({ children }) {
  return <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden mt-2">{children}</div>;
}

function Setting({ name, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] bg-white">
      <div className="px-5 py-4 md:border-r border-slate-100 bg-slate-50/60">
        <p className="text-[13px] font-semibold text-slate-800 leading-snug">{name}</p>
      </div>
      <div className="px-5 py-4">
        <p className="text-[14px] leading-relaxed text-slate-600">{children}</p>
      </div>
    </div>
  );
}

function ProTip({ title, children }) {
  return (
    <div className="flex gap-3 border-l-2 border-amber-400 bg-amber-50 px-4 py-3 rounded-r-md text-[14px] text-slate-700">
      <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="leading-relaxed">{title && <strong className="text-slate-800">{title} — </strong>}{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* HERO                                                               */
/* ═══════════════════════════════════════════════════════════════════ */

function HeroGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Layout}>Hero</GuideH1>
      <Lead>
        The Hero is the most powerful section in Design Workshop — a full-bleed, slide-or-fade carousel built for your most important above-the-fold moments. Each slide gets its own background image, headline, subtitle, and CTA, and you can mix standard full-bleed and split-panel layouts in the same carousel. A single-slide Hero doubles as a clean static banner — arrows, dots, and autoplay disappear automatically when there's only one slide.
      </Lead>

      <GuideSection Icon={SlidersHorizontal} title="Carousel & Transition">
        <SettingsTable>
          <Setting name="Transition"><strong>Slide</strong> swipes horizontally. <strong>Fade</strong> cross-dissolves between slides — beautiful when slides share the same background photo but vary in copy. Slide is the safer default for mixed photography.</Setting>
          <Setting name="Autoplay">Advances slides automatically. Turn off for slides with long headlines or CTAs — give people time to read.</Setting>
          <Setting name="Interval">Time each slide is visible (milliseconds) before advancing. Default 4,000 ms. For text-heavy slides use 6,000–8,000 ms; for pure brand visuals 3,000 ms feels snappy.</Setting>
          <Setting name="Pause on hover">Stops autoplay while the pointer rests over the section. Keep this on whenever slides have CTAs — a user hovering to click shouldn't have the slide yanked away.</Setting>
          <Setting name="Arrows visibility">When prev/next arrows appear: <strong>Always</strong>, <strong>Desktop only</strong>, <strong>Mobile only</strong>, or <strong>Never</strong>. Desktop only is the most common choice — mobile users swipe.</Setting>
          <Setting name="Dots">Indicator dots below the slides. Useful for 3+ slides. Auto-hide on a single-slide hero.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Slide Defaults — Overlay">
        <Note>These settings apply to all slides that don't override the overlay individually. Per-slide overrides are set inside each slide's expanded editor.</Note>
        <SettingsTable>
          <Setting name="Overlay type"><strong>Default</strong> = plain semi-transparent black. <strong>Solid</strong> = flat colour wash at chosen opacity. <strong>Gradient</strong> = directional fade — most flexible for text legibility.</Setting>
          <Setting name="Overlay colour & opacity">Controls text legibility over photos. Start around 40% and dial up if needed. Bright or pale photos may need 55–65%.</Setting>
          <Setting name="Gradient — from / to / angle">Angle: 90° = left-to-right, 0° = top-to-bottom, 135° = diagonal. Pair a dark "from" with a transparent "to" for a natural vignette.</Setting>
          <Setting name="Mobile overlay override">Enable to set a completely separate overlay for screens under 768 px — portrait-cropped phone images almost always need heavier overlays than the landscape desktop crop.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={LayoutTemplate} title="Slide Defaults — Split Panel">
        <Note>These settings only apply when at least one slide uses Split layout mode — image on one side, coloured content panel on the other.</Note>
        <SettingsTable>
          <Setting name="Panel background type"><strong>Solid</strong> fills the panel with a flat colour. <strong>Gradient</strong> runs a directional blend — great for brand-colour panels with depth.</Setting>
          <Setting name="Panel background / gradient">The colour(s) of the content panel. Brand primary or a dark neutral tends to read cleanest against light text.</Setting>
          <Setting name="Mobile panel override">On mobile, split panels stack vertically. Swap to a different panel colour for the stacked view.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout">
        <SettingsTable>
          <Setting name="Height">Section height in pixels (150–800). 500–600 px is the sweet spot for most homepage heroes on desktop.</Setting>
          <Setting name="Text alignment"><strong>Left</strong> suits split-panel layouts. <strong>Centre</strong> works for full-bleed heroes with short, punchy messages.</Setting>
          <Setting name="Content max width">Caps how wide the text block can grow. 1,200 px is a solid default; 800–960 px gives a more editorial, centred feel.</Setting>
          <Setting name="Border radius">Rounds the section corners — only visible when Full bleed is off.</Setting>
          <Setting name="Full bleed">Stretches the section edge-to-edge. Turn off if your CMS wraps content in a max-width container.</Setting>
          <Setting name="Mobile layout override">Separate height, alignment, max-width, and border radius for mobile without touching desktop settings.</Setting>
          <Setting name="Image side (split layout)"><strong>Right</strong> is the western reading convention — image draws the eye rightward while text anchors left. <strong>Left</strong> is more editorial.</Setting>
          <Setting name="Panel ratio (split layout)">Width of the content panel: 40%, 50%, or 60%. 60% = text-heavy; 40% = image-dominant.</Setting>
          <Setting name="Mobile image-panel gap">Vertical gap (px) between the stacked image and panel on mobile. Set to 0 for flush full-bleed look.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Slides — per-slide settings">
        <Note>Click a slide row in the editor to expand its full settings. Section defaults apply unless overridden per slide.</Note>
        <SettingsTable>
          <Setting name="Logo">Optional small brand or partner logo above the title. Great for co-branded campaigns.</Setting>
          <Setting name="Eyebrow">Small label above the title — e.g. "NEW ARRIVAL", "SUMMER 2025". Leave blank to hide.</Setting>
          <Setting name="Title & Subtitle">Main headline and supporting copy. Keep titles punchy (5–10 words), subtitles supportive (1–2 short sentences).</Setting>
          <Setting name="Background image">Full-bleed photo. Use landscape images at least 1,920 px wide for sharpest results.</Setting>
          <Setting name="CTA text & link">Primary call-to-action button. Text should be action-led: "Book a demo", "See the range".</Setting>
          <Setting name="Layout (per slide)">Override the section default for this slide only — mix Standard and Split in the same carousel.</Setting>
          <Setting name="Per-slide text colours">Override title, subtitle, and eyebrow colours for slides on different-coloured backgrounds.</Setting>
          <Setting name="Per-slide overlay">Give this slide its own overlay type, colour, and opacity independent of all other slides.</Setting>
          <Setting name="Per-slide panel background">In split-layout mode, override the panel colour for just this slide — perfect for multi-brand carousels.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Mix layouts in one carousel">Set the section default to Standard, then flip individual slides to Split. A dramatic full-bleed opener followed by a feature-detail split panel is a powerful two-slide combination.</ProTip>
        <ProTip title="Gradient overlay for readability">A left-to-right gradient (dark left, transparent right) with left-aligned text creates a natural glass effect — photography stays visible on the right while text pops on the left.</ProTip>
        <ProTip title="Single-slide Hero = zero carousel overhead">One slide disables arrows, dots, and autoplay automatically. You get a clean static banner with all of Hero's overlay, split-panel, and mobile-override power.</ProTip>
        <ProTip title="prefers-reduced-motion is handled for you">The exported snippet automatically disables transitions and autoplay for users who have enabled reduced motion in their OS. No extra code required.</ProTip>
        <ProTip title="Preview lock">Opening a slide row locks the carousel to that slide so autoplay doesn't advance while you're editing. The lock releases when you close the slide row.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* SPLIT BANNER                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

function SplitBannerGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Layout}>Split Banner</GuideH1>
      <Lead>
        Split Banner is the static, non-carousel cousin of Hero. A full-bleed image sits on one side while a coloured panel holds your heading, subheading, buttons, and an optional feature-points list on the other. It's the go-to for product or service introductions where a single, stable message beats a rotating carousel.
      </Lead>

      <GuideSection Icon={Type} title="Content">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading — e.g. "FEATURED PRODUCT" or a category name. Leave blank to hide.</Setting>
          <Setting name="Heading">Primary headline. Keep it to one punchy line for maximum impact at this size.</Setting>
          <Setting name="Subheading">Supporting paragraph beneath the heading. One or two sentences works best.</Setting>
          <Setting name="CTA buttons">Primary and optional secondary button. Primary uses your brand accent colour; secondary is styled automatically for contrast.</Setting>
          <Setting name="Logo">Optional brand or partner logo above the eyebrow. Useful for co-branded sections or product lines with their own identity.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Feature points">
        <Note>Feature points appear as a list inside the panel beneath the subheading. Add them when you have 2–4 key benefits worth calling out individually.</Note>
        <SettingsTable>
          <Setting name="Icon">Each feature point can show an icon from the library or none. Stick to one icon family across all points for consistency.</Setting>
          <Setting name="Title & body">Short title + one-line explanation per point. Bullet-style — not full paragraphs.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={LayoutTemplate} title="Panel style">
        <SettingsTable>
          <Setting name="Panel background type"><strong>Solid</strong> = flat brand colour. <strong>Gradient</strong> = directional blend across the panel for depth.</Setting>
          <Setting name="Panel background / gradient colours">The fill of the content panel. Dark neutrals (slate-900) or brand primaries tend to work best with light text.</Setting>
          <Setting name="Image side">Whether the photo sits <strong>left</strong> or <strong>right</strong>. Right image + left text is the western reading convention. Left image is more editorial.</Setting>
          <Setting name="Panel ratio">Width of the content panel relative to the image: 40%, 50%, or 60%. 60% = text-heavy; 40% = image-dominant.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Image} title="Image & layout">
        <SettingsTable>
          <Setting name="Image">Full-bleed photo on the image side. Use a portrait-oriented image at high resolution — it will be cropped to fit the panel height.</Setting>
          <Setting name="Height">Section height in pixels. Match it to the Hero height on the same page for visual rhythm.</Setting>
          <Setting name="Full bleed">Stretches the section edge-to-edge. Turn off to respect a CMS container.</Setting>
          <Setting name="Mobile — centre text">Forces the panel text to centre-align on small screens, where the two-column layout stacks vertically.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Page header mode">Split Banner has a hidden "page header" styling mode activated by the host page template — it applies tighter padding and removes the bottom margin so it sits flush below the navigation. You don't control this directly; it's handled by the page layout automatically.</ProTip>
        <ProTip title="Feature points vs subheading">Use the subheading for a continuous sentence and feature points for scannable bullets. Don't use both at length — pick one as the primary information layer.</ProTip>
        <ProTip title="Panel ratio for portrait images">If your image is portrait-oriented and you want it to show well, use a 40% panel ratio so the image side gets more room.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* FEATURED CARD                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

function FeaturedCardGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Star}>Featured Card</GuideH1>
      <Lead>
        Featured Card places a frosted-glass card anywhere on a full-bleed photo background. The card holds your eyebrow, headline (with optional accent-phrase highlight), subheading, feature points, and a CTA. You position the card in a 3×3 grid — top-left, centre, bottom-right, and so on — so the image composition dictates where the card naturally sits without covering the subject.
      </Lead>

      <GuideSection Icon={Image} title="Background">
        <SettingsTable>
          <Setting name="Image">Full-bleed background photo. Choose an image with a clear, relatively empty area where the card will sit so the subject isn't obscured.</Setting>
          <Setting name="Height">Section height in pixels. Taller sections give you more room to position the card without it overlapping the image edges.</Setting>
          <Setting name="Overlay colour & opacity">A subtle overlay (20–35%) helps the frosted card read against busy backgrounds without losing the photography entirely.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={LayoutGrid} title="Card positioning & style">
        <SettingsTable>
          <Setting name="Card position">9-cell grid (3×3) — top-left through bottom-right. Choose the cell that places the card over the emptiest area of your image.</Setting>
          <Setting name="Card background & opacity">The fill of the frosted card. White at 85–90% opacity is the classic frosted-glass look. Dark at lower opacity works well on light images.</Setting>
          <Setting name="Card blur">The backdrop blur intensity. Higher blur = stronger frosted-glass effect. Set to 0 for a solid, opaque card.</Setting>
          <Setting name="Card radius">Corner rounding of the card. Match it to your Brand Kit radius for consistency.</Setting>
          <Setting name="Card max width">Caps how wide the card grows on large screens. 480–560 px is the typical sweet spot.</Setting>
          <Setting name="Card padding">Inner padding of the card. More padding = more airy and premium; less = compact and content-dense.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Type} title="Card content">
        <SettingsTable>
          <Setting name="Eyebrow">Small label at the top of the card — a category, date, or short callout.</Setting>
          <Setting name="Heading">Main headline. Supports an <strong>accent phrase</strong> — see Pro Tips below.</Setting>
          <Setting name="Accent phrase">A word or phrase inside the heading that gets highlighted in your brand accent colour. Type it exactly as it appears in the heading field.</Setting>
          <Setting name="Subheading">Supporting paragraph beneath the heading.</Setting>
          <Setting name="Feature points">Short bullet list inside the card. Best for 2–3 key benefits.</Setting>
          <Setting name="CTA label & link">Primary call-to-action button inside the card.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Accent phrase highlight">In the Heading field, type your accent phrase exactly as it appears in the heading text, then paste it into the Accent phrase field. The section will wrap that phrase in your brand colour — a subtle but striking typographic effect that draws the eye to the key word.</ProTip>
        <ProTip title="Dark card on light images">White frosted cards work on dark/moody images. For bright, airy lifestyle photography, try a dark card (slate-900) at 90% opacity with white text — it anchors visually without competing with the image.</ProTip>
        <ProTip title="0 blur = solid card">Setting card blur to 0 turns the frosted glass into a solid opaque card. Use this when the background image is very busy and the blur effect creates visual noise.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* WELCOME                                                             */
/* ═══════════════════════════════════════════════════════════════════ */

function WelcomeGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Sparkles}>Welcome</GuideH1>
      <Lead>
        Welcome is a post-login greeter designed to make authenticated users feel at home. It holds three independent positionable blocks — a header message, a customer logo, and an account manager card — each placeable in its own 3×3 grid cell over a full-bleed background image. One section template fits dozens of brands because every block can be repositioned and shown or hidden independently.
      </Lead>

      <GuideSection Icon={Type} title="Header block">
        <SettingsTable>
          <Setting name="Eyebrow">Small text above the heading — e.g. "Welcome back" or the customer's company name.</Setting>
          <Setting name="Heading">Primary greeting headline.</Setting>
          <Setting name="Body">Optional paragraph beneath the heading — a personalised message, recent update, or promotional note.</Setting>
          <Setting name="Header position">3×3 grid cell where the header text block sits. Top-left is the most common for a reading-direction-friendly greeting.</Setting>
          <Setting name="Text colours">Override heading, body, and eyebrow colours independently from the section defaults.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Image} title="Customer logo block">
        <SettingsTable>
          <Setting name="Show logo">Toggle the customer logo block on or off. Leave off for generic (non-personalised) deployments.</Setting>
          <Setting name="Logo image">The customer's company logo. Transparent PNG recommended.</Setting>
          <Setting name="Logo max width">Caps the logo width in pixels so it doesn't overwhelm the layout. 180–240 px is typical.</Setting>
          <Setting name="Logo position">3×3 grid cell independent of the header block. Positioning it opposite the header (e.g. header top-left, logo top-right) creates a natural branded frame.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Account manager card">
        <SettingsTable>
          <Setting name="Show account manager">Toggle the card on or off. Only relevant when personalisation data is available.</Setting>
          <Setting name="Avatar">The account manager's photo. If left blank, the card shows their initials in a coloured circle.</Setting>
          <Setting name="Name, role, email, phone">Contact details rendered inside the card. Email and phone are rendered as clickable mailto/tel links automatically.</Setting>
          <Setting name="Card position">3×3 grid cell for the account manager card. Bottom-right is the common choice — prominent but not competing with the main heading.</Setting>
          <Setting name="Accent colour">Tints the card header or avatar background in a brand colour.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Background & layout">
        <SettingsTable>
          <Setting name="Background image">Full-bleed photo behind all three blocks. Choose imagery with enough visual space for all three blocks without cluttering.</Setting>
          <Setting name="Overlay colour & opacity">Controls legibility of all three blocks over the background. A subtle overlay (25–40%) usually suffices for a welcome section.</Setting>
          <Setting name="Height">Section height in pixels. Taller sections give more grid positioning flexibility.</Setting>
          <Setting name="Full bleed">Stretches edge-to-edge. Almost always on for a greeter section.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Three independent 3×3 grids">Each block (header, logo, account manager) has its own position picker completely independent of the others. You can place all three in any combination of the nine cells — just avoid overlapping cells on smaller screens.</ProTip>
        <ProTip title="Avatar initial fallback">If no avatar image is uploaded, the account manager card automatically renders the manager's initials in a coloured circle. This means the card always looks presentable even for teams not ready to upload photos.</ProTip>
        <ProTip title="Mobile centre text">Enable the mobile centre text override so text blocks that sit left or right on desktop recentre on phone-sized screens where the two-column grid collapses.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* CONTENT                                                             */
/* ═══════════════════════════════════════════════════════════════════ */

function ContentGuideContent() {
  return (
    <div>
      <GuideH1 Icon={AlignLeft}>Content</GuideH1>
      <Lead>
        Content is the all-purpose text block — an eyebrow, heading, body paragraph, and up to as many buttons as you need. Use it anywhere you need a clean, centred or left-aligned message: introductions, section breaks, standalone callouts, or between heavier visual sections.
      </Lead>

      <GuideSection Icon={Type} title="Copy">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading. Good for section categories or short callouts like "WHY CHOOSE US".</Setting>
          <Setting name="Heading">Primary headline. Can be large (display size) or moderate depending on the font size setting.</Setting>
          <Setting name="Body">Body paragraph beneath the heading. Supports full paragraphs — keep it to 2–3 sentences for scannability.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Typography & layout">
        <SettingsTable>
          <Setting name="Font size">Scale of the heading. Larger sizes work for section openers; smaller sizes for mid-page callouts where the content is secondary.</Setting>
          <Setting name="Font weight">Heading weight — thin, regular, medium, semibold, bold. Your Brand Kit font determines how these weights look in practice.</Setting>
          <Setting name="Text alignment">Left, centre, or right. Centre is common for standalone callout blocks; left suits content flowing between other left-aligned sections.</Setting>
          <Setting name="Content max width">Caps the line length of the text block. 720–800 px prevents overly wide lines on large screens.</Setting>
          <Setting name="Content full width">When on, the text block stretches to fill the container rather than being capped by max width. Use for full-width typographic statements.</Setting>
          <Setting name="Padding (top / bottom)">Vertical breathing room. Increase for standalone blocks, decrease when sandwiched between other sections.</Setting>
          <Setting name="Mobile — centre text">Overrides alignment to centre on small screens regardless of the desktop setting.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Buttons">
        <Note>Add as many buttons as needed. The first button is styled as primary (brand accent); subsequent buttons are styled as secondary by default.</Note>
        <SettingsTable>
          <Setting name="Label">Button text. Action-led labels convert better: "See the range", "Book a demo", "Download now".</Setting>
          <Setting name="Link">Destination URL or relative path.</Setting>
          <Setting name="Variant">Primary (filled, brand colour) or Secondary (outlined or ghost). Mixing one primary and one secondary CTA is the standard two-button pattern.</Setting>
          <Setting name="Open in same tab">Toggle off to open in a new tab — useful for external links like documentation or partner sites.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Reorder buttons by drag">In the button list editor, drag the handle on each button row to reorder them. The visual order in the editor matches the render order exactly.</ProTip>
        <ProTip title="Eyebrow colour for brand reinforcement">The eyebrow colour defaults to your Brand Kit accent. Change it per-section to create colour-coded content zones on a long page — e.g. red for products, blue for services.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* PRODUCT CAROUSEL                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

function ProductCarouselGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Boxes}>Product Carousel</GuideH1>
      <Lead>
        Product Carousel is a horizontally scrolling card strip for showcasing products with image, name, price, and a CTA. It's Nettailer-aware: paste a product URL and it auto-fills the name, price, and image by scraping the product page. The rendered snippet live-flips inc-VAT ↔ ex-VAT prices when the host site's VAT toggle is clicked — no custom code required.
      </Lead>

      <GuideSection Icon={Type} title="Section header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the section heading — e.g. "FEATURED PRODUCTS" or a category name.</Setting>
          <Setting name="Title">Section heading above the carousel.</Setting>
          <Setting name="Text alignment">Alignment of the header text block above the carousel. The cards always scroll horizontally regardless of this setting.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={SlidersHorizontal} title="Carousel controls">
        <SettingsTable>
          <Setting name="Columns">Number of cards visible at once: <strong>4</strong> or <strong>5</strong>. 4 columns works best on most screen widths; 5 is dense but good for compact product ranges.</Setting>
          <Setting name="Arrows">Show prev/next navigation arrows. Recommended on desktop when you have more products than columns.</Setting>
          <Setting name="Autoplay">Auto-advances the carousel. Off by default — product carousels are typically browsed at the user's pace.</Setting>
          <Setting name="Interval">Time (ms) between auto-advances when autoplay is on.</Setting>
          <Setting name="Pause on hover">Stops autoplay when the pointer is over the carousel. Always keep this on if autoplay is enabled.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Product cards">
        <SettingsTable>
          <Setting name="Name">Product name shown below the image.</Setting>
          <Setting name="Eyebrow">Small label above the name — e.g. a brand name, SKU, or category.</Setting>
          <Setting name="Description">Rich-text product description. Supports bold, italic, and lists. Keep it to 1–2 lines for clean card layout.</Setting>
          <Setting name="Price">Display price. Can be a number, a string like "from £299", or left blank to hide pricing.</Setting>
          <Setting name="Price suffix">Text after the price — e.g. "ex. VAT" or "per user". Pairs with the VAT toggle behaviour.</Setting>
          <Setting name="Image">Product photo. Square images at 800×800 px minimum look sharpest in the card.</Setting>
          <Setting name="Link">URL the card links to. Usually the product page on the host storefront.</Setting>
          <Setting name="Overlay badge">Optional text badge overlaid on the image corner (e.g. "NEW", "SALE", "–20%"). Position is configurable.</Setting>
          <Setting name="Open in same tab">Toggle to control whether the card link opens in the current or a new tab.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout">
        <SettingsTable>
          <Setting name="Hover border colour">The border colour that appears around a card on hover. Usually your brand accent colour.</Setting>
          <Setting name="Currency override">Replace the currency symbol in scraped prices with a different one — useful when the host storefront uses a different locale.</Setting>
          <Setting name="Padding (top / bottom)">Vertical breathing room above and below the carousel.</Setting>
          <Setting name="Full bleed">Stretches the section edge-to-edge.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Auto-fill from product URL">Paste a product page URL into the "Live refresh URL" field on any product card and click the fetch button. The section scrapes the page and populates name, price, and image automatically — huge time-saver for large catalogues.</ProTip>
        <ProTip title="VAT toggle sync">The snippet automatically detects and responds to Nettailer, Netset, and most storefronts that label their VAT toggle in English, Swedish, or French. When the user clicks the site's VAT toggle, all product prices in the section flip between inc- and ex-VAT in real time.</ProTip>
        <ProTip title="Rich text in descriptions">The description field uses the Tiptap editor — you can bold key specs, create bullet lists, or add links. This is the only product field that supports rich formatting.</ProTip>
        <ProTip title="Badge position">The overlay badge has a corner position picker (top-left, top-right, bottom-left, bottom-right). Top-left is most common; bottom-right avoids covering the main subject of product photography.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* PRODUCT GRID                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

function ProductGridGuideContent() {
  return (
    <div>
      <GuideH1 Icon={LayoutGrid}>Product Grid</GuideH1>
      <Lead>
        Product Grid uses the same product card design as Product Carousel but arranges cards in a static CSS grid (2–6 columns) rather than a scrollable strip. It has the same Nettailer-aware URL scraping and VAT-toggle sync. On mobile it can optionally switch to a swipeable carousel — the best of both worlds.
      </Lead>

      <GuideSection Icon={Settings} title="Grid layout">
        <SettingsTable>
          <Setting name="Columns">Number of columns: 2–6. 3–4 columns is the most common choice. Fewer columns = larger cards; more columns = denser but more compact grid.</Setting>
          <Setting name="Padding (top / bottom)">Vertical breathing room above and below the grid.</Setting>
          <Setting name="Full bleed">Stretches the section edge-to-edge.</Setting>
          <Setting name="Text alignment">Alignment of the header text block above the grid.</Setting>
          <Setting name="Card text alignment">Alignment of text within each product card — independent of the header alignment.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={SlidersHorizontal} title="Mobile carousel mode">
        <Note>On mobile, a multi-column grid compresses cards to the point of illegibility. Mobile carousel mode solves this by switching the grid to a swipeable carousel on small screens.</Note>
        <SettingsTable>
          <Setting name="Enable mobile carousel">Switches the grid to a horizontal scroll carousel on screens below the breakpoint. Highly recommended for grids with 3+ columns.</Setting>
          <Setting name="Mobile arrows">Show prev/next arrows in mobile carousel mode.</Setting>
          <Setting name="Mobile autoplay">Auto-advance the mobile carousel.</Setting>
          <Setting name="Mobile interval">Time (ms) between auto-advances on mobile.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Product cards">
        <Note>Product cards in Product Grid are identical to those in Product Carousel — name, eyebrow, description (rich text), price, price suffix, image, link, overlay badge, and open-in-same-tab. The same URL auto-fill and VAT toggle behaviour applies.</Note>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Use Grid for catalogues, Carousel for spotlights">Product Carousel is best for a curated selection of 4–8 hero products. Product Grid is better for complete category listings (8–24+ products) where users want to scan and compare.</ProTip>
        <ProTip title="Mobile carousel for 3+ column grids">A 4-column grid on mobile compresses cards to ~90px wide — unusable. Enable mobile carousel mode to give mobile users a proper browsing experience without changing the desktop layout.</ProTip>
        <ProTip title="Currency override for multi-market sites">If the scraped price includes a currency symbol that differs from your market, the currency override strips the original and replaces it. Regex-powered — handles £, $, €, kr, and most standard symbols.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* BLOG INDEX                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

function BlogIndexGuideContent() {
  return (
    <div>
      <GuideH1 Icon={BookMarked}>Blog Index</GuideH1>
      <Lead>
        Blog Index is a searchable card grid for listing blog posts, articles, or any content collection. An optional full-bleed photo header sits above the grid. Cards support image, category, date, author, title, and excerpt. Built-in search filters cards by title, excerpt, category, and author in real time — no backend required.
      </Lead>

      <GuideSection Icon={Image} title="Header background">
        <SettingsTable>
          <Setting name="Header image">Full-bleed photo behind the heading area at the top of the section. Leave blank for a plain-colour header.</Setting>
          <Setting name="Header height">Height of the header image area in pixels. 300–400 px is typical for a blog index header.</Setting>
          <Setting name="Header radius">Corner rounding of the header image. Usually inherits from your Brand Kit radius.</Setting>
          <Setting name="Overlay type & colour">Controls text legibility over the header image. Use a gradient for a subtle fade rather than a flat block overlay.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Type} title="Section header content">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading — e.g. "INSIGHTS" or "LATEST NEWS".</Setting>
          <Setting name="Heading">Primary section title, rendered over the header image (or plain background).</Setting>
          <Setting name="Subheading">Supporting sentence beneath the heading.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Post cards">
        <SettingsTable>
          <Setting name="Title">Post headline — shown prominently on the card.</Setting>
          <Setting name="Excerpt">Short description shown beneath the title. 1–2 sentences works best.</Setting>
          <Setting name="Image">Card thumbnail image. Landscape images at 16:9 give the cleanest card layout.</Setting>
          <Setting name="Category">Tag shown above the title. Used in search filtering.</Setting>
          <Setting name="Author">Author name. Shown on the card and included in search.</Setting>
          <Setting name="Date">Publication date in YYYY-MM-DD format. Rendered in localised format (e.g. "12 June 2025").</Setting>
          <Setting name="Link">URL the card links to. Usually the individual blog post page.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Search} title="Search">
        <SettingsTable>
          <Setting name="Enable search">Adds a search input that filters cards in real time. Works entirely client-side — no server needed.</Setting>
          <Setting name="Search placeholder">Input placeholder text — e.g. "Search articles…".</Setting>
          <Setting name="Search position">Place the search bar inside the <strong>header</strong> (overlaid on the header image) or <strong>below</strong> the header before the card grid.</Setting>
          <Setting name="Search alignment">Left, centre, or right alignment of the search bar.</Setting>
          <Setting name="Search width">Max width of the search input. 480–600 px is comfortable on desktop.</Setting>
          <Setting name="No match text">Message shown when no cards match the search query — e.g. "No articles found."</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout & hover effects">
        <SettingsTable>
          <Setting name="Columns">Number of grid columns. 2–3 columns is standard for blog indices; 1 column gives a list/editorial layout.</Setting>
          <Setting name="Card alignment">Text alignment within each card — left, centre, or right.</Setting>
          <Setting name="Card radius">Corner rounding of each card.</Setting>
          <Setting name="Hover effect"><strong>Lift</strong> = card rises with shadow on hover. <strong>Bar</strong> = an accent-coloured bar appears on the card edge. <strong>None</strong> = no hover animation.</Setting>
          <Setting name="Bar side & colour">When hover effect is Bar, choose which edge (top/right/bottom/left) and what colour the bar is.</Setting>
          <Setting name="Full bleed">Stretches the section edge-to-edge.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Search in the header">Placing the search bar inside the header image creates a magazine-style hero search bar — the input floats over the photography. Pair with a gradient overlay darkening the bottom of the header image so the input is always legible.</ProTip>
        <ProTip title="Search filters four fields simultaneously">The search haystack includes title, excerpt, category, and author — so a query like "sustainability" will match posts about sustainability written by anyone, in any category that mentions it.</ProTip>
        <ProTip title="Date formatting is automatic">Enter the date in YYYY-MM-DD format and the snippet renders it in a locale-appropriate format (day month year in British English, month day year in US English, etc.).</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* BLOG BODY                                                           */
/* ═══════════════════════════════════════════════════════════════════ */

function BlogBodyGuideContent() {
  return (
    <div>
      <GuideH1 Icon={BookOpen}>Blog Body</GuideH1>
      <Lead>
        Blog Body is a long-form article block with an optional sidebar. The body uses a rich-text editor (Tiptap) so you can write and format directly inside the section. The sidebar supports four widget types — CTA, related articles, tag cloud, and author card — and can sit left, right, or below the body. On mobile the sidebar collapses to a horizontal swipe carousel.
      </Lead>

      <GuideSection Icon={Type} title="Header">
        <SettingsTable>
          <Setting name="Eyebrow">Category or tag label above the heading — e.g. "SUSTAINABILITY" or "CASE STUDY".</Setting>
          <Setting name="Heading">Article title. Usually your h1 for the post.</Setting>
          <Setting name="Subheading">Subtitle or deck — a single sentence that expands on the title.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={AlignLeft} title="Article body">
        <SettingsTable>
          <Setting name="Body (rich text)">Full article content edited with Tiptap. Supports headings (h2, h3), bold, italic, ordered and unordered lists, links, and text alignment. Write long-form content here directly.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={LayoutTemplate} title="Sidebar layout">
        <SettingsTable>
          <Setting name="Sidebar position"><strong>Right</strong> (most common), <strong>Left</strong> (editorial), or <strong>Below</strong> the body (removes the two-column layout).</Setting>
          <Setting name="Sidebar width">Width of the sidebar column as a percentage of the total section width. 30–35% is typical.</Setting>
          <Setting name="Sidebar gap">Space between the body text and the sidebar column.</Setting>
          <Setting name="Sticky on scroll">Makes the sidebar stick to the top of the viewport as the user scrolls the article body. Only applies on desktop — mobile always stacks or carousels.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Sidebar widgets">
        <Note>Add widgets in any order and combination. Each widget is a self-contained card inside the sidebar column.</Note>
        <SettingsTable>
          <Setting name="CTA widget">A mini call-to-action card: heading, body, button. Great for newsletter sign-ups or related product promotions.</Setting>
          <Setting name="Related articles widget">A list of links to other posts. Add them manually via the link picker or pull them from existing Blog Body pages in your workspace.</Setting>
          <Setting name="Tags widget">A tag cloud of category chips. Each tag is a link. Add as many tags as needed.</Setting>
          <Setting name="Author card widget">Author name, role, bio, and avatar. If no avatar is uploaded, initials appear in a coloured circle. Includes an optional link to an author page.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Sticky sidebar for long articles">Enable sticky sidebar when your article body is long (1,000+ words). The sidebar widgets stay visible as the reader scrolls, so the CTA or related articles are always in view without competing with the content.</ProTip>
        <ProTip title="Mobile sidebar carousel">On mobile the sidebar widgets automatically become a horizontal swipe carousel — each widget is a swipeable card. This avoids stacking all widgets in a long vertical column below the article body.</ProTip>
        <ProTip title="Related articles pulls from your workspace">In the related articles widget, use the content picker to pull Blog Body pages or sections you've already built. This creates a live cross-link without manually typing URLs.</ProTip>
        <ProTip title="Sidebar below for newsletter-style layouts">Setting sidebar position to Below gives you a full-width article body with the widgets (author card, CTA) appearing as a row of cards at the bottom — a clean newsletter or press-release layout.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* INSIGHTS GRID                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

function InsightsGridGuideContent() {
  return (
    <div>
      <GuideH1 Icon={LayoutGrid}>Insights Grid</GuideH1>
      <Lead>
        Insights Grid is a 1–3 column editorial grid for mixed-media cards — articles, case studies, product spotlights. Each card supports an icon or image, an optional brand logo, heading, body text, and a link. Cards have three layout variants (image left, image top, image right) and an optional accent border on the left edge.
      </Lead>

      <GuideSection Icon={Type} title="Section header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the section heading.</Setting>
          <Setting name="Title">Section heading above the grid.</Setting>
          <Setting name="Text alignment">Alignment of the section header text block.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Cards">
        <SettingsTable>
          <Setting name="Card icon">An icon from the icon library shown at the top of the card (or on the left in image-left layout). Each card can have a different icon.</Setting>
          <Setting name="Card image">An image used instead of an icon. If both are provided, the image takes precedence.</Setting>
          <Setting name="Brand logo">An optional secondary logo shown below the icon/image and above the heading. Useful for partner or co-branded cards.</Setting>
          <Setting name="Heading">Card title — the primary link text if a link URL is provided.</Setting>
          <Setting name="Body">Short description beneath the heading. 1–3 sentences.</Setting>
          <Setting name="Link text & URL">Text link at the bottom of the card. If both are provided the heading also becomes a link.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout">
        <SettingsTable>
          <Setting name="Columns">1–3 columns. 2 columns for feature spotlights; 3 for a richer editorial grid.</Setting>
          <Setting name="Card layout"><strong>Image top</strong> = image above text (standard card). <strong>Image left</strong> = image thumbnail left, text right (compact list-style). <strong>Image right</strong> = text left, image right.</Setting>
          <Setting name="Image width">Width of the image in image-left/right layouts. Controls the balance between image and text areas.</Setting>
          <Setting name="Accent border">A short left-edge border on each card in the Brand Kit accent colour. Adds a subtle typographic marker without using a full card background.</Setting>
          <Setting name="Footer link">An optional "View all" style link shown below the grid.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Mix icon and image cards">Some cards can use an icon, others an image — within the same grid. This is useful when you have a mix of abstract concept cards (icon) and real photography cards (image) in the same section.</ProTip>
        <ProTip title="Logo + icon on the same card">You can show both an icon at the top and a brand logo below it. Icon conveys category; logo conveys the partner or source brand. Best for partner programme or integration showcase grids.</ProTip>
        <ProTip title="Accent border as a lightweight hover cue">The accent border is static by default but combines with the card hover styles to create a polished hover state — the border stays visible and the card lifts on hover.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* RESOURCES                                                           */
/* ═══════════════════════════════════════════════════════════════════ */

function ResourcesGuideContent() {
  return (
    <div>
      <GuideH1 Icon={BookOpen}>Resources</GuideH1>
      <Lead>
        Resources is a horizontally scrolling card carousel for guides, downloads, blog posts, or any tagged content collection. Each card has an image, a colour-tinted tag chip, a title, and a link. It's lighter and faster to configure than Blog Index — use it for curated spotlights rather than complete content archives.
      </Lead>

      <GuideSection Icon={Type} title="Section header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the section heading.</Setting>
          <Setting name="Title">Section heading above the carousel.</Setting>
          <Setting name="Heading size">Scale of the section heading — display or standard. Use display for hero-style section openers.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={SlidersHorizontal} title="Carousel controls">
        <SettingsTable>
          <Setting name="Columns">Number of cards visible at once: 2–5. 3 is the most balanced for most screen widths.</Setting>
          <Setting name="Arrows">Show prev/next navigation arrows.</Setting>
          <Setting name="Autoplay">Auto-advance the carousel.</Setting>
          <Setting name="Interval">Time (ms) between auto-advances.</Setting>
          <Setting name="Pause on hover">Stops autoplay while the pointer is over the carousel.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Resource cards">
        <SettingsTable>
          <Setting name="Image">Card thumbnail. Landscape images at 16:9 give the cleanest layout.</Setting>
          <Setting name="Tag">Category chip above the title — e.g. "Guide", "Whitepaper", "Video". Tinted in the tag colour setting.</Setting>
          <Setting name="Title">Card headline and primary link text.</Setting>
          <Setting name="Link">Destination URL. The entire card is clickable.</Setting>
          <Setting name="Open in same tab">Toggle to control new-tab behaviour.</Setting>
          <Setting name="Content alignment override">Override the default card text alignment for this card individually.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Per-card content alignment">Each card has its own content alignment override — so you can centre-align image-only cards and left-align cards with longer text within the same carousel.</ProTip>
        <ProTip title="Tag colour as a content-type signal">Set a distinct tag colour (separate from your Brand Kit accent) to visually encode content type. For example: blue for guides, green for case studies, amber for videos — users scan by colour before they read.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* FEATURE GRID                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

function FeatureGridGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Sparkles}>Feature Grid</GuideH1>
      <Lead>
        Feature Grid is the go-to value-proposition block — 2–4 columns of cards, each with an icon or image, a title, intro text, and a rich-text body. Three card styles (outlined, tinted, solid) and three card layouts (icon, image-top, image-left) give it enough range to cover everything from a simple "why us" strip to a detailed feature comparison.
      </Lead>

      <GuideSection Icon={Type} title="Section header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the section heading.</Setting>
          <Setting name="Heading">Primary section heading.</Setting>
          <Setting name="Subheading">Supporting sentence beneath the heading.</Setting>
          <Setting name="Text alignment">Alignment of the header block — left for document-style layouts, centre for standalone feature sections.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Palette} title="Card style">
        <SettingsTable>
          <Setting name="Card style"><strong>Outlined</strong> = white card with a thin border — clean and minimal. <strong>Tinted</strong> = a light tint of your accent colour as the card background. <strong>Solid</strong> = your full accent or custom colour as the card background — high contrast, bold.</Setting>
          <Setting name="Card radius">Corner rounding of each card. Inherits from Brand Kit by default.</Setting>
          <Setting name="Columns">2–4 columns. 3 is the most versatile; 4 works for short feature titles and icon-only layouts.</Setting>
          <Setting name="Text alignment (header)">Alignment of the section header above the cards — independent of card text alignment.</Setting>
          <Setting name="Card text alignment">Alignment of text within each individual card. Can differ from the header alignment.</Setting>
          <Setting name="Mobile text alignment">Override card text alignment on mobile screens — useful when cards stack to a single column and centred text reads better.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={LayoutGrid} title="Card layout">
        <SettingsTable>
          <Setting name="Card layout"><strong>Icon</strong> = icon above the text (standard). <strong>Image top</strong> = image above the text, full card width. <strong>Image left</strong> = thumbnail image left, text right — compact list-style.</Setting>
          <Setting name="Icon source"><strong>Library</strong> = pick from the built-in icon set. <strong>Image</strong> = upload your own icon or illustration.</Setting>
          <Setting name="Icon / image">The icon or image for this card. Each card can use a different icon or image.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Feature cards">
        <SettingsTable>
          <Setting name="Title">Card heading — the feature name.</Setting>
          <Setting name="Intro">Short summary text, shown just below the title in a slightly smaller, lighter weight.</Setting>
          <Setting name="Body (rich text)">Expanded description with full Tiptap rich-text formatting. Use this for detailed feature explanations when the intro alone isn't enough.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Rich text body per card">Each feature card has a full rich-text body (separate from the intro) that supports headings, lists, and links. Use this for feature comparison tables, spec lists, or step-by-step instructions embedded inside a card.</ProTip>
        <ProTip title="Alignment cascade">There are four independent alignment controls: header text, card text, mobile card text, and mobile header text. This lets you left-align the section heading on desktop while centring card text on mobile — two completely different layouts from one section.</ProTip>
        <ProTip title="Solid cards for pricing tiers">Solid-style cards with a high-contrast background work very well as pricing tier cards — one "recommended" tier in full brand colour, others in outlined or tinted style to create hierarchy.</ProTip>
        <ProTip title="Mix icon and image cards">Individual cards can use an icon from the library while others use an uploaded image. This is useful when some features have recognisable icons and others need custom illustrations.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* TRUST STRIP                                                         */
/* ═══════════════════════════════════════════════════════════════════ */

function TrustStripGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Shield}>Trust Strip</GuideH1>
      <Lead>
        Trust Strip is a compact, flat row of credibility callouts — icon, title, and a one-line supporting statement per item. It deliberately has no cards, no shadows, and no backgrounds — it's designed to counterweight heavier sections above and below it. Use it for certifications, statistics, guarantees, or partnership badges.
      </Lead>

      <GuideSection Icon={Layers} title="Items">
        <SettingsTable>
          <Setting name="Icon">An icon from the library for this callout. Common choices: Shield (security), Award (accreditation), Clock (response time), Users (team size).</Setting>
          <Setting name="Title">The primary callout — e.g. "ISO 27001 Certified", "20+ Years Experience", "24/7 Support".</Setting>
          <Setting name="Body">One supporting line beneath the title — a brief elaboration. Keep it to a single short sentence.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout & style">
        <SettingsTable>
          <Setting name="Columns">2–5 items per row. 3–4 is most balanced. Fewer items = more breathing room per callout.</Setting>
          <Setting name="Icon size">Size of the icons in pixels. 24–32 px is typical; larger icons work if the strip is more prominent.</Setting>
          <Setting name="Icon style"><strong>Tinted</strong> = icon in a tinted circle using your accent colour. <strong>Flat</strong> = plain icon with no background — more minimal.</Setting>
          <Setting name="Alignment">Left or centre alignment of the icon + text within each column.</Setting>
          <Setting name="Dividers">Thin vertical lines between columns on desktop (horizontal on mobile). Adds visual structure without adding visual weight.</Setting>
          <Setting name="Full bleed">Stretches the section edge-to-edge.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Pair with Stat Counter">Trust Strip (flat, qualitative) and Stat Counter (numeric, animated) are natural complements. A common pattern: Stat Counter for outcomes ("36% increase in revenue") above, Trust Strip for credentials ("ISO 27001 Certified") below.</ProTip>
        <ProTip title="No background keeps it weightless">The deliberately flat design means Trust Strip can appear between two visually heavy sections (e.g. Hero above, Feature Grid below) without creating a visual speed bump. Don't add a background colour unless you specifically want it to stand out.</ProTip>
        <ProTip title="Dividers on desktop, none on mobile">Dividers automatically switch from vertical (desktop) to horizontal (mobile) as the grid collapses. The result is a clean visual structure on both breakpoints from a single toggle.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* STAT COUNTER                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

function StatCounterGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Hash}>Stat Counter</GuideH1>
      <Lead>
        Stat Counter displays a row of big numbers — revenue growth, client counts, years of experience — each with a prefix, suffix, label, and optional supporting line. Numbers animate from zero when the section scrolls into view. An optional header above and a CTA button below bookend the stats row.
      </Lead>

      <GuideSection Icon={Type} title="Optional header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the section heading — e.g. "BY THE NUMBERS" or "OUR IMPACT".</Setting>
          <Setting name="Heading">Section heading above the stats row. Leave blank to start directly with the numbers.</Setting>
          <Setting name="Body">Supporting paragraph beneath the heading.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Hash} title="Stat items">
        <SettingsTable>
          <Setting name="Prefix">Text before the number — e.g. "£", "+", "~". Rendered slightly smaller than the number itself.</Setting>
          <Setting name="Value">The number to display and animate to. Enter the target value as a plain number (e.g. 2400000 for 2.4M).</Setting>
          <Setting name="Suffix">Text after the number — e.g. "%", "M", "+", "k". Rendered at the same size as the number.</Setting>
          <Setting name="Label">Short label below the number — e.g. "Revenue growth", "Clients served", "Countries".</Setting>
          <Setting name="Body">Optional supporting line beneath the label — a one-sentence elaboration.</Setting>
          <Setting name="Accent colour override">Give this specific stat a different accent colour for the number — useful for visually differentiating between multiple metrics.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={SlidersHorizontal} title="Animation & formatting">
        <SettingsTable>
          <Setting name="Animate">Count-up animation from 0 to the target value when the section scrolls into view. Powered by IntersectionObserver and respects prefers-reduced-motion.</Setting>
          <Setting name="Animation duration">Time (ms) to count from 0 to the target. 1,500–2,000 ms feels smooth without being slow.</Setting>
          <Setting name="Thousands separator">Adds commas (or locale-appropriate separators) to large numbers — so 1000000 renders as 1,000,000.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout">
        <SettingsTable>
          <Setting name="Columns">2–5 stats per row. 3–4 is most balanced.</Setting>
          <Setting name="Alignment">Left or centre alignment of each stat block.</Setting>
          <Setting name="Number size">Scale of the big number — from display to heading size. Larger = more impact; smaller = more stats can fit in the row.</Setting>
          <Setting name="Number weight">Font weight of the numbers. Heavy (700) is the conventional choice for stats.</Setting>
          <Setting name="Dividers">Thin vertical dividers between columns for visual structure.</Setting>
          <Setting name="CTA text & link">Optional button below the stats row — e.g. "Read our case studies".</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Count-up respects reduced motion">The count-up animation automatically skips for users who have reduced motion enabled in their OS — numbers appear at their final value immediately. No code changes needed.</ProTip>
        <ProTip title="Per-stat accent colour">Each individual stat can have a different accent colour for its number. Use this to create a traffic-light effect or to match each stat to a product line colour.</ProTip>
        <ProTip title="Prefix + suffix for non-numeric values">You can use prefix and suffix creatively: prefix "~" + value "36" + suffix "%" renders as "~36%" — useful for approximate or rounded statistics.</ProTip>
        <ProTip title="Thousands separator for large numbers">Enable thousands separator and enter raw numbers (2400000) rather than formatted strings. The section handles the formatting — and the count-up animation works correctly because it's counting raw numbers.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* VIDEO EMBED                                                         */
/* ═══════════════════════════════════════════════════════════════════ */

function VideoEmbedGuideContent() {
  return (
    <div>
      <GuideH1 Icon={PlayCircle}>Video Embed</GuideH1>
      <Lead>
        Video Embed shows a poster image with a play button. When the user clicks play, a modal lightbox opens and the video loads for the first time — nothing from YouTube or Vimeo loads until that moment, keeping the page fast and privacy-friendly. Supports YouTube, Vimeo, and direct MP4/WebM file URLs.
      </Lead>

      <GuideSection Icon={Type} title="Optional header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the section heading.</Setting>
          <Setting name="Heading">Section heading above the video poster. Leave blank to show just the poster.</Setting>
          <Setting name="Body">Supporting paragraph beneath the heading.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={PlayCircle} title="Video & poster">
        <SettingsTable>
          <Setting name="Video URL">YouTube share URL, Vimeo URL, or a direct link to an MP4/WebM/OGG file. The section auto-detects the provider and generates the correct embed URL.</Setting>
          <Setting name="Poster image">The thumbnail shown before the user clicks play. Use a high-quality frame from the video or a custom graphic. Without a poster, a grey placeholder is shown.</Setting>
          <Setting name="Poster alt text">Descriptive alt text for the poster image — important for accessibility.</Setting>
          <Setting name="Aspect ratio">The ratio of the video player: <strong>16:9</strong> (standard), <strong>4:3</strong> (classic), <strong>1:1</strong> (square), <strong>21:9</strong> (cinematic). Match this to your video's native aspect ratio.</Setting>
          <Setting name="Autoplay in modal">When on, the video starts playing as soon as the modal opens. Use with caution — unexpected audio can startle users.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Player & layout">
        <SettingsTable>
          <Setting name="Player max width">Maximum width of the video player in the modal lightbox. 900–1,100 px is comfortable on most screens.</Setting>
          <Setting name="Poster max width">Maximum width of the poster thumbnail on the page. Smaller values create a more editorial, contained look.</Setting>
          <Setting name="Alignment">Left or centre alignment of the poster within the section.</Setting>
          <Setting name="Play button style"><strong>Solid</strong> = filled circle with a play triangle. <strong>Outline</strong> = transparent circle with border — more subtle over light posters.</Setting>
          <Setting name="Play button size">Size of the play button overlay in pixels.</Setting>
          <Setting name="Modal overlay colour">The background behind the video player in the modal. Dark (black, 90% opacity) is standard; lighter overlays create a softer look.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Privacy-friendly by design">No YouTube or Vimeo scripts, cookies, or tracking pixels load until the user explicitly clicks play. This means the page loads fast and complies with cookie consent requirements without any additional configuration.</ProTip>
        <ProTip title="ESC and click-outside close">The modal closes on ESC key or clicking the overlay — standard behaviour that users expect. Focus is returned to the play button after closing so keyboard navigation stays intact.</ProTip>
        <ProTip title="Direct MP4 for hosted videos">If you host your own video file, paste the direct .mp4 URL. The section renders a native HTML5 video player in the modal — no third-party embed required, no branding, full control.</ProTip>
        <ProTip title="Custom poster = better first impression">YouTube's auto-generated thumbnails are often blurry frames of the video. A custom poster image designed at the exact aspect ratio gives a much more polished first impression.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* COMPARISON TABLE                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

function ComparisonTableGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Columns3}>Comparison Table</GuideH1>
      <Lead>
        Comparison Table is an "us vs them" matrix with your brand in a highlighted column and up to four competitor columns on the right. Feature rows show checkmarks, crosses, or plain text per cell. An optional full-bleed photo header sits above the table. The table collapses to a stacked card layout on mobile so it remains readable on small screens.
      </Lead>

      <GuideSection Icon={Image} title="Header background (optional)">
        <Note>Leave the header image blank for a plain text header above the table. Add an image to create a full-bleed photo header — the same pattern used by Blog Index and Brand Grid.</Note>
        <SettingsTable>
          <Setting name="Background image">Full-bleed photo above the table. Leave blank for a plain-colour header.</Setting>
          <Setting name="Header height">Height of the photo band in pixels (120–520 px). 220–300 px is typical.</Setting>
          <Setting name="Corner radius">Rounds the header image corners. Set to 0 for a flush full-bleed look; disabled automatically when Make wide is on.</Setting>
          <Setting name="Overlay style">Solid colour or linear gradient over the photo for text legibility.</Setting>
          <Setting name="Overlay colour / gradient">Fill colour(s) of the overlay. Dark slate or your brand secondary colour works well.</Setting>
          <Setting name="Overlay opacity">How opaque the overlay is (0–100%). Higher values = more readable text but less visible photography.</Setting>
          <Setting name="Header text colour">Colour of the eyebrow, title and subheading when displayed over the photo. The eyebrow still uses its configured colour from the brand kit — only the title and subheading are forced to this value.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Type} title="Section header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading — e.g. "WHY CHOOSE US".</Setting>
          <Setting name="Title">Section heading above the table.</Setting>
          <Setting name="Subheading">Supporting sentence beneath the heading.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Columns3} title="Columns">
        <SettingsTable>
          <Setting name="Feature column label">Header for the leftmost column listing features — e.g. "Feature", "What you get".</Setting>
          <Setting name="Your brand label">Header for your column — your company or product name.</Setting>
          <Setting name="Brand logo">Optional logo image in your column header. Renders above the label text.</Setting>
          <Setting name="Brand logo max height">Caps the logo height in pixels so it doesn't make the header row too tall.</Setting>
          <Setting name="Add competitor column">Adds a new competitor column (up to 4). Each competitor gets its own label and per-row value fields.</Setting>
          <Setting name="Competitor label">Header for each competitor column — e.g. "Typical agency", "Standard platform".</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Feature rows">
        <SettingsTable>
          <Setting name="Feature">The capability or attribute being compared — e.g. "24/7 support", "Custom branding", "API access".</Setting>
          <Setting name="Your value">What your brand offers for this feature. Can be a short text string or left blank (the icon does the talking).</Setting>
          <Setting name="Your icon"><strong>Check</strong> (✓), <strong>Cross</strong> (✗), or <strong>None</strong>. A check in your column and a cross in the competitor's is the classic persuasive pattern.</Setting>
          <Setting name="Competitor value / icon">Per-competitor value and icon for each row — each column has its own value and check/cross/none picker.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout & style">
        <SettingsTable>
          <Setting name="Highlight your column">Applies a tint and an accent-colour border to your column — draws the eye to it immediately on page load.</Setting>
          <Setting name="Zebra stripes">Alternating row background tints to make long tables easier to scan.</Setting>
          <Setting name="Make wide">Stretches the section background to full viewport width. Also removes the header corner radius.</Setting>
          <Setting name="Text alignment">Left or centre alignment of all cell content.</Setting>
          <Setting name="Closing text">Short closing statement below the table — reinforce the value proposition before the footer link.</Setting>
          <Setting name="Footer link">A CTA link below the table — e.g. "Book a demo" or "Start free trial".</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Up to 4 competitor columns">Add competitor columns from the Columns panel. Each column gets its own label at the top and its own value + icon picker on every feature row — the grid expands automatically.</ProTip>
        <ProTip title="Mobile card collapse">On small screens, each feature row becomes a stacked comparison card — your value above, competitor values below — so multi-column layouts stay readable without horizontal scrolling.</ProTip>
        <ProTip title="Zebra stripes for long tables">For tables with more than 6–7 rows, enable zebra stripes. The alternating tint helps readers track across the row without losing their place.</ProTip>
        <ProTip title="Use text values for nuanced comparisons">Don't limit yourself to check/cross icons. A text value like "Unlimited" vs "Up to 5" communicates nuance that a simple tick/cross misses — combine text values with icon None for the most informative rows.</ProTip>
        <ProTip title="Photo header + brand logo = strong first impression">A dark-overlay photo behind the heading, combined with your logo in the column header, creates a polished page-section feel that goes beyond a plain table.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* STEPS                                                               */
/* ═══════════════════════════════════════════════════════════════════ */

function StepsGuideContent() {
  return (
    <div>
      <GuideH1 Icon={ListOrdered}>Steps</GuideH1>
      <Lead>
        Steps is a numbered process strip for showing how something works — onboarding flows, ordering processes, project methodologies. Steps can run horizontally (strip across the page) or vertically (stacked list). Numbers are either large editorial numerals, small inline circles, or hidden entirely if you prefer to use icons instead.
      </Lead>

      <GuideSection Icon={Type} title="Section header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading — e.g. "HOW IT WORKS" or "THE PROCESS".</Setting>
          <Setting name="Heading">Primary section heading.</Setting>
          <Setting name="Subheading">Supporting sentence beneath the heading.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout">
        <SettingsTable>
          <Setting name="Layout"><strong>Horizontal</strong> = steps in a row across the page, separated by dividers. <strong>Vertical</strong> = steps stacked in a single column with a connecting line down the left side.</Setting>
          <Setting name="Number style"><strong>Large</strong> = big editorial numeral above the step title. <strong>Small</strong> = compact numbered circle before the title (like a list marker). <strong>None</strong> = no number — use icons instead for a more visual process.</Setting>
          <Setting name="Divider">Hairline dividers between steps on horizontal layout. Turn off for a more open, breathing layout.</Setting>
          <Setting name="Text alignment">Left or centre alignment of step content. Centre works well for horizontal strips; left for vertical lists.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Steps">
        <SettingsTable>
          <Setting name="Icon">Optional icon for each step. Best used when number style is None — the icon replaces the number as the visual anchor.</Setting>
          <Setting name="Title">Step name or short description — e.g. "Book a call", "We build your design", "Go live".</Setting>
          <Setting name="Body">One or two sentences elaborating on what happens in this step.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Horizontal for 4+ steps at a glance">Horizontal layout is best when you want users to see all steps simultaneously — it reinforces a linear left-to-right progression. For 4 or more steps, ensure step titles are short (2–4 words) so they don't wrap awkwardly.</ProTip>
        <ProTip title="Large numbers for editorial impact">The "large" number style creates a typographic feature — the big numeral is part of the design. Pair it with a brand typeface weight (bold or black) for maximum impact.</ProTip>
        <ProTip title="Icons instead of numbers for non-sequential processes">If your process isn't strictly ordered (e.g. a set of parallel workstreams), use icons with number style None to avoid implying a sequence that doesn't exist.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* TESTIMONIALS                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

function TestimonialsGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Quote}>Testimonials</GuideH1>
      <Lead>
        Testimonials is an auto-scrolling marquee of quote cards — the same seamless infinite scroll as the Logo Strip but with richer cards carrying a quote, name, role, avatar, star rating, and an optional platform logo. The marquee pauses on hover so readers can actually finish reading before it moves on.
      </Lead>

      <GuideSection Icon={Type} title="Section header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading — e.g. "WHAT OUR CLIENTS SAY".</Setting>
          <Setting name="Title">Section heading above the marquee.</Setting>
          <Setting name="Subheading">Supporting sentence beneath the heading.</Setting>
          <Setting name="Text alignment">Alignment of the header block — centre is most common for testimonials.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={SlidersHorizontal} title="Marquee controls">
        <SettingsTable>
          <Setting name="Speed">Scroll speed in seconds per full loop. Higher = slower. 30–50 s is comfortable for reading; 15–20 s feels energetic for brand-only visual carousels.</Setting>
          <Setting name="Card width">Width of each testimonial card in pixels. 320–400 px fits most quote lengths without wrapping excessively.</Setting>
          <Setting name="Card gap">Space between cards in the marquee.</Setting>
          <Setting name="Show ratings">Toggle star ratings (1–5 stars) on or off globally. When on, each card shows its star rating beneath the quote.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Testimonial cards">
        <SettingsTable>
          <Setting name="Quote">The testimonial text. Keep quotes to 2–4 sentences — longer quotes get cut off visually in the card at typical card widths.</Setting>
          <Setting name="Name">Reviewer name.</Setting>
          <Setting name="Role">Reviewer's title and company — e.g. "Head of Marketing, Acme Corp".</Setting>
          <Setting name="Avatar">Reviewer photo. If left blank, the card shows their initials in a coloured circle.</Setting>
          <Setting name="Rating">Star rating from 1 to 5. Only visible when Show ratings is on.</Setting>
          <Setting name="Platform logo">Optional logo of the review platform (e.g. Google, Trustpilot, G2). Appears as a small badge on the card.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Hover pause is essential">The marquee pauses automatically when the user hovers over it. This is critical for testimonials — quote cards take 5–10 seconds to read and the user needs to be able to stop the motion to finish reading.</ProTip>
        <ProTip title="Avatar initial fallback">No photo uploaded? The card automatically generates a coloured circle with the reviewer's initials. Add an avatar later and it drops straight in — the card layout adjusts automatically.</ProTip>
        <ProTip title="Platform logo for social proof layering">Adding a Google or Trustpilot logo to cards that come from those platforms adds a layer of credibility — readers recognise the third-party source at a glance.</ProTip>
        <ProTip title="prefers-reduced-motion">The marquee animation automatically stops for users who have reduced motion enabled in their OS — cards are displayed statically instead.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* FAQ                                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function FAQGuideContent() {
  return (
    <div>
      <GuideH1 Icon={HelpCircle}>FAQ</GuideH1>
      <Lead>
        FAQ is a collapsible Q&amp;A accordion built on native HTML <code className="text-[13px] bg-slate-100 px-1.5 py-0.5 rounded">&lt;details&gt;</code> and <code className="text-[13px] bg-slate-100 px-1.5 py-0.5 rounded">&lt;summary&gt;</code> elements — fully keyboard accessible and functional without JavaScript. Single-open mode is available for a true accordion that closes the previous question when a new one is opened.
      </Lead>

      <GuideSection Icon={Type} title="Section header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading — e.g. "FREQUENTLY ASKED QUESTIONS".</Setting>
          <Setting name="Heading">Section heading above the accordion.</Setting>
          <Setting name="Subheading">Supporting sentence beneath the heading.</Setting>
          <Setting name="Text alignment">Left or centre. Left is conventional for FAQ sections; centre for more marketing-style layouts.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Questions">
        <SettingsTable>
          <Setting name="Question">The question text shown in the accordion header. Should be phrased exactly as a user would ask it.</Setting>
          <Setting name="Answer">The answer revealed when the question is expanded. Supports plain text or HTML — if you paste HTML it will render correctly. Plain text is automatically wrapped in paragraph tags.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Style & behaviour">
        <SettingsTable>
          <Setting name="Single-open mode">When on, opening one question automatically closes any previously open question — a true accordion. When off, multiple questions can be open simultaneously.</Setting>
          <Setting name="Divider">Hairline dividers between questions. On by default — creates clear visual separation between Q&amp;A pairs.</Setting>
          <Setting name="Heading size">Scale of the question text. Standard is most common; larger sizes work for prominent FAQs at the bottom of a conversion page.</Setting>
          <Setting name="Full bleed">Stretches the section edge-to-edge.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Zero-JavaScript accessibility">Built on native details/summary elements — every question is keyboard-navigatable and screen-reader friendly without any JS. The open/close animation is pure CSS.</ProTip>
        <ProTip title="HTML answers">Paste HTML into the answer field for rich answers — lists, bold text, links. The section detects HTML and renders it directly. Plain text is automatically converted to paragraphs so either input works.</ProTip>
        <ProTip title="Single-open for conversion pages">On conversion-focused pages (pricing, sign-up), use single-open mode — it gives the FAQ a more intentional, guided feel and keeps the page from becoming a wall of open text.</ProTip>
        <ProTip title="SEO benefit">FAQ sections built on details/summary are directly crawlable by search engines. The question text appears in the page source as visible content even when collapsed — good for SEO without extra structured data markup.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* CTA BANNER                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

function CTABannerGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Megaphone}>CTA Banner</GuideH1>
      <Lead>
        CTA Banner is the final-call conversion block — eyebrow, headline, subheading, and 1–2 buttons. Background can be a solid colour, a gradient, or a full-bleed image. It has two modes: standard buttons, and an email-capture form that redirects to a mailto link — a zero-backend way to collect email addresses via the user's default mail client.
      </Lead>

      <GuideSection Icon={Type} title="Copy">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading — e.g. "READY TO GET STARTED?".</Setting>
          <Setting name="Heading">Primary CTA headline. Short and direct: "Book a free demo", "Start your trial today".</Setting>
          <Setting name="Subheading">One or two supporting sentences that address the last remaining objection before the click.</Setting>
          <Setting name="Text alignment">Left or centre. Centre is the convention for CTA banners; left works if the section is visually asymmetric.</Setting>
          <Setting name="Mobile — centre text">Override to centre-align text on mobile regardless of the desktop setting.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Image} title="Background">
        <SettingsTable>
          <Setting name="Background type"><strong>Solid</strong> = flat colour. <strong>Gradient</strong> = directional colour blend. <strong>Image</strong> = full-bleed background photo with overlay.</Setting>
          <Setting name="Background colour / gradient">Fill colours. Brand primary or dark neutral are most common. Gradient adds depth — try a subtle brand-colour-to-dark gradient.</Setting>
          <Setting name="Gradient angle">Direction of the gradient. 135° (diagonal) is a popular choice for energy and movement.</Setting>
          <Setting name="Logo">Optional brand logo above the eyebrow. Useful on co-branded CTAs or when the banner is the first branded element after a long partner page.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={MousePointer} title="Buttons mode">
        <Note>In Buttons mode, the section shows 1–2 standard CTA buttons. In Email capture mode, it shows an email input + submit button.</Note>
        <SettingsTable>
          <Setting name="Primary label & URL">Primary button text and destination. Action-led: "Book a demo", "Start free trial".</Setting>
          <Setting name="Show secondary button">Toggle on to add a second button (ghost/outline style) beside the primary.</Setting>
          <Setting name="Secondary label & URL">Second button text and destination — typically a lower-commitment option: "Learn more", "See pricing".</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Email capture mode">
        <SettingsTable>
          <Setting name="Mode">Switch from Buttons to <strong>Email capture</strong> to replace the buttons with an email input form.</Setting>
          <Setting name="Destination email">Your email address. When the user submits, their default mail client opens a pre-composed email to this address.</Setting>
          <Setting name="Email subject & body template">Pre-fill the subject line and body of the email that opens in the mail client — so every lead arrives with consistent context.</Setting>
          <Setting name="Input placeholder">Hint text inside the email field — e.g. "Enter your work email".</Setting>
          <Setting name="Button text">The submit button label — e.g. "Get in touch", "Send enquiry".</Setting>
          <Setting name="Success text">Message shown after the user submits — displayed briefly before the mail client opens.</Setting>
          <Setting name="Micro-trust text">Small text beneath the input — e.g. "No spam. We'll respond within 1 business day." Reduces friction.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Email capture without a backend">The email capture mode uses mailto: — when the user submits, their mail client opens with a pre-filled email to your address. Zero server infrastructure needed. Works great for enquiry forms, demo requests, and newsletter sign-ups for teams not ready to set up a CRM integration.</ProTip>
        <ProTip title="Secondary button luminance-aware styling">The secondary button colour is automatically calculated for contrast against the banner background — light backgrounds get a dark ghost button, dark backgrounds get a light one. You can override it manually but the auto-calculation is often correct.</ProTip>
        <ProTip title="Gradient for a premium feel">A brand-colour-to-dark-navy gradient feels more premium than a flat brand colour fill. Try your primary colour as "from" and slate-900 as "to" at a 135° angle.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* LOGO STRIP                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

function LogoStripGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Layers}>Logo Strip</GuideH1>
      <Lead>
        Logo Strip is an infinite auto-scrolling marquee of brand, partner, or client logos. The animation is pure CSS — no JavaScript measurement — so it loads instantly and never causes layout shift. Each logo can be a plain image or a clickable link, and an optional greyscale-until-hover effect creates a polished, uniform look across varied logo colours.
      </Lead>

      <GuideSection Icon={SlidersHorizontal} title="Marquee settings">
        <SettingsTable>
          <Setting name="Speed">Scroll speed in seconds per full loop. Higher = slower. 20–30 s is comfortable; 10–15 s is energetic for a prominent brand strip.</Setting>
          <Setting name="Item height">Height of each logo in pixels. Controls how tall the marquee row is. 48–64 px suits most logo proportions.</Setting>
          <Setting name="Item width">Fixed width slot for each logo. Logos are scaled to fit within this width while maintaining their aspect ratio.</Setting>
          <Setting name="Item gap">Space between logos in the marquee.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Style">
        <SettingsTable>
          <Setting name="Greyscale until hover">Renders all logos in greyscale. On hover, the logo transitions to full colour. Creates a uniform, low-distraction strip that still rewards engagement.</Setting>
          <Setting name="Edge fade">Adds a soft CSS mask at the left and right edges of the strip — logos fade in from the left and fade out to the right, reinforcing the infinite loop illusion.</Setting>
          <Setting name="Edge fade width">How wide the fade zone is in pixels. 80–120 px is a subtle fade; 200+ px is dramatic.</Setting>
          <Setting name="Full bleed">Stretches the section edge-to-edge. Almost always on for a logo strip.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Logos">
        <SettingsTable>
          <Setting name="Image">The logo image. PNG with transparency is ideal — it works on any background colour without a white box behind it.</Setting>
          <Setting name="Alt text">Descriptive alt text for accessibility — e.g. "Microsoft logo".</Setting>
          <Setting name="Link">Optional URL. Makes the logo a clickable link to the partner's website or a case study page.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Edge fade hides the loop seam">The CSS mask at the edges creates a smooth fade in/out that completely hides where the marquee loops — no visible jump. Enable it whenever the section background doesn't match the logo strip background.</ProTip>
        <ProTip title="Greyscale for mixed logo colours">Client and partner logos come in every colour under the sun. Greyscale-until-hover normalises them visually — the strip looks designed and intentional even with 20 logos from different brands.</ProTip>
        <ProTip title="Per-logo links for partners">Add the partner's website URL to each logo so the strip doubles as a partner directory. Users hover to see the colour logo, click to visit the partner — two interactions, one section.</ProTip>
        <ProTip title="Pure CSS animation = no jank">The marquee uses CSS animation (not JavaScript requestAnimationFrame), so it never causes layout recalculation or dropped frames — even on low-power devices.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* BREAK BANNER                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

function BreakBannerGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Layout}>Break Banner</GuideH1>
      <Lead>
        Break Banner is a full-width visual divider — a background (image, solid colour, or gradient) with an optional overlaid heading. Use it to chapter long pages, punctuate between major content zones, or create a dramatic full-bleed moment between two content-heavy sections.
      </Lead>

      <GuideSection Icon={Type} title="Content">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading. Leave blank for a purely visual break with no text.</Setting>
          <Setting name="Heading">The overlaid heading. Works best as a short, punchy statement — one line. Leave blank to use the section as a purely visual break.</Setting>
          <Setting name="Font size">Scale of the heading. Large headings read as editorial statements; smaller headings are chapter markers.</Setting>
          <Setting name="Text colour">Colour of the heading and eyebrow. White is most common over dark images or dark backgrounds.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Image} title="Background">
        <SettingsTable>
          <Setting name="Background type"><strong>Image</strong> = full-bleed background photo with overlay. <strong>Solid</strong> = flat colour fill. <strong>Gradient</strong> = directional colour blend.</Setting>
          <Setting name="Background image">Photo used when background type is Image. Use a high-quality, wide landscape image at 1,920 px minimum width.</Setting>
          <Setting name="Overlay colour & opacity">Controls text legibility over the background image. Higher opacity = more readable text but less visible photography.</Setting>
          <Setting name="Gradient — from / to / angle">Gradient fill colours and direction when background type is Gradient.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout">
        <SettingsTable>
          <Setting name="Height">Section height in pixels. 180–280 px is typical for a visual break; taller heights create more dramatic moments.</Setting>
          <Setting name="Full bleed">Stretches edge-to-edge. Almost always on for a break banner — contained breaks look unintentional.</Setting>
          <Setting name="Padding (top / bottom)">Adjusts vertical padding within the section. Usually left at default.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="No text = pure visual chapter break">Leave eyebrow and heading blank for a purely visual break — just the background. This is the cleanest way to separate two content zones without adding more copy to an already text-heavy page.</ProTip>
        <ProTip title="Gradient as a colour transition">Use a gradient break (e.g. white to brand-colour) between sections with different background colours. It creates a smooth visual transition rather than a hard edge.</ProTip>
        <ProTip title="Mobile font size auto-scales">The heading font size automatically reduces on mobile so the text doesn't overflow the section height. No separate mobile typography setting needed.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* TABS                                                                */
/* ═══════════════════════════════════════════════════════════════════ */

function TabsGuideContent() {
  return (
    <div>
      <GuideH1 Icon={FileStack}>Tabs</GuideH1>
      <Lead>
        Tabs is a tabbed content panel where each tab reveals a split layout: an image on one side and a heading, body, and up to two CTA buttons on the other. It's ideal for comparing product tiers, showcasing different use cases, or walking through a multi-step feature — any scenario where related content needs to be switched without leaving the page.
      </Lead>

      <GuideSection Icon={Type} title="Section header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the section heading.</Setting>
          <Setting name="Heading">Primary section heading above the tab bar.</Setting>
          <Setting name="Subheading">Supporting sentence beneath the heading.</Setting>
          <Setting name="Header alignment">Left, centre, or right alignment of the section header block.</Setting>
          <Setting name="Tab bar alignment">Left, centre, or right alignment of the tab button row — independent of the header alignment.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout">
        <SettingsTable>
          <Setting name="Image position"><strong>Left</strong> = image on the left, text on the right. <strong>Right</strong> = image right, text left. Applied globally to all tabs.</Setting>
          <Setting name="Heading size">Scale of the per-tab heading inside the content panel.</Setting>
          <Setting name="Full bleed">Stretches the section edge-to-edge.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Tab panels">
        <SettingsTable>
          <Setting name="Tab label">The button label in the tab bar — keep it short (1–3 words): "Starter", "Professional", "Enterprise".</Setting>
          <Setting name="Heading">Panel heading revealed when this tab is active.</Setting>
          <Setting name="Body">Panel body text. Supports paragraphs — keep it to 2–4 sentences for clean layout.</Setting>
          <Setting name="Image">Panel image shown on the image side. Each tab can have a different image.</Setting>
          <Setting name="Image link">Makes the panel image clickable. Opens in the same or new tab depending on the toggle.</Setting>
          <Setting name="Primary CTA label & URL">Primary button inside the panel.</Setting>
          <Setting name="Secondary CTA label & URL">Optional secondary button beside the primary.</Setting>
          <Setting name="Primary button colours">Override the primary button background and text colour for this tab — useful for tier-specific colours (e.g. gold for enterprise).</Setting>
          <Setting name="Secondary button colours">Override secondary button colours for this tab independently.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Per-tab button colours">Each tab panel can have completely different button colours. For a pricing tier layout, use a subtle colour for Starter, a brand-colour primary for Professional, and a premium gold for Enterprise — all in the same section.</ProTip>
        <ProTip title="Accessible by default">The tabs are built with full ARIA roles (tablist, tab, tabpanel) and keyboard navigation — Tab to move between tabs, Enter/Space to activate. No extra accessibility work required.</ProTip>
        <ProTip title="Image link for demos or mockups">Link the panel image to a live demo, a video, or a full screenshot gallery. The image becomes a clickable entry point to deeper content without adding another CTA button.</ProTip>
        <ProTip title="Consistent image dimensions across tabs">Use images of the same aspect ratio across all tabs — the panel height is set by the tallest image, so mismatched ratios cause the panel to jump in height when switching tabs.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* GRID (PLACEHOLDER)                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

function GridGuideContent() {
  return (
    <div>
      <GuideH1 Icon={LayoutGrid}>Grid</GuideH1>
      <Lead>
        Grid is a configurable image gallery — up to 6 columns and 6 rows of rectangular cells, each optionally linked and image-filled. Cells without images render as coloured placeholders seeded with sample photos that you replace via the cell picker. Use it for product galleries, team photo grids, case study thumbnails, or any visual mosaic.
      </Lead>

      <GuideSection Icon={Settings} title="Grid dimensions">
        <SettingsTable>
          <Setting name="Columns">1–6 columns per row. 2–4 is the most common for galleries; 5–6 creates a tight mosaic.</Setting>
          <Setting name="Rows">1–6 rows. Total cells = columns × rows. Add rows to extend the grid vertically.</Setting>
          <Setting name="Item height">Fixed height of each cell in pixels. All cells in the grid share the same height — they're rectangular, not masonry.</Setting>
          <Setting name="Gap">Space between cells in pixels. 0 = flush edge-to-edge grid; 8–16 px = spaced grid with visible background colour between cells.</Setting>
          <Setting name="Border radius">Corner rounding of each cell. 0 = sharp corners; higher values for a card-style gallery.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Cells">
        <SettingsTable>
          <Setting name="Image">The image for this cell. Fills the cell using object-fit cover — the image is cropped to fill the rectangle regardless of its original aspect ratio.</Setting>
          <Setting name="Alt text">Descriptive alt text for accessibility.</Setting>
          <Setting name="Link">Optional URL. Makes the entire cell clickable.</Setting>
          <Setting name="Open in same tab">Toggle for link behaviour.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Seeded placeholder images">New cells are pre-filled with sample photos from picsum.photos so the grid always looks complete in preview — you can see exactly how the layout will look before you upload your own images.</ProTip>
        <ProTip title="Gap 0 for a full-bleed mosaic">Setting gap to 0 creates a flush, edge-to-edge grid with no visible seams — a classic full-bleed photo mosaic effect. Works best with images that have similar tones at their edges so the cuts feel intentional.</ProTip>
        <ProTip title="Mixed aspect ratios">All cells are the same size, so images of different aspect ratios are all cropped to the same rectangle. Choose images whose main subject is centred so the cropping doesn't cut off the important part.</ProTip>
        <ProTip title="Team photo grid">A 3×2 or 4×2 grid of team headshots is a simple and clean way to build a team section — link each cell to the team member's profile page for a clickable directory.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* PRICING TABLE                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

function PricingTableGuideContent() {
  return (
    <div>
      <GuideH1 Icon={DollarSign}>Pricing Table</GuideH1>
      <Lead>
        Pricing Table puts 2–4 subscription or service tiers side by side with a price, billing period, description, and CTA per tier. Mark one tier as "Best Value" to highlight it with a tinted background, accent border, and a filled CTA button. Unlimited feature rows with tick, cross, dash, or plain-text values per tier complete the comparison. An optional full-bleed photo header sits above the table. Tiers scroll horizontally on mobile so every column stays accessible.
      </Lead>

      <GuideSection Icon={Image} title="Header background (optional)">
        <Note>Leave the header image blank for a plain text header above the table. Add an image to create a full-bleed photo header — the same pattern used by Blog Index and Brand Grid.</Note>
        <SettingsTable>
          <Setting name="Background image">Full-bleed photo above the pricing table. Leave blank for a plain-colour header.</Setting>
          <Setting name="Header height">Height of the photo band in pixels (120–520 px). 220–300 px is typical.</Setting>
          <Setting name="Corner radius">Rounds the header image corners. Disabled automatically when Make wide is on.</Setting>
          <Setting name="Overlay style">Solid colour or linear gradient over the photo for text legibility.</Setting>
          <Setting name="Overlay colour / gradient">Fill colour(s) of the overlay. Dark slate or your brand secondary colour works well.</Setting>
          <Setting name="Overlay opacity">How opaque the overlay is (0–100%).</Setting>
          <Setting name="Header text colour">Colour of the title and subheading rendered over the photo. The eyebrow retains its brand kit colour.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Type} title="Section header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading — e.g. "PRICING" or "PLANS".</Setting>
          <Setting name="Title">Section heading above the tier columns.</Setting>
          <Setting name="Subheading">Supporting sentence beneath the heading — e.g. "No hidden fees. Cancel any time."</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={LayoutGrid} title="Tier columns">
        <Note>Click any tier header in the live preview to jump directly to that tier's editor panel.</Note>
        <SettingsTable>
          <Setting name="Tier name">The plan name — e.g. "Starter", "Professional", "Enterprise".</Setting>
          <Setting name="Price">Display price — e.g. "£49", "Free", "Contact us".</Setting>
          <Setting name="Billing period">Small text beneath the price — e.g. "/ month", "/ user / year".</Setting>
          <Setting name="Description">One or two sentences describing who the tier is for.</Setting>
          <Setting name="CTA label & URL">Button label and destination for this tier's call to action.</Setting>
          <Setting name="Highlight as Best Value">Marks this tier with a tinted background, accent-colour border, filled CTA, and an optional badge label (e.g. "Most Popular").</Setting>
          <Setting name="Badge label">Text shown in the highlight badge above the tier header — e.g. "Most Popular", "Best Value". Leave blank to hide the badge.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Feature rows">
        <SettingsTable>
          <Setting name="Feature label">The capability being compared across tiers — e.g. "Storage", "Users", "API access".</Setting>
          <Setting name="Value per tier">Each tier has its own value for the row. Choose an icon style or enter plain text.</Setting>
          <Setting name="Icon styles"><strong>Check</strong> (green circle ✓) — included. <strong>Cross</strong> (grey circle ✗) — not included. <strong>Dash</strong> (—) — not applicable. <strong>Text</strong> — enter a custom string like "Unlimited" or "Up to 5".</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout & style">
        <SettingsTable>
          <Setting name="CTA position"><strong>Top only</strong> = CTA inside each tier header. <strong>Bottom only</strong> = CTA below the feature rows. <strong>Both</strong> = CTA at top and bottom (ideal for long feature lists). <strong>None</strong> = no CTA button.</Setting>
          <Setting name="Feature column label">Header of the leftmost column — e.g. "Feature", "What's included".</Setting>
          <Setting name="Make wide">Stretches the section background to full viewport width. Also removes the header corner radius.</Setting>
          <Setting name="Text alignment">Left or centre alignment of tier header content.</Setting>
          <Setting name="Closing text">Short statement below the table — e.g. "All plans include a 14-day free trial."</Setting>
          <Setting name="Footer link">A secondary CTA link below the closing text.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Click a tier in the preview to edit it">In Studio, clicking any tier column header in the live preview snaps the editor to that tier's expanded panel — no hunting through the list. Works for feature rows too.</ProTip>
        <ProTip title="CTA at both top and bottom for long feature lists">When your feature list runs 10+ rows, setting CTA position to Both puts the button where users will see it — whether they skim the header or scroll to the bottom.</ProTip>
        <ProTip title="Badge spacer preserves alignment">When any tier uses a badge (Most Popular, Best Value), tiers without a badge automatically get an invisible spacer of the same height. Prices, descriptions and CTAs stay perfectly aligned across all columns.</ProTip>
        <ProTip title="Mix icon and text values in the same row">A single feature row can have "Unlimited" (text) for Enterprise, a check (✓) for Professional, and a cross (✗) for Starter. The icon and text options are per-tier, not per-row.</ProTip>
        <ProTip title="Mobile horizontal scroll">On narrow screens the table scrolls horizontally — all tier columns stay visible and usable. Users don't lose any information on mobile.</ProTip>
        <ProTip title="Gradient header for a premium look">A brand-colour-to-dark gradient overlay on a moody photo creates a premium SaaS landing-page feel. Pair with a white header text colour and your brand eyebrow colour for a polished result.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* COUNTDOWN TIMER                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function CountdownTimerGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Timer}>Countdown Timer</GuideH1>
      <Lead>
        Countdown Timer is a live urgency block that ticks down to a target date and time. Drop it above a sale CTA, below a hero, or standalone on a landing page. Choose between two digit styles — Blocks (large numbers in rounded cards) or Minimal (plain numbers with colon separators). When the timer hits zero it either shows a custom expired message or hides the section entirely.
      </Lead>

      <GuideSection Icon={Type} title="Section header">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading — e.g. "LIMITED TIME OFFER" or "LAUNCHING SOON".</Setting>
          <Setting name="Title">Main heading above the digits — e.g. "Sale ends in" or "Doors open in".</Setting>
          <Setting name="Subheading">Supporting line beneath the heading — e.g. "Don't miss out — prices go back up at midnight."</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Timer} title="Timer">
        <SettingsTable>
          <Setting name="Target date & time">The moment the timer counts down to. Uses your device's local timezone. Leave blank and the digits show 00 — useful as a placeholder while you set the date.</Setting>
          <Setting name="Show units">Toggle Days, Hours, Minutes, and Seconds individually. Hiding Days rolls the day count into Hours so the total time is always correct — e.g. 26h instead of 1d 2h.</Setting>
          <Setting name="Show labels">Toggles the Days / Hours / Mins / Secs labels beneath each digit group.</Setting>
          <Setting name="When the timer expires"><strong>Show a message</strong> — the digit strip hides and a short expired message appears in its place. <strong>Hide the section</strong> — the entire section disappears from the page silently.</Setting>
          <Setting name="Expired message">The text shown when the timer reaches zero (only applies when expiry action is Show a message) — e.g. "This offer has ended." or "The event is now live."</Setting>
        </SettingsTable>
        <Note>The countdown ticks client-side every second. It starts immediately when the snippet loads — no server dependency. Visitors who load the page after the target date see the expired state straight away.</Note>
      </GuideSection>

      <GuideSection Icon={List} title="Button">
        <SettingsTable>
          <Setting name="Button label">CTA text beneath the digits — e.g. "Shop the sale" or "Register now".</Setting>
          <Setting name="Button URL">Where the button links to.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Settings} title="Layout">
        <SettingsTable>
          <Setting name="Display style"><strong>Blocks</strong> — each digit group sits inside a rounded card with a separate background colour, giving a bold "scoreboard" look. <strong>Minimal</strong> — plain large numbers separated by colons, no card backgrounds — cleaner for light-coloured sections.</Setting>
          <Setting name="Alignment">Left, centre, or right — applies to the heading and digit strip together.</Setting>
          <Setting name="Make wide">Extends the section background to full viewport width.</Setting>
          <Setting name="Heading size">Font size of the title in pixels.</Setting>
          <Setting name="Digit size">Font size of the countdown numbers in pixels (32–120 px). The cards scale proportionally.</Setting>
          <Setting name="Padding">Top, bottom, and horizontal padding around the section content.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Palette} title="Colours">
        <SettingsTable>
          <Setting name="Background">Section background — dark slate is the default for maximum digit contrast.</Setting>
          <Setting name="Title / Subheading / Eyebrow">Text colours for the header elements.</Setting>
          <Setting name="Digit">Colour of the countdown numbers themselves.</Setting>
          <Setting name="Digit card background">Background colour of each digit card (Blocks style only).</Setting>
          <Setting name="Unit labels">Colour of the Days / Hours / Mins / Secs labels.</Setting>
          <Setting name="Button background / text">CTA button fill and label colours.</Setting>
        </SettingsTable>
        <ProTip title="Brand Kit support">Apply Brand Kit maps the eyebrow, title, subheading and CTA button colours from your kit. The digit and digit-card colours are intentionally left untouched — they're usually chosen for contrast against the dark background rather than from the brand palette.</ProTip>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Pro tips">
        <ProTip title="Hide Days for short-window urgency">A countdown showing 00 Days 04 Hours reads less urgently than one showing just 4:23:17. Turn Days off for the final 24 hours of a sale to sharpen the feeling of immediacy.</ProTip>
        <ProTip title="Minimal style on light sections">Blocks style pops on dark backgrounds. Switch to Minimal when placing the timer on a white or light-grey section — large plain numbers without card chrome stay clean and readable.</ProTip>
        <ProTip title="Expired action: Hide for evergreen pages">If the page will stay live after the promotion ends, set expiry to Hide the section. Visitors arriving after the deadline never see a "sale ended" message — the countdown simply disappears and the page flows as if it was never there.</ProTip>
        <ProTip title="Pair with a CTA Banner below">Countdown Timer is an urgency setter, not a conversion section on its own. Pair it directly above a CTA Banner or Hero so the visitor's eye drops straight from the ticking digits to the buy or sign-up button.</ProTip>
      </GuideSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* BRAND GRID                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

function BrandGridGuideContent() {
  return (
    <div>
      <GuideH1 Icon={Building2}>Brand Grid</GuideH1>
      <Lead>
        Brand Grid is a searchable grid of brand cards with an optional full-bleed photo header. Each card shows a logo, name, eyebrow, description, and a link. Built-in debounced search filters cards across all fields in real time. Three hover effects (lift, accent bar, none) and greyscale-until-hover give you full control over the interaction style.
      </Lead>

      <GuideSection Icon={Image} title="Header background">
        <SettingsTable>
          <Setting name="Header image">Full-bleed photo behind the heading area. Leave blank for a plain-colour header.</Setting>
          <Setting name="Header height">Height of the header image area in pixels.</Setting>
          <Setting name="Header radius">Corner rounding of the header image. Usually inherits from the card radius unless overridden.</Setting>
          <Setting name="Overlay type & colour">Controls text legibility over the header image. Gradient overlays are subtler than flat solid overlays.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Type} title="Section header content">
        <SettingsTable>
          <Setting name="Eyebrow">Small label above the heading — e.g. "OUR BRANDS" or "PARTNER NETWORK".</Setting>
          <Setting name="Heading">Primary section heading.</Setting>
          <Setting name="Subheading">Supporting sentence beneath the heading.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Search} title="Search">
        <SettingsTable>
          <Setting name="Enable search">Adds a search input that filters cards in real time. Debounced — waits for the user to pause typing before filtering.</Setting>
          <Setting name="Search placeholder">Input placeholder text — e.g. "Search brands…".</Setting>
          <Setting name="Search position">Place the search bar inside the <strong>header</strong> (overlaid on the header image) or <strong>below</strong> the header.</Setting>
          <Setting name="Search alignment">Left, centre, or right alignment of the search bar.</Setting>
          <Setting name="Search width">Max width of the search input.</Setting>
          <Setting name="No match text">Message shown when no cards match — e.g. "No brands found."</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={LayoutGrid} title="Grid layout">
        <SettingsTable>
          <Setting name="Columns">1–6 columns. 3–4 is most common for brand grids; 5–6 for compact partner directories.</Setting>
          <Setting name="Mobile columns">1–3 columns on mobile — independent of the desktop column count.</Setting>
          <Setting name="Gap">Space between cards.</Setting>
          <Setting name="Card padding">Inner padding of each brand card.</Setting>
          <Setting name="Card radius">Corner rounding of each card.</Setting>
          <Setting name="Card alignment">Text alignment within each card — left, centre, or right. Centre is traditional for brand cards with logos.</Setting>
          <Setting name="Full bleed">Stretches the section edge-to-edge.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={MousePointer} title="Hover effects">
        <SettingsTable>
          <Setting name="Hover effect"><strong>Lift</strong> = card rises with a subtle shadow on hover. <strong>Bar</strong> = an accent-coloured line appears on one edge of the card. <strong>None</strong> = no hover animation.</Setting>
          <Setting name="Bar side">Which edge the bar appears on: top, right, bottom, or left. Bottom is the most common; top draws the eye upward.</Setting>
          <Setting name="Bar thickness">Width of the accent bar in pixels. 3–4 px is subtle; 6–8 px is a bold marker.</Setting>
          <Setting name="Bar colour">Colour of the hover bar. Usually your Brand Kit accent.</Setting>
          <Setting name="Greyscale until hover">Renders brand logos in greyscale, transitioning to full colour on hover — the same effect as Logo Strip. Creates a uniform appearance across varied logo colours.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Layers} title="Brand cards">
        <SettingsTable>
          <Setting name="Logo">Brand logo image. Transparent PNG recommended. The section also supports simpleicons.org SVG logos — see Pro Tips.</Setting>
          <Setting name="Name">Brand or company name — shown prominently on the card.</Setting>
          <Setting name="Eyebrow">Small label above the name — e.g. a category, region, or partner tier.</Setting>
          <Setting name="Description">Short description beneath the name. 1–2 sentences. Included in the search haystack.</Setting>
          <Setting name="Link & open-in-tab">Destination URL and whether it opens in the current or new tab. The entire card is clickable.</Setting>
        </SettingsTable>
      </GuideSection>

      <GuideSection Icon={Sparkles} title="Hidden features & pro tips">
        <ProTip title="Debounced search across all fields">The search filters name, description, and eyebrow simultaneously, with a short debounce so it doesn't fire on every keystroke. Fast for the user; not hammering the DOM on every keypress.</ProTip>
        <ProTip title="Greyscale + lift hover for premium feel">Combine greyscale-until-hover with the lift hover effect. The card lifts and the logo gains colour simultaneously — a polished two-part hover animation from a single toggle combination.</ProTip>
        <ProTip title="Search in header for brand marketplace pages">Placing the search bar inside the header creates a brand marketplace landing page aesthetic — search floats over the header photography, cards load below. Works especially well when the header image is a storefront or product display.</ProTip>
        <ProTip title="Eyebrow as a filter hint">Use the eyebrow field as a category tag (e.g. "Networking", "Security", "Storage"). Even though Brand Grid doesn't have category filter chips (unlike Blog Index), the eyebrow text is included in the search haystack — users can type a category name to filter to that segment.</ProTip>
      </GuideSection>
    </div>
  );
}
