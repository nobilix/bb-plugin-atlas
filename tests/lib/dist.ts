/**
 * The built site, read off disk.
 *
 * Everything here parses HTML with a real parser rather than scraping it with
 * regexes. That is not tidiness: a template constant living inside a
 * `<script>` body looks like a broken link to a regex over the file. Script
 * and style subtrees are dropped before anything is extracted.
 */
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, posix, relative, sep } from "node:path";
import { parse, type HTMLElement } from "node-html-parser";

import { distDir } from "./paths.ts";

export interface Page {
  /** Path relative to `site/dist`, POSIX separators. */
  file: string;
  /** The URL path the file is served at, e.g. `/surfaces/cli/`. */
  route: string;
  html: string;
  /** The parsed page with `<script>`, `<style>` and `<template>` removed. */
  content: HTMLElement;
  /** The `<script>` elements taken out of `content`, in document order. */
  scripts: HTMLElement[];
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Pagefind ships its own generated bundle; it is not our content.
      if (entry.name === "pagefind") continue;
      await walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

let filesCache: string[] | null = null;

/** Every built file, relative to `site/dist`, POSIX separators. */
export async function distFiles(): Promise<string[]> {
  if (!filesCache) {
    const found = await walk(distDir);
    filesCache = found.map((f) => relative(distDir, f).split(sep).join(posix.sep)).sort();
  }
  return filesCache;
}

export function routeOf(file: string): string {
  if (file === "index.html") return "/";
  if (file.endsWith("/index.html")) return `/${file.slice(0, -"index.html".length)}`;
  return `/${file}`;
}

let pagesCache: Page[] | null = null;

/** Every built HTML page. `404.html` is included; it is a page like any other. */
export async function pages(): Promise<Page[]> {
  if (pagesCache) return pagesCache;
  const files = (await distFiles()).filter((f) => f.endsWith(".html"));
  pagesCache = files.map((file) => {
    const html = readFileSync(join(distDir, file), "utf8");
    const content = parse(html, { blockTextElements: { script: true, style: true } });
    const scripts = content.querySelectorAll("script");
    for (const node of content.querySelectorAll("script, style, template")) node.remove();
    return { file, route: routeOf(file), html, content, scripts };
  });
  return pagesCache;
}

/** Ids declared on a page, for the internal-anchor check. */
export function idsOf(page: Page): Set<string> {
  const ids = new Set<string>(["", "top"]); // `#` and `#top` are browser-level targets
  for (const el of page.content.querySelectorAll("[id]")) {
    const id = el.getAttribute("id");
    if (id) ids.add(id);
  }
  for (const el of page.content.querySelectorAll("a[name]")) {
    const name = el.getAttribute("name");
    if (name) ids.add(name);
  }
  return ids;
}

export interface Link {
  href: string;
  /** Text of the link, trimmed — used only in failure messages. */
  label: string;
}

/** Every `href` on a page, script and style subtrees already excluded. */
export function linksOf(page: Page): Link[] {
  const out: Link[] = [];
  for (const el of page.content.querySelectorAll("a[href], area[href]")) {
    const href = el.getAttribute("href");
    if (!href) continue;
    out.push({ href, label: el.textContent.trim().slice(0, 60) });
  }
  return out;
}

