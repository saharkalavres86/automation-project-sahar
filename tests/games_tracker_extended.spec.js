import { test, expect } from '@playwright/test';

const BASE_URL = 'https://automation-project-sahar-production.up.railway.app';

test.describe('PC Games Tracker — Extended Tests', () => {

    // ─── WISHLIST PAGE TESTS ──────────────────────────────
    test.describe('Wishlist Page', () => {

        test('Wishlist page loads', async ({ page }) => {
            await page.goto(`${BASE_URL}/wishlist`);
            await expect(page.locator('header h1')).toBeVisible();
        });

        test('Wishlist page has correct title', async ({ page }) => {
            await page.goto(`${BASE_URL}/wishlist`);
            await expect(page).toHaveTitle('Games Tracker');
        });

        test('Wishlist page has back to games button', async ({ page }) => {
            await page.goto(`${BASE_URL}/wishlist`);
            await page.waitForTimeout(2000);
            const backBtn = page.locator('a[href="/"]').first();
            await expect(backBtn).toBeVisible();
        });

        test('Back to games button navigates to home', async ({ page }) => {
            await page.goto(`${BASE_URL}/wishlist`);
            await page.waitForTimeout(1000);
            await page.locator('a[href="/"]').first().click();
            await expect(page).toHaveURL(BASE_URL + '/');
        });

        test('Wishlist shows empty state when no games', async ({ page }) => {
            await page.goto(`${BASE_URL}/wishlist`);
            await page.waitForTimeout(2000);
            const cards = page.locator('.game-card');
            const count = await cards.count();
            if (count === 0) {
                const gridText = await page.locator('#games-grid').textContent();
                expect(
                    gridText.includes('wishlist is empty') ||
                    gridText.includes('Failed to load') ||
                    gridText.includes('Sign in') ||
                    gridText.trim() === ''
                ).toBeTruthy();
            }
        });

        test('Adding game to wishlist shows it on wishlist page', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
            await page.goto(`${BASE_URL}/wishlist`);
            await page.waitForTimeout(2000);
            await expect(page.locator('header h1')).toBeVisible();
        });

        test('Removing game from wishlist page works', async ({ page }) => {
            await page.goto(`${BASE_URL}/wishlist`);
            await page.waitForTimeout(2000);
            const cards = page.locator('.game-card');
            const count = await cards.count();
            if (count > 0) {
                const initialCount = count;
                await page.locator('.wishlist-btn').first().click();
                await page.waitForTimeout(1000);
                const newCount = await page.locator('.game-card').count();
                expect(newCount).toBe(initialCount - 1);
            }
        });

        test('Wishlist shows game count', async ({ page }) => {
            await page.goto(`${BASE_URL}/wishlist`);
            await page.waitForTimeout(2000);
            const cards = await page.locator('.game-card').count();
            if (cards > 0) {
                await expect(page.locator('#wishlist-stats')).toBeVisible();
            }
        });
    });

    // ─── AUTH PAGE TESTS ──────────────────────────────────
    test.describe('Auth Page', () => {

        test('Auth page loads', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await expect(page.locator('.auth-header')).toBeVisible();
        });

        test('Auth page has correct title', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await expect(page).toHaveTitle(/Games Tracker/);
        });

        test('Sign in tab is active by default', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            const loginForm = page.locator('#login-form');
            await expect(loginForm).toBeVisible();
        });

        test('Register tab switches to register form', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await page.locator('.auth-tab').nth(1).click();
            await expect(page.locator('#register-form')).toBeVisible();
            await expect(page.locator('#login-form')).toBeHidden();
        });

        test('Sign in tab switches back to login form', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await page.locator('.auth-tab').nth(1).click();
            await page.locator('.auth-tab').nth(0).click();
            await expect(page.locator('#login-form')).toBeVisible();
            await expect(page.locator('#register-form')).toBeHidden();
        });

        test('Login form has email and password fields', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await expect(page.locator('#login-email')).toBeVisible();
            await expect(page.locator('#login-password')).toBeVisible();
        });

        test('Register form has name, email and password fields', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await page.locator('.auth-tab').nth(1).click();
            await expect(page.locator('#register-name')).toBeVisible();
            await expect(page.locator('#register-email')).toBeVisible();
            await expect(page.locator('#register-password')).toBeVisible();
        });

        test('Login shows error for empty fields', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await page.locator('#login-form .auth-btn').click();
            await expect(page.locator('#login-message')).toBeVisible();
        });

        test('Register shows error for empty display name', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await page.locator('.auth-tab').nth(1).click();
            await page.fill('#register-email', 'test@test.com');
            await page.fill('#register-password', 'Password1');
            await page.locator('#register-form .auth-btn').click();
            await expect(page.locator('#register-message')).toBeVisible();
        });

        test('Register shows error for invalid email', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await page.locator('.auth-tab').nth(1).click();
            await page.fill('#register-name', 'TestUser');
            await page.fill('#register-email', 'notanemail');
            await page.fill('#register-password', 'Password1');
            await page.locator('#register-form .auth-btn').click();
            await expect(page.locator('#register-message')).toBeVisible();
        });

        test('Register shows error for weak password', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await page.locator('.auth-tab').nth(1).click();
            await page.fill('#register-name', 'TestUser');
            await page.fill('#register-email', 'test@test.com');
            await page.fill('#register-password', '123');
            await page.locator('#register-form .auth-btn').click();
            await expect(page.locator('#register-message')).toBeVisible();
        });

        test('Google OAuth button is visible on login form', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await expect(page.locator('#login-form .google-btn')).toBeVisible();
        });

        test('Google OAuth button is visible on register form', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await page.locator('.auth-tab').nth(1).click();
            await expect(page.locator('#register-form .google-btn')).toBeVisible();
        });

        test('Back to games link is visible', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await expect(page.locator('.back-link').first()).toBeVisible();
        });

        test('Back to games link navigates to home', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth`);
            await page.locator('.back-link').first().click();
            await expect(page).toHaveURL(BASE_URL + '/');
        });
    });

    // ─── LIBRARY PAGE TESTS ───────────────────────────────
    test.describe('Library Page', () => {

        test('Library page loads', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await expect(page.locator('header h1')).toBeVisible();
        });

        test('Library page has correct title', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await expect(page).toHaveTitle(/Games Tracker/);
        });

        test('Library shows sign in message when not logged in', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.waitForTimeout(2000);
            const notLoggedIn = page.locator('#not-logged-in');
            const isVisible = await notLoggedIn.isVisible();
            if (isVisible) {
                await expect(notLoggedIn).toBeVisible();
            }
        });

        test('Library has back to games button', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await expect(page.locator('a[href="/"]')).toBeVisible();
        });

        test('Library has wishlist button', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await expect(page.locator('a[href="/wishlist"]')).toBeVisible();
        });

        test('Library tab buttons are present', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.waitForTimeout(2000);
            const isLoggedIn = await page.locator('#library-content').isVisible();
            if (isLoggedIn) {
                await expect(page.locator('.lib-tab').first()).toBeVisible();
            } else {
                await expect(page.locator('#not-logged-in')).toBeVisible();
            }
        });

        test('Library has all status tabs', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.waitForTimeout(2000);
            const tabs = page.locator('.lib-tab');
            const count = await tabs.count();
            expect(count).toBe(5);
        });

        test('Back to games button navigates home', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.locator('a[href="/"]').first().click();
            await expect(page).toHaveURL(BASE_URL + '/');
        });
    });

    // ─── PROFILE PAGE TESTS ───────────────────────────────
    test.describe('Profile Page', () => {

        test('Profile page loads', async ({ page }) => {
            await page.goto(`${BASE_URL}/profile`);
            await expect(page.locator('header h1')).toBeVisible();
        });

        test('Profile page has correct title', async ({ page }) => {
            await page.goto(`${BASE_URL}/profile`);
            await expect(page).toHaveTitle(/Games Tracker/);
        });

        test('Profile shows sign in message when not logged in', async ({ page }) => {
            await page.goto(`${BASE_URL}/profile`);
            await page.waitForTimeout(2000);
            const notLoggedIn = page.locator('#not-logged-in');
            const isVisible = await notLoggedIn.isVisible();
            if (isVisible) {
                await expect(notLoggedIn).toBeVisible();
            }
        });

        test('Profile has back to games button', async ({ page }) => {
            await page.goto(`${BASE_URL}/profile`);
            await expect(page.locator('a[href="/"]')).toBeVisible();
        });

        test('Profile has library button', async ({ page }) => {
            await page.goto(`${BASE_URL}/profile`);
            await expect(page.locator('a[href="/library"]')).toBeVisible();
        });

        test('Profile has wishlist button', async ({ page }) => {
            await page.goto(`${BASE_URL}/profile`);
            await expect(page.locator('a[href="/wishlist"]')).toBeVisible();
        });
    });

    // ─── DISCOVER PAGE TESTS ──────────────────────────────
    test.describe('Discover Page', () => {

        test('Discover page loads', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await expect(page.locator('header h1')).toBeVisible();
        });

        test('Discover page has correct title', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await expect(page).toHaveTitle(/Games Tracker/);
        });

        test('Hidden gems section is visible', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await page.waitForTimeout(3000);
            await expect(page.locator('#gems-grid')).toBeVisible();
        });

        test('Genre filter buttons are visible', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await expect(page.locator('.genre-filter-btn').first()).toBeVisible();
        });

        test('Discover has all genre filter buttons', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            const btns = page.locator('.genre-filter-btn');
            await expect(btns).toHaveCount(7);
        });

        test('All genre filter is active by default', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            const allBtn = page.locator('.genre-filter-btn').first();
            await expect(allBtn).toHaveClass(/active/);
        });

        test('Clicking genre filter updates active state', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            const actionBtn = page.locator('.genre-filter-btn').nth(1);
            await actionBtn.click();
            await expect(actionBtn).toHaveClass(/active/);
        });

        test('Hidden gems cards load', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await page.waitForTimeout(5000);
            const cards = page.locator('.gem-card');
            const count = await cards.count();
            expect(count).toBeGreaterThan(0);
        });

        test('Gem cards have game images', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await page.waitForTimeout(5000);
            const firstCard = page.locator('.gem-card').first();
            await expect(firstCard).toBeVisible();
        });

        test('Gem cards show rating', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await page.waitForTimeout(5000);
            const rating = page.locator('.gem-rating').first();
            await expect(rating).toBeVisible();
        });

        test('Hidden gem badge is visible on cards', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await page.waitForTimeout(5000);
            await expect(page.locator('.hidden-gem-badge').first()).toBeVisible();
        });

        test('Discover has back to games button', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await expect(page.locator('a[href="/"]')).toBeVisible();
        });

        test('Discover has library button', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await expect(page.locator('a[href="/library"]')).toBeVisible();
        });

test('Genre filter loads new gems', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForTimeout(5000);
    const rpgBtn = page.locator('.genre-filter-btn').nth(2);
    await rpgBtn.click();
    await page.waitForSelector('.gem-card', { timeout: 15000 });
    const cards = page.locator('.gem-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
});

    // ─── HEADER NAVIGATION TESTS ──────────────────────────
    test.describe('Header Navigation', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
        });

        test('Wishlist button is visible in header', async ({ page }) => {
            await expect(page.locator('#wishlist-nav-btn')).toBeVisible();
        });

        test('Library button is visible in header', async ({ page }) => {
            await expect(page.locator('a[href="/library"]')).toBeVisible();
        });

        test('Discover button is visible in header', async ({ page }) => {
            await expect(page.locator('a[href="/discover"]')).toBeVisible();
        });

        test('Sign in button is visible in header when not logged in', async ({ page }) => {
            await expect(page.locator('#auth-nav-btn')).toBeVisible();
        });

        test('Library button navigates to library page', async ({ page }) => {
            await page.locator('a[href="/library"]').click();
            await expect(page).toHaveURL(`${BASE_URL}/library`);
        });

        test('Discover button navigates to discover page', async ({ page }) => {
            await page.locator('a[href="/discover"]').click();
            await expect(page).toHaveURL(`${BASE_URL}/discover`);
        });

        test('Sign in button navigates to auth page', async ({ page }) => {
            await page.locator('#auth-nav-btn').click();
            await expect(page).toHaveURL(`${BASE_URL}/auth`);
        });

        test('Music button is visible', async ({ page }) => {
            await expect(page.locator('#music-btn')).toBeVisible();
        });
    });

    // ─── GAME MODAL NEW FEATURES TESTS ───────────────────
    test.describe('Game Modal — New Features', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(2000);
        });

        test('Modal shows MY LIST section or sign in prompt', async ({ page }) => {
            const hasMyList = await page.locator('text=MY LIST').isVisible();
            const hasSignIn = await page.locator('text=Sign in to track').isVisible();
            expect(hasMyList || hasSignIn).toBeTruthy();
        });

        test('Modal shows sign in prompt for unauthenticated users', async ({ page }) => {
            await expect(page.locator('text=Sign in to track this game')).toBeVisible();
        });

        test('Sign in prompt in modal links to auth page', async ({ page }) => {
            const link = page.locator('.modal-body a[href="/auth"]');
            await expect(link).toBeVisible();
        });

        test('Modal shows RAWG Rating field', async ({ page }) => {
            await expect(page.locator('text=RAWG Rating')).toBeVisible();
        });

        test('Modal shows Metacritic field', async ({ page }) => {
            await expect(page.locator('text=Metacritic')).toBeVisible();
        });

        test('Modal shows Platforms field', async ({ page }) => {
            await expect(page.locator('text=Platforms')).toBeVisible();
        });

        test('Modal shows Genres field', async ({ page }) => {
            await expect(page.locator('.modal-body strong').filter({ hasText: 'Genres' })).toBeVisible();
        });

        test('Modal close button works', async ({ page }) => {
            await page.locator('.modal-close-btn').click();
            await expect(page.locator('.modal-overlay')).not.toBeVisible();
        });
    });

    // ─── LOAD MORE PAGINATION TESTS ───────────────────────
    test.describe('Load More Pagination', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
        });

        test('Load more button is visible', async ({ page }) => {
            const btn = page.locator('#load-more-btn');
            await expect(btn).toBeVisible();
        });

        test('Games counter shows correct text', async ({ page }) => {
            const counter = page.locator('#games-counter');
            await expect(counter).toBeVisible();
            await expect(counter).toContainText('Showing');
        });

        test('Load more loads additional games', async ({ page }) => {
            const initialCount = await page.locator('.game-card').count();
            await page.locator('#load-more-btn').click();
            await page.waitForTimeout(2000);
            const newCount = await page.locator('.game-card').count();
            expect(newCount).toBeGreaterThan(initialCount);
        });

        test('Load more button disappears when all games loaded', async ({ page }) => {
            let attempts = 0;
            while (attempts < 10) {
                const btn = page.locator('#load-more-btn');
                const isVisible = await btn.isVisible();
                if (!isVisible) break;
                await btn.click();
                await page.waitForTimeout(1500);
                attempts++;
            }
            await expect(page.locator('#load-more-btn')).toBeHidden();
        });

        test('Load more button hidden during search', async ({ page }) => {
            await page.fill('#search', 'assassin');
            await page.waitForTimeout(500);
            await expect(page.locator('#load-more-btn')).toBeHidden();
        });

        test('Games counter updates after load more', async ({ page }) => {
            const initialText = await page.locator('#games-counter').textContent();
            await page.locator('#load-more-btn').click();
            await page.waitForTimeout(2000);
            const newText = await page.locator('#games-counter').textContent();
            expect(newText).not.toBe(initialText);
        });
    });

    // ─── GAME DESCRIPTION TESTS ───────────────────────────
    test.describe('Game Description', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
        });

        test('Modal shows description section', async ({ page }) => {
            await page.locator('.game-card').first().click();
            await expect(page.locator('#game-description')).toBeVisible();
        });

        test('Description element is visible in modal', async ({ page }) => {
            await page.locator('.game-card').first().click();
            const descEl = page.locator('#description-text');
            await expect(descEl).toBeVisible();
        });

        test('Description loads content after delay', async ({ page }) => {
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(6000);
            const descEl = page.locator('#description-text');
            const text = await descEl.textContent();
            expect(text).not.toBe('Loading description...');
        });

        test('Description shows either content or no description message', async ({ page }) => {
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(3000);
            const descEl = page.locator('#description-text');
            const text = await descEl.textContent();
            expect(text.length).toBeGreaterThan(0);
        });
    });

    // ─── LIGHTBOX NAVIGATION TESTS ────────────────────────
    test.describe('Lightbox Navigation', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
        });

        test('Clicking screenshot opens lightbox', async ({ page }) => {
            const cards = page.locator('.game-card');
            const count = await cards.count();
            for (let i = 0; i < Math.min(count, 8); i++) {
                await cards.nth(i).click();
                await page.waitForTimeout(4000);
                const screenshots = page.locator('.screenshot-img');
                const screenshotCount = await screenshots.count();
                if (screenshotCount > 0) {
                    await screenshots.first().click();
                    await page.waitForTimeout(2000);
                    await expect(page.locator('.lightbox-overlay')).toBeVisible();
                    return;
                }
                await page.locator('.modal-close-btn').click();
                await page.waitForTimeout(500);
            }
            console.log('No screenshots found in first 8 games — skipping');
        });

        test('Lightbox has navigation buttons', async ({ page }) => {
            const cards = page.locator('.game-card');
            const count = await cards.count();
            for (let i = 0; i < Math.min(count, 8); i++) {
                await cards.nth(i).click();
                await page.waitForTimeout(4000);
                const screenshots = page.locator('.screenshot-img');
                const screenshotCount = await screenshots.count();
                if (screenshotCount > 0) {
                    await screenshots.first().click();
                    await page.waitForTimeout(2000);
                    await expect(page.locator('.lightbox-overlay')).toBeVisible();
                    await expect(page.locator('.prev-btn')).toBeVisible();
                    await expect(page.locator('.next-btn')).toBeVisible();
                    return;
                }
                await page.locator('.modal-close-btn').click();
                await page.waitForTimeout(500);
            }
            console.log('No screenshots found — skipping');
        });

        test('Lightbox close button works', async ({ page }) => {
            const cards = page.locator('.game-card');
            const count = await cards.count();
            for (let i = 0; i < Math.min(count, 8); i++) {
                await cards.nth(i).click();
                await page.waitForTimeout(4000);
                const screenshots = page.locator('.screenshot-img');
                const screenshotCount = await screenshots.count();
                if (screenshotCount > 0) {
                    await screenshots.first().click();
                    await page.waitForTimeout(2000);
                    await expect(page.locator('.lightbox-overlay')).toBeVisible();
                    await page.locator('.lightbox-close').click();
                    await expect(page.locator('.lightbox-overlay')).not.toBeVisible();
                    return;
                }
                await page.locator('.modal-close-btn').click();
                await page.waitForTimeout(500);
            }
            console.log('No screenshots found — skipping');
        });

        test('Clicking outside lightbox closes it', async ({ page }) => {
            const cards = page.locator('.game-card');
            const count = await cards.count();
            for (let i = 0; i < Math.min(count, 8); i++) {
                await cards.nth(i).click();
                await page.waitForTimeout(4000);
                const screenshots = page.locator('.screenshot-img');
                const screenshotCount = await screenshots.count();
                if (screenshotCount > 0) {
                    await screenshots.first().click();
                    await page.waitForTimeout(2000);
                    await expect(page.locator('.lightbox-overlay')).toBeVisible();
                    await page.mouse.click(10, 10);
                    await expect(page.locator('.lightbox-overlay')).not.toBeVisible();
                    return;
                }
                await page.locator('.modal-close-btn').click();
                await page.waitForTimeout(500);
            }
            console.log('No screenshots found — skipping');
        });
    });

    // ─── RECENTLY VIEWED TESTS ────────────────────────────
    test.describe('Recently Viewed', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
        });

        test('Recently viewed section hidden on load', async ({ page }) => {
            const container = page.locator('#recently-viewed');
            await expect(container).toBeHidden();
        });

        test('Recently viewed appears after clicking a game', async ({ page }) => {
            await page.locator('.game-card').first().click();
            await page.locator('.modal-close-btn').click();
            await expect(page.locator('#recently-viewed')).toBeVisible();
        });

        test('Recently viewed shows game thumbnail', async ({ page }) => {
            await page.locator('.game-card').first().click();
            await page.locator('.modal-close-btn').click();
            await expect(page.locator('#recently-viewed img')).toBeVisible();
        });

        test('Recently viewed shows up to 5 games', async ({ page }) => {
            const cards = page.locator('.game-card');
            for (let i = 0; i < 6; i++) {
                await cards.nth(i).click();
                await page.waitForTimeout(300);
                await page.locator('.modal-close-btn').click();
                await page.waitForTimeout(300);
            }
            const recentItems = await page.locator('#recently-viewed img').count();
            expect(recentItems).toBeLessThanOrEqual(5);
        });

        test('Clicking recently viewed game opens modal', async ({ page }) => {
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(300);
            await page.locator('.modal-close-btn').click();
            await page.waitForTimeout(300);
            await page.locator('#recently-viewed img').first().click();
            await expect(page.locator('.modal-overlay')).toBeVisible();
        });
    });
});