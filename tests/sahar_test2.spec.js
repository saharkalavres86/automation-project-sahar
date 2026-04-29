import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.spec.js';
import { InventoryPage } from '../pages/inventory.spec.js';

test.describe('Sauce Demo — Page Object Model', () => {

    test('add product to cart using POM', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const inventoryPage = new InventoryPage(page);

        await loginPage.navigate();
        await loginPage.login('standard_user', 'secret_sauce');
        await inventoryPage.addToCart(['sauce-labs-backpack', 'sauce-labs-bike-light']);
        await inventoryPage.getCartCount();

        const count = await inventoryPage.getCartCount();
        expect(count).toBe('2');
    
    });

});