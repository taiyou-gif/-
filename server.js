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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (!err) {
                // Try to add columns if table already existed before this update
                db.run(`ALTER TABLE records ADD COLUMN day_number INTEGER`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN record_date TEXT`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN sleepiness INTEGER`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN mood_good INTEGER`, () => {});
                db.run(`ALTER TABLE records ADD COLUMN mood_depressed INTEGER`, () => {});
            }
        });
    }
});

// API Endpoint to save record
app.post('/api/records', (req, res) => {
    const { day_number, record_date, name, bedtime, waketime, weather, feeling, sleepiness, mood_good, mood_depressed } = req.body;
    
    // sunlight_completed is true if they reached this point
    const sunlight_completed = true;

    const sql = `INSERT INTO records (day_number, record_date, participant_name, bedtime, waketime, weather, sunlight_completed, feeling, sleepiness, mood_good, mood_depressed) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                 
    db.run(sql, [day_number, record_date, name, bedtime, waketime, weather, sunlight_completed, feeling, sleepiness, mood_good, mood_depressed], function(err) {
        if (err) {
            console.error('Error inserting record:', err.message);
            res.status(500).json({ error: 'Failed to save record.' });
        } else {
            res.status(201).json({ message: 'Record saved successfully!', id: this.lastID });
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
