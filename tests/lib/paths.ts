/**
 * Where everything lives. One place, so a test never guesses a path.
 */
import { fileURLToPath } from "node:url";
import { join } from "node:path";

export const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

/**
 * The path the site was built for, from the same `SITE_URL` the build read:
 * `''` at the root, `/bb-plugin-atlas` when built for a subdirectory. Under a
 * base every internal link in the build starts with it; the files in `dist/`
 * do not.
 */
export const SITE_BASE = new URL(process.env.SITE_URL || "http://localhost:4321").pathname.replace(/\/+$/, "");
export const distDir = join(repoRoot, "site", "dist");
export const dataDir = join(repoRoot, "data");
export const docsInternalDir = join(repoRoot, "docs-internal");
export const siteSrcDir = join(repoRoot, "site", "src");

/**
 * The locales besides English, each served under `/<locale>/`. English is the
 * root locale and has no prefix. Mirrors `site/src/i18n/routes.ts`.
 */
export const OTHER_LOCALES = ["ru"] as const;

const LOCALE_PREFIX = new RegExp(`^/(${OTHER_LOCALES.join("|")})(?=/|$)`);

/** The locale a route is in: `/ru/start/` is `ru`, `/start/` is `en`. */
export function localeOf(route: string): string {
  return LOCALE_PREFIX.exec(route)?.[1] ?? "en";
}

/** A route with its locale prefix removed: `/ru/start/` → `/start/`. */
export function withoutLocale(route: string): string {
  return route.replace(LOCALE_PREFIX, "") || "/";
}

/** The agent corpus: English-only by design, linked as is from every locale. */
export const ENGLISH_ONLY = new Set(["/llms.txt", "/llms-full.txt", "/llms-small.txt", "/briefs.json"]);

/**
 * Routes whose pages are generated from `data/` and therefore carry the
 * version stamp, in any locale. Prose routes do not.
 */
export const GENERATED_PREFIXES = [
  "surfaces/",
  "frontend/",
  "backend/",
  "plugins/",
  "changelog/",
  "map/",
] as const;

export function isGeneratedRoute(route: string): boolean {
  const body = withoutLocale(route).replace(/^\//, "");
  return GENERATED_PREFIXES.some((prefix) => body === prefix || body.startsWith(prefix));
}
