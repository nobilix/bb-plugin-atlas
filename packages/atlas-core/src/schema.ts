/**
 * The single definition of every shape under `data/`.
 *
 * The sync validates before writing; the site validates on load. Nothing else
 * may describe these records — a second definition is a second source of truth.
 */
import { z } from "zod";

export const GROUP_IDS = [
  "app-shell",
  "command-palette",
  "composer",
  "home",
  "settings",
  "extensions",
  "headless",
] as const;

export const GroupIdSchema = z.enum(GROUP_IDS);

/** Provenance carried by every generated file. */
export const MetaSchema = z.object({
  repo: z.string(),
  url: z.string(),
  tag: z.string(),
  commit: z.string().regex(/^[0-9a-f]{40}$/),
  commitDate: z.string(),
  bbVersion: z.string(),
  sdkVersion: z.string(),
  permalinkBase: z.string(),
});

export const SYMBOL_KINDS = [
  "interface",
  "type",
  "function",
  "const",
  "method",
  "property",
] as const;

export const SymbolSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  line: z.int().positive(),
  kind: z.enum(SYMBOL_KINDS),
  resolvedBy: z.enum(["syntax", "ts-morph", "manual"]),
});
export type SymbolRecord = z.infer<typeof SymbolSchema>;

export const SurfaceSchema = z.object({
  id: z.string().min(1),
  group: GroupIdSchema,
  number: z.int().positive().nullable(),
  title: z.string().min(1),
  summary: z.string(),
  bullets: z.array(z.string()),
  tagline: z.string().optional(),
  experimental: z.boolean(),
  firstParty: z.array(z.string()),
  apiSymbols: z.array(z.string()),
  sourceLine: z.int().positive(),
});
export type Surface = z.infer<typeof SurfaceSchema>;

export const GroupSchema = z.object({
  id: GroupIdSchema,
  title: z.string().min(1),
  blurb: z.string(),
  fixtureKind: z.enum(["spatial", "capability-grid"]),
  surfaceIds: z.array(z.string().min(1)),
  sections: z
    .array(z.object({ title: z.string(), surfaceIds: z.array(z.string()) }))
    .optional(),
  sourceLine: z.int().positive(),
});
export type Group = z.infer<typeof GroupSchema>;

export const SurfacesFileSchema = z.object({
  meta: MetaSchema,
  groups: z.array(GroupSchema),
  surfaces: z.array(SurfaceSchema),
});

export const SymbolsFileSchema = z.object({
  meta: MetaSchema,
  symbols: z.array(SymbolSchema),
});

export const SlotSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["slot-method", "builder-surface"]),
  registration: z.string().min(1),
  experimental: z.boolean(),
  deprecated: z.boolean(),
  registrationType: z.string().nullable(),
  path: z.string().min(1),
  line: z.int().positive(),
});
export type Slot = z.infer<typeof SlotSchema>;

export const SlotsFileSchema = z.object({
  meta: MetaSchema,
  slots: z.array(SlotSchema),
});

export const NamespaceSchema = z.object({
  name: z.string().min(1),
  member: z.string().min(1),
  experimental: z.boolean(),
  type: z.string().nullable(),
  doc: z.string(),
  path: z.string().min(1),
  line: z.int().positive(),
});
export type Namespace = z.infer<typeof NamespaceSchema>;

export const NamespacesFileSchema = z.object({
  meta: MetaSchema,
  namespaces: z.array(NamespaceSchema),
});

export const PluginSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  dir: z.string().min(1),
  example: z.boolean(),
  official: z.boolean(),
  entries: z.array(z.enum(["app", "server", "host"])),
  description: z.string().nullable(),
});
export type Plugin = z.infer<typeof PluginSchema>;

export const PluginsFileSchema = z.object({
  meta: MetaSchema,
  plugins: z.array(PluginSchema),
});

export const ReleaseSchema = z.object({
  version: z.string().min(1),
  date: z.string().nullable(),
  headline: z.string().nullable(),
  pinned: z.boolean(),
  lede: z.array(
    z.union([
      z.object({ kind: z.literal("paragraph"), text: z.string() }),
      z.object({ kind: z.literal("list"), items: z.array(z.string()) }),
    ]),
  ),
  sections: z.array(
    z.object({
      title: z.string(),
      blocks: z.array(
        z.union([
          z.object({ kind: z.literal("paragraph"), text: z.string() }),
          z.object({ kind: z.literal("list"), items: z.array(z.string()) }),
        ]),
      ),
    }),
  ),
});
export type Release = z.infer<typeof ReleaseSchema>;

export const ReleasesFileSchema = z.object({
  meta: MetaSchema,
  releases: z.array(ReleaseSchema),
});

export const RuleSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  text: z.string().min(1),
});

export const RulesFileSchema = z.object({
  meta: MetaSchema,
  rules: z.array(RuleSchema),
});

export const DeltaFileSchema = z.object({
  meta: MetaSchema.extend({
    compare: z.object({
      branch: z.string(),
      commit: z.string().regex(/^[0-9a-f]{40}$/),
    }),
  }),
  summary: z.object({
    surfacesChanged: z.int().nonnegative(),
    surfacesOnlyInMain: z.int().nonnegative(),
    surfacesOnlyInPin: z.int().nonnegative(),
    symbolsOnlyInMain: z.int().nonnegative(),
    symbolsOnlyInPin: z.int().nonnegative(),
  }),
  surfaces: z.array(
    z.object({
      id: z.string(),
      status: z.enum(["changed", "only-in-main", "only-in-pin"]),
      changedFields: z.array(
        z.enum(["title", "summary", "bullets", "tagline", "experimental", "firstParty", "apiSymbols"]),
      ),
      apiSymbolsAdded: z.array(z.string()),
      apiSymbolsRemoved: z.array(z.string()),
    }),
  ),
  symbolsOnlyInMain: z.array(SymbolSchema),
  symbolsOnlyInPin: z.array(z.string()),
});

export const DATA_FILE_SCHEMAS = {
  "surfaces.json": SurfacesFileSchema,
  "symbols.json": SymbolsFileSchema,
  "slots.json": SlotsFileSchema,
  "namespaces.json": NamespacesFileSchema,
  "plugins.json": PluginsFileSchema,
  "releases.json": ReleasesFileSchema,
  "rules.json": RulesFileSchema,
  "delta.json": DeltaFileSchema,
} as const;

export type DataFileName = keyof typeof DATA_FILE_SCHEMAS;
