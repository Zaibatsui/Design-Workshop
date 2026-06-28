import {
  Layers,
  AlignLeft,
  ShoppingBag,
  LayoutGrid,
  LayoutPanelLeft,
  BookOpen,
  Image as ImageIcon,
  Minus,
  Folders,
  Type,
  Grid2x2,
  ListOrdered,
  HelpCircle,
  Megaphone,
  Sparkles,
  Shield,
  Star,
  Quote,
  Zap,
  Columns3,
  Hash,
  PlayCircle,
  Eye,
  Building2,
  BookMarked,
} from "lucide-react";
import SectionPreviewPopover from "@/components/SectionPreviewPopover";

// Pro / Nettailer-aware blocks. Live VAT toggle, real-time scrape and
// gated-pricing fallback are bundled into these — separated from the
// generic editorial sections so the deeper integration story stands out.
const PRO_SECTIONS = [
  {
    id: "products",
    Icon: ShoppingBag,
    name: "Product Carousel",
    desc: "Horizontal carousel of auto-scraped product cards with prev / next arrows, optional autoplay and pause-on-hover. Universal VAT toggle live-flips inc / ex prices to match the host store, and login-walled prices are pulled via a same-origin credentialed fetch.",
  },
  {
    id: "productGrid",
    Icon: LayoutGrid,
    name: "Product Grid",
    desc: "Static grid of auto-scraped product cards — 2 to 6 per row, wrapping to as many rows as you need. Universal VAT toggle live-flips inc / ex prices to match the host store, and login-walled prices are pulled via a same-origin credentialed fetch.",
  },
];

// Pro · Blog tools — the editorial duo. Blog Index comes FIRST so the
// row reads left-to-right as "list of posts → individual post", which
// matches how a reader actually navigates a blog. Both pick up the
// same red-ringed Pro card style as the Nettailer-aware band above so
// they read as a peer offering, not a footnote.
const BLOG_SECTIONS = [
  { id: "blog-index", Icon: BookMarked, name: "Blog Index", desc: "Searchable grid of blog post cards with an optional full-bleed photo header (solid or gradient overlay, in-header or below-grid search input). Each card carries an image, category, date, author, title and excerpt with left, centre or right alignment. Three hover affordances and full click-to-edit on every card. Search-only — no pill chips — by design." },
  { id: "blog-body", Icon: BookOpen, name: "Blog Body", desc: "Long-form article column with an optional sidebar of CTA / Related-articles / Tag-cluster / Author-card widgets. Sidebar can sit left, right or below the body; opt-in sticky-on-scroll for desktop; mobile auto-collapses to a horizontal swipe carousel. Picker-aware: pull an existing blog page or section straight into the sidebar's Related-articles widget in one click." },
];

const SECTIONS = [
  { id: "hero", Icon: Layers, name: "Hero", desc: "Slide or fade carousel with full-bleed background media, headline, subtitle and CTA. Per-slide colour overrides and an optional split layout that puts the image on one side and the copy on the other." },
  { id: "split-banner", Icon: LayoutPanelLeft, name: "Split Banner", desc: "Full-bleed image with container-aligned heading, subtitle and buttons floating over it. Static, non-carousel, ideal for landing-page headers or campaign rows. Optional feature-points list inside the panel." },
  { id: "featured-card", Icon: Star, name: "Featured Card", desc: "Full-bleed photo background with a translucent glass card holding eyebrow, headline, subheading, feature points and an optional CTA. Card sits in one of nine grid positions for flexible composition." },
  { id: "welcome", Icon: Sparkles, name: "Welcome", desc: "Post-login greeter with a movable header, customer logo and an account-manager card. Each block sits in one of nine grid positions so one section fits many brands." },
  { id: "content", Icon: AlignLeft, name: "Content", desc: "Heading, body copy and one or two buttons. The all-purpose marquee block for sales messages, intros and announcements." },
  { id: "insights", Icon: LayoutGrid, name: "Insights Grid", desc: "Editorial 2 or 3 column grid for articles, case studies and mixed-media stories. Per-card image position (left, top or right), accent border toggle and configurable image width." },
  { id: "resources", Icon: BookOpen, name: "Resources", desc: "Tag-tinted card carousel for blog posts, guides and downloadable assets. Optional autoplay, pause-on-hover and per-card open-in-same-tab control." },
  { id: "feature-grid", Icon: Sparkles, name: "Feature Grid", desc: "2 to 4 column value-prop cards with icon, title and body. Outlined, tinted or solid card styles plus an image-card variant (image-top or image-left)." },
  { id: "trust-strip", Icon: Shield, name: "Trust Strip", desc: "Compact 2 to 5 column row of icon + title + 1-line credibility callouts. Flat by design so it counterweights heavier sections — perfect for '20+ years', 'ISO 27001 certified', '5-star service' bands." },
  { id: "stat-counter", Icon: Hash, name: "Stat Counter", desc: "Row of big numbers — '36%', '£2.4M', '5×' — each with a short label and optional supporting line. Optional count-up animation when the section scrolls into view, prefers-reduced-motion respected. Ideal for 'we saved customers X' impact bands." },
  { id: "video-embed", Icon: PlayCircle, name: "Video Embed", desc: "Poster image with a centred play button — clicking opens a modal lightbox that lazy-loads a YouTube or Vimeo iframe. Nothing loads from the video host until the user actually presses play. ESC, click-outside and focus management built in. Aspect ratio, lightbox width and button style are all configurable." },
  { id: "comparison-table", Icon: Columns3, name: "Comparison Table", desc: "Three-column 'us vs them' matrix. Feature rows with ticks on your column and crosses on the competitor's. Brand-logo header, accent tint + border on the winning column, closing line + CTA below — a high-converting B2B pattern." },
  { id: "steps", Icon: ListOrdered, name: "Steps", desc: "Numbered process strip with big editorial numerals or compact inline numbers. Horizontal or vertical stack with optional hairline dividers between steps." },
  { id: "testimonials", Icon: Quote, name: "Testimonials", desc: "Auto-scrolling quote carousel with star ratings and avatars. Pauses on hover, supports per-quote source links and configurable scroll speed." },
  { id: "faq", Icon: HelpCircle, name: "FAQ", desc: "Collapsible question-and-answer accordion built with native HTML details / summary — zero JS, fully keyboard-accessible out of the box." },
  { id: "cta-banner", Icon: Megaphone, name: "CTA Banner", desc: "Final-call conversion block with optional brand logo, gradient or solid background and one or two action buttons. Sized to bridge editorial sections and a checkout." },
  { id: "logos", Icon: ImageIcon, name: "Logo Strip", desc: "Auto-scrolling marquee of partner / client logos. Optional per-logo links, greyscale-on-hover and configurable scroll direction and speed." },
  { id: "brand-grid", Icon: Building2, name: "Brand Grid", desc: "Searchable grid of brand cards with an optional full-bleed photo header (corner-radius cascades from your Brand Kit; overlay supports solid or linear-gradient styles). Per-card eyebrow plus left, centre or right card alignment. Three hover affordances — lift + border, edge-pickable accent bar on any of the four sides, or a clean greyscale-until-hover desaturation. Click any card in the live preview and that brand's row pops open in the editor and scrolls into view." },
  { id: "break", Icon: Minus, name: "Break banner", desc: "Full-bleed parallax break with an overlaid heading. Useful to chapterise a long page and re-anchor the reader's attention between sections." },
  { id: "tabs", Icon: Folders, name: "Tabs", desc: "Tabbed content with a side image, heading, body and CTAs per tab. On mobile the tabs collapse to a stacked layout with the image above the copy." },
  { id: "placeholder", Icon: Grid2x2, name: "Grid", desc: "2 × 2 or 2 × 3 image grid with optional links per cell. Image-only by default, with editable alt text for accessibility and SEO." },
  { id: null, Icon: Type, name: "Rich text", desc: "Tiptap-powered freeform copy block for everything the structured sections don't cover. Headings, lists, links, inline images, the lot." },
];

/**
 * Visual catalogue. Pro / Nettailer-aware sections are surfaced in a
 * dedicated red-ringed band before the generic editorial sections so
 * the deeper-integration story is the first thing visitors see.
 */
export default function SectionsShowcase() {
  return (
    <section
      data-testid="login-sections-showcase"
      className="py-24 md:py-32 bg-slate-50 border-y border-slate-200"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E01839] mb-4">
            What you can build
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
            Twenty-six ready-made sections. Mix and match.
          </h2>
          <p className="text-base leading-relaxed text-slate-600 mt-5">
            From hero banners and product showcases to FAQs, testimonials, and
            stat counters — every section is designed, built, and ready to
            customise. <span className="text-slate-900 font-medium inline-flex items-baseline gap-1">Hover the <Eye className="w-3.5 h-3.5 inline self-center text-slate-500" aria-hidden="true" /> icon on any tile to preview it live.</span>
          </p>
        </div>

        {/* Pro / Nettailer-aware band */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-white bg-[#E01839] px-2 py-1 rounded-sm">
              <Zap className="w-3 h-3" />
              Pro · Nettailer-aware
            </span>
            <span className="text-xs text-slate-500">
              Live-scraped product cards · universal VAT toggle · gated-price fallback
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRO_SECTIONS.map(({ id, Icon, name, desc }, i) => (
          <div
            key={name}
            data-testid={`pro-section-tile-${i}`}
            className="group relative flex items-start gap-4 bg-white border-2 border-[#E01839]/30 p-5 rounded-md hover:border-[#E01839] hover:shadow-md transition-all cursor-default"
          >
            <SectionPreviewPopover sectionId={id} className="absolute top-1.5 right-1.5 z-10" />
            <div className="w-10 h-10 rounded-md bg-[#E01839]/10 text-[#E01839] flex items-center justify-center flex-shrink-0 group-hover:bg-[#E01839] group-hover:text-white transition-colors">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-sm font-semibold tracking-tight text-slate-900 mb-1 leading-tight">
                {name}
              </h3>
              <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
            </div>
          </div>
            ))}
          </div>
        </div>

        {/* Pro · Blog tools band — mirrors the Nettailer band's red-ring
            treatment so both Pro offerings read as peers. */}
        <div className="mb-10" data-testid="login-blog-band">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-white bg-[#E01839] px-2 py-1 rounded-sm">
              <BookMarked className="w-3 h-3" />
              Pro · Blog tools
            </span>
            <span className="text-xs text-slate-500">
              Editorial landing · long-form article + sidebar · cross-linked picker
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BLOG_SECTIONS.map(({ id, Icon, name, desc }, i) => (
              <div
                key={name}
                data-testid={`blog-section-tile-${i}`}
                className="group relative flex items-start gap-4 bg-white border-2 border-[#E01839]/30 p-5 rounded-md hover:border-[#E01839] hover:shadow-md transition-all cursor-default"
              >
                <SectionPreviewPopover sectionId={id} className="absolute top-1.5 right-1.5 z-10" />
                <div className="w-10 h-10 rounded-md bg-[#E01839]/10 text-[#E01839] flex items-center justify-center flex-shrink-0 group-hover:bg-[#E01839] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-semibold tracking-tight text-slate-900 mb-1 leading-tight">
                    {name}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generic editorial sections */}
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-4">
          Editorial &amp; layout
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SECTIONS.map(({ id, Icon, name, desc }, i) => (
            <div
              key={name}
              data-testid={`section-tile-${i}`}
              className="group relative flex items-start gap-4 bg-white border border-slate-200 p-5 rounded-md hover:border-[#E01839] transition-colors cursor-default"
            >
              <SectionPreviewPopover sectionId={id} className="absolute top-1.5 right-1.5 z-10" />
              <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:bg-[#E01839] group-hover:text-white transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-sm font-semibold tracking-tight text-slate-900 mb-1 leading-tight">
                  {name}
                </h3>
                <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
