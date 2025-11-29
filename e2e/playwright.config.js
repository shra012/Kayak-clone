// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * Playwright configuration for Kayak E2E tests.
 *
 * Assumptions:
 * - Frontend is running at http://localhost:5173 (Docker or dev server)
 * - Backend is running at http://localhost:3000
 *
 * You can override the base URL with the E2E_BASE_URL environment variable.
 */

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
});


