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
import { templateMetaFor } from "./pageTemplateMeta";

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
        { padY: 56, align: "center" }
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
        { padY: 56, align: "center" }
      ),
      section("tabs"),
      // Featured products — live scrape carousel.
      rt(
        "<h2>Featured products</h2><p>Selected for advanced connectivity, visual performance and long-term reliability.</p>",
        { padY: 56, align: "center" }
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
        { padY: 64, align: "center" }
      ),
      section("logos", { logos: sampleITLogos() }),
      section("insights"),
      section("testimonials"),
      rt(
        "<h2>Ready when you are</h2><p>Book a 20-minute walkthrough and see how Nettailer fits your stack.</p>",
        { padY: 48, align: "center" }
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
        { padY: 56, align: "left" }
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
        { padY: 48, align: "left" }
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
        { padY: 80, align: "left" }
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
        { padY: 64, align: "center" }
      ),
      section("tabs"),
      rt(
        "<h2>Frequently asked</h2><p>A handful of answers to the questions we get most often.</p>",
        { padY: 48, align: "left" }
      ),
      section("insights"),
      rt(
        "<h2>Still on the fence?</h2><p>Book a 20-minute call — we'll tailor a demo to your actual stack.</p>",
        { padY: 56, align: "center" }
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
        { padY: 64, align: "left" }
      ),
      rt(
        "<h2>The argument</h2><p>Here is where you make the case. Keep paragraphs tight — three or four sentences each. Use <strong>bold</strong> to pull the eye to the numbers that matter and link out <a href=\"#\">only when it's genuinely useful</a>.</p><ul><li>A punchy list when you need to slow the reader down</li><li>One item per thought — no smuggled sub-clauses</li><li>Three to five items max, otherwise it's a spreadsheet</li></ul><h2>What it looks like in practice</h2><p>Ground the idea in a scenario your reader would recognise. This is usually the section people screenshot and share.</p>",
        { padY: 0, align: "left" }
      ),
      section("resources"),
      rt(
        "<h2>You might also like</h2><p>Related products from the catalogue.</p>",
        { padY: 56, align: "left" }
      ),
      section("products"),
    ],
  },
  {
    id: "service-landing",
    name: "Service landing",
    description:
      "Problem → solution → trust → process → CTA. A complete B2B service narrative built from Featured Card, Split Banner and Trust Strip.",
    icon: Sparkles,
    blocks: [
      // 1 — Problem hero. Photo background + glass card with 3 pain points.
      section("featured-card", {
        eyebrow: "THE CHALLENGE",
        heading: "IT problems slowing your team down?",
        accentHeading: "slowing your team down?",
        subheading:
          "Most businesses lose hours every week to avoidable IT friction. Here's what's usually behind it.",
        cardPosition: "cl",
        height: 600,
        overlayOpacity: 0.45,
        points: [
          { id: makeUid(), icon: "clock", title: "Slow response times", body: "Tickets that drag on for days while productivity stalls." },
          { id: makeUid(), icon: "shield", title: "Security blind spots", body: "Gaps in coverage that put data and compliance at risk." },
          { id: makeUid(), icon: "chart", title: "Unpredictable costs", body: "Surprise invoices and unclear roadmaps that make budgeting impossible." },
        ],
        showCta: false,
      }),

      // 2 — Solution split banner with feature-points mode enabled.
      section("split-banner", {
        eyebrow: "OUR SOLUTION",
        heading: "Proactive IT support that pays for itself.",
        subheading:
          "We handle the day-to-day so your team can focus on the work that actually moves the business forward.",
        imageSide: "left",
        height: 480,
        showPoints: true,
        points: [
          { id: makeUid(), icon: "zap", title: "Same-day response", body: "Direct line to a senior engineer — no ticket queues." },
          { id: makeUid(), icon: "lock", title: "Built-in security", body: "Patching, monitoring and backups included as standard." },
          { id: makeUid(), icon: "check", title: "Fixed monthly fee", body: "One predictable invoice. No surprises, no scope creep." },
        ],
        ctaText: "See pricing",
        ctaLink: "#",
      }),

      // 3 — Trust strip with 4 credibility callouts.
      section("trust-strip", {
        columns: 4,
        items: [
          { id: makeUid(), icon: "shield", title: "Established & reliable", body: "20+ years supporting UK businesses." },
          { id: makeUid(), icon: "users", title: "Trusted by hundreds", body: "Long-term partners across sectors." },
          { id: makeUid(), icon: "star", title: "5-star service", body: "Consistent feedback from happy customers." },
          { id: makeUid(), icon: "clock", title: "Always available", body: "24/7 support when you need it most." },
        ],
      }),

      // 4 — Process featured card on a photo. Three steps with icons.
      section("featured-card", {
        eyebrow: "HOW IT WORKS",
        heading: "A three-step path to a quieter inbox.",
        accentHeading: "quieter inbox.",
        subheading:
          "From the first call to a fully managed environment, here's how we work with you.",
        cardPosition: "cr",
        height: 600,
        overlayOpacity: 0.4,
        image:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
        points: [
          { id: makeUid(), icon: "rocket", title: "1. Discovery call", body: "We learn how your team works and where the friction lives." },
          { id: makeUid(), icon: "palette", title: "2. Tailored plan", body: "A clear roadmap with timelines, fixed costs and quick wins." },
          { id: makeUid(), icon: "check", title: "3. Ongoing partnership", body: "We become your IT team — proactively, not just when things break." },
        ],
        showCta: false,
      }),

      // 5 — Final CTA featured card with 3 benefits + button.
      section("featured-card", {
        eyebrow: "READY TO GET STARTED?",
        heading: "Let's give your team an IT setup they actually like.",
        accentHeading: "actually like.",
        subheading:
          "Book a free 30-minute call. No commitment, no sales pressure — just a chat about what would make the biggest difference.",
        cardPosition: "cc",
        height: 560,
        overlayOpacity: 0.55,
        cardMaxWidth: 640,
        image:
          "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1600&auto=format&fit=crop",
        points: [
          { id: makeUid(), icon: "zap", title: "Fast onboarding", body: "Up and running in days, not months." },
          { id: makeUid(), icon: "users", title: "Senior engineers only", body: "No first-line outsourcing — you talk to someone who can fix it." },
          { id: makeUid(), icon: "shield", title: "Risk-free trial", body: "30-day handshake. If it's not a fit, we part as friends." },
        ],
        ctaLabel: "Book a call",
        ctaUrl: "#",
        showCta: true,
      }),
    ],
  },
  {
    id: "story-page",
    name: "Story page",
    description:
      "Hero → product video → impact numbers → social proof → email-capture close. A complete sales-pitch arc that drops in the four newest sections in one click.",
    icon: Sparkles,
    blocks: [
      // 1 — Hero hook. Single fade slide with a dark photo backdrop that
      // sits naturally next to the dark Video Embed below it. Uses the
      // correct slide schema (title / subtitle / image / ctaText /
      // ctaLink — NOT React-ish camelCase).
      section("hero", {
        transition: "fade",
        slides: [
          {
            id: makeUid(),
            logo: "",
            logoAlt: "",
            title: "Tell people what you do — and why it matters.",
            subtitle:
              "A complete narrative arc, ready to edit. Open with the hook, show the product in action, prove the impact, lock in the trust, and close on a free-trial CTA.",
            image:
              "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop",
            ctaText: "Watch the tour",
            ctaLink: "#",
          },
        ],
      }),

      // 2 — Product video. Empty videoUrl so the section quietly plays
      // the bundled Design Workshop demo reel by default — gives users
      // an instant working preview while they hunt for their own video.
      section("video-embed", {
        eyebrow: "See it in action",
        heading: "A ninety-second product tour.",
        body:
          "Watch how the pieces fit together — then come back and rewrite this section for your own product.",
        bgColor: "#0f172a",
        textColor: "#ffffff",
        bodyColor: "#cbd5e1",
        accentColor: "#E01839",
        playButtonStyle: "solid",
        aspect: "16/9",
        posterAspect: "16/9",
      }),

      // 3 — Stat Counter. Dark theme to flow on from the video section
      // visually (no jarring colour break). The defaults are already
      // narrative-friendly ("Build pages, not boilerplate") so users can
      // edit them without first having to rip out IT-consulting jargon.
      section("stat-counter", {
        eyebrow: "The impact",
        heading: "Numbers your team will feel.",
        body:
          "Replace these with metrics that actually matter to your prospects — adoption, time saved, deals closed.",
        ctaText: "",
        ctaLink: "",
      }),

      // 4 — Trust Strip. Four credibility callouts on a clean light row
      // — gives the eye a breather between the dark Stat Counter and the
      // final dark CTA Banner. Inspired by Dripify / Stripe trust bands.
      section("trust-strip", {
        bgColor: "#ffffff",
        textColor: "#0f172a",
        bodyColor: "#475569",
        accentColor: "#E01839",
        columns: 4,
        items: [
          { id: makeUid(), icon: "users", title: "Trusted by teams", body: "From two-person startups to nine-figure enterprises." },
          { id: makeUid(), icon: "shield", title: "Built for security", body: "SOC 2 ready, ISO 27001 aligned, no third-party tracking." },
          { id: makeUid(), icon: "star", title: "Rated five stars", body: "Independent reviews on G2, Capterra and Trustpilot." },
          { id: makeUid(), icon: "zap", title: "Setup in minutes", body: "No engineering team needed — paste it in and ship." },
        ],
      }),

      // 5 — CTA Banner in email-capture mode. The form-action URL is
      // left blank so the section visibly nudges the user to wire up
      // their mailing-list provider (Mailchimp / ConvertKit / Beehiiv /
      // Buttondown) — better that than silently shipping a broken form.
      section("cta-banner", {
        eyebrow: "Get started",
        heading: "Tell better stories. Starting today.",
        subheading:
          "Join the early-access list — we'll send you the next batch of templates the moment they ship.",
        mode: "email-form",
        formAction: "",
        emailFieldName: "email",
        emailPlaceholder: "you@yourcompany.com",
        submitLabel: "Join the list",
        submitOpenInNewTab: true,
        formMicroTrust: "No spam — unsubscribe in one click.",
        bgColor: "#0f172a",
        textColor: "#ffffff",
        bodyColor: "#cbd5e1",
        accentColor: "#E01839",
        textAlign: "center",
        fullBleed: true,
      }),
    ],
  },
];

// Attach `addedOn` / `updatedOn` / `whatsNew` metadata so the picker
// and the What's New drawer can compute NEW / UPDATED badges
// automatically. Single source of truth: `pageTemplateMeta.js`.
const withMeta = (t) => ({ ...t, ...templateMetaFor(t.id) });
for (let i = 0; i < PAGE_TEMPLATES.length; i++) {
  PAGE_TEMPLATES[i] = withMeta(PAGE_TEMPLATES[i]);
}

export const PAGE_TEMPLATES_BY_ID = Object.fromEntries(
  PAGE_TEMPLATES.map((t) => [t.id, t])
);
