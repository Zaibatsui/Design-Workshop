import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import "@/App.css";
import { AuthProvider } from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Editor from "@/pages/Editor";
import PageEditor from "@/pages/PageEditor";

/**
 * Surfaces unhandled promise rejections (chunk-load failures) as a sticky
 * toast with a "Reload" action. Render-time errors are caught by the
 * top-level ErrorBoundary in index.js. Toasts are picked up by whichever
 * page-scoped <Toaster /> is mounted.
 */
function useGlobalErrorToast() {
  useEffect(() => {
    const onRejection = (e) => {
      const msg = e?.reason?.message || String(e?.reason || "");
      if (!msg) return;
      const isChunk = /chunk|loading css|loading script|failed to fetch dynamically imported/i.test(
        msg
      );
      if (!isChunk) return;
      toast.error("A new build is available", {
        id: "chunk-reload",
        description: "Reload to pick up the latest editor.",
        duration: Infinity,
        action: { label: "Reload", onClick: () => window.location.reload() },
      });
    };
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);
}

function App() {
  useGlobalErrorToast();
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/section/:sectionId"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/page/:pageId"
              element={
                <ProtectedRoute>
                  <PageEditor />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
