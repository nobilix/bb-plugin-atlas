/**
 * `data/surfaces.json` — the 7 groups and 46 surfaces of bb's plugin API map.
 *
 * The records come from importing upstream's own `surfaces.ts` at the pinned
 * commit, so the sync cannot paraphrase them. Only `sourceLine` is recovered
 * from the file text: ids never move within a release, but their lines do, so
 * the line is resolved at sync time and never stored by hand.
 */
import { contextAt } from "./lib/context.mjs";
import { pin } from "./lib/upstream.mjs";
import { SurfacesFileSchema } from "../packages/atlas-core/src/schema.ts";
import { writeData } from "./lib/write.mjs";

export const EXPECTED_SURFACE_COUNT = 46;
export const EXPECTED_GROUP_COUNT = 7;

/** Line of `id: "<value>"` in `surfaces.ts`, 1-based. */
function findIdLine(source, id) {
  const lines = source.split("\n");
  const needle = `id: ${JSON.stringify(id)}`;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim().startsWith(needle)) return i + 1;
  }
  throw new Error(`Could not find \`${needle}\` in surfaces.ts — upstream changed its shape.`);
}

/**
 * @param {string} [commit] defaults to the pin. The 46/7 count is asserted only
 *   for the pinned tree: a different count on `main` is news for `delta.json`,
 *   not a failure.
 */
export async function build(commit) {
  const { meta, surfaces: module, surfacesSource, commit: at } = await contextAt(commit);

  const groups = [];
  const surfaces = [];

  for (const group of module.SURFACE_GROUPS) {
    groups.push({
      id: group.id,
      title: group.title,
      blurb: group.blurb,
      fixtureKind: group.fixtureKind,
      surfaceIds: group.surfaces.map((surface) => surface.id),
      ...(group.sections
        ? {
            sections: group.sections.map((section) => ({
              title: section.title,
              surfaceIds: [...section.surfaceIds],
            })),
          }
        : {}),
      sourceLine: findIdLine(surfacesSource, group.id),
    });

    group.surfaces.forEach((surface, index) => {
      surfaces.push({
        id: surface.id,
        group: group.id,
        // Headless surfaces are a capability grid, not a numbered tour.
        number: group.id === "headless" ? null : index + 1,
        title: surface.title,
        summary: surface.summary,
        bullets: [...surface.bullets],
        ...(surface.tagline ? { tagline: surface.tagline } : {}),
        experimental: surface.experimental === true,
        firstParty: [...(surface.firstParty ?? [])],
        apiSymbols: [...surface.apiSymbols],
        sourceLine: findIdLine(surfacesSource, surface.id),
      });
    });
  }

  if (at !== pin.upstream.commit) return { meta, groups, surfaces };

  if (groups.length !== EXPECTED_GROUP_COUNT) {
    throw new Error(`Expected ${EXPECTED_GROUP_COUNT} groups upstream, found ${groups.length}.`);
  }
  if (surfaces.length !== EXPECTED_SURFACE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_SURFACE_COUNT} surfaces upstream, found ${surfaces.length}. ` +
        "A surface count change is a breaking upstream change: update the frozen list in tests/sync.test.ts deliberately.",
    );
  }

  return { meta, groups, surfaces };
}

export async function run() {
  const file = await build();
  writeData("surfaces.json", SurfacesFileSchema, file);
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
