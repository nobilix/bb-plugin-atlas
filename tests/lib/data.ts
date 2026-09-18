/**
 * `data/*.json` as the tests see it: read once, typed loosely, never mutated.
 * The Zod schemas are already enforced by `sync.test.ts` (§2); here the data is
 * simply the oracle that the built site is checked against.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { dataDir, repoRoot } from "./paths.ts";

function read<T>(name: string): T {
  return JSON.parse(readFileSync(join(dataDir, name), "utf8")) as T;
}

export interface Pin {
  repo: string;
  url: string;
  tag: string;
  commit: string;
  commitDate: string;
  bbVersion: string;
  sdkVersion: string;
}

export const pinFile = JSON.parse(readFileSync(join(repoRoot, "pin.json"), "utf8")) as {
  upstream: Pin;
  watch: { branch: string; lastSeenCommit: string; note: string };
  permalinkBase: string;
};

export const pin = pinFile.upstream;
export const permalinkBase = pinFile.permalinkBase;

export interface Surface {
  id: string;
  group: string;
  number: number | null;
  title: string;
  summary: string;
  bullets: string[];
  tagline?: string;
  experimental: boolean;
  firstParty: string[];
  apiSymbols: string[];
  sourceLine: number;
}

export interface Group {
  id: string;
  title: string;
  blurb: string;
  fixtureKind: "spatial" | "capability-grid";
  surfaceIds: string[];
  sections?: { title: string; surfaceIds: string[] }[];
  sourceLine: number;
}

export interface SymbolRecord {
  name: string;
  path: string;
  line: number;
  kind: string;
  resolvedBy: string;
}

export const surfacesFile = read<{ meta: Pin; groups: Group[]; surfaces: Surface[] }>(
  "surfaces.json",
);
export const symbolsFile = read<{ meta: Pin; symbols: SymbolRecord[] }>("symbols.json");
export const slotsFile = read<{ meta: Pin; slots: Record<string, unknown>[] }>("slots.json");
export const rulesFile = read<{ meta: Pin; rules: Record<string, unknown>[] }>("rules.json");

export interface Delta {
  meta: Record<string, unknown>;
  summary: {
    surfacesChanged: number;
    surfacesOnlyInMain: number;
    surfacesOnlyInPin: number;
    symbolsOnlyInMain: number;
    symbolsOnlyInPin: number;
  };
  surfaces: {
    id: string;
    status: string;
    changedFields?: string[];
    apiSymbolsAdded?: string[];
    apiSymbolsRemoved?: string[];
  }[];
  symbolsOnlyInMain: SymbolRecord[];
  symbolsOnlyInPin: string[];
}

export const deltaFile = read<Delta>("delta.json");

export const surfaces = surfacesFile.surfaces;
export const groups = surfacesFile.groups;
export const symbols = symbolsFile.symbols;

export const surfaceById = new Map(surfaces.map((s) => [s.id, s]));
export const groupById = new Map(groups.map((g) => [g.id, g]));

/** Surface id → group id, the vocabulary the route parser needs. */
export const surfaceGroups: Record<string, string> = Object.fromEntries(
  surfaces.map((s) => [s.id, s.group]),
);

export const symbolNames = new Set(symbols.map((s) => s.name));
