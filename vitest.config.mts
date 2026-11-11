import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 60_000,
    reporters: ["default"],
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
    },
  },
});
