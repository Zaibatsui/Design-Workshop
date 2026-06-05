/**
 * Studio Tickets — chromeless wrapper around the existing AdminTickets
 * / MyTickets pages, both presented inside the Studio shell.
 *
 * Two separate entry points keep the existing routing behaviour:
 *   - `/admin/tickets` → StudioAdminTickets (admin queue)
 *   - `/my-tickets`   → StudioMyTickets    (user's own tickets)
 */
import StudioShell from "@/components/studio/StudioShell";
import AdminTicketsPage from "@/pages/AdminTickets";
import MyTicketsPage from "@/pages/MyTickets";

export function StudioAdminTickets() {
  return (
    <StudioShell active="admin-tickets">
      <AdminTicketsPage chromeless />
    </StudioShell>
  );
}

export function StudioMyTickets() {
  return (
    <StudioShell active="tickets">
      <MyTicketsPage chromeless />
    </StudioShell>
  );
}
