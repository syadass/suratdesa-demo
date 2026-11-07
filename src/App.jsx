import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import BuatSurat from './pages/BuatSurat';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Riwayat from './pages/Riwayat';
import MainLayout from './components/MainLayout';

// Komponen Penjaga Rute (Protected Route)
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* Rute Bebas (Public) */}
          <Route path="/login" element={<Login />} />

          {/* Rute Terlindungi (Protected) */}
          <Route
            path="/"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/buat-surat"
            element={<ProtectedRoute><BuatSurat /></ProtectedRoute>}
          />
          <Route
            path="/riwayat"
            element={<ProtectedRoute><Riwayat /></ProtectedRoute>}
          />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
