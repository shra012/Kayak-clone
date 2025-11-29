# Kayak E2E Tests (Playwright)

This folder contains end-to-end tests for the Kayak Simulation Platform using Playwright.

## Prerequisites

1. Backend and frontend running (recommended via Docker):

```bash
cd Kayak-Project
docker compose up --build -d

# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

2. Install E2E dependencies:

```bash
cd e2e
npm install
```

This installs `@playwright/test`. You can optionally run:

```bash
npx playwright install
```

to install browser binaries if prompted.

## Configuration

Base URL for the frontend:

```bash
export E2E_BASE_URL=http://localhost:5173
```

If not set, it defaults to `http://localhost:5173`.

Credentials for tests:

```bash
# Regular user (for login and booking flows)
export E2E_USER_EMAIL="user@example.com"
export E2E_USER_PASSWORD="password123"

# Admin user (for admin inventory tests)
export E2E_ADMIN_EMAIL="admin@example.com"
export E2E_ADMIN_PASSWORD="admin-password"
```

If these environment variables are not set, the related tests are skipped.

## Running Tests

From the `e2e` directory:

```bash
cd e2e
npm test
```

Run in headed mode (visible browser):

```bash
npm run test:headed
```

Debug a single test:

```bash
npx playwright test tests/auth-and-home.spec.js --debug
```

View HTML report:

```bash
npm run test:report
```

## Test Suites

- `tests/auth-and-home.spec.js`
  - Verifies that the home page loads and navigation links are visible.
  - Optionally logs in using `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`.

- `tests/booking-flow.spec.js`
  - Optionally logs in as a regular user.
  - Navigates to Flights, performs a basic search, and opens the first flight card.
  - This is a scaffold for a full booking and payment flow.

- `tests/admin-inventory.spec.js`
  - Logs in as admin using `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`.
  - Navigates to the Admin area and checks that inventory sections render.

## Notes

- Tests are written to be as resilient as possible given the existing UI,
  but you may need to adjust selectors (button texts, data-testid attributes)
  if the UI changes.
- For a full booking and payment automation, extend `booking-flow.spec.js`
  once the exact DOM structure and API behavior are stable.
- These tests do not modify configuration or Docker; they only drive the
  running application from the browser perspective.


