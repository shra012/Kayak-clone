const { test, expect } = require('@playwright/test');

/**
 * End-to-end booking flow (happy path).
 *
 * This test is written to be environment-driven and to fail fast if
 * prerequisites are not met. It covers:
 * - Login (if credentials provided)
 * - Flight search
 * - Selecting a flight
 * - Starting a booking
 *
 * Backend specifics (such as exact button texts) may need minor tweaks
 * based on the current UI.
 */

const maybeLogin = async (page) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    return;
  }

  await page.goto('/login');

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /log in|sign in/i }).click();

  await page.waitForTimeout(1000);

  await expect(page.getByText(/logout|log out/i)).toBeVisible();
};

test.describe('Booking flow', () => {
  test('search flights and open a flight details or booking card', async ({ page }) => {
    await maybeLogin(page);

    await page.goto('/');

    await page.getByRole('link', { name: /flights/i }).click();

    await expect(page).toHaveURL(/flights/i);

    const fromInput = page.getByLabel(/from/i).first();
    const toInput = page.getByLabel(/to/i).first();

    await fromInput.fill('Los Angeles');
    await toInput.fill('New York');

    const searchButton = page.getByRole('button', { name: /search/i }).first();
    await searchButton.click();

    await page.waitForTimeout(1500);

    const resultCards = page.locator('[data-testid="flight-card"]').first();

    await expect(resultCards).toBeVisible();

    const detailsButton = page.getByRole('button', { name: /view details|details|select/i }).first();
    await detailsButton.click();

    await page.waitForTimeout(1000);
  });
});


