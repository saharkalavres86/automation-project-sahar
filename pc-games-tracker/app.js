const BASE_URL = '/api';
let allGames = [];
let wishlist = new Set();

// ─── ARCADE SOUNDS ───────────────────────────────────────
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'hover') {
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    }

    if (type === 'click') {
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
    }

    if (type === 'wishlist') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }

    if (type === 'search') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.08);
    }
}

// ─── BACKGROUND MUSIC ────────────────────────────────────
let musicPlaying = false;
let musicNodes = [];

function startArcadeMusic() {
    if (musicPlaying) return;
    musicPlaying = true;

    const melody = [
        [523, 0.2], [659, 0.2], [784, 0.2], [1047, 0.4],
        [784, 0.2], [659, 0.2], [523, 0.4],
        [392, 0.2], [523, 0.2], [659, 0.2], [784, 0.4],
        [659, 0.2], [523, 0.2], [392, 0.4],
        [440, 0.2], [554, 0.2], [659, 0.2], [880, 0.4],
        [659, 0.2], [554, 0.2], [440, 0.4],
        [392, 0.2], [494, 0.2], [587, 0.2], [784, 0.4],
        [587, 0.2], [494, 0.2], [392, 0.6],
    ];

    let time = audioCtx.currentTime + 0.1;

    function playMelodyLoop() {
        melody.forEach(([freq, dur]) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.03, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur - 0.02);
            osc.start(time);
            osc.stop(time + dur);
            musicNodes.push(osc);
            time += dur;
        });

        const loopDelay = (time - audioCtx.currentTime) * 1000;
        setTimeout(() => {
            if (musicPlaying) playMelodyLoop();
        }, loopDelay);
    }

    playMelodyLoop();
}

function stopArcadeMusic() {
    musicPlaying = false;
    musicNodes.forEach(node => {
        try { node.stop(); } catch(e) {}
    });
    musicNodes = [];
}

function toggleMusic() {
    const btn = document.getElementById('music-btn');
    if (musicPlaying) {
        stopArcadeMusic();
        btn.textContent = '🎵 PLAY MUSIC';
        btn.style.background = 'linear-gradient(90deg, #ff3c78, #7828c8)';
    } else {
        audioCtx.resume();
        startArcadeMusic();
        btn.textContent = '🔇 STOP MUSIC';
        btn.style.background = 'linear-gradient(90deg, #7828c8, #00c8ff)';
    }
}

// ─── HELPERS ─────────────────────────────────────────────
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

// ─── WISHLIST ────────────────────────────────────────────
async function loadWishlist() {
    try {
        const response = await fetch(`${BASE_URL}/wishlist`);
        const data = await response.json();
        wishlist = new Set(data.map(g => g.rawg_id));
    } catch (error) {
        console.error('Failed to load wishlist:', error);
    }
}

async function toggleWishlist(game, btn) {
    const isWishlisted = wishlist.has(game.rawg_id);

    if (isWishlisted) {
        await fetch(`${BASE_URL}/wishlist/${game.rawg_id}`, { method: 'DELETE' });
        wishlist.delete(game.rawg_id);
        btn.textContent = '🔖';
        btn.title = 'Add to Wishlist';
        btn.classList.remove('wishlisted');
    } else {
        await fetch(`${BASE_URL}/wishlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(game)
        });
        wishlist.add(game.rawg_id);
        btn.textContent = '❤️';
        btn.title = 'Remove from Wishlist';
        btn.classList.add('wishlisted');
    }

    playSound('wishlist');
}

// ─── FETCH GAMES ─────────────────────────────────────────
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

// ─── DISPLAY GAMES ───────────────────────────────────────
function displayGames(games) {
    const grid = document.getElementById('games-grid');
    grid.innerHTML = '';

    if (games.length === 0) {
        grid.innerHTML = '<p style="color:#888;text-align:center;grid-column:1/-1">No games found.</p>';
        return;
    }

    // Always show "this week" games first
    games = [...games].sort((a, b) => {
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

        const isWishlisted = wishlist.has(game.rawg_id);

        card.innerHTML = `
            ${newBadge}
            ${image}
            <div class="game-info">
                <div class="card-top">
                    <h3>${game.name}</h3>
                    <button class="wishlist-btn ${isWishlisted ? 'wishlisted' : ''}"
                        title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                        ${isWishlisted ? '❤️' : '🔖'}
                    </button>
                </div>
                <div class="game-meta">
                    <span class="release-date">📅 ${formatDate(game.release_date)}</span>
                    <span class="rating">${rating}</span>
                </div>
                <div class="countdown">${countdown || ''}</div>
                <div class="genres">${genres}</div>
            </div>
        `;

        // Wishlist button click
        const wishlistBtn = card.querySelector('.wishlist-btn');
        wishlistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWishlist(game, wishlistBtn);
        });

        // Card hover sound
        card.addEventListener('mouseenter', () => playSound('hover'));

        // Card click opens modal
        card.addEventListener('click', () => {
            playSound('click');
            openModal(game);
        });

        grid.appendChild(card);
    });
}

// ─── MODAL ───────────────────────────────────────────────
function openModal(game) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const screenshots = game.screenshots
        ? game.screenshots.split(',').map(s =>
            `<img src="${s}" alt="screenshot" class="screenshot-img" referrerpolicy="no-referrer">`
          ).join('')
        : '';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
        <div class="modal">
            ${game.background_image ? `<img src="${game.background_image}" alt="${game.name}" class="modal-main-img" referrerpolicy="no-referrer">` : ''}
            <div class="modal-body">
                <h2>${game.name}</h2>
                ${isNewRelease(game.release_date) ? '<span class="new-badge" style="position:relative;top:0;left:0;display:inline-block;margin-bottom:0.8rem;">🔥 Releasing This Week!</span>' : ''}
                <p>📅 <strong>Release Date:</strong> ${formatDate(game.release_date)}</p>
                <p>⏳ <strong>Countdown:</strong> ${getCountdown(game.release_date) || 'TBA'}</p>
                <p>⭐ <strong>Rating:</strong> ${game.rating && game.rating > 0 ? game.rating + ' / 5' : 'Not rated yet'}</p>
                <p>🎭 <strong>Genres:</strong> ${game.genres || 'N/A'}</p>
                <p>🖥️ <strong>Platforms:</strong> ${game.platforms || 'N/A'}</p>
                <p>🎮 <strong>Metacritic:</strong> ${game.metacritic || 'Not rated yet'}</p>
                ${screenshots ? `
                    <div class="screenshots-section">
                        <h4>📸 SCREENSHOTS</h4>
                        <div class="screenshots-grid">${screenshots}</div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

// ─── EVENT LISTENERS ─────────────────────────────────────
document.getElementById('search').addEventListener('input', (e) => {
    playSound('search');
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

// ─── INIT ────────────────────────────────────────────────
async function init() {
    await loadWishlist();
    await fetchGames();
}

init();