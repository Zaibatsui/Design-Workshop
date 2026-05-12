import { useMemo } from "react";
import { Sparkles, ShoppingBag } from "lucide-react";
import { welcome } from "@/sections/welcome";
import { products } from "@/sections/products";
import { previewDoc, makeUid } from "@/sections/shared";

/**
 * SectionSpotlights — two stand-out section types previewed live as
 * tilted iframe cards on the marketing landing page. The frames render
 * the actual snippet output, not screenshots, so they stay in sync
 * whenever the section renderers change.
 */
function welcomeCfg() {
  return {
    ...welcome.defaults(),
    uid: makeUid(),
    heading: "Welcome back, Acme.",
    body:
      "Your account team and quick links are one click away — pick up where you left off.",
    eyebrow: "PORTAL READY",
    headerPos: "tl",
    amPos: "br",
    showLogo: false,
    amName: "Priya Shah",
    amRole: "Your Account Manager",
    amEmail: "priya@acme.com",
    amPhone: "+44 20 7946 0123",
    height: 360,
    overlayOpacity: 0.6,
  };
}

function productsCfg() {
  return {
    ...products.defaults(),
    uid: makeUid(),
    title: "Top offers this week",
    eyebrow: "STAFF PICKS",
    columns: 4,
    paddingY: 28,
    products: [
      {
        id: "p1",
        name: "Aero Wireless Headset",
        price: "£189.00",
        priceSuffix: "Excl VAT",
        image:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
        link: "#",
        overlay: "",
        overlayPosition: "top-left",
        overlaySize: 38,
      },
      {
        id: "p2",
        name: "Ultraslim Laptop 14\"",
        price: "£1,299.00",
        priceSuffix: "Excl VAT",
        image:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=600&auto=format&fit=crop",
        link: "#",
        overlay: "",
        overlayPosition: "top-left",
        overlaySize: 38,
      },
      {
        id: "p3",
        name: "Mechanical Keyboard",
        price: "£139.00",
        priceSuffix: "Excl VAT",
        image:
          "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop",
        link: "#",
        overlay: "",
        overlayPosition: "top-left",
        overlaySize: 38,
      },
      {
        id: "p4",
        name: "Studio Webcam Pro",
        price: "£229.00",
        priceSuffix: "Excl VAT",
        image:
          "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=600&auto=format&fit=crop",
        link: "#",
        overlay: "",
        overlayPosition: "top-left",
        overlaySize: 38,
      },
    ],
  };
}

function Spotlight({ headline, blurb, Icon, snippet, tilt, frameHeight, testid }) {
  return (
    <div
      data-testid={testid}
      className="group relative"
      style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "center" }}
    >
      <div className="absolute -top-3 left-6 z-10 inline-flex items-center gap-2 bg-[#E01839] text-white text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-sm shadow-sm">
        <Icon className="w-3 h-3" />
        Spotlight
      </div>
      <div className="rounded-md overflow-hidden border border-slate-200 bg-white shadow-[0_18px_42px_-22px_rgba(15,23,42,0.35)] transition-transform duration-300 group-hover:-translate-y-1">
        <div className="px-6 pt-7 pb-4">
          <h3 className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-slate-900 leading-tight">
            {headline}
          </h3>
          <p className="text-sm leading-relaxed text-slate-500 mt-2">{blurb}</p>
        </div>
        <div className="bg-slate-50 border-t border-slate-200">
          <iframe
            title={headline}
            srcDoc={snippet}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            className="block w-full border-0"
            style={{ height: `${frameHeight}px` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function SectionSpotlights() {
  const welcomeDoc = useMemo(() => previewDoc(welcome.render(welcomeCfg())), []);
  const productsDoc = useMemo(() => previewDoc(products.render(productsCfg())), []);

  return (
    <section
      data-testid="login-section-spotlights"
      className="py-24 md:py-32 bg-white"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mb-16">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E01839] mb-4">
            Two of the new favourites
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
            Built for portals and product pages alike.
          </h2>
          <p className="text-base leading-relaxed text-slate-600 mt-5">
            Below are the actual snippets running in sandboxed frames —
            interactive, scoped, and shippable as-is.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          <Spotlight
            testid="spotlight-welcome"
            Icon={Sparkles}
            headline="A first impression that feels personal."
            blurb="The Welcome banner greets each customer by name, pins their account manager in reach, and lets you slide every block to a different corner per brand."
            snippet={welcomeDoc}
            tilt={-1.4}
            frameHeight={360}
          />
          <Spotlight
            testid="spotlight-products"
            Icon={ShoppingBag}
            headline="Product carousels that look hand-built."
            blurb="Pull live prices straight from your storefront, drop badges on any corner, and let your shoppers swipe through curated picks with zero runtime libraries."
            snippet={productsDoc}
            tilt={1.4}
            frameHeight={440}
          />
        </div>
      </div>
    </section>
  );
}
