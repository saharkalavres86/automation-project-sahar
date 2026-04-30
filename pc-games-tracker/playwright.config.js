import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '../tests',
    testIgnore: ['**/sahar_test5*', '**/lesson5*'],
    use: {
        headless: true,
        baseURL: 'https://www.saucedemo.com',
    },
    reporter: 'html',
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        }
    ]
});