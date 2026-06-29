import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import "@/App.css";
import { AuthProvider } from "@/auth/AuthContext";
import { BrandKitProvider } from "@/lib/BrandKitContext";
import { PreviewOverridesProvider } from "@/lib/PreviewOverridesContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import Login from "@/pages/Login";
import StudioEditor from "@/pages/studio/Editor";
import StudioDashboard from "@/pages/studio/Dashboard";
import StudioBrandKit from "@/pages/studio/BrandKit";
import { StudioAdminTickets, StudioMyTickets } from "@/pages/studio/Tickets";
import StudioGuide from "@/pages/studio/Guide";
import StudioSectionGuidePage from "@/pages/studio/SectionGuidePage";
import StudioAdminUsers from "@/pages/studio/AdminUsers";
import StudioImageLibrary from "@/pages/studio/ImageLibrary";
import StudioTemplates from "@/pages/studio/Templates";
import StudioPageEditor from "@/pages/studio/PageEditor";

/**
 * Surfaces runtime errors that bypass the render-time ErrorBoundary as
 * sticky toasts:
 *   - `unhandledrejection` covers async/Promise failures (chunk loads,
 *     awaited fetches, etc.).
 *   - `error` covers synchronous handler exceptions (DataCloneError on a
 *     bad navigate() payload, manual throws, etc.) — those bubble to the
 *     window without ever reaching React's render tree.
 *
 * Chunk-load failures get a "Reload" CTA (a reload picks up the new bundle).
 * Anything else gets a generic developer-visible toast so silent breakage
 * stops being silent.
 */
function useGlobalErrorToast() {
  useEffect(() => {
    const isChunk = (msg) =>
      /chunk|loading css|loading script|failed to fetch dynamically imported/i.test(
        msg
      );

    const onRejection = (e) => {
      const msg = e?.reason?.message || String(e?.reason || "");
      if (!msg) return;
      if (isChunk(msg)) {
        toast.error("A new build is available", {
          id: "chunk-reload",
          description: "Reload to pick up the latest editor.",
          duration: Infinity,
          action: { label: "Reload", onClick: () => window.location.reload() },
        });
      } else {
        toast.error("Something went wrong in the background", {
          id: `runtime-${msg.slice(0, 32)}`,
          description: msg.slice(0, 200),
          duration: 8000,
        });
      }
    };

    const onError = (e) => {
      const msg = e?.error?.message || e?.message || "";
      if (!msg) return;
      if (isChunk(msg)) {
        toast.error("A new build is available", {
          id: "chunk-reload",
          description: "Reload to pick up the latest editor.",
          duration: Infinity,
          action: { label: "Reload", onClick: () => window.location.reload() },
        });
      } else {
        toast.error("Something broke", {
          id: `runtime-${msg.slice(0, 32)}`,
          description: msg.slice(0, 200),
          duration: 8000,
        });
      }
    };

    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);
}

function App() {
  useGlobalErrorToast();
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <BrandKitProvider>
            <PreviewOverridesProvider>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><StudioDashboard /></ProtectedRoute>} />
              <Route path="/brand" element={<ProtectedRoute><StudioBrandKit /></ProtectedRoute>} />
              <Route path="/images" element={<ProtectedRoute><StudioImageLibrary /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><StudioTemplates /></ProtectedRoute>} />
              <Route path="/guide" element={<ProtectedRoute><StudioGuide /></ProtectedRoute>} />
              <Route path="/guide/section/:sectionId" element={<ProtectedRoute><StudioSectionGuidePage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin><StudioAdminUsers /></ProtectedRoute>} />
              <Route path="/admin/tickets" element={<ProtectedRoute requireAdmin><StudioAdminTickets /></ProtectedRoute>} />
              <Route path="/my-tickets" element={<ProtectedRoute><StudioMyTickets /></ProtectedRoute>} />
              <Route path="/edit/section/:sectionId" element={<ProtectedRoute><StudioEditor /></ProtectedRoute>} />
              <Route path="/edit/page/:pageId" element={<ProtectedRoute><StudioPageEditor /></ProtectedRoute>} />
            </Routes>
            </PreviewOverridesProvider>
          </BrandKitProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
