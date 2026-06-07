/**
 * StudioOrClassic — tiny route-level wrapper that selects between the
 * Classic and Studio React tree based on the current user's `ui_mode`
 * preference.
 *
 * Studio is the **default UI** for every signed-in user (new accounts
 * land in Studio automatically; existing users keep whatever
 * preference they've persisted via the header toggle). Classic
 * remains available as an explicit opt-out for users who prefer the
 * original layout — both modes are first-class.
 *
 * Usage:
 *   <Route path="/edit/section/:id"
 *     element={<StudioOrClassic classic={Editor} studio={StudioEditor} />} />
 *
 * Living at the route level (rather than inside every page) means each
 * page implementation can stay focused on its own layout without
 * branching on `ui_mode` internally. When a page hasn't been built in
 * Studio yet, pass the same component for both `classic` and
 * `studio` — users editing those pages just see the Classic version
 * until the Studio variant lands.
 */
import { useAuth } from "@/auth/AuthContext";

export default function StudioOrClassic({ classic: Classic, studio: Studio }) {
  const { user } = useAuth();
  // Default to Studio when ui_mode is unset (new accounts) or set to
  // "studio". Classic is the explicit opt-out path.
  const mode = user?.ui_mode || "studio";
  const useStudio = mode === "studio";
  if (useStudio && Studio) return <Studio />;
  return <Classic />;
}
