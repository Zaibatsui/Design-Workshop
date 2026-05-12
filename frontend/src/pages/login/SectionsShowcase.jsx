import {
  Layers,
  AlignLeft,
  ShoppingBag,
  LayoutGrid,
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
} from "lucide-react";

const SECTIONS = [
  { Icon: Layers, name: "Hero", desc: "Slide / fade carousels with CTA + background media." },
  { Icon: Sparkles, name: "Welcome", desc: "Post-login greeter with movable header, customer logo and account-manager card." },
  { Icon: AlignLeft, name: "Content", desc: "Heading + body + buttons. The all-purpose marquee block." },
  { Icon: ShoppingBag, name: "Products", desc: "Card carousel with image, name, price, hover border." },
  { Icon: LayoutGrid, name: "Insights Grid", desc: "Editorial 2-3 column card grid for articles & case studies." },
  { Icon: BookOpen, name: "Resources", desc: "Tag-tinted card carousel for blog posts, guides, downloads." },
  { Icon: Sparkles, name: "Feature Grid", desc: "2-4 column value-prop cards with icon, title and body." },
  { Icon: ListOrdered, name: "Steps", desc: "Numbered process strip — horizontal or vertical stack." },
  { Icon: Quote, name: "Testimonials", desc: "Auto-scrolling quote carousel with ratings + avatars. Pauses on hover." },
  { Icon: HelpCircle, name: "FAQ", desc: "Collapsible Q+A accordion. Native zero-JS accessibility." },
  { Icon: Megaphone, name: "CTA Banner", desc: "Final-call conversion block with one or two buttons." },
  { Icon: ImageIcon, name: "Logo Strip", desc: "Auto-scrolling marquee. Optional links + greyscale-on-hover." },
  { Icon: Minus, name: "Break banner", desc: "Full-bleed parallax break with overlaid heading." },
  { Icon: Folders, name: "Tabs", desc: "Tabbed content with a side image. Great for product details." },
  { Icon: Grid2x2, name: "Grid", desc: "2×2 / 2×3 image grid with optional links per cell." },
  { Icon: Type, name: "Rich text", desc: "Tiptap-powered freeform copy block for the gaps." },
];

/**
 * Visual catalogue. Tinted slate-50 background to break the page rhythm
 * and make the cards pop. Tile hover bumps the icon color to brand red.
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
            Sixteen composable building blocks. Every page is one snippet.
          </h2>
          <p className="text-base leading-relaxed text-slate-600 mt-5">
            Each section ships as its own self-contained markup. Mix them
            inside the Hybrid Page Builder, drag to reorder, save the lot as
            one HTML drop-in.
          </p>
        </div>
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
