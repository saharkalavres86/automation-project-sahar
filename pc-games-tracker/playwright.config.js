import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '../tests',
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