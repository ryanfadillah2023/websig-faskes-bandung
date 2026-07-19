import { Routes, Route, Navigate } from "react-router-dom";
import PublicMap from "./pages/PublicMap.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import { isAuthed } from "./auth.js";

// Pelindung rute admin: kalau belum login, lempar ke halaman login.
function RequireAuth({ children }) {
  return isAuthed() ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicMap />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
