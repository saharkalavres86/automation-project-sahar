import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.spec.js';
import { InventoryPage } from '../pages/inventory.spec.js';

export const test = base.extend({
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        await loginPage.login('standard_user', 'secret_sauce');
        await use(loginPage);
    },

    inventoryPage: async ({ page }, use) => {
        await use(new InventoryPage(page));
    }
});

export { expect } from '@playwright/test';