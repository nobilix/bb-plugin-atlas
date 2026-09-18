/**
 * The Russian locale: English at the root, Russian under `/ru/`, and
 * Starlight's language picker as the switch between them.
 *
 * What a reader relies on, each asserted here: the picker is where the other
 * header controls are, on a phone too; it lands on the same page in the other
 * language, generated pages included; the Russian zone map speaks Russian and
 * behaves like the English one; and search stays inside the reader's language.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

import { repoRoot } from "../lib/paths.ts";
import { siteHeader, zoneMap } from "./contract.ts";

const overlay = JSON.parse(
  readFileSync(join(repoRoot, "translations", "ru", "surfaces.json"), "utf8"),
) as { surfaces: Record<string, { title: string; summary: string }> };

const picker = "starlight-lang-select select";

async function switchTo(page: Page, scope: string, label: "English" | "Русский") {
  const select = page.locator(`${scope} ${picker}`);
  await expect(select).toBeVisible();
  const from = new URL(page.url()).pathname;
  await Promise.all([
    page.waitForURL((url) => url.pathname !== from, { waitUntil: "load" }),
    select.selectOption({ label }),
  ]);
}

test.describe("language picker", () => {
  for (const [english, russian] of [
    ["/start/", "/ru/start/"],
    ["/surfaces/message-directives/", "/ru/surfaces/message-directives/"],
    ["/frontend/", "/ru/frontend/"],
  ] as const) {
    test(`switches ${english} ↔ ${russian}`, async ({ page }) => {
      await page.goto(english, { waitUntil: "load" });
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await switchTo(page, siteHeader.frame, "Русский");
      expect(new URL(page.url()).pathname).toBe(russian);
      await expect(page.locator("html")).toHaveAttribute("lang", "ru");

      await switchTo(page, siteHeader.frame, "English");
      expect(new URL(page.url()).pathname).toBe(english);
    });
  }

  test("sits in the header beside the theme select, styled like it", async ({ page }) => {
    await page.goto("/ru/start/", { waitUntil: "load" });
    const lang = page.locator(`${siteHeader.frame} ${picker}`);
    const theme = page.locator(`${siteHeader.frame} starlight-theme-select select`);
    await expect(lang).toBeVisible();
    await expect(lang.locator("option[selected]")).toHaveText("Русский");
    const [a, b] = await Promise.all([lang.boundingBox(), theme.boundingBox()]);
    expect(Math.abs(a!.y + a!.height / 2 - (b!.y + b!.height / 2))).toBeLessThan(4);
    const style = (locator: typeof lang) =>
      locator.evaluate((el) => {
        const s = getComputedStyle(el);
        return { radius: s.borderTopLeftRadius, color: s.color, background: s.backgroundColor };
      });
    expect(await style(lang)).toEqual(await style(theme));
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("is in the menu and switches the page", async ({ page }) => {
      await page.goto("/ru/surfaces/", { waitUntil: "load" });
      await page.locator(".sl-menu-button").click();
      const menu = "#starlight__sidebar";
      await page.locator(`${menu} ${picker}`).scrollIntoViewIfNeeded();
      await switchTo(page, menu, "English");
      expect(new URL(page.url()).pathname).toBe("/surfaces/");
    });
  });
});

test.describe("Russian chrome", () => {
  test("the header link and a generated page speak Russian", async ({ page }) => {
    await page.goto("/ru/surfaces/thread-list/", { waitUntil: "load" });
    const link = page.locator(`${siteHeader.frame} ${siteHeader.mapLink}`);
    await expect(link).toHaveText("Макет зон");
    await expect(link).toHaveAttribute("href", "/ru/map/");

    await expect(page.locator("main h1")).toHaveText(overlay.surfaces["thread-list"].title);
    await expect(page.locator(".atlas-maplink")).toHaveText("Показать на макете зон");
    await expect(page.locator(".atlas-maplink")).toHaveAttribute(
      "href",
      "/ru/map/#shell,surface=thread-list",
    );
    await expect(page.getByRole("button", { name: "Бриф для агента" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Скопировать страницу как Markdown" })).toBeVisible();
  });
});

test.describe("/ru/map/", () => {
  test("details open in the right-hand column in Russian, and Esc closes them", async ({ page }) => {
    await page.goto("/ru/map/#shell", { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const legend = page.locator(zoneMap.legend);
    await expect(legend.getByRole("heading", { name: "Зоны на этом экране" })).toBeVisible();
    await expect(page.locator(zoneMap.toolbar).getByRole("button", { name: /Скрыть зоны/ })).toBeVisible();

    const legendBox = await legend.boundingBox();
    const stageBox = await page.locator(zoneMap.stage).boundingBox();
    expect(legendBox!.x).toBeGreaterThan(stageBox!.x + stageBox!.width - 1);

    const badge = page.locator('.badge[data-id="thread-list"]');
    await badge.click();
    const details = page.locator(zoneMap.details);
    await expect(details).toHaveAttribute("data-atlas-details", "thread-list");
    expect(await details.evaluate((el) => el.closest("aside.legend") !== null)).toBe(true);
    await expect(details.getByRole("heading", { level: 2 })).toHaveText(
      overlay.surfaces["thread-list"].title,
    );
    await expect(details.getByRole("button", { name: "Бриф для агента" })).toBeVisible();
    await expect(details.getByText("Символы SDK")).toBeVisible();
    await expect(details.getByRole("link", { name: "Открыть справочную страницу" })).toHaveAttribute(
      "href",
      "/ru/surfaces/thread-list/",
    );
    await expect(page).toHaveURL(/\/ru\/map\/#shell,.*surface=thread-list$/);

    await page.keyboard.press("Escape");
    await expect(details).toHaveCount(0);
    await expect(legend.getByRole("heading", { name: "Зоны на этом экране" })).toBeVisible();
    await expect(badge).toBeFocused();
  });

  test("a cross-link in surface text stays on the Russian map", async ({ page }) => {
    await page.goto("/ru/map/#surface=content-scripts", { waitUntil: "load" });
    const details = page.locator(zoneMap.details);
    await expect(details).toHaveAttribute("data-atlas-details", "content-scripts");
    await details.locator("a.xlink").first().click();
    await expect(details).not.toHaveAttribute("data-atlas-details", "content-scripts");
    expect(new URL(page.url()).pathname).toBe("/ru/map/");
  });
});

test.describe("search stays in the reader's language", () => {
  async function search(page: Page, route: string, query: string): Promise<string[]> {
    await page.goto(route, { waitUntil: "load" });
    await page.locator("site-search button[data-open-modal]").click();
    const input = page.locator("site-search dialog input");
    await input.fill(query);
    const results = page.locator("site-search .pagefind-ui__result-link");
    await expect(results.first()).toBeVisible({ timeout: 10_000 });
    return results.evaluateAll((links) =>
      links.map((a) => new URL((a as HTMLAnchorElement).href).pathname),
    );
  }

  test("a Russian query on a Russian page finds Russian pages only", async ({ page }) => {
    const found = await search(page, "/ru/start/", "поверхность");
    expect(found.length).toBeGreaterThan(0);
    expect(found.filter((path) => !path.startsWith("/ru/"))).toEqual([]);
  });

  test("an English word on a Russian page still finds Russian pages only", async ({ page }) => {
    const found = await search(page, "/ru/start/", "definePluginApp");
    expect(found.filter((path) => !path.startsWith("/ru/"))).toEqual([]);
  });

  test("an English query on an English page finds no Russian page", async ({ page }) => {
    const found = await search(page, "/start/", "surface");
    expect(found.length).toBeGreaterThan(0);
    expect(found.filter((path) => path.startsWith("/ru/"))).toEqual([]);
  });
});
