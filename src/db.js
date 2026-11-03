const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jewepe',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

/** Jalankan query berparameter dan kembalikan array baris (Promise). */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

/** Migrasi ringan & idempoten: kolom password harus cukup panjang untuk hash bcrypt. */
async function migrate() {
  await query('ALTER TABLE akun MODIFY password VARCHAR(100) NOT NULL');
}

module.exports = { query, migrate };
