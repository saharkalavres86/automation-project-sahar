# 🎮 Games Tracker — Full Stack Web Platform

![CI/CD](https://github.com/saharkalavres86/automation-project-sahar/actions/workflows/playwright.yml/badge.svg)

A production-grade full stack game tracking platform with user authentication, personalized libraries, hidden gem discovery, and a complete test automation framework — built from scratch by a Senior QA Engineer transitioning into automation.

🔗 **Live App:** [automation-project-sahar-production.up.railway.app](https://automation-project-sahar-production.up.railway.app)

---

## 🚀 What This Project Does

A game tracking and discovery platform where users can browse upcoming PC game releases, manage personal game libraries, rate games, track backlog, and discover hidden gems — all backed by a real-time RAWG API integration and a PostgreSQL database.

---

## 🏗️ Architecture

```
automation-project/
├── pc-games-tracker/
│   ├── index.html              ← Main games page
│   ├── wishlist.html           ← Wishlist page
│   ├── library.html            ← Personal game library
│   ├── profile.html            ← User profile & stats
│   ├── discover.html           ← Hidden gems discovery
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
│   └── games_tracker.spec.js   ← Playwright UI tests (19 tests)
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
- **User profile page** — avatar, stats, gaming identity

### 📚 Personal Library
- **Game status tracking** — Playing, Completed, Backlog, Dropped
- **Status badges** on game cards and in modals
- **My Library page** — organized view with tab filters per status
- **Collection breakdown** — visual progress bars per status

### 🔖 Wishlist
- **Per-user wishlist** — saved games tied to your account
- **📧 Release alerts** — email notification when wishlisted games are about to release
- **Subscribe/unsubscribe** — manage alert preferences

### ⭐ Ratings
- **Personal 1–10 star rating** system
- **Rating badge** shown on game cards
- **Ratings feed into** personalized discovery

### 💎 Hidden Gems Discovery
- **Personalized recommendations** — based on your highest-rated genres
- **Hidden gems feed** — high-rated, low-popularity games from RAWG
- **Genre filters** — Action, RPG, Adventure, Strategy, Indie, Puzzle
- **"Because you like X"** tags on personalized cards
- **Direct RAWG links** — click any gem to view full details

### 🎨 UI & UX
- **Arcade UI theme** — animated cards, glowing effects, custom fonts
- **🔊 Sound effects** — arcade sounds on hover, click, and wishlist
- **🎵 Background music** — retro arcade melody toggle
- **📱 Mobile responsive** — works on all screen sizes
- **Recently Viewed** — quick access to last 5 viewed games
- **Skeleton loading** — smooth loading states

### ⚙️ Automation & Infrastructure
- **Daily auto-refresh** — DB updates every day at 08:00 (Israel time)
- **Midnight health check** — auto-triggers refresh if DB has less than 10 games
- **Scheduled email alerts** — daily cron checks wishlist release dates

---

## 🧪 Test Suite

### Playwright UI Tests (19 tests)
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

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    google_id VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
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
```

---

## 🔌 API Endpoints

### Games
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/games` | Get all games (sort, genre, search, page params) |
| GET | `/api/game/:id` | Get game description from RAWG |
| GET | `/api/game/:id/trailer` | Get game trailer from RAWG |
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
| POST | `/api/user-games` | Add/update game status |
| DELETE | `/api/user-games/:rawg_id` | Remove game from library |

### Ratings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ratings` | Get user's ratings |
| POST | `/api/ratings` | Add/update a rating |
| DELETE | `/api/ratings/:rawg_id` | Remove a rating |

### Discovery
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/discover` | Get personalized + hidden gems |
| GET | `/api/discover/genre` | Get hidden gems by genre |

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
| Scheduled Tasks | `node-cron` — daily refresh + health check + email alerts |
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
