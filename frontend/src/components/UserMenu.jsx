/**
 * UserMenu — shared user-avatar dropdown used by both Classic and
 * Studio page headers. Encapsulates:
 *   • The user's name, email and admin badge.
 *   • An admin-only "Switch to Studio" / "Switch to Classic" item
 *     (so admins can flip UI from any page, not just the section
 *     editor).
 *   • Sign out.
 *
 * The dropdown is positioned `absolute right-0`, so the consumer just
 * drops <UserMenu /> into the right-side of its header row. Variants
 * `default` (slightly larger, used in Classic where it sits beside
 * full-size buttons) and `compact` (used inside the dense Studio
 * shell header) only affect the trigger sizing.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Clock, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

const IDLE_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1½ hours" },
  { value: 120, label: "2 hours" },
];

export default function UserMenu({ variant = "default" }) {
  const { user, logout, setIdleMinutes, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const replayTour = () => {
    // In-session replay: flip the local user.onboarded flag back to
    // false so the StudioShell-mounted <OnboardingTour /> re-mounts.
    // When the user finishes or skips again, the existing
    // `markOnboarded()` call inside the tour re-persists `true` to
    // the backend — no extra endpoint required.
    if (user) setUser({ ...user, onboarded: false });
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const triggerSize = variant === "compact" ? "h-8" : "h-9";
  const avatarSize = variant === "compact" ? "w-6 h-6" : "w-7 h-7";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid="user-menu-trigger"
        className={`inline-flex items-center gap-1.5 ${triggerSize} pl-1 pr-2 rounded-full hover:bg-slate-100 transition-colors`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.picture ? (
          <img src={user.picture} alt="" className={`${avatarSize} rounded-full`} />
        ) : (
          <div className={`${avatarSize} rounded-full bg-slate-200`} />
        )}
        <ChevronDown className="w-3 h-3 text-slate-500" strokeWidth={2} />
      </button>
      {open && (
        <div
          role="menu"
          data-testid="user-menu-panel"
          className="absolute right-0 top-[calc(100%+4px)] w-64 bg-white border border-slate-200 rounded-md shadow-lg py-1.5 z-30"
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="text-[13px] font-medium text-slate-900 truncate">{user.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
            {user.is_admin && (
              <span className="mt-1.5 inline-block text-[9px] font-bold tracking-[0.1em] uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                Admin
              </span>
            )}
          </div>

          <div className="px-3 py-2 border-b border-slate-100">
            <label
              htmlFor="user-menu-idle-select"
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1"
            >
              <Clock className="w-3 h-3" strokeWidth={2} />
              Sign me out after
            </label>
            <select
              id="user-menu-idle-select"
              data-testid="user-menu-idle-select"
              value={user.session_idle_minutes || 30}
              onChange={(e) => setIdleMinutes(Number(e.target.value))}
              className="w-full text-[12.5px] bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              {IDLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} of inactivity
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            role="menuitem"
            data-testid="user-menu-replay-tour"
            onClick={replayTour}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-b border-slate-100"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
            Replay Studio tour
          </button>

          <button
            type="button"
            role="menuitem"
            data-testid="user-menu-logout"
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
