import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { atlasJson } from './loaders/atlas-json';
import {
  GroupSchema,
  NamespaceSchema,
  PluginSchema,
  ReleaseSchema,
  RuleSchema,
  SlotSchema,
  SurfaceSchema,
  SymbolSchema,
} from './lib/atlas-core';

export const collections = {
  /* Prose, under src/content/docs/. */
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  /* The introductions to the generated index pages (`/surfaces/`, `/frontend/`,
   * `/backend/`, `/plugins/`, `/changelog/`). Not routed: each generated page
   * renders its own intro above the data, so a route has one owner. */
  intros: defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './src/content/intros' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      sourceHash: z.string().optional(),
      sourcePath: z.string().optional(),
    }),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),

  /* The generated corpus. Ids are the field each file is keyed by upstream —
   * surfaces by `id`, slots by their method `name`, namespaces by `member`,
   * releases by `version`. Those are the ids that appear in the URL. */
  surfaces: defineCollection({
    loader: atlasJson({
      file: 'surfaces.json',
      arrayKey: 'surfaces',
      schema: SurfaceSchema,
    }),
    /* The same schema the loader validates with, declared here too so
     * `entry.data` is typed rather than `any` everywhere it is read. */
    schema: SurfaceSchema,
  }),
  groups: defineCollection({
    loader: atlasJson({
      file: 'surfaces.json',
      arrayKey: 'groups',
      schema: GroupSchema,
    }),
    /* The same schema the loader validates with, declared here too so
     * `entry.data` is typed rather than `any` everywhere it is read. */
    schema: GroupSchema,
  }),
  slots: defineCollection({
    loader: atlasJson({
      file: 'slots.json',
      arrayKey: 'slots',
      idKey: 'name',
      schema: SlotSchema,
    }),
    /* The same schema the loader validates with, declared here too so
     * `entry.data` is typed rather than `any` everywhere it is read. */
    schema: SlotSchema,
  }),
  namespaces: defineCollection({
    loader: atlasJson({
      file: 'namespaces.json',
      arrayKey: 'namespaces',
      idKey: 'member',
      schema: NamespaceSchema,
    }),
    /* The same schema the loader validates with, declared here too so
     * `entry.data` is typed rather than `any` everywhere it is read. */
    schema: NamespaceSchema,
  }),
  plugins: defineCollection({
    loader: atlasJson({
      file: 'plugins.json',
      arrayKey: 'plugins',
      schema: PluginSchema,
    }),
    /* The same schema the loader validates with, declared here too so
     * `entry.data` is typed rather than `any` everywhere it is read. */
    schema: PluginSchema,
  }),
  releases: defineCollection({
    loader: atlasJson({
      file: 'releases.json',
      arrayKey: 'releases',
      idKey: 'version',
      schema: ReleaseSchema,
    }),
    /* The same schema the loader validates with, declared here too so
     * `entry.data` is typed rather than `any` everywhere it is read. */
    schema: ReleaseSchema,
  }),
  rules: defineCollection({
    loader: atlasJson({
      file: 'rules.json',
      arrayKey: 'rules',
      schema: RuleSchema,
    }),
    /* The same schema the loader validates with, declared here too so
     * `entry.data` is typed rather than `any` everywhere it is read. */
    schema: RuleSchema,
  }),
  /* Not a page source: the lookup table behind every SDK permalink. */
  symbols: defineCollection({
    loader: atlasJson({
      file: 'symbols.json',
      arrayKey: 'symbols',
      idKey: 'name',
      schema: SymbolSchema,
    }),
    /* The same schema the loader validates with, declared here too so
     * `entry.data` is typed rather than `any` everywhere it is read. */
    schema: SymbolSchema,
  }),
};
