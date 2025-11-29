const { test, expect } = require('@playwright/test');

/**
 * Basic auth and home page smoke tests.
 *
 * These tests assume:
 * - The frontend is running and reachable at baseURL.
 * - Optional environment variables for real login:
 *   - E2E_USER_EMAIL
 *   - E2E_USER_PASSWORD
 */

test.describe('Home and navigation', () => {
  test('home page loads and shows main navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Kayak/i);

    await expect(page.getByRole('link', { name: /Flights/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Stays|Hotels/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Cars/i })).toBeVisible();
  });
});

test.describe('Login flow (optional, uses env credentials)', () => {
  test('can submit login form and see result', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are not set');
    }

    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);

    await page.getByRole('button', { name: /log in|sign in/i }).click();

    await page.waitForTimeout(1000);

    await expect(page.getByText(/logout|log out/i)).toBeVisible();
  });
});


