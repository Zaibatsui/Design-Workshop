import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/lib/api";
import { DEFAULT_BRAND_KIT } from "@/lib/brandKit";

/**
 * BrandKitContext — fetches the user's brand kit on mount and exposes it
 * + a setter to children. Used by Dashboard, Editor, and PageEditor to
 * stamp brand colors/fonts onto newly created sections.
 *
 * The fetch is lazy-best-effort: until it resolves, consumers see the
 * default kit. Failed fetches (e.g. 401 on /login) silently fall back to
 * defaults; the page still works without a kit.
 */
const BrandKitContext = createContext({
  brandKit: DEFAULT_BRAND_KIT,
  loaded: false,
  setBrandKit: () => {},
  refresh: async () => {},
});

export function BrandKitProvider({ children }) {
  const [brandKit, setBrandKit] = useState(DEFAULT_BRAND_KIT);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const k = await api.getBrandKit();
      setBrandKit({ ...DEFAULT_BRAND_KIT, ...k });
    } catch {
      // Auth-protected endpoint — silently fall back to defaults.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BrandKitContext.Provider
      value={{ brandKit, loaded, setBrandKit, refresh }}
    >
      {children}
    </BrandKitContext.Provider>
  );
}

export function useBrandKit() {
  return useContext(BrandKitContext);
}
