/**
 * StudioOrClassic — tiny route-level wrapper that selects between the
 * Classic and Studio React tree based on the current user's `ui_mode`
 * preference. Non-admin users always get Classic (the prototype is
 * admin-only for now).
 *
 * Usage:
 *   <Route path="/edit/section/:id"
 *     element={<StudioOrClassic classic={Editor} studio={StudioEditor} />} />
 *
 * Living at the route level (rather than inside every page) means each
 * page implementation can stay focused on its own layout without
 * branching on `ui_mode` internally. When a page hasn't been built in
 * Studio yet (Phase 1 ships Editor only), pass the same component for
 * both `classic` and `studio` — admins editing those pages just see
 * the Classic version until Phase 2 lands.
 */
import { useAuth } from "@/auth/AuthContext";

export default function StudioOrClassic({ classic: Classic, studio: Studio }) {
  const { user } = useAuth();
  const useStudio = !!(user && user.is_admin && user.ui_mode === "studio");
  if (useStudio && Studio) return <Studio />;
  return <Classic />;
}
