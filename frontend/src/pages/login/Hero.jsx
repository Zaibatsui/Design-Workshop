import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { startLogin } from "@/auth/AuthContext";

/**
 * Hero — left-aligned, dense, editorial. Drives one action: sign in.
 * Subtle grid + radial red glow background for visual depth.
 */
export default function Hero() {
  return (
    <section
      id="top"
      data-testid="login-hero"
      className="relative pt-40 pb-24 md:pt-48 md:pb-32 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.045) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 w-[640px] h-[640px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgba(224,24,57,0.18), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-32 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgba(15,23,42,0.06), transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 md:px-8">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E01839] mb-6">
          Zaibatsui Labs · Design Workshop
        </p>
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tighter text-slate-900 leading-[1.05] max-w-4xl">
          Build e-commerce pages
          <br />
          without the bloat.
        </h1>
        <p className="text-base md:text-lg leading-relaxed text-slate-600 mt-8 max-w-2xl">
          A hybrid section + page editor that ships{" "}
          <span className="text-slate-900 font-medium">
            self-contained HTML / CSS / JS snippets
          </span>{" "}
          you can drop straight into Nettailer or any B2B e-commerce CMS — zero
          runtime libraries, zero framework lock-in, zero render-blocking junk.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-10">
          <Button
            data-testid="login-google"
            onClick={startLogin}
            className="h-12 px-6 bg-[#E01839] text-white hover:bg-[#C01430] font-medium gap-3 rounded-md text-[15px]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#fff"
                opacity="0.95"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.91c1.7-1.57 2.68-3.88 2.68-6.61z"
              />
              <path
                fill="#fff"
                opacity="0.95"
                d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.97v2.33A9 9 0 0 0 9 18zM3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.97A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.04l3-2.33zM9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .97 4.96l3 2.33C4.68 5.16 6.66 3.58 9 3.58z"
              />
            </svg>
            Sign in with Google
          </Button>
          <a
            href="#how-it-works"
            data-testid="hero-secondary-cta"
            className="h-12 inline-flex items-center gap-2 px-5 rounded-md border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 transition-colors font-medium text-[15px]"
          >
            See how it works
            <ArrowDown className="w-4 h-4" />
          </a>
        </div>
        <p className="text-xs text-slate-500 mt-5">
          Free during beta · No card required · We only read your Google name &
          email
        </p>
      </div>
    </section>
  );
}
