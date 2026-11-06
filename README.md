# Sistem Desa Digital — Versi DEMO

Versi demo dari sistem administrasi desa yang **berjalan sepenuhnya di browser tanpa backend**.
Tampilan, alur, dan fitur sama seperti aplikasi asli (`../frontend`), tetapi seluruh data
(login, riwayat surat, data warga) disimpan di **localStorage** sehingga bisa langsung dicoba
untuk input, cetak, unduh, dan export.

Folder ini mandiri: tidak mengubah apa pun pada `frontend/` maupun `backend/`.

## Menjalankan

```bash
cd demo
npm install     # cukup sekali
npm run dev     # buka http://localhost:5174
```

Opsional:

```bash
npm run build    # hasilnya di demo/dist
npm run preview  # pratinjau hasil build
```

Port sengaja `5174` supaya tidak bentrok dengan `npm run dev` di folder `frontend` (5173).

## Akun demo

| Username   | Password  | Nama               |
| ---------- | --------- | ------------------ |
| `admin`    | `desa123` | Administrator Desa |
| `operator` | `desa123` | Siti Aminah        |

Di halaman login tersedia tombol **Isi** untuk mengisi akun demo otomatis.

## Fitur yang bisa dicoba

- **Login** — verifikasi akun dari localStorage, sesi tersimpan seperti aslinya.
- **Dashboard** — statistik bulan berjalan, tren harian, pie jenis surat, aktivitas terakhir
  (semua dihitung dari data demo yang tersimpan).
- **Buat Surat** — pilih jenis surat, validasi form, **auto-isi data warga lewat NIK 16 digit**,
  nomor urut otomatis per jenis/bulan, pratinjau, **cetak**, dan **unduh PDF**.
  Setiap surat yang dicetak/diunduh otomatis tersimpan ke riwayat.
- **Riwayat Surat** — pencarian, filter jenis, paginasi, cetak ulang, unduh PDF,
  export CSV (Excel), dan **hapus data** (khusus demo).
- **Data Warga** (halaman baru khusus demo) — tambah / ubah / hapus data warga.
  NIK yang didaftarkan di sini akan terisi otomatis pada form Buat Surat.
- **Reset Data Demo** — tombol di sidebar untuk mengembalikan seluruh data ke kondisi awal.

## Data & penyimpanan

| Kunci localStorage  | Isi                                        |
| ------------------- | ------------------------------------------ |
| `demo:riwayat`      | Arsip surat (id, no_surat, nik, nama, jenis, petugas, tanggal) |
| `demo:warga`        | Data warga (untuk auto-isi NIK)             |
| `demo:petugas`      | Daftar akun petugas                         |
| `demo:seeded`       | Penanda data contoh sudah pernah dibuat     |
| `isLoggedIn`, `token`, `user` | Sesi login (sama dengan aplikasi asli) |

Data contoh (15 riwayat surat + 6 warga) dibuat otomatis saat pertama dibuka.
Hapus kunci-kunci di atas (atau pakai **Reset Data Demo**) untuk membuat ulang data contoh.

## Perbedaan dengan versi asli

| Asli (`../frontend`)                         | Demo (`./`)                                  |
| -------------------------------------------- | -------------------------------------------- |
| `axios` → `http://localhost:5000/api/*`      | `src/lib/api.js` → localStorage              |
| Database MySQL (backend Express/Prisma)      | Tidak ada backend / database                 |
| 3 halaman                                    | + halaman **Data Warga**                     |
| Tanpa tombol hapus                           | + hapus riwayat & warga (khusus demo)        |
| Tanpa penanda                                | + badge **MODE DEMO** dan tombol reset       |

File yang disalin dari `../frontend/src`: `index.css`, `App.css`, seluruh `components/`,
dan `pages/` (hanya bagian pemanggilan `axios` yang diganti ke `src/lib/api.js`).
