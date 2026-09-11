/**
 * Unit tests for `@atlas/core`.
 *
 * These read `data/` because that is what the site reads: a brief that renders
 * from hand-written fixtures proves nothing about the brief the site ships.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { allAnnotations, annotationFor, annotationsOfKind } from "./annotations.ts";
import { bbMention, createBriefs, UnknownBriefError } from "./briefs.ts";
import {
  formatRoute,
  MissingPinError,
  parseRoute,
  permalink,
  RouteError,
  SCREEN_BY_GROUP,
} from "./permalink.ts";
import { RULES } from "./rules.ts";
import { RulesFileSchema, SurfacesFileSchema, SymbolsFileSchema } from "./schema.ts";

const repoRoot = new URL("../../../", import.meta.url);
const read = (name: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(name, repoRoot)), "utf8"));

const pinFile = read("pin.json");
const surfacesFile = SurfacesFileSchema.parse(read("data/surfaces.json"));
const symbolsFile = SymbolsFileSchema.parse(read("data/symbols.json"));
const rulesFile = RulesFileSchema.parse(read("data/rules.json"));
const slotsFile = read("data/slots.json") as { slots: { name: string }[] };

const pin = {
  ...pinFile.upstream,
  permalinkBase: pinFile.permalinkBase,
};

const briefs = createBriefs({
  pin,
  groups: surfacesFile.groups,
  surfaces: surfacesFile.surfaces,
  symbols: symbolsFile.symbols,
});

describe("permalink builder", () => {
  it("builds a pinned URL from a path and a line", () => {
    expect(permalink(pin, "packages/plugin-sdk/src/app-contract.ts", 1103)).toBe(
      "https://github.com/get-bb/bb/blob/e865697f56bea89f3413dd4cc7fae964850d20a0/packages/plugin-sdk/src/app-contract.ts#L1103",
    );
  });

  it("omits the fragment when there is no line", () => {
    expect(permalink(pin, "CHANGELOG.md")).not.toContain("#L");
  });

  it("refuses to build one without a pin", () => {
    // @ts-expect-error — the whole point is that this is rejected at runtime.
    expect(() => permalink(undefined, "a.ts", 1)).toThrow(MissingPinError);
    // @ts-expect-error — as is a pin with no commit.
    expect(() => permalink({ permalinkBase: "https://x/" }, "a.ts", 1)).toThrow(MissingPinError);
  });

  it("refuses a base that does not carry the pinned commit", () => {
    expect(() =>
      permalink({ commit: pin.commit, permalinkBase: "https://github.com/get-bb/bb/blob/main/" }, "a.ts"),
    ).toThrow(MissingPinError);
  });

  it("rejects an absolute path or a zero line", () => {
    expect(() => permalink(pin, "/etc/passwd")).toThrow(TypeError);
    expect(() => permalink(pin, "a.ts", 0)).toThrow(RangeError);
  });
});

describe("route grammar", () => {
  const vocabulary = {
    surfaceGroups: Object.fromEntries(
      surfacesFile.surfaces.map((surface) => [surface.id, surface.group]),
    ),
  };

  it("parses a screen with a surface modifier", () => {
    expect(parseRoute("#composer,surface=mention-provider", vocabulary)).toEqual({
      screen: "composer",
      surfaceId: "mention-provider",
      flags: [],
    });
  });

  it("derives the screen from the surface's group", () => {
    expect(parseRoute("#surface=cli", vocabulary).screen).toBe("headless");
  });

  it("keeps flags and round-trips", () => {
    const route = parseRoute("#headless,surface=cli,nozones,light", vocabulary);
    expect(route.flags).toEqual(["nozones", "light"]);
    expect(formatRoute(route)).toBe("#headless,surface=cli,nozones,light");
  });

  it("rejects an unknown screen, surface or modifier", () => {
    expect(() => parseRoute("#nope", vocabulary)).toThrow(RouteError);
    expect(() => parseRoute("#composer,surface=ghost", vocabulary)).toThrow(RouteError);
    expect(() => parseRoute("#composer,zoom", vocabulary)).toThrow(RouteError);
    expect(() => parseRoute("#", vocabulary)).toThrow(RouteError);
  });

  it("accepts every surface's own route", () => {
    for (const surface of surfacesFile.surfaces) {
      const route = parseRoute(`#surface=${surface.id}`, vocabulary);
      expect(route.screen).toBe(SCREEN_BY_GROUP[surface.group]);
    }
  });
});

describe("rule selection", () => {
  it("is deterministic for a surface", () => {
    const first = briefs.build("surface", "thread-header").rules;
    const second = briefs.build("surface", "thread-header").rules;
    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
  });

  it("only cites rule ids that exist in data/rules.json", () => {
    const known = new Set(rulesFile.rules.map((rule) => rule.id));
    const missing = new Set<string>();
    for (const annotation of allAnnotations()) {
      for (const id of annotation.rules) if (!known.has(id)) missing.add(id);
    }
    expect([...missing]).toEqual([]);
  });

  it("exports the same bank that the sync wrote", () => {
    expect(rulesFile.rules.map((rule) => rule.id)).toEqual(Object.keys(RULES).sort());
  });

  it("gives every surface between three and eight rules", () => {
    for (const annotation of annotationsOfKind("surface")) {
      expect(annotation.rules.length, annotation.id).toBeGreaterThanOrEqual(3);
      expect(annotation.rules.length, annotation.id).toBeLessThanOrEqual(8);
    }
  });
});

describe("brief generator", () => {
  // A stable additive slot, an experimental exclusive slot, a headless
  // namespace: the three shapes the template has to survive.
  it("renders a stable additive slot", () => {
    expect(briefs.markdown("surface", "homepage-section")).toMatchSnapshot();
  });

  it("renders an experimental exclusive slot", () => {
    expect(briefs.markdown("surface", "thread-list")).toMatchSnapshot();
  });

  it("renders a headless namespace", () => {
    expect(briefs.markdown("namespace", "storage")).toMatchSnapshot();
  });

  it("renders a basket of capabilities without repeating the rules", () => {
    const markdown = briefs.basket([
      { kind: "surface", id: "homepage-section" },
      { kind: "surface", id: "cli" },
    ]);
    expect(markdown).toMatchSnapshot();
    const occurrences = markdown.split(RULES["frontend-no-network"]).length - 1;
    expect(occurrences).toBe(1);
  });

  it("names the pin in every brief", () => {
    for (const annotation of annotationsOfKind("surface")) {
      const markdown = briefs.markdown("surface", annotation.id);
      expect(markdown, annotation.id).toContain(pin.commit);
      expect(markdown, annotation.id).toContain(pin.sdkVersion);
    }
  });

  it("links every symbol it lists at the pinned commit", () => {
    for (const annotation of annotationsOfKind("surface")) {
      for (const symbol of briefs.build("surface", annotation.id).symbols) {
        expect(symbol.url).toBe(permalink(pin, symbol.path, symbol.line));
      }
    }
  });

  it("refuses an id it has no annotation for", () => {
    expect(() => briefs.build("surface", "not-a-surface")).toThrow(UnknownBriefError);
  });

  it("has an annotation for every slot upstream declares", () => {
    const missing = slotsFile.slots
      .filter((slot) => annotationFor("slot", slot.name) === null)
      .map((slot) => slot.name);
    expect(missing).toEqual([]);
  });

  it("has an annotation for all 46 surfaces and no orphans", () => {
    const annotated = new Set(annotationsOfKind("surface").map((a) => a.id));
    const known = new Set(surfacesFile.surfaces.map((surface) => surface.id));
    expect([...known].filter((id) => !annotated.has(id))).toEqual([]);
    expect([...annotated].filter((id) => !known.has(id))).toEqual([]);
  });
});

describe("bb mention payload", () => {
  // Byte-compared against what packages/plugin-api-map/src/agent-reference.ts
  // produces: key order inside `resource` and the escape order both matter,
  // because bb's composer matches the serialized string.
  const surface = {
    id: "thread-header",
    title: "Thread header controls",
    apiSymbols: ["PluginThreadHeaderActionRegistration"],
  };

  it("matches the plain-text format", () => {
    expect(bbMention(surface).text).toBe("Build a plugin that uses @Thread header controls ");
  });

  it("matches the HTML format byte for byte", () => {
    expect(bbMention(surface).html).toBe(
      'Build a plugin that uses <span data-prompt-mention="true" data-prompt-mention-resource="' +
        "{&quot;kind&quot;:&quot;plugin&quot;,&quot;pluginId&quot;:&quot;plugin-api-docs&quot;," +
        "&quot;icon&quot;:null,&quot;itemId&quot;:&quot;surface:thread-header&quot;," +
        "&quot;label&quot;:&quot;Thread header controls&quot;}" +
        '" data-prompt-mention-serialized-text="@Thread header controls">' +
        "@Thread header controls</span> ",
    );
  });

  it("matches the three-line agent context", () => {
    expect(bbMention(surface).context).toBe(
      [
        "Plugin Guide surface: Thread header controls (thread-header).",
        "Relevant @get-bb/plugin-sdk symbols: PluginThreadHeaderActionRegistration.",
        "Use the bb-plugin-authoring skill and the authoritative @get-bb/plugin-sdk declarations to build a similar plugin capability.",
      ].join("\n"),
    );
  });

  it("escapes ampersands and angle brackets in a title", () => {
    const html = bbMention({ id: "x", title: "A & B <c>", apiSymbols: [] }).html;
    expect(html).toContain("@A &amp; B &lt;c&gt;</span>");
    expect(html).not.toContain("<c>");
  });
});
