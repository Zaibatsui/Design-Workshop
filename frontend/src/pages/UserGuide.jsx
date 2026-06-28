import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  AlignLeft,
  AlertTriangle,
  BookMarked,
  BookOpen,
  Boxes,
  Clock,
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
  Quote,
  Rocket,
  Save,
  Shield,
  Sparkles,
  Star,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import TicketDialog from "@/components/TicketDialog";
import { Button } from "@/components/ui/button";
import SectionPreviewPopover from "@/components/SectionPreviewPopover";
import { Columns3, Hash, PlayCircle, FolderOpen, Building2 } from "lucide-react";

/**
 * UserGuide — the in-app reference manual. Long-form, opinionated,
 * organised by user goal rather than by feature taxonomy. Reachable
 * only from the authenticated dashboard (NOT linked from the public
 * landing page). The auth gate is at the App.js route definition;
 * this component assumes the caller is already signed in.
 */

const SECTIONS = [
  { id: "quickstart", label: "Quickstart (5 min)", Icon: Clock },
  { id: "getting-started", label: "Getting started", Icon: Rocket },
  { id: "dashboard", label: "Dashboard tour", Icon: LayoutGrid },
  { id: "collections", label: "Collections (folders)", Icon: FolderOpen },
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

export default function UserGuide({ chromeless = false }) {
  const [active, setActive] = useState("getting-started");
  // Ticket dialog state — opened from the in-guide "Report a bug /
  // request a feature" CTA and the bottom-of-page footer link.
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketType, setTicketType] = useState("bug");
  const openTicket = (type = "bug") => {
    setTicketType(type);
    setTicketOpen(true);
  };

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
      className={chromeless ? "bg-white text-slate-900" : "min-h-screen bg-white text-slate-900"}
    >
      {!chromeless && <Header />}
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

          {/* Bottom-of-nav report CTA — mirrors the page footer so the
              "tell us what's broken / what's missing" entry point is
              always within reach without having to scroll. */}
          <div className="mt-6 pt-5 border-t border-slate-200 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
              Stuck or have an idea?
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openTicket("bug")}
              data-testid="guide-sidebar-report-bug"
              className="w-full justify-start"
            >
              Report a bug
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openTicket("feature")}
              data-testid="guide-sidebar-request-feature"
              className="w-full justify-start"
            >
              Request a feature
            </Button>
          </div>
        </aside>

        <article className="prose-guide max-w-none">
          <H1>The Design Workshop user guide</H1>
          <Lead>
            A friendly walkthrough of how to build, save, theme and ship
            beautiful sections of a webpage — even if you've never written
            a line of code. Pick a chapter from the list on the left, or
            scroll top-to-bottom for the full tour.
          </Lead>

          <Section id="quickstart" Icon={Clock} title="Quickstart — your first design in 5 minutes">
            <P>
              The fastest path from "I just signed in" to "look at this
              new section on our website." If you ever want more detail
              on a step, every chapter below covers it in depth.
            </P>
            <Ol>
              <li>
                <strong>Pick your brand colours first.</strong> Click{" "}
                <strong>Brand Kit</strong> in the top right, choose your
                main colour and (optionally) the fonts you want to use.
                Everything new you build will pick these up automatically.
              </li>
              <li>
                <strong>Start a new section.</strong> Back on the
                dashboard, hit{" "}
                <strong>"+ New section"</strong> and choose what kind you
                want — a <em>Hero</em> banner, a <em>Product Carousel</em>,
                or a <em>Logo Strip</em> are great first picks.
              </li>
              <li>
                <strong>Edit and watch it come to life.</strong> The
                preview in the middle updates the second you change
                anything. The panel on the right is where you change
                text, images, colours and buttons. There's no <em>Save</em>
                {" "}button — your work saves itself the moment you click
                away from a field.
              </li>
              <li>
                <strong>Click "Copy snippet"</strong> in the top right.
                That copies your finished section as a single block of
                code you can paste straight into your website.
              </li>
              <li>
                <strong>Paste it into your website.</strong> Most platforms
                have a "Raw HTML", "Embed code" or "Source" option somewhere
                in their page editor — paste the snippet there, save the
                page, and refresh. Your new section is live.
              </li>
            </Ol>
            <Note>
              That's the whole loop. From here you can build more
              sections, combine them into a multi-section <em>Page</em>{" "}
              that pastes in as one big block, and use{" "}
              <strong>"Apply brand kit"</strong> to refresh any older
              section to your latest brand colours.
            </Note>
          </Section>

          <Section id="getting-started" Icon={Rocket} title="Getting started">
            <P>
              Design Workshop is a visual builder for the kind of content
              that lives between your homepage banner and your product
              listings — heroes, feature blocks, testimonials, product
              carousels and more. You build a section here, paste it
              into your website's page editor, and you're done. Three
              ideas you'll keep meeting:
            </P>
            <Ol>
              <li>
                <strong>Sections</strong> are reusable building blocks —
                things like a Hero banner, a Logo strip, a row of product
                cards, a tabbed product detail block. Each one is one
                ready-to-paste piece.
              </li>
              <li>
                <strong>Pages</strong> are when you stack several sections
                together and want them to paste in as a single piece. One
                page → one copy-paste.
              </li>
              <li>
                <strong>Brand Kit</strong> is the home of your colours and
                fonts. Set it once, every new section follows it, and
                clicking "Apply brand kit" updates older sections too.
              </li>
            </Ol>
            <Note>
              Everything saves itself automatically. The moment you click
              away from a field, it's stored. You'll never see a "Save"
              button — and you'll never lose work.
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
                  Hover a card to reveal <strong>Move to&hellip;</strong>{" "}
                  (file into a collection), <strong>Duplicate</strong> and{" "}
                  <strong>Delete</strong> actions.
                </>,
                <>
                  <strong>"+ New section"</strong> opens the section-type
                  picker. <strong>"+ New page"</strong> opens the template
                  picker (start blank or pick one). If a collection chip is
                  active, the new item is filed there automatically.
                </>,
                <>
                  Click a card title to{" "}
                  <strong>rename inline</strong> — autosaves on blur or Enter.
                </>,
              ]}
            />
          </Section>

          <Section id="collections" Icon={FolderOpen} title="Collections (folders)">
            <P>
              Once your library grows past a handful of items, collections
              keep it tidy. A collection is a flat folder — sections and
              pages can be filed into one, items without one show under
              <strong> "Unfiled"</strong>. Each user has their own private
              set of collections.
            </P>
            <P>
              The <strong>Collections</strong> strip sits just above the
              Sections / Pages tabs on the dashboard. Click a chip to
              filter both tabs simultaneously to items in that collection.
              Each chip carries a colour dot and a count of how many
              items live inside.
            </P>
            <Bullets
              items={[
                <>
                  <strong>Create a collection</strong> via the{" "}
                  <Kbd>Manage</Kbd> button at the end of the strip. Pick
                  a name (1–40 chars) and one of eight colours.
                </>,
                <>
                  <strong>File an item</strong> from the dashboard card —
                  hover, click the folder icon, pick a target. The move
                  is optimistic so it feels instant; we roll back with
                  a toast if the server rejects it.
                </>,
                <>
                  <strong>Save-on-create</strong>: if you click "New
                  section" or "New page" <em>while</em> a collection chip
                  is active, the new item lands directly inside that
                  collection. The strip shows a hint —{" "}
                  <em>"New items will be saved to 'Arcserve'."</em> — so
                  you know where it's going.
                </>,
                <>
                  <strong>Rename or recolour</strong> from the Manage
                  dialog. Items inside the collection update instantly.
                </>,
                <>
                  <strong>Delete a collection</strong> from the Manage
                  dialog. The items inside are <strong>not</strong>{" "}
                  deleted — they become Unfiled. We treat this as a
                  one-way operation: if you really want them gone,
                  delete the items individually first.
                </>,
                <>
                  <strong>"All items"</strong> always shows everything
                  regardless of filing; <strong>"Unfiled"</strong> shows
                  only items not yet filed.
                </>,
              ]}
            />
          </Section>

          <Section id="section-editor" Icon={PenLine} title="Building a section">
            <P>
              The section editor has three areas: a settings panel on the
              right, a live preview in the middle, and a "Copy snippet"
              drawer that slides out when you're ready to take your
              design to your website.
            </P>
            <P>
              The settings panel is grouped into <strong>collapsible
              sections</strong>. Most sections expose a <em>Header</em>
              group for copy and a single <em>Defaults</em> group that
              bundles layout (padding, alignment, widths, sizes) and
              theme (colours, backgrounds) in one place. Hero is
              richer: <em>Section / Carousel</em>, <em>Slide defaults</em>,
              and <em>Slides</em> for per-slide overrides. Click a
              heading to open that group; the others tuck themselves
              away so the panel never feels overwhelming.
            </P>
            <Bullets
              items={[
                <>
                  Type or change anything — text, colour, image, link —
                  and the preview in the middle updates straight away.
                </>,
                <>
                  Sections with repeating items (logos, slides, products,
                  cards, FAQs…) show a <strong>tidy collapsed list</strong>.
                  Click a row to open the full editor for that item; the
                  <Kbd>+</Kbd> button at the bottom adds another.
                </>,
                <>
                  Press <Kbd>Esc</Kbd> at any time to close any popup or
                  the snippet drawer.
                </>,
                <>
                  The <strong>"Apply brand kit"</strong> button repaints
                  the section with your latest brand colours and fonts
                  without touching your words, products, or images.
                </>,
              ]}
            />
          </Section>

          <Section id="section-types" Icon={Layers} title="Section types">
            <P>
              Design Workshop ships twenty-four reusable section types plus a
              rich-text block for use inside Pages. All are colour-themable,
              font-themable and contain at least one image-bearing field
              where applicable. Two of them — <strong>Product Carousel</strong>
              {" "}and <strong>Product Grid</strong> — are Pro / Nettailer-aware
              blocks with live price scraping and a universal VAT toggle.
            </P>
            <Grid>
              <SectionCard sectionId="hero" Icon={Layout} name="Hero" desc="Slide / fade carousel with full-bleed background, headline, subtitle, CTA. Per-slide colour and layout overrides, an optional split slide layout (full-bleed image + container-aligned text), and mobile-specific overrides for overlay, gradients and alignment so the small-screen view never inherits a desktop-only look you didn't want." />
              <SectionCard sectionId="split-banner" Icon={Layout} name="Split Banner" desc="Static full-bleed image with container-aligned heading, subtitle and buttons floating over it. Lighter cousin of Hero for non-carousel use. Optional feature-points list inside the panel for showing several benefits at once." />
              <SectionCard sectionId="featured-card" Icon={Star} name="Featured Card" desc="Full-bleed photo background with a translucent glass card holding eyebrow, headline (with accent-phrase highlight), subheading, feature points and an optional CTA. Card placeable in one of nine grid positions." />
              <SectionCard sectionId="welcome" Icon={Sparkles} name="Welcome" desc="Post-login greeter: header, customer logo and account-manager card, each placeable in one of nine grid positions so one tool fits many brands." />
              <SectionCard sectionId="content" Icon={AlignLeft} name="Content" desc="Heading + body + buttons. The all-purpose marquee block." />
              <SectionCard sectionId="products" Icon={Boxes} name="Product Carousel" desc="Card carousel with image, name, price and a hover-tinted border. Optional product-URL scraping auto-fills name / price / image, and the snippet live-flips inc-VAT ↔ ex-VAT prices when the host site's VAT toggle is clicked — works on Nettailer, Netset and most storefronts that label their toggle in plain English / Swedish / French." />
              <SectionCard sectionId="productGrid" Icon={LayoutGrid} name="Product Grid" desc="Same product cards as a static grid (2-6 per row, wraps to multiple rows). Identical scrape / VAT-toggle / gated-pricing behaviour as the Product Carousel — just no carousel." />
              <SectionCard sectionId="insights" Icon={LayoutGrid} name="Insights Grid" desc="2-3 column editorial grid for articles, case studies, anything mixed-media. Per-card image position (left / top / right), accent border toggle, configurable image width." />
              <SectionCard sectionId="resources" Icon={BookOpen} name="Resources" desc="Tag-tinted card carousel — blog posts, guides, downloads. Optional 'open in same tab' per card." />
              <SectionCard sectionId="feature-grid" Icon={Sparkles} name="Feature Grid" desc="2-4 column value-prop cards with icon, title and body. Outlined / tinted / solid card styles, plus an image-card variant (image-top or image-left)." />
              <SectionCard sectionId="trust-strip" Icon={Shield} name="Trust Strip" desc="Compact 2-5 column row of icon + title + 1-line credibility callouts. Flat by design (no cards, no shadows) so it counterweights heavier sections — great for credibility marks like '20+ years' or 'ISO 27001 certified'." />
              <SectionCard sectionId="stat-counter" Icon={Hash} name="Stat Counter" desc="Row of big numbers (e.g. '36%', '£2.4M', '5×') each with a label and an optional supporting line. 2-5 columns, optional eyebrow + heading + intro on top, optional CTA underneath. Numbers ramp from zero on scroll into view (respects prefers-reduced-motion). The natural complement to Trust Strip for impact / outcomes bands." />
              <SectionCard sectionId="video-embed" Icon={PlayCircle} name="Video Embed" desc="Poster image + centred play button → click opens a modal lightbox that lazy-loads a YouTube or Vimeo iframe. Nothing loads from the host until the user presses play (privacy-friendly). ESC closes, click outside dismisses, focus restores to the play button, body scroll locks while open. Configurable aspect ratio, lightbox width and play-button style." />
              <SectionCard sectionId="comparison-table" Icon={Columns3} name="Comparison Table" desc="Three-column 'us vs them' matrix — feature rows with ticks on your column and crosses on the competitor's. Optional brand-logo header on your column, accent tint + border to draw the eye, and a closing line + CTA below. High-converting B2B pattern." />
              <SectionCard sectionId="steps" Icon={ListOrdered} name="Steps" desc="Numbered process strip — horizontal or vertical. Big editorial numerals or compact inline. Hairline dividers optional." />
              <SectionCard sectionId="testimonials" Icon={Quote} name="Testimonials" desc="Auto-scrolling quote carousel. Optional avatars + star ratings; pauses on hover so readers can actually read. Same seamless marquee as the Logo Strip." />
              <SectionCard sectionId="faq" Icon={HelpCircle} name="FAQ" desc="Collapsible Q+A accordion. Uses native <details>/<summary> for zero-JS accessibility; optional single-open mode." />
              <SectionCard sectionId="cta-banner" Icon={Megaphone} name="CTA Banner" desc="Final-call conversion block — eyebrow + headline + subhead + 1 or 2 buttons. Optional logo, gradient backgrounds, per-element colour overrides." />
              <SectionCard sectionId="logos" Icon={Layers} name="Logo Strip" desc="Auto-scrolling marquee. Per-image links + greyscale-until-hover toggle." />
              <SectionCard sectionId="break" Icon={Layout} name="Break banner" desc="Full-bleed parallax break with overlaid heading. Use it to chapter long pages." />
              <SectionCard sectionId="tabs" Icon={FileStack} name="Tabs" desc="Tabbed content panel with a side image. Great for product detail." />
              <SectionCard sectionId="placeholder" Icon={LayoutGrid} name="Grid" desc="2×2 / 2×3 image grid with optional links per cell. Seeded with neutral sample photos — replace with your own via the cell image picker." />
              <SectionCard sectionId="brand-grid" Icon={Building2} name="Brand Grid" desc="Searchable grid of brand cards with an optional full-bleed photo header (radius cascades from Brand Kit, solid or linear-gradient overlay). Per-card eyebrow + alignment, edge-pickable accent bar on hover, greyscale-until-hover, full click-to-edit." />
              <SectionCard sectionId="blog-body" Icon={BookOpen} name="Blog Body" desc="Long-form article block with an optional sidebar of CTA / Related-articles / Tag-cluster / Author-card widgets. Sidebar can sit left, right or below the body; opt-in sticky-on-scroll for desktop; mobile auto-collapses to a horizontal swipe carousel." />
              <SectionCard Icon={PenLine} name="Rich text" desc="Tiptap-powered freeform copy block — used inside Pages for ad-hoc paragraphs between structural sections." />
            </Grid>
            <Note>
              The section picker automatically tags brand-new blocks with a
              green <strong>NEW</strong> chip for their first 14 days, and the
              three most-recently improved blocks with an amber{" "}
              <strong>UPDATED</strong> chip. Click <strong>"What's new"</strong>{" "}
              in the dashboard header for plain-English notes describing each
              one. The notes cover page templates too.
            </Note>
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
                <><strong>Primary colour</strong> — accents, links, hover borders. The universal fallback whenever a role-specific colour is left blank.</>,
                <><strong>Secondary colour</strong> — dark panel / banner backgrounds (Welcome overlay, CTA Banner, Split Banner panel).</>,
                <><strong>Text colour</strong> — headings.</>,
                <><strong>Body colour</strong> — paragraph copy.</>,
                <><strong>Background colour</strong> — section backgrounds.</>,
                <><strong>Link / Button / Accent</strong> — role-specific overrides. Leave blank to inherit primary.</>,
                <><strong>Eyebrow text + colour</strong> — the small uppercase label above headings. Empty eyebrow text → hidden everywhere.</>,
                <><strong>Logo (dark and light variants)</strong> — auto-seeded into Hero slides, Welcome banner and Split Banner when those sections are first created.</>,
                <><strong>Button radius</strong> — global pill / rounded / sharp control. Drives every CTA across every section for visual consistency.</>,
                <><strong>Heading font</strong> + <strong>Body font</strong> — pick from 12 curated Google fonts, or "Inherit from site".</>,
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

          <Section id="image-hosting" Icon={ImageIcon} title="Adding images — upload or paste a link">
            <P>
              Anywhere the editor asks for an image, you have two
              choices: <strong>upload</strong> a file from your computer,
              or <strong>paste a link</strong> to an image that already
              lives online somewhere (your product database, an Unsplash
              photo, the brand's website…). They look identical when you
              hit "Copy snippet" — but they behave a bit differently
              behind the scenes.
            </P>
            <Warning>
              <strong>Use links to existing images when you can.</strong>{" "}
              Uploaded files are stored on our servers. If we ever go
              offline, those uploaded images won't load (everything else
              in your snippet — text, colours, layout — keeps working).
              Linked images live wherever you copied the link from, so
              they keep working no matter what happens here.
            </Warning>
            <P>
              <strong>Upload is great for:</strong> one-off graphics, a
              logo you don't have hosted anywhere else, banner artwork
              made specifically for a campaign. Files up to 10 MB.
            </P>
            <P>
              <strong>A link is the safer choice for:</strong>
            </P>
            <Bullets
              items={[
                <>Product photos that already live on your e-commerce platform — copy the image URL from there.</>,
                <>Marketing images hosted on a brand's own website.</>,
                <>Stock photos from Unsplash / Pexels / Pixabay (right-click an image and pick "Copy image address").</>,
                <>Anything from an image library you already pay for (Cloudinary, Imgix, etc.).</>,
                <>Blog post hero images already in your website's media library.</>,
              ]}
            />
            <P>
              For your most important pages — your homepage hero, a big
              campaign — links to existing images are the safest bet.
              They'll keep working through anything. Save uploads for
              everything else, where the convenience of "just pick a
              file" wins.
            </P>
            <Note>
              We cache uploaded images aggressively, so a short outage
              usually doesn't affect what your customers see — the
              browser keeps showing the cached version for weeks. The
              warning above is about much longer disruptions like an
              extended outage or account closure.
            </Note>
          </Section>

          <Section id="snippet" Icon={Code2} title="Copy & paste into your website">
            <P>
              Every section editor and every page editor has a{" "}
              <strong>"Copy snippet"</strong> button in the top right.
              That's how you take your finished design out of Design
              Workshop and into your website.
            </P>
            <Ol>
              <li>Click <strong>Copy snippet</strong> — a drawer slides in from the side previewing the exact code that will be pasted.</li>
              <li>Click <strong>"Copy"</strong> — that copies the whole thing to your clipboard.</li>
              <li>In your website's page editor, find the option to add a "Raw HTML", "Embed code" or "Source" block, and paste.</li>
              <li>Save the page in your website and refresh — your design is live.</li>
            </Ol>
            <Note>
              Each section's styles are scoped to itself, so you can drop
              two different sections onto the same page and they won't
              affect each other (or anything else on the page). No setup
              required, no extra libraries — paste and you're done.
            </Note>
            <P>
              <strong>Pages</strong> work exactly the same way: one
              "Copy snippet" gives you every section stacked in the
              order shown in the page editor.
            </P>
          </Section>

          <Section id="templates" Icon={BookMarked} title="Page templates">
            <P>
              When you create a new page, the template picker offers eleven
              starting points: <strong>Landing</strong>,{" "}
              <strong>Product detail</strong>, <strong>Category hub</strong>,
              <strong> About us</strong>, <strong>Pricing</strong>,{" "}
              <strong>Blog post</strong>, <strong>Brand page</strong>,{" "}
              <strong>Service landing</strong>,{" "}
              <strong>Story page</strong>, <strong>Shop by brand</strong>,
              plus <strong>Blank</strong>.
              Each one pre-stacks a coherent block order with realistic
              placeholder content, all themed by your Brand Kit. New and
              recently-improved templates wear the same NEW / UPDATED chips
              as sections.
            </P>
            <P>
              You can also <strong>save any page as a custom template</strong>{" "}
              from the page editor's "Save as template" action — it'll then
              appear in the picker for future pages. Custom templates are
              private to your account, and editing the template doesn't
              affect pages already created from it.
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
                <>Click <strong>"What's new"</strong> in the dashboard header for a plain-English changelog of recently shipped sections and page templates. The dot on the button lights up when there's something new since you last looked.</>,
                <>The Testimonials carousel <strong>pauses on hover</strong> so readers can finish a quote — and respects <Code>prefers-reduced-motion</Code> for accessibility.</>,
                <>Set a testimonial's rating to <strong>0</strong> to hide its stars individually, or toggle "Show star ratings" off to hide them across the whole block.</>,
                <>The Grid section starts with neutral sample photos — swap each cell's image for your own via the editor's image picker.</>,
                <>Toggle the preview between <strong>Desktop</strong> and <strong>Mobile</strong> in the editor's preview header — Hero exposes mobile-specific overlay, gradient and alignment overrides that only appear when the preview is in mobile mode.</>,
                <>Every list row (Hero slides, Tabs tabs, Feature Grid cards, Products, FAQ items, etc.) now has a <strong>Duplicate</strong> icon between the move-down arrow and the trash icon. The clone lands directly under the original with a fresh id and the form auto-opens it.</>,
                <>A Hero with only <strong>one slide</strong> automatically hides arrows and dots. They reappear the moment you add a second slide.</>,
                <>The Hero carousel <strong>preview lock</strong> (opening a slide row in the inspector pins the carousel to that slide) now survives device-toggle and pause-on-hover. Previously a quick mouse-out could silently restart autoplay.</>,
                <>Tabs sections now support an optional <strong>section header</strong> (eyebrow / title / intro) above the tab row — useful when you want the section to introduce itself before the tabs do.</>,
                <>Each <strong>Hero slide</strong> now supports an optional <strong>eyebrow</strong> label above the title plus per-slide <strong>Title / Subtitle / Eyebrow colour</strong> overrides — perfect for carousels that mix slides on light and dark backgrounds.</>,
                <>Every section + page editor now carries a small <strong>Collection picker</strong> next to the save indicator — file the current item into any of your Collections, jump back to Unfiled, or create a brand-new Collection inline without leaving the editor.</>,
                <>Hit <strong>"Report a bug"</strong> or <strong>"Request a feature"</strong> in the sidebar or page footer to file a ticket directly. Admins can mark it Complete, Reject, or reopen it — AND now <strong>reply</strong> with a follow-up message. You can reply back too, with strict turn-taking: one reply per side, then wait for the other side. The badge in the dashboard header lights up whenever there's a fresh status change or admin reply on your tickets.</>,
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
              interactivity (Logo Strip, Testimonials, carousels, tabs). Static sections
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

          <div className="mt-16 pt-8 border-t border-slate-200 text-sm text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-3">
            <span>Last updated: 2026-02-13 ·</span>
            <span>Want a feature documented?</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openTicket("bug")}
              data-testid="guide-footer-report-bug"
            >
              Report a bug
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openTicket("feature")}
              data-testid="guide-footer-request-feature"
            >
              Request a feature
            </Button>
          </div>
        </article>
      </div>
      <TicketDialog
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        defaultType={ticketType}
      />
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

function SectionCard({ Icon, name, desc, sectionId }) {
  return (
    <div className="relative flex items-start gap-3 p-4 rounded-md border border-slate-200 hover:border-slate-300 transition-colors cursor-default">
      {sectionId && (
        <SectionPreviewPopover
          sectionId={sectionId}
          className="absolute top-1.5 right-1.5 z-10"
        />
      )}
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
