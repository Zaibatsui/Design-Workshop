/**
 * Studio Image Library — promotes the asset gallery (currently a
 * section inside the Brand Kit page) to its own first-class Studio
 * route. The underlying data + behaviour come from the existing
 * `ImageLibrarySection` component used by Brand Kit; this page just
 * wraps it in the Studio shell so it has its own sidebar nav slot.
 *
 * In Classic mode the image library remains inside the Brand Kit page
 * (no behaviour change). Studio's Brand Kit wrapper passes
 * `hideImageLibrary` to suppress the duplicate render there.
 */
import { Library } from "lucide-react";
import StudioShell from "@/components/studio/StudioShell";
import ImageLibrarySection from "@/pages/brand-kit/ImageLibrarySection";

export default function StudioImageLibrary() {
  return (
    <StudioShell active="image-library">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="mb-8 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-zinc-100 flex items-center justify-center">
            <Library className="w-4 h-4 text-zinc-700" strokeWidth={1.75} />
          </div>
          <div>
            <h1
              className="text-[22px] font-semibold tracking-tight leading-none text-zinc-900"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Image library
            </h1>
            <p className="mt-1 text-[12px] text-zinc-500">
              Upload and manage images you can drop into any section.
            </p>
          </div>
        </header>
        <ImageLibrarySection />
      </div>
    </StudioShell>
  );
}
