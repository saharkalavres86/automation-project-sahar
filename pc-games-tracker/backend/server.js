import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import pool from './db.js';
import { fetchAndSaveGames } from './fetchGames.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// GET all games from DB
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

// POST refresh games manually
app.post('/api/refresh', async (req, res) => {
    try {
        const count = await fetchAndSaveGames();
        res.json({ message: `✅ ${count} games saved to database` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET stats
app.get('/api/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total,
                MAX(created_at) as last_updated
            FROM games
        `);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ⏰ Schedule daily refresh at 08:00
cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running scheduled daily refresh at 08:00...');
    try {
        const count = await fetchAndSaveGames();
        console.log(`✅ Scheduled refresh complete — ${count} games updated`);
    } catch (error) {
        console.error('❌ Scheduled refresh failed:', error.message);
    }
}, {
    timezone: 'Asia/Jerusalem'
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('⏰ Daily refresh scheduled at 08:00 (Israel time)');
    await fetchAndSaveGames();
});