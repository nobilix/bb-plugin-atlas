/**
 * The Playwright suite: layout invariants over the built site.
 *
 * Headless Chromium only, three viewports, and a preview server over the real
 * `site/dist`. Nothing here reaches the network: the origin is a loopback
 * preview, which is also why no deploy origin appears anywhere in this file.
 * `PREVIEW_URL` exists so the same suite can be pointed at an already-running
 * server (`pnpm --filter site preview`) without editing anything.
 */
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

/*
 * Paths are absolute so this config behaves the same whether Playwright is
 * pointed at it directly or at the one-line re-export at the repo root. A
 * relative `testDir` resolves against whichever file the CLI was handed, which
 * is a difference nobody should have to remember.
 */
const here = import.meta.dirname;

const PORT = Number(process.env.PREVIEW_PORT ?? 4399);
const baseURL = process.env.PREVIEW_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: join(here, "e2e"),
  outputDir: join(here, "..", "test-results"),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI
    ? [["list"], ["github"], ["html", { open: "never", outputFolder: join(here, "..", "playwright-report") }]]
    : [["list"]],
  use: {
    baseURL,
    // Deterministic geometry: a scrollbar that appears on one machine and not
    // another changes `innerWidth`, and these tests measure exactly that.
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    trace: process.env.CI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  /*
   * A static server over `site/dist` rather than `astro preview`: Astro 7
   * daemonises preview, so the command returns at once and may attach to a
   * server someone else started on another port. See tests/scripts/serve-dist.mjs.
   */
  webServer: process.env.PREVIEW_URL
    ? undefined
    : {
        command: `node ${join(here, "scripts", "serve-dist.mjs")} ${join(here, "..", "site", "dist")} ${PORT}`,
        cwd: join(here, ".."),
        url: baseURL,
        timeout: 90_000,
        reuseExistingServer: !process.env.CI,
        stdout: "ignore",
        stderr: "pipe",
      },
});
