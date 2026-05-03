import fetch from 'node-fetch';
import pool from './db.js';

const API_KEY = process.env.RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api';

const today = new Date().toISOString().split('T')[0];
const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

async function fetchScreenshots(gameId) {
    try {
        const response = await fetch(`${BASE_URL}/games/${gameId}/screenshots?key=${API_KEY}`);
        const data = await response.json();
        return data.results?.slice(0, 3).map(s => s.image).join(',') || '';
    } catch {
        return '';
    }
}

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
            const screenshots = await fetchScreenshots(game.id);

            await pool.query(`
                INSERT INTO games (rawg_id, name, release_date, rating, metacritic, background_image, genres, platforms, screenshots)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (rawg_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    release_date = EXCLUDED.release_date,
                    rating = EXCLUDED.rating,
                    metacritic = EXCLUDED.metacritic,
                    background_image = EXCLUDED.background_image,
                    genres = EXCLUDED.genres,
                    platforms = EXCLUDED.platforms,
                    screenshots = EXCLUDED.screenshots
            `, [
                game.id,
                game.name,
                game.released || null,
                game.rating > 0 ? game.rating : null,
                game.metacritic || null,
                game.background_image || null,
                genres,
                platforms,
                screenshots
            ]);
        }

        console.log('✅ All games saved to database!');
        return games.length;

    } catch (error) {
        console.error('❌ Error fetching games:', error);
        throw error;
    }
}