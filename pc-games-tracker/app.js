const BASE_URL = '/api';
let allGames = [];
let wishlist = new Set();
let recentlyViewed = [];
let currentPage = 1;
let totalPages = 1;
let currentGenre = '';
let currentSort = 'name';
let currentSearch = '';

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

function updateLoadMoreBtn(total) {
    const btn = document.getElementById('load-more-btn');
    const counter = document.getElementById('games-counter');
    const showing = Math.min(currentPage * 12, total);

    if (counter) counter.textContent = `Showing ${showing} of ${total} games`;
    if (btn) btn.style.display = currentPage >= totalPages ? 'none' : 'inline-block';
}

// ─── LIGHTBOX ────────────────────────────────────────────
function openLightbox(src, allScreenshots) {
    const existing = document.querySelector('.lightbox-overlay');
    if (existing) existing.remove();

    let currentIndex = allScreenshots.indexOf(src);

    function render() {
        const lightbox = document.querySelector('.lightbox-overlay');
        lightbox.querySelector('.lightbox-content img').src = allScreenshots[currentIndex];
        lightbox.querySelector('.prev-btn').style.opacity = currentIndex === 0 ? '0.3' : '1';
        lightbox.querySelector('.next-btn').style.opacity = currentIndex === allScreenshots.length - 1 ? '0.3' : '1';
    }

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.onclick = (e) => { if (e.target === lightbox) lightbox.remove(); };

    lightbox.innerHTML = `
        <button class="prev-btn lightbox-nav" onclick="event.stopPropagation()">&#8249;</button>
        <div class="lightbox-content">
            <img src="${src}" alt="screenshot" referrerpolicy="no-referrer">
            <button class="lightbox-close" onclick="this.closest('.lightbox-overlay').remove()">✕</button>
        </div>
        <button class="next-btn lightbox-nav" onclick="event.stopPropagation()">&#8250;</button>
    `;

    lightbox.querySelector('.prev-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex > 0) { currentIndex--; render(); }
    });

    lightbox.querySelector('.next-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex < allScreenshots.length - 1) { currentIndex++; render(); }
    });

    document.body.appendChild(lightbox);
}

// ─── WISHLIST ────────────────────────────────────────────
async function loadWishlist() {
    try {
        const response = await fetch(`${BASE_URL}/wishlist`);
        const data = await response.json();
        wishlist = new Set(data.map(g => g.rawg_id));

        const btn = document.getElementById('wishlist-nav-btn');
        if (btn && data.length > 0) {
            btn.textContent = `🔖 MY WISHLIST (${data.length})`;
        }
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

    const navBtn = document.getElementById('wishlist-nav-btn');
    if (navBtn) {
        const count = wishlist.size;
        navBtn.textContent = count > 0 ? `🔖 MY WISHLIST (${count})` : '🔖 MY WISHLIST';
    }

    playSound('wishlist');
}

// ─── RECENTLY VIEWED ─────────────────────────────────────
function addToRecentlyViewed(game) {
    recentlyViewed = recentlyViewed.filter(g => g.rawg_id !== game.rawg_id);
    recentlyViewed.unshift(game);
    recentlyViewed = recentlyViewed.slice(0, 5);
    renderRecentlyViewed();
}

function renderRecentlyViewed() {
    let container = document.getElementById('recently-viewed');
    if (!container) return;

    if (recentlyViewed.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = `
        <h3 style="
            font-family: 'Orbitron', sans-serif;
            font-size: 0.85rem;
            color: #00c8ff;
            letter-spacing: 1px;
            margin-bottom: 1rem;
            padding: 0 2rem;
        ">🕐 RECENTLY VIEWED</h3>
        <div style="display:flex;gap:1rem;padding:0 2rem;overflow-x:auto;padding-bottom:1rem;">
            ${recentlyViewed.map(game => `
                <div onclick="openModal(${JSON.stringify(game).replace(/"/g, '&quot;')})" style="
                    flex-shrink: 0;
                    width: 120px;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <img src="${game.background_image || ''}" 
                        referrerpolicy="no-referrer"
                        style="width:120px;height:70px;object-fit:cover;border-radius:8px;border:1px solid #7828c8;"
                        onerror="this.style.display='none'">
                    <p style="
                        font-size:0.7rem;
                        color:#ccc;
                        margin-top:0.3rem;
                        white-space:nowrap;
                        overflow:hidden;
                        text-overflow:ellipsis;
                        font-family:'Rajdhani',sans-serif;
                        font-weight:600;
                    ">${game.name}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// ─── FETCH GAMES ─────────────────────────────────────────
async function fetchGames(genre = '', ordering = 'name', page = 1, append = false) {
    if (!append) {
        showSkeletons();
        allGames = [];
        currentPage = 1;
    }

    currentGenre = genre;
    currentSort = ordering;

    const params = new URLSearchParams({ sort: ordering, page, limit: 12 });
    if (genre) params.append('genre', genre);

    try {
        const response = await fetch(`${BASE_URL}/games?${params}`);
        const data = await response.json();

        totalPages = data.totalPages;
        currentPage = data.page;

        const newGames = data.games;

        // Sort — this week first
        newGames.sort((a, b) => {
            const aNew = isNewRelease(a.release_date) ? 0 : 1;
            const bNew = isNewRelease(b.release_date) ? 0 : 1;
            return aNew - bNew;
        });

        if (append) {
            allGames = [...allGames, ...newGames];
            appendGames(newGames);
        } else {
            allGames = newGames;
            displayGames(newGames);
        }

        updateLoadMoreBtn(data.total);

    } catch (error) {
        document.getElementById('games-grid').innerHTML =
            '<p style="color:#888;text-align:center;grid-column:1/-1">Failed to load games.</p>';
    }
}

async function loadMore() {
    await fetchGames(currentGenre, currentSort, currentPage + 1, true);
}

// ─── DISPLAY GAMES ───────────────────────────────────────
function createGameCard(game, index) {
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
    : `<span style="color:#444;font-size:0.72rem;font-style:italic;">Not rated yet</span>`;

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

    const wishlistBtn = card.querySelector('.wishlist-btn');
    wishlistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlist(game, wishlistBtn);
    });

card.addEventListener('click', () => {
    playSound('click');
    addToRecentlyViewed(game);
    openModal(game);
});

    return card;
}

function displayGames(games) {
    const grid = document.getElementById('games-grid');
    grid.innerHTML = '';

    if (games.length === 0) {
        grid.innerHTML = '<p style="color:#888;text-align:center;grid-column:1/-1">No games found.</p>';
        return;
    }

    games.forEach((game, index) => {
        grid.appendChild(createGameCard(game, index));
    });
}

function appendGames(games) {
    const grid = document.getElementById('games-grid');
    const startIndex = allGames.length - games.length;
    games.forEach((game, index) => {
        grid.appendChild(createGameCard(game, startIndex + index));
    });
}

// ─── FETCH GAME DESCRIPTION ──────────────────────────────
async function fetchGameDescription(rawgId) {
    try {
        const response = await fetch(`${BASE_URL}/game/${rawgId}`);
        const data = await response.json();
        return data.description || null;
    } catch {
        return null;
    }
}

// ─── FETCH GAME TRAILER ──────────────────────────────────
async function fetchGameTrailer(rawgId) {
    try {
        const response = await fetch(`${BASE_URL}/game/${rawgId}/trailer`);
        const data = await response.json();
        return data.trailer || null;
    } catch {
        return null;
    }
}

// ─── MODAL ───────────────────────────────────────────────
function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
}

async function openModal(game) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    document.body.style.overflow = 'hidden';

    const screenshotList = game.screenshots ? game.screenshots.split(',') : [];

    const screenshots = screenshotList.length > 0
        ? screenshotList.map((s, i) =>
            `<img src="${s}" alt="screenshot" class="screenshot-img" referrerpolicy="no-referrer"
            data-index="${i}" data-screenshots='${JSON.stringify(screenshotList)}'>`
          ).join('')
        : '';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    overlay.innerHTML = `
        <div class="modal">
            <button class="modal-close-btn" onclick="closeModal()">✕</button>
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
                <div id="game-description" style="margin-top:1rem;">
                    <p><strong style="color:#00c8ff;">📖 Description:</strong></p>
                    <p id="description-text" style="margin-top:0.5rem;color:#888;font-style:italic;font-size:0.9rem;line-height:1.7;">Loading description...</p>
                </div>
                <div id="game-trailer"></div>
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

  const [description, trailer] = await Promise.all([
    fetchGameDescription(game.rawg_id),
    fetchGameTrailer(game.rawg_id)
]);

const descEl = document.getElementById('description-text');
if (descEl) {
    descEl.textContent = description || 'No description available.';
    descEl.style.fontStyle = description ? 'normal' : 'italic';
    descEl.style.color = description ? '#ccc' : '#666';
}

const trailerEl = document.getElementById('game-trailer');
if (trailerEl && trailer) {
    trailerEl.innerHTML = `
        <div style="margin-top:1rem;border-top:1px solid rgba(120,40,200,0.3);padding-top:1rem;">
            <p style="color:#00c8ff;font-family:'Orbitron',sans-serif;font-size:0.85rem;letter-spacing:1px;margin-bottom:0.8rem;">🎬 TRAILER</p>
            <video controls style="width:100%;border-radius:8px;border:1px solid #7828c8;" src="${trailer}"></video>
        </div>
    `;
}

    overlay.querySelectorAll('.screenshot-img').forEach(img => {
        img.addEventListener('click', () => {
            const screenshots = JSON.parse(img.dataset.screenshots);
            const index = parseInt(img.dataset.index);
            openLightbox(screenshots[index], screenshots);
        });
    });
}

// ─── EVENT LISTENERS ─────────────────────────────────────
document.getElementById('search').addEventListener('input', (e) => {
    playSound('search');
    const query = e.target.value.toLowerCase();
    currentSearch = query;
    const filtered = allGames.filter(g => g.name.toLowerCase().includes(query));
    displayGames(filtered);

    // Hide load more during search
    const btn = document.getElementById('load-more-btn');
    const counter = document.getElementById('games-counter');
    if (btn) btn.style.display = query ? 'none' : (currentPage >= totalPages ? 'none' : 'inline-block');
    if (counter) counter.textContent = query ? `Found ${filtered.length} games` : '';
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