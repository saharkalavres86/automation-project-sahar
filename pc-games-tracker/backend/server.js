import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import fetch from 'node-fetch';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import { fetchAndSaveGames } from './fetchGames.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../')));

// ─── GAMES ROUTES ────────────────────────────────────────
app.get('/api/games', async (req, res) => {
    try {
        const { genre, sort, search } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        let conditions = 'WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            conditions += ` AND name ILIKE $${params.length}`;
        }
        if (genre) {
            params.push(`%${genre}%`);
            conditions += ` AND genres ILIKE $${params.length}`;
        }

        const orderBy = sort === 'rating' ? 'rating DESC NULLS LAST'
            : sort === 'released' ? 'release_date ASC'
            : 'name ASC';

        // Count query
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM games ${conditions}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Data query
        const dataParams = [...params, limit, offset];
        const result = await pool.query(
            `SELECT * FROM games ${conditions} ORDER BY ${orderBy} LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
            dataParams
        );

        res.json({
            games: result.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Pagination
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 12;
const offset = (page - 1) * limit;

const countResult = await pool.query(query.replace('SELECT *', 'SELECT COUNT(*)'), params);
const total = parseInt(countResult.rows[0].count);

params.push(limit);
query += ` LIMIT $${params.length}`;
params.push(offset);
query += ` OFFSET $${params.length}`;

const result = await pool.query(query, params);
res.json({
    games: result.rows,
    total,
    page,
    totalPages: Math.ceil(total / limit)
});
   
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── SINGLE GAME DESCRIPTION ─────────────────────────────
app.get('/api/game/:id', async (req, res) => {
    try {
        const API_KEY = process.env.RAWG_API_KEY;
        const response = await fetch(`https://api.rawg.io/api/games/${req.params.id}?key=${API_KEY}`);
        const data = await response.json();
        const description = (data.description_raw || data.description?.replace(/<[^>]*>/g, '') || null)
    ?.replace(/###/g, '\n')
    ?.replace(/##/g, '\n')
    ?.replace(/#/g, '')
    ?.trim() || null;
        res.json({ description });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── REFRESH ROUTE ───────────────────────────────────────
app.post('/api/refresh', async (req, res) => {
    try {
        const count = await fetchAndSaveGames();
        res.json({ message: `✅ ${count} games saved to database` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── STATS ROUTE ─────────────────────────────────────────
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

// ─── HEALTH CHECK ─────────────────────────────────────────
app.get('/api/health', async (req, res) => {
    try {
        const db = await pool.query('SELECT COUNT(*) as total FROM games');
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            games_in_db: db.rows[0].total
        });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
});

// ─── WISHLIST ROUTES ─────────────────────────────────────
app.get('/api/wishlist', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wishlist ORDER BY added_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/wishlist', async (req, res) => {
    try {
        const { rawg_id, name, release_date, rating, background_image, genres, platforms } = req.body;
        await pool.query(`
            INSERT INTO wishlist (rawg_id, name, release_date, rating, background_image, genres, platforms)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (rawg_id) DO NOTHING
        `, [rawg_id, name, release_date, rating, background_image, genres, platforms]);
        res.json({ message: '✅ Added to wishlist' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/wishlist/:rawg_id', async (req, res) => {
    try {
        await pool.query('DELETE FROM wishlist WHERE rawg_id = $1', [req.params.rawg_id]);
        res.json({ message: '✅ Removed from wishlist' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── SERVE FRONTEND PAGES ────────────────────────────────
app.get('/wishlist', (req, res) => {
    res.sendFile(join(__dirname, '../wishlist.html'));
});

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../index.html'));
});

// ─── SCHEDULERS ───────────────────────────────────────────
cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily DB refresh at 08:00...');
    try {
        const count = await fetchAndSaveGames();
        console.log(`✅ Daily refresh complete — ${count} games updated`);
    } catch (error) {
        console.error('❌ Daily refresh failed:', error.message);
    }
}, { timezone: 'Asia/Jerusalem' });

cron.schedule('0 0 * * *', async () => {
    console.log('🏥 Running midnight health check...');
    try {
        const db = await pool.query('SELECT COUNT(*) as total FROM games');
        const total = parseInt(db.rows[0].total);
        if (total < 10) {
            console.error(`❌ Health check FAILED — only ${total} games, triggering refresh...`);
            await fetchAndSaveGames();
        } else {
            console.log(`✅ Health check passed — ${total} games in DB`);
        }
    } catch (error) {
        console.error('❌ Health check error:', error.message);
    }
}, { timezone: 'Asia/Jerusalem' });

// ─── START SERVER ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('⏰ Daily refresh scheduled at 08:00');
    console.log('🏥 Health check scheduled at midnight');
    try {
        await fetchAndSaveGames();
    } catch (error) {
        console.error('❌ Initial fetch failed:', error.message);
    }
});