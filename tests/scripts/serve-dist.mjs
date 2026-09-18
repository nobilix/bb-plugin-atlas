#!/usr/bin/env node
/**
 * A static server over `site/dist`, for the Playwright suite.
 *
 * `astro preview` would be the obvious choice, but Astro 7 daemonises it: the
 * command returns immediately and may attach to a server someone else started
 * on another port, which Playwright's `webServer` reads as "exited early" and
 * which makes the suite depend on whatever is already running. This serves the
 * built directory and nothing else, with Astro's `directory` build semantics:
 * `/foo/` is `foo/index.html`, and a miss is `404.html` with a 404.
 *
 * No dependencies, no network, no origin: it binds loopback only.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] ?? new URL("../../site/dist", import.meta.url).pathname);
const port = Number(process.env.PREVIEW_PORT ?? process.argv[3] ?? 4399);
const host = "127.0.0.1";

const TYPES = new Map(
  Object.entries({
    ".html": "text/html; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".ico": "image/x-icon",
    ".xml": "application/xml; charset=utf-8",
    ".wasm": "application/wasm",
    ".pf_meta": "application/octet-stream",
    ".pf_fragment": "application/octet-stream",
    ".pagefind": "application/octet-stream",
  }),
);

function resolveFile(pathname) {
  const clean = normalize(decodeURIComponent(pathname.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const candidates = clean.endsWith("/")
    ? [join(root, clean, "index.html")]
    : [join(root, clean), join(root, clean, "index.html"), `${join(root, clean)}.html`];
  for (const candidate of candidates) {
    if (!resolve(candidate).startsWith(root)) continue;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const server = createServer((request, response) => {
  const file = resolveFile(new URL(request.url, `http://${host}`).pathname);
  if (!file) {
    const fallback = join(root, "404.html");
    response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    if (existsSync(fallback)) createReadStream(fallback).pipe(response);
    else response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "content-type": TYPES.get(extname(file)) ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(response);
});

if (!existsSync(join(root, "index.html"))) {
  console.error(`No build in ${root}. Run \`pnpm --filter site build\` first.`);
  process.exit(1);
}

server.listen(port, host, () => {
  console.log(`serving ${root} at http://${host}:${port}`);
});
