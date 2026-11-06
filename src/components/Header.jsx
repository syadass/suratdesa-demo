import { useState, useRef, useEffect } from 'react';
import { Menu, X, Bell, ChevronDown, LogOut } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const getInitials = (nama) => {
  if (!nama) return 'PD';
  const parts = String(nama).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('');
};

export default function Header({ toggleSidebar, isSidebarOpen }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const profileRef = useRef(null);

  let user = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) user = JSON.parse(raw);
  } catch {
    // data rusak diabaikan, pakai nilai default
  }

  useEffect(() => {
    if (!profileOpen) return;
    const close = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const esc = (e) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [profileOpen]);

  const handleNotif = () => {
    alert('Belum ada notifikasi baru.');
  };

  const handleLogout = () => {
    setProfileOpen(false);
    setConfirmLogout(false);
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <>
      <header className="header">
        <button
          type="button"
          className="header-toggle"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="header-spacer" />

        {/* DEMO MODE: penanda bahwa ini versi demo (tanpa backend) */}
        <span
          className="badge badge-amber"
          title="Versi demo: seluruh data disimpan di localStorage browser, bukan database asli"
          style={{ marginRight: 10 }}
        >
          MODE DEMO
        </span>

        <button
          type="button"
          className="header-bell"
          onClick={handleNotif}
          aria-label="Notifikasi"
          title="Notifikasi"
        >
          <Bell size={19} />
          <span className="header-bell-dot" aria-hidden="true" />
        </button>

        <div className="header-profile" ref={profileRef}>
          <button
            type="button"
            className="header-profile-btn"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <span className="header-avatar" aria-hidden="true">
              {getInitials(user?.nama)}
            </span>
            <span className="header-profile-text">
              <span className="header-profile-name">{user?.nama || 'Petugas Desa'}</span>
              <span className="header-profile-role">{user?.username || 'Administrator'}</span>
            </span>
            <ChevronDown size={15} className="header-chevron" aria-hidden="true" />
          </button>

          {profileOpen && (
            <div className="profile-menu" role="menu">
              <div className="profile-menu-head">
                <strong>{user?.nama || 'Petugas Desa'}</strong>
                <small>{user?.username || 'Administrator'}</small>
              </div>
              <button
                type="button"
                className="profile-menu-item"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  setConfirmLogout(true);
                }}
              >
                <LogOut size={15} />
                Keluar (Logout)
              </button>
            </div>
          )}
        </div>
      </header>

      <ConfirmModal
        open={confirmLogout}
        title="Keluar dari sistem?"
        message="Apakah Anda yakin akan logout dari Sistem Desa Digital?"
        confirmText="Ya, Logout"
        cancelText="Batal"
        danger
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
