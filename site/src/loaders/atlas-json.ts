/*
 * Content-layer loader for the generated corpus in `<repo>/data/*.json`.
 *
 * Two validations, on purpose:
 *   1. the whole file against atlas-core's envelope schema, which also checks
 *      `meta` — a data file generated at a different commit than `pin.json`
 *      should not quietly render;
 *   2. each record against the record schema, as the collection's own schema.
 *
 * The sync fails loudly. So does the site: `data/` is
 * generated and committed, and a missing file stops the build.
 */
import { readFile } from 'node:fs/promises';
import type { Loader, LoaderContext } from 'astro/loaders';
import type { ZodType } from 'zod';
import { DATA_FILE_SCHEMAS, type DataFileName } from '@atlas/core/schema';

export interface AtlasJsonOptions {
  /** File name inside `<repo>/data/`, e.g. `surfaces.json`. */
  file: string;
  /** Key holding the record array inside the file envelope. */
  arrayKey: string;
  /** Zod schema for one record; becomes the collection schema. */
  schema: ZodType;
  /** Field carrying the record id. */
  idKey?: string;
  /** Skip envelope validation (for files atlas-core does not model). */
  envelope?: boolean;
}

/* Resolved from Astro's own `root` (the `site/` directory), so the path
 * survives bundling and does not depend on the directory the build started in. */
const dataDir = (root: URL) => new URL('../data/', root);

async function readDataFile(file: string, root: URL): Promise<unknown> {
  try {
    return JSON.parse(await readFile(new URL(file, dataDir(root)), 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`data/${file} is missing. Run \`pnpm sync\` to generate it.`);
    }
    throw error;
  }
}

export function atlasJson(options: AtlasJsonOptions): Loader {
  const { file, arrayKey, idKey = 'id', envelope = true } = options;
  return {
    name: `atlas-json:${file}`,
    async load({ store, parseData, logger, generateDigest, config }: LoaderContext) {
      const json = await readDataFile(file, config.root);

      const envelopeSchema = envelope ? DATA_FILE_SCHEMAS[file as DataFileName] : undefined;
      if (envelopeSchema) {
        const parsed = envelopeSchema.safeParse(json);
        if (!parsed.success) {
          throw new Error(
            `data/${file} does not match its schema in @atlas/core:\n${parsed.error.issues
              .map((i) => `  ${i.path.join('.') || '<root>'}: ${i.message}`)
              .slice(0, 10)
              .join('\n')}`,
          );
        }
      }
      const records = (json as Record<string, unknown>)[arrayKey];
      if (!Array.isArray(records)) {
        throw new Error(`data/${file}: expected an array at \`${arrayKey}\``);
      }

      store.clear();
      for (const raw of records) {
        const id = String((raw as Record<string, unknown>)[idKey] ?? '');
        if (!id) throw new Error(`data/${file}: a record has no \`${idKey}\``);
        const data = await parseData({ id, data: raw as Record<string, unknown> });
        store.set({ id, data, digest: generateDigest(data), rendered: { html: '' } });
      }

      logger.info(`${records.length} record(s) from data/${file}`);
    },
    schema: options.schema,
  };
}
