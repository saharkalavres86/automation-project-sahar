import { test, expect } from '@playwright/test';


test.describe('Login to the site and add Sauce Labs Backpack to the cart and check that its there', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('https://www.saucedemo.com');
        await page.fill('#user-name', 'standard_user');
        await page.fill('#password', 'secret_sauce');
        await page.click('#login-button');
    });
    test('Check that there are products to be displayed in inventory', async ({ page }) => {
        await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
        await expect(page.locator('.title')).toHaveText('Products');
 });
// test('sorting products from low price to high price', async ({ page }) => {
//await page.selectOption('.product_sort_container', 'lohi');
//const firstProduct = page.locator('.inventory_item_name').first();
//await expect(firstProduct).toHaveText('Sauce Labs Onesie');
  // });

  test('add Sauce Labs Backpack to the cart and verify it was added', async ({ page }) => {
        await page.click('#add-to-cart-sauce-labs-backpack');
        await page.click('.shopping_cart_link');
        const cartItem = page.locator('.inventory_item_name');
        await expect(cartItem).toBeVisible();
        await expect(cartItem).toHaveCount(1);
        await expect(cartItem).toHaveText('Sauce Labs Backpack');
  });

});

