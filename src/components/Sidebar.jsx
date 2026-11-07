import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FilePlus2, History, Files, Phone, RefreshCcw } from 'lucide-react';

// DEMO MODE: tombol reset data demo
import { resetDemoData } from '../lib/api';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/buat-surat', label: 'Buat Surat', icon: FilePlus2 },
  { to: '/riwayat', label: 'Riwayat Surat', icon: History },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const handleContact = () => {
    alert('Hubungi operator desa untuk bantuan penggunaan sistem.');
  };

  return (
    <aside className="sidebar" aria-hidden={!isOpen}>
      <div className="sidebar-brand">
        <span className="sidebar-brand-logo" aria-hidden="true">
          <Files size={21} />
        </span>
        <div>
          <p className="sidebar-brand-name">Desa Digital</p>
          <p className="sidebar-brand-desc">Administrasi Desa Melati</p>
        </div>
      </div>

      <nav>
        <ul className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`nav-link${isActive ? ' is-active' : ''}`}
                  onClick={onClose}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-help">
          <strong>Butuh bantuan?</strong>
          <span>Hubungi operator desa untuk bantuan penggunaan sistem.</span>
          <button type="button" onClick={handleContact}>
            <Phone size={12} /> Lihat Kontak
          </button>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ width: '100%', marginBottom: 10 }}
          onClick={() => {
            if (window.confirm('Hapus seluruh data demo (riwayat & warga) dan muat ulang halaman?')) {
              resetDemoData();
            }
          }}
          title="Kembalikan data demo ke kondisi awal"
        >
          <RefreshCcw size={13} /> Reset Data Demo
        </button>
        <p className="sidebar-copyright">© 2026 Sistem Desa Digital<br />Pemerintah Desa</p>
      </div>
    </aside>
  );
}