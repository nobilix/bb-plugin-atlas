/**
 * Minimal ESM resolver so upstream `.ts` modules can be imported under Node 22
 * with no build step and no `tsx`.
 *
 * Node 22 strips types on its own; what it will not do is guess an extension.
 * Upstream writes `import { SURFACES_BY_ID } from "./surfaces"`, so relative
 * extensionless specifiers get `.ts` (then `.tsx`, then `/index.ts`) appended
 * when such a file exists next to the importer.
 */
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const CANDIDATES = [".ts", ".tsx", ".mts", "/index.ts", "/index.tsx"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    const hasExtension = /\.[cm]?[jt]sx?$/.test(specifier);
    if (relative && !hasExtension && context.parentURL?.startsWith("file:")) {
      const base = new URL(specifier, context.parentURL);
      for (const suffix of CANDIDATES) {
        const candidate = new URL(base.href + suffix);
        if (existsSync(fileURLToPath(candidate))) {
          return { url: candidate.href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
});

/** Import a materialized upstream module by absolute path. */
export function importUpstream(absolutePath) {
  return import(pathToFileURL(absolutePath).href);
}
