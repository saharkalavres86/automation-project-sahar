import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.spec.js';

const users = [
    { username: 'standard_user', shouldPass: true },
    { username: 'locked_out_user', shouldPass: false },
    { username: 'problem_user', shouldPass: true },
    { username: 'performance_glitch_user', shouldPass: true }
];

for (const user of users) {
    test(`login with ${user.username}`, async ({ page }) => {
        const loginPage = new LoginPage(page);
        
        // תמיד מנווטים ומתחברים
        await loginPage.navigate();
        await loginPage.login(user.username, 'secret_sauce');

        if (user.shouldPass) {
            // בדוק שהגענו לעמוד המוצרים
            await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
        } else {
            // בדוק שיש הודעת שגיאה
            await expect(page.locator('[data-test="error"]')).toHaveText('Epic sadface: Sorry, this user has been locked out.');
        }
    });
}