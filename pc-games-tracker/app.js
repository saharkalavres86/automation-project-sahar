const BASE_URL = '/api';

let allGames = [];

function formatDate(dateStr) {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

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

    const params = new URLSearchParams({ sort: ordering });
    if (genre) params.append('genre', genre);

    try {
        const response = await fetch(`${BASE_URL}/games?${params}`);
        allGames = await response.json();
        displayGames(allGames);
    } catch (error) {
        document.getElementById('games-grid').innerHTML =
            '<p style="color:#888;text-align:center;grid-column:1/-1">Failed to load games.</p>';
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

        const genres = game.genres
            ? game.genres.split(', ').map(g => `<span class="genre-tag">${g}</span>`).join('')
            : '';

        const rating = game.rating && game.rating > 0
            ? `⭐ ${game.rating}/5`
            : 'Not rated yet';

        card.innerHTML = `
            ${image}
            <div class="game-info">
                <h3>${game.name}</h3>
                <div class="game-meta">
                    <span class="release-date">📅 ${formatDate(game.release_date)}</span>
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

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
        <div class="modal">
            ${game.background_image ? `<img src="${game.background_image}" alt="${game.name}">` : ''}
            <div class="modal-body">
                <h2>${game.name}</h2>
                <p>📅 <strong>Release Date:</strong> ${formatDate(game.release_date)}</p>
                <p>⭐ <strong>Rating:</strong> ${game.rating && game.rating > 0 ? game.rating + ' / 5' : 'Not rated yet'}</p>
                <p>🎭 <strong>Genres:</strong> ${game.genres || 'N/A'}</p>
                <p>🖥️ <strong>Platforms:</strong> ${game.platforms || 'N/A'}</p>
                <p>🎮 <strong>Metacritic:</strong> ${game.metacritic || 'Not rated yet'}</p>
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