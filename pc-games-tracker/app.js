const API_KEY = CONFIG.API_KEY;
const BASE_URL = 'https://api.rawg.io/api';
const today = new Date().toISOString().split('T')[0];
const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

let allGames = [];

function showSkeletons() {
    const grid = document.getElementById('games-grid');
    grid.innerHTML = Array(12).fill(`
        <div class="skeleton">
            <div class="skeleton-img"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line shorter"></div>
        </div>
    `).join('');
}

async function fetchGames(genre = '', ordering = 'name') {
    showSkeletons();

    const genreParam = genre ? `&genres=${genre}` : '';
    const url = `${BASE_URL}/games?key=${API_KEY}&dates=${today},${nextYear}&platforms=4&ordering=${ordering}&page_size=40${genreParam}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        allGames = data.results;
        displayGames(allGames);
    } catch (error) {
        document.getElementById('games-grid').innerHTML = '<p style="color:#888;text-align:center;grid-column:1/-1">Failed to load games.</p>';
    }
}

function displayGames(games) {
    const grid = document.getElementById('games-grid');
    grid.innerHTML = '';

    if (games.length === 0) {
        grid.innerHTML = '<p style="color:#888;text-align:center;grid-column:1/-1">No games found.</p>';
        return;
    }

    games.forEach((game, index) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.onclick = () => openModal(game);

        const image = game.background_image
            ? `<img src="${game.background_image}" alt="${game.name}" loading="lazy">`
            : `<div class="no-image">🎮</div>`;

        const genres = game.genres?.map(g => `<span class="genre-tag">${g.name}</span>`).join('') || '';
        const rating = game.rating ? `⭐ ${game.rating}/5` : 'No rating';

        card.innerHTML = `
            ${image}
            <div class="game-info">
                <h3>${game.name}</h3>
                <div class="game-meta">
                    <span class="release-date">📅 ${game.released || 'TBA'}</span>
                    <span class="rating">${rating}</span>
                </div>
                <div class="genres">${genres}</div>
            </div>
        `;

        grid.appendChild(card);
    });
}

function openModal(game) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const genres = game.genres?.map(g => g.name).join(', ') || 'N/A';
    const platforms = game.platforms?.map(p => p.platform.name).join(', ') || 'N/A';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
        <div class="modal">
            ${game.background_image ? `<img src="${game.background_image}" alt="${game.name}">` : ''}
            <div class="modal-body">
                <h2>${game.name}</h2>
                <p>📅 <strong>Release Date:</strong> ${game.released || 'TBA'}</p>
                <p>⭐ <strong>Rating:</strong> ${game.rating || 'N/A'} / 5</p>
                <p>🎭 <strong>Genres:</strong> ${genres}</p>
                <p>🖥️ <strong>Platforms:</strong> ${platforms}</p>
                <p>🎮 <strong>Metacritic:</strong> ${game.metacritic || 'N/A'}</p>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

document.getElementById('search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allGames.filter(g => g.name.toLowerCase().includes(query));
    displayGames(filtered);
});

document.getElementById('sort').addEventListener('change', (e) => {
    fetchGames(document.getElementById('genre').value, e.target.value);
});

document.getElementById('genre').addEventListener('change', (e) => {
    fetchGames(e.target.value, document.getElementById('sort').value);
});

fetchGames();