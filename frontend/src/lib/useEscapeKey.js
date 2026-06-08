import { useEffect } from "react";

/**
 * Fires the supplied callback when the user presses the Escape key.
 * Used by every modal/picker for consistent close-on-Esc UX.
 *
 * @param {() => void} onEscape - handler invoked on Escape keydown
 * @param {boolean} [active=true] - when false, the listener isn't attached
 */
export function useEscapeKey(onEscape, active = true) {
  useEffect(() => {
    if (!active || typeof onEscape !== "function") return undefined;
    const handler = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onEscape, active]);
}
