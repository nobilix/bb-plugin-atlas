/**
 * Permalinks are built, never written by hand.
 *
 * A line number is only meaningful next to the commit it was read at, so this
 * refuses to produce a URL without a pin. Upstream moved 66 of 155 exports in
 * `app-contract.ts` within four days; an unpinned link is a wrong link waiting
 * to happen.
 */

export interface Pin {
  commit: string;
  permalinkBase?: string;
  url?: string;
}

export class MissingPinError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingPinError";
  }
}

const COMMIT = /^[0-9a-f]{40}$/;

function baseOf(pin: Pin | null | undefined): string {
  if (!pin) {
    throw new MissingPinError("A permalink needs a pin; none was given.");
  }
  if (typeof pin.commit !== "string" || !COMMIT.test(pin.commit)) {
    throw new MissingPinError(
      `A permalink needs a full 40-character commit; got ${JSON.stringify(pin.commit)}.`,
    );
  }
  const base = pin.permalinkBase ?? (pin.url ? `${pin.url.replace(/\/+$/, "")}/blob/${pin.commit}/` : null);
  if (!base) {
    throw new MissingPinError(
      "A permalink needs `permalinkBase` or `url` on the pin; neither was given.",
    );
  }
  if (!base.includes(pin.commit)) {
    throw new MissingPinError(
      `The permalink base ${base} does not carry the pinned commit ${pin.commit}.`,
    );
  }
  return base.endsWith("/") ? base : `${base}/`;
}

/** `path` is repo-relative; `line` is optional and 1-based. */
export function permalink(pin: Pin, path: string, line?: number | null): string {
  const base = baseOf(pin);
  if (typeof path !== "string" || path.length === 0 || path.startsWith("/")) {
    throw new TypeError(`Expected a repo-relative path, got ${JSON.stringify(path)}.`);
  }
  const url = `${base}${path}`;
  if (line === undefined || line === null) return url;
  if (!Number.isInteger(line) || line < 1) {
    throw new RangeError(`Expected a 1-based line number, got ${JSON.stringify(line)}.`);
  }
  return `${url}#L${line}`;
}

/** Convenience for a record that already carries `{path, line}`. */
export function permalinkFor(pin: Pin, record: { path: string; line?: number | null }): string {
  return permalink(pin, record.path, record.line ?? null);
}

/* ------------------------------------------------------------ mockup routes */

/**
 * The mockup's hash grammar, `#<screen>[,<modifier>…]`.
 *
 * It gets a real parser because a generic link checker does not have one: a
 * naive checker reports every one of these as a dangling anchor. A link is valid here when the screen is a known screen and any
 * `surface=` modifier names a surface that exists.
 */
export const SCREENS = [
  "shell",
  "palette",
  "composer",
  "home",
  "settings",
  "plugins",
  "headless",
] as const;

export type Screen = (typeof SCREENS)[number];

/** Group id → the screen that shows it. */
export const SCREEN_BY_GROUP: Readonly<Record<string, Screen>> = Object.freeze({
  "app-shell": "shell",
  "command-palette": "palette",
  composer: "composer",
  home: "home",
  settings: "settings",
  extensions: "plugins",
  headless: "headless",
});

const FLAGS = ["light", "nozones"] as const;
export type RouteFlag = (typeof FLAGS)[number];

export interface Route {
  screen: Screen;
  surfaceId: string | null;
  flags: RouteFlag[];
}

export class RouteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RouteError";
  }
}

export interface RouteVocabulary {
  /** Surface id → group id. A route naming an unknown surface is an error. */
  surfaceGroups: ReadonlyMap<string, string> | Readonly<Record<string, string>>;
}

function groupOf(vocabulary: RouteVocabulary, surfaceId: string): string | undefined {
  const groups = vocabulary.surfaceGroups;
  if (groups instanceof Map) return groups.get(surfaceId);
  return (groups as Record<string, string | undefined>)[surfaceId];
}

/**
 * The zone map's hash route: `#<screen>[,<modifier>…]`, where the modifiers
 * are `surface=<surface-id>`, `light` and `nozones`. `#composer,surface=mention-provider`
 * opens the composer screen with that surface's details; `#surface=<id>` alone
 * is enough, the screen follows from the surface's group. The hash is a route,
 * not an element id: a link checker hands it to this parser rather than
 * looking for an element.
 */
export function parseRoute(hash: string, vocabulary: RouteVocabulary): Route {
  const body = hash.startsWith("#") ? hash.slice(1) : hash;
  if (body.length === 0) throw new RouteError("Empty route.");

  const parts = body.split(",").map((part) => part.trim());
  let screen: Screen | null = null;
  let surfaceId: string | null = null;
  const flags: RouteFlag[] = [];

  for (const [index, part] of parts.entries()) {
    if (part.startsWith("surface=")) {
      const id = part.slice("surface=".length);
      if (id.length === 0) throw new RouteError("`surface=` with no id.");
      if (groupOf(vocabulary, id) === undefined) {
        throw new RouteError(`Unknown surface id "${id}".`);
      }
      if (surfaceId !== null) throw new RouteError("More than one `surface=` in one route.");
      surfaceId = id;
      continue;
    }
    if ((FLAGS as readonly string[]).includes(part)) {
      flags.push(part as RouteFlag);
      continue;
    }
    if (index === 0 && (SCREENS as readonly string[]).includes(part)) {
      screen = part as Screen;
      continue;
    }
    throw new RouteError(
      index === 0 ? `Unknown screen "${part}".` : `Unknown route modifier "${part}".`,
    );
  }

  if (screen === null) {
    // `#surface=<id>` alone is enough: the screen follows from the group.
    if (surfaceId === null) throw new RouteError("A route needs a screen or a `surface=` modifier.");
    const group = groupOf(vocabulary, surfaceId);
    screen = SCREEN_BY_GROUP[group as string];
    if (!screen) throw new RouteError(`Surface "${surfaceId}" is in unknown group "${group}".`);
  }

  return { screen, surfaceId, flags };
}

export function formatRoute(route: Route): string {
  const parts: string[] = [route.screen];
  if (route.surfaceId) parts.push(`surface=${route.surfaceId}`);
  parts.push(...route.flags);
  return `#${parts.join(",")}`;
}
