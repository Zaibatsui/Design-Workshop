import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  Check,
  Trash2,
  RotateCcw,
  RefreshCcw,
  Search,
  Inbox,
  XCircle,
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

// Status pill used in the row header. Admin still flips the underlying
// status via the action buttons; this label mirrors the same value the
// reporter sees in their own My Tickets list.
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
      data-testid={`admin-ticket-status-${status}`}
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

/**
 * AdminTickets — admin-only inbox for bug reports & feature requests
 * submitted via TicketDialog. Mark complete + delete per row. Reuses
 * the same visual chrome as AdminUsers for a consistent admin shell.
 */
export default function AdminTicketsPage({ chromeless = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [lightbox, setLightbox] = useState(null); // image src or null

  const reload = async () => {
    setLoading(true);
    try {
      const data = await api.listTickets();
      setRows(data);
    } catch (e) {
      toast.error("Failed to load tickets", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const setStatus = async (row, next) => {
    setPendingId(row.id);
    try {
      await api.setTicketStatus(row.id, next);
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, status: next, updated_at: new Date().toISOString() }
            : r
        )
      );
      const labels = {
        complete: "Marked as complete",
        rejected: "Rejected",
        open: "Reopened",
      };
      toast.success(labels[next] || "Updated");
    } catch (e) {
      toast.error("Update failed", { description: e.message });
    } finally {
      setPendingId(null);
    }
  };

  const onDelete = async (row) => {
    const ok = window.confirm(
      `Remove this ticket from your inbox?\n\n"${row.title}"\n\n` +
        "The reporter keeps their copy until they also remove it. " +
        "Once both sides remove it, the ticket is permanently deleted."
    );
    if (!ok) return;
    setPendingId(row.id);
    try {
      await api.deleteTicket(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast.success("Removed from your inbox");
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
          (r.description || "").toLowerCase().includes(q) ||
          (r.created_by_email || "").toLowerCase().includes(q) ||
          (r.created_by_name || "").toLowerCase().includes(q)
      )
    : rows;

  const openCount = rows.filter((r) => r.status === "open").length;
  const completeCount = rows.filter((r) => r.status === "complete").length;
  const rejectedCount = rows.filter((r) => r.status === "rejected").length;

  return (
    <div className={chromeless ? "" : "min-h-screen bg-slate-50"} data-testid="admin-tickets-page">
      {!chromeless && (
        <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-4">
          <Link
            to="/"
            data-testid="admin-tickets-back"
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
              data-testid="admin-tickets-refresh"
            >
              <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>
      )}

      <main className={chromeless ? "max-w-6xl mx-auto px-6 md:px-8 py-8" : "max-w-6xl mx-auto px-6 md:px-8 py-10"}>
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E01839] mb-3">
            Admin · Tickets
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900 mb-2">
            Bug reports &amp; feature requests
          </h1>
          <p className="text-sm text-slate-500">
            {openCount} open · {completeCount} complete · {rejectedCount}{" "}
            rejected · {rows.length} total
          </p>
        </div>

        <div className="mb-5 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search title, description, reporter…"
            className="pl-9"
            data-testid="admin-tickets-search"
          />
        </div>

        {loading ? (
          <div className="text-sm text-slate-500 py-12 text-center">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <Inbox className="w-10 h-10" />
            <p className="text-sm">
              {rows.length === 0 ? "No tickets yet" : "No matches for your search"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((row) => {
              const isComplete = row.status === "complete";
              const isRejected = row.status === "rejected";
              const isOpen = !isComplete && !isRejected;
              const TypeIcon = row.type === "feature" ? Lightbulb : Bug;
              return (
                <div
                  key={row.id}
                  data-testid={`ticket-row-${row.id}`}
                  className={`bg-white border rounded-lg p-5 transition-opacity ${
                    !isOpen ? "opacity-60 border-slate-200" : "border-slate-200"
                  }`}
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
                              isComplete ? "line-through" : ""
                            }`}
                          >
                            {row.title}
                          </h3>
                          <StatusBadge status={row.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {row.type === "feature" ? "Feature request" : "Bug report"}
                          {" · "}
                          {row.created_by_name || row.created_by_email || "Unknown"}
                          {" · "}
                          {fmtDate(row.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      {isOpen ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setStatus(row, "complete")}
                            disabled={pendingId === row.id}
                            data-testid={`ticket-complete-${row.id}`}
                            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            Complete
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setStatus(row, "rejected")}
                            disabled={pendingId === row.id}
                            data-testid={`ticket-reject-${row.id}`}
                            className="text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setStatus(row, "open")}
                          disabled={pendingId === row.id}
                          data-testid={`ticket-reopen-${row.id}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Reopen
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(row)}
                        disabled={pendingId === row.id}
                        data-testid={`ticket-delete-${row.id}`}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        aria-label="Remove from your inbox"
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
                          data-testid={`ticket-screenshot-thumb-${row.id}-${i}`}
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
          data-testid="ticket-lightbox"
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
