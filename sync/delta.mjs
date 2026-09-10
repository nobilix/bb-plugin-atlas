/**
 * `data/delta.json` — what `main` has that the pinned release does not.
 *
 * The docs describe the shipped release. Upstream keeps moving, so anything
 * only `main` knows about must be labelled unreleased rather than documented as
 * available. This file is what lets the site tell the difference.
 */
import { contextAt, metaFor } from "./lib/context.mjs";
import { pin } from "./lib/upstream.mjs";
import { DeltaFileSchema } from "../packages/atlas-core/src/schema.ts";
import { writeData } from "./lib/write.mjs";
import { build as buildSurfaces } from "./surfaces.mjs";

const COMPARED_FIELDS = ["title", "summary", "bullets", "tagline", "experimental", "firstParty", "apiSymbols"];

function differs(a, b) {
  return JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
}

function byId(surfaces) {
  return new Map(surfaces.map((surface) => [surface.id, surface]));
}

export async function build() {
  const head = pin.watch.lastSeenCommit;
  const pinned = byId((await buildSurfaces(pin.upstream.commit)).surfaces);
  // The same builder reads `main`; it asserts the 46/7 count only for the pin,
  // so a surface added upstream shows up here instead of failing the sync.
  const main = byId((await buildSurfaces(head)).surfaces);

  const surfaces = [];
  for (const [id, before] of pinned) {
    const after = main.get(id);
    if (!after) {
      surfaces.push({ id, status: "only-in-pin", changedFields: [], apiSymbolsAdded: [], apiSymbolsRemoved: [] });
      continue;
    }
    const changedFields = COMPARED_FIELDS.filter((field) => differs(before[field], after[field]));
    if (changedFields.length === 0) continue;
    surfaces.push({
      id,
      status: "changed",
      changedFields,
      apiSymbolsAdded: after.apiSymbols.filter((name) => !before.apiSymbols.includes(name)),
      apiSymbolsRemoved: before.apiSymbols.filter((name) => !after.apiSymbols.includes(name)),
    });
  }
  for (const [id, after] of main) {
    if (pinned.has(id)) continue;
    surfaces.push({
      id,
      status: "only-in-main",
      changedFields: [],
      apiSymbolsAdded: [...after.apiSymbols],
      apiSymbolsRemoved: [],
    });
  }
  surfaces.sort((a, b) => a.id.localeCompare(b.id));

  const pinnedNames = new Set([...pinned.values()].flatMap((surface) => surface.apiSymbols));
  const mainNames = new Set([...main.values()].flatMap((surface) => surface.apiSymbols));

  const { resolver } = await contextAt(head);
  const symbolsOnlyInMain = [];
  for (const name of [...mainNames].filter((name) => !pinnedNames.has(name)).sort()) {
    const resolved = await resolver.resolve(name);
    // An unresolved name on `main` is news about upstream, not a broken sync:
    // the pinned data is what must resolve completely.
    symbolsOnlyInMain.push(
      resolved ?? { name, path: "(unresolved)", line: 1, kind: "type", resolvedBy: "manual" },
    );
  }
  const symbolsOnlyInPin = [...pinnedNames].filter((name) => !mainNames.has(name)).sort();

  return {
    meta: { ...metaFor(), compare: { branch: pin.watch.branch, commit: head } },
    summary: {
      surfacesChanged: surfaces.filter((surface) => surface.status === "changed").length,
      surfacesOnlyInMain: surfaces.filter((surface) => surface.status === "only-in-main").length,
      surfacesOnlyInPin: surfaces.filter((surface) => surface.status === "only-in-pin").length,
      symbolsOnlyInMain: symbolsOnlyInMain.length,
      symbolsOnlyInPin: symbolsOnlyInPin.length,
    },
    surfaces,
    symbolsOnlyInMain,
    symbolsOnlyInPin,
  };
}

export async function run() {
  const file = await build();
  writeData("delta.json", DeltaFileSchema, file);
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
