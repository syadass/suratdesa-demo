import { useState, useRef, useEffect } from 'react';
// DEMO MODE: backend digantikan lapisan localStorage
import { api } from '../lib/api';
import html2pdf from 'html2pdf.js';
import { FileText, Eye, Printer, Download, RotateCcw, RefreshCw, Inbox } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const NAMA_DESA = 'Cangak';
const ALAMAT_MAX = 255;
const KETERANGAN_MAX = 500;

const PEKERJAAN_OPTIONS = [
  'Petani', 'Pedagang', 'Wiraswasta', 'Karyawan Swasta', 'Buruh',
  'Nelayan', 'Guru', 'Tenaga Kesehatan', 'PNS', 'TNI/Polri',
  'Perangkat Desa', 'Ibu Rumah Tangga', 'Pelajar/Mahasiswa', 'Tidak Bekerja',
];

// Isi keterangan bawaan per jenis surat (bisa diubah manual).
const KETERANGAN_DEFAULT = {
  'Tidak Mampu': 'Yang bersangkutan benar merupakan warga kami dan berdasarkan data serta hasil verifikasi pemerintah desa, termasuk dalam keluarga kurang mampu.',
  'Penghasilan': 'Yang bersangkutan benar merupakan warga kami dan berdasarkan data yang dapat diverifikasi, memiliki penghasilan tetap per bulan sebagaimana tercatat pada data desa.',
  'Pekerjaan': 'Yang bersangkutan benar merupakan warga kami dan berdasarkan data yang dapat diverifikasi, bekerja sebagaimana tercatat pada data desa.',
  'Usaha': 'Yang bersangkutan benar merupakan warga kami dan memiliki usaha sebagaimana tercatat pada data desa.',
  'Domisili': 'Yang bersangkutan benar berdomisili di alamat tersebut di atas berdasarkan data kependudukan desa.',
  'Pindah': 'Yang bersangkutan benar merupakan warga kami yang akan pindah tempat tinggal berdasarkan data yang dapat diverifikasi.',
  'Kelahiran': 'Data kelahiran tersebut benar tercatat berdasarkan keterangan pelapor yang merupakan warga kami.',
  'Kematian': 'Yang bersangkutan benar merupakan warga kami yang telah meninggal dunia berdasarkan keterangan pelapor.',
  'KTP': 'Yang bersangkutan benar merupakan warga kami dan diberikan surat pengantar ini untuk pengurusan administrasi kependudukan.',
  'Kartu Keluarga': 'Yang bersangkutan benar merupakan warga kami dan diberikan surat pengantar ini untuk pengurusan administrasi kependudukan.',
};

const getKeteranganDefault = (jenisFinal) => {
  if (!jenisFinal) return '';
  for (const key of Object.keys(KETERANGAN_DEFAULT)) {
    if (jenisFinal.includes(key)) return KETERANGAN_DEFAULT[key];
  }
  return 'Yang bersangkutan benar merupakan warga kami berdasarkan data yang dapat diverifikasi.';
};

const INITIAL_FORM = {
  jenisSurat: '',
  jenisSuratLainnya: '',
  noUrut: '',
  nama: '',
  nik: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: '',
  alamat: '',
  keterangan: '',
  // --- Data tambahan (kondisional per jenis surat) ---
  pekerjaan: '',
  penghasilan: '',
  jabatan: '',
  tempatBekerja: '',
  namaUsaha: '',
  jenisUsaha: '',
  alamatUsaha: '',
  alamatAsal: '',
  alamatTujuan: '',
  tanggalPindah: '',
  lamaMenetap: '',
  namaAyah: '',
  namaIbu: '',
  tanggalMeninggal: '',
  tempatMeninggal: '',
  keperluan: '',
};

const EXTRA_AWAL = {
  pekerjaan: '', penghasilan: '', jabatan: '', tempatBekerja: '',
  namaUsaha: '', jenisUsaha: '', alamatUsaha: '', alamatAsal: '',
  alamatTujuan: '', tanggalPindah: '', lamaMenetap: '',
  namaAyah: '', namaIbu: '', tanggalMeninggal: '', tempatMeninggal: '',
};

// Tanda bintang merah untuk field wajib (selalu sinkron dengan validasi).
const Req = () => <span className="required" aria-hidden="true">*</span>;

export default function BuatSurat() {
  const [formData, setFormData] = useState(INITIAL_FORM);

  const [lookup, setLookup] = useState('idle'); // idle | searching | found | notfound
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [nikError, setNikError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const printRef = useRef();
  const lastSearchedNik = useRef('');

  const getJenisSuratFinal = () => {
    return formData.jenisSurat === 'Lainnya' ? formData.jenisSuratLainnya : formData.jenisSurat;
  };

  // --- Penanda jenis surat aktif (satu-satunya acuan tampil/sembunyi field) ---
  const jenisFinal = getJenisSuratFinal();
  const isSKTM = jenisFinal.includes('Tidak Mampu');
  const isPenghasilan = jenisFinal.includes('Penghasilan');
  const isPekerjaan = jenisFinal.includes('Pekerjaan');
  const isUsaha = jenisFinal.includes('Usaha');
  const isDomisili = jenisFinal.includes('Domisili');
  const isPindah = jenisFinal.includes('Pindah');
  const isKelahiran = jenisFinal.includes('Kelahiran');
  const isKematian = jenisFinal.includes('Kematian');

  // --- Nomor urut otomatis per jenis surat, bulan berjalan ---
  const fetchNoUrut = async (jenisAktif) => {
    if (!jenisAktif) {
      setFormData(prev => ({ ...prev, noUrut: '' }));
      return;
    }
    try {
      const { data: riwayat } = await api.getRiwayat();
      const bulanIni = new Date().getMonth();
      const tahunIni = new Date().getFullYear();
      const jumlahSuratBulanIni = riwayat.filter(item => {
        const tglSurat = new Date(item.tanggal);
        const jenisDb = item.jenis_surat.includes(' (') ? item.jenis_surat.split(' (')[0] : item.jenis_surat;
        const jenisForm = jenisAktif.includes(' (') ? jenisAktif.split(' (')[0] : jenisAktif;
        return (
          tglSurat.getMonth() === bulanIni &&
          tglSurat.getFullYear() === tahunIni &&
          jenisDb.toLowerCase() === jenisForm.toLowerCase()
        );
      }).length;
      const nextNo = String(jumlahSuratBulanIni + 1).padStart(3, '0');
      setFormData(prev => ({ ...prev, noUrut: nextNo }));
    } catch (error) {
      console.error('Gagal mengambil nomor urut:', error);
      setFormData(prev => ({ ...prev, noUrut: '001' }));
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchNoUrut(jenisFinal), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.jenisSurat, formData.jenisSuratLainnya]);

  // --- Cari otomatis data warga saat NIK 16 digit lengkap ---
  useEffect(() => {
    if (formData.nik.length !== 16 || lastSearchedNik.current === formData.nik) return;
    lastSearchedNik.current = formData.nik;
    const cari = async () => {
      setLookup('searching');
      try {
        const response = await api.getWarga(formData.nik);
        if (response.data) {
          let tglLahir = response.data.tanggalLahir || response.data.tanggal_lahir || '';
          if (tglLahir && tglLahir.includes('T')) tglLahir = tglLahir.split('T')[0];
          setFormData(prev => ({
            ...prev,
            nama: response.data.nama || prev.nama,
            tempatLahir: response.data.tempatLahir || response.data.tempat_lahir || prev.tempatLahir,
            tanggalLahir: tglLahir || prev.tanggalLahir,
            alamat: response.data.alamat || prev.alamat,
            pekerjaan: response.data.pekerjaan || prev.pekerjaan,
          }));
          setLookup('found');
        }
      } catch {
        setLookup('notfound');
      }
    };
    const t = setTimeout(cari, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.nik]);

  const getBulanRomawi = () => {
    const romawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return romawi[new Date().getMonth()];
  };

  const getKodeSurat = () => {
    const jenis = jenisFinal;
    if (!jenis) return 'SUKET';
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

  const noSuratLengkap = `${formData.noUrut || '...'} / ${getKodeSurat()} / ${getBulanRomawi()} / ${new Date().getFullYear()}`;

  const formatTglSingkat = (dateString) => {
    if (!dateString) return '-';
    const [y, m, d] = dateString.split('-');
    if (y && m && d) return `${d}-${m}-${y}`;
    return dateString;
  };

  const formatTglPanjang = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // --- Baris biodata tambahan pada pratinjau sesuai jenis surat ---
  const getBarisTambahan = () => {
    const rows = [];
    if ((isSKTM || isPenghasilan || isPekerjaan) && formData.pekerjaan) {
      rows.push(['Pekerjaan', formData.pekerjaan]);
    }
    if (isPekerjaan) {
      if (formData.jabatan) rows.push(['Jabatan', formData.jabatan]);
      if (formData.tempatBekerja) rows.push(['Tempat Bekerja', formData.tempatBekerja]);
    }
    if ((isSKTM || isPenghasilan) && formData.penghasilan) {
      rows.push(['Penghasilan per Bulan', `Rp ${formData.penghasilan}`]);
    }
    if (isUsaha) {
      if (formData.namaUsaha) rows.push(['Nama Usaha', formData.namaUsaha]);
      if (formData.jenisUsaha) rows.push(['Bidang Usaha', formData.jenisUsaha]);
      if (formData.alamatUsaha) rows.push(['Alamat Usaha', formData.alamatUsaha]);
    }
    if (isDomisili && formData.lamaMenetap.trim()) rows.push(['Lama Menetap', formData.lamaMenetap]);
    if (isPindah) {
      if (formData.alamatAsal) rows.push(['Alamat Asal', formData.alamatAsal]);
      if (formData.alamatTujuan) rows.push(['Alamat Tujuan', formData.alamatTujuan]);
      if (formData.tanggalPindah) rows.push(['Tanggal Pindah', formatTglPanjang(formData.tanggalPindah)]);
    }
    if (isKelahiran) {
      if (formData.namaAyah) rows.push(['Nama Ayah', formData.namaAyah]);
      if (formData.namaIbu) rows.push(['Nama Ibu', formData.namaIbu]);
    }
    if (isKematian) {
      if (formData.tanggalMeninggal) rows.push(['Tanggal Meninggal', formatTglPanjang(formData.tanggalMeninggal)]);
      if (formData.tempatMeninggal) rows.push(['Tempat Meninggal', formData.tempatMeninggal]);
    }
    return rows;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Ganti jenis surat: isi keterangan bawaan + bersihkan data tambahan.
    if (name === 'jenisSurat') {
      const finalBaru = value === 'Lainnya' ? formData.jenisSuratLainnya : value;
      setFormData(prev => ({
        ...prev,
        jenisSurat: value,
        jenisSuratLainnya: '',
        keterangan: getKeteranganDefault(finalBaru),
        ...EXTRA_AWAL,
      }));
    } else if (name === 'jenisSuratLainnya') {
      setFormData(prev => ({ ...prev, jenisSuratLainnya: value, keterangan: getKeteranganDefault(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setIsSaved(false);
  };

  // NIK disimpan sebagai string agar nol di awal tidak hilang.
  const handleNikChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    setFormData(prev => ({ ...prev, nik: value }));
    setNikError('');
    setLookup('idle');
    setIsSaved(false);
  };

  // Validasi sesuai bintang merah pada form (wajib = benar-benar divalidasi).
  const validateForm = () => {
    if (!formData.jenisSurat) return 'Silakan pilih jenis surat terlebih dahulu.';
    if (formData.jenisSurat === 'Lainnya' && !formData.jenisSuratLainnya.trim()) {
      return 'Silakan isi jenis surat terlebih dahulu.';
    }
    if (!formData.nama.trim()) return 'Nama lengkap wajib diisi.';
    if (!/^\d{16}$/.test(formData.nik)) return 'NIK harus terdiri dari 16 digit angka.';
    if (!formData.tempatLahir.trim()) return 'Tempat lahir wajib diisi.';
    if (!formData.tanggalLahir) return 'Tanggal lahir wajib diisi.';
    if (!formData.jenisKelamin) return 'Silakan pilih jenis kelamin.';
    if (!formData.alamat.trim()) return 'Alamat wajib diisi.';
    if (!formData.keterangan.trim()) return 'Keterangan wajib diisi.';
    if ((isSKTM || isPenghasilan || isPekerjaan) && !formData.pekerjaan) return 'Pekerjaan wajib diisi untuk jenis surat ini.';
    if (isPenghasilan && !formData.penghasilan.trim()) return 'Penghasilan per bulan wajib diisi untuk Surat Keterangan Penghasilan.';
    if (isPekerjaan && !formData.tempatBekerja.trim()) return 'Tempat bekerja wajib diisi untuk Surat Keterangan Pekerjaan.';
    if (isUsaha) {
      if (!formData.namaUsaha.trim()) return 'Nama usaha wajib diisi.';
      if (!formData.jenisUsaha.trim()) return 'Bidang usaha wajib diisi.';
      if (!formData.alamatUsaha.trim()) return 'Alamat usaha wajib diisi.';
    }
    if (isDomisili && !formData.lamaMenetap.trim()) return 'Lama tinggal wajib diisi untuk Surat Keterangan Domisili.';
    if (isPindah) {
      if (!formData.alamatAsal.trim()) return 'Alamat asal wajib diisi.';
      if (!formData.alamatTujuan.trim()) return 'Alamat tujuan wajib diisi.';
      if (!formData.tanggalPindah) return 'Tanggal pindah wajib diisi.';
    }
    if (isKelahiran) {
      if (!formData.namaAyah.trim()) return 'Nama ayah wajib diisi untuk Surat Keterangan Kelahiran.';
      if (!formData.namaIbu.trim()) return 'Nama ibu wajib diisi untuk Surat Keterangan Kelahiran.';
    }
    if (isKematian) {
      if (!formData.tanggalMeninggal) return 'Tanggal meninggal wajib diisi.';
      if (!formData.tempatMeninggal.trim()) return 'Tempat meninggal wajib diisi.';
    }
    return '';
  };

  const simpanKeDatabase = async () => {
    if (isSaved) return;
    const userStorage = localStorage.getItem('user');
    const namaPetugas = userStorage ? JSON.parse(userStorage).nama : 'Petugas Desa';
    await api.createRiwayat({
      no_surat: noSuratLengkap,
      nik: formData.nik,
      nama: formData.nama,
      jenis_surat: jenisFinal,
      petugas: namaPetugas,
    });
    setIsSaved(true);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setLookup('idle');
    setIsSaved(false);
    setNikError('');
    setConfirmReset(false);
    setShowPreview(false);
  };

  const handleLihatPratinjau = (e) => {
    e.preventDefault();
    setShowPreview(true);
    requestAnimationFrame(() => {
      document.querySelector('.preview-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const hasContent = Boolean(
    formData.nama.trim() || formData.nik.trim() || jenisFinal
  );

  const handlePerbaruiPratinjau = () => {
    fetchNoUrut(jenisFinal);
  };

  const handleDownload = async () => {
    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }
    setIsDownloading(true);
    try {
      await simpanKeDatabase();
      const element = printRef.current;
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `${jenisFinal}_${formData.nama.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(element).save();
      alert('Data riwayat disimpan dan PDF berhasil diunduh.');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan riwayat atau mengunduh PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }
    setIsPrinting(true);
    try {
      await simpanKeDatabase();
      const biodata = [
        ['Nama', `<span style="text-transform:uppercase;font-weight:bold;">${formData.nama || '-'}</span>`],
        ['NIK', formData.nik || '-'],
        ['Tempat &amp; Tanggal lahir', `${formData.tempatLahir || '-'}, ${formatTglPanjang(formData.tanggalLahir)}`],
        ['Jenis Kelamin', formData.jenisKelamin || '-'],
        ['Alamat tempat tinggal', formData.alamat || '-'],
        ...barisTambahan,
      ];
      const bodyRows = biodata.map(([label, nilai], i) =>
        `<tr><td style="width:5%;vertical-align:top;">${i + 1}.</td><td style="width:35%;vertical-align:top;">${label}</td><td style="width:2%;vertical-align:top;">:</td><td>${nilai || '-'}</td></tr>`
      ).join('');
      const ketNo = biodata.length + 1;
      const letterHTML = `
        <div style="background:white;padding:40px;font-family:'Times New Roman',Times,serif;line-height:1.5;color:black;">
          <div style="display:flex;align-items:center;margin-bottom:2px;">
            <div style="width:80px;height:90px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;margin-right:15px;font-size:10px;text-align:center;">[LOGO]</div>
            <div style="flex:1;text-align:center;">
              <h3 style="margin:0;font-size:20px;text-transform:uppercase;letter-spacing:1px;">PEMERINTAH KABUPATEN PEMALANG</h3>
              <h3 style="margin:0;font-size:20px;text-transform:uppercase;letter-spacing:1px;">KECAMATAN BODEH</h3>
              <h2 style="margin:0;font-size:22px;text-transform:uppercase;letter-spacing:2px;">DESA ${NAMA_DESA.toUpperCase()}</h2>
            </div>
          </div>
          <div style="text-align:center;margin-bottom:5px;">
            <p style="margin:0;font-size:12px;font-style:italic;">Sekretariat : Jl Raya ${NAMA_DESA} No 2009 Kec. Bodeh Kab. Pemalang Kode Pos, 52365</p>
            <p style="margin:0;font-size:12px;font-style:italic;">Email : cangak@desakupemalang.id Web : https://cangak.desa.id</p>
          </div>
          <div style="border-bottom:1px solid black;margin-bottom:1px;"></div>
          <div style="border-bottom:3px solid black;margin-bottom:30px;"></div>
          <div style="text-align:center;margin-bottom:20px;">
            <h3 style="margin:0;text-transform:uppercase;text-decoration:underline;font-size:16px;">${jenisFinal}</h3>
            <p style="margin:0;font-size:15px;">Nomor : ${noSuratLengkap}</p>
          </div>
          <div style="text-align:justify;margin-bottom:20px;font-size:15px;">
            <p style="text-indent:40px;margin-bottom:5px;">Yang bertanda tangan dibawah ini Kepala Desa ${NAMA_DESA}, Kecamatan Bodeh Kabupaten Pemalang Propinsi Jawa tengah.</p>
            <p style="margin-bottom:15px;">Dengan ini menerangkan yang sebenarnya bahwa :</p>
            <table style="width:100%;border-collapse:collapse;"><tbody>
              ${bodyRows}
              <tr><td style="vertical-align:top;padding-top:10px;">${ketNo}.</td><td style="vertical-align:top;padding-top:10px;">Keterangan</td><td style="vertical-align:top;padding-top:10px;">:</td><td style="padding-top:10px;text-align:justify;">${formData.keterangan || getKeteranganDefault(jenisFinal) || '-'}</td></tr>
            </tbody></table>
            <p style="text-indent:40px;margin-top:20px;">Demikian surat keterangan ini dibuat dengan sebenarnya untuk digunakan sebagaimana mestinya.</p>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:30px;">
            <div style="text-align:center;width:250px;">
              <p style="margin:0;">${NAMA_DESA}, ${hariIni}</p>
              <p style="margin:0;margin-bottom:70px;">Kepala Desa ${NAMA_DESA}</p>
              <p style="margin:0;font-weight:bold;text-decoration:underline;">ERWANTO, S.Pd</p>
            </div>
          </div>
        </div>
      `;
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Popup diblokir browser. Izinkan popup untuk mencetak.');
        return;
      }
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak ${jenisFinal}</title>
            <style>
              body { font-family: "Times New Roman", Times, serif; line-height: 1.5; color: black; padding: 10mm; }
              table { width: 100%; border-collapse: collapse; }
              td { vertical-align: top; }
              p { margin: 0; }
            </style>
          </head>
          <body>
            ${letterHTML}
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error(error);
      alert('Gagal memproses pencetakan surat.');
    } finally {
      setIsPrinting(false);
    }
  };

  const barisTambahan = getBarisTambahan();
  const hariIni = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="surat-page">
      <div className="page-head">
        <div className="heading">
          <div className="heading-icon"><FileText size={25} /></div>
          <div>
            <h1>Buat Surat</h1>
            <p>Lengkapi form sesuai jenis surat yang dipilih. Pastikan data yang diisi sudah benar.</p>
          </div>
        </div>
      </div>

      <div className="workspace">
        {/* KOLOM KIRI: FORMULIR */}
        <section className="panel form-panel">
          <div className="panel-head"><h2>Formulir Surat</h2></div>
          <form id="letterForm" className="form-body" onSubmit={handleLihatPratinjau}>
          {/* --- Jenis Surat --- */}
          <div className="section">
            <h3 className="section-title">Jenis Surat</h3>
            <div className="field">
              <label htmlFor="jenisSurat">Pilih jenis surat <Req /></label>
              <select id="jenisSurat" name="jenisSurat" value={formData.jenisSurat} onChange={handleChange} required>
                <option value="" disabled>-- Pilih jenis surat --</option>
                <optgroup label="Kesejahteraan dan Ekonomi">
                  <option value="Surat Keterangan Tidak Mampu (SKTM)">Surat Keterangan Tidak Mampu (SKTM)</option>
                  <option value="Surat Keterangan Penghasilan">Surat Keterangan Penghasilan</option>
                  <option value="Surat Keterangan Usaha (SKU)">Surat Keterangan Usaha (SKU)</option>
                </optgroup>
                <optgroup label="Administrasi Kependudukan">
                  <option value="Surat Keterangan Pekerjaan">Surat Keterangan Pekerjaan</option>
                  <option value="Surat Pengantar KTP">Surat Pengantar KTP</option>
                  <option value="Surat Pengantar Kartu Keluarga (KK)">Surat Pengantar Kartu Keluarga (KK)</option>
                  <option value="Surat Keterangan Domisili">Surat Keterangan Domisili</option>
                  <option value="Surat Keterangan Pindah Datang">Surat Keterangan Pindah Datang</option>
                </optgroup>
                <optgroup label="Pencatatan Sipil">
                  <option value="Surat Keterangan Kelahiran">Surat Keterangan Kelahiran</option>
                  <option value="Surat Keterangan Kematian">Surat Keterangan Kematian</option>
                </optgroup>
                <optgroup label="Lain-lain">
                  <option value="Lainnya">Lainnya (Ketik Manual)...</option>
                </optgroup>
              </select>
            </div>
            {formData.jenisSurat === 'Lainnya' && (
              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="jenisSuratLainnya">Ketik jenis surat <Req /></label>
                <input id="jenisSuratLainnya" type="text" name="jenisSuratLainnya" value={formData.jenisSuratLainnya} onChange={handleChange} placeholder="Contoh: Surat Keterangan Ahli Waris" required />
              </div>
            )}
          </div>

          {/* --- Data Warga --- */}
          <div className="section">
            <h3 className="section-title">Data Warga</h3>
            <div className="grid2">
              <div className="field">
                <label htmlFor="nama">Nama lengkap <Req /></label>
                <input id="nama" type="text" name="nama" value={formData.nama} onChange={handleChange} placeholder="Ahmad Rizki" required />
              </div>
              <div className="field">
                <label htmlFor="nik">NIK <Req /></label>
                <input
                  id="nik"
                  className="nik-input"
                  type="text"
                  name="nik"
                  value={formData.nik}
                  onChange={handleNikChange}
                  placeholder="3327101201050001"
                  inputMode="numeric"
                  pattern="[0-9]{16}"
                  maxLength={16}
                  autoComplete="off"
                  required
                  aria-describedby="nikHint"
                />
                <div className="hint" id="nikHint">
                  <span>
                    {lookup === 'searching' && 'Mencari data warga...'}
                    {lookup === 'found' && 'Data warga ditemukan dan diisi otomatis.'}
                    {lookup === 'notfound' && 'Data tidak ditemukan. Silakan isi form manual.'}
                    {lookup === 'idle' && '16 digit angka'}
                  </span>
                  <span>{formData.nik.length}/16</span>
                </div>
                {nikError && <span className="field-error">{nikError}</span>}
              </div>
              <div className="field">
                <label htmlFor="tempatLahir">Tempat lahir <Req /></label>
                <input id="tempatLahir" type="text" name="tempatLahir" value={formData.tempatLahir} onChange={handleChange} placeholder="Kendal" required />
              </div>
              <div className="field">
                <label htmlFor="tanggalLahir">Tanggal lahir <Req /></label>
                <input id="tanggalLahir" type="date" name="tanggalLahir" value={formData.tanggalLahir} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="jenisKelamin">Jenis kelamin <Req /></label>
                <select id="jenisKelamin" name="jenisKelamin" value={formData.jenisKelamin} onChange={handleChange} required>
                  <option value="" disabled>-- Pilih jenis kelamin --</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div className="field full">
                <label htmlFor="alamat">Alamat lengkap <Req /></label>
                <textarea
                  id="alamat"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  placeholder="RT 02 RW 03 Desa Mulyorejo, Kecamatan Patebon, Kabupaten Kendal"
                  rows="2"
                  maxLength={ALAMAT_MAX}
                  required
                ></textarea>
                <div className="hint"><span></span><span>{formData.alamat.length} karakter</span></div>
              </div>
            </div>
          </div>

          {/* --- Keterangan Surat (field dinamis per jenis surat) --- */}
          <div className="section">
            <h3 className="section-title">Keterangan Surat</h3>
            <div className="grid2">
              {(isSKTM || isPenghasilan || isPekerjaan) && (
                <div className="field">
                  <label htmlFor="pekerjaan">Pekerjaan <Req /></label>
                  <select id="pekerjaan" name="pekerjaan" value={formData.pekerjaan} onChange={handleChange} required>
                    <option value="" disabled>Pilih pekerjaan</option>
                    {PEKERJAAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
              {(isSKTM || isPenghasilan) && (
                <div className="field">
                  <label htmlFor="penghasilan">Penghasilan per bulan {isPenghasilan ? <Req /> : null}</label>
                  <input id="penghasilan" type="text" name="penghasilan" value={formData.penghasilan} onChange={handleChange} placeholder="Contoh: 500.000" inputMode="numeric" required={isPenghasilan} />
                </div>
              )}
              {isPekerjaan && (
                <>
                  <div className="field">
                    <label htmlFor="tempatBekerja">Tempat bekerja <Req /></label>
                    <input id="tempatBekerja" type="text" name="tempatBekerja" value={formData.tempatBekerja} onChange={handleChange} placeholder="Nama perusahaan/tempat kerja" required />
                  </div>
                  <div className="field">
                    <label htmlFor="jabatan">Jabatan (jika ada)</label>
                    <input id="jabatan" type="text" name="jabatan" value={formData.jabatan} onChange={handleChange} placeholder="Masukkan jabatan" />
                  </div>
                </>
              )}
              {isUsaha && (
                <>
                  <div className="field">
                    <label htmlFor="namaUsaha">Nama usaha <Req /></label>
                    <input id="namaUsaha" type="text" name="namaUsaha" value={formData.namaUsaha} onChange={handleChange} placeholder="Masukkan nama usaha" required />
                  </div>
                  <div className="field">
                    <label htmlFor="jenisUsaha">Jenis usaha <Req /></label>
                    <input id="jenisUsaha" type="text" name="jenisUsaha" value={formData.jenisUsaha} onChange={handleChange} placeholder="Masukkan jenis usaha" required />
                  </div>
                  <div className="field full">
                    <label htmlFor="alamatUsaha">Alamat usaha <Req /></label>
                    <input id="alamatUsaha" type="text" name="alamatUsaha" value={formData.alamatUsaha} onChange={handleChange} placeholder="Alamat usaha" required />
                  </div>
                </>
              )}
              {isDomisili && (
                <div className="field">
                  <label htmlFor="lamaMenetap">Lama tinggal <Req /></label>
                  <input id="lamaMenetap" type="text" name="lamaMenetap" value={formData.lamaMenetap} onChange={handleChange} placeholder="Contoh: sejak tahun 2020" required />
                </div>
              )}
              {isPindah && (
                <>
                  <div className="field">
                    <label htmlFor="alamatAsal">Alamat asal <Req /></label>
                    <input id="alamatAsal" type="text" name="alamatAsal" value={formData.alamatAsal} onChange={handleChange} placeholder="Alamat asal" required />
                  </div>
                  <div className="field">
                    <label htmlFor="alamatTujuan">Alamat tujuan <Req /></label>
                    <input id="alamatTujuan" type="text" name="alamatTujuan" value={formData.alamatTujuan} onChange={handleChange} placeholder="Alamat tujuan" required />
                  </div>
                  <div className="field">
                    <label htmlFor="tanggalPindah">Tanggal pindah <Req /></label>
                    <input id="tanggalPindah" type="date" name="tanggalPindah" value={formData.tanggalPindah} onChange={handleChange} required />
                  </div>
                </>
              )}
              {isKelahiran && (
                <>
                  <div className="field">
                    <label htmlFor="namaAyah">Nama ayah <Req /></label>
                    <input id="namaAyah" type="text" name="namaAyah" value={formData.namaAyah} onChange={handleChange} placeholder="Nama ayah" required />
                  </div>
                  <div className="field">
                    <label htmlFor="namaIbu">Nama ibu <Req /></label>
                    <input id="namaIbu" type="text" name="namaIbu" value={formData.namaIbu} onChange={handleChange} placeholder="Nama ibu" required />
                  </div>
                </>
              )}
              {isKematian && (
                <>
                  <div className="field">
                    <label htmlFor="tanggalMeninggal">Tanggal meninggal <Req /></label>
                    <input id="tanggalMeninggal" type="date" name="tanggalMeninggal" value={formData.tanggalMeninggal} onChange={handleChange} required />
                  </div>
                  <div className="field">
                    <label htmlFor="tempatMeninggal">Tempat meninggal <Req /></label>
                    <input id="tempatMeninggal" type="text" name="tempatMeninggal" value={formData.tempatMeninggal} onChange={handleChange} placeholder="Tempat meninggal" required />
                  </div>
                </>
              )}
              <div className="field full">
                <label htmlFor="keterangan">Keterangan <Req /></label>
                <textarea
                  id="keterangan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  placeholder={jenisFinal ? getKeteranganDefault(jenisFinal) : 'Pilih jenis surat terlebih dahulu...'}
                  rows="3"
                  maxLength={KETERANGAN_MAX}
                  required
                ></textarea>
                <div className="hint"><span>Isi otomatis mengikuti jenis surat dan dapat diubah manual.</span><span>{formData.keterangan.length} karakter</span></div>
              </div>
            </div>
          </div>

          {/* --- Aksi --- */}
          <div className="form-actions">
            <span className="required-note"><span className="required" aria-hidden="true">*</span> Wajib diisi</span>
            <div className="actions">
              <button type="button" className="btn" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={14} /> Reset
              </button>
              <button type="submit" className="btn primary">
                <Eye size={14} /> Lihat Pratinjau
              </button>
            </div>
          </div>
          </form>
        </section>

        {/* KOLOM KANAN: PRATINJAU */}
        <section className="panel preview-panel">
          <div className="panel-head preview-head">
            <div className="head-title"><span className="eye"><Eye size={16} /></span><h2>Pratinjau Surat</h2></div>
            <div className="surat-preview-tools">
              <button className="btn small" type="button" onClick={handlePerbaruiPratinjau} title="Perbarui nomor dan pratinjau">
                <RefreshCw size={13} /> Perbarui Pratinjau
              </button>
              <button type="button" className="btn btn-outline btn-icon btn-sm" onClick={handlePrint} disabled={isPrinting || isDownloading} title="Cetak surat">
                <Printer size={14} />
              </button>
              <button type="button" className="btn btn-outline btn-icon btn-sm" onClick={handleDownload} disabled={isDownloading || isPrinting} title="Unduh PDF">
                <Download size={14} />
              </button>
            </div>
          </div>
          <div className="preview-wrap">
            {showPreview && hasContent ? (
            <article className="paper" ref={printRef}>
              <div className="letter-head">
                <div className="emblem">✿</div>
                <div>
                  <strong>PEMERINTAH KABUPATEN PEMALANG<br />KECAMATAN BODEH<br />DESA {NAMA_DESA.toUpperCase()}</strong>
                  <div>Jl. Raya {NAMA_DESA} No. 2009 Kec. Bodeh Kab. Pemalang</div>
                </div>
              </div>
              <h2 className="letter-title">{(jenisFinal || 'SURAT KETERANGAN').toUpperCase()}</h2>
              <p className="letter-number">Nomor: <span>{noSuratLengkap}</span></p>
              <p className="letter-p">Yang bertanda tangan di bawah ini Kepala Desa {NAMA_DESA}, Kecamatan Bodeh, Kabupaten Pemalang, dengan ini menerangkan bahwa:</p>
              <table className="data-table">
                <tbody>
                  <tr><td>Nama Lengkap</td><td>:</td><td>{formData.nama || '—'}</td></tr>
                  <tr><td>NIK</td><td>:</td><td>{formData.nik || '—'}</td></tr>
                  <tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{formData.tempatLahir || '—'}, {formatTglPanjang(formData.tanggalLahir)}</td></tr>
                  <tr><td>Jenis Kelamin</td><td>:</td><td>{formData.jenisKelamin || '—'}</td></tr>
                  <tr><td>Alamat</td><td>:</td><td>{formData.alamat || '—'}</td></tr>
                  {barisTambahan.map(([label, nilai]) => (
                    <tr key={label}><td>{label}</td><td>:</td><td>{nilai}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="letter-p">{formData.keterangan || getKeteranganDefault(jenisFinal) || '...'}</p>
              <p className="letter-p">Demikian surat keterangan ini dibuat dengan sebenarnya untuk digunakan sebagaimana mestinya.</p>
              <div className="signature">
                <div>{NAMA_DESA}, {hariIni}</div>
                <div>Kepala Desa {NAMA_DESA}</div>
                <div className="sign-space"></div>
                <div className="sign-name">ERWANTO, S.Pd</div>
              </div>
            </article>
            ) : (
              <div className="empty-state" style={{ margin: 0 }}>
                <Inbox size={34} />
                <strong>Belum ada pratinjau</strong>
                <span>Isi formulir lalu klik &ldquo;Lihat Pratinjau&rdquo; untuk melihat hasil surat.</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <ConfirmModal
        open={confirmReset}
        title="Hapus semua isian?"
        message="Seluruh data yang diisi pada formulir akan dihapus dan tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        danger
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

// Ikon FileText tetap diekspor untuk kompatibilitas toolbar lama.
export { FileText };
