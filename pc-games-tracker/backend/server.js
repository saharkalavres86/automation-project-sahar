import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import { fetchAndSaveGames } from './fetchGames.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(join(__dirname, '../')));

// API routes
app.get('/api/games', async (req, res) => {
    try {
        const { genre, sort, search } = req.query;
        let query = 'SELECT * FROM games WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND name ILIKE $${params.length}`;
        }
        if (genre) {
            params.push(`%${genre}%`);
            query += ` AND genres ILIKE $${params.length}`;
        }

        query += ` ORDER BY ${sort === 'rating' ? 'rating DESC' : sort === 'released' ? 'release_date ASC' : 'name ASC'}`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/refresh', async (req, res) => {
    try {
        const count = await fetchAndSaveGames();
        res.json({ message: `✅ ${count} games saved to database` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT COUNT(*) as total, MAX(created_at) as last_updated FROM games
        `);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../index.html'));
});

// Daily refresh at 08:00
cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running scheduled daily refresh...');
    try {
        const count = await fetchAndSaveGames();
        console.log(`✅ Scheduled refresh complete — ${count} games updated`);
    } catch (error) {
        console.error('❌ Scheduled refresh failed:', error.message);
    }
}, { timezone: 'Asia/Jerusalem' });

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    try {
        await fetchAndSaveGames();
    } catch (error) {
        console.error('❌ Initial fetch failed:', error.message);
        // Don't crash — server still runs
    }
});