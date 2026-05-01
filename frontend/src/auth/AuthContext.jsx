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
    } catch {
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
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, setUser, checkAuth, logout }}>
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
