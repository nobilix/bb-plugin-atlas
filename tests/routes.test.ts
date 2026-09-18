/**
 * Route-grammar validation for the zone map.
 *
 * `#composer,surface=mention-provider` is a route, not an element id. A generic
 * link checker reports every one of these as a dangling anchor, and every one
 * is a false positive. The answer is not to loosen the anchor check but to
 * route these strings to a parser, and the parser already exists in
 * `@atlas/core`. This file uses it; it does not write a second one.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import {
  formatRoute,
  parseRoute,
  RouteError,
  SCREEN_BY_GROUP,
  SCREENS,
} from "../packages/atlas-core/src/permalink.ts";
import { distDir } from "./lib/paths.ts";
import { distFiles, idsOf, linksOf, pages, type Page } from "./lib/dist.ts";
import { classify, isMapRoute } from "./lib/links.ts";
import { groups, surfaceGroups, surfaces } from "./lib/data.ts";
import { counted } from "./lib/report.ts";

const vocabulary = { surfaceGroups };

let built: Page[];
let files: string[];

beforeAll(async () => {
  files = await distFiles();
  built = await pages();
});

describe("the grammar itself", () => {
  it("parses a route an id-based link checker calls dangling", () => {
    const route = parseRoute("#composer,surface=mention-provider", vocabulary);
    expect(route).toEqual({ screen: "composer", surfaceId: "mention-provider", flags: [] });
  });

  it("accepts a bare `surface=` and derives the screen from the group", () => {
    expect(parseRoute("#surface=cli", vocabulary).screen).toBe("headless");
  });

  it("accepts every flag in the contract", () => {
    const route = parseRoute("#shell,light,nozones", vocabulary);
    expect(route.flags).toEqual(["light", "nozones"]);
  });

  it("rejects an unknown screen and an unknown surface", () => {
    expect(() => parseRoute("#composerr,surface=cli", vocabulary)).toThrow(RouteError);
    expect(() => parseRoute("#composer,surface=no-such-surface", vocabulary)).toThrow(RouteError);
  });

  it("round-trips every surface through its canonical route", () => {
    const broken: string[] = [];
    for (const surface of surfaces) {
      const screen = SCREEN_BY_GROUP[surface.group];
      const canonical = `#${screen},surface=${surface.id}`;
      const parsed = parseRoute(canonical, vocabulary);
      if (formatRoute(parsed) !== canonical) broken.push(`${surface.id}: ${formatRoute(parsed)}`);
    }
    expect(broken).toEqual([]);
  });

  it("covers all 7 groups with all 7 screens", () => {
    expect(new Set(groups.map((g) => SCREEN_BY_GROUP[g.id])).size).toBe(7);
    expect(new Set(SCREENS).size).toBe(7);
  });
});

describe("routes emitted by the built site", () => {
  /** Every zone-map route the build actually links to. */
  function collect(): { where: string; hash: string }[] {
    const out: { where: string; hash: string }[] = [];
    for (const page of built) {
      for (const link of linksOf(page)) {
        const ref = classify(link.href, page.route);
        if (ref.kind === "route") out.push({ where: page.route, hash: ref.hash });
        if (ref.kind === "page" && isMapRoute(ref.path) && ref.hash) {
          out.push({ where: page.route, hash: ref.hash });
        }
      }
    }
    // Markdown twins carry the same links in Markdown syntax; `/ru/map/#…` too.
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const text = readFileSync(join(distDir, file), "utf8");
      for (const match of text.matchAll(/\/map\/#([A-Za-z0-9_,=-]+)/g)) {
        out.push({ where: `/${file}`, hash: match[1] });
      }
    }
    return out;
  }

  it("every emitted route parses", () => {
    // The zone map is a Starlight page, so its hashes are a mixed population:
    // routes in the grammar, plus Starlight's own `#_top` and heading ids. A
    // hash there is valid when it parses as a route *or* names an id on the
    // page; only a hash that is neither is a defect. Treating the whole
    // population as one kind either reports every route as dangling or, the
    // mirror-image mistake, silences real defects.
    const mapPages = built.filter((p) => isMapRoute(p.route));
    expect(mapPages.map((p) => p.route).sort(), "a zone map per locale").toEqual(["/map/", "/ru/map/"]);
    const mapIds = new Set(mapPages.flatMap((p) => [...idsOf(p)]));

    const emitted = collect();
    const bad: string[] = [];
    let routes = 0;
    for (const { where, hash } of emitted) {
      try {
        parseRoute(`#${hash}`, vocabulary);
        routes += 1;
      } catch (error) {
        if (mapIds.has(decodeURIComponent(hash))) continue;
        bad.push(`${where} → #${hash}: ${(error as Error).message}`);
      }
    }
    counted("zone-map routes", routes, bad.length);
    expect(routes, "the build emits zone-map routes").toBeGreaterThan(0);
    expect(bad, `${routes} zone-map routes parsed`).toEqual([]);
  });

  it("no zone-map route is mistaken for an element id", () => {
    // The regression guard. If the classifier ever calls these "anchor", the
    // integrity suite starts reporting every route as dangling.
    const asAnchors = built
      .flatMap((page) => linksOf(page).map((l) => classify(l.href, page.route)))
      .filter((ref) => ref.kind === "anchor" && /[,=]/.test(ref.hash));
    expect(asAnchors).toEqual([]);
  });
});
