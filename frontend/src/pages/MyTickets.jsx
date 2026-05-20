import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  Trash2,
  RefreshCcw,
  Search,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Status pill — read-only here. Admin's view exposes these via action
// buttons; the reporter only ever sees the resulting label.
function StatusBadge({ status }) {
  const map = {
    open: { label: "Open", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    complete: {
      label: "Complete",
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-slate-200 text-slate-700 border-slate-300",
    },
  };
  const m = map[status] || map.open;
  return (
    <span
      data-testid={`ticket-status-${status}`}
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

/**
 * MyTickets — every signed-in user's view of the bugs / feature
 * requests they themselves have filed. Mirrors AdminTickets visually
 * but strips the admin-only Complete / Reopen / Reject buttons —
 * status is render-only here. The Delete button soft-hides the
 * ticket for the reporter; the backend hard-deletes once admin has
 * also hidden it.
 *
 * On mount we POST /tickets/mine/seen to clear the header's
 * notification badge, so the dot only re-appears next time admin
 * flips a status.
 */
export default function MyTicketsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await api.listMyTickets();
      setRows(data);
      // Clear the unread flag for everything we just fetched. We do
      // this fire-and-forget — a failure here only means the badge
      // sticks around for one more refresh, no data loss.
      api.markMyTicketsSeen().catch(() => {});
    } catch (e) {
      toast.error("Failed to load your tickets", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDelete = async (row) => {
    const ok = window.confirm(
      `Remove this ticket from your list?\n\n"${row.title}"`
    );
    if (!ok) return;
    setPendingId(row.id);
    try {
      await api.deleteTicket(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast.success("Removed from your list");
    } catch (e) {
      toast.error("Delete failed", { description: e.message });
    } finally {
      setPendingId(null);
    }
  };

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)
      )
    : rows;

  const counts = rows.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { open: 0, complete: 0, rejected: 0 }
  );

  return (
    <div className="min-h-screen bg-slate-50" data-testid="my-tickets-page">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-4">
          <Link
            to="/"
            data-testid="my-tickets-back"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={loading}
              data-testid="my-tickets-refresh"
            >
              <RefreshCcw
                className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-8 py-10">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E01839] mb-3">
            Your tickets
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900 mb-2">
            Bug reports &amp; feature requests
          </h1>
          <p className="text-sm text-slate-500">
            {counts.open} open · {counts.complete} complete · {counts.rejected}{" "}
            rejected · {rows.length} total
          </p>
        </div>

        <div className="mb-5 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search title or description…"
            className="pl-9"
            data-testid="my-tickets-search"
          />
        </div>

        {loading ? (
          <div className="text-sm text-slate-500 py-12 text-center">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-16 text-slate-400"
            data-testid="my-tickets-empty"
          >
            <Inbox className="w-10 h-10" />
            <p className="text-sm">
              {rows.length === 0
                ? "You haven't filed any tickets yet"
                : "No matches for your search"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((row) => {
              const TypeIcon = row.type === "feature" ? Lightbulb : Bug;
              const dim = row.status !== "open";
              return (
                <div
                  key={row.id}
                  data-testid={`my-ticket-row-${row.id}`}
                  className={`bg-white border rounded-lg p-5 transition-opacity ${
                    dim ? "opacity-75 border-slate-200" : "border-slate-200"
                  } ${row.unread ? "ring-2 ring-[#E01839]/30" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                          row.type === "feature"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`font-medium text-slate-900 leading-snug break-words ${
                              row.status === "complete" ? "line-through" : ""
                            }`}
                          >
                            {row.title}
                          </h3>
                          <StatusBadge status={row.status} />
                          {row.unread && (
                            <span
                              data-testid={`my-ticket-unread-${row.id}`}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#E01839] text-white"
                            >
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {row.type === "feature"
                            ? "Feature request"
                            : "Bug report"}
                          {" · Filed "}
                          {fmtDate(row.created_at)}
                          {row.updated_at &&
                            row.updated_at !== row.created_at && (
                              <>
                                {" · Updated "}
                                {fmtDate(row.updated_at)}
                              </>
                            )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(row)}
                        disabled={pendingId === row.id}
                        data-testid={`my-ticket-delete-${row.id}`}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        aria-label="Remove from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed pl-11">
                    {row.description}
                  </p>
                  {row.screenshots && row.screenshots.length > 0 && (
                    <div className="flex flex-wrap gap-2 pl-11 mt-3">
                      {row.screenshots.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightbox(src)}
                          data-testid={`my-ticket-screenshot-thumb-${row.id}-${i}`}
                          className="w-24 h-24 rounded-md border border-slate-200 overflow-hidden bg-slate-50 hover:border-slate-300 transition-colors"
                          aria-label="Open screenshot"
                        >
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {lightbox && (
        <div
          className="fixed inset-0 bg-slate-900/85 z-50 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
          data-testid="my-ticket-lightbox"
        >
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
