/**
 * Permalink verification against a local clone of `get-bb/bb`.
 *
 * GitHub's server cannot tell you whether `#L42` is a real line — the fragment
 * never reaches it. A link to line 4200 of a 300-line file returns 200. So the
 * only honest check reads the file at the pinned commit and counts its lines,
 * and the only way to do that offline is a local clone.
 *
 * The clone is found by `sync/lib/upstream.mjs`, the one place that knows where
 * it may live (`$BB_REPO`, then `.cache/bb.git`).
 */
import { execFileSync } from "node:child_process";

import { CLONE_CANDIDATES, findClone, hasCommit, lineCount as countLines } from "../../sync/lib/upstream.mjs";

export { findClone, hasCommit };

export class MissingCloneError extends Error {
  constructor() {
    super(
      "No clone of get-bb/bb found. Set BB_REPO, or create the cached bare clone " +
        "with `pnpm bb:clone`. Tried: " +
        CLONE_CANDIDATES.join(", "),
    );
    this.name = "MissingCloneError";
  }
}

function git(dir: string, args: string[]): string {
  return execFileSync("git", ["-C", dir, ...args], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const lineCounts = new Map<string, number | null>();

/**
 * Number of lines in `path` at `commit`, or `null` when the path does not exist
 * there. Memoised: the built site references 64 distinct upstream files across
 * ~560 permalinks, so each file is read once.
 */
export function lineCount(dir: string, commit: string, path: string): number | null {
  const key = `${commit}:${path}`;
  if (lineCounts.has(key)) return lineCounts.get(key)!;
  let count: number | null;
  try {
    const blob = git(dir, ["cat-file", "-p", `${commit}:${path}`]);
    count = countLines(blob);
  } catch {
    count = null;
  }
  lineCounts.set(key, count);
  return count;
}

/**
 * Which of `names` do not appear anywhere in the pinned tree.
 *
 * This is the difference between "upstream added a reference to it" and
 * "upstream added it". `data/delta.json`'s `symbolsOnlyInMain` is the former:
 * it lists symbols a surface references on `main` and not at the pin, and 66 of
 * its 67 entries are declared in the pinned tree already — no surface simply
 * happened to name them yet. VERIFIED-AT-PIN.md settles the rule for this
 * exact trap: absence from the changelog is not evidence of absence from the
 * release, so check the pinned tree.
 *
 * One `git grep` over the commit, patterns matched as whole words. A dotted
 * member name is looked up by its last segment, which is how it is spelled in
 * the declaration.
 */
export function absentAtPin(dir: string, commit: string, names: readonly string[]): Set<string> {
  const leaves = [...new Set(names.map((n) => n.split(".").pop()!))].filter(Boolean);
  if (leaves.length === 0) return new Set();
  const args = ["grep", "--word-regexp", "--fixed-strings", "--no-line-number", "-h", "-o"];
  for (const leaf of leaves) args.push("-e", leaf);
  args.push(commit, "--", "packages/", "apps/");
  let out = "";
  try {
    out = git(dir, args);
  } catch (error) {
    // `git grep` exits 1 when nothing matched, which is a legitimate answer.
    out = (error as { stdout?: string }).stdout ?? "";
  }
  const present = new Set(
    out
      .split("\n")
      .map((line) => line.slice(line.lastIndexOf(":") + 1).trim())
      .filter(Boolean),
  );
  return new Set(names.filter((name) => !present.has(name.split(".").pop()!)));
}

const TEXT_FILE = /\.(ts|tsx|mts|js|mjs|cjs|json|md|mdx|css|html|yml|yaml|sh|toml)$/;
const wordSets = new Map<string, Set<string>>();

/**
 * Every identifier-shaped word in the text files of the whole tree at `commit`.
 * One `git cat-file --batch` over some 60 MB, read once and memoised: far
 * cheaper than a `git grep` per question when the question is hundreds of words.
 */
export function wordsAtPin(dir: string, commit: string): Set<string> {
  const cached = wordSets.get(commit);
  if (cached) return cached;
  const paths = git(dir, ["ls-tree", "-r", "--name-only", commit])
    .split("\n")
    .filter((path) => TEXT_FILE.test(path));
  const blobs = execFileSync("git", ["-C", dir, "cat-file", "--batch"], {
    input: paths.map((path) => `${commit}:${path}`).join("\n"),
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  });
  const words = new Set(blobs.match(/[A-Za-z0-9_$]+/g));
  wordSets.set(commit, words);
  return words;
}
