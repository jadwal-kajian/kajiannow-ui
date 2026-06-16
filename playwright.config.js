import { defineConfig, devices } from "@playwright/test";

// E2E tests for the geolocation flow. The dev server is started automatically.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    // Geolocation is fully mocked per-test via an init script, so we don't grant
    // real permissions here — the mock controls success/error/timeout deterministically.
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // A dummy VAPID key so the Web Push UI renders and is testable; the push
    // service worker and subscription are stubbed per-test (push.spec.js).
    // Production leaves VITE_VAPID_PUBLIC_KEY empty, which disables the feature.
    env: { ...process.env, VITE_VAPID_PUBLIC_KEY: "A".repeat(88) },
  },
});
