import { Button } from "@/components/ui/button";
import { startLogin } from "@/auth/AuthContext";
import { BRAND } from "@/lib/brand";

export default function FooterCTA() {
  const year = new Date().getFullYear();
  return (
    <footer
      data-testid="login-footer"
      className="border-t border-slate-200 bg-white"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-24 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-tight max-w-2xl mx-auto">
          Build your first section in five minutes.
        </h2>
        <p className="text-base leading-relaxed text-slate-600 mt-5 max-w-xl mx-auto">
          Sign in with Google and have something polished to copy into your
          site in less time than it takes to make coffee.
        </p>
        <div className="mt-9 flex justify-center">
          <Button
            data-testid="login-google-footer"
            onClick={startLogin}
            className="h-12 px-7 bg-[#E01839] text-white hover:bg-[#C01430] font-medium gap-3 rounded-md text-[15px]"
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
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div
              className={`w-5 h-5 rounded-sm flex items-center justify-center ${BRAND.iconBoxClass}`}
            >
              <BRAND.Icon className="w-full h-full object-contain" />
            </div>
            <span className="tracking-tight">
              {BRAND.name} · A Zaibatsui Labs project
            </span>
          </div>
          <p className="tracking-tight">© {year} Zaibatsui Labs</p>
        </div>
      </div>
    </footer>
  );
}
