const BASE_URL = '/api';

function formatDate(dateStr) {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function getCountdown(dateStr) {
    if (!dateStr) return null;
    const release = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((release - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Released';
    if (diff === 0) return '🔥 Today!';
    if (diff <= 7) return `🔥 ${diff} days left`;
    if (diff <= 30) return `⏳ ${diff} days left`;
    return `📅 ${diff} days left`;
}

function isNewRelease(dateStr) {
    if (!dateStr) return false;
    const release = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((release - now) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
}

async function removeFromWishlist(rawg_id, card) {
    await fetch(`${BASE_URL}/wishlist/${rawg_id}`, { method: 'DELETE' });
    card.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
        card.remove();
        updateStats();
    }, 300);
}

function updateStats() {
    const count = document.querySelectorAll('.game-card').length;
    const stats = document.getElementById('wishlist-stats');
    if (count === 0) {
        stats.innerHTML = '';
        document.getElementById('games-grid').innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:4rem;color:#888;">
                <div style="font-size:4rem;margin-bottom:1rem;">🔖</div>
                <p style="font-family:'Orbitron',sans-serif;font-size:1rem;color:#7828c8;">Your wishlist is empty</p>
                <p style="margin-top:0.5rem;font-size:0.9rem;">Go back and add some games!</p>
                <a href="/" style="display:inline-block;margin-top:1.5rem;background:linear-gradient(90deg,#ff3c78,#7828c8);color:white;padding:0.6rem 1.5rem;border-radius:20px;text-decoration:none;font-family:'Orbitron',sans-serif;font-size:0.75rem;letter-spacing:1px;">🎮 BROWSE GAMES</a>
            </div>
        `;
    } else {
        stats.innerHTML = `⭐ ${count} game${count > 1 ? 's' : ''} in your wishlist`;
    }
}

async function loadWishlist() {
    const grid = document.getElementById('games-grid');
    const stats = document.getElementById('wishlist-stats');

    try {
        const response = await fetch(`${BASE_URL}/wishlist`);
        const games = await response.json();

        if (games.length === 0) {
            stats.innerHTML = '';
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:4rem;color:#888;">
                    <div style="font-size:4rem;margin-bottom:1rem;">🔖</div>
                    <p style="font-family:'Orbitron',sans-serif;font-size:1rem;color:#7828c8;">Your wishlist is empty</p>
                    <p style="margin-top:0.5rem;font-size:0.9rem;">Go back and add some games!</p>
                    <a href="/" style="display:inline-block;margin-top:1.5rem;background:linear-gradient(90deg,#ff3c78,#7828c8);color:white;padding:0.6rem 1.5rem;border-radius:20px;text-decoration:none;font-family:'Orbitron',sans-serif;font-size:0.75rem;letter-spacing:1px;">🎮 BROWSE GAMES</a>
                </div>
            `;
            return;
        }

        stats.innerHTML = `⭐ ${games.length} game${games.length > 1 ? 's' : ''} in your wishlist`;

        // Sort — this week first
        games.sort((a, b) => {
            const aNew = isNewRelease(a.release_date) ? 0 : 1;
            const bNew = isNewRelease(b.release_date) ? 0 : 1;
            return aNew - bNew;
        });

        games.forEach((game, index) => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.style.animationDelay = `${index * 0.05}s`;

            const image = game.background_image
                ? `<img src="${game.background_image}" alt="${game.name}" loading="lazy" referrerpolicy="no-referrer">`
                : `<div class="no-image">🎮</div>`;

            const genres = game.genres
                ? game.genres.split(', ').map(g => `<span class="genre-tag">${g}</span>`).join('')
                : '';

            const rating = game.rating && game.rating > 0
                ? `⭐ ${game.rating}/5`
                : 'Not rated yet';

            const countdown = getCountdown(game.release_date);
            const newBadge = isNewRelease(game.release_date)
                ? `<span class="new-badge">🔥 This Week</span>`
                : '';

            card.innerHTML = `
                ${newBadge}
                ${image}
                <div class="game-info">
                    <div class="card-top">
                        <h3>${game.name}</h3>
                        <button class="wishlist-btn wishlisted" title="Remove from Wishlist">❤️</button>
                    </div>
                    <div class="game-meta">
                        <span class="release-date">📅 ${formatDate(game.release_date)}</span>
                        <span class="rating">${rating}</span>
                    </div>
                    <div class="countdown">${countdown || ''}</div>
                    <div class="genres">${genres}</div>
                </div>
            `;

            const wishlistBtn = card.querySelector('.wishlist-btn');
            wishlistBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromWishlist(game.rawg_id, card);
            });

            grid.appendChild(card);
        });

    } catch (error) {
        grid.innerHTML = '<p style="color:#888;text-align:center;grid-column:1/-1">Failed to load wishlist.</p>';
    }
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.8); }
    }
`;
document.head.appendChild(style);

loadWishlist();