# 🎮 PC Games Tracker — Full Stack Automation Project

![CI/CD](https://github.com/saharkalavres86/automation-project-sahar/actions/workflows/playwright.yml/badge.svg)

A production-grade full stack web application with a complete test automation framework — built from scratch by a Senior QA Engineer transitioning into automation.

🔗 **Live App:** [automation-project-sahar-production.up.railway.app](https://automation-project-sahar-production.up.railway.app)

---

## 🚀 What This Project Does

Tracks upcoming PC game releases in real time using the RAWG API, with a full automation test suite covering UI, API, sorting, filtering, and data integrity.

---

## 🏗️ Architecture

```
automation-project/
├── pc-games-tracker/
│   ├── index.html              ← Frontend
│   ├── app.js                  ← Frontend logic
│   ├── style.css               ← Arcade UI theme
│   └── backend/
│       ├── server.js           ← Node.js + Express API
│       ├── db.js               ← PostgreSQL connection
│       ├── fetchGames.js       ← RAWG API fetcher
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
| Test Automation | Playwright + JavaScript |
| API Testing | Jest + node-fetch |
| CI/CD | GitHub Actions |
| Cloud Deployment | Railway |
| Data Source | RAWG.io API |

---

## ✨ App Features

## ✨ App Features

- 🎮 **Live game listings** — upcoming PC games fetched from RAWG API
- 🔥 **This Week badge** — games releasing within 7 days always shown first
- ⏳ **Countdown timer** — days remaining until each game releases
- 🔖 **Wishlist** — save favorite games, persisted in PostgreSQL
- 📄 **Wishlist page** — dedicated page to view and manage saved games
- 📖 **Game descriptions** — full game description fetched from RAWG on click
- 📸 **Screenshots gallery** — view game screenshots inside the modal
- 🖼️ **Lightbox** — full screen screenshot viewer with navigation arrows
- 🎨 **Arcade UI theme** — animated cards, glowing effects, custom fonts
- 🔊 **Sound effects** — arcade sounds on hover, click and wishlist
- 🎵 **Background music** — retro arcade melody toggle
- 🔍 **Search** — filter games by name in real time
- 🎛️ **Sort & Filter** — by name, release date, rating, and genre
- 📱 **Mobile responsive** — works on all screen sizes
- 🚫 **Scroll lock** — background scroll disabled when modal is open
- 🔄 **Daily auto-refresh** — DB updates every day at 08:00 (Israel time)
- 🏥 **Midnight health check** — auto-triggers refresh if DB has less than 10 games

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
-- Games table
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

-- Wishlist table
CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    rawg_id INTEGER UNIQUE,
    name VARCHAR(255),
    release_date DATE,
    rating FLOAT,
    background_image TEXT,
    genres TEXT,
    platforms TEXT,
    added_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/games` | Get all games (supports sort, genre, search params) |
| POST | `/api/refresh` | Manually refresh games from RAWG API |
| GET | `/api/stats` | Get DB stats (total games, last updated) |
| GET | `/api/health` | Health check endpoint |
| GET | `/api/wishlist` | Get all wishlisted games |
| POST | `/api/wishlist` | Add game to wishlist |
| DELETE | `/api/wishlist/:rawg_id` | Remove game from wishlist |

---

## 🚀 Running Locally

### Prerequisites
- Node.js 20+
- PostgreSQL
- RAWG API key ([rawg.io/apidocs](https://rawg.io/apidocs))

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
PORT=3000
```

### Create Database

```sql
CREATE DATABASE pc_games;
\c pc_games

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
    rawg_id INTEGER UNIQUE,
    name VARCHAR(255),
    release_date DATE,
    rating FLOAT,
    background_image TEXT,
    genres TEXT,
    platforms TEXT,
    added_at TIMESTAMP DEFAULT NOW()
);
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
| Page Object Model (POM) | `pages/LoginPage.js`, `pages/InventoryPage.js` |
| Data Driven Testing | `lesson3.spec.js` — multiple user logins |
| Custom Fixtures | `fixtures/base.js` — auto-login fixture |
| API Testing | `backend/tests/api.test.js` |
| Scheduled Tasks | `node-cron` — daily refresh + health check |
| CI/CD | `.github/workflows/playwright.yml` |

---

## 👤 Author

**Sahar Kalavres**
Senior QA Engineer | 13 Years Experience | Transitioning to Automation

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/sahar-kalavres-33852177/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black)](https://github.com/saharkalavres86)
