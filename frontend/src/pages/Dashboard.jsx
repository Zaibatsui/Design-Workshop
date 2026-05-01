import { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  LogOut,
  FileStack,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { SECTIONS, SECTIONS_BY_ID } from "@/sections/registry";
import { previewDoc, makeUid } from "@/sections/shared";
import { composePage } from "@/sections/pageSnippet";
import { BRAND } from "@/lib/brand";

const PAGE_SIZE = 9;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("sections"); // sections | pages
  const [sections, setSections] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  const [sectionsPage, setSectionsPage] = useState(1);
  const [pagesPage, setPagesPage] = useState(1);

  const items = tab === "sections" ? sections : pages;
  const currentPage = tab === "sections" ? sectionsPage : pagesPage;
  const setCurrentPage = tab === "sections" ? setSectionsPage : setPagesPage;
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems = useMemo(
    () =>
      items.slice(
        (currentPage - 1) * PAGE_SIZE,
        (currentPage - 1) * PAGE_SIZE + PAGE_SIZE
      ),
    [items, currentPage]
  );
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages, setCurrentPage]);

  const load = async () => {
    try {
      const [s, p] = await Promise.all([api.listSections(), api.listPages()]);
      setSections(s);
      setPages(p);
    } catch {
      toast.error("Could not load your library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createSection = async (typeId) => {
    const def = SECTIONS_BY_ID[typeId];
    if (!def) return;
    try {
      const created = await api.createSection({
        name: `New ${def.name}`,
        type: typeId,
        config: def.defaults(),
      });
      setPicker(false);
      navigate(`/edit/section/${created.section_id}`);
    } catch {
      toast.error("Could not create section");
    }
  };

  const createPage = async () => {
    try {
      const created = await api.createPage({
        name: "Untitled page",
        blocks: [],
      });
      navigate(`/edit/page/${created.page_id}`);
    } catch {
      toast.error("Could not create page");
    }
  };

  const removeSection = async (id) => {
    if (!window.confirm("Delete this section permanently?")) return;
    try {
      await api.deleteSection(id);
      setSections((s) => s.filter((x) => x.section_id !== id));
      toast.success("Section deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const removePage = async (id) => {
    if (!window.confirm("Delete this page permanently?")) return;
    try {
      await api.deletePage(id);
      setPages((p) => p.filter((x) => x.page_id !== id));
      toast.success("Page deleted");
    } catch {
      toast.error("Delete failed");
    }
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
              · everything autosaves while you edit
            </p>
          </div>
          <div className="flex gap-2">
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
              onClick={createPage}
              data-testid="new-page-button"
              className="font-medium"
            >
              <FileStack className="w-4 h-4 mr-1.5" />
              New page
            </Button>
          </div>
        </div>

        <Tabs tab={tab} onChange={setTab} sections={sections.length} pages={pages.length} />

        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : items.length === 0 ? (
          tab === "sections" ? (
            <EmptyState
              title="Nothing here yet"
              body="Create your first section — pick a type, customise it, and copy the snippet into your CMS. Everything autosaves."
              ctaLabel="Create your first section"
              onCreate={() => setPicker(true)}
              testId="empty-create-button"
            />
          ) : (
            <EmptyState
              title="No pages yet"
              body="Build multi-section pages by stacking library sections or fresh blocks, with rich text in between. Export as one self-contained HTML snippet."
              ctaLabel="Create your first page"
              onCreate={createPage}
              testId="empty-create-page-button"
              icon={FileStack}
            />
          )
        ) : tab === "sections" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pagedItems.map((s) => (
              <SectionCard
                key={s.section_id}
                section={s}
                onDelete={() => removeSection(s.section_id)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pagedItems.map((p) => (
              <PageCard
                key={p.page_id}
                page={p}
                onDelete={() => removePage(p.page_id)}
              />
            ))}
          </div>
        )}

        {items.length > PAGE_SIZE && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
            total={items.length}
          />
        )}
      </main>

      {picker && (
        <SectionPicker onPick={createSection} onClose={() => setPicker(false)} />
      )}
      <Toaster richColors position="top-center" />
    </div>
  );
}

function Tabs({ tab, onChange, sections, pages }) {
  const items = [
    { id: "sections", label: "Sections", count: sections },
    { id: "pages", label: "Pages", count: pages },
  ];
  return (
    <div className="border-b border-slate-200 mb-6" data-testid="dashboard-tabs">
      <div className="flex gap-6">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            data-testid={`tab-${it.id}`}
            className={`relative pb-3 text-sm font-medium transition-colors ${
              tab === it.id
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {it.label}
            <span className="ml-2 text-xs text-slate-400 font-normal">
              {it.count}
            </span>
            {tab === it.id && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#E01839] rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Internal iframe canvas size — every preview renders at this fixed virtual width
// so content layout matches what users see in the editor. The scale wrapper below
// shrinks the iframe to fit each card's responsive width while keeping the card
// height uniform across the grid.
const PREVIEW_INTERNAL_WIDTH = 1280;
const PREVIEW_INTERNAL_HEIGHT = 720; // 16:9 — uniform for all section types

function SectionCard({ section, onDelete }) {
  const def = SECTIONS_BY_ID[section.type];
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / PREVIEW_INTERNAL_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!def) return null;
  const Icon = def.icon || Layers;
  const previewSnippet = def.render({ ...section.config, uid: makeUid() });
  const doc = previewDoc(previewSnippet);
  const updated = new Date(section.updated_at);

  return (
    <div
      data-testid={`section-card-${section.section_id}`}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all flex flex-col"
    >
      <Link
        ref={wrapRef}
        to={`/edit/section/${section.section_id}`}
        className="block bg-slate-100 overflow-hidden relative w-full"
        style={{ aspectRatio: "20 / 9" }}
      >
        <iframe
          title={section.name}
          srcDoc={doc}
          sandbox="allow-scripts allow-same-origin"
          className="border-0 pointer-events-none block absolute top-0 left-0"
          style={{
            width: `${PREVIEW_INTERNAL_WIDTH}px`,
            height: `${PREVIEW_INTERNAL_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
      <div className="p-4 flex items-center justify-between gap-3 flex-1">
        <Link
          to={`/edit/section/${section.section_id}`}
          className="min-w-0 flex-1"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <Icon className="w-3 h-3" />
            {def.name}
          </div>
          <p
            className="text-sm font-medium text-slate-900 truncate"
            data-testid="section-card-name"
          >
            {section.name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Edited {timeAgo(updated)}
          </p>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          data-testid={`delete-${section.section_id}`}
          className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PageCard({ page, onDelete }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / PREVIEW_INTERNAL_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const snippet = useMemo(() => composePage(page.blocks || []), [page.blocks]);
  const doc = previewDoc(snippet);
  const updated = new Date(page.updated_at);
  const blockCount = (page.blocks || []).length;

  return (
    <div
      data-testid={`page-card-${page.page_id}`}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all flex flex-col"
    >
      <Link
        ref={wrapRef}
        to={`/edit/page/${page.page_id}`}
        className="block bg-slate-100 overflow-hidden relative w-full"
        style={{ aspectRatio: "20 / 9" }}
      >
        {blockCount > 0 ? (
          <iframe
            title={page.name}
            srcDoc={doc}
            sandbox="allow-scripts allow-same-origin"
            className="border-0 pointer-events-none block absolute top-0 left-0"
            style={{
              width: `${PREVIEW_INTERNAL_WIDTH}px`,
              height: `${PREVIEW_INTERNAL_HEIGHT}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
            <FileStack className="w-6 h-6" />
            <span className="text-xs font-medium">Empty page</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
      <div className="p-4 flex items-center justify-between gap-3 flex-1">
        <Link to={`/edit/page/${page.page_id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <FileStack className="w-3 h-3" />
            Page · {blockCount} block{blockCount === 1 ? "" : "s"}
          </div>
          <p
            className="text-sm font-medium text-slate-900 truncate"
            data-testid="page-card-name"
          >
            {page.name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Edited {timeAgo(updated)}
          </p>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          data-testid={`delete-page-${page.page_id}`}
          className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ title, body, ctaLabel, onCreate, testId, icon: Icon = Layers }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 py-20 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <h2 className="font-heading text-lg font-semibold mb-2">{title}</h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">{body}</p>
      <Button
        onClick={onCreate}
        className="bg-[#E01839] hover:bg-[#c01530] text-white font-medium"
        data-testid={testId}
      >
        <Plus className="w-4 h-4 mr-1.5" />
        {ctaLabel}
      </Button>
    </div>
  );
}

function SectionPicker({ onPick, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="section-picker"
      >
        <h2 className="font-heading text-xl font-semibold tracking-tight mb-1">
          Choose a section type
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          You can always change settings inside the editor.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                data-testid={`picker-${s.id}`}
                onClick={() => onPick(s.id)}
                className="text-left p-4 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
              >
                <Icon className="w-5 h-5 text-[#E01839] mb-2" />
                <p className="text-sm font-medium text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {s.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange, total }) {
  const pages = [];
  const add = (n) => pages.push(n);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i);
  } else {
    add(1);
    if (page > 3) add("…l");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      add(i);
    }
    if (page < totalPages - 2) add("…r");
    add(totalPages);
  }

  const startIdx = (page - 1) * 9 + 1;
  const endIdx = Math.min(total, page * 9);

  return (
    <div
      className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      data-testid="pagination"
    >
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{startIdx}</span>–
        <span className="font-medium text-slate-700">{endIdx}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          data-testid="pagination-prev"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          typeof p === "number" ? (
            <button
              key={`p-${p}`}
              type="button"
              data-testid={`pagination-page-${p}`}
              onClick={() => onChange(p)}
              className={`min-w-9 h-9 px-3 rounded-md text-sm font-medium transition-colors ${
                p === page
                  ? "bg-[#E01839] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          ) : (
            <span
              key={`gap-${i}`}
              className="px-2 text-slate-400 select-none"
              aria-hidden="true"
            >
              …
            </span>
          )
        )}
        <button
          type="button"
          data-testid="pagination-next"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function timeAgo(date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 86400 * 30) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}
