/**
 * SaveIndicator — small text chip showing the current autosave status.
 * Ticks every 15s while "saved" to keep the "Xs ago" label fresh.
 *
 * Responsive: below xl (1280px) the label text is hidden and only the
 * status icon shows, with the full label moved to a native `title`
 * tooltip. Prevents the top-bar overlap on narrow Studio viewports.
 */
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

export default function SaveIndicator({ status, savedAt }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (status !== "saved") return;
    const i = setInterval(() => force((n) => n + 1), 15000);
    return () => clearInterval(i);
  }, [status]);

  if (status === "saving") {
    return (
      <span
        data-testid="save-indicator"
        title="Saving…"
        className="text-xs text-slate-500 flex items-center gap-1.5"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="hidden xl:inline">Saving…</span>
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        data-testid="save-indicator"
        title="Save failed"
        className="text-xs text-red-600 flex items-center gap-1.5"
      >
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        <span className="hidden xl:inline">Save failed</span>
      </span>
    );
  }
  if (status === "saved" && savedAt) {
    const sec = Math.floor((Date.now() - savedAt) / 1000);
    const label = `Saved ${sec < 5 ? "just now" : `${sec}s ago`}`;
    return (
      <span
        data-testid="save-indicator"
        title={label}
        className="text-xs text-slate-500 flex items-center gap-1.5"
      >
        <Check className="w-3 h-3 text-emerald-500" />
        <span className="hidden xl:inline">{label}</span>
      </span>
    );
  }
  return null;
}
