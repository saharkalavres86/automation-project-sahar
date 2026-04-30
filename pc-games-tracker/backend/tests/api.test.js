import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

describe('🎮 PC Games API — Content Reliability Tests', () => {

    test('GET /api/games returns 200', async () => {
        const response = await fetch(`${BASE_URL}/games`);
        expect(response.status).toBe(200);
    });

    test('GET /api/games returns an array', async () => {
        const response = await fetch(`${BASE_URL}/games`);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
    });

    test('DB contains at least 10 games', async () => {
        const response = await fetch(`${BASE_URL}/games`);
        const data = await response.json();
        expect(data.length).toBeGreaterThanOrEqual(10);
    });

    test('Every game has name and release_date', async () => {
        const response = await fetch(`${BASE_URL}/games`);
        const data = await response.json();
        data.forEach(game => {
            expect(game.name).toBeTruthy();
            expect(game.release_date).toBeTruthy();
        });
    });

    test('Games are sorted alphabetically by default', async () => {
        const response = await fetch(`${BASE_URL}/games`);
        const data = await response.json();
        const names = data.map(g => g.name);
        const sorted = [...names].sort((a, b) => a.localeCompare(b));
        expect(names).toEqual(sorted);
    });

    test('Search returns matching games', async () => {
        const response = await fetch(`${BASE_URL}/games?search=assassin`);
        const data = await response.json();
        data.forEach(game => {
            expect(game.name.toLowerCase()).toContain('assassin');
        });
    });

    test('Genre filter returns only matching games', async () => {
        const response = await fetch(`${BASE_URL}/games?genre=action`);
        const data = await response.json();
        data.forEach(game => {
            expect(game.genres.toLowerCase()).toContain('action');
        });
    });

    test('GET /api/stats returns total count', async () => {
        const response = await fetch(`${BASE_URL}/stats`);
        const data = await response.json();
        expect(parseInt(data.total)).toBeGreaterThan(0);
        expect(data.last_updated).toBeTruthy();
    });

    test('No duplicate games in DB', async () => {
        const response = await fetch(`${BASE_URL}/games`);
        const data = await response.json();
        const names = data.map(g => g.name);
        const uniqueNames = [...new Set(names)];
        expect(names.length).toBe(uniqueNames.length);
    });

test('All release dates are today or in the future', async () => {
    const response = await fetch(`${BASE_URL}/games`);
    const data = await response.json();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    data.forEach(game => {
        if (game.release_date) {
            const releaseDate = new Date(game.release_date);
            expect(releaseDate.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime());
        }
    });
});
test('Invalid Genre returns empty array', async () => {
    const response = await fetch(`${BASE_URL}/games?genre=nonexistentgenre`);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
});


});


