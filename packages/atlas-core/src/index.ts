/**
 * `@atlas/core` — the shapes and the derivations shared by the sync and the
 * site. Nothing here reads the filesystem or the network: it is given data and
 * a pin, and returns records, Markdown or URLs.
 */
export * from "./schema.ts";
export * from "./permalink.ts";
export * from "./rules.ts";
export * from "./annotations.ts";
export * from "./briefs.ts";
