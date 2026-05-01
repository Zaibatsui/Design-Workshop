import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "@/App.css";
import { AuthProvider } from "@/auth/AuthContext";
import AuthCallback from "@/auth/AuthCallback";
import ProtectedRoute from "@/auth/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Editor from "@/pages/Editor";

function AppRouter() {
  const location = useLocation();
  // Detect session_id during render (NOT in useEffect). useEffect runs AFTER
  // first render — too late! This synchronous check prevents race conditions
  // by processing new session_id FIRST before checking existing session_token.
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
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
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
