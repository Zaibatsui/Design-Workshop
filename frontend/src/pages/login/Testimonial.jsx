import { Quote } from "lucide-react";

const PORTRAIT_URL =
  "https://images.unsplash.com/photo-1737660213008-f5ae44b492da?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBJVCUyMG5ldHdvcmslMjBlbmdpbmVlciUyMHBvcnRyYWl0fGVufDB8fHx8MTc3Nzc0NDAwM3ww&ixlib=rb-4.1.0&q=85";

/**
 * Dark social-proof slab. Sits between the workflow strip and the FAQ
 * to break tonal monotony and remind readers this is a B2B tool.
 */
export default function Testimonial() {
  return (
    <section
      data-testid="login-testimonial"
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
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16 items-center">
        <div>
          <Quote className="w-8 h-8 text-[#E01839] mb-7" strokeWidth={2.5} />
          <blockquote className="font-heading text-2xl md:text-3xl font-medium tracking-tight text-white leading-tight">
            "Design Workshop produces clean, runtime-free HTML we can drop
            straight into our Nettailer platforms. No dependencies, no slow
            loading. We replaced a tangle of bespoke landing-page hacks with
            this one tool."
          </blockquote>
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
            <div>
              <p className="text-sm font-semibold text-white tracking-tight">
                Lars E.
              </p>
              <p className="text-xs text-slate-400 mt-0.5 tracking-wide">
                E-commerce Tech Lead · IT Reseller
              </p>
            </div>
          </div>
        </div>
        <div className="relative aspect-[3/4] rounded-md overflow-hidden border border-white/10 hidden lg:block">
          <img
            src={PORTRAIT_URL}
            alt="A B2B e-commerce engineer at their workstation"
            className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}
