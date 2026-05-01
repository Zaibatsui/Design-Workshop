import { Button } from "@/components/ui/button";
import { startLogin, useAuth } from "@/auth/AuthContext";
import { Navigate } from "react-router-dom";
import { BRAND } from "@/lib/brand";

export default function Login() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background grid + soft red glow — matches dashboard light theme */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgba(224,24,57,0.12), transparent)",
        }}
      />
      <div
        className="absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgba(15,23,42,0.08), transparent)",
        }}
      />

      <div className="relative max-w-md w-full bg-white border border-slate-200 rounded-2xl p-10 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)]">
        <div className="flex items-center gap-2 mb-8">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${BRAND.iconBoxClass}`}
          >
            <BRAND.Icon className="w-4 h-4" />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight text-slate-900">
            {BRAND.name}
          </span>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Zaibatsui Labs
          </span>
        </div>
        <h1 className="text-3xl font-heading font-semibold tracking-tight leading-tight mb-3 text-slate-900">
          Build, save and reuse your snippets.
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          Sign in with Google to access your private library of sections and
          pages — autosaved, always available, never lost.
        </p>
        <Button
          data-testid="login-google"
          onClick={startLogin}
          className="w-full h-11 bg-slate-900 text-white hover:bg-black font-medium gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.91c1.7-1.57 2.68-3.88 2.68-6.61z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.97v2.33A9 9 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.97A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.04l3-2.33z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .97 4.96l3 2.33C4.68 5.16 6.66 3.58 9 3.58z"
            />
          </svg>
          Sign in with Google
        </Button>
        <p className="text-xs text-slate-500 mt-6 text-center">
          By continuing you agree to the terms. We only use your Google profile
          to identify your account — no posting, no scopes beyond email + name.
        </p>
      </div>
    </div>
  );
}
