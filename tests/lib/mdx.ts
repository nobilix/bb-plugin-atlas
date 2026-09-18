/**
 * The prose MDX sources, read as text, and the pieces of them the Russian page
 * contract compares with English: front matter keys, headings, fenced code,
 * `{/* … *\/}` markers, code spans, asides and link targets.
 *
 * Line-based on purpose, like the contract it checks (TRANSLATION-RU.md, "Page
 * contract"): the rules are about what a translator may and may not touch in
 * the file, not about the rendered page.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { siteSrcDir } from "./paths.ts";

/** The prose: Starlight's `docs/` and the `intros/` of the generated index pages. */
export const contentDir = join(siteSrcDir, "content");
const PROSE_DIRS = ["docs", "intros"];

/** Every prose `.mdx`, relative to `contentDir` and POSIX, e.g. `docs/advanced/machines.mdx`. */
export function mdxFiles(): string[] {
  const out: string[] = [];
  const walk = (at: string) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const full = join(at, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".mdx")) out.push(relative(contentDir, full).split(sep).join("/"));
    }
  };
  for (const dir of PROSE_DIRS) walk(join(contentDir, dir));
  return out.sort();
}

/** The English twin of a Russian file: `docs/ru/start.mdx` → `docs/start.mdx`. */
export function englishTwin(path: string): string {
  return path.replace(/^([^/]+)\/ru\//, "$1/");
}

export function isRussian(path: string): boolean {
  return /^[^/]+\/ru\//.test(path);
}

export interface MdxParts {
  /** Front matter keys in order, nested ones with their indentation (`  order`). */
  keys: string[];
  /** Raw front matter values by key, quotes included. */
  values: Map<string, string>;
  /** Body lines outside fenced code, a fenced block replaced by one placeholder line. */
  prose: string[];
  /** Fenced code blocks, fences included, byte for byte. */
  blocks: string[];
}

const CODEBLOCK = "@@CODEBLOCK@@";

export function parseMdx(text: string): MdxParts {
  if (!text.startsWith("---\n")) throw new Error("no front matter");
  const end = text.indexOf("\n---\n", 4);
  const front = text.slice(4, end).split("\n");
  const body = text.slice(end + 5);

  const keys: string[] = [];
  const values = new Map<string, string>();
  for (const line of front) {
    const match = /^(\s*)([A-Za-z]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    keys.push(match[1] + match[2]);
    values.set(match[1] + match[2], match[3]);
  }

  const prose: string[] = [];
  const blocks: string[] = [];
  let current: string[] | null = null;
  let fence = "";
  for (const line of body.split("\n")) {
    if (current === null) {
      const open = /^(`{3,}|~{3,})/.exec(line);
      if (open) {
        fence = open[1];
        current = [line];
      } else {
        prose.push(line);
      }
      continue;
    }
    current.push(line);
    if (new RegExp(`^\\${fence[0]}{${fence.length},}\\s*$`).test(line)) {
      blocks.push(current.join("\n"));
      current = null;
      prose.push(CODEBLOCK);
    }
  }
  return { keys, values, prose, blocks };
}

const CODE_SPAN = /(`+)(.+?)\1/g;
export const MARKER = /\{\/\*.*?\*\/\}/g;

/** Code spans in some prose. */
export function codeSpans(text: string): string[] {
  return [...text.matchAll(CODE_SPAN)].map((m) => m[2]);
}

/** Markdown headings: level and the code spans in the heading text. */
export function headings(prose: string[]): { level: number; spans: string[] }[] {
  return prose
    .map((line) => /^(#{1,6})\s+(.*)$/.exec(line))
    .filter((m) => m !== null)
    .map((m) => ({ level: m[1].length, spans: codeSpans(m[2]) }));
}

/** `{/* permalink: … *\/}` and `{/* DiagramBoard: … *\/}` markers, in order. */
export function markers(prose: string[]): string[] {
  return [...prose.join("\n").matchAll(MARKER)].map((m) => m[0]);
}

/** Aside types, in order: `note`, `caution`, `danger`. */
export function asides(prose: string[]): string[] {
  return prose.map((line) => /^:::(\w+)/.exec(line)?.[1]).filter((t) => t !== undefined);
}

/** Link targets of `[text](target)`, code spans excluded. */
export function linkTargets(prose: string[]): string[] {
  const text = prose.join("\n").replace(CODE_SPAN, "");
  return [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
}

/** The prose with code spans, markers and link targets removed: what a reader reads. */
export function bareProse(prose: string[]): string {
  return prose
    .filter((line) => line !== CODEBLOCK)
    .join("\n")
    .replace(CODE_SPAN, "")
    .replace(MARKER, "")
    .replace(/\]\([^)]*\)/g, "]");
}

const CYRILLIC = /[А-Яа-яЁё]/;

/**
 * Lines, or table cells, that read as untranslated English: five or more Latin
 * words and not one Cyrillic letter, once code, markers, «quotations» (which
 * stay English by contract), link targets and URLs are taken out.
 */
export function untranslated(prose: string[]): string[] {
  const out: string[] = [];
  for (const line of prose) {
    const text = line.trim();
    if (!text || text === CODEBLOCK || /^\{\/\*.*\*\/\}$/.test(text)) continue;
    if (text.startsWith(":::") && !text.includes("[")) continue;
    const cells = text.startsWith("|") ? text.replace(/^\||\|$/g, "").split(/(?<!\\)\|/) : [text];
    for (const cell of cells) {
      const reading = cell
        .replace(CODE_SPAN, " ")
        .replace(MARKER, " ")
        .replace(/«[^»]*»/g, " ")
        .replace(/\]\([^)]*\)/g, "]")
        .replace(/https?:\/\/\S+/g, " ");
      const words = reading.match(/[A-Za-z]{3,}/g) ?? [];
      if (words.length >= 5 && !CYRILLIC.test(reading)) out.push(cell.trim().slice(0, 120));
    }
  }
  return out;
}

export function readDoc(path: string): string {
  return readFileSync(join(contentDir, path), "utf8");
}
