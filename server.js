const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const multer = require('multer');
const path = require('path')

const app = express();

app.set('view engine', 'ejs')
app.set('views', 'views')
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',	
    database: 'jewepe'
  });

// Set storage engine for uploaded files
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
  // Initialize multer upload
  const upload = multer({storage: storage,}).single('image');


db.connect((err) => {
    if (err) throw err
    console.log('database connection');

        // get all data artikel
        app.get('/artikel', (req, res) => {
            const sql = 'SELECT * FROM artikel'
            db.query(sql, (err, result) => {
                const artikels = JSON.parse(JSON.stringify(result))
                res.render('artikel', { artikels: artikels}); 
                console.log(artikels); 
            });
        });

        // untuk kelola artikel (ADMIN)
        app.get('/artikel-kelola', (req, res) => {
            const sql = 'SELECT ID_artikel, judul FROM artikel'
            db.query(sql, (err, result) => {
                const artikels = JSON.parse(JSON.stringify(result))
                res.render('artikel-kelola', { artikels: artikels }); 
                console.log(artikels); 
            });
            // res.render("artikel-kelola");
        });
        
        app.get('/artikel-input', (req, res) => {
            res.render("artikel-input");
        });

        // ARTIKEL INPUT
        app.post('/artikel-input', (req, res) => {
            upload(req, res, (err) => {
                const { judul, artikel } = req.body;

                const idName = judul.split(' ').join('-');
                const image = req.file ? req.file.filename : null;
                const artikelDepan = artikel.substring(0, 100) + ' ...';
                const insertSql = `INSERT INTO artikel (judul, artikel, idname, image, artikelDepan) VALUES (?, ?, ?, ?, ?);`
                console.log(insertSql);

                db.query(insertSql,[judul, artikel, idName, image, artikelDepan], (err, result) => {
                    if (err) throw err
                    console.log("Alhamdullilah berhasil");
                    res.redirect('/artikel-kelola');
                })
            })
        });

        // Get Data By IdName
        // app.get (`/artikel-search/:idname`, (req, res) => {
        //     const idName = req.body.searchArtikel;
        //     const artikelSearch = `SELECT * FROM artikel WHERE idname LIKE '%${idName}%'`;
        //     // const komentar = `SELECT * FROM komentar WHERE ID_artikel = '${id}'`;
        //     console.log(artikelSearch); 
        //     // console.log(komentar);
        //     db.query(artikelSearch, (err, result) => {
        //         const artikels = JSON.parse(JSON.stringify(result))
        //         res.render('artikel-search', { artikels: artikels}); 
        //         console.log(artikels); 
        //     });
        // });

        // search
        app.post (`/artikel/search`, (req, res) => {
            const searchArtikel = req.body.searchArtikel;
            const idName = searchArtikel.split(' ').join('-');
            const artikelSearch = `SELECT * FROM artikel WHERE idname LIKE '%${idName}%'`;
            // const komentar = `SELECT * FROM komentar WHERE ID_artikel = '${id}'`;
            console.log(artikelSearch); 
            // console.log(komentar);
            db.query(artikelSearch, (err, result) => {
                const artikels = JSON.parse(JSON.stringify(result))
                res.render('artikel', { artikels: artikels });
                console.log(artikels); 
            });
            
            if(searchArtikel === '') {
                res.redirect('/artikel');
            }
        });

        // artikel detail
        app.get (`/artikel-detail/:id`, (req, res) => {
            const id = req.params.id;
            const sql = `SELECT * FROM artikel WHERE ID_artikel = '${id}'`;
            const komentar = `SELECT * FROM komentar WHERE ID_artikel = '${id}'`;
            console.log(sql); 
            db.query(sql, (err, result) => {
                const getDetails = JSON.parse(JSON.stringify(result))
                db.query(komentar, (err, result) => {
                    console.log(komentar);
                    const komentars = JSON.parse(JSON.stringify(result))
                    res.render('artikel-detail', { getDetails: getDetails, komentars: komentars});
                    console.log(komentars); 
                }); 
                console.log(getDetails); 
            });
        });

        // Insert Komentar
        app.post('/input-komentar', (req, res) => {
            const id = req.body.id;
            const komentarNama = req.body.komentarNama;
            const komentarEmail = req.body.komentarEmail;
            const  komentar = req.body.komentar;

            const insertKomentar = `INSERT INTO komentar (ID_artikel, nama, email, komentar) VALUES (
                '${id}',
                '${komentarNama}',
                '${komentarEmail}',
                '${komentar}'
            );`
            db.query(insertKomentar, (err, result) => {
                if (err) throw err
                console.log("Alhamdullilah komentarnya berhasil");
                res.redirect(`/artikel-detail/${id}`)
            })
        });

        // akses halaman
        app.get('/login', (req, res) => {
            res.render("login");
        });

        // login Authentication
        app.post('/login', (req, res) => {
            const email = req.body.email;
            const password = req.body.password;

            const loginSql = `SELECT * FROM akun WHERE email = '${email}'`;
            console.log(loginSql)
            console.log(email, password);

            db.query(loginSql, (err, result) => {
                const loginSqls = JSON.parse(JSON.stringify(result))
                // res.render('artikel-search', { artikels: artikels}); 
                console.log(loginSqls); 

                for (let login of loginSqls) {
                    if(login.email === email && login.password === password) {
                        console.log('masuk nih email sama passwordnya')
                        // alert('masuk nih email sama passwordnya')
                        setTimeout(() => {
                            res.redirect('/home-admin');
                          }, 2000);
                    } else {
                        console.log('yah gagal login');
                        // alert('yah gagal login');
                    }
                }
            })
        });

        // EDIT artikel
        app.get ('/artikel-edit/:id', (req, res) => {
            const id = req.params.id;
            const artikelEdit = `SELECT * FROM artikel WHERE ID_artikel = '${id}'`;
            const komentar = `SELECT * FROM komentar WHERE ID_artikel = '${id}'`;
            console.log(artikelEdit); 
            console.log(komentar);
            db.query(artikelEdit, (err, result) => {
                const artikelEdits = JSON.parse(JSON.stringify(result))
                db.query(komentar, (err, result) => {
                    const komentars = JSON.parse(JSON.stringify(result))
                    res.render('artikel-edit', { artikelEdits: artikelEdits, komentars: komentars });
                    console.log(komentars); 
                }); 
                // res.render('artikel-edit', { artikelEdits: artikelEdits, komentars: komentars });
                console.log(artikelEdits); 
            });
            // res.render('artikel-edit');
        })


        // Edit data ke database
        app.post ('/artikel-edit', (req, res) => {
            const id = req.body.idEdit;
            const judul = req.body.judul;
            const artikel = req.body.artikel;
            const artikelEditSave = `UPDATE artikel SET judul = '${judul}', artikel = '${artikel}' WHERE ID_artikel = '${id}'`;
            console.log(artikelEditSave); 
            // res.redirect('/artikel-kelola');
            db.query(artikelEditSave, (err, result) => {
                const artikelEditSaves = JSON.parse(JSON.stringify(result))
                res.redirect(`/artikel-edit/${id}`);
                // res.redirect('/artikel-kelola');
                console.log(artikelEditSaves); 
            });
            // res.render('artikel-edit');
        })

        // delete artikel
        app.post (`/artikel-delete`, (req, res) => {
            const id = req.body.id;
            // console.log(id_artikel);
            const btnDelete = `DELETE FROM artikel WHERE ID_artikel = '${id}'`;
            const komentarDelete = `DELETE FROM komentar WHERE ID_artikel = '${id}'`;
            console.log(btnDelete); 
            console.log(komentarDelete);
            db.query(btnDelete, (err, result) => {
                const btnDeletes = JSON.parse(JSON.stringify(result))
                db.query(komentarDelete, (err, result) => {
                    const komentarDeletes = JSON.parse(JSON.stringify(result))
                    console.log(komentarDeletes); 
                }); 
                console.log(btnDeletes); 
                res.redirect('/artikel-kelola');
            });
        });

        // DELETE komentar
        app.post (`/delete-komentar`, (req, res) => {
            const id = req.body.id;
            const komentarDeleteq = `DELETE FROM komentar WHERE id = '${id}'`; 
            const komentarDelete = `SELECT * FROM komentar WHERE id = '${id}'`; 
            console.log(komentarDelete);
                db.query(komentarDelete, (err, result) => {
                    const komentarDeletes = JSON.parse(JSON.stringify(result))
                    console.log(komentarDeletes); 

                    for (let komentarDelete of komentarDeletes) {
                        const idnya = komentarDelete.ID_artikel;
                        console.log(idnya);
                        setTimeout(() => {
                            res.redirect(`/artikel-edit/${idnya}`);
                          }, 1000);
                    }
                    db.query(komentarDeleteq, (err, result) => {
                        const komentarDeleteq = JSON.parse(JSON.stringify(result))
                        console.log(komentarDeleteq); 
                    }); 
                }); 
                // res.redirect(`/artikel-edit/${id}`);

        });
});

app.get('/', (req, res) => {
    res.render("home");
});

app.get('/home', (req, res) => {
    res.render("home");
});

app.get('/home-admin', (req, res) => {
    res.render("home-admin");
});

const port = 3210;
app.listen (port, ()=> {
    console.log(`server berjalan di http://localhost:${port}`)
});