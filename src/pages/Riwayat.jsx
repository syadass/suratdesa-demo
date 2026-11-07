import { useState, useEffect, useMemo, useRef } from 'react';
// DEMO MODE: backend digantikan lapisan localStorage
import { api } from '../lib/api';
import html2pdf from 'html2pdf.js';
import { Search, Printer, Download, ChevronLeft, ChevronRight, FileDown, Inbox, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const ROWS_PER_PAGE = 5;

const maskNik = (nik) => {
  if (!nik) return '-';
  const str = String(nik);
  if (str.length <= 8) return str;
  return `${str.slice(0, 6)}••••••${str.slice(-4)}`;
};

const jenisPendek = (jenisSurat) => {
  if (!jenisSurat) return '-';
  return jenisSurat.includes(' (') ? jenisSurat.split(' (')[0] : jenisSurat;
};

const formatTanggalSingkat = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTanggalPanjang = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

// --- Surat arsip yang dicetak/dunduh ulang dari data riwayat ---
const buildLetterHTML = (item) => {
  const jenis = item.jenis_surat || 'SURAT KETERANGAN';
  return `
    <div style="background:white;padding:40px;font-family:'Times New Roman',Times,serif;line-height:1.5;color:black;">
      <div style="display:flex;align-items:center;margin-bottom:2px;">
        <div style="width:80px;height:90px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;margin-right:15px;font-size:10px;text-align:center;">[LOGO]</div>
        <div style="flex:1;text-align:center;">
          <h3 style="margin:0;font-size:20px;text-transform:uppercase;letter-spacing:1px;">PEMERINTAH KABUPATEN SEJAHTERA</h3>
          <h3 style="margin:0;font-size:20px;text-transform:uppercase;letter-spacing:1px;">KECAMATAN BUNGA</h3>
          <h2 style="margin:0;font-size:22px;text-transform:uppercase;letter-spacing:2px;">DESA MELATI</h2>
        </div>
      </div>
      <div style="text-align:center;margin-bottom:5px;">
        <p style="margin:0;font-size:12px;font-style:italic;">Sekretariat : Jl Raya Melati No 2009 Kec. Bunga Kab. Sejahtera Kode Pos, 52365</p>
        <p style="margin:0;font-size:12px;font-style:italic;">Email : melati@desasejahtera.id Web : https://melati.desa.id</p>
      </div>
      <div style="border-bottom:1px solid black;margin-bottom:1px;"></div>
      <div style="border-bottom:3px solid black;margin-bottom:30px;"></div>
      <div style="text-align:center;margin-bottom:20px;">
        <h3 style="margin:0;text-transform:uppercase;text-decoration:underline;font-size:16px;">${jenis}</h3>
        <p style="margin:0;font-size:15px;">Nomor : ${item.no_surat || '-'}</p>
      </div>
      <div style="text-align:justify;margin-bottom:20px;font-size:15px;">
        <p style="text-indent:40px;margin-bottom:5px;">Yang bertanda tangan dibawah ini Kepala Desa Melati, Kecamatan Bunga Kabupaten Sejahtera Propinsi Jawa tengah.</p>
        <p style="margin-bottom:15px;">Dengan ini menerangkan yang sebenarnya bahwa :</p>
        <table style="width:100%;border-collapse:collapse;"><tbody>
          <tr><td style="width:5%;vertical-align:top;">1.</td><td style="width:35%;vertical-align:top;">Nama</td><td style="width:2%;vertical-align:top;">:</td><td style="text-transform:uppercase;font-weight:bold;">${item.nama || '-'}</td></tr>
          <tr><td style="vertical-align:top;">2.</td><td style="vertical-align:top;">NIK</td><td style="vertical-align:top;">:</td><td>${item.nik || '-'}</td></tr>
          <tr><td style="vertical-align:top;">3.</td><td style="vertical-align:top;">Tanggal Terbit</td><td style="vertical-align:top;">:</td><td>${formatTanggalPanjang(item.tanggal)}</td></tr>
          <tr><td style="vertical-align:top;padding-top:10px;">4.</td><td style="vertical-align:top;padding-top:10px;">Keterangan</td><td style="vertical-align:top;padding-top:10px;">:</td><td style="padding-top:10px;text-align:justify;">Bahwa nama tersebut di atas adalah benar warga Desa Melati, Kecamatan Bunga, Kabupaten Sejahtera. Surat keterangan ini diterbitkan berdasarkan arsip administrasi Pemerintah Desa.</td></tr>
        </tbody></table>
        <p style="text-indent:40px;margin-top:20px;">Demikian surat keterangan ini kami buat dan untuk dipergunakan sebagaimana mestinya.</p>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:30px;">
        <div style="text-align:center;width:250px;">
          <p style="margin:0;">Melati, ${formatTanggalPanjang(item.tanggal)}</p>
          <p style="margin:0;margin-bottom:70px;">Kepala Desa Melati</p>
          <p style="margin:0;font-weight:bold;text-decoration:underline;">ERWANTO, S.Pd</p>
        </div>
      </div>
    </div>
  `;
};

export default function Riwayat() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [exportRange, setExportRange] = useState('7_hari');
  const [docItem, setDocItem] = useState(null);
  const [busy, setBusy] = useState(false);
  // DEMO MODE: konfirmasi hapus data riwayat
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const docRef = useRef(null);
  const pendingAction = useRef(null);

  const fetchRiwayat = async () => {
    try {
      const { data } = await api.getRiwayat();
      setData(data);
    } catch (error) {
      console.error("Gagal mengambil data riwayat:", error);
      alert("Gagal memuat data riwayat demo dari browser.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  // --- Unduh PDF dijalankan setelah dokumen arsip dirender tersembunyi ---
  useEffect(() => {
    if (!docItem || pendingAction.current !== 'download') return;
    const run = async () => {
      setBusy(true);
      try {
        const safeNo = String(docItem.no_surat || 'surat').replace(/[\\/]/g, '-').replace(/\s+/g, '_');
        const safeNama = String(docItem.nama || '').replace(/\s+/g, '_');
        await html2pdf().set({
          margin: [15, 15, 15, 15],
          filename: `${safeNo}_${safeNama}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        }).from(docRef.current).save();
      } catch (error) {
        console.error(error);
        alert('Gagal mengunduh PDF.');
      } finally {
        setBusy(false);
        pendingAction.current = null;
        setDocItem(null);
      }
    };
    const t = setTimeout(run, 50);
    return () => clearTimeout(t);
  }, [docItem]);

  const jenisOptions = useMemo(() => {
    const set = new Set();
    data.forEach((item) => set.add(jenisPendek(item.jenis_surat)));
    return [...set].sort();
  }, [data]);

  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return data.filter((item) => {
      const cocokJenis = !filterJenis || jenisPendek(item.jenis_surat) === filterJenis;
      if (!cocokJenis) return false;
      if (!q) return true;
      return [item.nama, item.nik, item.no_surat, item.jenis_surat, item.petugas]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [data, searchTerm, filterJenis]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const indexOfLastRow = safePage * ROWS_PER_PAGE;
  const indexOfFirstRow = indexOfLastRow - ROWS_PER_PAGE;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleJenisChange = (e) => {
    setFilterJenis(e.target.value);
    setCurrentPage(1);
  };

  // --- Aksi per baris ---
  const handlePrint = (item) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup diblokir browser. Izinkan popup untuk mencetak.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak ${item.no_surat}</title>
          <style>
            body { font-family: "Times New Roman", Times, serif; line-height: 1.5; color: black; padding: 10mm; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; }
            p { margin: 0; }
          </style>
        </head>
        <body>
          ${buildLetterHTML(item)}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = (item) => {
    if (busy) return;
    pendingAction.current = 'download';
    setDocItem(item);
  };

  // --- DEMO MODE: hapus riwayat dari localStorage ---
  const handleConfirmDelete = async () => {
    if (!deleteItem || deleting) return;
    setDeleting(true);
    try {
      await api.deleteRiwayat(deleteItem.id);
      setData((prev) => prev.filter((item) => item.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (error) {
      alert(error?.response?.data?.message || 'Gagal menghapus data riwayat.');
    } finally {
      setDeleting(false);
    }
  };

  // --- Export rekap CSV sesuai rentang ---
  const handleExport = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rows = data.filter((item) => {
      const tgl = new Date(item.tanggal);
      if (isNaN(tgl.getTime())) return false;
      if (exportRange === 'hari_ini') return tgl >= startOfToday;
      if (exportRange === '7_hari') return now - tgl <= 7 * 86400000;
      if (exportRange === '1_bulan') return now - tgl <= 30 * 86400000;
      return true;
    });
    if (rows.length === 0) {
      alert('Tidak ada data pada rentang yang dipilih.');
      return;
    }
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['No. Surat', 'Tanggal', 'NIK', 'Nama Warga', 'Jenis Surat', 'Petugas'].map(esc).join(';'),
      ...rows.map((item) => [
        item.no_surat,
        formatTanggalPanjang(item.tanggal),
        item.nik,
        item.nama,
        item.jenis_surat,
        item.petugas,
      ].map(esc).join(';')),
    ];
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-surat-${exportRange}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="riwayat-page" style={{ width: '100%' }}>
      {/* Judul halaman */}
      <div className="rw-welcome">
        <div>
          <h1>Riwayat & Arsip Surat</h1>
          <p>Daftar seluruh surat keterangan dan permohonan administrasi yang diproses oleh kantor desa.</p>
        </div>
      </div>

      {/* Filter + export */}
      <div className="rw-actions-bar">
        <div className="rw-filters">
          <div className="rw-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Cari pemohon, nomor surat, atau jenis..."
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Cari surat"
            />
          </div>
          <select className="select rw-select" value={filterJenis} onChange={handleJenisChange} aria-label="Filter jenis surat">
            <option value="">Semua Jenis Surat</option>
            {jenisOptions.map((jenis) => (
              <option key={jenis} value={jenis}>{jenis}</option>
            ))}
          </select>
        </div>
        <div className="rw-export">
          <span className="rw-count">Menampilkan {filteredData.length} dari {data.length} total surat</span>
          <select className="select rw-select" value={exportRange} onChange={(e) => setExportRange(e.target.value)} aria-label="Rentang rekap">
            <option value="hari_ini">Hari Ini</option>
            <option value="7_hari">7 Hari Terakhir</option>
            <option value="1_bulan">1 Bulan Terakhir</option>
            <option value="semua">Semua Waktu</option>
          </select>
          <button type="button" className="btn btn-primary" onClick={handleExport}>
            <FileDown size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="card card-flush">
        <div className="table-responsive">
          <table className="table rw-table">
            <thead>
              <tr>
                <th>Pemohon</th>
                <th>Jenis Surat</th>
                <th>Nomor Surat</th>
                <th>Tanggal Pengajuan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">
                    <div className="loading">
                      <div className="loading-spinner" />
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : currentRows.length > 0 ? (
                currentRows.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>
                      <div className="cell-strong">{item.nama}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{maskNik(item.nik)}</div>
                    </td>
                    <td>{jenisPendek(item.jenis_surat)}</td>
                    <td className="cell-strong">{item.no_surat}</td>
                    <td>{formatTanggalSingkat(item.tanggal)}</td>
                    <td>
                      <div className="rw-action-btns">
                        <button
                          type="button"
                          title="Cetak Surat"
                          className="btn btn-outline btn-icon btn-sm"
                          onClick={() => handlePrint(item)}
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          type="button"
                          title="Unduh PDF"
                          className="btn btn-outline btn-icon btn-sm"
                          onClick={() => handleDownload(item)}
                          disabled={busy}
                        >
                          <Download size={15} />
                        </button>
                        <button
                          type="button"
                          title="Hapus Data (Demo)"
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
                      {searchTerm || filterJenis ? 'Tidak ada surat yang cocok dengan filter.' : 'Belum ada riwayat surat.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredData.length > 0 && (
          <div className="rw-pagination-bar">
            <span>Halaman {safePage} dari {totalPages}</span>
            <div className="rw-pages">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={safePage === 1 ? 15 : 18} strokeWidth={safePage === 1 ? 2 : 2.75} />
              </button>
              <button
                type="button"
                className="rw-page-btn active"
                aria-current="page"
              >
                {safePage}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={safePage === totalPages ? 15 : 18} strokeWidth={safePage === totalPages ? 2 : 2.75} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sumber dokumen tersembunyi untuk unduh PDF */}
      <div ref={docRef} style={{ position: 'fixed', left: '-9999px', top: 0, width: '800px' }}>
        {docItem && <div dangerouslySetInnerHTML={{ __html: buildLetterHTML(docItem) }} />}
      </div>

      {/* DEMO MODE: konfirmasi hapus riwayat */}
      <ConfirmModal
        open={Boolean(deleteItem)}
        title="Hapus data riwayat?"
        message={`Surat ${deleteItem?.no_surat || ''} atas nama ${deleteItem?.nama || '-'} akan dihapus dari penyimpanan browser (localStorage).`}
        confirmText={deleting ? 'Menghapus...' : 'Ya, Hapus'}
        cancelText="Batal"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setDeleteItem(null)}
      />
    </div>
  );
}
