import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, FileStack, Palette, BookOpen, Users as UsersIcon, Inbox, MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { SECTIONS, SECTIONS_BY_ID } from "@/sections/registry";
import { BRAND } from "@/lib/brand";
import SectionsTab from "./dashboard/SectionsTab";
import PagesTab from "./dashboard/PagesTab";
import RecentStrip from "./dashboard/RecentStrip";
import { SectionPicker, Tabs } from "./dashboard/common";
import PageTemplatePicker from "./dashboard/PageTemplatePicker";
import TicketDialog from "@/components/TicketDialog";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("sections");
  const [sections, setSections] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  const [pagePicker, setPagePicker] = useState(false);
  // Ticket dialog state — universal "Report" entry point from the header.
  const [ticketOpen, setTicketOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([api.listSections(), api.listPages()]);
        setSections(s);
        setPages(p);
      } catch {
        toast.error("Could not load your library");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createSection = (typeId) => {
    const def = SECTIONS_BY_ID[typeId];
    if (!def) return;
    setPicker(false);
    // Deferred creation: open a pristine in-memory draft. The DB record is
    // only POSTed when the user makes their first edit.
    navigate(`/edit/section/new?type=${encodeURIComponent(typeId)}`);
  };

  const createPage = (template) => {
    setPagePicker(false);
    // Strip non-serializable fields (Lucide icon on built-in templates is
    // a forwardRef and not structured-cloneable for the History API).
    const safe = template
      ? { id: template.id, name: template.name, blocks: template.blocks || [] }
      : null;
    navigate("/edit/page/new", { state: { template: safe } });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center ${BRAND.iconBoxClass}`}
            >
              <BRAND.Icon className="w-4 h-4" />
            </div>
            <span className="font-heading text-base font-semibold tracking-tight leading-none">
              {BRAND.name}
            </span>
            <span className="hidden md:inline ml-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 leading-none">
              Zaibatsui Labs
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/guide")}
              data-testid="open-user-guide"
              className="text-slate-500 hover:text-slate-900"
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              Guide
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTicketOpen(true)}
              data-testid="open-ticket-dialog"
              className="text-slate-500 hover:text-slate-900"
            >
              <MessageSquarePlus className="w-4 h-4 mr-1.5" />
              Report
            </Button>
            {user?.is_admin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/tickets")}
                data-testid="open-admin-tickets"
                className="text-slate-500 hover:text-slate-900"
              >
                <Inbox className="w-4 h-4 mr-1.5" />
                Tickets
              </Button>
            )}
            {user?.is_admin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/users")}
                data-testid="open-admin-users"
                className="text-slate-500 hover:text-slate-900"
              >
                <UsersIcon className="w-4 h-4 mr-1.5" />
                Users
              </Button>
            )}
            {user?.picture ? (
              <img
                src={user.picture}
                alt=""
                className="w-8 h-8 rounded-full border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200" />
            )}
            <span className="text-sm text-slate-700 hidden md:inline">
              {user?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              data-testid="logout-button"
              className="text-slate-500 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Your library
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {tab === "sections"
                ? `${sections.length} section${sections.length === 1 ? "" : "s"}`
                : `${pages.length} page${pages.length === 1 ? "" : "s"}`}{" "}
              · everything autosaves while you edit · drag cards to reorder
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              data-testid="brand-kit-link"
              onClick={() => navigate("/brand")}
              className="font-medium"
            >
              <Palette className="w-4 h-4 mr-1.5" />
              Brand kit
            </Button>
            <Button
              data-testid="new-section-button"
              onClick={() => setPicker(true)}
              className="bg-[#E01839] hover:bg-[#c01530] text-white font-medium"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New section
            </Button>
            <Button
              variant="outline"
              onClick={() => setPagePicker(true)}
              data-testid="new-page-button"
              className="font-medium"
            >
              <FileStack className="w-4 h-4 mr-1.5" />
              New page
            </Button>
          </div>
        </div>

        {!loading && <RecentStrip sections={sections} pages={pages} />}

        <Tabs
          tab={tab}
          onChange={setTab}
          sections={sections.length}
          pages={pages.length}
        />

        {tab === "sections" ? (
          <SectionsTab
            sections={sections}
            setSections={setSections}
            onCreateClick={() => setPicker(true)}
            loading={loading}
          />
        ) : (
          <PagesTab
            pages={pages}
            setPages={setPages}
            onCreateClick={() => setPagePicker(true)}
            loading={loading}
          />
        )}
      </main>

      {picker && (
        <SectionPicker
          sections={SECTIONS}
          onPick={createSection}
          onClose={() => setPicker(false)}
        />
      )}
      {pagePicker && (
        <PageTemplatePicker
          onPick={createPage}
          onClose={() => setPagePicker(false)}
        />
      )}
      <TicketDialog
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
      />
      <Toaster richColors position="top-center" />
    </div>
  );
}
