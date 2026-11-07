
import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import html2pdf from 'html2pdf.js';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FileText,
  ClipboardList,
  BookUser,
  Contact,
  IdCard,
  Archive,
  Users,
  Plus,
  Inbox,
  RotateCcw,
  Printer,
  Download
} from 'lucide-react';

const CHART_COLORS = [
  '#0d9488',
  '#0284c7',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#475569',
  '#db2777'
];

const STAT_ICONS = [
  ClipboardList,
  BookUser,
  Contact,
  IdCard,
  Archive,
  Users,
  FileText
];

const STAT_VARIANTS = [
  '',
  'stat-icon--blue',
  'stat-icon--amber',
  'stat-icon--violet',
  'stat-icon--red',
  'stat-icon--cyan',
  'stat-icon--slate',
  'stat-icon--pink'
];

const formatTanggalPanjang = (isoString) => {
  if (!isoString) return '-';

  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// --- Surat arsip yang dicetak/diunduh ulang dari data riwayat ---
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

const toLocalISODate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const maskNik = (nik) => {
  if (!nik) return '-';

  const str = String(nik);

  if (str.length <= 8) return str;

  return `${str.slice(0, 6)}••••••${str.slice(-4)}`;
};

const getDefaultRange = () => {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), 1);

  return {
    dari: toLocalISODate(start),
    sampai: toLocalISODate(end)
  };
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [allRiwayat, setAllRiwayat] = useState([]);

  const [filterDari, setFilterDari] = useState(
    () => getDefaultRange().dari
  );

  const [filterSampai, setFilterSampai] = useState(
    () => getDefaultRange().sampai
  );

  const [docItem, setDocItem] = useState(null);
  const [busy, setBusy] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    totalBulanIni: 0,
    dynamicStats: [],
    recentActivities: []
  });

  const docRef = useRef(null);
  const pendingAction = useRef(null);

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  const fetchDashboardData = async () => {
    try {
      const { data: riwayat } = await api.getRiwayat();

      // --- 1. Filter Data Hanya untuk Bulan & Tahun Ini ---
      const sekarang = new Date();
      const bulanIni = sekarang.getMonth();
      const tahunIni = sekarang.getFullYear();

      const namaBulanIni = sekarang.toLocaleDateString('id-ID', {
        month: 'long'
      });

      const suratBulanIni = riwayat.filter((item) => {
        const tglSurat = new Date(item.tanggal);

        return (
          tglSurat.getMonth() === bulanIni &&
          tglSurat.getFullYear() === tahunIni
        );
      });

      const totalBulanIni = suratBulanIni.length;

      // --- 2. Hitung Jumlah per Jenis Surat Secara Dinamis ---
      const counts = {};

      suratBulanIni.forEach((item) => {
        const jenisBersih = item.jenis_surat.includes(' (')
          ? item.jenis_surat.split(' (')[0]
          : item.jenis_surat;

        counts[jenisBersih] = (counts[jenisBersih] || 0) + 1;
      });

      const dynamicStats = Object.keys(counts).map((key) => ({
        jenis: key,
        jumlah: counts[key]
      }));

      // --- 3. Simpan data mentah untuk tren dan pie chart ---
      setAllRiwayat(riwayat);

      // --- 4. Ambil 5 Aktivitas Terakhir ---
      const recentActivities = riwayat.slice(0, 5);

      setDashboardData({
        totalBulanIni,
        dynamicStats,
        recentActivities,
        namaBulanIni
      });

    } catch (error) {
      console.error('Gagal memuat data dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchDashboardData();
    };

    load();
  }, []);

  // ==========================================
  // DOWNLOAD PDF
  // ==========================================

  useEffect(() => {
    if (!docItem || pendingAction.current !== 'download') return;

    const run = async () => {
      setBusy(true);

      try {
        const safeNo = String(docItem.no_surat || 'surat')
          .replace(/[\\/]/g, '-')
          .replace(/\s+/g, '_');

        const safeNama = String(docItem.nama || '')
          .replace(/\s+/g, '_');

        await html2pdf()
          .set({
            margin: [15, 15, 15, 15],
            filename: `${safeNo}_${safeNama}.pdf`,
            image: {
              type: 'jpeg',
              quality: 0.98
            },
            html2canvas: {
              scale: 2,
              useCORS: true
            },
            jsPDF: {
              unit: 'mm',
              format: 'a4',
              orientation: 'portrait'
            }
          })
          .from(docRef.current)
          .save();

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

  // ==========================================
  // LINE CHART DATA
  // ==========================================

  const { trendData, trendTotal, trendError } = useMemo(() => {
    if (!filterDari || !filterSampai) {
      return {
        trendData: [],
        trendTotal: 0,
        trendError: ''
      };
    }

    const start = new Date(`${filterDari}T00:00:00`);
    const end = new Date(`${filterSampai}T00:00:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        trendData: [],
        trendTotal: 0,
        trendError: 'Tanggal tidak valid.'
      };
    }

    if (start > end) {
      return {
        trendData: [],
        trendTotal: 0,
        trendError: 'Tanggal "Dari" tidak boleh lebih besar dari "Sampai".'
      };
    }

    // Batasi maksimal 62 hari agar chart tetap terbaca
    const diffDays = Math.round((end - start) / 86400000) + 1;

    if (diffDays > 62) {
      return {
        trendData: [],
        trendTotal: 0,
        trendError: 'Rentang maksimal 62 hari. Perkecil filter tanggal.'
      };
    }

    const counts = {};

    allRiwayat.forEach((item) => {
      const tgl = new Date(item.tanggal);

      if (isNaN(tgl.getTime())) return;

      const key = toLocalISODate(tgl);

      counts[key] = (counts[key] || 0) + 1;
    });

    const data = [];
    let total = 0;

    const cursor = new Date(start);

    while (cursor <= end) {
      const key = toLocalISODate(cursor);
      const jumlah = counts[key] || 0;

      total += jumlah;

      data.push({
        name: cursor.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short'
        }),
        jumlah,
        fullDate: cursor.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      trendData: data,
      trendTotal: total,
      trendError: ''
    };

  }, [allRiwayat, filterDari, filterSampai]);

  const handleResetTrendFilter = () => {
    const def = getDefaultRange();

    setFilterDari(def.dari);
    setFilterSampai(def.sampai);
  };

  // ==========================================
  // PIE CHART DATA
  // ==========================================

  const categoryData = useMemo(() => {
    if (trendError || !filterDari || !filterSampai) return [];

    const start = new Date(`${filterDari}T00:00:00`);
    const endExclusive = new Date(`${filterSampai}T00:00:00`);

    endExclusive.setDate(endExclusive.getDate() + 1);

    const categories = {};

    allRiwayat.forEach((item) => {
      const tgl = new Date(item.tanggal);

      if (
        isNaN(tgl.getTime()) ||
        tgl < start ||
        tgl >= endExclusive
      ) {
        return;
      }

      const jenis = item.jenis_surat.includes(' (')
        ? item.jenis_surat.split(' (')[0]
        : item.jenis_surat;

      categories[jenis] = (categories[jenis] || 0) + 1;
    });

    return Object.keys(categories).map((key) => ({
      name: key,
      value: categories[key]
    }));

  }, [allRiwayat, filterDari, filterSampai, trendError]);

  // ==========================================
  // PRINT LETTER
  // ==========================================

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
            body {
              font-family: "Times New Roman", Times, serif;
              line-height: 1.5;
              color: black;
              padding: 10mm;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            td {
              vertical-align: top;
            }

            p {
              margin: 0;
            }
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

  const formatTanggal = (isoString) => {
    if (!isoString) return '-';

    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        Memuat data dashboard...
      </div>
    );
  }

  // ==========================================
  // DASHBOARD VIEW
  // ==========================================

  return (
    <div className="dashboard-page" style={{ width: '100%' }}>

      {/* --- HEADER --- */}

      <div className="page-header page-header--single">
        <div>
          <h2 className="page-title">
            Dashboard Administrasi Desa
          </h2>

          <p className="page-subtitle">
            Statistik berjalan untuk bulan{' '}
            <strong>
              {dashboardData.namaBulanIni} {new Date().getFullYear()}
            </strong>
          </p>
        </div>
      </div>

      {/* ==========================================
          SECTION 1: INFO CARDS
      ========================================== */}

      <div className="stat-grid">

        {/* Buat Surat */}

        <div className="stat-card stat-action-card">
          <span className="stat-icon">
            <Plus size={22} />
          </span>

          <div className="stat-body">
            <div className="stat-label">
              Buat surat keterangan baru
            </div>

            <Link
              to="/buat-surat"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 8 }}
            >
              Buat Surat
            </Link>
          </div>
        </div>

        {/* Total Surat */}

        <div className="stat-card">
          <span className="stat-icon">
            <FileText size={22} />
          </span>

          <div className="stat-body">
            <div className="stat-label">
              Total Surat Terbuat
            </div>

            <div className="stat-value">
              {dashboardData.totalBulanIni}
            </div>
          </div>
        </div>

        {/* Statistik Dinamis */}

        {dashboardData.dynamicStats.map((item, index) => {
          const Icon = STAT_ICONS[index % STAT_ICONS.length];
          const variant = STAT_VARIANTS[index % STAT_VARIANTS.length];

          return (
            <div className="stat-card" key={index}>
              <span className={`stat-icon ${variant}`}>
                <Icon size={22} />
              </span>

              <div className="stat-body">
                <div
                  className="stat-label"
                  title={item.jenis}
                >
                  {item.jenis}
                </div>

                <div className="stat-value">
                  {item.jumlah}
                </div>
              </div>
            </div>
          );
        })}

      </div>

      {/* ==========================================
          SECTION 2: CHARTS
      ========================================== */}

      <div className="dashboard-grid">

        {/* ==========================================
            LINE CHART
        ========================================== */}

        <div className="card dashboard-main">

          <div className="card-head card-head--wrap">

            <div>
              <h3 className="card-title">
                Tren Pembuatan Surat
              </h3>

              <p className="trend-subtitle">
                {trendError
                  ? trendError
                  : `${trendTotal} surat pada ${trendData.length} hari`}
              </p>
            </div>

            {/* Filter Tanggal */}

            <div className="trend-filter">

              <div className="trend-filter-field">
                <label htmlFor="trend-dari">
                  Dari
                </label>

                <input
                  id="trend-dari"
                  type="date"
                  className="input input-sm trend-control"
                  value={filterDari}
                  max={filterSampai || undefined}
                  onChange={(e) => setFilterDari(e.target.value)}
                />
              </div>

              <span className="trend-filter-sep">
                –
              </span>

              <div className="trend-filter-field">
                <label htmlFor="trend-sampai">
                  Sampai
                </label>

                <input
                  id="trend-sampai"
                  type="date"
                  className="input input-sm trend-control"
                  value={filterSampai}
                  min={filterDari || undefined}
                  max={toLocalISODate(new Date())}
                  onChange={(e) => setFilterSampai(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm trend-control"
                onClick={handleResetTrendFilter}
                title="Reset ke bulan berjalan"
              >
                <RotateCcw size={14} />
                Reset
              </button>

            </div>
          </div>

          {/* Grafik Tren */}

          <div className="chart-box">

            {trendError ? (

              <div
                className="empty-state"
                style={{ height: '100%' }}
              >
                <Inbox size={32} />
                {trendError}
              </div>

            ) : trendData.length > 0 ? (

              <ResponsiveContainer>
                <LineChart
                  data={trendData}
                  margin={{
                    top: 5,
                    right: 20,
                    bottom: 5,
                    left: 0
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: '#64748b',
                      fontSize: 12
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: '#64748b',
                      fontSize: 12
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <RechartsTooltip
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullDate || ''
                    }
                    formatter={(value) => [
                      `${value} surat`,
                      'Jumlah'
                    ]}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                      boxShadow: '0 4px 14px rgba(15,23,42,.1)'
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="jumlah"
                    stroke="#0d9488"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: '#0d9488'
                    }}
                    activeDot={{ r: 6 }}
                  />

                </LineChart>
              </ResponsiveContainer>

            ) : (

              <div
                className="empty-state"
                style={{ height: '100%' }}
              >
                <Inbox size={32} />
                Belum ada data tren.
              </div>

            )}

          </div>
        </div>

        {/* ==========================================
            PIE CHART
        ========================================== */}

        <div className="dashboard-side">

          <div className="card">

            {/* Header Pie Chart */}

            <div className="card-head">
              <h3 className="card-title">
                Proporsi Jenis Surat
              </h3>

              <p
                className="trend-subtitle"
                style={{ margin: 0 }}
              >
                Sesuai rentang tanggal filter
              </p>
            </div>

            {/* Container Pie Chart */}

            <div
              className="chart-box-sm"
              style={{
                height: 'auto',
                minHeight: 0,
                overflow: 'visible'
              }}
            >

              {trendError ? (

                <div className="empty-state">
                  <Inbox size={32} />
                  {trendError}
                </div>

              ) : categoryData.length > 0 ? (

                <>

                  {/* DONUT CHART */}

                  <div
                    style={{
                      width: '100%',
                      height: 230
                    }}
                  >
                    <ResponsiveContainer>
                      <PieChart>

                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={76}
                          paddingAngle={4}
                          dataKey="value"
                        >

                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}

                        </Pie>

                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            fontSize: 12
                          }}
                        />

                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* CUSTOM LEGEND - 2 KOLOM */}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: '12px 10px',
                      padding: '12px 12px 18px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >

                    {categoryData.map((entry, index) => (

                      <div
                        key={`legend-${index}`}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 7,
                          minWidth: 0,
                          fontSize: 11,
                          lineHeight: 1.5,
                          color: CHART_COLORS[index % CHART_COLORS.length]
                        }}
                      >

                        {/* Indikator Warna */}

                        <span
                          style={{
                            width: 9,
                            height: 9,
                            minWidth: 9,
                            borderRadius: 2,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                            marginTop: 3
                          }}
                        />

                        {/* Nama Jenis Surat */}

                        <span
                          style={{
                            overflowWrap: 'anywhere',
                            wordBreak: 'normal'
                          }}
                        >
                          {entry.name}
                        </span>

                      </div>

                    ))}

                  </div>

                </>

              ) : (

                <div className="empty-state">
                  <Inbox size={32} />
                  Data masih kosong.
                </div>

              )}

            </div>
          </div>
        </div>

      </div>

      {/* ==========================================
          SECTION 3: AKTIVITAS TERAKHIR
      ========================================== */}

      <div className="card card-flush">

        <div className="card-head">

          <h3 className="card-title">
            Aktivitas Terakhir
          </h3>

          <Link
            to="/riwayat"
            className="card-link"
          >
            Lihat Semua &rarr;
          </Link>

        </div>

        <div className="table-responsive">

          <table className="table">

            <thead>
              <tr>
                <th>Pemohon</th>
                <th>Jenis Surat</th>
                <th>Nomor Surat</th>
                <th>Tanggal Pengajuan</th>
                <th className="cell-center">Aksi</th>
              </tr>
            </thead>

            <tbody>

              {dashboardData.recentActivities.length > 0 ? (

                dashboardData.recentActivities.map((item, index) => (

                  <tr key={index}>

                    <td>
                      <div className="cell-strong">
                        {item.nama}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)'
                        }}
                      >
                        {maskNik(item.nik)}
                      </div>
                    </td>

                    <td>
                      {item.jenis_surat.includes(' (')
                        ? item.jenis_surat.split(' (')[0]
                        : item.jenis_surat}
                    </td>

                    <td className="cell-strong">
                      {item.no_surat}
                    </td>

                    <td>
                      {formatTanggal(item.tanggal)}
                    </td>

                    <td className="cell-center">

                      <div
                        style={{
                          display: 'inline-flex',
                          gap: 6
                        }}
                      >

                        {/* Tombol Cetak */}

                        <button
                          type="button"
                          title="Cetak Surat"
                          className="btn btn-outline btn-icon btn-sm"
                          onClick={() => handlePrint(item)}
                        >
                          <Printer size={15} />
                        </button>

                        {/* Tombol Download */}

                        <button
                          type="button"
                          title="Unduh PDF"
                          className="btn btn-outline btn-icon btn-sm"
                          onClick={() => handleDownload(item)}
                          disabled={busy}
                        >
                          <Download size={15} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan="5">

                    <div
                      className="empty-state"
                      style={{ margin: 14 }}
                    >
                      <Inbox size={32} />
                      Belum ada aktivitas.
                    </div>

                  </td>
                </tr>

              )}

            </tbody>
          </table>

        </div>
      </div>

      {/* ==========================================
          DOKUMEN TERSEMBUNYI UNTUK UNDUH PDF
      ========================================== */}

      <div
        ref={docRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '800px'
        }}
      >
        {docItem && (
          <div
            dangerouslySetInnerHTML={{
              __html: buildLetterHTML(docItem)
            }}
          />
        )}
      </div>

    </div>
  );
}
