import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldOff,
  UserCircle2,
  RefreshCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";

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

const relativeTime = (iso) => {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "—";
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 30 * 86400) return `${Math.floor(seconds / 86400)} days ago`;
  return fmtDate(iso);
};

export default function AdminUsersPage({ chromeless = false }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [pendingId, setPendingId] = useState(null);

  // Initial fetch + manual refresh handler share the same loader so the
  // refresh button can re-use the spinner state without a separate flag.
  const reload = async () => {
    setLoading(true);
    try {
      const data = await api.listUsers();
      setRows(data);
    } catch (e) {
      toast.error("Failed to load users", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const toggleStatus = async (row) => {
    if (row.is_admin) {
      toast.error("Admin accounts can't be deactivated from the UI");
      return;
    }
    if (row.user_id === user?.user_id) {
      toast.error("You can't change your own status");
      return;
    }
    const next = !row.is_active;
    const verb = next ? "Reactivate" : "Deactivate";
    const ok = window.confirm(
      `${verb} ${row.email}?\n\n` +
        (next
          ? "They'll be able to sign in again on their next login."
          : "Their active sessions will be ended immediately and they'll be blocked from signing back in.")
    );
    if (!ok) return;

    setPendingId(row.user_id);
    try {
      const updated = await api.setUserStatus(row.user_id, next);
      setRows((prev) =>
        prev.map((r) => (r.user_id === row.user_id ? updated : r))
      );
      toast.success(
        next ? `${row.email} reactivated` : `${row.email} deactivated`
      );
    } catch (e) {
      toast.error("Status update failed", { description: e.message });
    } finally {
      setPendingId(null);
    }
  };

  const visible = rows.filter((r) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      r.email.toLowerCase().includes(q) ||
      (r.name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className={chromeless ? "" : "min-h-screen bg-slate-50"}>
      {!chromeless && (
        <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            data-testid="admin-users-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <div className="text-right">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              User management
            </h1>
            <p className="text-xs text-slate-500">
              {rows.length} {rows.length === 1 ? "account" : "accounts"} total
            </p>
          </div>
        </div>
      </header>
      )}

      <main className={chromeless ? "max-w-6xl mx-auto px-6 py-6" : "max-w-6xl mx-auto px-6 py-8"}>
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by email or name…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8"
              data-testid="admin-users-search"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loading}
            data-testid="admin-users-refresh"
          >
            <RefreshCcw
              className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <div
          className="bg-white border border-slate-200 rounded-lg overflow-hidden"
          data-testid="admin-users-table"
        >
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-[12px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium text-right">Sections</th>
                <th className="px-4 py-3 font-medium text-right">Pages</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    Loading…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No users match that filter.
                  </td>
                </tr>
              ) : (
                visible.map((r) => (
                  <UserRow
                    key={r.user_id}
                    row={r}
                    pending={pendingId === r.user_id}
                    onToggle={() => toggleStatus(r)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-slate-400 mt-3 leading-snug max-w-prose">
          Admin accounts (configured in <code>backend/deps.py</code>) are
          shown here for visibility but can't be deactivated from this UI.
          Deactivating a user immediately ends all of their active sessions.
        </p>
      </main>
    </div>
  );
}

function UserRow({ row, pending, onToggle }) {
  const inactive = !row.is_active;
  return (
    <tr
      className={`border-t border-slate-100 ${inactive ? "bg-slate-50/60" : ""}`}
      data-testid={`admin-users-row-${row.user_id}`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {row.picture ? (
            <img
              src={row.picture}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <UserCircle2 className="w-5 h-5 text-slate-500" />
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900 leading-tight flex items-center gap-1.5">
              {row.name || row.email}
              {row.is_admin && (
                <span
                  title="Admin account"
                  className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wide font-semibold bg-[#E01839]/10 text-[#E01839] px-1.5 py-0.5 rounded"
                >
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 leading-tight">{row.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{row.sections_count}</td>
      <td className="px-4 py-3 text-right tabular-nums">{row.pages_count}</td>
      <td
        className="px-4 py-3 text-slate-600"
        title={row.last_login_at ? fmtDate(row.last_login_at) : "Never logged in"}
      >
        {relativeTime(row.last_login_at)}
      </td>
      <td className="px-4 py-3 text-slate-500 text-xs">
        {fmtDate(row.created_at)}
      </td>
      <td className="px-4 py-3">
        {inactive ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
            <ShieldOff className="w-3 h-3" />
            Deactivated
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3" />
            Active
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          size="sm"
          variant={inactive ? "default" : "outline"}
          disabled={pending || row.is_admin}
          onClick={onToggle}
          data-testid={`admin-users-toggle-${row.user_id}`}
          className={inactive ? "" : "text-[#E01839] border-[#E01839]/40 hover:bg-[#E01839]/5"}
        >
          {pending ? "Saving…" : inactive ? "Reactivate" : "Deactivate"}
        </Button>
      </td>
    </tr>
  );
}
