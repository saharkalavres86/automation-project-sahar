import { test, expect } from '@playwright/test';

test.describe('API Testing', () => {

    test('GET users list', async ({ request }) => {
        const response = await request.get('https://reqres.in/api/users?page=1');
        // 1. Verify status code is 200
        expect(response.status()).toBe(200);
        expect(response.statusText()).toBe('OK');
        // 2. Verify response has 'data' array
        const responseBody = await response.json();
        expect(responseBody.data).toBeInstanceOf(Array);
            // 3. Verify there are 6 users on page 1
        expect(responseBody.data.length).toBe(6);
    });

test('POST create user', async ({ request }) => {
    const response = await request.post('https://reqres.in/api/users', {
        data: {
        name: 'John',
        job: 'QA Engineer'
        }
    });
    // 1. Verify status code is 201 (created)
    expect(response.status()).toBe(201);
        // 2. Verify response has 'id' field
    const responseBody = await response.json();
    expect(responseBody.id).toBeTruthy();
    // 3. Verify response 'name' equals 'John'
    expect(responseBody.name).toBe('John');
    // 4. Verify response 'job' equals 'QA Engineer'
    expect(responseBody.job).toBe('QA Engineer');
});

test('GET user not found', async ({ request }) => {
    const response = await request.get('https://reqres.in/api/users/999');
    // 1. Verify status code is 404
    expect(response.status()).toBe(404);
    // 2. Verify response body is empty object {}
    const responseBody = await response.json();
    expect(responseBody).toEqual({});
});


});