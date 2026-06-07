/**
 * Studio Guide — renders the existing UserGuide content (chromeless)
 * inside the Studio shell so the sidebar nav and unified header
 * remain visible while reading docs.
 */
import StudioShell from "@/components/studio/StudioShell";
import UserGuide from "@/pages/UserGuide";

export default function StudioGuide() {
  return (
    <StudioShell active="guide">
      <UserGuide chromeless />
    </StudioShell>
  );
}
