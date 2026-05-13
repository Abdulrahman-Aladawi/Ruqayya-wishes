const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Use Render's port or default to 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./wishes.db', (err) => {
    if (err) console.error('❌ Database connection error:', err);
    else console.log('✅ Connected to SQLite Database');
});

// Create table - Updated to include is_pinned column from the start
db.run(`CREATE TABLE IF NOT EXISTS wishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    location TEXT, 
    message TEXT, 
    date TEXT,
    is_pinned INTEGER DEFAULT 0
)`, (err) => {
    if (err) console.error('❌ Table creation error:', err);
});

const PWD = "RuqayyaGrad2026";

// API: Get all wishes (Pinned first, then newest)
app.get('/api/wishes', (req, res) => {
    const sql = "SELECT * FROM wishes ORDER BY is_pinned DESC, id DESC";
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ GET Error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// API: Save new wish
app.post('/api/wishes', (req, res) => {
    const { name, location, message } = req.body;
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    
    db.run("INSERT INTO wishes (name, location, message, date) VALUES (?, ?, ?, ?)", 
    [name, location, message, date], function(err) {
        if (err) {
            console.error('❌ POST Error (Insert failed):', err);
            return res.status(500).send(err.message);
        }
        console.log(`✨ New wish added with ID: ${this.lastID}`);
        res.sendStatus(200);
    });
});

// API: Toggle Pin status
app.post('/api/pin-wish/:id', (req, res) => {
    const { password } = req.body;
    const wishId = req.params.id;

    if (password !== PWD) {
        return res.status(401).send("Wrong password");
    }

    // Logic: Flips 0 to 1, or 1 to 0
    db.run("UPDATE wishes SET is_pinned = 1 - is_pinned WHERE id = ?", [wishId], function(err) {
        if (err) {
            console.error('❌ PIN Error:', err);
            return res.status(500).send(err.message);
        }
        console.log(`📌 Pin toggled for ID: ${wishId}`);
        res.sendStatus(200);
    });
});

// API: Delete individual wish
app.delete('/api/delete-wish/:id', (req, res) => {
    const { password } = req.body; 
    const wishId = req.params.id;

    if (password !== PWD) {
        return res.status(401).send("Wrong password");
    }

    db.run("DELETE FROM wishes WHERE id = ?", [wishId], function(err) {
        if (err) return res.status(500).send(err.message);
        console.log(`✅ Successfully deleted wish ID: ${wishId}`);
        res.sendStatus(200);
    });
});

app.listen(PORT, () => console.log(`🚀 Live at http://localhost:${PORT}`));