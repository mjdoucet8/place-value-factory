import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/pilot",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: process.env.PVF_PILOT_URL ?? "http://127.0.0.1:5183",
    browserName: "chromium",
    headless: true,
    viewport: { width: 1366, height: 768 },
  },
});
