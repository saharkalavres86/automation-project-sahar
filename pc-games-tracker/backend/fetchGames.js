import fetch from 'node-fetch';
import pool from './db.js';

const API_KEY = 'd1f9e385ad234f9bb6f057f2d50cfa91';
const BASE_URL = 'https://api.rawg.io/api';

const today = new Date().toISOString().split('T')[0];
const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export async function fetchAndSaveGames() {
    console.log('🎮 Fetching games from RAWG...');

    const url = `${BASE_URL}/games?key=${API_KEY}&dates=${today},${nextYear}&platforms=4&ordering=name&page_size=40`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const games = data.results;

        console.log(`📦 Found ${games.length} games — saving to DB...`);

        for (const game of games) {
            const genres = game.genres?.map(g => g.name).join(', ') || '';
            const platforms = game.platforms?.map(p => p.platform.name).join(', ') || '';

            await pool.query(`
                INSERT INTO games (rawg_id, name, release_date, rating, metacritic, background_image, genres, platforms)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (rawg_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    release_date = EXCLUDED.release_date,
                    rating = EXCLUDED.rating,
                    metacritic = EXCLUDED.metacritic,
                    background_image = EXCLUDED.background_image,
                    genres = EXCLUDED.genres,
                    platforms = EXCLUDED.platforms
            `, [
                game.id,
                game.name,
                game.released || null,
                game.rating || null,
                game.metacritic || null,
                game.background_image || null,
                genres,
                platforms
            ]);
        }

        console.log('✅ All games saved to database!');
        return games.length;

    } catch (error) {
        console.error('❌ Error fetching games:', error);
        throw error;
    }
}