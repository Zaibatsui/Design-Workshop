import { useEffect, useRef, useState, useMemo } from "react";
import { Code2, MousePointer2 } from "lucide-react";
import { logos } from "@/sections/logos";
import { insights } from "@/sections/insights";
import { composePage } from "@/sections/pageSnippet";
import { previewDoc } from "@/sections/shared";

/**
 * LiveDemo — replaces the static testimonial. When this section scrolls
 * into view we mount an iframe whose `srcDoc` is the EXACT HTML / CSS /
 * scoped IIFE bundle that ships from Design Workshop — a real Logo Strip
 * stacked above a real Insights Grid, no React, no CDN calls.
 *
 * Visitors can hover the logos (greyscale → colour, scroll pauses) and
 * the cards (border tint shifts) — the demo is the proof.
 *
 * Sandboxed `allow-scripts allow-same-origin` is intentional: we want
 * the section IIFEs (carousel cloning, scroll-distance recompute) to
 * run, but we never load remote scripts so this stays safe.
 */
export default function LiveDemo() {
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || visible) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  // Compose two real registry sections — same code path the dashboard
  // uses — so what visitors see is byte-identical to a real export.
  const doc = useMemo(() => {
    const blocks = [
      {
        block_id: "demo-logos",
        type: "section",
        section_type: "logos",
        config: {
          ...logos.defaults(),
          greyscale: true,
          paddingY: 30,
          bgColor: "#ffffff",
        },
      },
      {
        block_id: "demo-insights",
        type: "section",
        section_type: "insights",
        config: { ...insights.defaults(), paddingY: 60 },
      },
    ];
    return previewDoc(composePage(blocks));
  }, []);

  return (
    <section
      data-testid="login-live-demo"
      className="py-24 md:py-32 bg-slate-900 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgba(224,24,57,0.18), transparent 70%)",
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E01839] mb-4">
            Live demo
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-white leading-tight">
            What you see is what you ship.
          </h2>
          <p className="text-base leading-relaxed text-slate-300 mt-5">
            The frame below isn't a screenshot — it's the actual HTML +
            scoped CSS + ~600 bytes of IIFE that come out of Design Workshop.
            Hover the logos, watch them un-grey. Hover a card, watch the border
            tint. No React, no jQuery, no CDN — just the markup your CMS pastes.
          </p>
          <div className="flex flex-wrap items-center gap-5 mt-6 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <MousePointer2 className="w-3.5 h-3.5 text-[#E01839]" />
              Hover to interact
            </span>
            <span className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-[#E01839]" />
              Sandboxed, real export
            </span>
          </div>
        </div>

        <div
          ref={wrapRef}
          data-testid="login-live-demo-frame"
          className="relative rounded-md overflow-hidden border border-white/10 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.4)]"
          style={{ minHeight: "560px" }}
        >
          {visible ? (
            <iframe
              title="Design Workshop live demo"
              srcDoc={doc}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              className="block w-full border-0"
              style={{ height: "560px" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm">
              Loading live demo…
            </div>
          )}
          {/* Browser-chrome top strip for editorial framing */}
          <div className="absolute top-0 inset-x-0 h-6 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 pl-3 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="ml-3 text-[10px] font-mono text-slate-400 tracking-wider">
              your-site.com / homepage.html
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4 italic">
          The same IIFE pattern handles auto-scroll, hover-pause and
          shrink-wrap — every section ships independently, every page is one
          paste.
        </p>
      </div>
    </section>
  );
}
