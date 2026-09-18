#!/usr/bin/env node
/**
 * External link rot. The one check in this repository that uses the network, and
 * the reason it runs on a schedule instead of on a pull request: a link that
 * broke overnight is not this commit's fault, and a flaky third-party host must
 * not be able to block a merge.
 *
 * Deliberately not a generic link checker: a generic one reports broken links
 * that are all false positives, the same way it misreads the zone-map routes.
 * What it takes to be right:
 *
 *   1. Links come from `href` and `src` attributes, never from a text scan. Prose
 *      about `http://<LAN-IP>:38886` is documentation, not a URL, and a code span
 *      showing `npm:bb-plugin-notes` is not a request anybody makes.
 *   2. A permalink's `#L42` is dropped before the request. The fragment never
 *      reaches the server, so GitHub answers 200 for any line number; the line
 *      numbers are verified offline against the local clone in
 *      `tests/integrity.test.ts`. Dropping it also collapses hundreds of links
 *      into a handful of requests.
 *   3. `rel="preconnect"` and `dns-prefetch` targets are origins, not resources.
 *      `https://fonts.gstatic.com/` with no path is a 404 and a working font host.
 *   4. Examples in the docs are fictional on purpose. `github.com/acme/...` is how
 *      upstream's own CLI help spells a placeholder.
 *
 * Usage: node tests/scripts/check-external-links.mjs [site/dist]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "node-html-parser";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const root = process.argv[2] ?? join(repoRoot, "site", "dist");

const CONCURRENCY = Number(process.env.LINK_CONCURRENCY ?? 6);
const TIMEOUT_MS = Number(process.env.LINK_TIMEOUT_MS ?? 15_000);
const RETRIES = 2;

/**
 * Hosts and prefixes that are not checked, each with the reason. A skip is
 * printed, never silent: a list nobody sees is a list nobody prunes.
 */
const SKIP = [
  { match: /^https?:\/\/(x|twitter)\.com\//, why: "answers a bot with 403 and a human with a page" },
  { match: /^https?:\/\/(www\.)?linkedin\.com\//, why: "answers a bot with 999" },
  { match: /^https?:\/\/github\.com\/acme\//, why: "a placeholder in upstream's own CLI examples" },
];

/** Statuses that mean "there, but not for you". */
const TOLERATED = new Set([401, 403, 405, 429, 999]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "pagefind") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if ([".html", ".md", ".txt", ".json", ".xml"].includes(extname(name))) out.push(full);
  }
  return out;
}

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'");
}

/** `null` when the string is not a URL worth a request. */
function normalise(raw) {
  const value = decode(raw.trim()).replace(/[.,;:`)\]]+$/, "");
  if (!/^https?:\/\//i.test(value)) return null;
  // A placeholder, not an address. Upstream writes `<machine>.<tailnet>.ts.net`.
  if (/[<>{}\s]/.test(value)) return null;
  const withoutFragment = value.split("#")[0];
  try {
    const url = new URL(withoutFragment);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
    if (url.hostname === "example.com" || url.hostname.endsWith(".example")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const files = walk(root);
const found = new Map(); // url -> Set of files

function record(url, where) {
  const set = found.get(url) ?? new Set();
  set.add(where);
  found.set(url, set);
}

for (const file of files) {
  const where = file.slice(root.length + 1);
  const text = readFileSync(file, "utf8");

  if (extname(file) === ".html") {
    const document = parse(text, { blockTextElements: { script: true, style: true } });
    for (const element of document.querySelectorAll("a[href], area[href], img[src], source[src]")) {
      const raw = element.getAttribute("href") ?? element.getAttribute("src");
      const url = raw ? normalise(raw) : null;
      if (url) record(url, where);
    }
    for (const element of document.querySelectorAll("link[href]")) {
      // preconnect and dns-prefetch name an origin, not a document.
      const rel = (element.getAttribute("rel") ?? "").toLowerCase();
      if (rel.includes("preconnect") || rel.includes("dns-prefetch")) continue;
      const url = normalise(element.getAttribute("href") ?? "");
      if (url) record(url, where);
    }
    continue;
  }

  // Markdown twins, llms.txt and briefs.json: take link targets, not prose.
  for (const match of text.matchAll(/\]\((https?:\/\/[^\s)]+)\)/g)) {
    const url = normalise(match[1]);
    if (url) record(url, where);
  }
  for (const match of text.matchAll(/"(https?:\/\/[^"\s]+)"/g)) {
    const url = normalise(match[1]);
    if (url) record(url, where);
  }
}

const urls = [...found.keys()].sort();
console.log(`${urls.length} distinct external URL(s) across ${files.length} built files`);

async function request(url, method, signal) {
  return fetch(url, {
    method,
    redirect: "follow",
    signal,
    headers: { "user-agent": "bb-plugin-atlas link check" },
  });
}

async function check(url) {
  const skip = SKIP.find((rule) => rule.match.test(url));
  if (skip) return { url, status: "skipped", note: skip.why };

  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      // HEAD first: cheaper, and most hosts answer it. Some answer 405 or lie, so
      // anything that is not a clean 2xx is retried as a GET before it counts.
      let response = await request(url, "HEAD", controller.signal);
      if (!response.ok) response = await request(url, "GET", controller.signal);
      clearTimeout(timer);
      if (response.ok) return { url, status: response.status };
      if (TOLERATED.has(response.status)) {
        return { url, status: response.status, note: "reachable but refusing a bot" };
      }
      if (attempt === RETRIES) return { url, status: response.status, broken: true };
    } catch (error) {
      clearTimeout(timer);
      if (attempt === RETRIES) {
        return { url, status: String(error?.cause?.code ?? error?.name ?? error), broken: true };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
  }
  return { url, status: "unknown", broken: true };
}

const results = [];
const queue = [...urls];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      results.push(await check(queue.shift()));
    }
  }),
);

for (const result of results.filter((r) => r.note).sort((a, b) => a.url.localeCompare(b.url))) {
  console.log(`  note ${result.status} ${result.url} — ${result.note}`);
}

const broken = results.filter((r) => r.broken);
if (broken.length > 0) {
  console.error(`\n${broken.length} broken link(s):`);
  for (const result of broken.sort((a, b) => a.url.localeCompare(b.url))) {
    console.error(`  ${result.status} ${result.url}`);
    for (const file of [...found.get(result.url)].slice(0, 4)) console.error(`      in ${file}`);
  }
}

const noted = results.filter((r) => r.note).length;
console.log(`\n${results.length - broken.length} ok (${noted} skipped or tolerated), ${broken.length} broken`);
process.exit(broken.length > 0 ? 1 : 0);
