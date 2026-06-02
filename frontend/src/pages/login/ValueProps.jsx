import { Code, Layout, Palette, Blocks } from "lucide-react";

const PROPS = [
  {
    Icon: Layout,
    title: "Pick a section, make it yours",
    body: "Browse ready-made building blocks — hero banners, product showcases, FAQs, testimonials — and customise the words, colours, and images in a simple editor. No code, no templates to wrangle.",
  },
  {
    Icon: Blocks,
    title: "Stack sections into a full page",
    body: "Snap multiple sections together to build landing pages, category pages, or promotional blocks. Drag to reorder, click to edit, everything saves as you go.",
  },
  {
    Icon: Palette,
    title: "Your brand, applied everywhere",
    body: "Set your colours and fonts once. Every section you build picks them up automatically. Tweak the palette and your whole library re-skins itself in one click.",
  },
  {
    Icon: Code,
    title: "Copy. Paste. Done.",
    body: "Each section exports as one tidy block of HTML. Drop it into Shopify, WordPress, Squarespace, Wix, Webflow, Nettailer — wherever you publish. Nothing to install.",
  },
];

/**
 * Four value-prop cards. Sharp corners, hairline borders, hover lift —
 * Linear-style restraint, not SaaS-bubbly.
 */
export default function ValueProps() {
  return (
    <section
      data-testid="login-value-props"
      className="py-24 md:py-32 border-t border-slate-200"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E01839] mb-4">
            What it does
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
            Build better website content — for the tools you{" "}
            <span className="text-[#E01839]">already use</span>.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROPS.map(({ Icon, title, body }, i) => (
            <article
              key={title}
              data-testid={`value-prop-${i}`}
              className="group bg-white border border-slate-200 p-7 rounded-md hover:border-slate-400 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="w-9 h-9 rounded-md bg-[#E01839]/10 text-[#E01839] flex items-center justify-center mb-5 group-hover:bg-[#E01839] group-hover:text-white transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="font-heading text-base font-semibold tracking-tight text-slate-900 mb-2 leading-tight">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
