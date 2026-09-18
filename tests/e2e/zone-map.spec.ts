/**
 * The zone map, all seven screens.
 *
 * Each assertion is a defect that is easy to miss by eye: a badge off the
 * stage, a badge too small to hit, two badges on top of each other, two
 * `navblock`s visible at once, two fixture states visible at once, details
 * parked on top of the very zone they describe. A zone's details open in the
 * legend's column, and the last group of tests pins that behaviour down.
 */
import { expect, test, type Page } from "@playwright/test";

import { zoneMap } from "./contract.ts";
import { groupById, groups, surfaces } from "../lib/data.ts";

/** Screen key → how many numbered badges belong on it, read off `data/`. */
const SCREEN_BY_GROUP: Record<string, string> = {
  "app-shell": "shell",
  "command-palette": "palette",
  composer: "composer",
  home: "home",
  settings: "settings",
  extensions: "plugins",
  headless: "headless",
};

const EXPECTED_BADGES = new Map<string, number>(
  groups.map((group) => [
    SCREEN_BY_GROUP[group.id],
    // Headless is a capability grid, not a picture of a window: it carries no
    // spatial badges at all.
    group.fixtureKind === "spatial"
      ? surfaces.filter((surface) => surface.group === group.id).length
      : 0,
  ]),
);

/*
 * Measured on the badge's own layout box, not on `getBoundingClientRect`.
 *
 * The stage is a 1440px-wide picture of a desktop window scaled to fit, so at a
 * 1440 viewport every badge renders at 0.725 of its size and a 20px badge
 * measures 15. That is a fact about the viewport, not about the component, and
 * asserting on it would make the rule "the window must be wide enough". The
 * invariant is that a badge is never laid out as a 6px dot.
 */
const MIN_BADGE_PX = 18;

async function openMap(page: Page, hash = ""): Promise<void> {
  await page.goto(`/map/${hash}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

test.describe("zone map", () => {
  test("the expected badge map is derived from data, not typed", () => {
    expect([...EXPECTED_BADGES.entries()].sort()).toEqual(
      [
        ["composer", 7],
        ["headless", 0],
        ["home", 2],
        ["palette", 1],
        ["plugins", 1],
        ["settings", 2],
        ["shell", 16],
      ].sort(),
    );
    expect(groups).toHaveLength(7);
    expect(surfaces).toHaveLength(46);
    expect(groupById.get("headless")?.fixtureKind).toBe("capability-grid");
  });

  for (const [screen, expectedBadges] of EXPECTED_BADGES) {
    test(`${screen}: badges, navblock and fixture state`, async ({ page }) => {
      await openMap(page, `#${screen}`);

      const report = await page.evaluate<
        {
          badges: { text: string; w: number; h: number; x: number; y: number; ow: number; oh: number }[];
          stage: { w: number; h: number };
          overlaps: string[];
          navblocks: number;
          fixtures: Record<string, { total: number; visible: number }>;
        },
        { selectors: typeof zoneMap; screen: string }
      >(({ selectors }) => {
        const visible = (el: Element) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            Number(style.opacity) > 0.05
          );
        };
        const stageEl = document.querySelector(selectors.stage);
        const stageRect = stageEl?.getBoundingClientRect() ?? new DOMRect();
        const badgeEls = [...document.querySelectorAll(selectors.badge)].filter(visible);
        const badges = badgeEls.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            text: (el.textContent ?? "").trim(),
            w: r.width,
            h: r.height,
            x: r.left - stageRect.left,
            y: r.top - stageRect.top,
            ow: (el as HTMLElement).offsetWidth,
            oh: (el as HTMLElement).offsetHeight,
          };
        });
        const overlaps: string[] = [];
        for (let i = 0; i < badgeEls.length; i += 1) {
          for (let j = i + 1; j < badgeEls.length; j += 1) {
            const a = badgeEls[i].getBoundingClientRect();
            const b = badgeEls[j].getBoundingClientRect();
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) {
              overlaps.push(`${badges[i].text} over ${badges[j].text}`);
            }
          }
        }
        /*
         * `data-fx` is `"<fixture>:<state>"`. A screen carries several fixtures
         * and each one has several states, so the invariant is per fixture: two
         * states of the same fixture on screen at once is the defect. A fixture
         * showing none of its states is legitimate -- the command palette's
         * "triggered" state is off until something triggers it.
         */
        const fixtures: Record<string, { total: number; visible: number }> = {};
        for (const el of document.querySelectorAll(selectors.fixture)) {
          const [group] = (el.getAttribute("data-fx") ?? "").split(":");
          if (!group) continue;
          fixtures[group] ??= { total: 0, visible: 0 };
          fixtures[group].total += 1;
          if (visible(el)) fixtures[group].visible += 1;
        }

        return {
          badges,
          stage: { w: stageRect.width, h: stageRect.height },
          overlaps,
          navblocks: [...document.querySelectorAll(selectors.navblock)].filter(visible).length,
          fixtures,
        };
      }, { selectors: zoneMap, screen });

      expect(report.badges, `badge count on ${screen}`).toHaveLength(expectedBadges);

      const offStage = report.badges
        .filter(
          (b) =>
            b.x < -2 || b.y < -2 || b.x + b.w > report.stage.w + 2 || b.y + b.h > report.stage.h + 2,
        )
        .map(
          (b) =>
            `badge ${b.text} at ${Math.round(b.x)},${Math.round(b.y)} size ${Math.round(b.w)}×` +
            `${Math.round(b.h)} in a ${Math.round(report.stage.w)}×${Math.round(report.stage.h)} stage ` +
            `(overhangs right by ${Math.max(0, Math.round(b.x + b.w - report.stage.w))}px, ` +
            `bottom by ${Math.max(0, Math.round(b.y + b.h - report.stage.h))}px)`,
        );
      expect(offStage, `badges outside the stage on ${screen}`).toEqual([]);

      const tooSmall = report.badges.filter((b) => b.ow < MIN_BADGE_PX || b.oh < MIN_BADGE_PX);
      expect(
        tooSmall.map((b) => `${b.text} laid out at ${b.ow}×${b.oh}`),
        `badges under ${MIN_BADGE_PX}px on ${screen}`,
      ).toEqual([]);

      expect(report.overlaps, `overlapping badges on ${screen}`).toEqual([]);

      if (expectedBadges > 0) {
        expect(report.navblocks, `visible navblocks on ${screen}`).toBe(1);
        const doubled = Object.entries(report.fixtures)
          .filter(([, counts]) => counts.visible > 1)
          .map(([group, counts]) => `${group}: ${counts.visible} of ${counts.total} states visible`);
        expect(doubled, `more than one state of a fixture visible on ${screen}`).toEqual([]);
      }
    });
  }

  test("details open in the legend column and never cover the stage", async ({ page }) => {
    await openMap(page);

    const offenders: string[] = [];
    for (const surface of surfaces) {
      await page.goto(`/map/#surface=${surface.id}`, { waitUntil: "load" });
      const details = page.locator(zoneMap.details);
      await expect(details, `details for ${surface.id}`).toHaveAttribute("data-atlas-details", surface.id);
      const covers = await page.evaluate((selectors) => {
        const a = document.querySelector(selectors.details)!.getBoundingClientRect();
        const b = document.querySelector(selectors.stage)!.getBoundingClientRect();
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        return w > 0 && h > 0;
      }, zoneMap);
      if (covers) offenders.push(surface.id);
    }
    expect(offenders).toEqual([]);
  });

  test("clicking a zone opens its details in place, highlighted; another zone switches", async ({
    page,
  }) => {
    await openMap(page, "#shell");

    const legend = page.locator(zoneMap.legend);
    const legendBox = await legend.boundingBox();
    const stageBox = await page.locator(zoneMap.stage).boundingBox();
    await expect(legend.getByRole("heading", { name: "Zones on this screen" })).toBeVisible();
    await expect(page.locator(zoneMap.details)).toHaveCount(0);

    await page.locator('.badge[data-id="thread-list"]').click();
    const details = page.locator(zoneMap.details);
    await expect(details).toHaveAttribute("data-atlas-details", "thread-list");
    // In place of the list, inside the same column; nothing floats.
    await expect(legend.getByRole("heading", { name: "Zones on this screen" })).toHaveCount(0);
    expect(await details.evaluate((el) => el.closest("aside.legend") !== null)).toBe(true);
    expect(await details.evaluate((el) => getComputedStyle(el).position)).toBe("static");
    // Opening moves nothing: the stage and the column stay where they were.
    expect(await page.locator(zoneMap.stage).boundingBox()).toEqual(stageBox);
    expect((await legend.boundingBox())?.x).toBe(legendBox?.x);
    // Focus lands on the details heading; the zone is highlighted and the rest fade.
    await expect(details.getByRole("heading", { level: 2 })).toBeFocused();
    await expect(page.locator('.zone[data-id="thread-list"]')).toHaveClass(/is-solo/);
    await expect(page.locator(zoneMap.zonesLayer)).toHaveClass(/solo/);
    await expect(page).toHaveURL(/#shell,.*surface=thread-list$/);

    await page.locator('.badge[data-id="sidebar-footer"]').click();
    await expect(details).toHaveAttribute("data-atlas-details", "sidebar-footer");
    await expect(page.locator('.zone[data-id="sidebar-footer"]')).toHaveClass(/is-solo/);
    await expect(page.locator('.zone[data-id="thread-list"]')).not.toHaveClass(/is-solo/);

    // Back returns to the previous zone's details.
    await page.goBack();
    await expect(details).toHaveAttribute("data-atlas-details", "thread-list");
  });

  test("the close control and Esc return to the list and clear the highlight", async ({ page }) => {
    await openMap(page, "#shell");

    const badge = page.locator('.badge[data-id="message-actions"]');
    await badge.click();
    await expect(page.locator(zoneMap.details)).toHaveAttribute("data-atlas-details", "message-actions");
    await page.locator(zoneMap.closeDetails).click();
    await expect(page.locator(zoneMap.details)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Zones on this screen" })).toBeVisible();
    await expect(page.locator(".zone.is-solo")).toHaveCount(0);
    await expect(page.locator(zoneMap.zonesLayer)).not.toHaveClass(/solo/);
    await expect(badge, "focus returns to the zone").toBeFocused();
    expect(new URL(page.url()).hash).not.toContain("surface=");

    await badge.press("Enter");
    await expect(page.locator(zoneMap.details)).toHaveAttribute("data-atlas-details", "message-actions");
    await page.keyboard.press("Escape");
    await expect(page.locator(zoneMap.details)).toHaveCount(0);
    await expect(page.locator(".zone.is-solo")).toHaveCount(0);
    await expect(badge).toBeFocused();
  });

  test("a deep link opens the right details, on the right screen", async ({ page }) => {
    await openMap(page, "#composer,surface=thread-row-status");
    await expect(page.locator(zoneMap.details)).toHaveAttribute("data-atlas-details", "thread-row-status");
    await expect(page.locator('.screen[data-screen="shell"]')).toHaveClass(/is-active/);
    await expect(page.locator('.zone[data-id="thread-row-status"]')).toHaveClass(/is-solo/);
  });

  test("surface cross-links in upstream text are links, never raw Markdown", async ({ page }) => {
    await openMap(page);

    // Every surface whose summary or bullets carry a `[text](id)` cross-link.
    const linked = surfaces.filter((s) =>
      [s.summary, ...s.bullets].some((line) => /\]\([a-z0-9-]+\)/.test(line)),
    );
    expect(linked.length).toBeGreaterThan(0);
    for (const surface of linked) {
      await page.goto(`/map/#surface=${surface.id}`, { waitUntil: "load" });
      const details = page.locator(zoneMap.details);
      await expect(details).toHaveAttribute("data-atlas-details", surface.id);
      expect(await details.innerText(), `raw Markdown in ${surface.id}`).not.toContain("](");
      await expect(details.locator("a.xlink").first()).toBeVisible();
    }

    // Following one switches the details to that surface.
    await page.goto("/map/#surface=content-scripts", { waitUntil: "load" });
    await page.locator(zoneMap.details).getByRole("link", { name: "thread row status" }).click();
    await expect(page.locator(zoneMap.details)).toHaveAttribute("data-atlas-details", "thread-row-status");
  });

  test("a one-row toolbar with no text field", async ({ page }) => {
    await openMap(page, "#shell");

    const toolbar = page.locator(zoneMap.toolbar);
    await expect(toolbar).toBeVisible();
    await expect(toolbar.locator("input")).toHaveCount(0);
    // One row: every control shares the toolbar's single line.
    const rows = await toolbar.evaluate((el) => {
      const tops = [...el.children]
        .filter((child) => getComputedStyle(child).display !== "none")
        .map((child) => {
          const box = child.getBoundingClientRect();
          return box.top + box.height / 2;
        });
      return new Set(tops.map((t) => Math.round(t / 8))).size;
    });
    expect(rows).toBe(1);
  });

  test("nothing above the map but a visually hidden title", async ({ page }) => {
    await openMap(page);

    await expect(page).toHaveTitle(/UI zone map/);
    // The mockup draws bb's own headings; the page's is Starlight's `#_top`.
    const h1 = page.locator("main h1#_top");
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText("UI zone map");
    const box = await h1.boundingBox();
    expect(box === null || (box.width <= 1 && box.height <= 1), "the <h1> is visible").toBe(true);
    await expect(page.locator("[data-atlas-version-stamp]")).toHaveCount(0);

    // The toolbar is the first thing under the site header.
    const header = await page.locator("header.header").boundingBox();
    const toolbar = await page.locator(zoneMap.toolbar).boundingBox();
    expect(toolbar!.y - (header!.y + header!.height)).toBeLessThan(40);
  });
});
