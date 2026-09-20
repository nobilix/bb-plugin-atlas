// Source hashes for the Russian overlay of data/surfaces.json.
//
// A translation records the hash of the English text it was made from. When
// the English changes, the hash no longer matches and the entry is stale.
//
//   node translations/ru/hash.mjs --check          exit 1 on missing, stale or extra ids
//   node translations/ru/hash.mjs --write-hashes   fill sourceHash for every overlay entry

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");

/** Hash of the English fields a surface translation covers. */
export function surfaceHash(s) {
  return sha256(JSON.stringify({ title: s.title, summary: s.summary, bullets: s.bullets, tagline: s.tagline }));
}

/** Hash of the English fields a group translation covers. */
export function groupHash(g) {
  return sha256(JSON.stringify({ title: g.title, blurb: g.blurb, sections: (g.sections ?? []).map((s) => s.title) }));
}

const SOURCE_PATH = fileURLToPath(new URL("../../data/surfaces.json", import.meta.url));
const OVERLAY_PATH = fileURLToPath(new URL("./surfaces.json", import.meta.url));

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** Each overlay section with the English records it covers and their hash. */
const kindsOf = (source) => [
  ["groups", source.groups, groupHash],
  ["surfaces", source.surfaces, surfaceHash],
];

/** Compare the overlay with the English source, one list per problem kind. */
export function diffOverlay(source, overlay) {
  const problems = { missing: [], stale: [], extra: [] };
  for (const [kind, items, hash] of kindsOf(source)) {
    const entries = overlay[kind] ?? {};
    const ids = new Set(items.map((item) => item.id));
    for (const item of items) {
      const entry = entries[item.id];
      if (!entry) problems.missing.push(`${kind}/${item.id}`);
      else if (entry.sourceHash !== hash(item)) problems.stale.push(`${kind}/${item.id}`);
    }
    for (const id of Object.keys(entries)) {
      if (!ids.has(id)) problems.extra.push(`${kind}/${id}`);
    }
  }
  return problems;
}

function check() {
  const problems = diffOverlay(readJson(SOURCE_PATH), readJson(OVERLAY_PATH));
  let failed = false;
  for (const [label, ids] of Object.entries(problems)) {
    for (const id of ids) {
      console.error(`${label}: ${id}`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
  console.log("translations/ru/surfaces.json: all groups and surfaces current");
}

function writeHashes() {
  const source = readJson(SOURCE_PATH);
  const overlay = readJson(OVERLAY_PATH);
  for (const [kind, items, hash] of kindsOf(source)) {
    const entries = overlay[kind] ?? {};
    for (const item of items) {
      if (!entries[item.id]) continue;
      const { sourceHash: _old, ...fields } = entries[item.id];
      entries[item.id] = { sourceHash: hash(item), ...fields };
    }
  }
  writeFileSync(OVERLAY_PATH, `${JSON.stringify(overlay, null, 2)}\n`);
  console.log("translations/ru/surfaces.json: hashes written");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const flag = process.argv[2];
  if (flag === "--check") check();
  else if (flag === "--write-hashes") writeHashes();
  else {
    console.error("usage: node translations/ru/hash.mjs --check | --write-hashes");
    process.exit(2);
  }
}
