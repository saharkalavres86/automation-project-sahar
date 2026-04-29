import { test, expect } from '@playwright/test';

test.describe('API Testing', () => {

    test('GET users list', async ({ request }) => {
        const response = await request.get('https://jsonplaceholder.typicode.com/users');
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toBeInstanceOf(Array);
        expect(responseBody.length).toBe(10);
    });

    test('POST create user', async ({ request }) => {
        const response = await request.post('https://jsonplaceholder.typicode.com/posts', {
            data: {
                title: 'QA Engineer',
                body: 'Automation testing',
                userId: 1
            }
        });
        expect(response.status()).toBe(201);
        const responseBody = await response.json();
        expect(responseBody.id).toBeTruthy();
        expect(responseBody.title).toBe('QA Engineer');
    });

    test('GET user not found', async ({ request }) => {
        const response = await request.get('https://jsonplaceholder.typicode.com/users/999');
        expect(response.status()).toBe(404);
    });

});