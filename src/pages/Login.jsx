import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// DEMO MODE: backend digantikan lapisan localStorage
import { api } from '../lib/api';
import { Landmark, User, Lock, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // DEMO MODE: verifikasi akun disimpan di localStorage
      const response = await api.login(credentials);

      // Jika sukses, simpan token dan data user di localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Arahkan ke halaman Dashboard
      navigate('/');
    } catch (err) {
      // Menangkap pesan error dari backend (misal: password salah)
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan pada demo. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setCredentials({ username: 'admin', password: 'desa123' });
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo" aria-hidden="true">
            <Landmark size={30} />
          </div>
          <div>
            <h2 className="login-title">Sistem Desa Digital</h2>
            <p className="login-subtitle">Masuk ke panel administrasi Desa Cangak</p>
          </div>
        </div>

        <div className="alert alert-info" role="note" style={{ marginBottom: 16, alignItems: 'center' }}>
          <KeyRound size={17} />
          <span style={{ flex: 1 }}>
            <strong>Mode Demo</strong> &mdash; akun <code>admin</code> / <code>desa123</code>
          </span>
          <button type="button" className="btn btn-outline btn-sm" onClick={fillDemoAccount}>
            Isi
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 16 }}>
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="label" htmlFor="username">
              Username
            </label>
            <div className="input-icon">
              <User size={16} />
              <input
                className="input"
                id="username"
                type="text"
                name="username"
                placeholder="Masukkan username"
                value={credentials.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">
              Password
            </label>
            <div className="input-icon">
              <Lock size={16} />
              <input
                className="input"
                id="password"
                type="password"
                name="password"
                placeholder="Masukkan password"
                value={credentials.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg btn-block${loading ? ' btn-loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Memproses...
              </>
            ) : (
              <>
                Masuk <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <p className="login-footer">
          Akses terbatas untuk petugas administrasi desa.
        </p>
      </div>
    </div>
  );
}
