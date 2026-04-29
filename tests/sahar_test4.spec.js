import { test, expect } from '../fixtures/base.js';

test.describe('Sauce Demo — Fixtures', () => {

    test('add product to cart', async ({ loginPage, inventoryPage }) => {
        // Write here only the actions — no login needed!
        // 1. Add 'sauce-labs-backpack' to cart
        await inventoryPage.addToCart('sauce-labs-backpack');
        // 2. Go to cart
        await inventoryPage.goToCart();
        // 3. Verify cart count is '1'
        const count = await inventoryPage.getCartCount();
        expect(count).toBe('1');
        // 4. Verify product name is 'Sauce Labs Backpack'
        const productName = await inventoryPage.getProductName();
        expect(productName).toBe('Sauce Labs Backpack');
    });

});
