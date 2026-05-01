/**
 * SaveIndicator — small text chip showing the current autosave status.
 * Ticks every 15s while "saved" to keep the "Xs ago" label fresh.
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
        className="text-xs text-slate-500 flex items-center gap-1.5"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        data-testid="save-indicator"
        className="text-xs text-red-600 flex items-center gap-1.5"
      >
        Save failed
      </span>
    );
  }
  if (status === "saved" && savedAt) {
    const sec = Math.floor((Date.now() - savedAt) / 1000);
    return (
      <span
        data-testid="save-indicator"
        className="text-xs text-slate-500 flex items-center gap-1.5"
      >
        <Check className="w-3 h-3 text-emerald-500" />
        Saved {sec < 5 ? "just now" : `${sec}s ago`}
      </span>
    );
  }
  return null;
}
