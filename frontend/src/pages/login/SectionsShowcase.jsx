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
  Quote,
  Zap,
} from "lucide-react";

// Pro / Nettailer-aware blocks. Live VAT toggle, real-time scrape and
// gated-pricing fallback are bundled into these — separated from the
// generic editorial sections so the deeper integration story stands out.
const PRO_SECTIONS = [
  {
    Icon: ShoppingBag,
    name: "Product Carousel",
    desc: "Horizontal carousel of auto-scraped product cards with prev / next arrows, optional autoplay and pause-on-hover. Universal VAT toggle live-flips inc / ex prices to match the host store, and login-walled prices are pulled via a same-origin credentialed fetch.",
  },
  {
    Icon: LayoutGrid,
    name: "Product Grid",
    desc: "Static grid of auto-scraped product cards — 2 to 6 per row, wrapping to as many rows as you need. Universal VAT toggle live-flips inc / ex prices to match the host store, and login-walled prices are pulled via a same-origin credentialed fetch.",
  },
];

const SECTIONS = [
  { Icon: Layers, name: "Hero", desc: "Slide or fade carousel with full-bleed background media, headline, subtitle and CTA. Per-slide colour overrides and an optional split layout that puts the image on one side and the copy on the other." },
  { Icon: LayoutPanelLeft, name: "Split Banner", desc: "Full-bleed image with container-aligned heading, subtitle and buttons floating over it. Static, non-carousel, ideal for landing-page headers or campaign rows." },
  { Icon: Sparkles, name: "Welcome", desc: "Post-login greeter with a movable header, customer logo and an account-manager card. Each block sits in one of nine grid positions so one section fits many brands." },
  { Icon: AlignLeft, name: "Content", desc: "Heading, body copy and one or two buttons. The all-purpose marquee block for sales messages, intros and announcements." },
  { Icon: LayoutGrid, name: "Insights Grid", desc: "Editorial 2 or 3 column grid for articles, case studies and mixed-media stories. Per-card image position (left, top or right), accent border toggle and configurable image width." },
  { Icon: BookOpen, name: "Resources", desc: "Tag-tinted card carousel for blog posts, guides and downloadable assets. Optional autoplay, pause-on-hover and per-card open-in-same-tab control." },
  { Icon: Sparkles, name: "Feature Grid", desc: "2 to 4 column value-prop cards with icon, title and body. Outlined, tinted or solid card styles plus an image-card variant (image-top or image-left)." },
  { Icon: ListOrdered, name: "Steps", desc: "Numbered process strip with big editorial numerals or compact inline numbers. Horizontal or vertical stack with optional hairline dividers between steps." },
  { Icon: Quote, name: "Testimonials", desc: "Auto-scrolling quote carousel with star ratings and avatars. Pauses on hover, supports per-quote source links and configurable scroll speed." },
  { Icon: HelpCircle, name: "FAQ", desc: "Collapsible question-and-answer accordion built with native HTML details / summary — zero JS, fully keyboard-accessible out of the box." },
  { Icon: Megaphone, name: "CTA Banner", desc: "Final-call conversion block with optional brand logo, gradient or solid background and one or two action buttons. Sized to bridge editorial sections and a checkout." },
  { Icon: ImageIcon, name: "Logo Strip", desc: "Auto-scrolling marquee of partner / client logos. Optional per-logo links, greyscale-on-hover and configurable scroll direction and speed." },
  { Icon: Minus, name: "Break banner", desc: "Full-bleed parallax break with an overlaid heading. Useful to chapterise a long page and re-anchor the reader's attention between sections." },
  { Icon: Folders, name: "Tabs", desc: "Tabbed content with a side image, heading, body and CTAs per tab. On mobile the tabs collapse to a stacked layout with the image above the copy." },
  { Icon: Grid2x2, name: "Grid", desc: "2 × 2 or 2 × 3 image grid with optional links per cell. Image-only by default, with editable alt text for accessibility and SEO." },
  { Icon: Type, name: "Rich text", desc: "Tiptap-powered freeform copy block for everything the structured sections don't cover. Headings, lists, links, inline images, the lot." },
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
            Section types in the box
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
            Eighteen composable building blocks. Every page is one snippet.
          </h2>
          <p className="text-base leading-relaxed text-slate-600 mt-5">
            Each section ships as its own self-contained markup. Mix them
            inside the Hybrid Page Builder, drag to reorder, save the lot as
            one HTML drop-in.
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
            {PRO_SECTIONS.map(({ Icon, name, desc }, i) => (
              <div
                key={name}
                data-testid={`pro-section-tile-${i}`}
                className="group flex items-start gap-4 bg-white border-2 border-[#E01839]/30 p-5 rounded-md hover:border-[#E01839] hover:shadow-md transition-all"
              >
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
          {SECTIONS.map(({ Icon, name, desc }, i) => (
            <div
              key={name}
              data-testid={`section-tile-${i}`}
              className="group flex items-start gap-4 bg-white border border-slate-200 p-5 rounded-md hover:border-[#E01839] transition-colors"
            >
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
