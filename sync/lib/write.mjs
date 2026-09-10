/**
 * Writing `data/*.json`.
 *
 * Two properties matter and both are about diffs: keys are ordered the same way
 * every run, and nothing in the payload depends on when the sync ran. There is
 * deliberately no `generated` timestamp — it would make every run a diff and
 * break the idempotence check.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./upstream.mjs";

export const dataDir = join(repoRoot, "data");

/** Recursively sorts object keys; array order is data and is left alone. */
export function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableSort(value[key])]),
    );
  }
  return value;
}

export function serialize(value) {
  return `${JSON.stringify(stableSort(value), null, 2)}\n`;
}

/**
 * Validates against the schema, then writes. A schema violation exits the sync
 * non-zero rather than leaving half-valid data on disk.
 */
export function writeData(name, schema, value) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`data/${name} does not match its schema:\n${issues}`);
  }
  mkdirSync(dataDir, { recursive: true });
  const contents = serialize(parsed.data);
  writeFileSync(join(dataDir, name), contents);
  return contents;
}
