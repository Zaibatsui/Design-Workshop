import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const fragment = location.hash || window.location.hash;
    const m = fragment.match(/session_id=([^&]+)/);
    if (!m) {
      navigate("/", { replace: true });
      return;
    }
    const sessionId = decodeURIComponent(m[1]);

    (async () => {
      try {
        const r = await fetch(`${API}/api/auth/session`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (!r.ok) throw new Error("session exchange failed");
        const u = await r.json();
        setUser(u);
        // Strip the hash and go to dashboard
        navigate("/", { replace: true, state: { user: u } });
      } catch (e) {
        navigate("/login", { replace: true });
      }
    })();
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-sm text-slate-500">Signing you in…</div>
    </div>
  );
}
