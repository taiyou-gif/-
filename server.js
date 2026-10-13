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
            phq1 TEXT,
            phq2 TEXT,
            phq3 TEXT,
            phq4 TEXT,
            phq5 TEXT,
            phq6 TEXT,
            phq7 TEXT,
            phq8 TEXT,
            phq9 TEXT,
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
                db.run(`ALTER TABLE records ADD COLUMN phq1 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN phq2 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN phq3 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN phq4 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN phq5 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN phq6 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN phq7 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN phq8 TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN phq9 TEXT`, () => {});
            }
        });
    }
});

// API Endpoint to save record
app.post('/api/records', (req, res) => {
    const { day_number, record_date, name, bedtime, waketime, weather, feeling, sleepiness, mood_good, mood_depressed, q1, q2, q3, q4, q5, q6, q7, q8, phq1, phq2, phq3, phq4, phq5, phq6, phq7, phq8, phq9 } = req.body;
    
    // sunlight_completed is true if they reached this point
    const sunlight_completed = true;

    const sql = `INSERT INTO records (day_number, record_date, participant_name, bedtime, waketime, weather, sunlight_completed, feeling, sleepiness, mood_good, mood_depressed, q1, q2, q3, q4, q5, q6, q7, q8, phq1, phq2, phq3, phq4, phq5, phq6, phq7, phq8, phq9) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                 
   db.run(sql, [
    day_number,
    record_date,
    name,
    bedtime,
    waketime,
    weather,
    sunlight_completed,
    feeling,
    sleepiness,
    mood_good,
    mood_depressed,
    q1,
    q2,
    q3,
    q4,
    q5,
    q6,
    q7,
    q8,
    phq1,
    phq2,
    phq3,
    phq4,
    phq5,
    phq6,
    phq7,
    phq8,
    phq9
], async function(err) {
        console.error('Error inserting record:', err.message);
        return res.status(500).json({ error: 'Failed to save record.' });
    }

    // ★ ここから追加（GAS に送る処理）
    try {
        const response = await fetch(process.env.GAS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            console.error("GAS error:", await response.text());
            return res.status(500).json({ error: "GAS_error" });
        }

        return res.status(201).json({ message: 'Record saved to Google Sheets' });

    } catch (err) {
        console.error("Fetch failed:", err);
        return res.status(500).json({ error: "fetch_failed" });
    }
});
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
