/**
 * Sync correctness, pinned so the results are reproducible.
 *
 * The sync is re-run in memory here rather than mocked: the thing worth testing
 * is that `git show` at the pinned commit still yields the data that is
 * committed under `data/`. A green run means the committed files are current
 * and that a second run would not change a byte.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import {
  DATA_FILE_SCHEMAS,
  type DataFileName,
} from "../packages/atlas-core/src/schema.ts";
import { build as buildSurfaces, EXPECTED_SURFACE_COUNT } from "../sync/surfaces.mjs";
import { build as buildSymbols } from "../sync/symbols.mjs";
import { build as buildSlots } from "../sync/slots.mjs";
import { build as buildNamespaces } from "../sync/namespaces.mjs";
import { build as buildPlugins } from "../sync/plugins.mjs";
import { build as buildReleases } from "../sync/releases.mjs";
import { build as buildRules } from "../sync/rules.mjs";
import { build as buildDelta } from "../sync/delta.mjs";
import { serialize } from "../sync/lib/write.mjs";
import { fileLineCount, materialize, pin } from "../sync/lib/upstream.mjs";
import { dataDir } from "./lib/paths.ts";

const readData = (name: string) => readFileSync(join(dataDir, name), "utf8");

/**
 * The frozen list. Surface ids never move within a release, so a change here is
 * a breaking upstream change and must be made deliberately, not absorbed.
 */
const FROZEN_SURFACE_IDS = [
  "sidebar-navigation",
  "nav-panel",
  "thread-row-status",
  "thread-list",
  "sidebar-footer",
  "thread-header",
  "browser-toolbar",
  "timeline-renderers",
  "message-directives",
  "message-actions",
  "pending-interaction",
  "code-renderers",
  "thread-panel",
  "file-opener",
  "app-overlay",
  "content-scripts",
  "command-palette-actions",
  "composer-banners",
  "mention-provider",
  "composer-rich-text",
  "composer-state",
  "composer-plus-menu",
  "provider-picker",
  "composer-actions",
  "homepage-section",
  "new-thread-panel",
  "declarative-settings",
  "settings-section",
  "plugin-status",
  "cli",
  "agent-tools",
  "background",
  "wire",
  "thread-events",
  "dispatch-hook",
  "environment-providers",
  "machine-providers",
  "server-access",
  "host-workers",
  "storage",
  "bb-sdk",
  "thread-plugin-metadata",
  "desktop-browsers",
  "ai-services",
  "host-components",
  "testing",
] as const;

const FROZEN_GROUP_IDS = [
  "app-shell",
  "command-palette",
  "composer",
  "home",
  "settings",
  "extensions",
  "headless",
] as const;

const BUILDERS: Record<DataFileName, () => unknown | Promise<unknown>> = {
  "surfaces.json": buildSurfaces,
  "symbols.json": buildSymbols,
  "slots.json": buildSlots,
  "namespaces.json": buildNamespaces,
  "plugins.json": buildPlugins,
  "releases.json": buildReleases,
  "rules.json": buildRules,
  "delta.json": buildDelta,
};

let built: Record<string, unknown>;

beforeAll(async () => {
  built = {};
  for (const [name, build] of Object.entries(BUILDERS)) built[name] = await build();
}, 120_000);

describe("the pin", () => {
  it("is the shipped release, not a branch head", () => {
    expect(pin.upstream.tag).toBe("desktop-v0.43.3");
    expect(pin.upstream.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(pin.permalinkBase).toContain(pin.upstream.commit);
  });
});

describe("surfaces", () => {
  it("has exactly 46 surfaces in 7 groups", () => {
    const file = built["surfaces.json"] as { groups: unknown[]; surfaces: unknown[] };
    expect(file.surfaces).toHaveLength(EXPECTED_SURFACE_COUNT);
    expect(file.surfaces).toHaveLength(46);
    expect(file.groups).toHaveLength(7);
  });

  it("matches the frozen id list, in order", () => {
    const file = built["surfaces.json"] as { surfaces: { id: string }[] };
    expect(file.surfaces.map((surface) => surface.id)).toEqual([...FROZEN_SURFACE_IDS]);
  });

  it("matches the frozen group list, in order", () => {
    const file = built["surfaces.json"] as { groups: { id: string; surfaceIds: string[] }[] };
    expect(file.groups.map((group) => group.id)).toEqual([...FROZEN_GROUP_IDS]);
    expect(file.groups.flatMap((group) => group.surfaceIds)).toEqual([...FROZEN_SURFACE_IDS]);
  });

  it("numbers each non-headless group from one and leaves headless null", () => {
    const file = built["surfaces.json"] as {
      surfaces: { id: string; group: string; number: number | null }[];
    };
    const seen = new Map<string, number>();
    for (const surface of file.surfaces) {
      if (surface.group === "headless") {
        expect(surface.number, surface.id).toBeNull();
        continue;
      }
      const next = (seen.get(surface.group) ?? 0) + 1;
      seen.set(surface.group, next);
      expect(surface.number, surface.id).toBe(next);
    }
  });

  it("points `sourceLine` at the surface's own id in surfaces.ts", () => {
    const file = built["surfaces.json"] as { surfaces: { id: string; sourceLine: number }[] };
    const lines = readFileSync(
      materialize(pin.upstream.commit, "packages/plugin-api-map/src/surfaces.ts"),
      "utf8",
    ).split("\n");
    for (const surface of file.surfaces) {
      expect(lines[surface.sourceLine - 1], surface.id).toContain(`id: "${surface.id}"`);
    }
  });
});

describe("symbols", () => {
  it("resolves every referenced symbol — zero unresolved", () => {
    const surfaces = built["surfaces.json"] as { surfaces: { apiSymbols: string[] }[] };
    const symbols = built["symbols.json"] as { symbols: { name: string }[] };
    const resolved = new Set(symbols.symbols.map((symbol) => symbol.name));
    const missing = new Set<string>();
    for (const surface of surfaces.surfaces) {
      for (const name of surface.apiSymbols) if (!resolved.has(name)) missing.add(name);
    }
    expect([...missing]).toEqual([]);
  });

  it("keeps every resolved line inside its file", () => {
    const symbols = built["symbols.json"] as { symbols: { name: string; path: string; line: number }[] };
    for (const symbol of symbols.symbols) {
      const lines = fileLineCount(pin.upstream.commit, symbol.path);
      expect(symbol.line, `${symbol.name} in ${symbol.path}`).toBeGreaterThan(0);
      expect(symbol.line, `${symbol.name} in ${symbol.path}`).toBeLessThanOrEqual(lines);
    }
  });

  it("records how each symbol was resolved", () => {
    const symbols = built["symbols.json"] as { symbols: { resolvedBy: string }[] };
    const kinds = new Set(symbols.symbols.map((symbol) => symbol.resolvedBy));
    expect([...kinds].every((kind) => ["syntax", "ts-morph", "manual"].includes(kind))).toBe(true);
  });
});

describe("slots and namespaces", () => {
  it("covers every `PluginAppSlots` method and builder surface", () => {
    const file = built["slots.json"] as { slots: { name: string; kind: string; registrationType: string | null }[] };
    expect(file.slots.filter((slot) => slot.kind === "slot-method").length).toBeGreaterThanOrEqual(22);
    expect(file.slots.some((slot) => slot.name === "contentScripts")).toBe(true);
    for (const slot of file.slots) expect(slot.registrationType, slot.name).not.toBeNull();
  });

  it("reads the 23 `BbPluginApi` members", () => {
    const file = built["namespaces.json"] as { namespaces: { name: string; member: string }[] };
    expect(file.namespaces).toHaveLength(23);
    expect(file.namespaces[0].name).toBe("bb.pluginId");
    expect(file.namespaces.at(-1)?.member).toBe("onDispose");
  });
});

describe("plugins and releases", () => {
  it("reads a plugin's id from its package name, not its directory", () => {
    const file = built["plugins.json"] as { plugins: { id: string; dir: string; name: string }[] };
    const docs = file.plugins.find((plugin) => plugin.dir === "plugins/docs");
    expect(docs).toMatchObject({ id: "simple-notes", name: "Docs" });
  });

  it("includes the example plugins", () => {
    const file = built["plugins.json"] as { plugins: { example: boolean }[] };
    expect(file.plugins.filter((plugin) => plugin.example).length).toBeGreaterThan(0);
  });

  it("marks the pinned release in the changelog", () => {
    const file = built["releases.json"] as { releases: { version: string; pinned: boolean; date: string | null }[] };
    const pinned = file.releases.filter((release) => release.pinned);
    expect(pinned).toHaveLength(1);
    expect(pinned[0].version).toBe(pin.upstream.bbVersion);
    expect(pinned[0].date).toBe("September 18, 2026");
  });
});

describe("delta against the watched branch", () => {
  it("compares against the commit the pin names", () => {
    const file = built["delta.json"] as { meta: { compare: { branch: string; commit: string } } };
    expect(file.meta.compare.commit).toBe(pin.watch.lastSeenCommit);
    expect(file.meta.compare.branch).toBe(pin.watch.branch);
  });

  it("only reports surfaces that exist in one tree or differ between them", () => {
    const file = built["delta.json"] as {
      summary: Record<string, number>;
      surfaces: { id: string; status: string; changedFields: string[] }[];
    };
    for (const surface of file.surfaces) {
      if (surface.status === "changed") expect(surface.changedFields.length).toBeGreaterThan(0);
    }
    expect(file.summary.surfacesChanged).toBe(
      file.surfaces.filter((surface) => surface.status === "changed").length,
    );
  });

  it("resolves the symbols that only `main` has", () => {
    const file = built["delta.json"] as { symbolsOnlyInMain: { name: string; path: string }[] };
    const unresolved = file.symbolsOnlyInMain.filter((symbol) => symbol.path === "(unresolved)");
    expect(unresolved.map((symbol) => symbol.name)).toEqual([]);
  });
});

describe("the committed data", () => {
  it.each(Object.keys(BUILDERS))("data/%s validates against its schema", (name: string) => {
    const parsed = DATA_FILE_SCHEMAS[name as DataFileName].safeParse(JSON.parse(readData(name)));
    expect(parsed.success ? [] : parsed.error.issues).toEqual([]);
  });

  it.each(Object.keys(BUILDERS))("data/%s is what a fresh sync produces", (name: string) => {
    expect(serialize(built[name])).toBe(readData(name));
  });

  it("is idempotent: a second run is byte-identical", async () => {
    for (const [name, build] of Object.entries(BUILDERS)) {
      expect(serialize(await build()), name).toBe(serialize(built[name]));
    }
  }, 120_000);

  it("carries no timestamp, so a re-run is not a diff", () => {
    for (const name of Object.keys(BUILDERS)) {
      expect(readData(name), name).not.toMatch(/"generated"/);
    }
  });

  it("is pretty-printed with sorted keys", () => {
    for (const name of Object.keys(BUILDERS)) {
      const raw = readData(name);
      expect(raw.endsWith("\n"), name).toBe(true);
      expect(raw.split("\n")[1]?.startsWith("  "), name).toBe(true);
      const meta = JSON.parse(raw).meta as Record<string, unknown>;
      expect(Object.keys(meta), name).toEqual([...Object.keys(meta)].sort());
    }
  });
});
