import { createContext, useContext, useEffect, useState, useCallback } from "react";

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
