/**
 * The site header: the search pill sits inside it, and the zone map is one
 * click away from every page.
 *
 * The pill must not cross a hairline: a `.header` rule meant for Starlight's
 * `<header>` also matches the `div.header` inside it and would draw a second
 * bottom border through the search field.
 */
import { expect, test } from "@playwright/test";

import { siteHeader, VIEWPORTS } from "./contract.ts";

for (const viewport of VIEWPORTS) {
  test.describe(`header at ${viewport.name}px`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("the search pill sits inside the header, and only one hairline is drawn", async ({ page }) => {
      await page.goto("/start/", { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);

      const report = await page.evaluate((selectors) => {
        const frame = document.querySelector(selectors.frame)!;
        const pill = [...document.querySelectorAll(selectors.search)].find(
          (el) => el.getBoundingClientRect().width > 0,
        )!;
        // The defect was an element between the pill and the frame drawing a
        // bottom border across the pill.
        const bordered: string[] = [];
        for (let node = pill.parentElement; node && node !== frame; node = node.parentElement) {
          if (parseFloat(getComputedStyle(node).borderBottomWidth) > 0) {
            bordered.push(`${node.tagName.toLowerCase()}.${String(node.className).split(" ")[0]}`);
          }
        }
        return {
          frame: frame.getBoundingClientRect().toJSON(),
          pill: pill.getBoundingClientRect().toJSON(),
          innerHairlines: bordered,
        };
      }, siteHeader);

      expect(report.pill.top).toBeGreaterThanOrEqual(report.frame.top);
      // The frame's own 1px border is its last pixel row; the pill stays above it.
      expect(report.pill.bottom).toBeLessThanOrEqual(report.frame.bottom - 1);
      expect(
        report.innerHairlines,
        "an element between the search pill and the header draws a bottom border",
      ).toEqual([]);
    });
  });
}

test.describe("zone map link in the header", () => {
  test("is visible on desktop and points at /map/", async ({ page }) => {
    await page.goto("/surfaces/", { waitUntil: "load" });
    const link = page.locator(`${siteHeader.frame} ${siteHeader.mapLink}`);
    await expect(link).toBeVisible();
    await expect(link).toHaveText("Zone map");
    await expect(link).toHaveAttribute("href", "/map/");
    await expect(link).not.toHaveAttribute("aria-current", "page");
  });

  test("marks itself current on /map/", async ({ page }) => {
    await page.goto("/map/", { waitUntil: "load" });
    await expect(page.locator(`${siteHeader.frame} ${siteHeader.mapLink}`)).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("is reachable from the menu", async ({ page }) => {
      await page.goto("/start/", { waitUntil: "load" });
      await page.locator(".sl-menu-button").click();
      const link = page.locator(`#starlight__sidebar ${siteHeader.mapLink}`);
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeVisible();
      await link.click();
      // The island writes its route into the hash on load, so only the path is fixed.
      await expect(page).toHaveURL(/\/map\/(#|$)/);
    });
  });

  test("the start page links to the zone map near the top", async ({ page }) => {
    await page.goto("/start/", { waitUntil: "load" });
    const link = page.locator("main .sl-markdown-content a[href='/map/']").first();
    await expect(link).toBeVisible();
    const firstHeading = await page.locator("main .sl-markdown-content h2").first().boundingBox();
    const box = await link.boundingBox();
    expect(box!.y).toBeLessThan(firstHeading!.y);
  });
});
