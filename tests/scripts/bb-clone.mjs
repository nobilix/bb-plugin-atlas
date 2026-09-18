#!/usr/bin/env node
/**
 * The cached bare clone of `get-bb/bb`, for the permalink check and the sync.
 *
 * Only the two commits this repo pins are fetched, each at depth 1. That is
 * enough for `git cat-file` and `git grep` -- which is every read the tests and
 * the sync make -- and it keeps the cache small enough to restore in seconds
 * instead of cloning a large monorepo on every run.
 *
 *   .cache/bb.git                     the bare clone
 *   pin.json -> upstream.commit       the release the docs describe
 *   pin.json -> watch.lastSeenCommit  what `data/delta.json` compares against
 *
 * This is the only step in the verification suite that touches the network, and
 * it is a cache warm-up, not a check: everything downstream is offline. Set
 * `BB_REPO` to reuse a clone you already have and skip it entirely.
 *
 * Usage: pnpm bb:clone [--pin-only]
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { hasCommit, pin, repoRoot } from "../../sync/lib/upstream.mjs";

const target = process.env.BB_CLONE_DIR ?? join(repoRoot, ".cache", "bb.git");

const wanted = [pin.upstream.commit];
if (!process.argv.includes("--pin-only")) wanted.push(pin.watch.lastSeenCommit);

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: "inherit" });
}

if (!existsSync(join(target, "HEAD"))) {
  mkdirSync(target, { recursive: true });
  git(["init", "--bare", "--quiet", target]);
  git(["-C", target, "remote", "add", "origin", `${pin.upstream.url}.git`]);
}

for (const commit of wanted) {
  if (hasCommit(target, commit)) {
    console.log(`have ${commit.slice(0, 7)}`);
    continue;
  }
  console.log(`fetching ${commit.slice(0, 7)} at depth 1`);
  // One commit with its full tree and blobs. Deliberately not
  // `--filter=blob:none`: a partial clone would go back to the network on the
  // first `cat-file`, which is the thing this cache exists to avoid.
  git(["-C", target, "fetch", "--depth", "1", "--no-tags", "origin", commit]);
}

const missing = wanted.filter((commit) => !hasCommit(target, commit));
if (missing.length > 0) {
  console.error(`could not fetch: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`ready: ${target}`);
