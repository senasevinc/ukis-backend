const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

let db;

// Veritabanını başlat ve tabloları oluştur
async function initializeDatabase() {
    db = await open({
        filename: path.join(__dirname, 'ukis_database.db'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS containers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            container_no TEXT,
            status TEXT,
            description TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);
    
    console.log("SQLite Veritabanı ve Tablolar Hazır!");
}

// Ana sayfa karşılama mesajı
app.get('/', (req, res) => {
    res.send("<h1>UKİS Sistemi API Sunucusu Aktif!</h1><p>Sistem başarıyla çalışıyor.</p>");
});

// 1. Kayıt Olma
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
        res.json({ success: true, message: "Kayıt başarılı!" });
    } catch (error) {
        res.status(400).json({ success: false, message: "Bu kullanıcı adı zaten alınmış." });
    }
});

// 2. Giriş Yapma
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    
    if (user) {
        res.json({ success: true, user: { id: user.id, username: user.username } });
    } else {
        res.status(401).json({ success: false, message: "Hatalı kullanıcı adı veya şifre!" });
    }
});

// 3. Konteyner Ekleme
app.post('/api/containers', async (req, res) => {
    const { user_id, container_no, status, description } = req.body;
    await db.run(
        'INSERT INTO containers (user_id, container_no, status, description) VALUES (?, ?, ?, ?)',
        [user_id, container_no, status, description]
    );
    res.json({ success: true, message: "Konteyner başarıyla eklendi!" });
});

// 4. Konteyner Listeleme
app.get('/api/containers/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const containers = await db.all('SELECT * FROM containers WHERE user_id = ?', [user_id]);
    res.json(containers);
});

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`UKİS Arka Plan Sunucusu ${PORT} portunda başarıyla çalışıyor!`);
    });
});
