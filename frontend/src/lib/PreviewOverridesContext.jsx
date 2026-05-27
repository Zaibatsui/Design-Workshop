/**
 * PreviewOverridesContext — fetches the admin-curated section preview
 * overrides on mount and exposes a `{section_type → {type, config}}`
 * map to the rest of the app.
 *
 * Used by `SectionPreviewPopover` to pick the snippet config when
 * rendering the hover thumbnail:
 *   1. If an override exists for the section type → render that
 *      admin-curated config (the admin's choice is the truth).
 *   2. Otherwise → fall back to `section.defaults()`, optionally
 *      overlaid with the current user's brand kit.
 *
 * The endpoint (`GET /api/public/preview-overrides`) is unauth so the
 * marketing landing page can resolve overrides too — keeps every
 * surface visually consistent. On network failures we silently fall
 * back to an empty map (i.e. defaults everywhere) so a flaky backend
 * never breaks the picker.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/lib/api";

const Ctx = createContext({
  overrides: {},
  loaded: false,
  refresh: async () => {},
});

export function PreviewOverridesProvider({ children }) {
  const [overrides, setOverrides] = useState({});
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const map = await api.getPublicPreviewOverrides();
      setOverrides(map || {});
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("Preview overrides fetch fell back to {}:", e);
      }
      setOverrides({});
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ overrides, loaded, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePreviewOverrides() {
  return useContext(Ctx);
}
