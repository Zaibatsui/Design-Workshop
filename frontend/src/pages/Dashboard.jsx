import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, FileStack, Palette, BookOpen, Users as UsersIcon, Inbox, MessageSquarePlus, ClipboardList } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { SECTIONS, SECTIONS_BY_ID } from "@/sections/registry";
import { BRAND } from "@/lib/brand";
import SectionsTab from "./dashboard/SectionsTab";
import PagesTab from "./dashboard/PagesTab";
import RecentStrip from "./dashboard/RecentStrip";
import CollectionsBar, { ManageCollectionsDialog } from "./dashboard/CollectionsBar";
import { SectionPicker, Tabs } from "./dashboard/common";
import PageTemplatePicker from "./dashboard/PageTemplatePicker";
import TicketDialog from "@/components/TicketDialog";
import { WhatsNewTrigger } from "@/components/WhatsNewDrawer";
import UserMenu from "@/components/UserMenu";
import StudioToggle from "@/components/studio/StudioToggle";

export default function Dashboard({ chromeless = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("sections");
  const [sections, setSections] = useState([]);
  const [pages, setPages] = useState([]);
  const [collections, setCollections] = useState([]);
  // Active collection filter. `null` = "All items", "__unfiled__" = items
  // with no collection_id, any other string = that collection's id.
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  const [pagePicker, setPagePicker] = useState(false);
  // Ticket dialog state — universal "Report" entry point from the header.
  const [ticketOpen, setTicketOpen] = useState(false);
  // Open-ticket badge count for admins. Refreshed on mount, after the
  // user submits a ticket (in case they're also an admin) and whenever
  // the dialog closes.
  const [openTicketCount, setOpenTicketCount] = useState(0);
  // My-tickets notification badge (visible to every user). Counts
  // their own complete/rejected tickets that haven't been acked yet.
  const [myTicketNotifCount, setMyTicketNotifCount] = useState(0);
  const refreshTicketCount = async () => {
    if (!user?.is_admin) return;
    try {
      const data = await api.ticketCount();
      setOpenTicketCount(data?.unread ?? data?.open ?? 0);
    } catch {
      // best-effort badge; silent on failure so the dashboard isn't disturbed
    }
  };
  const refreshMyTicketNotifs = async () => {
    if (!user?.email) return;
    try {
      const data = await api.myTicketNotifications();
      setMyTicketNotifCount(data?.count ?? 0);
    } catch {
      // best-effort; silent
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [s, p, c] = await Promise.all([
          api.listSections(),
          api.listPages(),
          api.listCollections(),
        ]);
        setSections(s);
        setPages(p);
        setCollections(c);
      } catch {
        toast.error("Could not load your library");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch the open-ticket count once we know whether the signed-in user
  // is an admin (and only then — the endpoint 401s for non-admins).
  useEffect(() => {
    refreshTicketCount();
    refreshMyTicketNotifs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.is_admin, user?.email]);

  const createSection = (typeId) => {
    const def = SECTIONS_BY_ID[typeId];
    if (!def) return;
    setPicker(false);
    // Deferred creation: open a pristine in-memory draft. The DB record is
    // only POSTed when the user makes their first edit. If the user is
    // currently filtering by a real collection, propagate that as a
    // create-time hint so the new section lands inside the user's
    // current "place" instead of falling into Unfiled.
    const params = new URLSearchParams({ type: typeId });
    if (activeCollectionId && activeCollectionId !== "__unfiled__") {
      params.set("collection_id", activeCollectionId);
    }
    navigate(`/edit/section/new?${params.toString()}`);
  };

  const createPage = (template) => {
    setPagePicker(false);
    // Strip non-serializable fields (Lucide icon on built-in templates is
    // a forwardRef and not structured-cloneable for the History API).
    const safe = template
      ? { id: template.id, name: template.name, blocks: template.blocks || [] }
      : null;
    const collectionId =
      activeCollectionId && activeCollectionId !== "__unfiled__"
        ? activeCollectionId
        : null;
    navigate("/edit/page/new", { state: { template: safe, collection_id: collectionId } });
  };

  // Filter helpers — keep the active-collection logic in one place so
  // the two tabs (sections/pages) stay consistent. `__unfiled__` is a
  // synthetic id meaning "any item whose collection_id is null".
  const filterByCollection = (items) => {
    if (activeCollectionId === null) return items;
    if (activeCollectionId === "__unfiled__")
      return items.filter((it) => !it.collection_id);
    return items.filter((it) => it.collection_id === activeCollectionId);
  };
  const filteredSections = filterByCollection(sections);
  const filteredPages = filterByCollection(pages);
  // Counts displayed in the chip row — combined across sections + pages
  // because the bar filters both tabs simultaneously.
  const allItems = [...sections, ...pages];
  const countByCollection = { _all: allItems.length, _unfiled: 0 };
  for (const it of allItems) {
    if (!it.collection_id) countByCollection._unfiled += 1;
    else
      countByCollection[it.collection_id] =
        (countByCollection[it.collection_id] || 0) + 1;
  }

  // Optimistic move: update the item's `collection_id` in local state
  // immediately, then POST. Roll back on failure. The Tabs that own
  // their own derived state still read from `sections` / `pages`, so
  // they re-derive without needing extra wiring.
  const moveItem = async (kind, id, collectionId) => {
    const setter = kind === "section" ? setSections : setPages;
    const idKey = kind === "section" ? "section_id" : "page_id";
    let snapshot;
    setter((arr) => {
      snapshot = arr;
      return arr.map((x) =>
        x[idKey] === id ? { ...x, collection_id: collectionId } : x
      );
    });
    try {
      if (kind === "section")
        await api.moveSectionToCollection(id, collectionId);
      else await api.movePageToCollection(id, collectionId);
    } catch {
      toast.error("Move failed");
      setter(snapshot);
    }
  };

  return (
    <div className={chromeless ? "" : "min-h-screen bg-slate-50"}>
      {!chromeless && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center ${BRAND.iconBoxClass}`}
            >
              <BRAND.Icon className="w-full h-full object-contain" />
            </div>
            <span className="font-heading text-base font-semibold tracking-tight leading-none">
              {BRAND.name}
            </span>
            <span className="hidden md:inline ml-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 leading-none">
              Zaibatsui Labs
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <WhatsNewTrigger />
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/my-tickets")}
              data-testid="open-my-tickets"
              className="text-slate-500 hover:text-slate-900 relative"
            >
              <ClipboardList className="w-4 h-4 mr-1.5" />
              My tickets
              {myTicketNotifCount > 0 && (
                <span
                  data-testid="my-tickets-badge"
                  aria-label={`${myTicketNotifCount} ticket update${
                    myTicketNotifCount === 1 ? "" : "s"
                  }`}
                  className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold bg-[#E01839] text-white leading-none"
                >
                  {myTicketNotifCount > 99 ? "99+" : myTicketNotifCount}
                </span>
              )}
            </Button>
            {user?.is_admin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/tickets")}
                data-testid="open-admin-tickets"
                className="text-slate-500 hover:text-slate-900 relative"
              >
                <Inbox className="w-4 h-4 mr-1.5" />
                Tickets
                {openTicketCount > 0 && (
                  <span
                    data-testid="admin-tickets-badge"
                    aria-label={`${openTicketCount} open ticket${openTicketCount === 1 ? "" : "s"}`}
                    className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold bg-[#E01839] text-white leading-none"
                  >
                    {openTicketCount > 99 ? "99+" : openTicketCount}
                  </span>
                )}
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
            <StudioToggle />
            <UserMenu />
          </div>
        </div>
      </header>
      )}

      <main className={chromeless ? "max-w-7xl mx-auto px-6 py-8" : "max-w-7xl mx-auto px-6 py-10"}>
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

        {!loading && (
          <CollectionsBar
            collections={collections}
            activeId={activeCollectionId}
            onChange={setActiveCollectionId}
            onManage={() => setManageOpen(true)}
            countByCollection={countByCollection}
          />
        )}

        <Tabs
          tab={tab}
          onChange={setTab}
          sections={filteredSections.length}
          pages={filteredPages.length}
        />

        {tab === "sections" ? (
          <SectionsTab
            sections={filteredSections}
            setSections={setSections}
            onCreateClick={() => setPicker(true)}
            loading={loading}
            collections={collections}
            onMove={(id, cid) => moveItem("section", id, cid)}
            onManageCollections={() => setManageOpen(true)}
          />
        ) : (
          <PagesTab
            pages={filteredPages}
            setPages={setPages}
            onCreateClick={() => setPagePicker(true)}
            loading={loading}
            collections={collections}
            onMove={(id, cid) => moveItem("page", id, cid)}
            onManageCollections={() => setManageOpen(true)}
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
        onClose={() => {
          setTicketOpen(false);
          // Refresh in case the user (if admin) just filed one themselves.
          refreshTicketCount();
        }}
      />
      <ManageCollectionsDialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        collections={collections}
        setCollections={setCollections}
        onDirty={() => {
          // If the active chip's underlying collection was deleted,
          // pop the filter back to "All items" so the user isn't
          // staring at an empty view they can't escape.
          if (
            activeCollectionId &&
            activeCollectionId !== "__unfiled__" &&
            !collections.some((c) => c.collection_id === activeCollectionId)
          ) {
            setActiveCollectionId(null);
          }
        }}
      />
      <Toaster richColors position="top-center" />
    </div>
  );
}
