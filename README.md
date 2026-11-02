# LSP JeWePe Gunadarma — Website Artikel

Website sederhana untuk mengelola dan menampilkan artikel kampus Sekolah Tinggi JeWePe (project LSP).

## Fitur

- **Publik**: Beranda, daftar artikel + search, detail artikel + komentar
- **Admin**: Login, dashboard, tambah / edit / hapus artikel, hapus komentar
- Tampilan modern responsif (Bootstrap 5)
- Query database menggunakan parameterized query (lebih aman dari SQL injection)

## Setup

1. Pastikan **Node.js** dan **MySQL/MariaDB** terpasang.

2. Buat database dan import schema:
   ```bash
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS jewepe;"
   mysql -u root jewepe < jewepe.sql
   ```

3. Install dependency:
   ```bash
   npm install
   ```

4. Jalankan server:
   ```bash
   npm start
   # atau development dengan auto-reload:
   npm run dev
   ```

5. Buka browser: **http://localhost:3210**

## Akun Demo Admin

- Email: `Ilham@gmail.com`
- Password: `12341234`

## Struktur Folder

```
├── public/           # Static assets (css, js, uploads, gambar)
├── views/            # Template EJS
├── server.js         # Backend Express
├── jewepe.sql        # Schema + data awal
└── package.json
```

## Catatan

- Upload gambar disimpan di `public/uploads/`
- Tidak ada session authentication (login hanya redirect). Untuk production sebaiknya ditambahkan session/JWT.
