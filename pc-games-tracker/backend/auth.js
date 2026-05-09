import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './db.js';

const router = express.Router();

// ─── PASSPORT GOOGLE STRATEGY ────────────────────────────
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const display_name = profile.displayName;
        const avatar_url = profile.photos[0]?.value;
        const google_id = profile.id;

        // Check if user exists
        let result = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [google_id, email]);

        if (result.rows.length > 0) {
            // Update google_id if signed up with email before
            await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3', [google_id, avatar_url, result.rows[0].id]);
            return done(null, result.rows[0]);
        }

        // Create new user
        const newUser = await pool.query(`
            INSERT INTO users (email, google_id, display_name, avatar_url)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [email, google_id, display_name, avatar_url]);

        done(null, newUser.rows[0]);
    } catch (err) {
        done(err, null);
    }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ─── GOOGLE ROUTES ────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth?error=google', session: false }),
    (req, res) => {
        const token = jwt.sign(
            { userId: req.user.id, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        const user = {
            id: req.user.id,
            email: req.user.email,
            display_name: req.user.display_name,
            avatar_url: req.user.avatar_url
        };
        // Redirect to frontend with token
        res.redirect(`/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    }
);

// ─── REGISTER ────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { email, password, display_name } = req.body;

        if (!email || !password || !display_name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(`
            INSERT INTO users (email, password, display_name)
            VALUES ($1, $2, $3)
            RETURNING id, email, display_name
        `, [email, hashedPassword, display_name]);

        const user = result.rows[0];
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── LOGIN ────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                display_name: user.display_name,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── GET CURRENT USER ─────────────────────────────────────
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await pool.query(
            'SELECT id, email, display_name, avatar_url, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;