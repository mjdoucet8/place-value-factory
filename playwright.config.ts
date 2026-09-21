import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:5181",
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command:
      "rm -f db/e2e-local-development.json && PVF_DATA_PATH=db/e2e-local-development.json npm run dev",
    url: "http://127.0.0.1:5181",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
