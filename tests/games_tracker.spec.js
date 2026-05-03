import { test, expect } from '@playwright/test';

const BASE_URL = 'https://automation-project-sahar-production.up.railway.app';

test.describe('PC Games Tracker — UI Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
        // Wait for games to load
        await page.waitForSelector('.game-card', { timeout: 15000 });
    });

    // Page Load Tests
    test('Homepage loads with game cards', async ({ page }) => {
        const cards = page.locator('.game-card');
        await expect(cards).not.toHaveCount(0);
    });

    test('Page title is correct', async ({ page }) => {
        await expect(page).toHaveTitle('PC Games Tracker');
    });

    test('Header displays correctly', async ({ page }) => {
        await expect(page.locator('header h1')).toBeVisible();
    });

    // Search Tests
    test('Search filters games by name', async ({ page }) => {
        await page.fill('#search', 'a');
        await page.waitForTimeout(500);
        const cards = page.locator('.game-card');
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);
        // Verify each visible game contains the search term
        for (let i = 0; i < Math.min(count, 5); i++) {
            const name = await cards.nth(i).locator('h3').textContent();
            expect(name.toLowerCase()).toContain('a');
        }
    });

    test('Search with no results shows no games', async ({ page }) => {
        await page.fill('#search', 'xyznonexistentgame123');
        await page.waitForTimeout(500);
        const cards = page.locator('.game-card');
        await expect(cards).toHaveCount(0);
    });

    test('Clearing search restores all games', async ({ page }) => {
        const initialCount = await page.locator('.game-card').count();
        await page.fill('#search', 'abc');
        await page.waitForTimeout(500);
        await page.fill('#search', '');
        await page.waitForTimeout(500);
        const restoredCount = await page.locator('.game-card').count();
        expect(restoredCount).toBe(initialCount);
    });

    // Sorting Tests
    test('Sort by Name A-Z is default', async ({ page }) => {
    const names = await page.locator('.game-card h3').allTextContents();
    // This week games always appear first, so we skip them and check the rest
    const allGames = await page.evaluate(async () => {
        const response = await fetch('/api/games?sort=name');
        return await response.json();
    });
    const nonThisWeek = names.filter((_, i) => {
        const game = allGames[i];
        if (!game) return false;
        const diff = Math.ceil((new Date(game.release_date) - new Date()) / (1000 * 60 * 60 * 24));
        return !(diff >= 0 && diff <= 7);
    });
    const sorted = [...nonThisWeek].sort((a, b) => a.localeCompare(b));
    expect(nonThisWeek).toEqual(sorted);
});

    test('Sort by Release Date works', async ({ page }) => {
        await page.selectOption('#sort', 'released');
        await page.waitForTimeout(1000);
        const cards = page.locator('.game-card');
        await expect(cards).not.toHaveCount(0);
    });

    test('Sort by Rating works', async ({ page }) => {
        await page.selectOption('#sort', 'rating');
        await page.waitForTimeout(1000);
        const cards = page.locator('.game-card');
        await expect(cards).not.toHaveCount(0);
    });

    // Genre Filter Tests
    test('Filter by Action genre works', async ({ page }) => {
        await page.selectOption('#genre', 'action');
        await page.waitForTimeout(1000);
        const cards = page.locator('.game-card');
        const count = await cards.count();
        if (count > 0) {
            const firstGenre = await cards.first().locator('.genre-tag').first().textContent();
            expect(firstGenre.toLowerCase()).toContain('action');
        }
    });

    test('Filter by RPG genre works', async ({ page }) => {
        await page.selectOption('#genre', 'rpg');
        await page.waitForTimeout(1000);
        const cards = page.locator('.game-card');
        await expect(cards).not.toHaveCount(0);
    });

    test('Selecting All Genres restores full list', async ({ page }) => {
        const initialCount = await page.locator('.game-card').count();
        await page.selectOption('#genre', 'action');
        await page.waitForTimeout(1000);
        await page.selectOption('#genre', '');
        await page.waitForTimeout(1000);
        const restoredCount = await page.locator('.game-card').count();
        expect(restoredCount).toBe(initialCount);
    });

    // Modal Tests
    test('Clicking game card opens modal', async ({ page }) => {
        await page.locator('.game-card').first().click();
        await expect(page.locator('.modal-overlay')).toBeVisible();
    });

    test('Modal shows game name', async ({ page }) => {
        const gameName = await page.locator('.game-card h3').first().textContent();
        await page.locator('.game-card').first().click();
        await expect(page.locator('.modal-body h2')).toHaveText(gameName);
    });

    test('Modal shows release date', async ({ page }) => {
        await page.locator('.game-card').first().click();
        await expect(page.locator('.modal-body')).toContainText('Release Date');
    });

    test('Modal shows genres', async ({ page }) => {
        await page.locator('.game-card').first().click();
        await expect(page.locator('.modal-body')).toContainText('Genres');
    });

    test('Clicking outside modal closes it', async ({ page }) => {
        await page.locator('.game-card').first().click();
        await expect(page.locator('.modal-overlay')).toBeVisible();
        await page.mouse.click(10, 10);
        await expect(page.locator('.modal-overlay')).not.toBeVisible();
    });

    // Game Card Tests
    test('Each game card has an image or placeholder', async ({ page }) => {
        const cards = page.locator('.game-card');
        const count = await cards.count();
        for (let i = 0; i < Math.min(count, 5); i++) {
            const hasImage = await cards.nth(i).locator('img').count();
            const hasPlaceholder = await cards.nth(i).locator('.no-image').count();
            expect(hasImage + hasPlaceholder).toBeGreaterThan(0);
        }
    });

    test('Each game card shows a release date', async ({ page }) => {
        const dates = page.locator('.release-date');
        const count = await dates.count();
        expect(count).toBeGreaterThan(0);
    });

});