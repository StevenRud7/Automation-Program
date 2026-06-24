// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for the Jones Automation Exercise.
 * Docs: https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry failed tests a couple of times on CI to absorb network flakiness.
  retries: process.env.CI ? 2 : 0,

  // Single worker for this small exercise — keeps console.log output ordered and easy to read.
  workers: 1,

  // Reporter: concise list in the terminal + a full HTML report you can open after the run.
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // All page.goto('/') calls in tests resolve against this.
    baseURL: 'https://test.netlify.app',

    // Capture a screenshot only when a test fails (separate from our explicit
    // mid-flow screenshot, which the test takes manually).
    screenshot: 'only-on-failure',

    // Record a trace on first retry — invaluable for debugging a failed run.
    trace: 'on-first-retry',

    // Keep the browser visible by default while we're building this out.
    // Override at the CLI with `npx playwright test --headed` / headless via config.
    headless: true,

    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
