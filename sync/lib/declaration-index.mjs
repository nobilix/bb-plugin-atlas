/**
 * Syntax-only declaration index over a set of upstream TypeScript files.
 *
 * This is deliberately not a type checker: it finds where a name is *written*,
 * which is what a permalink needs. It covers top-level exported declarations
 * and members written directly inside a declaration's own body. Members that
 * exist only through a type operator (`Omit<A, …> & { … }`) are left to the
 * ts-morph pass in `symbol-resolver.mjs`.
 */
import { lineCount } from "./upstream.mjs";

const DECLARATION = new RegExp(
  String.raw`^export\s+(?:declare\s+)?` +
    String.raw`(?:(?:abstract\s+)?(class)|(interface)|(type)|(?:async\s+)?(function)\*?|(const|let|var)|(enum))` +
    String.raw`\s+([A-Za-z_$][\w$]*)`,
);

const KIND_BY_KEYWORD = {
  class: "const",
  interface: "interface",
  type: "type",
  function: "function",
  const: "const",
  let: "const",
  var: "const",
  enum: "const",
};

const MEMBER = /^\s*(?:readonly\s+)?(?:get\s+|set\s+)?([A-Za-z_$][\w$]*)\s*[?!]?\s*([(<:])/;

/** `export { a as b } …` / `export type { A as B } …` — one clause per line. */
const REEXPORT_CLAUSE = /^\s*(type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?\s*,?\s*$/;

/**
 * Members written directly inside a declaration body, at any nesting depth
 * (`PluginBbSdk.threads.getPluginMetadata` is depth 2). The shallowest
 * occurrence of a name wins.
 */
function scanMembers(lines, declarationIndex) {
  const members = new Map();
  let depth = 0;
  let started = false;

  for (let i = declarationIndex; i < lines.length; i += 1) {
    const line = lines[i];

    if (started && depth >= 1) {
      const match = line.match(MEMBER);
      if (match) {
        const existing = members.get(match[1]);
        if (!existing || existing.depth > depth) {
          members.set(match[1], {
            line: i + 1,
            kind: match[2] === ":" ? "property" : "method",
            depth,
          });
        }
      }
    }

    for (const character of line) {
      if (character === "{") {
        depth += 1;
        started = true;
      } else if (character === "}") {
        depth -= 1;
      }
    }

    if (started && depth <= 0) break;
    // A brace-less declaration (`export const X = 1;`) has no member body.
    if (!started && i > declarationIndex && /^export\s/.test(line)) break;
  }

  return members;
}

/**
 * Public names introduced by a re-export clause. The name a plugin author
 * writes is the alias, and the line where the alias is written is the honest
 * anchor for it — the declaration it points at lives in a package that is not
 * part of the published SDK surface.
 */
function scanReexports(lines) {
  const found = [];
  let inClause = false;
  let clauseIsType = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (!inClause) {
      const open = line.match(/^export\s+(type\s+)?\{(.*)$/);
      if (!open) continue;
      clauseIsType = Boolean(open[1]);
      const rest = open[2];
      const closed = rest.includes("}");
      const body = closed ? rest.slice(0, rest.indexOf("}")) : rest;
      for (const piece of body.split(",")) {
        const clause = piece.match(REEXPORT_CLAUSE);
        if (clause) {
          found.push({
            name: clause[3] ?? clause[2],
            line: i + 1,
            kind: clauseIsType || clause[1] ? "type" : "const",
          });
        }
      }
      inClause = !closed;
      continue;
    }

    if (line.includes("}")) inClause = false;
    const clause = line.replace(/\}.*$/, "").match(REEXPORT_CLAUSE);
    if (clause) {
      found.push({
        name: clause[3] ?? clause[2],
        line: i + 1,
        kind: clauseIsType || clause[1] ? "type" : "const",
      });
    }
  }

  return found;
}

/**
 * @param {Map<string, string>} files repo-relative path → file contents
 * @param {(path: string, origin: "declaration" | "reexport") => number} rankOf
 *   lower wins; ties go to the first file seen.
 */
export function buildDeclarationIndex(files, rankOf = defaultRank) {
  const byName = new Map();
  const ranks = new Map();
  const lineCounts = new Map();

  const offer = (entry, origin) => {
    const rank = rankOf(entry.path, origin);
    const current = ranks.get(entry.name);
    if (current !== undefined && current <= rank) return;
    ranks.set(entry.name, rank);
    byName.set(entry.name, entry);
  };

  for (const [path, contents] of files) {
    const lines = contents.split("\n");
    lineCounts.set(path, lineCount(contents));
    for (let i = 0; i < lines.length; i += 1) {
      const match = lines[i].match(DECLARATION);
      if (!match) continue;
      const keyword = match.slice(1, 7).find(Boolean);
      offer(
        {
          name: match[7],
          path,
          line: i + 1,
          kind: KIND_BY_KEYWORD[keyword],
          members: scanMembers(lines, i),
        },
        "declaration",
      );
    }
  }

  for (const [path, contents] of files) {
    for (const entry of scanReexports(contents.split("\n"))) {
      offer({ ...entry, path, members: new Map() }, "reexport");
    }
  }

  return { byName, lineCounts };
}

/** A declaration anywhere beats a re-export anywhere. */
function defaultRank(_path, origin) {
  return origin === "declaration" ? 0 : 1;
}
