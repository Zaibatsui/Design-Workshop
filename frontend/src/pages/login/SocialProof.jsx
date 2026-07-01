import { useEffect, useMemo, useState } from "react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { previewDoc, makeUid } from "@/sections/shared";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PUBLIC_URL = `${BACKEND_URL}/api/public/landing-social-proof`;

/**
 * SocialProof — admin-curated testimonials / logo strip / stat counter
 * band on the public marketing landing page.
 *
 * Unlike SectionSpotlights, there is no hand-rolled fallback: this band
 * makes a claim about real users, so with nothing curated it renders
 * `null` and the section simply doesn't exist on the page. That's the
 * intended behaviour for a startup with only a few beta testers today —
 * flip it on later from Brand Kit → Landing social proof once there's
 * real material, no code change required.
 *
 * Rendered full-bleed and un-tilted (unlike the Spotlight cards) since
 * this is presented as real content, not an illustrative example.
 *
 * Frame height is admin-set per slot (Brand Kit → Landing social proof)
 * rather than guessed from the section type — a logo marquee and a
 * testimonials carousel don't want the same height, and the admin can
 * see exactly what fits once real content is in there.
 */
// The outer <iframe>'s own `overflow` CSS (set from the parent document)
// only affects how the iframe's *box* lays out — it does nothing to the
// scrollbars the iframe renders for its *own* document when that
// document's content is wider than the frame. Suppressing those means
// reaching into the srcDoc itself, which we control here, rather than
// touching the shared `previewDoc()` (also used by the live page editor
// canvas, where horizontal scroll may be legitimate).
function hideHorizontalScroll(doc) {
  return doc.replace(
    "</head>",
    "<style>html,body{overflow-x:hidden}</style></head>"
  );
}

function renderPicked(item) {
  if (!item) return null;
  const def = SECTIONS_BY_ID[item.type];
  if (!def || typeof def.render !== "function") return null;
  const cfg = { ...item.config, uid: makeUid() };
  let html;
  try {
    html = def.render(cfg);
  } catch {
    return null;
  }
  return {
    name: item.name,
    doc: hideHorizontalScroll(previewDoc(html)),
    height: item.height,
  };
}

export default function SocialProof() {
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

  const items = useMemo(
    () => (picks || []).map(renderPicked).filter(Boolean),
    [picks]
  );

  if (picks == null || items.length === 0) return null;

  return (
    <section
      data-testid="login-social-proof"
      className="py-20 md:py-24 bg-slate-50 border-y border-slate-100"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 space-y-14">
        {items.map((item, i) => (
          <div
            key={i}
            data-testid={`login-social-proof-${i}`}
            className="rounded-md overflow-hidden bg-white border border-slate-200 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.25)]"
          >
            <iframe
              title={item.name || `Social proof ${i + 1}`}
              srcDoc={item.doc}
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
              className="block w-full border-0"
              style={{ height: `${item.height}px` }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
