/**
 * StudioToggle — header pill that flips between the Classic and Studio
 * UI shells. Available to every signed-in user (no admin gating).
 * The chosen mode persists on the user record via
 * `PATCH /api/auth/me/ui-mode`, so the next session opens in the same
 * layout. Studio is the default for users who haven't picked yet.
 *
 * Render-nothing while auth is loading or the user is signed-out so
 * the pill never blinks into existence on the login screen.
 */
import { useAuth } from "@/auth/AuthContext";
import { Sparkles, LayoutGrid } from "lucide-react";

export default function StudioToggle({ variant = "default" }) {
  const { user, setUiMode } = useAuth();
  if (!user) return null;
  // Default = "studio" (matches StudioOrClassic) so the pill reflects
  // the actual rendered shell even before the user has saved a pref.
  const current = user.ui_mode || "studio";

  // Two visual variants:
  //   - "default": full segmented control (used in the classic header,
  //     where space allows). Both labels visible.
  //   - "compact": single icon-button that flips the OPPOSITE mode
  //     (used inside the dense Studio header). Tooltip-driven.
  const isStudio = current === "studio";

  if (variant === "compact") {
    const next = isStudio ? "classic" : "studio";
    const Icon = isStudio ? LayoutGrid : Sparkles;
    return (
      <button
        type="button"
        onClick={() => setUiMode(next)}
        data-testid="studio-toggle-compact"
        title={`Switch to ${next === "studio" ? "Studio" : "Classic"} UI`}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span>{isStudio ? "Studio" : "Classic"}</span>
      </button>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-zinc-100 border border-zinc-200"
      role="tablist"
      data-testid="studio-toggle"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!isStudio}
        onClick={() => setUiMode("classic")}
        data-testid="studio-toggle-classic"
        className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-medium transition-colors ${
          !isStudio
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        <LayoutGrid className="h-3 w-3" strokeWidth={2} />
        Classic
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={isStudio}
        onClick={() => setUiMode("studio")}
        data-testid="studio-toggle-studio"
        className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-medium transition-colors ${
          isStudio
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        <Sparkles className="h-3 w-3" strokeWidth={2} />
        Studio
      </button>
    </div>
  );
}
