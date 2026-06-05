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
  LogOut,
  MessageSquarePlus,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import StudioToggle from "@/components/studio/StudioToggle";
import TicketDialog from "@/components/TicketDialog";
import { WhatsNewTrigger } from "@/components/WhatsNewDrawer";

const NAV_ITEMS = [
  { id: "sections", label: "Library", icon: LayoutGrid, href: "/", testid: "studio-nav-library" },
  { id: "brand-kit", label: "Brand kit", icon: Palette, href: "/brand", testid: "studio-nav-brand" },
  { id: "tickets", label: "Tickets", icon: ClipboardList, href: "/my-tickets", testid: "studio-nav-tickets" },
  { id: "guide", label: "Guide", icon: BookOpen, href: "/guide", testid: "studio-nav-guide" },
];

const ADMIN_NAV_ITEMS = [
  { id: "admin-tickets", label: "Admin · Tickets", icon: ClipboardList, href: "/admin/tickets", testid: "studio-nav-admin-tickets" },
  { id: "admin-users", label: "Admin · Users", icon: UsersIcon, href: "/admin/users", testid: "studio-nav-admin-users" },
];

export default function StudioShell({ active, children, headerActions = null }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [ticketOpen, setTicketOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Click-outside the user-menu closes it. Keyboard Escape too — Linear
  // habit. Both wired off the same effect so the listeners come on/off
  // together.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isActive = (item) => {
    if (active) return active === item.id;
    return location.pathname === item.href;
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
          {/* User menu */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              data-testid="studio-user-menu"
              className="inline-flex items-center gap-1.5 h-8 pl-1 pr-2 rounded-full hover:bg-zinc-100 transition-colors"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-zinc-200" />
              )}
              <ChevronDown className="w-3 h-3 text-zinc-500" strokeWidth={2} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-9 w-56 bg-white border border-zinc-200 rounded-md shadow-lg py-1.5 z-30"
                data-testid="studio-user-menu-panel"
              >
                <div className="px-3 py-2 border-b border-zinc-100">
                  <div className="text-[12px] font-medium text-zinc-900 truncate">{user?.name}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{user?.email}</div>
                  {user?.is_admin && (
                    <span className="mt-1 inline-block text-[9px] font-bold tracking-[0.1em] uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); logout(); }}
                  data-testid="studio-logout-button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Sign out
                </button>
              </div>
            )}
          </div>
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
                  <span>{item.label}</span>
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
                      <span>{item.label}</span>
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
        onOpenChange={setTicketOpen}
        defaultType="bug"
      />
    </div>
  );
}
