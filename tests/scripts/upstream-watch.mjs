#!/usr/bin/env node
/**
 * Has upstream shipped a release newer than the pin?
 *
 * The docs describe a shipped release, not `main`, so the only event that
 * matters is a new `desktop-v*` tag. This asks the remote for its tags, compares
 * the newest against `pin.json`, and when there is one, computes the delta
 * between the pinned commit and that tag using the sync's own `delta.mjs` -- so
 * the issue body is produced by the same code that produces `data/delta.json`,
 * not by a second implementation that could disagree with it.
 *
 * `delta.mjs` reads the watched commit from the shared `pin` object, which is
 * pointed at the new tag while the delta is computed and restored afterwards.
 * `pin.json` itself is never touched.
 *
 * Writes, when a newer release exists:
 *   upstream-delta.md   the issue body
 *   $GITHUB_OUTPUT      newer, tag, commit, previous_tag
 *
 * This one needs the network. It is a watcher, not a check.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { hasCommit, pin, repoRoot, UPSTREAM_CLONE as clone } from "../../sync/lib/upstream.mjs";

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 1 << 26, ...options });
}

function output(key, value) {
  console.log(`${key}=${value}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

/** `desktop-v0.43.3` -> [0, 43, 3]; anything unparseable sorts first. */
function version(tag) {
  const match = /^desktop-v(\d+)\.(\d+)\.(\d+)(?:[.-](.+))?$/.exec(tag);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] ?? ""];
}

function newer(a, b) {
  const va = version(a);
  const vb = version(b);
  if (!va) return false;
  if (!vb) return true;
  for (let i = 0; i < 3; i += 1) {
    if (va[i] !== vb[i]) return va[i] > vb[i];
  }
  // A prerelease suffix sorts before the plain tag it qualifies.
  if (va[3] === vb[3]) return false;
  if (va[3] === "") return true;
  if (vb[3] === "") return false;
  return va[3] > vb[3];
}

const refs = git(["ls-remote", "--tags", "--refs", `${pin.upstream.url}.git`, "desktop-v*"])
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [commit, ref] = line.split(/\s+/);
    return { commit, tag: ref.replace("refs/tags/", "") };
  })
  .filter((entry) => version(entry.tag) !== null);

if (refs.length === 0) {
  console.error("no desktop-v* tags on the remote; nothing to compare");
  process.exit(1);
}

refs.sort((a, b) => (newer(a.tag, b.tag) ? -1 : 1));
const latest = refs[0];

console.log(`pinned:  ${pin.upstream.tag} (${pin.upstream.commit.slice(0, 7)})`);
console.log(`newest:  ${latest.tag} (${latest.commit.slice(0, 7)})`);
output("previous_tag", pin.upstream.tag);
output("tag", latest.tag);
output("commit", latest.commit);

if (!newer(latest.tag, pin.upstream.tag)) {
  output("newer", "false");
  console.log("the pin is current");
  process.exit(0);
}
output("newer", "true");

// Both ends of the comparison have to be readable locally: the delta builder
// reads every byte through `git show`, and a missing commit surfaces as a git
// stack trace three frames deep in the sync rather than as a sentence.
const have = (commit) => hasCommit(clone, commit);

for (const commit of [pin.upstream.commit, latest.commit]) {
  if (have(commit)) continue;
  console.log(`fetching ${commit.slice(0, 7)} at depth 1`);
  git(["-C", clone, "fetch", "--depth", "1", "--no-tags", "origin", commit], { stdio: "inherit" });
  if (!have(commit)) {
    console.error(
      `${commit} is not in ${clone} and could not be fetched. Run \`pnpm bb:clone\` first.`,
    );
    process.exit(1);
  }
}

// The delta builder compares the pin with `pin.watch`, read from the shared
// `pin` object when it runs; point that at the new tag for this one build.
const watched = { ...pin.watch };
let delta;
try {
  Object.assign(pin.watch, { branch: latest.tag, lastSeenCommit: latest.commit });
  const module = await import(new URL("../../sync/delta.mjs", import.meta.url).href);
  delta = await module.build();
} finally {
  Object.assign(pin.watch, watched);
}

const lines = [];
lines.push(
  `Upstream has tagged **${latest.tag}** (\`${latest.commit.slice(0, 7)}\`). This repository is ` +
    `pinned to **${pin.upstream.tag}** (\`${pin.upstream.commit.slice(0, 7)}\`, bb ` +
    `${pin.upstream.bbVersion}, SDK ${pin.upstream.sdkVersion}).`,
);
lines.push("");
lines.push(
  "The docs describe the shipped release, so nothing changes until the pin moves deliberately. " +
    "The delta below was produced by `sync/delta.mjs`, the same code that writes `data/delta.json`.",
);
lines.push("");
lines.push("## Delta from the pin to the new tag");
lines.push("");
lines.push("| | count |");
lines.push("|---|---|");
for (const [key, value] of Object.entries(delta.summary)) lines.push(`| ${key} | ${value} |`);
lines.push("");

if (delta.surfaces.length > 0) {
  lines.push("### Surfaces");
  lines.push("");
  for (const surface of delta.surfaces) {
    const fields = (surface.changedFields ?? []).join(", ") || "-";
    lines.push(`- \`${surface.id}\` — ${surface.status}; fields: ${fields}`);
    if (surface.apiSymbolsAdded?.length) {
      lines.push(`  - added: ${surface.apiSymbolsAdded.map((n) => `\`${n}\``).join(", ")}`);
    }
    if (surface.apiSymbolsRemoved?.length) {
      lines.push(`  - removed: ${surface.apiSymbolsRemoved.map((n) => `\`${n}\``).join(", ")}`);
    }
  }
  lines.push("");
}

if (delta.symbolsOnlyInMain.length > 0) {
  lines.push(`### Symbols referenced only on ${latest.tag} (${delta.symbolsOnlyInMain.length})`);
  lines.push("");
  lines.push(
    "Referenced, not necessarily new: most of these are usually declared in the pinned tree " +
      "already and simply not named by any surface yet. `tests/content-qa.test.ts` checks the " +
      "pinned tree before deciding anything is unreleased.",
  );
  lines.push("");
  lines.push("<details><summary>full list</summary>");
  lines.push("");
  for (const symbol of delta.symbolsOnlyInMain) {
    lines.push(`- \`${symbol.name}\` — \`${symbol.path}\`:${symbol.line}`);
  }
  lines.push("");
  lines.push("</details>");
  lines.push("");
}

if (delta.symbolsOnlyInPin.length > 0) {
  lines.push(`### Symbols that exist only at the pin (${delta.symbolsOnlyInPin.length})`);
  lines.push("");
  for (const name of delta.symbolsOnlyInPin) lines.push(`- \`${name}\``);
  lines.push("");
}

lines.push("## To take the release");
lines.push("");
lines.push(`1. Set \`pin.json\` -> \`upstream\` to \`${latest.tag}\` / \`${latest.commit}\`, and`);
lines.push("   update `bbVersion` and `sdkVersion` from the new tree, never by hand.");
lines.push("2. `pnpm bb:clone && pnpm run sync` — `data/` must change as a reviewable diff.");
lines.push("3. `pnpm test` — 46 surfaces in 7 groups, zero unresolved symbols.");
lines.push("4. `pnpm --filter site build && pnpm run verify`.");
lines.push("5. Re-read `docs-internal/VERIFIED-AT-PIN.md`: its verdicts are about the old pin.");

writeFileSync(join(repoRoot, "upstream-delta.md"), lines.join("\n") + "\n");
console.log(`wrote upstream-delta.md (${lines.length} lines)`);
