/**
 * Access to the pinned upstream tree.
 *
 * Every read goes through `git show <commit>:<path>` so a dirty working tree in
 * the clone cannot poison the data. Files that need to be *imported* (upstream
 * `.ts` modules) are materialised under `.cache/upstream/<commit>/` first.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(fileURLToPath(import.meta.url), "../../..");

/**
 * Where a clone of `get-bb/bb` may live, in order: `$BB_REPO`, then the cached
 * bare clone that `pnpm bb:clone` creates and CI restores. A bare clone is
 * enough: every read is `git show`, `git cat-file` or `git grep`, never a
 * checkout.
 */
export const CLONE_CANDIDATES = [
  ...(process.env.BB_REPO ? [resolve(process.env.BB_REPO)] : []),
  resolve(repoRoot, ".cache", "bb.git"),
];

function isRepo(dir) {
  if (!existsSync(dir)) return false;
  try {
    execFileSync("git", ["-C", dir, "rev-parse", "--git-dir"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** The first candidate that is a git repository, or `null`. */
export function findClone() {
  return CLONE_CANDIDATES.find(isRepo) ?? null;
}

/** The clone the sync reads. Falls back to the first candidate, so git names it when it is missing. */
export const UPSTREAM_CLONE = findClone() ?? CLONE_CANDIDATES[0];

/** True when `commit` is readable in the clone at `dir`. */
export function hasCommit(dir, commit) {
  try {
    execFileSync("git", ["-C", dir, "cat-file", "-e", `${commit}^{commit}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Lines in a file's text. A trailing newline does not open a line: `foo\n` is one line. */
export function lineCount(text) {
  return text.length === 0 ? 0 : text.replace(/\n$/, "").split("\n").length;
}

export const pin = JSON.parse(readFileSync(join(repoRoot, "pin.json"), "utf8"));

function git(args, { quiet = false } = {}) {
  return execFileSync("git", ["-C", UPSTREAM_CLONE, ...args], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    stdio: ["ignore", "pipe", quiet ? "ignore" : "inherit"],
  });
}

/** File contents at a commit. Throws if the path does not exist there. */
export function show(commit, path) {
  return git(["show", `${commit}:${path}`]);
}

/** `null` when the path does not exist at that commit. */
export function tryShow(commit, path) {
  try {
    return git(["show", `${commit}:${path}`], { quiet: true });
  } catch {
    return null;
  }
}

/** Paths under `prefix` at a commit. */
export function listTree(commit, prefix = "") {
  const out = git(["ls-tree", "-r", "--name-only", commit, ...(prefix ? ["--", prefix] : [])]);
  return out.split("\n").filter(Boolean);
}

/** Immediate children (dirs included) under `prefix` at a commit. */
export function listDir(commit, prefix) {
  const out = git(["ls-tree", "--name-only", commit, "--", prefix.endsWith("/") ? prefix : `${prefix}/`]);
  return out.split("\n").filter(Boolean);
}

const cacheRoot = join(repoRoot, ".cache", "upstream");

/**
 * Write an upstream file into the cache and return its local path, so it can be
 * `import`ed. Content still comes from `git show`, never from the working tree.
 */
export function materialize(commit, path) {
  const target = join(cacheRoot, commit, path);
  if (!existsSync(target)) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, show(commit, path));
  }
  return target;
}

/** Materialize a set of paths and return the cache root for that commit. */
export function materializeAll(commit, paths) {
  for (const path of paths) materialize(commit, path);
  return join(cacheRoot, commit);
}

export function fileLineCount(commit, path) {
  return lineCount(show(commit, path));
}
