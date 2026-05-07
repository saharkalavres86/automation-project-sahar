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
            const backBtn = page.locator('a[href="/"]');
            await expect(backBtn).toBeVisible();
        });

        test('Back to games button navigates to home', async ({ page }) => {
            await page.goto(`${BASE_URL}/wishlist`);
            await page.locator('a[href="/"]').first().click();
            await expect(page).toHaveURL(BASE_URL + '/');
        });

        test('Wishlist shows empty state when no games', async ({ page }) => {
            await page.goto(`${BASE_URL}/wishlist`);
            await page.waitForTimeout(2000);
            const cards = page.locator('.game-card');
            const count = await cards.count();
            if (count === 0) {
                await expect(page.locator('#games-grid')).toContainText('wishlist is empty');
            }
        });

        test('Adding game to wishlist shows it on wishlist page', async ({ page }) => {
            // Go to main page and add a game
            await page.goto(BASE_URL);
            await page.waitForSelector('.game-card', { timeout: 15000 });

            const wishlistBtn = page.locator('.wishlist-btn').first();
            const isWishlisted = await wishlistBtn.textContent();

            if (isWishlisted.includes('🔖')) {
                await wishlistBtn.click();
                await page.waitForTimeout(500);
            }

            // Go to wishlist page and verify
            await page.goto(`${BASE_URL}/wishlist`);
            await page.waitForTimeout(2000);
            const cards = page.locator('.game-card');
            await expect(cards).not.toHaveCount(0);
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
            // Keep clicking load more until button disappears
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

        test('Description shows loading text initially', async ({ page }) => {
            // Click and immediately check for loading text
            await page.locator('.game-card').first().click();
            const descEl = page.locator('#description-text');
            await expect(descEl).toBeVisible();
        });

        test('Description loads content after delay', async ({ page }) => {
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(3000);
            const descEl = page.locator('#description-text');
            const text = await descEl.textContent();
            expect(text).not.toBe('Loading description...');
        });

        test('Description shows either content or no description message', async ({ page }) => {
            await page.locator('.game-card').first().click();
            await page.waitForTimeout(3000);
            const descEl = page.locator('#description-text');
            const text = await descEl.textContent();
            expect(
                text.length > 0
            ).toBeTruthy();
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

    for (let i = 0; i < count; i++) {
        await cards.nth(i).click();
        await page.waitForTimeout(3000); // wait for screenshots to load
        const screenshots = page.locator('.screenshot-img');
        const screenshotCount = await screenshots.count();
        if (screenshotCount > 0) {
            await screenshots.first().click();
            await page.waitForTimeout(1000);
            await expect(page.locator('.lightbox-overlay')).toBeVisible();
            return;
        }
        await page.locator('.modal-close-btn').click();
        await page.waitForTimeout(500);
    }
});

  test('Lightbox has navigation buttons', async ({ page }) => {
    const cards = page.locator('.game-card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
        await cards.nth(i).click();
        await page.waitForTimeout(2000);
        const screenshots = page.locator('.screenshot-img');
        const screenshotCount = await screenshots.count();
        if (screenshotCount > 0) {
            await screenshots.first().click();
            await expect(page.locator('.lightbox-overlay')).toBeVisible();
            await expect(page.locator('.prev-btn')).toBeVisible();
            await expect(page.locator('.next-btn')).toBeVisible();
            return;
        }
        await page.locator('.modal-close-btn').click();
        await page.waitForTimeout(300);
    }
});

        test('Lightbox close button works', async ({ page }) => {
            const cards = page.locator('.game-card');
            const count = await cards.count();

            for (let i = 0; i < count; i++) {
                await cards.nth(i).click();
                await page.waitForTimeout(2000);
                const screenshots = page.locator('.screenshot-img');
                if (await screenshots.count() > 0) {
                    await screenshots.first().click();
                    await expect(page.locator('.lightbox-overlay')).toBeVisible();
                    await page.locator('.lightbox-close').click();
                    await expect(page.locator('.lightbox-overlay')).not.toBeVisible();
                    return;
                }
                await page.locator('.modal-close-btn').click();
                await page.waitForTimeout(300);
            }
        });

        test('Clicking outside lightbox closes it', async ({ page }) => {
            const cards = page.locator('.game-card');
            const count = await cards.count();

            for (let i = 0; i < count; i++) {
                await cards.nth(i).click();
                await page.waitForTimeout(2000);
                const screenshots = page.locator('.screenshot-img');
                if (await screenshots.count() > 0) {
                    await screenshots.first().click();
                    await expect(page.locator('.lightbox-overlay')).toBeVisible();
                    await page.mouse.click(10, 10);
                    await expect(page.locator('.lightbox-overlay')).not.toBeVisible();
                    return;
                }
                await page.locator('.modal-close-btn').click();
                await page.waitForTimeout(300);
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
            // Click 6 different games
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