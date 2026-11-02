const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'jewepe'
});

// Multer storage
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage }).single('image');

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    console.log('Pastikan MySQL running dan database "jewepe" sudah dibuat + diimport dari jewepe.sql');
  } else {
    console.log('Database connected successfully');
  }
});

// ========== PUBLIC ROUTES ==========

// Home
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/home', (req, res) => {
  res.render('home');
});

// List Artikel
app.get('/artikel', (req, res) => {
  const sql = 'SELECT * FROM artikel ORDER BY ID_artikel DESC';
  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render('artikel', { artikels: result || [] });
  });
});

// Search Artikel
app.post('/artikel/search', (req, res) => {
  const search = (req.body.searchArtikel || '').trim();
  if (!search) {
    return res.redirect('/artikel');
  }
  const keyword = '%' + search.split(' ').join('%') + '%';
  const sql = 'SELECT * FROM artikel WHERE judul LIKE ? OR idname LIKE ? OR artikel LIKE ? ORDER BY ID_artikel DESC';
  db.query(sql, [keyword, keyword, keyword], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render('artikel', { artikels: result || [], searchQuery: search });
  });
});

// Artikel Detail + Komentar
app.get('/artikel-detail/:id', (req, res) => {
  const id = req.params.id;
  const sqlArtikel = 'SELECT * FROM artikel WHERE ID_artikel = ?';
  const sqlKomentar = 'SELECT * FROM komentar WHERE ID_artikel = ? ORDER BY id DESC';

  db.query(sqlArtikel, [id], (err, artikelResult) => {
    if (err || !artikelResult || artikelResult.length === 0) {
      return res.status(404).send('Artikel tidak ditemukan');
    }
    db.query(sqlKomentar, [id], (err2, komentarResult) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('Database error');
      }
      res.render('artikel-detail', {
        getDetails: artikelResult,
        komentars: komentarResult || []
      });
    });
  });
});

// Input Komentar
app.post('/input-komentar', (req, res) => {
  const { id, komentarNama, komentarEmail, komentar } = req.body;
  if (!id || !komentarNama || !komentar || !komentarEmail) {
    return res.redirect(`/artikel-detail/${id || ''}`);
  }
  const sql = 'INSERT INTO komentar (ID_artikel, nama, email, komentar) VALUES (?, ?, ?, ?)';
  db.query(sql, [id, komentarNama, komentarEmail, komentar], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Gagal menyimpan komentar');
    }
    res.redirect(`/artikel-detail/${id}`);
  });
});

// Login page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Login process
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('login', { error: 'Email dan password wajib diisi' });
  }
  const sql = 'SELECT * FROM akun WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error(err);
      return res.render('login', { error: 'Terjadi kesalahan server' });
    }
    if (result && result.length > 0) {
      return res.redirect('/home-admin');
    }
    res.render('login', { error: 'Email atau password salah' });
  });
});

// ========== ADMIN ROUTES ==========

app.get('/home-admin', (req, res) => {
  res.render('home-admin');
});

// Kelola Artikel
app.get('/artikel-kelola', (req, res) => {
  const sql = 'SELECT ID_artikel, judul, image FROM artikel ORDER BY ID_artikel DESC';
  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render('artikel-kelola', { artikels: result || [] });
  });
});

// Form Input Artikel
app.get('/artikel-input', (req, res) => {
  res.render('artikel-input');
});

// Proses Input Artikel
app.post('/artikel-input', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Upload gagal');
    }
    const { judul, artikel } = req.body;
    if (!judul || !artikel) {
      return res.redirect('/artikel-input');
    }
    const idName = judul.trim().toLowerCase().split(/\s+/).join('-');
    const image = req.file ? req.file.filename : null;
    const artikelDepan = artikel.substring(0, 120) + (artikel.length > 120 ? ' ...' : '');
    const sql = 'INSERT INTO artikel (judul, artikel, idname, image, artikelDepan) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [judul, artikel, idName, image, artikelDepan], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('Gagal menyimpan artikel');
      }
      res.redirect('/artikel-kelola');
    });
  });
});

// Form Edit Artikel
app.get('/artikel-edit/:id', (req, res) => {
  const id = req.params.id;
  const sqlArtikel = 'SELECT * FROM artikel WHERE ID_artikel = ?';
  const sqlKomentar = 'SELECT * FROM komentar WHERE ID_artikel = ? ORDER BY id DESC';

  db.query(sqlArtikel, [id], (err, artikelResult) => {
    if (err || !artikelResult || artikelResult.length === 0) {
      return res.status(404).send('Artikel tidak ditemukan');
    }
    db.query(sqlKomentar, [id], (err2, komentarResult) => {
      res.render('artikel-edit', {
        artikelEdits: artikelResult,
        komentars: komentarResult || []
      });
    });
  });
});

// Proses Edit Artikel
app.post('/artikel-edit', (req, res) => {
  const { idEdit, judul, artikel } = req.body;
  if (!idEdit || !judul || !artikel) {
    return res.redirect('/artikel-kelola');
  }
  const idName = judul.trim().toLowerCase().split(/\s+/).join('-');
  const artikelDepan = artikel.substring(0, 120) + (artikel.length > 120 ? ' ...' : '');
  const sql = 'UPDATE artikel SET judul = ?, artikel = ?, idname = ?, artikelDepan = ? WHERE ID_artikel = ?';
  db.query(sql, [judul, artikel, idName, artikelDepan, idEdit], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Gagal update artikel');
    }
    res.redirect('/artikel-kelola');
  });
});

// Delete Artikel + Komentar terkait
app.post('/artikel-delete', (req, res) => {
  const id = req.body.id;
  if (!id) return res.redirect('/artikel-kelola');

  db.query('DELETE FROM komentar WHERE ID_artikel = ?', [id], (err) => {
    if (err) console.error(err);
    db.query('DELETE FROM artikel WHERE ID_artikel = ?', [id], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('Gagal hapus artikel');
      }
      res.redirect('/artikel-kelola');
    });
  });
});

// Delete Komentar
app.post('/delete-komentar', (req, res) => {
  const { id, id_artikel } = req.body;
  if (!id) return res.redirect('/artikel-kelola');

  db.query('DELETE FROM komentar WHERE id = ?', [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Gagal hapus komentar');
    }
    if (id_artikel) {
      return res.redirect(`/artikel-edit/${id_artikel}`);
    }
    res.redirect('/artikel-kelola');
  });
});

// Start server
const port = 3210;
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
