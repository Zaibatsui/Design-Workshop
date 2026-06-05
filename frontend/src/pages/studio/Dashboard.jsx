/**
 * Studio Dashboard — thin wrapper that renders the existing
 * <Dashboard chromeless /> body inside the Studio shell. The data flow
 * and behaviours of the original Dashboard are preserved 100%; only
 * the surrounding chrome changes.
 *
 * Phase 2 prototype scope: don't rebuild the section/page list from
 * scratch — leveraging the existing tab content keeps the Studio
 * experience consistent with what users already know while we
 * experiment with the new shell.
 */
import StudioShell from "@/components/studio/StudioShell";
import Dashboard from "@/pages/Dashboard";

export default function StudioDashboard() {
  return (
    <StudioShell active="sections">
      <Dashboard chromeless />
    </StudioShell>
  );
}
