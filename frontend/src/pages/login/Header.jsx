import { Button } from "@/components/ui/button";
import { startLogin } from "@/auth/AuthContext";
import { BRAND } from "@/lib/brand";

/**
 * Sticky top navigation for the upgraded login/marketing page.
 * Translucent backdrop so the hero's grid + glow bleeds through.
 */
export default function Header() {
  return (
    <header
      data-testid="login-header"
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <a
          href="#top"
          data-testid="header-brand"
          className="flex items-center gap-2.5 group"
        >
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center ${BRAND.iconBoxClass}`}
          >
            <BRAND.Icon className="w-full h-full object-contain" />
          </div>
          <div className="leading-none">
            <span className="block font-heading text-[15px] font-semibold tracking-tight text-slate-900">
              {BRAND.name}
            </span>
            <span className="block mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Zaibatsui Labs
            </span>
          </div>
        </a>
        <Button
          data-testid="header-signin"
          onClick={startLogin}
          className="h-9 px-4 bg-[#E01839] text-white hover:bg-[#C01430] font-medium rounded-md"
        >
          Sign in
        </Button>
      </div>
    </header>
  );
}
