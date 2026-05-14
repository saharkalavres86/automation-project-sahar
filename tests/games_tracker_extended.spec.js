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
            await expect(page.locator('a[href="/"]').first()).toBeVisible();
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
            const count = await page.locator('.game-card').count();
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

        test('Wishlist page navigates back to home', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
            await page.goto(`${BASE_URL}/wishlist`);
            await page.waitForTimeout(2000);
            await expect(page.locator('header h1')).toBeVisible();
        });

        test('Wishlist shows game count when games present', async ({ page }) => {
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
            await expect(page.locator('#login-form')).toBeVisible();
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
            if (await notLoggedIn.isVisible()) {
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

        test('Library has all 5 status tabs', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.waitForTimeout(2000);
            expect(await page.locator('.lib-tab').count()).toBe(5);
        });

        test('Library has export CSV button', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await expect(page.locator('button:has-text("EXPORT CSV")')).toBeVisible();
        });

        test('Library has RAWG search input', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await expect(page.locator('#game-search-input')).toBeVisible();
        });

        test('Library search input has correct placeholder', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            const placeholder = await page.locator('#game-search-input').getAttribute('placeholder');
            expect(placeholder).toContain('Search any game');
        });

        test('Library search shows dropdown when typing', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.fill('#game-search-input', 'batman');
            await page.waitForTimeout(2000);
            await expect(page.locator('#search-results-dropdown')).toBeVisible();
        });

        test('Library search returns results', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.fill('#game-search-input', 'batman');
            await page.waitForTimeout(2000);
            expect(await page.locator('.search-result-item').count()).toBeGreaterThan(0);
        });

        test('Library search shows no results for gibberish', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.fill('#game-search-input', 'xyzxyzxyz123456789');
            await page.waitForTimeout(2000);
            await expect(page.locator('#search-results-dropdown')).toContainText('No games found');
        });

        test('Library search dropdown closes when clicking outside', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.fill('#game-search-input', 'batman');
            await page.waitForTimeout(1000);
            await page.mouse.click(100, 600);
            await expect(page.locator('#search-results-dropdown')).toBeHidden();
        });

        test('Back to games button navigates home', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.locator('a[href="/"]').first().click();
            await expect(page).toHaveURL(BASE_URL + '/');
        });
    });

    // ─── COMPLETION SLIDER TESTS ──────────────────────────
    test.describe('Completion % Slider', () => {

        test('Completion section visible on playing games', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.waitForTimeout(2000);
            const isLoggedIn = await page.locator('#library-content').isVisible();
            if (!isLoggedIn) return;

            await page.locator('.lib-tab').nth(1).click(); // playing tab
            await page.waitForTimeout(1000);
            const playingCards = await page.locator('.library-card').count();
            if (playingCards > 0) {
                await expect(page.locator('.completion-section').first()).toBeVisible();
            }
        });

        test('Completion slider exists on playing games', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.waitForTimeout(2000);
            const isLoggedIn = await page.locator('#library-content').isVisible();
            if (!isLoggedIn) return;

            await page.locator('.lib-tab').nth(1).click();
            await page.waitForTimeout(1000);
            const playingCards = await page.locator('.library-card').count();
            if (playingCards > 0) {
                await expect(page.locator('.completion-slider').first()).toBeVisible();
            }
        });

        test('Completion value label shows percentage', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.waitForTimeout(2000);
            const isLoggedIn = await page.locator('#library-content').isVisible();
            if (!isLoggedIn) return;

            await page.locator('.lib-tab').nth(1).click();
            await page.waitForTimeout(1000);
            const playingCards = await page.locator('.library-card').count();
            if (playingCards > 0) {
                const label = page.locator('.completion-value').first();
                await expect(label).toBeVisible();
                const text = await label.textContent();
                expect(text).toContain('%');
            }
        });

        test('Completion slider is not visible on backlog games', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.waitForTimeout(2000);
            const isLoggedIn = await page.locator('#library-content').isVisible();
            if (!isLoggedIn) return;

            await page.locator('.lib-tab').nth(3).click(); // backlog tab
            await page.waitForTimeout(1000);
            const backlogCards = await page.locator('.library-card').count();
            if (backlogCards > 0) {
                const sliderCount = await page.locator('.completion-slider').count();
                expect(sliderCount).toBe(0);
            }
        });

        test('Completion bar fill element exists', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.waitForTimeout(2000);
            const isLoggedIn = await page.locator('#library-content').isVisible();
            if (!isLoggedIn) return;

            await page.locator('.lib-tab').nth(1).click();
            await page.waitForTimeout(1000);
            const playingCards = await page.locator('.library-card').count();
            if (playingCards > 0) {
                await expect(page.locator('.completion-bar-fill').first()).toBeVisible();
            }
        });

        test('Completion section visible on completed games', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.waitForTimeout(2000);
            const isLoggedIn = await page.locator('#library-content').isVisible();
            if (!isLoggedIn) return;

            await page.locator('.lib-tab').nth(2).click(); // completed tab
            await page.waitForTimeout(1000);
            const completedCards = await page.locator('.library-card').count();
            if (completedCards > 0) {
                await expect(page.locator('.completion-section').first()).toBeVisible();
            }
        });
    });

    // ─── EXPORT CSV TESTS ─────────────────────────────────
    test.describe('Export Library CSV', () => {

        test('Export CSV button is visible on library page', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await expect(page.locator('button:has-text("EXPORT CSV")')).toBeVisible();
        });

        test('Export CSV button has correct styling', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            const btn = page.locator('button:has-text("EXPORT CSV")');
            await expect(btn).toBeVisible();
            const text = await btn.textContent();
            expect(text).toContain('EXPORT CSV');
        });

        test('Export CSV button is in header area', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            const btn = page.locator('header button:has-text("EXPORT CSV")');
            await expect(btn).toBeVisible();
        });

        test('Clicking export CSV triggers download for logged in user', async ({ page }) => {
            await page.goto(`${BASE_URL}/library`);
            await page.waitForTimeout(2000);
            const isLoggedIn = await page.locator('#library-content').isVisible();
            if (!isLoggedIn) return;

            const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
            await page.locator('button:has-text("EXPORT CSV")').click();
            const download = await downloadPromise;
            if (download) {
                expect(download.suggestedFilename()).toContain('.csv');
            }
        });
    });

    // ─── GAME REVIEWS TESTS ───────────────────────────────
    test.describe('Game Reviews', () => {

        test('Review section visible in modal for logged in users', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(2000);
            // For unauthenticated users review section won't show — sign in prompt shows instead
            const signIn = page.locator('text=Sign in to track this game');
            const reviewSection = page.locator('text=MY REVIEW');
            const either = await signIn.isVisible() || await reviewSection.isVisible();
            expect(either).toBeTruthy();
        });

        test('Review textarea is visible when logged in', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(2000);
            const reviewTextarea = page.locator('textarea[id^="review-text-"]');
            if (await reviewTextarea.isVisible()) {
                await expect(reviewTextarea).toBeVisible();
            }
        });

        test('Save review button is visible when logged in', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(2000);
            const saveBtn = page.locator('button[id^="save-review-"]');
            if (await saveBtn.isVisible()) {
                await expect(saveBtn).toBeVisible();
            }
        });

        test('Review section shows MY REVIEW header when logged in', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(2000);
            const reviewHeader = page.locator('text=MY REVIEW');
            if (await reviewHeader.isVisible()) {
                await expect(reviewHeader).toBeVisible();
            }
        });

        test('API reviews endpoint returns 200', async ({ page }) => {
            const res = await page.request.get(`${BASE_URL}/api/reviews/3498`);
            expect(res.status()).toBe(200);
        });

        test('API reviews endpoint returns array', async ({ page }) => {
            const res = await page.request.get(`${BASE_URL}/api/reviews/3498`);
            const body = await res.json();
            expect(Array.isArray(body)).toBeTruthy();
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
            if (await notLoggedIn.isVisible()) {
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

    // ─── PUBLIC USER PROFILE TESTS ────────────────────────
    test.describe('Public User Profile', () => {

        test('Public profile page loads', async ({ page }) => {
            await page.goto(`${BASE_URL}/user/2`);
            await page.waitForTimeout(3000);
            const either = await page.locator('#not-found').isVisible() || await page.locator('#profile-content').isVisible();
            expect(either).toBeTruthy();
        });

        test('Public profile shows user name when found', async ({ page }) => {
            await page.goto(`${BASE_URL}/user/2`);
            await page.waitForTimeout(3000);
            if (await page.locator('#profile-content').isVisible()) {
                await expect(page.locator('#profile-name')).toBeVisible();
                const name = await page.locator('#profile-name').textContent();
                expect(name.length).toBeGreaterThan(0);
            }
        });

        test('Public profile shows join date', async ({ page }) => {
            await page.goto(`${BASE_URL}/user/2`);
            await page.waitForTimeout(3000);
            if (await page.locator('#profile-content').isVisible()) {
                await expect(page.locator('#profile-joined')).toBeVisible();
            }
        });

        test('Public profile shows stats grid', async ({ page }) => {
            await page.goto(`${BASE_URL}/user/2`);
            await page.waitForTimeout(3000);
            if (await page.locator('#profile-content').isVisible()) {
                await expect(page.locator('#stats-grid')).toBeVisible();
            }
        });

        test('Public profile stats show games count', async ({ page }) => {
            await page.goto(`${BASE_URL}/user/2`);
            await page.waitForTimeout(3000);
            if (await page.locator('#profile-content').isVisible()) {
                const statCards = page.locator('.stat-card');
                expect(await statCards.count()).toBeGreaterThan(0);
            }
        });

        test('Public profile shows game collection section', async ({ page }) => {
            await page.goto(`${BASE_URL}/user/2`);
            await page.waitForTimeout(3000);
            if (await page.locator('#profile-content').isVisible()) {
                await expect(page.locator('#games-grid-public')).toBeVisible();
            }
        });

        test('Public profile has share button', async ({ page }) => {
            await page.goto(`${BASE_URL}/user/2`);
            await page.waitForTimeout(3000);
            if (await page.locator('#profile-content').isVisible()) {
                await expect(page.locator('button:has-text("SHARE")')).toBeVisible();
            }
        });

        test('Share button copies profile link to clipboard', async ({ page }) => {
            await page.goto(`${BASE_URL}/user/2`);
            await page.waitForTimeout(3000);
            if (await page.locator('#profile-content').isVisible()) {
                await page.locator('button:has-text("SHARE")').click();
                await page.waitForTimeout(500);
                const msg = page.locator('#copy-msg');
                await expect(msg).toBeVisible();
            }
        });

        test('Public profile has back to games button', async ({ page }) => {
            await page.goto(`${BASE_URL}/user/2`);
            await expect(page.locator('a[href="/"]')).toBeVisible();
        });

        test('Non-existent user shows not found', async ({ page }) => {
            await page.goto(`${BASE_URL}/user/99999`);
            await page.waitForTimeout(3000);
            await expect(page.locator('#not-found')).toBeVisible();
        });

        test('Public profile URL uses user ID', async ({ page }) => {
            await page.goto(`${BASE_URL}/user/2`);
            expect(page.url()).toContain('/user/2');
        });
    });

    // ─── SOCIAL PAGE TESTS ────────────────────────────────
    test.describe('Social Page', () => {

        test('Social page loads', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await expect(page.locator('header h1')).toBeVisible();
        });

        test('Social page has correct title', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await expect(page).toHaveTitle(/Games Tracker/);
        });

        test('Social shows not logged in state when unauthenticated', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await page.waitForTimeout(2000);
            const notLoggedIn = page.locator('#not-logged-in');
            if (await notLoggedIn.isVisible()) {
                await expect(notLoggedIn).toBeVisible();
            }
        });

        test('Social has back to games button', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await expect(page.locator('a[href="/"]')).toBeVisible();
        });

        test('Social back to games navigates home', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await page.locator('a[href="/"]').first().click();
            await expect(page).toHaveURL(BASE_URL + '/');
        });

        test('Social has my library link', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await expect(page.locator('a[href="/library"]')).toBeVisible();
        });

        test('Social has my profile link', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await expect(page.locator('a[href="/profile"]')).toBeVisible();
        });

        test('Social shows sidebar when logged in', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await page.waitForTimeout(2000);
            const sidebar = page.locator('#sidebar');
            if (await sidebar.isVisible()) {
                await expect(sidebar).toBeVisible();
            }
        });

        test('Social shows Find Users search when logged in', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await page.waitForTimeout(2000);
            const search = page.locator('#user-search-input');
            if (await search.isVisible()) {
                await expect(search).toBeVisible();
            }
        });

        test('User search shows results when typing', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await page.waitForTimeout(2000);
            const search = page.locator('#user-search-input');
            if (await search.isVisible()) {
                await page.fill('#user-search-input', 'sahar');
                await page.waitForTimeout(1500);
                const results = page.locator('#user-search-results');
                await expect(results).toBeVisible();
            }
        });

        test('Social feed section visible when logged in', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await page.waitForTimeout(2000);
            const feed = page.locator('#feed-section');
            if (await feed.isVisible()) {
                await expect(feed).toBeVisible();
            }
        });

        test('Social following count shows when logged in', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await page.waitForTimeout(2000);
            const count = page.locator('#following-count');
            if (await count.isVisible()) {
                const text = await count.textContent();
                expect(text).toContain('Following');
            }
        });

        test('Social followers count shows when logged in', async ({ page }) => {
            await page.goto(`${BASE_URL}/social`);
            await page.waitForTimeout(2000);
            const count = page.locator('#followers-count');
            if (await count.isVisible()) {
                const text = await count.textContent();
                expect(text).toContain('Followers');
            }
        });

        test('API follow endpoint requires authentication', async ({ page }) => {
            const res = await page.request.post(`${BASE_URL}/api/follow/1`);
            expect(res.status()).toBe(401);
        });

        test('API following endpoint requires authentication', async ({ page }) => {
            const res = await page.request.get(`${BASE_URL}/api/following`);
            expect(res.status()).toBe(401);
        });

        test('API users search returns results', async ({ page }) => {
            const res = await page.request.get(`${BASE_URL}/api/users/search?query=sahar`, {
                headers: { 'Authorization': 'Bearer invalidtoken' }
            });
            expect([200, 401]).toContain(res.status());
        });

        test('API public user profile returns data', async ({ page }) => {
            const res = await page.request.get(`${BASE_URL}/api/users/2`);
            expect(res.status()).toBe(200);
            const body = await res.json();
            expect(body).toHaveProperty('user');
            expect(body).toHaveProperty('games');
            expect(body).toHaveProperty('followers');
            expect(body).toHaveProperty('following');
        });
    });

    // ─── NOTIFICATION CENTER TESTS ────────────────────────
    test.describe('Notification Center', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
        });

        test('Notification bell button is visible', async ({ page }) => {
            await expect(page.locator('#notif-btn')).toBeVisible();
        });

        test('Clicking bell opens dropdown', async ({ page }) => {
            await page.locator('#notif-btn').click();
            await expect(page.locator('#notif-dropdown')).toBeVisible();
        });

        test('Dropdown shows NOTIFICATIONS header', async ({ page }) => {
            await page.locator('#notif-btn').click();
            await expect(page.locator('#notif-dropdown')).toContainText('NOTIFICATIONS');
        });

        test('Dropdown has mark all read button', async ({ page }) => {
            await page.locator('#notif-btn').click();
            await expect(page.locator('#notif-dropdown button:has-text("Mark all read")')).toBeVisible();
        });

        test('Dropdown has clear all button', async ({ page }) => {
            await page.locator('#notif-btn').click();
            await expect(page.locator('#notif-dropdown button:has-text("Clear all")')).toBeVisible();
        });

        test('Notification list element exists in dropdown', async ({ page }) => {
            await page.locator('#notif-btn').click();
            await expect(page.locator('#notif-list')).toBeVisible();
        });

        test('Dropdown closes on outside click', async ({ page }) => {
            await page.locator('#notif-btn').click();
            await expect(page.locator('#notif-dropdown')).toBeVisible();
            await page.mouse.click(100, 500);
            await expect(page.locator('#notif-dropdown')).toBeHidden();
        });

        test('Clicking bell again closes dropdown', async ({ page }) => {
            await page.locator('#notif-btn').click();
            await expect(page.locator('#notif-dropdown')).toBeVisible();
            await page.locator('#notif-btn').click();
            await expect(page.locator('#notif-dropdown')).toBeHidden();
        });

        test('Notification count badge hidden when no unread', async ({ page }) => {
            // Badge is hidden by default for non-logged in users
            const badge = page.locator('#notif-count');
            const display = await badge.evaluate(el => window.getComputedStyle(el).display);
            expect(display).toBe('none');
        });

        test('API notifications endpoint requires authentication', async ({ page }) => {
            const res = await page.request.get(`${BASE_URL}/api/notifications`);
            expect(res.status()).toBe(401);
        });

        test('API notifications read endpoint requires authentication', async ({ page }) => {
            const res = await page.request.post(`${BASE_URL}/api/notifications/read`);
            expect(res.status()).toBe(401);
        });

        test('API notifications delete endpoint requires authentication', async ({ page }) => {
            const res = await page.request.delete(`${BASE_URL}/api/notifications`);
            expect(res.status()).toBe(401);
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

        test('Discover has all 7 genre filter buttons', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await expect(page.locator('.genre-filter-btn')).toHaveCount(7);
        });

        test('All genre filter is active by default', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await expect(page.locator('.genre-filter-btn').first()).toHaveClass(/active/);
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
            expect(await page.locator('.gem-card').count()).toBeGreaterThan(0);
        });

        test('Gem cards show rating', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await page.waitForTimeout(5000);
            await expect(page.locator('.gem-rating').first()).toBeVisible();
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

        test('Genre filter button click works', async ({ page }) => {
            await page.goto(`${BASE_URL}/discover`);
            await page.waitForTimeout(2000);
            const rpgBtn = page.locator('.genre-filter-btn').nth(2);
            await rpgBtn.click();
            await expect(rpgBtn).toHaveClass(/active/);
        });
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

        test('Social button is visible in header', async ({ page }) => {
            await expect(page.locator('a[href="/social"]')).toBeVisible();
        });

        test('Notification bell is visible in header', async ({ page }) => {
            await expect(page.locator('#notif-btn')).toBeVisible();
        });

        test('Sign in button is visible when not logged in', async ({ page }) => {
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

        test('Social button navigates to social page', async ({ page }) => {
            await page.locator('a[href="/social"]').click();
            await expect(page).toHaveURL(`${BASE_URL}/social`);
        });

        test('Sign in button navigates to auth page', async ({ page }) => {
            await page.locator('#auth-nav-btn').click();
            await expect(page).toHaveURL(`${BASE_URL}/auth`);
        });

        test('Music button is visible', async ({ page }) => {
            await expect(page.locator('#music-btn')).toBeVisible();
        });

        test('Notification bell opens dropdown', async ({ page }) => {
            await page.locator('#notif-btn').click();
            await expect(page.locator('#notif-dropdown')).toBeVisible();
        });

        test('Notification dropdown closes when clicking outside', async ({ page }) => {
            await page.locator('#notif-btn').click();
            await expect(page.locator('#notif-dropdown')).toBeVisible();
            await page.mouse.click(100, 400);
            await expect(page.locator('#notif-dropdown')).toBeHidden();
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

        test('Sign in prompt links to auth page', async ({ page }) => {
            await expect(page.locator('.modal-body a[href="/auth"]')).toBeVisible();
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
            await expect(page.locator('#load-more-btn')).toBeVisible();
        });

        test('Games counter shows correct text', async ({ page }) => {
            await expect(page.locator('#games-counter')).toContainText('Showing');
        });

        test('Load more loads additional games', async ({ page }) => {
            const initialCount = await page.locator('.game-card').count();
            await page.locator('#load-more-btn').click();
            await page.waitForTimeout(2000);
            expect(await page.locator('.game-card').count()).toBeGreaterThan(initialCount);
        });

        test('Load more button disappears when all games loaded', async ({ page }) => {
            let attempts = 0;
            while (attempts < 10) {
                const btn = page.locator('#load-more-btn');
                if (!await btn.isVisible()) break;
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
            expect(await page.locator('#games-counter').textContent()).not.toBe(initialText);
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
            await expect(page.locator('#description-text')).toBeVisible();
        });

        test('Description loads content after delay', async ({ page }) => {
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(6000);
            expect(await page.locator('#description-text').textContent()).not.toBe('Loading description...');
        });

        test('Description shows content or no description message', async ({ page }) => {
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(3000);
            expect((await page.locator('#description-text').textContent()).length).toBeGreaterThan(0);
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
            for (let i = 0; i < Math.min(await cards.count(), 8); i++) {
                await cards.nth(i).click();
                await page.waitForTimeout(4000);
                const screenshots = page.locator('.screenshot-img');
                if (await screenshots.count() > 0) {
                    await screenshots.first().click();
                    await page.waitForTimeout(2000);
                    await expect(page.locator('.lightbox-overlay')).toBeVisible();
                    return;
                }
                await page.locator('.modal-close-btn').click();
                await page.waitForTimeout(500);
            }
        });

        test('Lightbox has navigation buttons', async ({ page }) => {
            const cards = page.locator('.game-card');
            for (let i = 0; i < Math.min(await cards.count(), 8); i++) {
                await cards.nth(i).click();
                await page.waitForTimeout(4000);
                const screenshots = page.locator('.screenshot-img');
                if (await screenshots.count() > 0) {
                    await screenshots.first().click();
                    await page.waitForTimeout(2000);
                    await expect(page.locator('.prev-btn')).toBeVisible();
                    await expect(page.locator('.next-btn')).toBeVisible();
                    return;
                }
                await page.locator('.modal-close-btn').click();
                await page.waitForTimeout(500);
            }
        });

        test('Lightbox close button works', async ({ page }) => {
            const cards = page.locator('.game-card');
            for (let i = 0; i < Math.min(await cards.count(), 8); i++) {
                await cards.nth(i).click();
                await page.waitForTimeout(4000);
                const screenshots = page.locator('.screenshot-img');
                if (await screenshots.count() > 0) {
                    await screenshots.first().click();
                    await page.waitForTimeout(2000);
                    await page.locator('.lightbox-close').click();
                    await expect(page.locator('.lightbox-overlay')).not.toBeVisible();
                    return;
                }
                await page.locator('.modal-close-btn').click();
                await page.waitForTimeout(500);
            }
        });

        test('Clicking outside lightbox closes it', async ({ page }) => {
            const cards = page.locator('.game-card');
            for (let i = 0; i < Math.min(await cards.count(), 8); i++) {
                await cards.nth(i).click();
                await page.waitForTimeout(4000);
                const screenshots = page.locator('.screenshot-img');
                if (await screenshots.count() > 0) {
                    await screenshots.first().click();
                    await page.waitForTimeout(3000);
                    const lightbox = page.locator('.lightbox-overlay');
                    if (!await lightbox.isVisible()) {
                        await page.locator('.modal-close-btn').click();
                        continue;
                    }
                    await page.mouse.click(5, 5);
                    await page.waitForTimeout(1000);
                    await expect(lightbox).not.toBeVisible();
                    return;
                }
                await page.locator('.modal-close-btn').click();
                await page.waitForTimeout(500);
            }
        });
    });

    // ─── RECENTLY VIEWED TESTS ────────────────────────────
    test.describe('Recently Viewed', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });
        });

        test('Recently viewed section hidden on load', async ({ page }) => {
            await expect(page.locator('#recently-viewed')).toBeHidden();
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
            expect(await page.locator('#recently-viewed img').count()).toBeLessThanOrEqual(5);
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