import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import WelcomeModal from "@/components/WelcomeModal";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import NoteDetail from "@/pages/NoteDetail";
import Upload from "@/pages/Upload";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Whiteboard from "@/pages/Whiteboard";
import Folders from "@/pages/Folders";
import AdminPanel from "@/pages/AdminPanel";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return (
    <div className="py-32 text-center font-mono-arch text-xs uppercase tracking-widest text-ink-medium">
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AdminProvider>
            <Header />
            <main className="min-h-[60vh]">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
                <Route path="/notes" element={<RequireAuth><Browse /></RequireAuth>} />
                <Route path="/notes/:id" element={<RequireAuth><NoteDetail /></RequireAuth>} />
                <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
                <Route path="/whiteboard" element={<RequireAuth><Whiteboard /></RequireAuth>} />
                <Route path="/folders" element={<RequireAuth><Folders /></RequireAuth>} />
                <Route path="/admin" element={<RequireAuth><AdminPanel /></RequireAuth>} />
              </Routes>
            </main>
            <Footer />
            <InstallPrompt />
            <WelcomeModal />
          </AdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
