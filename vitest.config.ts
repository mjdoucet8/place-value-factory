import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["tests/e2e/**", "tests/pilot/**", "node_modules/**", "dist/**"],
  },
});
