import StudioShell from "@/components/studio/StudioShell";
import SectionGuidePage from "@/pages/SectionGuidePage";

export default function StudioSectionGuidePage() {
  return (
    <StudioShell active="guide">
      <SectionGuidePage chromeless />
    </StudioShell>
  );
}
