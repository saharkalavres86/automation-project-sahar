const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    use: {
        headless: false,
        baseURL: 'https://www.saucedemo.com',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    reporter: 'html',
});