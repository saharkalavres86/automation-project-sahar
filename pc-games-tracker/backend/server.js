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
            ON CONFLICT (rawg_id, user_id) DO NOTHING
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

// ─── USER GAMES ──────────────────────────────────────────
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
        const { rawg_id, name, background_image, release_date, rating, genres, status, completion } = req.body;
        await pool.query(`
            INSERT INTO user_games (user_id, rawg_id, name, background_image, release_date, rating, genres, status, completion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id, rawg_id) DO UPDATE SET status = $8, completion = $9
        `, [req.userId, rawg_id, name, background_image, release_date, rating, genres, status, completion || 0]);
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

// ─── USER REVIEWS ─────────────────────────────────────────
app.get('/api/reviews', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM user_reviews WHERE user_id = $1 ORDER BY updated_at DESC',
            [req.userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reviews/:rawg_id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ur.*, u.display_name, u.avatar_url
            FROM user_reviews ur
            JOIN users u ON ur.user_id = u.id
            WHERE ur.rawg_id = $1
            ORDER BY ur.created_at DESC
        `, [req.params.rawg_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reviews', authenticate, async (req, res) => {
    try {
        const { rawg_id, game_name, review_text } = req.body;
        if (!rawg_id || !review_text?.trim()) {
            return res.status(400).json({ error: 'rawg_id and review_text are required' });
        }
        await pool.query(`
            INSERT INTO user_reviews (user_id, rawg_id, game_name, review_text)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, rawg_id) DO UPDATE SET review_text = $4, updated_at = NOW()
        `, [req.userId, rawg_id, game_name, review_text.trim()]);
        res.json({ message: '✅ Review saved' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/reviews/:rawg_id', authenticate, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM user_reviews WHERE rawg_id = $1 AND user_id = $2',
            [req.params.rawg_id, req.userId]
        );
        res.json({ message: '✅ Review deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── RAWG GAME SEARCH ─────────────────────────────────────
app.get('/api/search-rawg', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) return res.json({ games: [] });

        const API_KEY = process.env.RAWG_API_KEY;
        const response = await fetch(
            `https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=10&ordering=-rating`
        );
        const data = await response.json();

        const games = (data.results || []).map(g => ({
            rawg_id: g.id,
            name: g.name,
            release_date: g.released,
            rating: g.rating,
            background_image: g.background_image,
            genres: g.genres?.map(x => x.name).join(', ') || '',
            platforms: g.platforms?.map(x => x.platform.name).join(', ') || '',
            metacritic: g.metacritic
        }));

        res.json({ games });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── DISCOVER / HIDDEN GEMS ───────────────────────────────
app.get('/api/discover', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        let favoriteGenres = [];

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const { userId } = decoded;
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

app.get('/api/discover/genre', async (req, res) => {
    try {
        const { genre } = req.query;
        const API_KEY = process.env.RAWG_API_KEY;
        const gemsRes = await fetch(
            `https://api.rawg.io/api/games?key=${API_KEY}&genres=${genre}&ordering=-rating&page_size=20&ratings_count=10`
        );
        const gemsData = await gemsRes.json();
        res.json({ gems: gemsData.results || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── SOCIAL / FRIENDS ─────────────────────────────────────
app.post('/api/follow/:userId', authenticate, async (req, res) => {
    try {
        const followingId = parseInt(req.params.userId);
        if (followingId === req.userId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }
        await pool.query(`
            INSERT INTO friendships (follower_id, following_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `, [req.userId, followingId]);
        res.json({ message: '✅ Following!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/follow/:userId', authenticate, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM friendships WHERE follower_id = $1 AND following_id = $2',
            [req.userId, parseInt(req.params.userId)]
        );
        res.json({ message: '✅ Unfollowed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/following', authenticate, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.display_name, u.avatar_url, f.created_at
            FROM friendships f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = $1
            ORDER BY f.created_at DESC
        `, [req.userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/followers', authenticate, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.display_name, u.avatar_url, f.created_at
            FROM friendships f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = $1
            ORDER BY f.created_at DESC
        `, [req.userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/feed', authenticate, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ug.rawg_id, ug.name, ug.background_image, ug.status, ug.genres,
                ug.added_at,
                u.id as user_id, u.display_name, u.avatar_url
            FROM user_games ug
            JOIN users u ON ug.user_id = u.id
            WHERE ug.user_id IN (
                SELECT following_id FROM friendships WHERE follower_id = $1
            )
            ORDER BY ug.added_at DESC
            LIMIT 30
        `, [req.userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/search', authenticate, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) return res.json([]);
        const result = await pool.query(`
            SELECT u.id, u.display_name, u.avatar_url,
                EXISTS(
                    SELECT 1 FROM friendships
                    WHERE follower_id = $1 AND following_id = u.id
                ) as is_following
            FROM users u
            WHERE u.id != $1
            AND u.display_name ILIKE $2
            LIMIT 10
        `, [req.userId, `%${query}%`]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:userId', async (req, res) => {
    try {
        const userResult = await pool.query(
            'SELECT id, display_name, avatar_url, created_at FROM users WHERE id = $1',
            [req.params.userId]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        const [gamesResult, followersResult, followingResult] = await Promise.all([
            pool.query('SELECT * FROM user_games WHERE user_id = $1 ORDER BY added_at DESC', [user.id]),
            pool.query('SELECT COUNT(*) FROM friendships WHERE following_id = $1', [user.id]),
            pool.query('SELECT COUNT(*) FROM friendships WHERE follower_id = $1', [user.id])
        ]);
        res.json({
            user,
            games: gamesResult.rows,
            followers: parseInt(followersResult.rows[0].count),
            following: parseInt(followingResult.rows[0].count)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── NOTIFICATIONS ─────────────────────────────────────────
app.get('/api/notifications', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
            [req.userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/notifications/read', authenticate, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
            [req.userId]
        );
        res.json({ message: '✅ All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/notifications/read/:id', authenticate, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );
        res.json({ message: '✅ Notification marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/notifications', authenticate, async (req, res) => {
    try {
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [req.userId]);
        res.json({ message: '✅ All notifications cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── EXPORT LIBRARY AS CSV ─────────────────────────────────
app.get('/api/export-library', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM user_games WHERE user_id = $1 ORDER BY status, name',
            [req.userId]
        );
        const rows = result.rows;
        const headers = ['Name', 'Status', 'Completion %', 'Rating', 'Genres', 'Release Date', 'Added At'];
        const csv = [
            headers.join(','),
            ...rows.map(g => [
                `"${(g.name || '').replace(/"/g, '""')}"`,
                g.status || '',
                g.completion || 0,
                g.rating || '',
                `"${(g.genres || '').replace(/"/g, '""')}"`,
                g.release_date ? new Date(g.release_date).toLocaleDateString('en-US') : '',
                g.added_at ? new Date(g.added_at).toLocaleDateString('en-US') : ''
            ].join(','))
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="my-games-library.csv"');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── AI TEST GENERATOR ─────────────────────────────────────
app.post('/api/generate-tests', async (req, res) => {
    try {
        const { feature, url, context } = req.body;
        if (!feature) return res.status(400).json({ error: 'Feature description is required' });

        const appUrl = url || 'https://automation-project-sahar-production.up.railway.app';

        const prompt = `You are an expert QA automation engineer specializing in Playwright. Generate comprehensive Playwright test cases in JavaScript for the following feature of the Games Tracker web application.

App URL: ${appUrl}
Feature to test: ${feature}
${context ? `Additional context: ${context}` : ''}

App context: Games Tracker is a game tracking platform where users can browse upcoming games, manage a personal library (Playing/Completed/Backlog/Dropped), rate games 1-10, write reviews, add games to wishlist, follow friends, see a social feed, discover hidden gems, and receive notifications.

Requirements for the generated tests:
1. Use: import { test, expect } from '@playwright/test';
2. Use: const BASE_URL = '${appUrl}';
3. Wrap all tests in a descriptive test.describe block
4. Cover: happy path, edge cases, unauthenticated state, error states
5. Use good selectors: prefer id, role, text over CSS classes
6. Add waitForTimeout only when truly necessary (API calls, animations)
7. Each test should be independent and descriptive
8. Include at least 6-10 tests
9. Add comments explaining what each test group covers

Return ONLY the JavaScript code. No markdown, no backticks, no explanation.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 4000,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        const tests = data.content[0].text;
        res.json({ tests });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── SERVE FRONTEND PAGES ────────────────────────────────
app.get('/wishlist', (req, res) => res.sendFile(join(__dirname, '../wishlist.html')));
app.get('/auth', (req, res) => res.sendFile(join(__dirname, '../auth.html')));
app.get('/auth/callback', (req, res) => res.sendFile(join(__dirname, '../auth-callback.html')));
app.get('/library', (req, res) => res.sendFile(join(__dirname, '../library.html')));
app.get('/profile', (req, res) => res.sendFile(join(__dirname, '../profile.html')));
app.get('/discover', (req, res) => res.sendFile(join(__dirname, '../discover.html')));
app.get('/social', (req, res) => res.sendFile(join(__dirname, '../social.html')));
app.get('/user/:userId', (req, res) => res.sendFile(join(__dirname, '../user-profile.html')));
app.get('/ai-tester', (req, res) => res.sendFile(join(__dirname, '../ai-tester.html')));
app.get('/', (req, res) => res.sendFile(join(__dirname, '../index.html')));

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

// ─── SCHEDULERS ───────────────────────────────────────────
cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily DB refresh and release alerts at 08:00...');
    try {
        const count = await fetchAndSaveGames();
        console.log(`✅ Daily refresh complete — ${count} games updated`);

        // Send email alerts
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

        // Generate release notifications
        const wishlistItems = await pool.query(`
            SELECT w.*, w.user_id FROM wishlist w
            WHERE w.release_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        `);
        for (const item of wishlistItems.rows) {
            const daysLeft = Math.ceil((new Date(item.release_date) - new Date()) / (1000 * 60 * 60 * 24));
            const message = daysLeft === 0
                ? `🔥 ${item.name} is releasing TODAY!`
                : `⏳ ${item.name} releases in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!`;
            try {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, message, rawg_id, game_name, background_image)
                    VALUES ($1, 'release', $2, $3, $4, $5)
                    ON CONFLICT DO NOTHING
                `, [item.user_id, message, item.rawg_id, item.name, item.background_image]);
            } catch {}
        }

        // Generate friend activity notifications
        const recentActivity = await pool.query(`
            SELECT ug.*, u.display_name, f.follower_id as notify_user_id
            FROM user_games ug
            JOIN users u ON ug.user_id = u.id
            JOIN friendships f ON f.following_id = ug.user_id
            WHERE ug.added_at >= NOW() - INTERVAL '1 day'
        `);
        for (const activity of recentActivity.rows) {
            const message = `👥 ${activity.display_name} marked ${activity.name} as ${activity.status}`;
            try {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, message, rawg_id, game_name, background_image)
                    VALUES ($1, 'friend_activity', $2, $3, $4, $5)
                `, [activity.notify_user_id, message, activity.rawg_id, activity.name, activity.background_image]);
            } catch {}
        }

    } catch (error) {
        console.error('❌ Daily refresh failed:', error.message);
    }
}, { timezone: 'Asia/Jerusalem' });

// ─── START SERVER ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('⏰ Daily refresh scheduled at 08:00');
    try {
        await fetchAndSaveGames();
    } catch (error) {
        console.error('❌ Initial fetch failed:', error.message);
    }
});