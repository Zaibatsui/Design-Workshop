import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startLogin, useAuth } from "@/auth/AuthContext";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(224,24,57,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(99,102,241,0.25) 0%, transparent 45%)",
        }}
      />
      <div className="relative max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#E01839] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight">
            Section Builder
          </span>
        </div>
        <h1 className="text-3xl font-heading font-semibold tracking-tight leading-tight mb-3">
          Build, save and reuse your snippets.
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed mb-8">
          Sign in with Google to access your private library of sections and
          pages — autosaved, always available, never lost.
        </p>
        <Button
          data-testid="login-google"
          onClick={startLogin}
          className="w-full h-11 bg-white text-slate-900 hover:bg-slate-100 font-medium gap-3"
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
