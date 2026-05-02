import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import Header from "./login/Header";
import Hero from "./login/Hero";
import ValueProps from "./login/ValueProps";
import SectionsShowcase from "./login/SectionsShowcase";
import HowItWorks from "./login/HowItWorks";
import LiveDemo from "./login/LiveDemo";
import FAQ from "./login/FAQ";
import FooterCTA from "./login/FooterCTA";

/**
 * `/login` — gates auth and doubles as the public marketing landing page.
 *
 * Authenticated users get bounced straight to the dashboard. Everyone
 * else lands here, scrolls through the pitch, and signs in via the
 * Google CTAs sprinkled across the page (header, hero, footer).
 */
export default function Login() {
  const { user, loading } = useAuth();
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
