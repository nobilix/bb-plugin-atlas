/**
 * What every sync step shares: the pin, the upstream modules imported straight
 * from the pinned tree, and one symbol resolver per commit.
 */
import { materializeAll, pin, show } from "./upstream.mjs";
import { importUpstream } from "./ts-loader.mjs";
import { SymbolResolver } from "./symbol-resolver.mjs";

const SURFACES = "packages/plugin-api-map/src/surfaces.ts";
const AGENT_REFERENCE = "packages/plugin-api-map/src/agent-reference.ts";
const CHANGELOG_PARSER = "changelog-parser.ts";
const CHANGELOG_METADATA = "changelog-metadata.ts";

const IMPORTABLE = [SURFACES, AGENT_REFERENCE, CHANGELOG_PARSER, CHANGELOG_METADATA];

export function metaFor(commit = pin.upstream.commit) {
  const isPin = commit === pin.upstream.commit;
  return {
    repo: pin.upstream.repo,
    url: pin.upstream.url,
    tag: isPin ? pin.upstream.tag : pin.watch.branch,
    commit,
    commitDate: pin.upstream.commitDate,
    bbVersion: pin.upstream.bbVersion,
    sdkVersion: pin.upstream.sdkVersion,
    permalinkBase: isPin
      ? pin.permalinkBase
      : `${pin.upstream.url}/blob/${commit}/`,
  };
}

const cache = new Map();

/** Everything a sync step needs at one commit, loaded once. */
export async function contextAt(commit = pin.upstream.commit) {
  if (cache.has(commit)) return cache.get(commit);

  const root = materializeAll(commit, IMPORTABLE);
  const [surfaces, agentReference, changelogParser, changelogMetadata] = await Promise.all(
    IMPORTABLE.map((path) => importUpstream(`${root}/${path}`)),
  );

  const context = {
    commit,
    pin,
    meta: metaFor(commit),
    paths: { SURFACES, AGENT_REFERENCE, CHANGELOG_PARSER, CHANGELOG_METADATA },
    surfaces,
    agentReference,
    changelogParser,
    changelogMetadata,
    surfacesSource: show(commit, SURFACES),
    resolver: new SymbolResolver(commit),
  };
  cache.set(commit, context);
  return context;
}
