const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connection to Render PostgreSQL
// We don't need the SSL check for internal Render-to-Render connections
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Create table automatically
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS wishes (
                id SERIAL PRIMARY KEY, 
                name TEXT, 
                location TEXT, 
                message TEXT, 
                date TEXT,
                is_pinned INTEGER DEFAULT 0
            )
        `);
        console.log('✅ Connected to Render Postgres & Table Ready');
    } catch (err) {
        console.error('❌ Database initialization error:', err);
    }
};
initDb();

const PWD = "RuqayyaGrad2026";

// API: Get all wishes
app.get('/api/wishes', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM wishes ORDER BY is_pinned DESC, id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Database fetch failed" });
    }
});

// API: Save new wish
app.post('/api/wishes', async (req, res) => {
    const { name, location, message } = req.body;
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    
    try {
        await pool.query(
            "INSERT INTO wishes (name, location, message, date) VALUES ($1, $2, $3, $4)", 
            [name, location, message, date]
        );
        res.sendStatus(200);
    } catch (err) {
        console.error('❌ POST Error:', err.message);
        res.status(500).send("Error saving wish");
    }
});

// API: Pin and Delete logic remains the same...
app.post('/api/pin-wish/:id', async (req, res) => {
    const { password } = req.body;
    if (password !== PWD) return res.status(401).send("Wrong password");
    try {
        await pool.query("UPDATE wishes SET is_pinned = 1 - is_pinned WHERE id = $1", [req.params.id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/delete-wish/:id', async (req, res) => {
    const { password } = req.body; 
    if (password !== PWD) return res.status(401).send("Wrong password");
    try {
        await pool.query("DELETE FROM wishes WHERE id = $1", [req.params.id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.listen(PORT, () => console.log(`🚀 Live on Render at port ${PORT}`));