import { useEffect, useMemo, useRef, useState } from "react";
import { Code2, MousePointer2 } from "lucide-react";
import { composePage } from "@/sections/pageSnippet";
import { previewDoc } from "@/sections/shared";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PUBLIC_DEMO_URL = `${BACKEND_URL}/api/public/landing-demo`;

// Suppresses the iframe's own horizontal scrollbar (a composed page can
// end up a hair wider than the frame from full-bleed sections) without
// touching vertical scroll, which is the whole point of this preview —
// see the "Hover, click, scroll" copy below. Reaches into the srcDoc
// itself rather than the shared `previewDoc()`, which is also used by
// the live page editor canvas.
function hideHorizontalScroll(doc) {
  return doc.replace(
    "</head>",
    "<style>html,body{overflow-x:hidden}</style></head>"
  );
}

/**
 * LiveDemo — admin-curated. Fetches the page that the admin flagged as
 * featured in their Brand Kit "Landing demo" picker, then renders its
 * actual composed HTML / scoped CSS / IIFE inside a sandboxed iframe.
 *
 * If no page is featured (or the featured page was deleted), we render
 * `null` so the section is hidden entirely on the marketing landing
 * page — per user request.
 *
 * The fetch happens unauthenticated against `/api/public/landing-demo`
 * which intentionally omits MongoDB internals and only returns
 * `{page_id, name, blocks}`.
 */
export default function LiveDemo() {
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [demo, setDemo] = useState(null); // {page_id, name, blocks} | null
  const [loaded, setLoaded] = useState(false);

  // Fetch immediately so we can render-or-hide on first paint. Failure
  // of any sort = hide the section, never crash the landing page.
  useEffect(() => {
    let cancelled = false;
    fetch(PUBLIC_DEMO_URL)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d) => {
        if (cancelled) return;
        if (d && d.blocks && d.blocks.length) setDemo(d);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Only mount the iframe once the section is in view (saves the
  // composePage cost + an iframe render on visitors who never scroll
  // that far).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || visible || !demo) return undefined;
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
  }, [visible, demo]);

  const doc = useMemo(() => {
    if (!demo || !demo.blocks?.length) return "";
    return hideHorizontalScroll(previewDoc(composePage(demo.blocks)));
  }, [demo]);

  // Hide the entire section when no featured page is set.
  if (loaded && !demo) return null;

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
            The frame below isn't a screenshot. It's a real page built in
            Design Workshop, running right here. Hover, click, scroll — it
            behaves exactly the same way once you paste it into your own site.
          </p>
          <div className="flex flex-wrap items-center gap-5 mt-6 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <MousePointer2 className="w-3.5 h-3.5 text-[#E01839]" />
              Try clicking around
            </span>
            <span className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-[#E01839]" />
              This is the real export
            </span>
          </div>
        </div>

        <div
          ref={wrapRef}
          data-testid="login-live-demo-frame"
          className="relative rounded-md overflow-hidden border border-white/10 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.4)]"
          style={{ minHeight: "600px" }}
        >
          {/* Browser-chrome top strip */}
          <div className="absolute top-0 inset-x-0 h-7 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 pl-3 z-10 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="ml-3 text-[10px] font-mono text-slate-400 tracking-wider truncate">
              your-site.com / homepage.html
            </span>
          </div>
          {visible && doc ? (
            <iframe
              title={`Design Workshop demo — ${demo?.name || "featured page"}`}
              srcDoc={doc}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              className="block w-full border-0 pt-7"
              style={{ height: "640px" }}
            />
          ) : (
            <div className="h-[640px] flex items-center justify-center text-slate-300 text-sm pt-7">
              Loading live demo…
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
