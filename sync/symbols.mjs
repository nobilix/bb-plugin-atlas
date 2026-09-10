/**
 * `data/symbols.json` — every SDK symbol a surface, slot or namespace names,
 * resolved to the file and line where it is declared at the pinned commit.
 *
 * Anchor by `(path, name)` and resolve the line here: upstream moved 66 of 155
 * exports in `app-contract.ts` within four days, so a stored line is a stale
 * line. An unresolved symbol fails the sync — a docs site that links into thin
 * air is worse than one that refuses to build.
 */
import { contextAt } from "./lib/context.mjs";
import { SymbolsFileSchema } from "../packages/atlas-core/src/schema.ts";
import { writeData } from "./lib/write.mjs";
import { build as buildSlots } from "./slots.mjs";
import { build as buildNamespaces } from "./namespaces.mjs";
import { build as buildSurfaces } from "./surfaces.mjs";

/** Every symbol name referenced anywhere in the generated data. */
export async function referencedNames(commit) {
  const [{ surfaces }, { slots }, { namespaces }] = await Promise.all([
    buildSurfaces(commit),
    buildSlots(commit),
    buildNamespaces(commit),
  ]);

  const names = new Set();
  for (const surface of surfaces) for (const name of surface.apiSymbols) names.add(name);
  for (const slot of slots) if (slot.registrationType) names.add(slot.registrationType);
  for (const namespace of namespaces) if (namespace.type) names.add(namespace.type);
  return names;
}

export async function build(commit) {
  const { meta, resolver } = await contextAt(commit);
  const names = [...(await referencedNames(commit))].sort();

  const symbols = [];
  const unresolved = [];
  for (const name of names) {
    const resolved = await resolver.resolve(name);
    if (!resolved) {
      unresolved.push(name);
      continue;
    }
    const lineCount = resolver.lineCounts.get(resolved.path);
    if (lineCount !== undefined && resolved.line > lineCount) {
      throw new Error(
        `${name} resolved to ${resolved.path}:${resolved.line}, past the end of the file (${lineCount} lines).`,
      );
    }
    symbols.push(resolved);
  }

  if (unresolved.length > 0) {
    throw new Error(
      `${unresolved.length} symbol(s) did not resolve at ${commit ?? "the pin"}:\n` +
        unresolved.map((name) => `  ${name}`).join("\n"),
    );
  }

  return { meta, symbols };
}

export async function run() {
  const file = await build();
  writeData("symbols.json", SymbolsFileSchema, file);
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
