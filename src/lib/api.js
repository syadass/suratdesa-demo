// ============================================================
// DEMO MODE - Lapisan API tiruan
// Semua "request" dijawab dari localStorage, tanpa backend.
// Bentuk hasil sengaja dibuat mirip respons axios/Express
// agar kode halaman tidak banyak berubah.
// ============================================================

import { KEY, read, write, uid, resetDemoData } from './store';

const DELAY_MS = 150;
const wait = (ms = DELAY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

// Melempar error menyerupai `err.response.data.message` milik axios.
const httpError = (status, message) => {
  const error = new Error(message);
  error.response = { status, data: { message } };
  return error;
};

const urutTerbaru = (list) =>
  [...list].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

export const api = {
  // --- Auth ---
  async login({ username, password }) {
    await wait();
    const petugas = read(KEY.petugas, []);
    const user = petugas.find((p) => p.username === String(username || '').trim());
    if (!user) throw httpError(401, 'Username tidak ditemukan!');
    if (user.password !== password) throw httpError(401, 'Password salah!');
    return {
      data: {
        message: 'Login berhasil',
        token: `demo-token.${btoa(user.username)}.${Date.now()}`,
        user: { nama: user.nama, username: user.username, role: user.role },
      },
    };
  },

  // --- Riwayat surat ---
  async getRiwayat() {
    await wait();
    return { data: urutTerbaru(read(KEY.riwayat, [])) };
  },

  async createRiwayat(payload) {
    await wait();
    const item = { id: uid(), tanggal: new Date().toISOString(), ...payload };
    const list = read(KEY.riwayat, []);
    list.unshift(item);
    write(KEY.riwayat, list);
    return { data: { message: 'Riwayat surat berhasil disimpan!', item } };
  },

  async deleteRiwayat(id) {
    await wait();
    const list = read(KEY.riwayat, []);
    const next = list.filter((item) => item.id !== id);
    if (next.length === list.length) throw httpError(404, 'Data riwayat tidak ditemukan.');
    write(KEY.riwayat, next);
    return { data: { message: 'Data riwayat berhasil dihapus.' } };
  },

  // --- Data warga (untuk auto-fill NIK) ---
  async getWarga(nik) {
    await wait();
    const found = read(KEY.warga, []).find((w) => String(w.nik) === String(nik));
    if (!found) throw httpError(404, 'Warga tidak ditemukan');
    return { data: found };
  },

  async listWarga() {
    await wait();
    const list = read(KEY.warga, []).sort((a, b) => String(a.nama).localeCompare(String(b.nama), 'id'));
    return { data: list };
  },

  async saveWarga(data, nikLama = '') {
    await wait(200);
    const list = read(KEY.warga, []);
    const nik = String(data.nik || '').trim();
    const duplikat = list.some((w) => w.nik === nik && w.nik !== nikLama);
    if (duplikat) throw httpError(400, 'Gagal: NIK tersebut sudah terdaftar!');

    if (nikLama) {
      const index = list.findIndex((w) => w.nik === nikLama);
      if (index === -1) throw httpError(404, 'Data warga tidak ditemukan.');
      list[index] = { ...list[index], ...data, nik };
    } else {
      list.push({ status: 'Aktif', ...data, nik });
    }
    write(KEY.warga, list);
    return { data: { message: nikLama ? 'Data warga berhasil diperbarui!' : 'Data warga berhasil ditambahkan!' } };
  },

  async deleteWarga(nik) {
    await wait();
    const list = read(KEY.warga, []);
    const next = list.filter((w) => w.nik !== nik);
    if (next.length === list.length) throw httpError(404, 'Data warga tidak ditemukan.');
    write(KEY.warga, next);
    return { data: { message: 'Data warga berhasil dihapus.' } };
  },
};

export { resetDemoData };
