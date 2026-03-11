import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3001);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;
const DEMO_ONLY = (process.env.PLAYWRIGHT_DEMO_ONLY ?? "false").trim().toLowerCase() === "true";
const WEB_SERVER_TIMEOUT = Number(process.env.PLAYWRIGHT_WEB_SERVER_TIMEOUT ?? 240_000);
const WEB_SERVER_COMMAND =
  process.env.PLAYWRIGHT_SERVER_CMD ??
  `node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: WEB_SERVER_COMMAND,
    url: BASE_URL,
    reuseExistingServer: process.env.PW_REUSE_SERVER === "true",
    timeout: WEB_SERVER_TIMEOUT,
    env: {
      NEXT_PUBLIC_DEMO_ONLY: DEMO_ONLY ? "true" : "false",
      NEXT_PUBLIC_E2E_TESTS: "true",
    },
  },
  projects: [
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
  ],
});
