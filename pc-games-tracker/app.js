const BASE_URL = '/api';
let allGames = [];
let wishlist = new Set();
let userGameStatuses = new Map();
let userRatings = new Map();
let recentlyViewed = [];
let currentPage = 1;
let totalPages = 1;
let currentGenre = '';
let currentSort = 'name';
let currentSearch = '';

// ─── AUTH HELPERS ─────────────────────────────────────────
function getToken() {
    return localStorage.getItem('token');
}

function authHeaders() {
    const token = getToken();
    return token
        ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
}

function isLoggedIn() {
    return !!getToken();
}

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
    if (!isLoggedIn()) {
        wishlist = new Set();
        return;
    }
    try {
        const response = await fetch(`${BASE_URL}/wishlist`, { headers: authHeaders() });
        if (response.status === 401) { wishlist = new Set(); return; }
        const data = await response.json();
        wishlist = new Set(data.map(g => g.rawg_id));
        const btn = document.getElementById('wishlist-nav-btn');
        if (btn && data.length > 0) btn.textContent = `🔖 MY WISHLIST (${data.length})`;
    } catch (error) {
        console.error('Failed to load wishlist:', error);
    }
}

async function toggleWishlist(game, btn) {
    if (!isLoggedIn()) { window.location.href = '/auth'; return; }

    const isWishlisted = wishlist.has(game.rawg_id);

    if (isWishlisted) {
        await fetch(`${BASE_URL}/wishlist/${game.rawg_id}`, { method: 'DELETE', headers: authHeaders() });
        wishlist.delete(game.rawg_id);
        btn.textContent = '🔖';
        btn.title = 'Add to Wishlist';
        btn.classList.remove('wishlisted');
    } else {
        await fetch(`${BASE_URL}/wishlist`, {
            method: 'POST',
            headers: authHeaders(),
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

// ─── USER GAME STATUSES ───────────────────────────────────
async function loadUserGameStatuses() {
    if (!isLoggedIn()) return;
    try {
        const res = await fetch(`${BASE_URL}/user-games`, { headers: authHeaders() });
        const data = await res.json();
        userGameStatuses = new Map(data.map(g => [g.rawg_id, g.status]));
    } catch {}
}

// ─── USER RATINGS ─────────────────────────────────────────
async function loadUserRatings() {
    if (!isLoggedIn()) return;
    try {
        const res = await fetch(`${BASE_URL}/ratings`, { headers: authHeaders() });
        const data = await res.json();
        userRatings = new Map(data.map(r => [r.rawg_id, r.rating]));
    } catch {}
}

async function setRating(rawg_id, rating) {
    try {
        await fetch(`${BASE_URL}/ratings`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ rawg_id, rating })
        });
        userRatings.set(rawg_id, rating);
        updateCardRatingBadge(rawg_id, rating);
        playSound('wishlist');
    } catch (err) {
        console.error('Failed to set rating:', err);
    }
}

async function removeRating(rawg_id) {
    try {
        await fetch(`${BASE_URL}/ratings/${rawg_id}`, { method: 'DELETE', headers: authHeaders() });
        userRatings.delete(rawg_id);
        updateCardRatingBadge(rawg_id, null);
    } catch (err) {
        console.error('Failed to remove rating:', err);
    }
}

function updateCardRatingBadge(rawg_id, rating) {
    const card = document.querySelector(`.game-card[data-rawg-id="${rawg_id}"]`);
    if (!card) return;
    const badge = card.querySelector('.user-rating-badge');
    if (!badge) return;
    badge.innerHTML = rating
        ? `<span style="color:#f4c430;font-size:0.8rem;font-weight:700;font-family:'Rajdhani',sans-serif;">★ ${rating}/10</span>`
        : '';
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
    if (recentlyViewed.length === 0) { container.style.display = 'none'; return; }

    container.style.display = 'block';
    container.innerHTML = `
        <h3 style="font-family:'Orbitron',sans-serif;font-size:0.85rem;color:#00c8ff;letter-spacing:1px;margin-bottom:1rem;padding:0 2rem;">🕐 RECENTLY VIEWED</h3>
        <div style="display:flex;gap:1rem;padding:0 2rem;overflow-x:auto;padding-bottom:1rem;">
            ${recentlyViewed.map(game => `
                <div onclick="openModal(${JSON.stringify(game).replace(/"/g, '&quot;')})" style="flex-shrink:0;width:120px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <img src="${game.background_image || ''}" referrerpolicy="no-referrer" style="width:120px;height:70px;object-fit:cover;border-radius:8px;border:1px solid #7828c8;" onerror="this.style.display='none'">
                    <p style="font-size:0.7rem;color:#ccc;margin-top:0.3rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:'Rajdhani',sans-serif;font-weight:600;">${game.name}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// ─── FETCH GAMES ─────────────────────────────────────────
async function fetchGames(genre = '', ordering = 'name', page = 1, append = false) {
    if (!append) { showSkeletons(); allGames = []; currentPage = 1; }

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
        newGames.sort((a, b) => (isNewRelease(a.release_date) ? 0 : 1) - (isNewRelease(b.release_date) ? 0 : 1));

        if (append) { allGames = [...allGames, ...newGames]; appendGames(newGames); }
        else { allGames = newGames; displayGames(newGames); }

        updateLoadMoreBtn(data.total);
    } catch (error) {
        document.getElementById('games-grid').innerHTML = '<p style="color:#888;text-align:center;grid-column:1/-1">Failed to load games.</p>';
    }
}

async function loadMore() {
    await fetchGames(currentGenre, currentSort, currentPage + 1, true);
}

// ─── DISPLAY GAMES ───────────────────────────────────────
const statusLabels = { playing: '🎮 Playing', completed: '✅ Completed', backlog: '📋 Backlog', dropped: '❌ Dropped' };
const statusColors = { playing: '#00c8ff', completed: '#00ff88', backlog: '#7828c8', dropped: '#ff3c78' };

function createGameCard(game, index) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.dataset.rawgId = game.rawg_id;

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
    const newBadge = isNewRelease(game.release_date) ? `<span class="new-badge">🔥 This Week</span>` : '';
    const isWishlisted = wishlist.has(game.rawg_id);
    const gameStatus = userGameStatuses.get(game.rawg_id);
    const userRating = userRatings.get(game.rawg_id);

    const statusBadge = gameStatus ? `
        <span class="status-badge" style="position:absolute;top:10px;right:10px;background:${statusColors[gameStatus]};color:#000;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:700;z-index:1;font-family:'Rajdhani',sans-serif;">${statusLabels[gameStatus]}</span>
    ` : '';

    card.innerHTML = `
        ${newBadge}
        ${statusBadge}
        ${image}
        <div class="game-info">
            <div class="card-top">
                <h3>${game.name}</h3>
                <button class="wishlist-btn ${isWishlisted ? 'wishlisted' : ''}" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                    ${isWishlisted ? '❤️' : '🔖'}
                </button>
            </div>
            <div class="game-meta">
                <span class="release-date">📅 ${formatDate(game.release_date)}</span>
                <span class="rating">${rating}</span>
            </div>
            <div class="user-rating-badge" style="margin:0.2rem 0;">
                ${userRating ? `<span style="color:#f4c430;font-size:0.8rem;font-weight:700;font-family:'Rajdhani',sans-serif;">★ ${userRating}/10</span>` : ''}
            </div>
            <div class="countdown">${countdown || ''}</div>
            <div class="genres">${genres}</div>
        </div>
    `;

    const wishlistBtn = card.querySelector('.wishlist-btn');
    wishlistBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleWishlist(game, wishlistBtn); });
    card.addEventListener('click', () => { playSound('click'); addToRecentlyViewed(game); openModal(game); });

    return card;
}

function updateCardStatusBadge(rawg_id, status) {
    const card = document.querySelector(`.game-card[data-rawg-id="${rawg_id}"]`);
    if (!card) return;
    const existing = card.querySelector('.status-badge');
    if (existing) existing.remove();
    if (status) {
        const badge = document.createElement('span');
        badge.className = 'status-badge';
        badge.style.cssText = `position:absolute;top:10px;right:10px;background:${statusColors[status]};color:#000;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:700;z-index:1;font-family:'Rajdhani',sans-serif;`;
        badge.textContent = statusLabels[status];
        card.appendChild(badge);
    }
}

function displayGames(games) {
    const grid = document.getElementById('games-grid');
    grid.innerHTML = '';
    if (games.length === 0) {
        grid.innerHTML = '<p style="color:#888;text-align:center;grid-column:1/-1">No games found.</p>';
        return;
    }
    games.forEach((game, index) => grid.appendChild(createGameCard(game, index)));
}

function appendGames(games) {
    const grid = document.getElementById('games-grid');
    const startIndex = allGames.length - games.length;
    games.forEach((game, index) => grid.appendChild(createGameCard(game, startIndex + index)));
}

// ─── FETCH GAME DESCRIPTION ──────────────────────────────
async function fetchGameDescription(rawgId) {
    try {
        const response = await fetch(`${BASE_URL}/game/${rawgId}`);
        const data = await response.json();
        return data.description || null;
    } catch { return null; }
}

// ─── FETCH GAME TRAILER ──────────────────────────────────
async function fetchGameTrailer(rawgId) {
    try {
        const response = await fetch(`${BASE_URL}/game/${rawgId}/trailer`);
        const data = await response.json();
        return data.trailer || null;
    } catch { return null; }
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
        ? screenshotList.map((s, i) => `<img src="${s}" alt="screenshot" class="screenshot-img" referrerpolicy="no-referrer" data-index="${i}" data-screenshots='${JSON.stringify(screenshotList)}'>`).join('')
        : '';

    let currentStatus = null;
    let currentRating = null;
    if (isLoggedIn()) {
        try {
            const [gamesRes, ratingsRes] = await Promise.all([
                fetch(`${BASE_URL}/user-games`, { headers: authHeaders() }),
                fetch(`${BASE_URL}/ratings`, { headers: authHeaders() })
            ]);
            const userGames = await gamesRes.json();
            const userRatingsData = await ratingsRes.json();
            const foundGame = userGames.find(g => g.rawg_id === game.rawg_id);
            const foundRating = userRatingsData.find(r => r.rawg_id === game.rawg_id);
            if (foundGame) currentStatus = foundGame.status;
            if (foundRating) currentRating = foundRating.rating;
        } catch {}
    }

    const statusButtons = isLoggedIn() ? `
        <div style="margin-top:1.2rem;border-top:1px solid rgba(120,40,200,0.3);padding-top:1.2rem;">
            <p style="color:#00c8ff;font-family:'Orbitron',sans-serif;font-size:0.8rem;letter-spacing:1px;margin-bottom:0.8rem;">📋 MY LIST</p>
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                ${[
                    { status: 'playing', label: '🎮 Playing', color: '#00c8ff' },
                    { status: 'completed', label: '✅ Completed', color: '#00ff88' },
                    { status: 'backlog', label: '📋 Backlog', color: '#7828c8' },
                    { status: 'dropped', label: '❌ Dropped', color: '#ff3c78' }
                ].map(({ status, label, color }) => `
                    <button onclick="setGameStatus(${game.rawg_id}, '${status}', this, ${JSON.stringify(game).replace(/"/g, '&quot;')})"
                        data-status="${status}"
                        style="padding:0.5rem 1rem;border-radius:20px;border:2px solid ${color};background:${currentStatus === status ? color : 'transparent'};color:${currentStatus === status ? '#000' : color};font-family:'Rajdhani',sans-serif;font-weight:700;font-size:0.85rem;cursor:pointer;transition:all 0.2s;">
                        ${label}
                    </button>
                `).join('')}
                ${currentStatus ? `
                    <button onclick="removeGameStatus(${game.rawg_id}, this)"
                        style="padding:0.5rem 1rem;border-radius:20px;border:2px solid #555;background:transparent;color:#555;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:0.85rem;cursor:pointer;transition:all 0.2s;">
                        🗑️ Remove
                    </button>
                ` : ''}
            </div>
        </div>
    ` : `
        <div style="margin-top:1.2rem;border-top:1px solid rgba(120,40,200,0.3);padding-top:1.2rem;">
            <a href="/auth" style="color:#7828c8;font-family:'Rajdhani',sans-serif;font-size:0.9rem;">Sign in to track this game →</a>
        </div>
    `;

    const ratingSection = isLoggedIn() ? `
        <div style="margin-top:1.2rem;border-top:1px solid rgba(120,40,200,0.3);padding-top:1.2rem;">
            <p style="color:#00c8ff;font-family:'Orbitron',sans-serif;font-size:0.8rem;letter-spacing:1px;margin-bottom:0.8rem;">⭐ MY RATING</p>
            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                <div id="stars-${game.rawg_id}" style="display:flex;gap:0.2rem;">
                    ${Array.from({length: 10}, (_, i) => `
                        <span data-value="${i + 1}" style="font-size:1.4rem;cursor:pointer;transition:transform 0.1s;color:${currentRating && i < currentRating ? '#f4c430' : '#333'};display:inline-block;">★</span>
                    `).join('')}
                </div>
                <span id="rating-label-${game.rawg_id}" style="color:#f4c430;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:0.9rem;">
                    ${currentRating ? `${currentRating}/10` : 'Not rated'}
                </span>
                ${currentRating ? `
                    <button id="clear-rating-${game.rawg_id}" style="background:transparent;border:1px solid #555;color:#555;padding:0.2rem 0.6rem;border-radius:20px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-size:0.75rem;">✕ Clear</button>
                ` : ''}
            </div>
        </div>
    ` : '';

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
                <p>⭐ <strong>RAWG Rating:</strong> ${game.rating && game.rating > 0 ? game.rating + ' / 5' : 'Not rated yet'}</p>
                <p>🎭 <strong>Genres:</strong> ${game.genres || 'N/A'}</p>
                <p>🖥️ <strong>Platforms:</strong> ${game.platforms || 'N/A'}</p>
                <p>🎮 <strong>Metacritic:</strong> ${game.metacritic || 'Not rated yet'}</p>
                ${statusButtons}
                ${ratingSection}
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

    if (isLoggedIn()) {
        const starsContainer = document.getElementById(`stars-${game.rawg_id}`);
        if (starsContainer) {
            const stars = starsContainer.querySelectorAll('span');
            stars.forEach((star, i) => {
                star.addEventListener('mouseover', () => {
                    stars.forEach((s, j) => s.style.color = j <= i ? '#f4c430' : '#333');
                    star.style.transform = 'scale(1.3)';
                });
                star.addEventListener('mouseout', () => {
                    const current = userRatings.get(game.rawg_id) || 0;
                    stars.forEach((s, j) => s.style.color = j < current ? '#f4c430' : '#333');
                    star.style.transform = 'scale(1)';
                });
                star.addEventListener('click', async () => {
                    const rating = i + 1;
                    await setRating(game.rawg_id, rating);
                    stars.forEach((s, j) => s.style.color = j < rating ? '#f4c430' : '#333');
                    const label = document.getElementById(`rating-label-${game.rawg_id}`);
                    if (label) label.textContent = `${rating}/10`;
                });
            });

            const clearBtn = document.getElementById(`clear-rating-${game.rawg_id}`);
            if (clearBtn) {
                clearBtn.addEventListener('click', async () => {
                    await removeRating(game.rawg_id);
                    stars.forEach(s => s.style.color = '#333');
                    const label = document.getElementById(`rating-label-${game.rawg_id}`);
                    if (label) label.textContent = 'Not rated';
                    clearBtn.remove();
                });
            }
        }
    }

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

// ─── GAME STATUS ─────────────────────────────────────────
async function setGameStatus(rawg_id, status, clickedBtn, game) {
    try {
        await fetch(`${BASE_URL}/user-games`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ ...game, rawg_id, status })
        });

        const allBtns = clickedBtn.closest('div').querySelectorAll('button[data-status]');
        allBtns.forEach(btn => {
            btn.style.background = 'transparent';
            btn.style.color = statusColors[btn.dataset.status];
        });

        clickedBtn.style.background = statusColors[status];
        clickedBtn.style.color = '#000';
        userGameStatuses.set(rawg_id, status);
        updateCardStatusBadge(rawg_id, status);
        playSound('wishlist');
    } catch (err) {
        console.error('Failed to set game status:', err);
    }
}

async function removeGameStatus(rawg_id, btn) {
    try {
        await fetch(`${BASE_URL}/user-games/${rawg_id}`, { method: 'DELETE', headers: authHeaders() });
        btn.closest('div').querySelectorAll('button[data-status]').forEach(b => {
            b.style.background = 'transparent';
            b.style.color = statusColors[b.dataset.status];
        });
        btn.remove();
        userGameStatuses.delete(rawg_id);
        updateCardStatusBadge(rawg_id, null);
    } catch (err) {
        console.error('Failed to remove game status:', err);
    }
}

// ─── EVENT LISTENERS ─────────────────────────────────────
document.getElementById('search').addEventListener('input', (e) => {
    playSound('search');
    const query = e.target.value.toLowerCase();
    currentSearch = query;
    const filtered = allGames.filter(g => g.name.toLowerCase().includes(query));
    displayGames(filtered);

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
    await Promise.all([loadWishlist(), loadUserGameStatuses(), loadUserRatings()]);
    await fetchGames();
}

init();