/**
 * `data/rules.json` — the "rules that will bite you" bank.
 *
 * Unlike its neighbours this file is not read out of upstream: the bank is
 * curated, and lives in `@atlas/core` so the brief generator and the site share
 * one copy. The sync projects it into `data/` and validates it, so a malformed
 * rule id fails the same way a malformed surface does.
 */
import { metaFor } from "./lib/context.mjs";
import { RULES } from "../packages/atlas-core/src/rules.ts";
import { RulesFileSchema } from "../packages/atlas-core/src/schema.ts";
import { writeData } from "./lib/write.mjs";

export function build() {
  return {
    meta: metaFor(),
    rules: Object.entries(RULES)
      .map(([id, text]) => ({ id, text }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export async function run() {
  const file = build();
  writeData("rules.json", RulesFileSchema, file);
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
