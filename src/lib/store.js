// ============================================================
// DEMO MODE - Penyimpanan data memakai localStorage
// (menggantikan database MySQL pada versi asli)
// ============================================================

export const KEY = {
  riwayat: 'demo:riwayat',
  warga: 'demo:warga',
  petugas: 'demo:petugas',
  seeded: 'demo:seeded',
};

export const read = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// ------------------------------------------------------------
// Data contoh untuk keperluan demo
// ------------------------------------------------------------

const PETUGAS_SEED = [
  { username: 'admin', password: 'desa123', nama: 'Administrator Desa', role: 'Admin' },
  { username: 'operator', password: 'desa123', nama: 'Siti Aminah', role: 'Operator' },
];

const WARGA_SEED = [
  {
    nik: '3327101201850004',
    nama: 'Ahmad Rizki Setiawan',
    tempatLahir: 'Pemalang',
    tanggalLahir: '1985-12-01',
    pekerjaan: 'Petani',
    alamat: 'RT 02 RW 03 Desa Cangak, Kec. Bodeh, Kab. Pemalang',
    status: 'Aktif',
  },
  {
    nik: '3327105501900007',
    nama: 'Siti Aminah',
    tempatLahir: 'Pemalang',
    tanggalLahir: '1990-01-15',
    pekerjaan: 'Ibu Rumah Tangga',
    alamat: 'RT 01 RW 01 Desa Cangak, Kec. Bodeh, Kab. Pemalang',
    status: 'Aktif',
  },
  {
    nik: '3327102201780012',
    nama: 'Budi Santoso',
    tempatLahir: 'Tegal',
    tanggalLahir: '1978-03-22',
    pekerjaan: 'Wiraswasta',
    alamat: 'RT 04 RW 02 Desa Cangak, Kec. Bodeh, Kab. Pemalang',
    status: 'Aktif',
  },
  {
    nik: '3327104501950021',
    nama: 'Dewi Lestari',
    tempatLahir: 'Pemalang',
    tanggalLahir: '1995-05-05',
    pekerjaan: 'Guru',
    alamat: 'RT 05 RW 04 Desa Cangak, Kec. Bodeh, Kab. Pemalang',
    status: 'Aktif',
  },
  {
    nik: '3327101001720009',
    nama: 'H. Sumarno',
    tempatLahir: 'Purbalingga',
    tanggalLahir: '1972-04-10',
    pekerjaan: 'Pedagang',
    alamat: 'RT 03 RW 05 Desa Cangak, Kec. Bodeh, Kab. Pemalang',
    status: 'Aktif',
  },
  {
    nik: '3327106001990033',
    nama: 'Rina Marlina',
    tempatLahir: 'Pemalang',
    tanggalLahir: '1999-07-20',
    pekerjaan: 'Karyawan Swasta',
    alamat: 'RT 02 RW 01 Desa Cangak, Kec. Bodeh, Kab. Pemalang',
    status: 'Pindah',
  },
];

// [hari lalu, jenis surat, index warga]
const RIWAYAT_SEED = [
  [0, 'Surat Keterangan Tidak Mampu (SKTM)', 0],
  [0, 'Surat Pengantar KTP', 2],
  [1, 'Surat Keterangan Domisili', 4],
  [2, 'Surat Keterangan Usaha (SKU)', 2],
  [3, 'Surat Keterangan Pekerjaan', 3],
  [4, 'Surat Pengantar Kartu Keluarga (KK)', 1],
  [6, 'Surat Keterangan Penghasilan', 3],
  [8, 'Surat Keterangan Tidak Mampu (SKTM)', 4],
  [10, 'Surat Pengantar KTP', 5],
  [12, 'Surat Keterangan Kelahiran', 1],
  [14, 'Surat Keterangan Domisili', 0],
  [17, 'Surat Keterangan Usaha (SKU)', 4],
  [20, 'Surat Keterangan Kematian', 5],
  [24, 'Surat Keterangan Pekerjaan', 2],
  [27, 'Surat Keterangan Tidak Mampu (SKTM)', 1],
];

const ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const kodeSurat = (jenis) => {
  if (jenis.includes('Tidak Mampu')) return 'SKTM';
  if (jenis.includes('Penghasilan')) return 'SKPH';
  if (jenis.includes('Pekerjaan')) return 'SKP';
  if (jenis.includes('Usaha')) return 'SKU';
  if (jenis.includes('Domisili')) return 'SKD';
  if (jenis.includes('Pindah')) return 'SKPD';
  if (jenis.includes('Kelahiran')) return 'SKL';
  if (jenis.includes('Kematian')) return 'SKM';
  if (jenis.includes('Kartu Keluarga')) return 'SP-KK';
  if (jenis.includes('KTP')) return 'SP-KTP';
  return 'SUKET';
};

const buildSeedRiwayat = () => {
  const today = new Date();
  const counters = {};
  const items = RIWAYAT_SEED.map(([hariLalu, jenisSurat, wargaIndex], i) => {
    const tanggal = new Date(today);
    tanggal.setDate(today.getDate() - hariLalu);
    tanggal.setHours(9 + (i % 7), (i * 7) % 60, 0, 0);

    const key = `${jenisSurat}|${tanggal.getFullYear()}|${tanggal.getMonth()}`;
    counters[key] = (counters[key] || 0) + 1;
    const no = String(counters[key]).padStart(3, '0');
    const noSurat = `${no} / ${kodeSurat(jenisSurat)} / ${ROMAWI[tanggal.getMonth()]} / ${tanggal.getFullYear()}`;

    const warga = WARGA_SEED[wargaIndex];
    return {
      id: uid(),
      no_surat: noSurat,
      nik: warga.nik,
      nama: warga.nama,
      jenis_surat: jenisSurat,
      petugas: i % 3 === 0 ? 'Siti Aminah' : 'Administrator Desa',
      tanggal: tanggal.toISOString(),
    };
  });

  // Terbaru di urutan atas (sesuai ORDER BY tanggal DESC)
  return items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
};

// Isi data contoh hanya sekali saat pertama kali dibuka.
export const ensureSeed = () => {
  if (localStorage.getItem(KEY.seeded)) return;
  write(KEY.petugas, PETUGAS_SEED);
  write(KEY.warga, WARGA_SEED);
  write(KEY.riwayat, buildSeedRiwayat());
  localStorage.setItem(KEY.seeded, '1');
};

// Hapus seluruh data demo lalu muat ulang halaman.
export const resetDemoData = () => {
  Object.values(KEY).forEach((k) => localStorage.removeItem(k));
  ['isLoggedIn', 'token', 'user'].forEach((k) => localStorage.removeItem(k));
  window.location.reload();
};
