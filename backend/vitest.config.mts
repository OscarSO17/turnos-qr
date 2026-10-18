import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/pruebas/preparar.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});