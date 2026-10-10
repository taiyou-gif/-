const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Basic Auth for admin page ---
const auth = { login: 'sunlight reserch manage', password: 'taiyou1234567890' };

app.use('/admin.html', (req, res, next) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (login === auth.login && password === auth.password) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    res.status(401).send('Authentication required.');
});

app.use(express.static(path.join(__dirname, 'public')));

// DB setup
const dbFile = path.join(__dirname, 'research_data.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create table if not exists
        db.run(`CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_number INTEGER,
            record_date TEXT,
            participant_name TEXT NOT NULL,
            bedtime TEXT,
            waketime TEXT,
            weather TEXT,
            sunlight_completed BOOLEAN,
            feeling TEXT,
            sleepiness INTEGER,
            mood_good INTEGER,
            mood_depressed INTEGER,
            q1 TEXT,
            q2 TEXT,
            q3 TEXT,
            q4 TEXT,
            q5 TEXT,
            q6 TEXT,
            q7 TEXT,
            q8 TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (!err) {
                // Try to add columns if table already existed before this update
                db.run(`ALTER TABLE records ADD COLUMN day_number INTEGER`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN record_date TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN sleepiness INTEGER`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN mood_good INTEGER`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN mood_depressed INTEGER`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN q1 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN q2 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN q3 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN q4 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN q5 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN q6 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN q7 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN q8 TEXT`, () => {});
            }
        });
    }
});

app.post('/api/records', async (req, res) => {
    const recordData = req.body;

    try {
        const response = await fetch(process.env.GAS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(recordData)
        });

        if (!response.ok) {
            console.error("GAS error:", await response.text());
            return res.status(500).json({ error: "GAS_error" });
        }

        return res.status(201).json({ message: "Record saved to Google Sheets" });
    } catch (err) {
        console.error("Fetch failed:", err);
        return res.status(500).json({ error: "fetch_failed" });
    }
});

// API Endpoint to get all records for Admin
app.get('/api/records', (req, res) => {
    const sql = `SELECT * FROM records ORDER BY created_at DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching records:', err.message);
            res.status(500).json({ error: 'Failed to fetch records.' });
        } else {
            res.json(rows);
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin.html`);
});
