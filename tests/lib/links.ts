/**
 * Classifying references found in the built site.
 *
 * The classification matters more than the checking. A generic link checker
 * reports every zone-map route as a dangling anchor, but a route in the
 * `#<screen>[,<modifier>…]` grammar is not an element id and is never meant
 * to be one. So a hash is only an "internal
 * anchor" when its target page is not the zone map; on the zone map it is a
 * route and goes to the parser in `@atlas/core`.
 */
import { posix } from "node:path";

import { withoutLocale } from "./paths.ts";

export const MAP_ROUTE = "/map/";

/** The zone map in any locale: `/map/` and `/ru/map/` share one route grammar. */
export function isMapRoute(route: string): boolean {
  return withoutLocale(route) === MAP_ROUTE;
}

export type Reference =
  | { kind: "anchor"; hash: string }
  | { kind: "route"; hash: string }
  | { kind: "page"; path: string; hash: string | null }
  | { kind: "external"; url: string }
  | { kind: "permalink"; url: string; path: string; commit: string; line: number | null }
  | { kind: "ignored"; href: string };

const PERMALINK =
  /^https?:\/\/github\.com\/get-bb\/bb\/blob\/([0-9a-f]{7,40})\/([^#?]+)(?:#L(\d+)(?:-L\d+)?)?/;

/** Resolve an href against the page it was found on. */
export function classify(href: string, fromRoute: string): Reference {
  const raw = href.trim();
  if (raw.length === 0) return { kind: "ignored", href };
  if (/^(mailto:|tel:|javascript:|data:)/i.test(raw)) return { kind: "ignored", href };

  const permalink = PERMALINK.exec(raw);
  if (permalink) {
    return {
      kind: "permalink",
      url: raw,
      commit: permalink[1],
      path: permalink[2],
      line: permalink[3] ? Number(permalink[3]) : null,
    };
  }

  if (/^https?:\/\//i.test(raw) || raw.startsWith("//")) return { kind: "external", url: raw };

  if (raw.startsWith("#")) {
    const hash = raw.slice(1);
    return isMapRoute(fromRoute) ? { kind: "route", hash } : { kind: "anchor", hash };
  }

  const [pathPart, ...rest] = raw.split("#");
  const hash = rest.length > 0 ? rest.join("#") : null;
  const [cleanPath] = pathPart.split("?");
  const base = fromRoute.endsWith("/") ? fromRoute : posix.dirname(fromRoute) + "/";
  const target = cleanPath.startsWith("/")
    ? posix.normalize(cleanPath)
    : posix.normalize(posix.join(base, cleanPath));
  return { kind: "page", path: target, hash };
}

/**
 * The file in `site/dist` that serves a route, or `null` when nothing does.
 * Astro's default `directory` build format means `/foo/` is `foo/index.html`.
 */
export function fileForRoute(route: string, files: ReadonlySet<string>): string | null {
  const body = route.replace(/^\//, "");
  const candidates = body === "" || body.endsWith("/")
    ? [`${body}index.html`]
    : [body, `${body}/index.html`, `${body}.html`];
  return candidates.find((c) => files.has(c)) ?? null;
}

/**
 * Permalinks that are not `href`s — the ones inside Markdown twins and
 * `briefs.json`. HTML is never scanned this way; see the header comment.
 */
export function permalinksInText(text: string): { url: string; path: string; commit: string; line: number | null }[] {
  const out: { url: string; path: string; commit: string; line: number | null }[] = [];
  const global = new RegExp(
    "https?://github\\.com/get-bb/bb/blob/([0-9a-f]{7,40})/([^\\s)\"'<>\\]]+)",
    "g",
  );
  for (const match of text.matchAll(global)) {
    const url = match[0].replace(/[.,;:]+$/, "");
    const withLine = /^(.*?)#L(\d+)(?:-L\d+)?$/.exec(match[2]);
    out.push({
      url,
      commit: match[1],
      path: withLine ? withLine[1] : match[2].split("#")[0],
      line: withLine ? Number(withLine[2]) : null,
    });
  }
  return out;
}
