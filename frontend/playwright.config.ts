import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  globalSetup: "./tests/e2e/global-setup.ts",
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  timeout: 30_000,
  webServer: [
    {
      /** Runs `db:setup:test` (createdb + migrate) then API on :3002 via `backend/.env.test`. */
      command: "npm run dev:test",
      cwd: "../backend",
      url: "http://localhost:3002/health",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        PORT: "3002",
      },
    },
    {
      command: "npm run dev",
      url: "http://localhost:3005",
      reuseExistingServer: false,
      timeout: 120_000,
      /** E2e-only port; proxies `/api` to test backend (not `frontend/.env.local` / dev :3000). */
      env: {
        API_URL: "http://localhost:3002",
        PORT: "3005",
      },
    },
  ],
  use: {
    baseURL: "http://localhost:3005",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
