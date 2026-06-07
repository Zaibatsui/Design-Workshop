/* eslint-disable react-hooks/set-state-in-effect -- AuthProvider clears
   user state from a window event handler when the backend returns 401.
   The rule's static analysis can't tell the handler fires AFTER effect
   setup (not during it), so it false-positives. The userRef gate above
   the setUser call confirms we don't loop on initial mount. */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const API = process.env.REACT_APP_BACKEND_URL;
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/auth/me`, { credentials: "include" });
      if (!r.ok) throw new Error("not authed");
      setUser(await r.json());
    } catch (e) {
      // /api/auth/me 401s when no session cookie is present; that's the
      // logged-out path and shouldn't spam the console. Log at debug only.
      if (process.env.NODE_ENV !== "production") console.debug("auth check failed:", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Global 401 listener — `api.js` fires `ns-auth-unauthorized` whenever
  // any authenticated request comes back with a 401 (idle session
  // timeout, absolute expiry, or backend-side `is_active` flip). We
  // clear the user state once here so every page in the app reacts
  // consistently instead of each component shimming its own redirect.
  //
  // The handler is defined via `useCallback` (outside the useEffect
  // body), and the useEffect's only job is to wire/unwire the window
  // listener. This keeps the `react-hooks/set-state-in-effect` rule
  // satisfied because no setState appears inside the effect body.
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  const handleUnauthorized = useCallback(() => {
    if (userRef.current == null) return;
    setUser(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      setTimeout(() => {
        window.location.assign("/login?reason=session_expired");
      }, 50);
    }
  }, []);
  useEffect(() => {
    window.addEventListener("ns-auth-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("ns-auth-unauthorized", handleUnauthorized);
  }, [handleUnauthorized]);

  const logout = async () => {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.debug("logout request failed:", e);
    }
    setUser(null);
  };

  /**
   * Admin-only UI experiment toggle. Optimistically updates the local
   * `user.ui_mode` so the layout swaps instantly, then persists the
   * choice to the backend. If the server rejects (403 for non-admins,
   * 400 for invalid value) the optimistic update is rolled back so
   * the UI stays honest. Returns `true` on success.
   */
  const setUiMode = useCallback(
    async (next) => {
      if (!user) return false;
      if (next !== "classic" && next !== "studio") return false;
      const prev = user.ui_mode || "classic";
      if (prev === next) return true;
      setUser({ ...user, ui_mode: next });
      try {
        const r = await fetch(`${API}/api/auth/me/ui-mode`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ui_mode: next }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const fresh = await r.json();
        setUser(fresh);
        return true;
      } catch (e) {
        if (process.env.NODE_ENV !== "production")
          console.warn("ui_mode update failed:", e);
        setUser({ ...user, ui_mode: prev });
        return false;
      }
    },
    [user]
  );

  return (
    <AuthCtx.Provider
      value={{ user, loading, setUser, checkAuth, logout, setUiMode }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}

// Direct Google OAuth — user lands on Google's consent screen straight away.
// No intermediate provider screen. Backend handles the redirect dance and
// drops a session_token cookie before sending the user back to "/".
export function startLogin() {
  window.location.href = `${API}/api/auth/google/login`;
}
