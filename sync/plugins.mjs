/**
 * `data/plugins.json` — bb's first-party plugins and the example plugins in
 * `examples/plugins`.
 *
 * A plugin's id is not its directory: `plugins/docs` ships as `simple-notes`.
 * The id comes from the package name, the display name from the `bb` manifest —
 * the same two fields bb itself reads.
 */
import { contextAt } from "./lib/context.mjs";
import { listDir, tryShow } from "./lib/upstream.mjs";
import { PluginsFileSchema } from "../packages/atlas-core/src/schema.ts";
import { writeData } from "./lib/write.mjs";

const PLUGINS = "plugins";
const EXAMPLES = "examples/plugins";
const OFFICIAL_CATALOGUE = "plugins/bb-official.json";

function readPlugin(commit, dir, example) {
  const raw = tryShow(commit, `${dir}/package.json`);
  if (!raw) return null;
  const manifest = JSON.parse(raw);
  const bb = manifest.bb ?? {};
  const id = String(manifest.name ?? "").replace(/^bb-plugin-/, "");
  if (!id) return null;

  const entries = [];
  if (bb.app) entries.push("app");
  if (bb.server) entries.push("server");
  if (bb.host) entries.push("host");

  return {
    id,
    name: bb.name ?? manifest.name,
    dir,
    example,
    official: false,
    entries,
    description: bb.description ?? manifest.description ?? null,
  };
}

export async function build(commit) {
  const { meta, commit: at } = await contextAt(commit);
  const catalogue = JSON.parse(tryShow(at, OFFICIAL_CATALOGUE) ?? "{}");

  const plugins = [];
  for (const [prefix, example] of [
    [PLUGINS, false],
    [EXAMPLES, true],
  ]) {
    for (const dir of listDir(at, prefix)) {
      const plugin = readPlugin(at, dir, example);
      if (!plugin) continue;
      plugin.official = Object.hasOwn(catalogue, dir.slice(prefix.length + 1));
      plugins.push(plugin);
    }
  }

  plugins.sort((a, b) => a.id.localeCompare(b.id));
  return { meta, plugins };
}

export async function run() {
  const file = await build();
  writeData("plugins.json", PluginsFileSchema, file);
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
