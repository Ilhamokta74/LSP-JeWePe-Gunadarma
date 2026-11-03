const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3210;
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
const PER_PAGE = 9;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- konfigurasi dasar ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.disable('x-powered-by');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, 'src', 'style')));
app.use('/script', express.static(path.join(__dirname, 'src', 'script')));
app.use('/vendor/sweetalert2', express.static(path.join(__dirname, 'node_modules', 'sweetalert2', 'dist')));

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'ganti-rahasia-ini-di-produksi',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 },
  })
);

// ---------- helper ----------
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function excerpt(text, n = 140) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n).trimEnd() + '…' : t;
}

function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function removeUpload(filename) {
  if (!filename) return;
  const file = path.join(UPLOAD_DIR, path.basename(filename));
  fs.unlink(file, () => {});
}

// view locals: user, flash, csrf, path
app.use((req, res, next) => {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.user = req.session.user || null;
  res.locals.csrf = req.session.csrf;
  res.locals.currentPath = req.path;
  res.locals.flash = req.session.flash || null;
  res.locals.excerpt = excerpt;
  delete req.session.flash;
  next();
});

const flash = (req, type, message) => {
  req.session.flash = { type, message };
};

function requireAuth(req, res, next) {
  if (req.session.user) return next();
  flash(req, 'error', 'Silakan login terlebih dahulu.');
  res.redirect('/login');
}

function verifyCsrf(req, res, next) {
  const token = (req.body && req.body._csrf) || '';
  if (token && token === req.session.csrf) return next();
  if (req.file) removeUpload(req.file.filename);
  flash(req, 'error', 'Sesi formulir kedaluwarsa, silakan coba lagi.');
  res.redirect(req.get('referer') || '/');
}

// ---------- upload gambar ----------
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const uploader = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(null, `image-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ALLOWED_TYPES.includes(file.mimetype)),
}).single('image');

function upload(back) {
  return (req, res, next) =>
    uploader(req, res, (err) => {
      if (!err) return next();
      flash(req, 'error', err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran gambar maksimal 5 MB.' : 'Gagal mengunggah gambar.');
      res.redirect(typeof back === 'function' ? back(req) : back);
    });
}

// ---------- rate limit login sederhana ----------
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
function loginBlocked(ip) {
  const a = attempts.get(ip);
  if (!a) return false;
  if (Date.now() - a.first > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return a.count >= MAX_ATTEMPTS;
}
function loginFailed(ip) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.first > WINDOW_MS) attempts.set(ip, { count: 1, first: Date.now() });
  else a.count++;
}

// =====================================================
//  HALAMAN PUBLIK
// =====================================================
const home = asyncH(async (req, res) => {
  const latest = await db.query(
    'SELECT ID_artikel, judul, artikel, image FROM artikel ORDER BY ID_artikel DESC LIMIT 3'
  );
  const [{ total }] = await db.query('SELECT COUNT(*) AS total FROM artikel');
  res.render('home', { latest, total });
});
app.get(['/', '/home'], home);

app.get(
  '/artikel',
  asyncH(async (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 100);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const like = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
    const where = q ? 'WHERE judul LIKE ? OR artikel LIKE ?' : '';
    const params = q ? [like, like] : [];

    const [{ total }] = await db.query(`SELECT COUNT(*) AS total FROM artikel ${where}`, params);
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    const current = Math.min(page, pages);
    const artikels = await db.query(
      `SELECT ID_artikel, judul, artikel, image FROM artikel ${where} ORDER BY ID_artikel DESC LIMIT ? OFFSET ?`,
      [...params, PER_PAGE, (current - 1) * PER_PAGE]
    );
    res.render('artikel', { artikels, q, total, page: current, pages });
  })
);

// kompatibilitas form pencarian lama
app.post('/artikel/search', (req, res) =>
  res.redirect('/artikel?q=' + encodeURIComponent(String(req.body.searchArtikel || '').trim()))
);

app.get(
  '/artikel-detail/:id',
  asyncH(async (req, res, next) => {
    const [artikel] = await db.query('SELECT * FROM artikel WHERE ID_artikel = ?', [req.params.id]);
    if (!artikel) return next();
    const komentars = await db.query('SELECT * FROM komentar WHERE ID_artikel = ? ORDER BY id DESC', [
      String(artikel.ID_artikel),
    ]);
    const related = await db.query(
      'SELECT ID_artikel, judul, image FROM artikel WHERE ID_artikel <> ? ORDER BY ID_artikel DESC LIMIT 3',
      [artikel.ID_artikel]
    );
    res.render('artikel-detail', { artikel, komentars, related });
  })
);

app.post(
  '/input-komentar',
  verifyCsrf,
  asyncH(async (req, res) => {
    const id = String(req.body.id || '');
    const nama = String(req.body.komentarNama || '').trim().slice(0, 100);
    const email = String(req.body.komentarEmail || '').trim().slice(0, 32);
    const komentar = String(req.body.komentar || '').trim().slice(0, 150);
    const back = `/artikel-detail/${encodeURIComponent(id)}#komentar`;

    const [artikel] = await db.query('SELECT ID_artikel FROM artikel WHERE ID_artikel = ?', [id]);
    if (!artikel) {
      flash(req, 'error', 'Artikel tidak ditemukan.');
      return res.redirect('/artikel');
    }
    if (!nama || !komentar || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      flash(req, 'error', 'Lengkapi nama, email yang valid, dan komentar.');
      return res.redirect(back);
    }
    await db.query('INSERT INTO komentar (ID_artikel, nama, email, komentar) VALUES (?, ?, ?, ?)', [
      id,
      nama,
      email,
      komentar,
    ]);
    flash(req, 'success', 'Komentar berhasil dikirim. Terima kasih!');
    res.redirect(back);
  })
);

// =====================================================
//  LOGIN / LOGOUT
// =====================================================
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/home-admin');
  res.render('login', { email: '' });
});

app.post(
  '/login',
  verifyCsrf,
  asyncH(async (req, res) => {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    if (loginBlocked(req.ip)) {
      flash(req, 'error', 'Terlalu banyak percobaan gagal. Coba lagi dalam beberapa menit.');
      return res.redirect('/login');
    }

    const [akun] = email ? await db.query('SELECT * FROM akun WHERE email = ?', [email]) : [];
    let ok = false;
    if (akun) {
      if (/^\$2[aby]\$/.test(akun.password)) {
        ok = await bcrypt.compare(password, akun.password);
      } else {
        // password lama (plain text): cocokkan lalu otomatis upgrade ke hash bcrypt
        const a = Buffer.from(akun.password);
        const b = Buffer.from(password);
        ok = a.length === b.length && crypto.timingSafeEqual(a, b);
        if (ok) {
          await db.query('UPDATE akun SET password = ? WHERE email = ?', [
            await bcrypt.hash(password, 10),
            akun.email,
          ]);
        }
      }
    }

    if (!ok) {
      loginFailed(req.ip);
      flash(req, 'error', 'Email atau password salah.');
      return res.redirect('/login');
    }

    attempts.delete(req.ip);
    req.session.regenerate((err) => {
      if (err) throw err;
      req.session.user = { email: akun.email };
      req.session.csrf = crypto.randomBytes(24).toString('hex');
      flash(req, 'success', 'Berhasil masuk. Selamat datang!');
      res.redirect('/home-admin');
    });
  })
);

function logout(req, res) {
  req.session.regenerate(() => {
    flash(req, 'success', 'Anda telah keluar.');
    res.redirect('/home');
  });
}
app.post('/logout', verifyCsrf, logout);

// =====================================================
//  ADMIN
// =====================================================
app.use(['/home-admin', '/artikel-kelola', '/artikel-input', '/artikel-edit', '/artikel-delete', '/delete-komentar'], requireAuth);

app.get(
  '/home-admin',
  asyncH(async (req, res) => {
    const [{ artikel }] = await db.query('SELECT COUNT(*) AS artikel FROM artikel');
    const [{ komentar }] = await db.query('SELECT COUNT(*) AS komentar FROM komentar');
    const recent = await db.query(
      `SELECT k.id, k.nama, k.komentar, k.ID_artikel, a.judul
         FROM komentar k LEFT JOIN artikel a ON a.ID_artikel = k.ID_artikel
        ORDER BY k.id DESC LIMIT 5`
    );
    res.render('home-admin', { stats: { artikel, komentar }, recent });
  })
);

app.get(
  '/artikel-kelola',
  asyncH(async (req, res) => {
    const artikels = await db.query(
      `SELECT a.ID_artikel, a.judul, a.image,
              (SELECT COUNT(*) FROM komentar k WHERE k.ID_artikel = CAST(a.ID_artikel AS CHAR)) AS jumlahKomentar
         FROM artikel a ORDER BY a.ID_artikel DESC`
    );
    res.render('artikel-kelola', { artikels });
  })
);

app.get('/artikel-input', (req, res) => res.render('artikel-input', { form: { judul: '', artikel: '' } }));

app.post(
  '/artikel-input',
  upload('/artikel-input'),
  verifyCsrf,
  asyncH(async (req, res) => {
    const judul = String(req.body.judul || '').trim();
    const artikel = String(req.body.artikel || '').trim();
    if (!judul || !artikel || !req.file) {
      if (req.file) removeUpload(req.file.filename);
      res.locals.flash = { type: 'error', message: 'Judul, isi artikel, dan gambar (JPG/PNG/WebP/GIF) wajib diisi.' };
      return res.render('artikel-input', { form: { judul, artikel } });
    }
    await db.query(
      'INSERT INTO artikel (judul, artikel, idname, image, artikelDepan) VALUES (?, ?, ?, ?, ?)',
      [judul, artikel, slugify(judul), req.file.filename, excerpt(artikel, 100)]
    );
    flash(req, 'success', 'Artikel berhasil dipublikasikan.');
    res.redirect('/artikel-kelola');
  })
);

app.get(
  '/artikel-edit/:id',
  asyncH(async (req, res, next) => {
    const [artikel] = await db.query('SELECT * FROM artikel WHERE ID_artikel = ?', [req.params.id]);
    if (!artikel) return next();
    const komentars = await db.query('SELECT * FROM komentar WHERE ID_artikel = ? ORDER BY id DESC', [
      String(artikel.ID_artikel),
    ]);
    res.render('artikel-edit', { artikel, komentars });
  })
);

app.post(
  '/artikel-edit',
  upload((req) => '/artikel-kelola'),
  verifyCsrf,
  asyncH(async (req, res) => {
    const id = String(req.body.idEdit || '');
    const judul = String(req.body.judul || '').trim();
    const artikel = String(req.body.artikel || '').trim();
    const [lama] = await db.query('SELECT image FROM artikel WHERE ID_artikel = ?', [id]);
    if (!lama) {
      if (req.file) removeUpload(req.file.filename);
      flash(req, 'error', 'Artikel tidak ditemukan.');
      return res.redirect('/artikel-kelola');
    }
    if (!judul || !artikel) {
      if (req.file) removeUpload(req.file.filename);
      flash(req, 'error', 'Judul dan isi artikel tidak boleh kosong.');
      return res.redirect(`/artikel-edit/${encodeURIComponent(id)}`);
    }
    const image = req.file ? req.file.filename : lama.image;
    await db.query(
      'UPDATE artikel SET judul = ?, artikel = ?, idname = ?, image = ?, artikelDepan = ? WHERE ID_artikel = ?',
      [judul, artikel, slugify(judul), image, excerpt(artikel, 100), id]
    );
    if (req.file) removeUpload(lama.image);
    flash(req, 'success', 'Perubahan artikel berhasil disimpan.');
    res.redirect(`/artikel-edit/${encodeURIComponent(id)}`);
  })
);

app.post(
  '/artikel-delete',
  verifyCsrf,
  asyncH(async (req, res) => {
    const id = String(req.body.id || '');
    const [row] = await db.query('SELECT image FROM artikel WHERE ID_artikel = ?', [id]);
    await db.query('DELETE FROM komentar WHERE ID_artikel = ?', [id]);
    await db.query('DELETE FROM artikel WHERE ID_artikel = ?', [id]);
    if (row) {
      const [{ n }] = await db.query('SELECT COUNT(*) AS n FROM artikel WHERE image = ?', [row.image]);
      if (!n) removeUpload(row.image);
    }
    flash(req, 'success', 'Artikel beserta komentarnya telah dihapus.');
    res.redirect('/artikel-kelola');
  })
);

app.post(
  '/delete-komentar',
  verifyCsrf,
  asyncH(async (req, res) => {
    const id = String(req.body.id || '');
    const [k] = await db.query('SELECT ID_artikel FROM komentar WHERE id = ?', [id]);
    if (!k) {
      flash(req, 'error', 'Komentar tidak ditemukan.');
      return res.redirect('/artikel-kelola');
    }
    await db.query('DELETE FROM komentar WHERE id = ?', [id]);
    flash(req, 'success', 'Komentar dihapus.');
    res.redirect(`/artikel-edit/${encodeURIComponent(k.ID_artikel)}#komentar`);
  })
);

// =====================================================
//  404 & error handler
// =====================================================
app.use((req, res) => res.status(404).render('error', { code: 404, message: 'Halaman yang Anda cari tidak ditemukan.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { code: 500, message: 'Terjadi kesalahan pada server. Silakan coba lagi.' });
});

// ---------- start ----------
db.migrate()
  .catch((e) => console.warn('Migrasi dilewati:', e.code || e.message))
  .finally(() => {
    app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
  });
