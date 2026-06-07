/**
 * Studio Brand Kit — thin wrapper that renders the existing
 * <BrandKitPage chromeless /> inside the Studio shell. The save / reset /
 * apply controls move into a top-of-page action bar (rendered by the
 * chromeless variant of BrandKit), leaving the Studio header for
 * navigation + user controls.
 */
import StudioShell from "@/components/studio/StudioShell";
import BrandKitPage from "@/pages/BrandKit";

export default function StudioBrandKit() {
  return (
    <StudioShell active="brand-kit">
      <BrandKitPage chromeless hideImageLibrary />
    </StudioShell>
  );
}
