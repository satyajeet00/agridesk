import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for AgriDesk UI tests.
 *
 * Assumes both servers are already running:
 *  - Spring Boot backend at http://127.0.0.1:8080
 *  - Next.js frontend  at http://127.0.0.1:5501
 *
 * Run: npx playwright test
 */
export default defineConfig({
  testDir: "./tests-e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 1, // sequential — tests share a real backend with persistent H2 file
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5501",
    headless: true,
    viewport: { width: 1366, height: 900 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
