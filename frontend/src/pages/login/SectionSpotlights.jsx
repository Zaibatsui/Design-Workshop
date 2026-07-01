import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { welcome } from "@/sections/welcome";
import { products } from "@/sections/products";
import { previewDoc, makeUid } from "@/sections/shared";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PUBLIC_URL = `${BACKEND_URL}/api/public/landing-spotlights`;

/**
 * SectionSpotlights — two stand-out sections previewed live as tilted
 * iframe cards on the marketing landing page.
 *
 * Slot picks are admin-curated from the Brand Kit page (Landing
 * spotlights card). When no picks are set, falls back to a hand-rolled
 * Welcome + Products demo so first-run visitors don't see an empty
 * band. When the admin explicitly clears both slots, the band hides
 * entirely.
 */

// --- Hand-rolled fallback configs (only shown when the public API has
// never been written to). ----------------------------------------------
function fallbackWelcomeCfg() {
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
    height: 280,
    overlayOpacity: 0.6,
  };
}

function fallbackProductsCfg() {
  return {
    ...products.defaults(),
    uid: makeUid(),
    title: "Top offers this week",
    eyebrow: "STAFF PICKS",
    columns: 4,
    paddingY: 28,
    products: [
      { id: "p1", name: "Aero Wireless Headset", price: "£189.00", priceSuffix: "Excl VAT", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop", link: "#", overlay: "", overlayPosition: "top-left", overlaySize: 38 },
      { id: "p2", name: "Ultraslim Laptop 14\"", price: "£1,299.00", priceSuffix: "Excl VAT", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=600&auto=format&fit=crop", link: "#", overlay: "", overlayPosition: "top-left", overlaySize: 38 },
      { id: "p3", name: "Mechanical Keyboard", price: "£139.00", priceSuffix: "Excl VAT", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop", link: "#", overlay: "", overlayPosition: "top-left", overlaySize: 38 },
      { id: "p4", name: "Studio Webcam Pro", price: "£229.00", priceSuffix: "Excl VAT", image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=600&auto=format&fit=crop", link: "#", overlay: "", overlayPosition: "top-left", overlaySize: 38 },
    ],
  };
}

// --- Render a picked section into a sandboxed iframe doc -------------
function renderPicked(item) {
  if (!item) return null;
  const def = SECTIONS_BY_ID[item.type];
  if (!def || typeof def.render !== "function") return null;
  // Stamp a fresh uid so multiple instances on the page never collide.
  const cfg = { ...item.config, uid: makeUid() };
  return {
    headline: item.name || def.name || "Featured section",
    blurb: def.description || "",
    doc: previewDoc(def.render(cfg)),
  };
}

// Frame heights cycle through this rhythm so a row of curated slots
// doesn't read as a monotonous grid of identical boxes.
const FRAME_HEIGHTS = [360, 440, 380, 420];
const TILTS = [-1.4, 1.4, -1.1, 1.1];

function Spotlight({ headline, blurb, snippet, tilt, frameHeight, testid }) {
  return (
    <div
      data-testid={testid}
      className="group relative"
      style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "center" }}
    >
      <div className="absolute -top-3 left-6 z-10 inline-flex items-center gap-2 bg-[#E01839] text-white text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-sm shadow-sm">
        <Sparkles className="w-3 h-3" />
        Spotlight
      </div>
      <div className="rounded-md overflow-hidden border border-slate-200 bg-white shadow-[0_18px_42px_-22px_rgba(15,23,42,0.35)] transition-transform duration-300 group-hover:-translate-y-1">
        <div className="px-6 pt-7 pb-4">
          <h3 className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-slate-900 leading-tight">
            {headline}
          </h3>
          {blurb && (
            <p className="text-sm leading-relaxed text-slate-500 mt-2">
              {blurb}
            </p>
          )}
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
  // null = still loading; array once resolved.
  const [picks, setPicks] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(PUBLIC_URL)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => {
        if (cancelled) return;
        setPicks(data?.slots || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Render whichever slots are filled. If the admin hasn't curated any,
  // fall back to the hand-rolled defaults so the band always has
  // something worth showing for first-run / never-curated deployments.
  const { items, mode } = useMemo(() => {
    if (picks == null) return { items: [], mode: "loading" };

    const curated = picks.map(renderPicked).filter(Boolean);
    if (curated.length === 0) {
      return {
        items: [
          {
            headline: "A first impression that feels personal.",
            blurb:
              "The Welcome banner greets each customer by name, pins their account manager in reach, and lets you slide every block to a different corner per brand.",
            doc: previewDoc(welcome.render(fallbackWelcomeCfg())),
          },
          {
            headline: "Product carousels that look hand-built.",
            blurb:
              "Pull live prices straight from your storefront, drop badges on any corner, and let your shoppers swipe through curated picks with zero runtime libraries.",
            doc: previewDoc(products.render(fallbackProductsCfg())),
          },
        ],
        mode: "fallback",
      };
    }

    return { items: curated, mode: "curated" };
  }, [picks]);

  // Loading: render nothing (avoids layout pop).
  if (mode === "loading") return null;

  return (
    <section
      data-testid="login-section-spotlights"
      className="py-24 md:py-32 bg-white"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mb-16">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E01839] mb-4">
            A closer look
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
            {items.length > 1
              ? `${items.length} examples — live and editable.`
              : "Live and editable."}
          </h2>
          <p className="text-base leading-relaxed text-slate-600 mt-5">
            These aren't mockups. They're the real building blocks, running
            here in your browser. Click around — what you see is what your
            visitors would see.
          </p>
        </div>

        {/*
          Full width, not a side-by-side grid: these previews stand in for
          full-bleed website sections, so shrinking one to half the
          container crops exactly the thing we're trying to prove ("what
          you see is what you ship"). Instead we stack them, alternating
          tilt + a small horizontal nudge, with a negative top margin on
          desktop so each card fans out from behind the last one.
        */}
        <div>
          {items.map((item, i) => (
            <div
              key={i}
              className={i === 0 ? "relative" : "relative mt-14 md:-mt-16"}
              style={{
                zIndex: i + 1,
                transform: `translateX(${i % 2 === 0 ? "-1.5%" : "1.5%"})`,
              }}
            >
              <Spotlight
                testid={`spotlight-${i}`}
                headline={item.headline}
                blurb={item.blurb}
                snippet={item.doc}
                tilt={TILTS[i % TILTS.length]}
                frameHeight={FRAME_HEIGHTS[i % FRAME_HEIGHTS.length]}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
