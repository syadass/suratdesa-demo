import { useState, useEffect, useMemo } from 'react';
// DEMO MODE: halaman tambahan khusus demo, data disimpan di localStorage
import { api } from '../lib/api';
import { Users, Search, Save, RotateCcw, Pencil, Trash2, Inbox, UserPlus } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const PEKERJAAN_OPTIONS = [
  'Petani', 'Pedagang', 'Wiraswasta', 'Karyawan Swasta', 'Buruh',
  'Nelayan', 'Guru', 'Tenaga Kesehatan', 'PNS', 'TNI/Polri',
  'Perangkat Desa', 'Ibu Rumah Tangga', 'Pelajar/Mahasiswa', 'Tidak Bekerja',
];

const STATUS_OPTIONS = ['Aktif', 'Pindah', 'Nonaktif'];

const INITIAL_FORM = {
  nik: '',
  nama: '',
  tempatLahir: '',
  tanggalLahir: '',
  pekerjaan: '',
  alamat: '',
  status: 'Aktif',
};

const statusBadge = (status) => {
  if (status === 'Aktif') return 'badge badge-green';
  if (status === 'Pindah') return 'badge badge-amber';
  return 'badge badge-red';
};

const formatTanggal = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Warga() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editNik, setEditNik] = useState(''); // kosong = mode tambah
  const [message, setMessage] = useState(null); // { type, text }
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWarga = async () => {
    try {
      const { data } = await api.listWarga();
      setData(data);
    } catch (error) {
      console.error('Gagal memuat data warga:', error);
      setMessage({ type: 'danger', text: 'Gagal memuat data warga dari browser.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarga();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) =>
      [item.nama, item.nik, item.pekerjaan, item.alamat, item.tempatLahir]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [data, searchTerm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleNikChange = (e) => {
    setFormData((prev) => ({ ...prev, nik: e.target.value.replace(/\D/g, '').slice(0, 16) }));
    setFormError('');
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditNik('');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!/^\d{16}$/.test(formData.nik)) {
      setFormError('NIK harus terdiri dari 16 digit angka.');
      return;
    }
    if (!formData.nama.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }
    if (!formData.tempatLahir.trim()) {
      setFormError('Tempat lahir wajib diisi.');
      return;
    }
    if (!formData.tanggalLahir) {
      setFormError('Tanggal lahir wajib diisi.');
      return;
    }
    if (!formData.alamat.trim()) {
      setFormError('Alamat wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const { data: res } = await api.saveWarga(formData, editNik);
      setMessage({ type: 'success', text: res.message });
      resetForm();
      await fetchWarga();
    } catch (error) {
      setFormError(error?.response?.data?.message || 'Gagal menyimpan data warga.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditNik(item.nik);
    setFormData({
      nik: item.nik,
      nama: item.nama || '',
      tempatLahir: item.tempatLahir || '',
      tanggalLahir: (item.tanggalLahir || '').split('T')[0],
      pekerjaan: item.pekerjaan || '',
      alamat: item.alamat || '',
      status: item.status || 'Aktif',
    });
    setFormError('');
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem || deleting) return;
    setDeleting(true);
    try {
      const { data: res } = await api.deleteWarga(deleteItem.nik);
      if (editNik === deleteItem.nik) resetForm();
      setData((prev) => prev.filter((w) => w.nik !== deleteItem.nik));
      setDeleteItem(null);
      setMessage({ type: 'success', text: res.message });
    } catch (error) {
      alert(error?.response?.data?.message || 'Gagal menghapus data warga.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="riwayat-page" style={{ width: '100%' }}>
      <div className="page-head">
        <div className="heading">
          <div className="heading-icon"><Users size={25} /></div>
          <div>
            <h1>Data Warga</h1>
            <p>
              Tambah atau perbarui data warga (Mode Demo &mdash; tersimpan di localStorage).
              NIK yang terdaftar akan terisi otomatis pada form Buat Surat.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'danger' ? 'danger' : 'success'}`} role="alert" style={{ marginBottom: 16 }}>
          <span>{message.text}</span>
        </div>
      )}

      <div className="workspace">
        {/* KOLOM KIRI: FORM */}
        <section className="panel form-panel">
          <div className="panel-head">
            <h2>{editNik ? 'Ubah Data Warga' : 'Tambah Data Warga'}</h2>
          </div>
          <form className="form-body" onSubmit={handleSubmit}>
            <div className="section">
              <h3 className="section-title">Identitas Warga</h3>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="w-nik">NIK <span className="required" aria-hidden="true">*</span></label>
                  <input
                    id="w-nik"
                    className="nik-input"
                    type="text"
                    name="nik"
                    value={formData.nik}
                    onChange={handleNikChange}
                    placeholder="3327101201850004"
                    inputMode="numeric"
                    maxLength={16}
                    autoComplete="off"
                    required
                  />
                  <div className="field-hint"><span>16 digit angka</span><span>{formData.nik.length}/16</span></div>
                </div>
                <div className="field">
                  <label htmlFor="w-nama">Nama lengkap <span className="required" aria-hidden="true">*</span></label>
                  <input id="w-nama" type="text" name="nama" value={formData.nama} onChange={handleChange} placeholder="Ahmad Rizki Setiawan" required />
                </div>
                <div className="field">
                  <label htmlFor="w-ttl">Tempat lahir <span className="required" aria-hidden="true">*</span></label>
                  <input id="w-ttl" type="text" name="tempatLahir" value={formData.tempatLahir} onChange={handleChange} placeholder="Pemalang" required />
                </div>
                <div className="field">
                  <label htmlFor="w-tgl">Tanggal lahir <span className="required" aria-hidden="true">*</span></label>
                  <input id="w-tgl" type="date" name="tanggalLahir" value={formData.tanggalLahir} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label htmlFor="w-kerja">Pekerjaan</label>
                  <select id="w-kerja" name="pekerjaan" value={formData.pekerjaan} onChange={handleChange}>
                    <option value="">-- Pilih pekerjaan --</option>
                    {PEKERJAAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="w-status">Status</label>
                  <select id="w-status" name="status" value={formData.status} onChange={handleChange}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field full">
                  <label htmlFor="w-alamat">Alamat lengkap <span className="required" aria-hidden="true">*</span></label>
                  <textarea
                    id="w-alamat"
                    className="textarea"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleChange}
                    placeholder="RT 02 RW 03 Desa Cangak, Kec. Bodeh, Kab. Pemalang"
                    rows="2"
                    required
                  ></textarea>
                </div>
              </div>
              {formError && <span className="field-error">{formError}</span>}
            </div>

            <div className="form-actions">
              <span className="required-note"><span className="required" aria-hidden="true">*</span> Wajib diisi</span>
              <div className="actions">
                {(editNik || formData.nik || formData.nama) && (
                  <button type="button" className="btn" onClick={resetForm}>
                    <RotateCcw size={14} /> Batal
                  </button>
                )}
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Menyimpan...</> : <><Save size={14} /> {editNik ? 'Simpan Perubahan' : 'Tambah Warga'}</>}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* KOLOM KANAN: DAFTAR WARGA */}
        <section className="panel preview-panel">
          <div className="panel-head preview-head">
            <div className="head-title">
              <span className="eye"><UserPlus size={16} /></span>
              <h2>Daftar Warga ({filtered.length})</h2>
            </div>
            <div className="surat-preview-tools">
              <div className="rw-search">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Cari nama atau NIK..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Cari warga"
                />
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table rw-table">
              <thead>
                <tr>
                  <th>Warga</th>
                  <th>Pekerjaan</th>
                  <th>Alamat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">
                      <div className="loading"><div className="loading-spinner" /> Memuat data...</div>
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((item) => (
                    <tr key={item.nik}>
                      <td>
                        <div className="cell-strong">{item.nama}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.nik}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {item.tempatLahir || '-'}, {formatTanggal(item.tanggalLahir)}
                        </div>
                      </td>
                      <td>{item.pekerjaan || '-'}</td>
                      <td style={{ maxWidth: 260 }}>{item.alamat || '-'}</td>
                      <td><span className={statusBadge(item.status)}>{item.status || 'Aktif'}</span></td>
                      <td>
                        <div className="rw-action-btns">
                          <button type="button" title="Ubah Data" className="btn btn-outline btn-icon btn-sm" onClick={() => handleEdit(item)}>
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            title="Hapus Data"
                            className="btn btn-outline btn-icon btn-sm btn-soft-danger"
                            onClick={() => setDeleteItem(item)}
                            disabled={deleting}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-state" style={{ margin: 14 }}>
                        <Inbox size={34} />
                        {searchTerm ? 'Tidak ada warga yang cocok dengan pencarian.' : 'Belum ada data warga.'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={Boolean(deleteItem)}
        title="Hapus data warga?"
        message={`Data ${deleteItem?.nama || '-'} (${deleteItem?.nik || '-'}) akan dihapus dari penyimpanan browser (localStorage).`}
        confirmText={deleting ? 'Menghapus...' : 'Ya, Hapus'}
        cancelText="Batal"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setDeleteItem(null)}
      />
    </div>
  );
}
