/**
 * The set: capabilities collected across pages and copied as one brief.
 *
 * It is one `localStorage` key, so it survives navigation, a language switch
 * and a second tab. Its panel is fixed over the page, so the test that matters
 * most is that it never covers the "Add to set" button it is fed from.
 */
import { expect, test, type Page } from "@playwright/test";

const pill = ".atlas-basket__pill";
const panel = ".atlas-basket__panel";
const addButton = 'atlas-brief-actions button[data-act="basket"]';

async function add(page: Page, route: string) {
  await page.goto(route, { waitUntil: "load" });
  await page.locator(addButton).click();
}

/** True when a click at the centre of `selector` lands on it and not on something above it. */
async function isClickable(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return element.contains(hit);
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/start/", { waitUntil: "load" });
  await page.evaluate(() => localStorage.removeItem("atlas.basket"));
});

test("is hidden while empty and starts collapsed once it has something", async ({ page }) => {
  await page.goto("/surfaces/thread-list/", { waitUntil: "load" });
  await expect(page.locator("atlas-brief-basket")).toBeHidden();
  await page.locator(addButton).click();
  await expect(page.locator(pill)).toHaveText("Set · 1");
  await expect(page.locator(panel)).toBeHidden();
});

test("keeps its contents across pages, languages and tabs", async ({ page, context }) => {
  await add(page, "/surfaces/thread-list/");
  await add(page, "/ru/frontend/navPanel/");
  await expect(page.locator(pill)).toHaveText("Набор · 2");

  const other = await context.newPage();
  await add(other, "/backend/agents/");
  await expect(page.locator(pill)).toHaveText("Набор · 3");

  await page.locator(pill).click();
  await expect(page.locator(`${panel} li`)).toHaveText([
    /The thread list/,
    /app\.slots\.navPanel/,
    /bb\.agents/,
  ]);
});

test("collapses without losing anything, and clears only on a second click", async ({ page }) => {
  await add(page, "/surfaces/thread-list/");
  await page.locator(pill).click();
  await page.locator('[data-act="collapse"]').click();
  await expect(page.locator(pill)).toHaveText("Set · 1");

  await page.locator(pill).click();
  const clear = page.locator('[data-act="clear"]');
  await clear.click();
  await expect(clear).toHaveText("Click again to clear");
  await expect(page.locator(`${panel} li`)).toHaveCount(1);
  await clear.click();
  await expect(page.locator("atlas-brief-basket")).toBeHidden();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("never covers the button that adds to it, open or collapsed", async ({ page }) => {
    for (const route of ["/surfaces/thread-list/", "/frontend/navPanel/", "/backend/agents/"]) {
      await add(page, route);
    }
    for (const open of [false, true]) {
      if (open) await page.locator(pill).click();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      expect(await isClickable(page, addButton), open ? "open" : "collapsed").toBe(true);
    }
  });
});
