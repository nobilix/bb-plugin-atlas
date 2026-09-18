/**
 * The Playwright config, re-exported from where its dependency lives.
 *
 * `@playwright/test` is a dependency of `tests/` (the verification suite is a
 * self-contained workspace package, like `sync/`), and pnpm's node_modules are
 * strict, so a config at the repo root cannot import it. The real file is
 * `tests/playwright.config.ts` and it uses absolute paths, so `npx playwright
 * test` at the root and `pnpm test:e2e` both land on the same configuration.
 */
export { default } from "./tests/playwright.config.ts";
