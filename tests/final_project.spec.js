import { test, expect } from '../fixtures/base.js';
import { LoginPage } from '../pages/login.spec.js';
import { InventoryPage } from '../pages/inventory.spec.js';

const users = [
    { username: 'standard_user', shouldPass: true },
    { username: 'locked_out_user', shouldPass: false },
];

for (const user of users) {
    test(`login with ${user.username}`, async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        await loginPage.login(user.username, 'secret_sauce');
        if (user.shouldPass) {
        await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
        } else {
        await expect(page.locator('[data-test="error"]')).toHaveText('Epic sadface: Sorry, this user has been locked out.');
        }
    });
}
    test('adding multiple products to cart using POM', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const inventoryPage = new InventoryPage(page);
        await loginPage.navigate();
        await loginPage.login('standard_user', 'secret_sauce');
        await inventoryPage.addToCart(['sauce-labs-backpack', 'sauce-labs-bike-light' , 'sauce-labs-bolt-t-shirt']);
        await inventoryPage.getCartCount();
        const count = await inventoryPage.getCartCount();
        expect(count).toBe('3');
    });

test('checkout process', async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    await loginPage.navigate();
    await loginPage.login('standard_user', 'secret_sauce');
    
    // Add product
    await inventoryPage.addToCart('sauce-labs-backpack');
    
    // Go to cart
    await inventoryPage.goToCart();
    await expect(page).toHaveURL('https://www.saucedemo.com/cart.html');
    
    // Checkout
    await page.click('#checkout');
    await page.fill('#first-name', 'John');
    await page.fill('#last-name', 'Doe');
    await page.fill('#postal-code', '12345');
    await page.click('#continue');
    await page.click('#finish');
    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
});

test('sort products from high price to low price', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('standard_user', 'secret_sauce');
    
    await page.selectOption('.product_sort_container', 'hilo');
    const prices = await page.$$eval('.inventory_item_price', 
        elements => elements.map(el => parseFloat(el.textContent.replace('$', ''))));
    const sortedPrices = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sortedPrices);
});

test('validate that test runs on chromium', async ({ page }) => {
    const browserName = page.context().browser().browserType().name();
    expect(browserName).toBe('chromium');
});