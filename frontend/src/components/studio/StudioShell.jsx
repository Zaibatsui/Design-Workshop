/**
 * StudioShell — chrome for the Studio (non-editor) pages: Dashboard,
 * Brand Kit, Tickets.
 *
 * Layout:
 *   ┌───────────────────────────────────────────────────────┐
 *   │  ◆ Design Workshop          ⌘K   What's new   👤 ▾    │  ← top header (h-14)
 *   ├──────────┬────────────────────────────────────────────┤
 *   │  SIDE    │                                            │
 *   │  NAV     │              MAIN CONTENT                  │
 *   │  (w-56)  │       (renders the wrapped page)           │
 *   │          │                                            │
 *   └──────────┴────────────────────────────────────────────┘
 *
 * Each Studio page renders <StudioShell active="…">{...}</StudioShell>
 * and passes its actual content (chromeless mode of the existing page)
 * as children. Keeps every page's data flow untouched — the shell
 * supplies the new chrome, the existing page supplies the body.
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Palette,
  ClipboardList,
  BookOpen,
  Users as UsersIcon,
  MessageSquarePlus,
  Library,
  FileStack,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import StudioToggle from "@/components/studio/StudioToggle";
import OnboardingTour from "@/components/studio/OnboardingTour";
import TicketDialog from "@/components/TicketDialog";
import { WhatsNewTrigger } from "@/components/WhatsNewDrawer";
import UserMenu from "@/components/UserMenu";
import { api } from "@/lib/api";

const NAV_ITEMS = [
  { id: "sections", label: "Library", icon: LayoutGrid, href: "/", testid: "studio-nav-library" },
  { id: "templates", label: "Templates", icon: FileStack, href: "/templates", testid: "studio-nav-templates" },
  { id: "brand-kit", label: "Brand kit", icon: Palette, href: "/brand", testid: "studio-nav-brand" },
  { id: "image-library", label: "Image library", icon: Library, href: "/images", testid: "studio-nav-images" },
  { id: "tickets", label: "Tickets", icon: ClipboardList, href: "/my-tickets", testid: "studio-nav-tickets" },
  { id: "guide", label: "Guide", icon: BookOpen, href: "/guide", testid: "studio-nav-guide" },
];

const ADMIN_NAV_ITEMS = [
  { id: "admin-tickets", label: "Admin · Tickets", icon: ClipboardList, href: "/admin/tickets", testid: "studio-nav-admin-tickets" },
  { id: "admin-users", label: "Admin · Users", icon: UsersIcon, href: "/admin/users", testid: "studio-nav-admin-users" },
];

export default function StudioShell({ active, children, headerActions = null }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [ticketOpen, setTicketOpen] = useState(false);

  // Ticket badge counts:
  //   - myTicketCount: complete/rejected tickets the caller hasn't
  //     acknowledged → red dot next to "Tickets" in the workspace nav.
  //   - openTicketCount: total open tickets across the platform →
  //     red dot next to "Admin · Tickets" (admins only).
  // Both refresh on mount, when the ticket dialog closes (newly filed
  // tickets bump the admin count), and whenever the route changes
  // (visiting /my-tickets POSTs /mine/seen which clears the user
  // badge — we re-fetch so the UI mirrors the server state).
  const [myTicketCount, setMyTicketCount] = useState(0);
  const [openTicketCount, setOpenTicketCount] = useState(0);
  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.myTicketNotifications();
        if (!cancelled) setMyTicketCount(data?.count ?? 0);
      } catch {
        /* best-effort badge */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email, location.pathname, ticketOpen]);
  useEffect(() => {
    if (!user?.is_admin) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.ticketCount();
        if (!cancelled) setOpenTicketCount(data?.open ?? 0);
      } catch {
        /* best-effort badge */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.is_admin, location.pathname, ticketOpen]);

  const isActive = (item) => {
    if (active) return active === item.id;
    return location.pathname === item.href;
  };

  const badgeFor = (id) => {
    if (id === "tickets") return myTicketCount;
    if (id === "admin-tickets") return openTicketCount;
    return 0;
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-50 text-zinc-900"
      style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
      data-testid="studio-shell"
    >
      {/* ── Top header (h-14, slim, single bar) ─────────────────── */}
      <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-zinc-200 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2" data-testid="studio-shell-logo">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${BRAND.iconBoxClass}`}>
            <BRAND.Icon className="w-3.5 h-3.5" />
          </div>
          <span
            className="text-[14px] font-semibold tracking-tight"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {BRAND.name}
          </span>
          <span className="hidden md:inline ml-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Studio
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          {headerActions}
          <WhatsNewTrigger />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTicketOpen(true)}
            data-testid="studio-open-ticket"
            className="h-8 text-[12px] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 gap-1.5 font-medium"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" strokeWidth={1.75} />
            Report
          </Button>
          <div className="h-5 w-px bg-zinc-200 mx-1" />
          <StudioToggle />
          <div className="h-5 w-px bg-zinc-200 mx-1" />
          <UserMenu variant="compact" />
        </div>
      </header>

      {/* ── Sidebar + main ─────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        <aside
          data-testid="studio-shell-sidebar"
          className="w-56 flex-shrink-0 bg-white border-r border-zinc-200 flex flex-col"
        >
          <nav className="p-3 space-y-0.5">
            <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-zinc-400 px-2 mt-1 mb-2">
              Workspace
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isOn = isActive(item);
              const badge = badgeFor(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.href)}
                  data-testid={item.testid}
                  className={`w-full flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[12.5px] font-medium transition-colors ${
                    isOn
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={isOn ? 2 : 1.75} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge > 0 && (
                    <span
                      data-testid={`${item.testid}-badge`}
                      className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold tracking-tight bg-[#E01839] text-white rounded-full"
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </button>
              );
            })}
            {user?.is_admin && (
              <>
                <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-zinc-400 px-2 mt-5 mb-2">
                  Admin
                </p>
                {ADMIN_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isOn = isActive(item);
                  const badge = badgeFor(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.href)}
                      data-testid={item.testid}
                      className={`w-full flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[12.5px] font-medium transition-colors ${
                        isOn
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={isOn ? 2 : 1.75} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {badge > 0 && (
                        <span
                          data-testid={`${item.testid}-badge`}
                          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold tracking-tight bg-[#E01839] text-white rounded-full"
                        >
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto" data-testid="studio-shell-main">
          {children}
        </main>
      </div>

      <TicketDialog
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        defaultType="bug"
      />
      <OnboardingTour />
    </div>
  );
}
