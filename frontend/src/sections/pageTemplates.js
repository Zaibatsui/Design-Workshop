/**
 * Page templates — one-click starters that pre-populate a new page with a
 * coherent stack of blocks. Each template's blocks[] is an array of:
 *   { type: "section", section_type, config }   or
 *   { type: "richtext", config: { html, ... } }
 *
 * The backend normalizes these: it stamps a block_id on each, sanitizes any
 * richtext html, and persists them on the new page document.
 *
 * Configs are pulled from each section's own `defaults()` so templates stay
 * in sync whenever we tweak section defaults.
 */
import {
  Sparkles,
  Package,
  LayoutGrid,
  FileText,
  Users,
  BadgeDollarSign,
  ScrollText,
  Palette,
} from "lucide-react";
import { SECTIONS_BY_ID } from "./registry";
import { richtext } from "./richtext";
import { makeUid } from "./shared";

const section = (id, overrides = {}) => ({
  type: "section",
  section_type: id,
  config: { ...SECTIONS_BY_ID[id].defaults(), ...overrides },
});

const rt = (html, overrides = {}) => ({
  type: "richtext",
  config: { ...richtext.defaults(), html, ...overrides },
});

// Neutral IT-vendor logos for any template that includes a Logo Strip.
// Served by simpleicons.org's CDN — official brand marks at any size,
// no auth required, royalty-free for editorial use. Users replace these
// with their own retailer/distributor partner logos via the editor.
//
// Generated fresh on each template instantiation so every spawned page
// gets unique logo IDs (avoids collisions if the user copies blocks
// between pages later).
const sampleITLogos = () => [
  { id: makeUid(), image: "https://cdn.simpleicons.org/hp",     alt: "HP",     link: "" },
  { id: makeUid(), image: "https://cdn.simpleicons.org/dell",   alt: "Dell",   link: "" },
  { id: makeUid(), image: "https://cdn.simpleicons.org/lenovo", alt: "Lenovo", link: "" },
  { id: makeUid(), image: "https://cdn.simpleicons.org/intel",  alt: "Intel",  link: "" },
  { id: makeUid(), image: "https://cdn.simpleicons.org/nvidia", alt: "NVIDIA", link: "" },
  { id: makeUid(), image: "https://cdn.simpleicons.org/cisco",  alt: "Cisco",  link: "" },
  { id: makeUid(), image: "https://cdn.simpleicons.org/apple",  alt: "Apple",  link: "" },
];

export const PAGE_TEMPLATES = [
  {
    id: "blank",
    name: "Blank page",
    description: "Start empty — add blocks as you go.",
    icon: FileText,
    blocks: [],
  },
  {
    id: "brand-page",
    name: "Brand page",
    description:
      "Split banner → use-case cards → tech-highlight tabs → product carousel → brand statement. Inspired by vendor brand-page layouts.",
    icon: Palette,
    blocks: [
      // Lead split banner — coloured panel + product image. Brand Kit
      // will overlay panel/gradient colours and seed the dark logo on
      // creation. fullBleed:true gives the cinematic edge-to-edge feel
      // typical of vendor brand pages.
      section("split-banner", {
        fullBleed: true,
        imageSide: "right",
        panelRatio: 50,
        eyebrow: "",
        heading: "Built for work, home and everything in between",
      }),
      rt(
        "<h2>Discover the range</h2><p>Solutions designed to support productivity, visual performance and everyday comfort across professional and home environments.</p>",
        { padY: 56, align: "center", maxWidth: 720 }
      ),
      // Two image-led intro cards — Insights Grid in image-left layout
      // with the accent strip turned off for the clean hairline look
      // used on vendor product-range pages.
      section("insights", {
        eyebrow: "",
        title: "",
        columns: 2,
        cardLayout: "image-left",
        showAccentBorder: false,
        imageWidth: 200,
        paddingY: 0,
        cards: [
          {
            id: makeUid(),
            icon: "https://images.unsplash.com/photo-1593642634402-b0eb5e2eebc9?q=80&w=800&auto=format&fit=crop",
            iconAlt: "Professional workspace",
            heading: "Professional use",
            body: "Solutions that support productivity, visual performance, comfort and sustainability across everyday working environments.",
            linkText: "",
            link: "",
          },
          {
            id: makeUid(),
            icon: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?q=80&w=800&auto=format&fit=crop",
            iconAlt: "Home workspace",
            heading: "Home use",
            body: "A rich and varied choice of displays inspired by today's vibrant and diverse lifestyles.",
            linkText: "",
            link: "",
          },
        ],
      }),
      // Mid-page brand statement — CTA Banner with logo + gradient and
      // NO buttons (empty primaryLabel = no button rendered).
      section("cta-banner", {
        fullBleed: true,
        backgroundType: "gradient",
        eyebrow: "",
        heading: "Committed to the environment",
        subheading:
          "Designed with performance, efficiency and responsible innovation in mind — helping businesses choose display solutions that support productivity while considering long-term environmental impact.",
        primaryLabel: "",
        showSecondary: false,
      }),
      // Technology-highlight tabs — toggle pills + split image/copy
      // panels. Defaults already match the brand-page convention.
      rt(
        "<h2>Designed for modern working</h2><p>Built to support productivity, comfort and image performance across modern working environments.</p>",
        { padY: 56, align: "center", maxWidth: 720 }
      ),
      section("tabs"),
      // Featured products — live scrape carousel.
      rt(
        "<h2>Featured products</h2><p>Selected for advanced connectivity, visual performance and long-term reliability.</p>",
        { padY: 56, align: "center", maxWidth: 720 }
      ),
      section("products"),
    ],
  },
  {
    id: "landing",
    name: "Landing page",
    description: "Hero → value prop → vendor logos → features → testimonials → CTA. Marketing-ready.",
    icon: Sparkles,
    blocks: [
      section("hero"),
      rt(
        "<h2>Built for IT and telecom retailers</h2><p>Ship faster, convert better, scale without re-platforming. A pragmatic toolkit designed by operators who've actually run the store.</p>",
        { padY: 64, align: "center", maxWidth: 720 }
      ),
      section("logos", { logos: sampleITLogos() }),
      section("insights"),
      section("testimonials"),
      rt(
        "<h2>Ready when you are</h2><p>Book a 20-minute walkthrough and see how Nettailer fits your stack.</p>",
        { padY: 48, align: "center", maxWidth: 640 }
      ),
      section("break"),
    ],
  },
  {
    id: "product-detail",
    name: "Product detail",
    description: "Hero showcase → related products → why-us → resources.",
    icon: Package,
    blocks: [
      section("hero"),
      rt(
        "<h2>Also worth a look</h2><p>Hand-picked alternatives and complements from our catalogue.</p>",
        { padY: 56, align: "left", maxWidth: 1100 }
      ),
      section("products"),
      section("insights"),
      section("resources"),
    ],
  },
  {
    id: "category-hub",
    name: "Category hub",
    description: "Banner → top products → subcategory tabs → vendor logos → insights.",
    icon: LayoutGrid,
    blocks: [
      section("break"),
      rt(
        "<h2>This week's picks</h2><p>Fast movers across the category — updated live from the catalogue.</p>",
        { padY: 48, align: "left", maxWidth: 1100 }
      ),
      section("products"),
      section("tabs"),
      section("logos", { logos: sampleITLogos() }),
      section("insights"),
    ],
  },
  {
    id: "about-us",
    name: "About us",
    description: "Story-led: hero → manifesto → vendor logos → values → resources.",
    icon: Users,
    blocks: [
      section("hero"),
      rt(
        "<h1>A bit about us</h1><p>We build tooling for IT and telecom retailers because we've been them. Every decision optimises for the person behind the till — not the one signing the SaaS contract.</p><p>The team is small, the backlog isn't. If you'd like to work with us, get in touch.</p>",
        { padY: 80, align: "left", maxWidth: 720 }
      ),
      section("logos", { logos: sampleITLogos() }),
      section("insights"),
      section("resources"),
    ],
  },
  {
    id: "pricing",
    name: "Pricing",
    description: "Banner → plan comparison tabs → FAQs as insights → CTA.",
    icon: BadgeDollarSign,
    blocks: [
      section("break"),
      rt(
        "<h1>Honest pricing</h1><p>Pick the tier that fits today. Move between them any time — prorated, no sales call.</p>",
        { padY: 64, align: "center", maxWidth: 720 }
      ),
      section("tabs"),
      rt(
        "<h2>Frequently asked</h2><p>A handful of answers to the questions we get most often.</p>",
        { padY: 48, align: "left", maxWidth: 960 }
      ),
      section("insights"),
      rt(
        "<h2>Still on the fence?</h2><p>Book a 20-minute call — we'll tailor a demo to your actual stack.</p>",
        { padY: 56, align: "center", maxWidth: 560 }
      ),
    ],
  },
  {
    id: "blog-post",
    name: "Blog post",
    description: "Long-form: hero → intro → body → resources → related products.",
    icon: ScrollText,
    blocks: [
      section("hero"),
      rt(
        "<h1>A headline that earns the click</h1><p><em>Written by the team · 4 minute read</em></p><p>Open with the idea that would make a reader nod. Then back it up with one concrete example of the problem — something specific enough that it's obvious we've actually run into it ourselves.</p>",
        { padY: 64, align: "left", maxWidth: 720 }
      ),
      rt(
        "<h2>The argument</h2><p>Here is where you make the case. Keep paragraphs tight — three or four sentences each. Use <strong>bold</strong> to pull the eye to the numbers that matter and link out <a href=\"#\">only when it's genuinely useful</a>.</p><ul><li>A punchy list when you need to slow the reader down</li><li>One item per thought — no smuggled sub-clauses</li><li>Three to five items max, otherwise it's a spreadsheet</li></ul><h2>What it looks like in practice</h2><p>Ground the idea in a scenario your reader would recognise. This is usually the section people screenshot and share.</p>",
        { padY: 0, align: "left", maxWidth: 720 }
      ),
      section("resources"),
      rt(
        "<h2>You might also like</h2><p>Related products from the catalogue.</p>",
        { padY: 56, align: "left", maxWidth: 1100 }
      ),
      section("products"),
    ],
  },
];

export const PAGE_TEMPLATES_BY_ID = Object.fromEntries(
  PAGE_TEMPLATES.map((t) => [t.id, t])
);
