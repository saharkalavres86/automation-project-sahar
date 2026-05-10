import { sendReleaseAlert } from './emailService.js';
import authRouter from './auth.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import fetch from 'node-fetch';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import { fetchAndSaveGames } from './fetchGames.js';
import session from 'express-session';
import passport from 'passport';
import jwt from 'jsonwebtoken';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRouter);
app.use(express.static(join(__dirname, '../')));

// ─── AUTH MIDDLEWARE ──────────────────────────────────────
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

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

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM games ${conditions}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

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

// ─── EMAIL SUBSCRIPTION ──────────────────────────────────
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        await pool.query(`
            INSERT INTO subscribers (email)
            VALUES ($1)
            ON CONFLICT (email) DO NOTHING
        `, [email]);

        res.json({ message: '✅ Subscribed successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/subscribe/:email', async (req, res) => {
    try {
        await pool.query('DELETE FROM subscribers WHERE email = $1', [req.params.email]);
        res.json({ message: '✅ Unsubscribed successfully!' });
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

// ─── GAME TRAILER ─────────────────────────────────────────
app.get('/api/game/:id/trailer', async (req, res) => {
    try {
        const API_KEY = process.env.RAWG_API_KEY;
        const response = await fetch(`https://api.rawg.io/api/games/${req.params.id}/movies?key=${API_KEY}`);
        const data = await response.json();
        const trailer = data.results?.[0]?.data?.max || null;
        res.json({ trailer });
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
app.get('/api/wishlist', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM wishlist WHERE user_id = $1 ORDER BY added_at DESC',
            [req.userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/wishlist', authenticate, async (req, res) => {
    try {
        const { rawg_id, name, release_date, rating, background_image, genres, platforms } = req.body;
        await pool.query(`
            INSERT INTO wishlist (rawg_id, name, release_date, rating, background_image, genres, platforms, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (rawg_id) DO NOTHING
        `, [rawg_id, name, release_date, rating, background_image, genres, platforms, req.userId]);
        res.json({ message: '✅ Added to wishlist' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/wishlist/:rawg_id', authenticate, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM wishlist WHERE rawg_id = $1 AND user_id = $2',
            [req.params.rawg_id, req.userId]
        );
        res.json({ message: '✅ Removed from wishlist' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── USER GAMES (BACKLOG) ─────────────────────────────────
app.get('/api/user-games', authenticate, async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT * FROM user_games WHERE user_id = $1';
        const params = [req.userId];
        if (status) {
            query += ' AND status = $2';
            params.push(status);
        }
        query += ' ORDER BY added_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/user-games', authenticate, async (req, res) => {
    try {
        const { rawg_id, name, background_image, release_date, rating, genres, status } = req.body;
        await pool.query(`
            INSERT INTO user_games (user_id, rawg_id, name, background_image, release_date, rating, genres, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id, rawg_id) DO UPDATE SET status = $8
        `, [req.userId, rawg_id, name, background_image, release_date, rating, genres, status]);
        res.json({ message: '✅ Game status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/user-games/:rawg_id', authenticate, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM user_games WHERE rawg_id = $1 AND user_id = $2',
            [req.params.rawg_id, req.userId]
        );
        res.json({ message: '✅ Game removed from list' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── USER RATINGS ─────────────────────────────────────────
app.get('/api/ratings', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM user_ratings WHERE user_id = $1',
            [req.userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ratings', authenticate, async (req, res) => {
    try {
        const { rawg_id, rating } = req.body;
        if (!rawg_id || !rating || rating < 1 || rating > 10) {
            return res.status(400).json({ error: 'Invalid rating' });
        }
        await pool.query(`
            INSERT INTO user_ratings (user_id, rawg_id, rating)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, rawg_id) DO UPDATE SET rating = $3
        `, [req.userId, rawg_id, rating]);
        res.json({ message: '✅ Rating saved' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/ratings/:rawg_id', authenticate, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM user_ratings WHERE rawg_id = $1 AND user_id = $2',
            [req.params.rawg_id, req.userId]
        );
        res.json({ message: '✅ Rating removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── SERVE FRONTEND PAGES ────────────────────────────────
app.get('/wishlist', (req, res) => {
    res.sendFile(join(__dirname, '../wishlist.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(join(__dirname, '../auth.html'));
});

app.get('/auth/callback', (req, res) => {
    res.sendFile(join(__dirname, '../auth-callback.html'));
});

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../index.html'));
});

// ─── SCHEDULERS ───────────────────────────────────────────
cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily DB refresh and release alerts at 08:00...');
    try {
        const count = await fetchAndSaveGames();
        console.log(`✅ Daily refresh complete — ${count} games updated`);

        const subscribers = await pool.query('SELECT email FROM subscribers');
        for (const subscriber of subscribers.rows) {
            try {
                const upcomingGames = await pool.query(`
                    SELECT w.* FROM wishlist w
                    WHERE w.release_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
                `);
                if (upcomingGames.rows.length > 0) {
                    await sendReleaseAlert(subscriber.email, upcomingGames.rows);
                }
            } catch (emailError) {
                console.error(`❌ Failed to send alert to ${subscriber.email}:`, emailError.message);
            }
        }
    } catch (error) {
        console.error('❌ Daily refresh failed:', error.message);
    }
}, { timezone: 'Asia/Jerusalem' });

// ─── TEST EMAIL ALERT ─────────────────────────────────────
app.post('/api/test-alert', async (req, res) => {
    try {
        const { email } = req.body;
        const games = await pool.query(`SELECT * FROM wishlist LIMIT 3`);

        if (games.rows.length === 0) {
            return res.json({ message: 'No games in wishlist to test with' });
        }

        await sendReleaseAlert(email, games.rows);
        res.json({ message: `✅ Test alert sent to ${email}` });
    } catch (error) {
        console.error('❌ test-alert error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

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

// ─── LIBRARY ───────────────────────────────────────────────
app.get('/library', (req, res) => {
    res.sendFile(join(__dirname, '../library.html'));
});

// ─── PROFILE ───────────────────────────────────────────────
app.get('/profile', (req, res) => {
    res.sendFile(join(__dirname, '../profile.html'));
});

// ─── DISCOVER / HIDDEN GEMS ───────────────────────────────
app.get('/api/discover', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        let favoriteGenres = [];

        // If logged in, find user's favorite genres from ratings
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.userId;

                const ratedGames = await pool.query(`
                    SELECT ug.genres, ur.rating
                    FROM user_ratings ur
                    JOIN user_games ug ON ur.rawg_id = ug.rawg_id AND ug.user_id = ur.user_id
                    WHERE ur.user_id = $1 AND ur.rating >= 7
                `, [userId]);

                const genreCount = {};
                ratedGames.rows.forEach(g => {
                    if (g.genres) {
                        g.genres.split(', ').forEach(genre => {
                        genreCount[genre] = (genreCount[genre] || 0) + 1;
                        });
                    }
                });

                favoriteGenres = Object.entries(genreCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([genre]) => genre);
            } catch {}
        }

        const API_KEY = process.env.RAWG_API_KEY;
        const results = {};

        // Fetch personalized gems if user has favorite genres
        if (favoriteGenres.length > 0) {
            const genreQuery = favoriteGenres[0].toLowerCase();
            const personalRes = await fetch(
                `https://api.rawg.io/api/games?key=${API_KEY}&genres=${genreQuery}&ordering=-rating&page_size=10&ratings_count=10&metacritic=60,100`
            );
            const personalData = await personalRes.json();
            results.personalized = {
                games: personalData.results || [],
                genre: favoriteGenres[0]
            };
        }

        // Fetch general hidden gems
        const gemsRes = await fetch(
            `https://api.rawg.io/api/games?key=${API_KEY}&ordering=-rating&page_size=20&ratings_count=10&metacritic=70,100`
        );
        const gemsData = await gemsRes.json();
        results.gems = gemsData.results || [];

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/discover', (req, res) => {
    res.sendFile(join(__dirname, '../discover.html'));
});
