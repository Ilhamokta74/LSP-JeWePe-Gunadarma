# Sekolah Tinggi JeWePe — Portal Artikel

Aplikasi Express + EJS + MySQL untuk menampilkan artikel, komentar, dan panel admin.

## Menjalankan
1. Impor `jewepe.sql` ke MySQL/MariaDB (database `jewepe`).
2. `npm install`
3. `npm start` (atau `npm run dev`) → http://localhost:3210

Konfigurasi opsional lewat environment variable:
`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, `SESSION_SECRET` (wajib diganti di produksi).

Login admin bawaan dari dump: `Ilham@gmail.com` / `12341234`. Saat login pertama,
password lama otomatis di-hash (bcrypt). **Segera ganti password di produksi.**

## Struktur
- `server.js` — route & logika; `src/db.js` — koneksi MySQL
- `src/views` (+ `partials/`) — template EJS; `src/style`, `src/script` — aset
- `public/uploads` — gambar artikel
