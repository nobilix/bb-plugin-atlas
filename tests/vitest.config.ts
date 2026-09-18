import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * One run for every vitest suite: the unit tests in `packages/atlas-core` and
 * the checks in `tests/`. Rooted at the repo so a test reads `data/` and
 * `site/dist` by relative path.
 */
export default defineConfig({
  root: fileURLToPath(new URL("..", import.meta.url)),
  test: {
    include: ["packages/atlas-core/src/**/*.test.ts", "tests/*.test.ts"],
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 60_000,
    reporters: process.env.CI ? ["default", "github-actions"] : ["default"],
  },
});
