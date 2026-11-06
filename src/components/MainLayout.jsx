import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const isDesktop = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1025px)').matches;

export default function MainLayout({ children }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktop);

  // Jika di halaman login, jangan tampilkan layout sama sekali
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  // Tutup otomatis hanya di layar kecil (sidebar jadi overlay)
  const closeSidebar = () => {
    if (!isDesktop()) setIsSidebarOpen(false);
  };

  return (
    <div className="app-shell" data-sidebar={isSidebarOpen ? 'open' : 'closed'}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      <div className="app-main">
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        <div className="content">
          <main className="main">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
