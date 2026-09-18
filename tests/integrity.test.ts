/**
 * Integrity of the built site.
 *
 * Runs over `site/dist`, offline. Nothing here talks to GitHub: permalinks are
 * checked against a local clone, because the fragment `#L42` never reaches
 * GitHub's server and a link to a line past the end of a file returns 200.
 *
 * Requires a build: `pnpm build`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { distDir, ENGLISH_ONLY, isGeneratedRoute, localeOf, OTHER_LOCALES, withoutLocale } from "./lib/paths.ts";
import { distFiles, idsOf, linksOf, pages, type Page } from "./lib/dist.ts";
import { classify, fileForRoute, isMapRoute, permalinksInText, type Reference } from "./lib/links.ts";
import { findClone, hasCommit, lineCount, MissingCloneError } from "./lib/upstream-git.ts";
import { pin, symbolNames } from "./lib/data.ts";
import { counted } from "./lib/report.ts";

let built: Page[];
let files: Set<string>;

beforeAll(async () => {
  const all = await distFiles();
  if (!all.some((f) => f === "index.html")) {
    throw new Error(
      `No build found in ${distDir}. Run \`pnpm --filter site build\` before the integrity suite.`,
    );
  }
  files = new Set(all);
  built = await pages();
});

describe("the build exists", () => {
  it("has pages and Markdown twins", () => {
    expect(built.length).toBeGreaterThan(50);
    expect([...files].filter((f) => f.endsWith(".md")).length).toBeGreaterThan(50);
  });
});

describe("internal anchors", () => {
  it("every same-page hash resolves to an id on that page", async () => {
    const dangling: string[] = [];
    let checked = 0;
    for (const page of built) {
      const ids = idsOf(page);
      for (const link of linksOf(page)) {
        const ref = classify(link.href, page.route);
        if (ref.kind !== "anchor") continue;
        checked += 1;
        const target = decodeURIComponent(ref.hash);
        if (!ids.has(target)) dangling.push(`${page.route} → #${ref.hash} ("${link.label}")`);
      }
    }
    counted("internal anchors", checked, dangling.length);
    expect(checked).toBeGreaterThan(400);
    expect(dangling, `${checked} internal anchors checked`).toEqual([]);
  });
});

describe("cross-page links", () => {
  it("every relative link resolves to a built file", async () => {
    const broken: string[] = [];
    let checked = 0;
    for (const page of built) {
      for (const link of linksOf(page)) {
        const ref = classify(link.href, page.route);
        if (ref.kind !== "page") continue;
        checked += 1;
        if (!fileForRoute(ref.path, files)) {
          broken.push(`${page.route} → ${link.href} ("${link.label}")`);
        }
      }
    }
    counted("cross-page links", checked, broken.length);
    expect(checked).toBeGreaterThan(100);
    expect(broken, `${checked} cross-page links checked`).toEqual([]);
  });

  it("every cross-page hash resolves on the target page", async () => {
    const byRoute = new Map(built.map((p) => [p.route, p] as const));
    const idCache = new Map<string, Set<string>>();
    const dangling: string[] = [];
    let checked = 0;
    for (const page of built) {
      for (const link of linksOf(page)) {
        const ref = classify(link.href, page.route);
        if (ref.kind !== "page" || !ref.hash) continue;
        // A hash on the zone map is a route, not an id. See lib/links.ts.
        if (isMapRoute(ref.path)) continue;
        const target = byRoute.get(ref.path.endsWith("/") ? ref.path : `${ref.path}/`) ??
          byRoute.get(ref.path);
        if (!target) continue; // already reported by the previous test
        checked += 1;
        let ids = idCache.get(target.route);
        if (!ids) {
          ids = idsOf(target);
          idCache.set(target.route, ids);
        }
        if (!ids.has(decodeURIComponent(ref.hash))) {
          dangling.push(`${page.route} → ${link.href}`);
        }
      }
    }
    counted("cross-page hashes", checked, dangling.length);
    expect(dangling, `${checked} cross-page hashes checked`).toEqual([]);
  });
});

describe("permalinks", () => {
  const clone = findClone();

  it("a clone of get-bb/bb is available and carries the pinned commit", () => {
    if (!clone) throw new MissingCloneError();
    expect(hasCommit(clone, pin.commit), `${clone} does not have ${pin.commit}`).toBe(true);
  });

  it("every permalink points at the pinned commit and a line that exists", async () => {
    if (!clone) throw new MissingCloneError();

    interface Found {
      where: string;
      url: string;
      commit: string;
      path: string;
      line: number | null;
    }
    const found: Found[] = [];

    // HTML: attributes only. A template constant inside a `<script>` body
    // looks like a failing permalink to a text scan.
    for (const page of built) {
      for (const link of linksOf(page)) {
        const ref = classify(link.href, page.route);
        if (ref.kind === "permalink") found.push({ where: page.route, ...ref });
      }
    }

    // Markdown twins and the brief corpus have no script bodies to confuse.
    for (const file of files) {
      if (!file.endsWith(".md") && !file.endsWith(".json")) continue;
      if (file.startsWith("pagefind/")) continue;
      const text = readFileSync(join(distDir, file), "utf8");
      for (const hit of permalinksInText(text)) found.push({ where: `/${file}`, ...hit });
    }

    expect(found.length).toBeGreaterThan(100);

    const wrongCommit = found.filter((f) => f.commit !== pin.commit);
    expect(
      wrongCommit.slice(0, 10).map((f) => `${f.where}: ${f.url}`),
      `${wrongCommit.length} permalinks do not use the pinned commit ${pin.commit}`,
    ).toEqual([]);

    const missingPath: string[] = [];
    const pastEnd: string[] = [];
    for (const f of found) {
      const lines = lineCount(clone, pin.commit, f.path);
      if (lines === null) {
        missingPath.push(`${f.where}: ${f.path} does not exist at ${pin.commit.slice(0, 7)}`);
        continue;
      }
      if (f.line !== null && (f.line < 1 || f.line > lines)) {
        pastEnd.push(`${f.where}: ${f.path}#L${f.line} — the file has ${lines} lines`);
      }
    }
    expect([...new Set(missingPath)]).toEqual([]);
    counted(
      "permalinks (git cat-file)",
      found.length,
      new Set([...missingPath, ...pastEnd]).size,
    );
    expect([...new Set(pastEnd)], `${found.length} permalinks verified with git cat-file`).toEqual(
      [],
    );
  });
});

describe("symbols", () => {
  it("every rendered symbol name exists in data/symbols.json", async () => {
    const unknown: string[] = [];
    let checked = 0;
    for (const page of built) {
      const chips = [
        ...page.content.querySelectorAll(".atlas-symbols code"),
        ...page.content.querySelectorAll("[data-atlas-symbol]"),
      ];
      for (const chip of chips) {
        const name = chip.textContent.trim();
        if (!name) continue;
        checked += 1;
        if (!symbolNames.has(name)) unknown.push(`${page.route}: ${name}`);
      }
      // Anything rendered as a pinned permalink is a claim about a symbol too.
      for (const anchor of page.content.querySelectorAll("a[href*='/blob/']")) {
        const code = anchor.querySelector("code");
        if (!code) continue;
        const name = code.textContent.trim();
        if (!name || !/^[A-Za-z_$][\w$.]*$/.test(name)) continue;
        checked += 1;
        if (!symbolNames.has(name)) unknown.push(`${page.route}: ${name}`);
      }
    }
    counted("rendered symbols", checked, new Set(unknown).size);
    expect(checked).toBeGreaterThan(100);
    expect([...new Set(unknown)], `${checked} rendered symbols checked`).toEqual([]);
  });
});

describe("version stamp", () => {
  /*
   * `/map/` is generated but carries no stamp: the map is short of vertical
   * space and its toolbar already names the page. Each surface's reference
   * page, one click away, carries the stamp.
   */
  const UNSTAMPED = new Set(["/map/", "/ru/map/"]);

  it("is on every generated page and carries the pin", async () => {
    const generated = built.filter((p) => isGeneratedRoute(p.route) && !UNSTAMPED.has(p.route));
    expect(generated.length).toBeGreaterThan(90);

    const missing: string[] = [];
    const wrong: string[] = [];
    for (const page of generated) {
      const stamp = page.content.querySelector("[data-atlas-version-stamp]");
      if (!stamp) {
        missing.push(page.route);
        continue;
      }
      const text = stamp.textContent.replace(/\s+/g, " ");
      for (const expected of [pin.bbVersion, pin.sdkVersion, pin.commit.slice(0, 7)]) {
        if (!text.includes(expected)) wrong.push(`${page.route}: stamp lacks ${expected}`);
      }
    }
    counted("version stamps on generated pages", generated.length, missing.length + wrong.length);
    expect(missing).toEqual([]);
    expect(wrong).toEqual([]);
  });

  it("no prose page pretends to be generated", async () => {
    const stray = built
      .filter((p) => !isGeneratedRoute(p.route))
      .filter((p) => p.content.querySelector("[data-atlas-version-stamp]"))
      .map((p) => p.route);
    // Prose pages are allowed to carry it; this records the set rather than
    // forbidding it, so a deliberate change is visible in the diff.
    expect(stray).toEqual([]);
  });

  it("is not on /map/ in any locale", () => {
    for (const route of UNSTAMPED) {
      const map = built.find((p) => p.route === route);
      expect(map, `no ${route} page in the build`).toBeDefined();
      expect(map!.content.querySelector("[data-atlas-version-stamp]")).toBeNull();
    }
  });
});

describe("locales", () => {
  /*
   * English is the root locale; Russian mirrors it under `/ru/`. The language
   * picker sends a reader to the same path in the other locale, so a route
   * that exists in one and not the other is a dead end one click away.
   */
  const routes = () => built.map((p) => p.route).filter((route) => route !== "/404.html");

  it("every page exists in every locale", () => {
    const all = new Set(routes());
    const english = routes().filter((route) => localeOf(route) === "en");
    const missing: string[] = [];
    for (const locale of OTHER_LOCALES) {
      const localized = routes().filter((route) => localeOf(route) === locale);
      for (const route of english) {
        if (!all.has(`/${locale}${route}`)) missing.push(`${route} has no /${locale}${route}`);
      }
      for (const route of localized) {
        if (!all.has(withoutLocale(route))) missing.push(`${route} has no ${withoutLocale(route)}`);
      }
      expect(localized.length).toBe(english.length);
    }
    counted("routes paired across locales", all.size, missing.length);
    expect(missing).toEqual([]);
  });

  it("every page has a Markdown twin", () => {
    // `/` is `/index.md`, `/ru/` is `/ru.md`, `/a/b/` is `/a/b.md`.
    const twin = (route: string) => (route === "/" ? "index.md" : `${route.slice(1, -1)}.md`);
    const missing = routes()
      .filter((route) => !files.has(twin(route)))
      .map((route) => `${route} → /${twin(route)}`);
    counted("Markdown twins", routes().length, missing.length);
    expect(missing).toEqual([]);
  });

  it("a page's links stay in its own locale", () => {
    const strays: string[] = [];
    let checked = 0;
    for (const page of built) {
      if (page.route === "/404.html") continue;
      const locale = localeOf(page.route);
      for (const link of linksOf(page)) {
        const ref = classify(link.href, page.route);
        if (ref.kind !== "page" || ENGLISH_ONLY.has(ref.path)) continue;
        checked += 1;
        if (localeOf(ref.path) !== locale) {
          strays.push(`${page.route} → ${link.href} ("${link.label}")`);
        }
      }
    }
    counted("internal links checked for locale", checked, strays.length);
    expect(strays.slice(0, 20)).toEqual([]);
  });

  it("`<html lang>` names the locale and the alternates name every locale", () => {
    const wrong: string[] = [];
    for (const page of built) {
      if (page.route === "/404.html") continue;
      const lang = page.content.querySelector("html")?.getAttribute("lang");
      if (lang !== localeOf(page.route)) wrong.push(`${page.route}: lang="${lang}"`);
      const base = withoutLocale(page.route);
      const alternates = new Map(
        page.content
          .querySelectorAll('link[rel="alternate"][hreflang]')
          .map((el) => [el.getAttribute("hreflang"), new URL(el.getAttribute("href") ?? "").pathname]),
      );
      for (const locale of ["en", ...OTHER_LOCALES]) {
        const expected = locale === "en" ? base : `/${locale}${base}`;
        if (alternates.get(locale) !== expected) {
          wrong.push(`${page.route}: hreflang="${locale}" is ${alternates.get(locale)}, not ${expected}`);
        }
      }
    }
    expect(wrong.slice(0, 20)).toEqual([]);
  });
});
