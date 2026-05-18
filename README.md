# 🎮 Games Tracker — Full Stack Web Platform

![CI/CD](https://github.com/saharkalavres86/automation-project-sahar/actions/workflows/playwright.yml/badge.svg)

A production-grade full stack game tracking platform with user authentication, personalized libraries, social features, hidden gem discovery, and a complete test automation framework — built from scratch by a Senior QA Engineer transitioning into automation.

🔗 **Live App:** [automation-project-sahar-production.up.railway.app](https://automation-project-sahar-production.up.railway.app)

---

## 🚀 What This Project Does

A game tracking and discovery platform where users can browse upcoming PC game releases, manage personal game libraries, rate and review games, track completion progress, follow friends, and discover hidden gems — all backed by a real-time RAWG API integration and a PostgreSQL database.

---

## 🏗️ Architecture

```
automation-project/
├── pc-games-tracker/
│   ├── index.html              ← Main games page
│   ├── wishlist.html           ← Wishlist page
│   ├── library.html            ← Personal game library
│   ├── profile.html            ← User profile & stats
│   ├── user-profile.html       ← Public user profile
│   ├── discover.html           ← Hidden gems discovery
│   ├── social.html             ← Friends & social feed
│   ├── auth.html               ← Login & Register
│   ├── auth-callback.html      ← Google OAuth callback
│   ├── app.js                  ← Frontend logic
│   ├── wishlist.js             ← Wishlist frontend logic
│   ├── style.css               ← Arcade UI theme
│   └── backend/
│       ├── server.js           ← Node.js + Express API
│       ├── auth.js             ← Authentication routes
│       ├── db.js               ← PostgreSQL connection
│       ├── fetchGames.js       ← RAWG API fetcher
│       ├── emailService.js     ← Resend email integration
│       └── tests/
│           └── api.test.js     ← Jest API tests (22 tests)
├── tests/
│   ├── games_tracker.spec.js          ← Playwright UI tests (19 tests)
│   └── games_tracker_extended.spec.js ← Extended Playwright tests (169 tests)
└── .github/
    └── workflows/
        └── playwright.yml      ← GitHub Actions CI/CD
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML + CSS + JavaScript |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Authentication | JWT + Passport.js + Google OAuth 2.0 |
| Email | Resend API |
| Test Automation | Playwright + JavaScript |
| API Testing | Jest + node-fetch |
| CI/CD | GitHub Actions |
| Cloud Deployment | Railway |
| Data Source | RAWG.io API |

---

## ✨ App Features

### 🎮 Game Discovery
- **Live game listings** — upcoming PC games fetched from RAWG API
- **🔥 This Week badge** — games releasing within 7 days shown first
- **⏳ Countdown timer** — days remaining until each game releases
- **🔍 Search** — filter games by name in real time
- **🎛️ Sort & Filter** — by name, release date, rating, and genre
- **📖 Game descriptions** — full description fetched from RAWG on click
- **🎬 Trailers** — in-modal video trailers
- **📸 Screenshots gallery** — lightbox viewer with navigation arrows
- **⬇️ Load More pagination** — 12 games per page with total counter

### 👤 User Accounts
- **Email + password registration** with full validation
- **Google OAuth** — one-click sign in with Google
- **JWT authentication** — secure session management
- **User profile page** — avatar, stats, gaming identity, share button
- **Public profile** — shareable URL at `/user/:id` visible to anyone

### 📚 Personal Library
- **Search any game from RAWG** — add any game from the entire RAWG database (500,000+ games)
- **Game status tracking** — Playing, Completed, Backlog, Dropped
- **Completion % slider** — track how far you are in Playing/Completed games
- **Status badges** on game cards and in modals
- **My Library page** — organized view with tab filters per status
- **Collection breakdown** — visual progress bars per status
- **Export as CSV** — download your full library with status, completion %, genres

### 🔖 Wishlist
- **Per-user wishlist** — saved games tied to your account
- **📧 Release alerts** — email notification when wishlisted games are about to release
- **Subscribe/unsubscribe** — manage alert preferences

### ⭐ Ratings & Reviews
- **Personal 1–10 star rating** system
- **Rating badge** shown on game cards
- **Ratings feed into** personalized discovery
- **Written reviews** — write, save, and delete reviews per game in the modal

### 💎 Hidden Gems Discovery
- **Personalized recommendations** — based on your highest-rated genres
- **Hidden gems feed** — high-rated, low-popularity games from RAWG
- **Genre filters** — Action, RPG, Adventure, Strategy, Indie, Puzzle
- **"Because you like X"** tags on personalized cards

### 👥 Social Features
- **Follow/unfollow users** — build your gaming network
- **Friends activity feed** — see what friends are playing in real time
- **User search** — find other users by display name
- **Public profiles** — view anyone's game collection and stats
- **Share profile** — copy your profile link to clipboard

### 🔔 Notification Center
- **Bell icon in header** — shows unread count badge
- **Release notifications** — triggered when wishlisted games are about to release
- **Friend activity notifications** — when people you follow add games
- **Mark as read** — individually or all at once
- **Clear all** — remove all notifications
- **Auto-refresh** — polls every 60 seconds

### 🎨 UI & UX
- **Arcade UI theme** — animated cards, glowing effects, custom fonts
- **🔊 Sound effects** — arcade sounds on hover, click, and wishlist
- **🎵 Background music** — retro arcade melody toggle
- **📱 Mobile responsive** — works on all screen sizes
- **Recently Viewed** — quick access to last 5 viewed games
- **Skeleton loading** — smooth loading states

### ⚙️ Automation & Infrastructure
- **Daily auto-refresh** — DB updates every day at 08:00 (Israel time)
- **Scheduled email alerts** — daily cron checks wishlist release dates
- **Notification generation** — cron creates in-app notifications for upcoming releases and friend activity

---

## 🧪 Test Suite

### Extended Playwright UI Tests (169 tests)
```
✅ Wishlist Page (7 tests)
✅ Auth Page (14 tests)
✅ Library Page (13 tests)
✅ Completion % Slider (6 tests)
✅ Export Library CSV (4 tests)
✅ Game Reviews (6 tests)
✅ Profile Page (6 tests)
✅ Public User Profile (11 tests)
✅ Social Page (15 tests)
✅ Notification Center (12 tests)
✅ Discover Page (13 tests)
✅ Header Navigation (13 tests)
✅ Game Modal New Features (8 tests)
✅ Load More Pagination (6 tests)
✅ Game Description (4 tests)
✅ Lightbox Navigation (4 tests)
✅ Recently Viewed (5 tests)
```

### Original Playwright UI Tests (19 tests)
```
✅ Homepage loads with game cards
✅ Page title is correct
✅ Header displays correctly
✅ Search filters games by name
✅ Search with no results shows no games
✅ Clearing search restores all games
✅ Sort by Name A-Z is default
✅ Sort by Release Date works
✅ Sort by Rating works
✅ Filter by Action genre works
✅ Filter by RPG genre works
✅ Selecting All Genres restores full list
✅ Clicking game card opens modal
✅ Modal shows game name
✅ Modal shows release date
✅ Modal shows genres
✅ Clicking outside modal closes it
✅ Each game card has an image or placeholder
✅ Each game card shows a release date
```

### Jest API Tests (22 tests)
```
✅ GET /api/games returns 200
✅ GET /api/games returns an array
✅ DB contains at least 10 games
✅ Every game has name and release_date
✅ Games are sorted alphabetically by default
✅ Search returns matching games
✅ Genre filter returns only matching games
✅ GET /api/stats returns total count
✅ No duplicate games in DB
✅ All release dates are today or in the future
✅ Invalid Genre returns empty array
✅ Sort by name returns games in A-Z order
✅ Sort by release date returns earliest date first
✅ Sort by rating returns highest rating first
✅ Filter by action genre returns only action games
✅ Filter by RPG genre returns only RPG games
✅ Filter by strategy genre returns only strategy games
✅ Search is case insensitive
✅ Search with no results returns empty array
✅ Search combined with genre filter works
✅ All games have a valid background image URL
✅ All games have a valid rawg_id
```

---

## ⚙️ CI/CD Pipeline

Every push to `main` automatically:
1. Sets up Node.js 24
2. Installs dependencies
3. Installs Playwright browsers
4. Runs all Playwright tests on Chromium
5. Uploads HTML test report as artifact

---

## 🗄️ Database Schema

```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    rawg_id INTEGER UNIQUE,
    name VARCHAR(255),
    release_date DATE,
    rating FLOAT,
    metacritic INTEGER,
    background_image TEXT,
    genres TEXT,
    platforms TEXT,
    screenshots TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    google_id VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    rawg_id INTEGER,
    name VARCHAR(255),
    release_date DATE,
    rating FLOAT,
    background_image TEXT,
    genres TEXT,
    platforms TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (rawg_id, user_id)
);

CREATE TABLE subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rawg_id INTEGER NOT NULL,
    name VARCHAR(255),
    background_image TEXT,
    release_date DATE,
    rating DECIMAL,
    genres TEXT,
    status VARCHAR(50) CHECK (status IN ('playing', 'completed', 'backlog', 'dropped')),
    completion INTEGER DEFAULT 0 CHECK (completion >= 0 AND completion <= 100),
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, rawg_id)
);

CREATE TABLE user_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rawg_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, rawg_id)
);

CREATE TABLE user_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rawg_id INTEGER NOT NULL,
    game_name VARCHAR(255),
    review_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, rawg_id)
);

CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (follower_id, following_id)
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    rawg_id INTEGER,
    game_name VARCHAR(255),
    background_image TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints

### Games
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/games` | Get all games (sort, genre, search, page params) |
| GET | `/api/game/:id` | Get game description from RAWG |
| GET | `/api/game/:id/trailer` | Get game trailer from RAWG |
| GET | `/api/search-rawg` | Search entire RAWG database |
| POST | `/api/refresh` | Manually refresh games from RAWG |
| GET | `/api/stats` | DB stats (total games, last updated) |
| GET | `/api/health` | Health check |

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/login` | Login with email + password |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/google/callback` | Google OAuth callback |

### Wishlist
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/wishlist` | Get user's wishlist |
| POST | `/api/wishlist` | Add game to wishlist |
| DELETE | `/api/wishlist/:rawg_id` | Remove game from wishlist |

### Library
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/user-games` | Get user's game library |
| POST | `/api/user-games` | Add/update game status + completion % |
| DELETE | `/api/user-games/:rawg_id` | Remove game from library |
| GET | `/api/export-library` | Export library as CSV |

### Ratings & Reviews
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ratings` | Get user's ratings |
| POST | `/api/ratings` | Add/update a rating |
| DELETE | `/api/ratings/:rawg_id` | Remove a rating |
| GET | `/api/reviews` | Get user's reviews |
| GET | `/api/reviews/:rawg_id` | Get all reviews for a game (public) |
| POST | `/api/reviews` | Add/update a review |
| DELETE | `/api/reviews/:rawg_id` | Delete a review |

### Discovery
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/discover` | Get personalized + hidden gems |
| GET | `/api/discover/genre` | Get hidden gems by genre |

### Social
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/follow/:userId` | Follow a user |
| DELETE | `/api/follow/:userId` | Unfollow a user |
| GET | `/api/following` | Get users I'm following |
| GET | `/api/followers` | Get my followers |
| GET | `/api/feed` | Get friends activity feed |
| GET | `/api/users/search` | Search users by display name |
| GET | `/api/users/:userId` | Get public user profile |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get user's notifications |
| POST | `/api/notifications/read` | Mark all notifications as read |
| POST | `/api/notifications/read/:id` | Mark one notification as read |
| DELETE | `/api/notifications` | Clear all notifications |

### Email
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/subscribe` | Subscribe to release alerts |
| DELETE | `/api/subscribe/:email` | Unsubscribe |
| POST | `/api/test-alert` | Send test email alert |

---

## 🚀 Running Locally

### Prerequisites
- Node.js 20+
- PostgreSQL
- RAWG API key ([rawg.io/apidocs](https://rawg.io/apidocs))
- Resend API key ([resend.com](https://resend.com))
- Google OAuth credentials ([console.cloud.google.com](https://console.cloud.google.com))

### Setup

```bash
# Clone the repo
git clone https://github.com/saharkalavres86/automation-project-sahar.git
cd automation-project-sahar

# Install root dependencies (Playwright)
npm install
npx playwright install chromium

# Install backend dependencies
cd pc-games-tracker
npm install
```

### Environment Variables

Create `pc-games-tracker/backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pc_games
DB_USER=postgres
DB_PASSWORD=your_password
RAWG_API_KEY=your_rawg_key
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
PORT=3000
```

### Run

```bash
# Start backend (from pc-games-tracker folder)
node backend/server.js

# Run Playwright UI tests (from root folder)
npx playwright test

# Run API tests (from pc-games-tracker folder)
npm test
```

---

## 📊 Automation Techniques Used

| Technique | Where Used |
|---|---|
| API Testing | `backend/tests/api.test.js` — 22 Jest tests |
| UI Automation | `tests/games_tracker.spec.js` — 19 Playwright tests |
| Extended UI Automation | `tests/games_tracker_extended.spec.js` — 169 Playwright tests |
| Scheduled Tasks | `node-cron` — daily refresh + email alerts + notifications |
| CI/CD | `.github/workflows/playwright.yml` — GitHub Actions |
| JWT Auth | Stateless authentication with 7-day tokens |
| OAuth 2.0 | Google login via Passport.js strategy |
| Email Automation | Resend API — automated release alert emails |

---

## 👤 Author

**Sahar Kalavres**
Senior QA Engineer | 13 Years Experience | Transitioning to Automation

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/sahar-kalavres-33852177/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black)](https://github.com/saharkalavres86)