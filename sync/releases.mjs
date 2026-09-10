/**
 * `data/releases.json` — bb's CHANGELOG, parsed by upstream's own parser.
 *
 * Dates and headlines are not in the Markdown; they live in
 * `changelog-metadata.ts`, which is imported directly rather than re-typed.
 */
import { contextAt } from "./lib/context.mjs";
import { show } from "./lib/upstream.mjs";
import { ReleasesFileSchema } from "../packages/atlas-core/src/schema.ts";
import { writeData } from "./lib/write.mjs";

const CHANGELOG = "CHANGELOG.md";

export async function build(commit) {
  const { meta, commit: at, changelogParser, changelogMetadata, pin } = await contextAt(commit);
  const entries = changelogParser.parseChangelog(show(at, CHANGELOG));

  const releases = entries.map((entry) => {
    const metadata = changelogMetadata.RELEASE_META[entry.version] ?? null;
    return {
      version: entry.version,
      date: metadata?.date ?? null,
      headline: metadata?.headline ?? null,
      pinned: entry.version === pin.upstream.bbVersion,
      lede: entry.lede,
      sections: entry.sections,
    };
  });

  if (!releases.some((release) => release.pinned)) {
    throw new Error(
      `No CHANGELOG entry for the pinned bb version ${pin.upstream.bbVersion}.`,
    );
  }

  return { meta, releases };
}

export async function run() {
  const file = await build();
  writeData("releases.json", ReleasesFileSchema, file);
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
