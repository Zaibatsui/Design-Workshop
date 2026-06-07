/**
 * Studio Admin Users — admin-only user management page, presented
 * inside the Studio shell. Renders the existing AdminUsersPage
 * (chromeless) so the user-list table, status toggles and search
 * filter stay identical to the Classic variant.
 */
import StudioShell from "@/components/studio/StudioShell";
import AdminUsersPage from "@/pages/AdminUsers";

export default function StudioAdminUsers() {
  return (
    <StudioShell active="admin-users">
      <AdminUsersPage chromeless />
    </StudioShell>
  );
}
