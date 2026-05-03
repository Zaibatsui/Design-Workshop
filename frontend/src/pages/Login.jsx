import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import Header from "./login/Header";
import Hero from "./login/Hero";
import ValueProps from "./login/ValueProps";
import SectionsShowcase from "./login/SectionsShowcase";
import HowItWorks from "./login/HowItWorks";
import LiveDemo from "./login/LiveDemo";
import FAQ from "./login/FAQ";
import FooterCTA from "./login/FooterCTA";

const ERROR_MESSAGES = {
  account_deactivated:
    "This account has been deactivated. Contact the administrator if you believe this is a mistake.",
};

/**
 * `/login` — gates auth and doubles as the public marketing landing page.
 *
 * Authenticated users get bounced straight to the dashboard. Everyone
 * else lands here, scrolls through the pitch, and signs in via the
 * Google CTAs sprinkled across the page (header, hero, footer).
 *
 * The `?error=<code>` query string is set by the OAuth callback when it
 * rejects the login (e.g. account_deactivated) so we can surface a
 * specific toast instead of bouncing the user back to a "you're not
 * signed in" silence.
 */
export default function Login() {
  const { user, loading } = useAuth();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const code = params.get("error");
    if (code && ERROR_MESSAGES[code]) {
      toast.error(ERROR_MESSAGES[code]);
      // Clear the query string so re-entering the page or navigating
      // back doesn't re-fire the toast on every render.
      const next = new URLSearchParams(params);
      next.delete("error");
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div
      data-testid="login-page"
      className="min-h-screen bg-white text-slate-900 antialiased"
    >
      <Header />
      <main>
        <Hero />
        <ValueProps />
        <SectionsShowcase />
        <HowItWorks />
        <LiveDemo />
        <FAQ />
      </main>
      <FooterCTA />
    </div>
  );
}
