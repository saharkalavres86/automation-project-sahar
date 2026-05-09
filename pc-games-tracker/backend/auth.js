import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const router = express.Router();

// ─── REGISTER ────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { email, password, display_name } = req.body;

        if (!email || !password || !display_name) {
    return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query(`
            INSERT INTO users (email, password, display_name)
            VALUES ($1, $2, $3)
            RETURNING id, email, display_name
        `, [email, hashedPassword, display_name || email.split('@')[0]]);

        const user = result.rows[0];

        // Generate JWT
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

        // Find user
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Check password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT
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