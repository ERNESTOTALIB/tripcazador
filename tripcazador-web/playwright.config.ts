import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config para TripCazador.
 * BASE_URL permite apuntar a local, staging o production.
 */
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e/tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    // Desktop browsers — cubren cross-browser parity.
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile devices — verifican que el viewport pequeño NO rompe scroll.
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "mobile-safari-small",
      use: { ...devices["iPhone SE"] },
    },
    {
      name: "tablet-ipad",
      use: { ...devices["iPad (gen 7)"] },
    },
    {
      name: "tablet-ipad-landscape",
      use: { ...devices["iPad (gen 7) landscape"] },
    },
  ],
});
