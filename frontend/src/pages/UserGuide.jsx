import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  AlignLeft,
  AlertTriangle,
  BookMarked,
  BookOpen,
  Boxes,
  Code2,
  Copy,
  FileStack,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Layout,
  LayoutGrid,
  ListOrdered,
  HelpCircle,
  Megaphone,
  Palette,
  PenLine,
  Rocket,
  Save,
  Sparkles,
} from "lucide-react";
import { BRAND } from "@/lib/brand";

/**
 * UserGuide — the in-app reference manual. Long-form, opinionated,
 * organised by user goal rather than by feature taxonomy. Reachable
 * only from the authenticated dashboard (NOT linked from the public
 * landing page). The auth gate is at the App.js route definition;
 * this component assumes the caller is already signed in.
 */

const SECTIONS = [
  { id: "getting-started", label: "Getting started", Icon: Rocket },
  { id: "dashboard", label: "Dashboard tour", Icon: LayoutGrid },
  { id: "section-editor", label: "Building a section", Icon: PenLine },
  { id: "section-types", label: "Section types", Icon: Layers },
  { id: "page-builder", label: "Hybrid page builder", Icon: FileStack },
  { id: "brand-kit", label: "Brand Kit", Icon: Palette },
  { id: "image-hosting", label: "Image hosting", Icon: ImageIcon },
  { id: "snippet", label: "Copy & embed snippet", Icon: Code2 },
  { id: "templates", label: "Page templates", Icon: BookMarked },
  { id: "tips", label: "Tips & shortcuts", Icon: Sparkles },
  { id: "faq", label: "FAQ", Icon: BookOpen },
];

export default function UserGuide() {
  const [active, setActive] = useState("getting-started");

  // Sync sidebar highlight with scroll position via IntersectionObserver
  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const onscreen = entries.filter((e) => e.isIntersecting);
        if (!onscreen.length) return;
        // Pick the topmost intersecting heading
        onscreen.sort(
          (a, b) =>
            a.boundingClientRect.top - b.boundingClientRect.top
        );
        setActive(onscreen[0].target.id);
      },
      { rootMargin: "-72px 0px -65% 0px", threshold: [0, 1] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div
      data-testid="user-guide-page"
      className="min-h-screen bg-white text-slate-900"
    >
      <Header />
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-10 md:py-14 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E01839] mb-4">
            User guide
          </p>
          <nav data-testid="guide-toc" className="space-y-0.5">
            {SECTIONS.map(({ id, label, Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                data-testid={`toc-${id}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  active === id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <article className="prose-guide max-w-none">
          <H1>The Design Workshop user guide</H1>
          <Lead>
            A practical reference for building, saving, theming and
            shipping reusable e-commerce content with Design Workshop.
            Skim the table of contents, jump anywhere.
          </Lead>

          <Section id="getting-started" Icon={Rocket} title="Getting started">
            <P>
              Design Workshop is a hybrid <strong>section + page editor</strong>{" "}
              that exports self-contained HTML / CSS / JS snippets you paste
              into your CMS. Three things to know before your first session:
            </P>
            <Ol>
              <li>
                <strong>Sections</strong> are reusable building blocks (Hero,
                Logos, Insights Grid, Tabs…). Each one ships as one snippet.
              </li>
              <li>
                <strong>Pages</strong> are stacks of blocks (sections from
                your library + ad-hoc rich-text). One page → one combined
                snippet.
              </li>
              <li>
                <strong>Brand Kit</strong> is your colour and font defaults.
                Set it once and every new section honours it; click "Apply
                brand kit" to re-skin existing sections.
              </li>
            </Ol>
            <Note>
              Everything autosaves. The moment you click off a field, it's
              persisted. There is no Save button — and that's intentional.
            </Note>
          </Section>

          <Section id="dashboard" Icon={LayoutGrid} title="Dashboard tour">
            <P>
              Your dashboard is the entry point. The top strip{" "}
              <strong>"Recently edited"</strong> shows the five most recent
              items across sections + pages — click a tile to jump straight
              into its editor.
            </P>
            <P>
              Below that, two tabs: <strong>Sections</strong> and{" "}
              <strong>Pages</strong>. Both use the same masonry-grid card
              layout — short cards (e.g. Logo Strip) sit side-by-side with
              tall ones (Hero, Break Banner) without ragged whitespace.
            </P>
            <Bullets
              items={[
                <>
                  <Kbd>Drag</Kbd> the grip handle on a card to reorder. Order
                  persists to your library.
                </>,
                <>
                  Hover a card to reveal <strong>Duplicate</strong> and{" "}
                  <strong>Delete</strong> actions.
                </>,
                <>
                  <strong>"+ New section"</strong> opens the section-type
                  picker. <strong>"+ New page"</strong> opens the template
                  picker (start blank or pick one).
                </>,
                <>
                  Click a card title to{" "}
                  <strong>rename inline</strong> — autosaves on blur or Enter.
                </>,
              ]}
            />
          </Section>

          <Section id="section-editor" Icon={PenLine} title="Building a section">
            <P>
              The Section editor has three columns: a settings rail on the
              left, a live preview in the centre, and a snippet drawer on the
              right (toggle with <Kbd>Copy snippet</Kbd>).
            </P>
            <Bullets
              items={[
                <>
                  Edit any field — text, colour, image, link — and the
                  centre preview updates as you type.
                </>,
                <>
                  Each section has a <strong>collapsible item list</strong>{" "}
                  (e.g. logos, slides, products, cards). Click the row title
                  to expand its full editor; <Kbd>+</Kbd> at the bottom to add
                  another.
                </>,
                <>
                  Press <Kbd>Esc</Kbd> any time to dismiss modals or close
                  the snippet drawer.
                </>,
                <>
                  The <strong>"Apply brand kit"</strong> button (top of the
                  rail) overlays your brand colours + fonts onto the section
                  without touching content (your products, slides, copy stay
                  intact).
                </>,
              ]}
            />
          </Section>

          <Section id="section-types" Icon={Layers} title="Section types">
            <P>
              Design Workshop ships fourteen section types. All are
              colour-themable, font-themable and contain at least one
              image-bearing field where applicable.
            </P>
            <Grid>
              <SectionCard Icon={Layout} name="Hero" desc="Slide / fade carousel with full-bleed background, headline, subtitle, CTA. Per-slide colour overrides." />
              <SectionCard Icon={AlignLeft} name="Content" desc="Heading + body + buttons. The all-purpose marquee block." />
              <SectionCard Icon={Boxes} name="Products" desc="Card carousel with image, name, price and a hover-tinted border. Optional links." />
              <SectionCard Icon={LayoutGrid} name="Insights Grid" desc="2-3 column editorial grid for articles, case studies, anything mixed-media." />
              <SectionCard Icon={BookOpen} name="Resources" desc="Tag-tinted card carousel — blog posts, guides, downloads. Optional 'open in same tab' per card." />
              <SectionCard Icon={Sparkles} name="Feature Grid" desc="2-4 column value-prop cards with icon, title and body. Outlined, tinted or solid card styles." />
              <SectionCard Icon={ListOrdered} name="Steps" desc="Numbered process strip — horizontal or vertical. Big editorial numerals or compact inline. Hairline dividers optional." />
              <SectionCard Icon={HelpCircle} name="FAQ" desc="Collapsible Q+A accordion. Uses native <details>/<summary> for zero-JS accessibility; optional single-open mode." />
              <SectionCard Icon={Megaphone} name="CTA Banner" desc="Final-call conversion block — eyebrow + headline + subhead + 1 or 2 buttons. Centred or left-aligned." />
              <SectionCard Icon={Layers} name="Logo Strip" desc="Auto-scrolling marquee. Per-image links + greyscale-until-hover toggle." />
              <SectionCard Icon={Layout} name="Break banner" desc="Full-bleed parallax break with overlaid heading. Use it to chapter long pages." />
              <SectionCard Icon={FileStack} name="Tabs" desc="Tabbed content panel with a side image. Great for product detail." />
              <SectionCard Icon={LayoutGrid} name="Grid" desc="2×2 / 2×3 image grid with optional links per cell. Seeded with neutral sample photos — replace with your own via the cell image picker." />
              <SectionCard Icon={PenLine} name="Rich text" desc="Tiptap-powered freeform copy block — used inside Pages for ad-hoc paragraphs between structural sections." />
            </Grid>
          </Section>

          <Section id="page-builder" Icon={FileStack} title="Hybrid page builder">
            <P>
              A Page is a stack of <strong>blocks</strong>. Each block is
              either a structural section (cloned from your library) or a
              raw rich-text block. Pages live separately from sections —
              editing the original library section never retroactively
              changes pages that already cloned it.
            </P>
            <P>
              The page editor has a left rail with two tabs:
            </P>
            <Bullets
              items={[
                <>
                  <strong>Blocks</strong> — this page's stacked blocks.{" "}
                  <GripVertical className="inline w-3.5 h-3.5 align-text-bottom" />{" "}
                  to reorder. Click a row to open its editor in the drawer
                  on the right.
                </>,
                <>
                  <strong>Pages</strong> — your library of pages. Click any
                  to navigate.
                </>,
                <>
                  Footer button is contextual: <strong>"+ Add block"</strong>{" "}
                  on the Blocks tab opens a picker (New section / From library
                  / Rich text); <strong>"+ New page"</strong> on the Pages tab
                  starts a fresh page from a template.
                </>,
              ]}
            />
            <Note>
              Rich-text blocks support headings, lists, links, bold / italic,
              and inline images. They're how you fill the gaps between
              structural sections.
            </Note>
          </Section>

          <Section id="brand-kit" Icon={Palette} title="Brand Kit">
            <P>
              The Brand Kit page (<Code>/brand</Code>) is a single source of
              truth for your visual identity:
            </P>
            <Bullets
              items={[
                <><strong>Primary colour</strong> — accents, links, hover borders.</>,
                <><strong>Text colour</strong> — body copy + headings.</>,
                <><strong>Background colour</strong> — section backgrounds.</>,
                <><strong>Heading font</strong> — pick from 12 curated Google fonts, or "Inherit from site".</>,
                <><strong>Body font</strong> — same picker.</>,
              ]}
            />
            <P>
              <strong>"Inherit from site"</strong> is special. Pick it and
              the snippet ships <em>without</em> a font import — the
              embedding site's own typography wins. Useful when your CMS
              already loads brand fonts and you don't want a second copy.
            </P>
            <P>
              From any Section editor, click <strong>"Apply brand kit"</strong>{" "}
              to re-skin that section. We overlay brand colours and fonts onto
              your existing content; products, slides, and copy stay intact.
            </P>
          </Section>

          <Section id="image-hosting" Icon={ImageIcon} title="Image hosting — uploads vs URLs">
            <P>
              Anywhere the editor lets you add an image, you have two
              options: <strong>upload</strong> a file from your computer
              or <strong>paste a hosted URL</strong> (your existing CDN,
              your e-commerce DAM, your blog's media library, an Unsplash
              link, etc.). Both produce the same visual result. They are
              <strong> not</strong> equivalent operationally.
            </P>
            <Warning>
              <strong>Prefer hosted URLs whenever you can.</strong>{" "}
              Uploaded images are stored by Design Workshop and served
              from this service. If Design Workshop is offline for any
              reason, every snippet you've embedded into a customer site
              will keep rendering its layout, colours, copy and animations
              — but uploaded images in those snippets won't load. Hosted
              URLs point to wherever the image already lives, completely
              independent of this service, so they keep working through
              any disruption here.
            </Warning>
            <P>
              <strong>When upload is the right choice:</strong> bespoke
              graphics, logos you don't already host anywhere, anything
              created specifically for one snippet. The 10 MB cap and
              auto-served caching headers make it the path of least
              resistance for one-off assets.
            </P>
            <P>
              <strong>When URL is the better choice:</strong>
            </P>
            <Bullets
              items={[
                <>Product photography that already lives on your e-commerce platform's CDN — paste the existing image URL.</>,
                <>Manufacturer-supplied marketing imagery hosted on the brand's site.</>,
                <>Royalty-free stock from Unsplash / Pexels / Pixabay (right-click → "Copy image address").</>,
                <>Anything served from a hosted image library you already pay for (Cloudinary, Imgix, Sirv, ImageKit…).</>,
                <>Blog post hero images already embedded in your CMS.</>,
              ]}
            />
            <P>
              For mission-critical pages — homepage hero, top-of-funnel
              landing pages, big seasonal campaigns — hosted URLs are the
              defensible choice. They survive any disruption to this
              service indefinitely. Treat uploads as the convenience option
              for everything else.
            </P>
            <Note>
              We host uploaded images behind a long-lived edge cache, so
              short outages typically don't affect delivery — caches keep
              serving the bytes for weeks. The caveat above is about
              extended disruption (multi-day outage, account closure,
              service deprecation) — events you should plan for if your
              snippets need to outlast this service.
            </Note>
          </Section>

          <Section id="snippet" Icon={Code2} title="Copy & embed the snippet">
            <P>
              Every section editor and page editor has a{" "}
              <strong>"Copy snippet"</strong> button. Click it to open the
              snippet drawer:
            </P>
            <Ol>
              <li>The drawer shows the full self-contained HTML — markup, scoped CSS, and a tiny IIFE.</li>
              <li>Click <strong>"Copy"</strong> — your clipboard now holds the entire snippet.</li>
              <li>Paste it into your CMS as a raw HTML block (Nettailer raw-HTML widget, custom CMS rich-text source mode, etc.).</li>
            </Ol>
            <Note>
              The CSS is scoped to a unique class per section so two sections
              never collide. The IIFE auto-runs on paste — no setup, no
              dependencies.
            </Note>
            <P>
              <strong>Pages</strong> export the same way: one combined
              snippet covering every block. Order in the snippet matches the
              rail's vertical order.
            </P>
          </Section>

          <Section id="templates" Icon={BookMarked} title="Page templates">
            <P>
              When you create a new page, the template picker offers a few
              starting layouts (Landing, Product, Blog) plus a Blank option.
              You can also <strong>save any page as a custom template</strong>{" "}
              from the page editor's "Save as template" action — it'll then
              appear in the picker for future pages.
            </P>
            <P>
              Custom templates are private to your account. Editing the
              template doesn't affect pages already created from it.
            </P>
          </Section>

          <Section id="tips" Icon={Sparkles} title="Tips & shortcuts">
            <Bullets
              items={[
                <><Kbd>Esc</Kbd> closes any open drawer or modal.</>,
                <>Click any card title in the dashboard to <strong>rename inline</strong>.</>,
                <>Untouched new sections / pages aren't saved to your library — only edited ones persist. So feel free to "preview" a new section type.</>,
                <>The dashboard Sections grid is <strong>masonry</strong>: short cards live next to tall ones with no whitespace tail.</>,
                <>The "Recently edited" strip at the top jumps you straight back to your last 5 active items.</>,
                <>The Logo Strip <strong>greyscale-until-hover</strong> toggle pairs with the existing scroll-pause-on-hover for a polished marquee.</>,
                <>Each Logo Strip image accepts an optional <strong>link</strong> — the rendered <Code>{"<a>"}</Code> opens in a new tab.</>,
                <>The Grid section starts with neutral sample photos — swap each cell's image for your own via the editor's image picker.</>,
              ]}
            />
          </Section>

          <Section id="faq" Icon={BookOpen} title="FAQ">
            <Q q="Where is my data stored?">
              MongoDB on the same backend that serves this app. Your sections,
              pages and brand kit live in your account's records — not in
              localStorage, not in cookies.
            </Q>
            <Q q="Will the snippet break if I edit the source section later?">
              No. Pages snapshot their blocks at insertion time. Editing the
              original library section never retroactively changes pages
              already built from it.
            </Q>
            <Q q="Can I export a section without its IIFE?">
              The IIFE is required for any section that auto-scrolls or has
              interactivity (Logo Strip, carousels, tabs). Static sections
              (Content, Break banner) don't need one and don't ship one.
            </Q>
            <Q q="What about analytics?">
              Not yet. The exported snippets are inert beyond their core
              behaviour. A future release will offer an opt-in click-tracker
              for Logo Strip links and CTA buttons.
            </Q>
            <Q q="Multiplayer?">
              On the roadmap. For now Design Workshop is single-user — your
              account, your library.
            </Q>
          </Section>

          <div className="mt-16 pt-8 border-t border-slate-200 text-sm text-slate-500">
            Last updated: 2026-05-02 · Want a feature documented?
            File an issue or ping the Zaibatsui team.
          </div>
        </article>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Small presentational helpers — kept inside the file because they */
/* exist only to give the guide consistent typography.              */
/* ---------------------------------------------------------------- */

function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          data-testid="guide-back-to-dashboard"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center ${BRAND.iconBoxClass}`}
          >
            <BRAND.Icon className="w-3 h-3" />
          </div>
          <span className="font-heading text-sm font-semibold tracking-tight text-slate-900">
            {BRAND.name} Guide
          </span>
        </div>
      </div>
    </header>
  );
}

function H1({ children }) {
  return (
    <h1 className="font-heading text-4xl md:text-5xl font-semibold tracking-tighter text-slate-900 leading-[1.1] mb-5">
      {children}
    </h1>
  );
}

function Lead({ children }) {
  return (
    <p className="text-base md:text-lg leading-relaxed text-slate-600 mb-12 max-w-2xl">
      {children}
    </p>
  );
}

function Section({ id, Icon, title, children }) {
  return (
    <section
      id={id}
      data-testid={`guide-section-${id}`}
      className="mt-16 scroll-mt-24"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-md bg-[#E01839]/10 text-[#E01839] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 leading-tight">
          {title}
        </h2>
      </div>
      <div className="text-[15px] leading-relaxed text-slate-700 space-y-4">
        {children}
      </div>
    </section>
  );
}

function P({ children }) {
  return <p className="leading-relaxed">{children}</p>;
}

function Ol({ children }) {
  return (
    <ol className="list-decimal pl-5 space-y-2 marker:text-slate-400 marker:font-medium">
      {children}
    </ol>
  );
}

function Bullets({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-2 marker:text-[#E01839]">
      {items.map((it, i) => {
        // Bullet items are static React nodes; derive a stable-ish key from
        // their string contents when possible, falling back to the index
        // (the lists never reorder, so the index fallback is safe).
        const key =
          typeof it === "string"
            ? it.slice(0, 40)
            : typeof it?.key === "string"
              ? it.key
              : `b-${i}`;
        return (
          <li key={key} className="leading-relaxed">
            {it}
          </li>
        );
      })}
    </ul>
  );
}

function Note({ children }) {
  return (
    <div className="border-l-2 border-[#E01839] bg-[#E01839]/5 px-4 py-3 rounded-r-md text-[14px] text-slate-700">
      {children}
    </div>
  );
}

// Amber callout, distinct from the brand-red Note. Used for things the
// user should be aware of but isn't strictly an error — e.g. operational
// dependencies, cost trade-offs, durability caveats.
function Warning({ children }) {
  return (
    <div className="flex gap-3 border-l-2 border-amber-500 bg-amber-50 px-4 py-3 rounded-r-md text-[14px] text-slate-700">
      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-slate-300 bg-slate-50 text-[11px] font-mono text-slate-700 leading-none">
      {children}
    </kbd>
  );
}

function Code({ children }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[13px] font-mono text-slate-800">
      {children}
    </code>
  );
}

function Q({ q, children }) {
  return (
    <div className="mt-5">
      <p className="font-semibold text-slate-900 mb-1.5">{q}</p>
      <p className="text-slate-600 leading-relaxed">{children}</p>
    </div>
  );
}

function Grid({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">{children}</div>
  );
}

function SectionCard({ Icon, name, desc }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-md border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <p className="font-heading text-[14px] font-semibold tracking-tight text-slate-900 mb-1 leading-tight">
          {name}
        </p>
        <p className="text-[13px] leading-relaxed text-slate-600">{desc}</p>
      </div>
    </div>
  );
}
