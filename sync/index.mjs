#!/usr/bin/env node
/**
 * `pnpm sync` — regenerates every file under `data/` from the pinned commit.
 *
 * The sync fails loudly. A schema violation, an unresolved symbol or a surface
 * count other than 46 exits non-zero; silent partial data is the failure mode
 * this pipeline is designed against.
 */
import { performance } from "node:perf_hooks";
import { pin } from "./lib/upstream.mjs";
import { run as syncSurfaces } from "./surfaces.mjs";
import { run as syncSymbols } from "./symbols.mjs";
import { run as syncSlots } from "./slots.mjs";
import { run as syncNamespaces } from "./namespaces.mjs";
import { run as syncPlugins } from "./plugins.mjs";
import { run as syncReleases } from "./releases.mjs";
import { run as syncRules } from "./rules.mjs";
import { run as syncDelta } from "./delta.mjs";

const STEPS = [
  ["surfaces.json", syncSurfaces, (file) => `${file.groups.length} groups, ${file.surfaces.length} surfaces`],
  ["symbols.json", syncSymbols, (file) => `${file.symbols.length} symbols, ${file.symbols.filter((s) => s.resolvedBy === "ts-morph").length} via ts-morph`],
  ["slots.json", syncSlots, (file) => `${file.slots.length} slots`],
  ["namespaces.json", syncNamespaces, (file) => `${file.namespaces.length} namespaces`],
  ["plugins.json", syncPlugins, (file) => `${file.plugins.length} plugins (${file.plugins.filter((p) => p.example).length} examples)`],
  ["releases.json", syncReleases, (file) => `${file.releases.length} releases`],
  ["rules.json", syncRules, (file) => `${file.rules.length} rules`],
  ["delta.json", syncDelta, (file) => `${file.summary.surfacesChanged} surfaces changed, ${file.summary.symbolsOnlyInMain} symbols only in ${pin.watch.branch}`],
];

const started = performance.now();
console.log(`sync — ${pin.upstream.repo} @ ${pin.upstream.tag} (${pin.upstream.commit.slice(0, 7)})`);

for (const [name, run, describe] of STEPS) {
  const file = await run();
  console.log(`  data/${name.padEnd(17)} ${describe(file)}`);
}

console.log(`done in ${((performance.now() - started) / 1000).toFixed(1)}s`);
