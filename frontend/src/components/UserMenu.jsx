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
import { ChevronDown, LayoutGrid, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export default function UserMenu({ variant = "default" }) {
  const { user, logout, setUiMode } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

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
  const current = user.ui_mode || "classic";
  const isStudio = current === "studio";
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

          {user.is_admin && (
            <>
              <button
                type="button"
                role="menuitem"
                data-testid="user-menu-switch-ui"
                onClick={() => {
                  setOpen(false);
                  setUiMode(isStudio ? "classic" : "studio");
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="flex items-center gap-2">
                  {isStudio ? (
                    <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.75} />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                  )}
                  Switch to {isStudio ? "Classic" : "Studio"} UI
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {isStudio ? "v1" : "beta"}
                </span>
              </button>
              <div className="my-1 border-t border-slate-100" />
            </>
          )}

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
