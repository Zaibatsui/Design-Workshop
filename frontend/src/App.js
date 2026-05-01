import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import { AuthProvider } from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Editor from "@/pages/Editor";
import PageEditor from "@/pages/PageEditor";

function App() {
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
