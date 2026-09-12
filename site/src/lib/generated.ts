/*
 * The generated half of the site: surfaces, frontend slots,
 * backend namespaces, the plugin catalog and the changelog.
 *
 * One module builds both renderings — the HTML page and the raw Markdown served
 * at `/<path>.md` — so the two cannot drift. `briefs()` feeds `/briefs.json`.
 *
 * Identifiers, paths and UI strings are passed through exactly as upstream
 * writes them; every SDK reference becomes a pinned permalink built by
 * atlas-core, never a hand-typed URL.
 */
import { getCollection, getEntry, render, type CollectionEntry } from 'astro:content';
import {
  createBriefs,
  formatRoute,
  SCREEN_BY_GROUP,
  permalink,
  renderBrief,
  bbMention,
  RULES,
  type BbMention,
  type Brief,
  type BriefPin,
  type Pin as PermalinkPin,
} from './atlas-core';
import { pin, shortCommit } from './pin';
import { plainText, resolveMarkdownLinks } from './inline-md';
import { localizeGroup, localizeSurface } from './overlay';
import { t, type Locale } from '../i18n/ui';
import { localePath, localePrefix } from '../i18n/routes';

export interface GeneratedPage {
  /** Route path without leading or trailing slash: `surfaces/thread-list`, `ru/surfaces/thread-list`. */
  path: string;
  title: string;
  description: string;
  markdown: string;
}

export const versionStamp = (locale: Locale) =>
  `bb ${pin.upstream.bbVersion} · SDK ${pin.upstream.sdkVersion} · ${t(locale, 'stamp.pinned')} ${shortCommit}`;

const permalinkPin: PermalinkPin = {
  commit: pin.upstream.commit,
  permalinkBase: pin.permalinkBase,
  url: pin.upstream.url,
};

/* The brief generator refuses to render without a pin: the version and the commit in a brief's preamble
 * are arguments, never constants in the template. */
const briefPin: BriefPin = {
  ...permalinkPin,
  tag: pin.upstream.tag,
  bbVersion: pin.upstream.bbVersion,
  sdkVersion: pin.upstream.sdkVersion,
};

/**
 * The zone-map route for a surface: `#<screen>,surface=<id>`
 * with the screen derived from the surface's group.
 *
 * Built by atlas-core's own formatter, never by string concatenation here —
 * this is the syntax a generic link checker read as 46 dangling anchors, and
 * the parser that settles the argument and the formatter that emits it have to
 * be the same pair.
 */
export function mapRoute(surface: { id: string; group: string }, locale: Locale = 'en'): string {
  const screen = SCREEN_BY_GROUP[surface.group];
  if (!screen) throw new Error(`Surface "${surface.id}" is in unknown group "${surface.group}".`);
  return localePath(locale, `/map/${formatRoute({ screen, surfaceId: surface.id, flags: [] })}`);
}

const bullets = (lines: readonly string[]) => lines.map((l) => `- ${l}`).join('\n');
const stamp = (locale: Locale) => `\n---\n\n${versionStamp(locale)}\n`;
const lines = (parts: (string | null)[]) => parts.filter((p) => p !== null).join('\n');

/* --- symbols: the lookup behind every permalink --------------------------- */

export type SymbolEntry = CollectionEntry<'symbols'>;

let symbolCache: Map<string, SymbolEntry['data']> | null = null;

export async function symbolIndex(): Promise<Map<string, SymbolEntry['data']>> {
  if (!symbolCache) {
    const all = await getCollection('symbols');
    symbolCache = new Map(all.map((e) => [e.data.name, e.data]));
  }
  return symbolCache;
}

/** Each symbol with its pinned permalink, or a null `href` when the sync could not resolve it. */
export async function symbolLinks(names: readonly string[]) {
  const index = await symbolIndex();
  return names.map((name) => {
    const symbol = index.get(name);
    return {
      name,
      kind: symbol?.kind ?? null,
      href: symbol ? permalink(permalinkPin, symbol.path, symbol.line) : null,
    };
  });
}

/* --- hand-written prose, shown above the generated tables ------------------
 *
 * Each generated index page opens with an introduction from the `intros`
 * collection (`src/content/intros/<id>.mdx`, `ru/<id>.mdx` for Russian): the
 * prose explains, the data lists.
 */
function proseEntry(id: string, locale: Locale) {
  return getEntry('intros', localePath(locale, `/${id}`).slice(1));
}

export async function proseFor(id: string, locale: Locale = 'en') {
  const entry = await proseEntry(id, locale);
  if (!entry) return null;
  const { Content } = await render(entry);
  return { entry, Content };
}

async function proseBody(id: string, locale: Locale): Promise<string | null> {
  const body = (await proseEntry(id, locale))?.body?.trim();
  return body ? body : null;
}

/* --- surfaces --------------------------------------------------------------
 *
 * `locale` changes what a reader reads — title, summary, bullets, tagline —
 * from `translations/<locale>/surfaces.json` when it is current (see
 * `overlay.ts`). Ids, groups, symbols and everything a brief is built from
 * stay the English records.
 */

export async function surfaces(locale: Locale = 'en') {
  const all = (await getCollection('surfaces')).map((entry) => ({
    ...entry,
    data: localizeSurface(entry.data, locale),
  }));
  return all.sort((a, b) => a.data.title.localeCompare(b.data.title, locale));
}

let surfaceIdCache: Set<string> | null = null;

/** Every surface id: what an upstream `[text](surface-id)` cross-link may target. */
export async function surfaceIds(): Promise<Set<string>> {
  if (!surfaceIdCache) surfaceIdCache = new Set((await surfaces()).map((e) => e.id));
  return surfaceIdCache;
}

/** A formatter for upstream text in a Markdown twin: surface cross-links made absolute. */
async function upstreamMarkdown(locale: Locale): Promise<(text: string) => string> {
  const ids = await surfaceIds();
  return (text) => resolveMarkdownLinks(text, (id) => ids.has(id), localePrefix(locale));
}

export async function groups(locale: Locale = 'en') {
  return (await getCollection('groups')).map((entry) => ({
    ...entry,
    data: localizeGroup(entry.data, locale),
  }));
}

export async function groupTitles(locale: Locale = 'en'): Promise<Map<string, string>> {
  const all = await groups(locale);
  return new Map(all.map((g) => [g.data.id, g.data.title]));
}

const stability = (experimental: boolean, locale: Locale) =>
  t(locale, experimental ? 'stability.experimental' : 'stability.stable');

export async function surfaceMarkdown(
  entry: CollectionEntry<'surfaces'>,
  locale: Locale = 'en',
): Promise<string> {
  const d = entry.data;
  const titles = await groupTitles(locale);
  const symbols = await symbolLinks(d.apiSymbols);
  const md = await upstreamMarkdown(locale);
  return lines([
    `# ${d.title}`,
    '',
    md(d.summary),
    '',
    `- ${t(locale, 'surface.group')}: ${titles.get(d.group) ?? d.group}`,
    `- ${t(locale, 'surface.stability')}: ${stability(d.experimental, locale)}`,
    d.tagline ? `- ${d.tagline}` : null,
    d.firstParty.length ? `- ${t(locale, 'surface.firstParty')}: ${d.firstParty.join(', ')}` : null,
    `- [${t(locale, 'surface.showOnMap')}](${mapRoute({ id: entry.id, group: d.group }, locale)})`,
    '',
    d.bullets.length ? `## ${t(locale, 'surface.gives')}\n\n${bullets(d.bullets.map(md))}\n` : null,
    symbols.length
      ? `## ${t(locale, 'surface.api')}\n\n${bullets(
          symbols.map((s) => (s.href ? `[\`${s.name}\`](${s.href})` : `\`${s.name}\``)),
        )}\n`
      : null,
    stamp(locale),
  ]);
}

/* --- frontend slots ------------------------------------------------------- */

export async function slots() {
  const all = await getCollection('slots');
  return all.sort((a, b) => a.data.name.localeCompare(b.data.name));
}

/*
 * Two kinds of registration point, never summed into one "slots" number:
 * 22 `PluginAppSlots` methods and 5 `PluginAppBuilder` regions, 27 in all at
 * the pin. Counts are computed from `data/slots.json`, so the number on screen
 * is the number in the data — never a number typed here.
 */
export async function slotsByKind() {
  const all = await slots();
  return {
    methods: all.filter((e) => e.data.kind === 'slot-method'),
    builders: all.filter((e) => e.data.kind === 'builder-surface'),
  };
}

export const slotKind = (kind: string, locale: Locale) =>
  t(locale, kind === 'slot-method' ? 'slot.kind.method' : 'slot.kind.builder');

export function slotMarkdown(entry: CollectionEntry<'slots'>, locale: Locale = 'en'): string {
  const d = entry.data;
  return lines([
    `# ${d.name}`,
    '',
    `${t(locale, 'slot.registeredWith')} \`${d.registration}\`.`,
    '',
    `- ${t(locale, 'slot.kind')}: ${slotKind(d.kind, locale)}`,
    `- ${t(locale, 'surface.stability')}: ${stability(d.experimental, locale)}`,
    d.deprecated ? `- ${t(locale, 'chip.deprecated')}` : null,
    d.registrationType
      ? `- ${t(locale, 'slot.registrationType')}: \`${d.registrationType}\``
      : null,
    `- ${t(locale, 'source.heading')}: [${d.path}#L${d.line}](${permalink(permalinkPin, d.path, d.line)})`,
    stamp(locale),
  ]);
}

/* --- backend namespaces --------------------------------------------------- */

export async function namespaces() {
  const all = await getCollection('namespaces');
  return all.sort((a, b) => a.data.member.localeCompare(b.data.member));
}

export function namespaceMarkdown(entry: CollectionEntry<'namespaces'>, locale: Locale = 'en'): string {
  const d = entry.data;
  return lines([
    `# ${d.name}`,
    '',
    d.doc,
    '',
    `- ${t(locale, 'namespace.member')}: \`${d.member}\``,
    d.type ? `- ${t(locale, 'namespace.type')}: \`${d.type}\`` : null,
    `- ${t(locale, 'surface.stability')}: ${stability(d.experimental, locale)}`,
    `- ${t(locale, 'source.heading')}: [${d.path}#L${d.line}](${permalink(permalinkPin, d.path, d.line)})`,
    stamp(locale),
  ]);
}

/* --- single-page sections ------------------------------------------------- */

export async function plugins() {
  const all = await getCollection('plugins');
  return all.sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export async function releases() {
  return getCollection('releases');
}

export async function rules() {
  return getCollection('rules');
}

/** Blocks in a release: a paragraph or a list, nothing else. */
export type ReleaseBlock = CollectionEntry<'releases'>['data']['sections'][number]['blocks'][number];

export function blockMarkdown(block: ReleaseBlock): string {
  return block.kind === 'paragraph' ? block.text : bullets(block.items);
}

/* --- the whole generated route list --------------------------------------- */

/**
 * Every generated page in one locale, as Markdown. Paths carry the locale's
 * prefix (`ru/surfaces/thread-list`), and so do the links inside.
 */
export async function generatedPages(locale: Locale = 'en'): Promise<GeneratedPage[]> {
  const [s, byKind, ns, pl, rel, titles] = await Promise.all([
    surfaces(locale),
    slotsByKind(),
    namespaces(),
    plugins(),
    releases(),
    groupTitles(locale),
  ]);
  const sl = [...byKind.methods, ...byKind.builders];
  const md = await upstreamMarkdown(locale);
  const at = (path: string) => localePath(locale, path);
  const tr = (key: Parameters<typeof t>[1], vars?: Record<string, string | number>) =>
    t(locale, key, vars);

  /* Prose index pages live at the same paths; the Markdown twin carries both,
   * exactly as the HTML page does. */
  const prose = Object.fromEntries(
    await Promise.all(
      ['surfaces', 'frontend', 'backend', 'plugins', 'changelog'].map(
        async (id) => [id, await proseBody(id, locale)] as const,
      ),
    ),
  ) as Record<string, string | null>;
  const withProse = (id: string, body: string) =>
    prose[id] ? `${prose[id]}\n\n${body}` : body;

  const pages: GeneratedPage[] = [];
  const push = (page: GeneratedPage) => pages.push({ ...page, path: at(`/${page.path}`).slice(1) });

  push({
    path: 'surfaces',
    title: tr('surfaces.title'),
    description: tr('surfaces.lede'),
    markdown: withProse('surfaces', lines([
      `# ${tr('surfaces.title')}`,
      '',
      tr('surfaces.lede'),
      '',
      bullets(
        s.map(
          (e) =>
            `[${e.data.title}](${at(`/surfaces/${e.id}/`)}) — ${titles.get(e.data.group) ?? e.data.group} — ${md(e.data.summary)}`,
        ),
      ),
      stamp(locale),
    ])),
  });
  for (const entry of s) {
    push({
      path: `surfaces/${entry.id}`,
      title: entry.data.title,
      description: plainText(entry.data.summary),
      markdown: await surfaceMarkdown(entry, locale),
    });
  }

  push({
    path: 'frontend',
    title: tr('frontend.title'),
    description: tr('frontend.description'),
    markdown: withProse('frontend', lines([
      `# ${tr('frontend.title')}`,
      '',
      `## ${tr('frontend.slotMethods', { count: byKind.methods.length })}`,
      '',
      tr('frontend.slotMethodsNote'),
      '',
      bullets(
        byKind.methods.map(
          (e) => `[\`${e.data.name}\`](${at(`/frontend/${e.id}/`)}) — \`${e.data.registration}\``,
        ),
      ),
      '',
      `## ${tr('frontend.builderRegions', { count: byKind.builders.length })}`,
      '',
      tr('frontend.builderRegionsNote'),
      '',
      bullets(
        byKind.builders.map(
          (e) => `[\`${e.data.name}\`](${at(`/frontend/${e.id}/`)}) — \`${e.data.registration}\``,
        ),
      ),
      stamp(locale),
    ])),
  });
  for (const entry of sl) {
    push({
      path: `frontend/${entry.id}`,
      title: entry.data.name,
      description: `${tr('slot.registeredWith')} ${entry.data.registration}`,
      markdown: slotMarkdown(entry, locale),
    });
  }

  push({
    path: 'backend',
    title: tr('backend.title'),
    description: tr('backend.description'),
    markdown: withProse('backend', lines([
      `# ${tr('backend.title')}`,
      '',
      bullets(ns.map((e) => `[\`${e.data.name}\`](${at(`/backend/${e.id}/`)}) — ${e.data.doc}`)),
      stamp(locale),
    ])),
  });
  for (const entry of ns) {
    push({
      path: `backend/${entry.id}`,
      title: entry.data.name,
      description: entry.data.doc,
      markdown: namespaceMarkdown(entry, locale),
    });
  }

  push({
    path: 'plugins',
    title: tr('plugins.title'),
    description: tr('plugins.description'),
    markdown: withProse('plugins', lines([
      `# ${tr('plugins.title')}`,
      '',
      bullets(
        pl.map(
          (e) =>
            `**${e.data.name}** (\`${e.data.id}\`, ${e.data.dir}) — ${e.data.description ?? tr('plugins.noDescription')}`,
        ),
      ),
      stamp(locale),
    ])),
  });

  push({
    path: 'changelog',
    title: tr('changelog.title'),
    description: tr('changelog.description'),
    markdown: withProse('changelog', lines([
      `# ${tr('changelog.title')}`,
      '',
      rel
        .map((e) =>
          lines([
            `## ${e.data.version}${e.data.date ? ` — ${e.data.date}` : ''}`,
            '',
            e.data.headline ?? null,
            '',
            ...e.data.lede.map(blockMarkdown),
            ...e.data.sections.map((section) =>
              lines([`### ${section.title}`, '', ...section.blocks.map(blockMarkdown)]),
            ),
          ]),
        )
        .join('\n\n'),
      stamp(locale),
    ])),
  });

  push({
    path: 'map',
    title: tr('zonemap.title'),
    description: tr('zonemap.description'),
    markdown: lines([
      `# ${tr('zonemap.title')}`,
      '',
      tr('mapPage.markdown', { path: at('/map/') }),
      stamp(locale),
    ]),
  });

  return pages;
}

/* --- the brief corpus ------------------------------------------------------
 *
 * One generator instance for the whole build. `createBriefs` is given the data
 * and the pin and hands back `build`, `markdown` and `basket`; every brief on
 * the site comes out of this one object.
 */

let generator: ReturnType<typeof createBriefs> | null = null;

export async function briefGenerator() {
  if (!generator) {
    const [g, s, sym, pl] = await Promise.all([
      groups(),
      surfaces(),
      getCollection('symbols'),
      plugins(),
    ]);
    generator = createBriefs({
      pin: briefPin,
      groups: g.map((e) => e.data),
      surfaces: s.map((e) => e.data),
      symbols: sym.map((e) => e.data),
      plugins: pl.map((e) => e.data),
    });
  }
  return generator;
}

export interface BriefBundle {
  brief: Brief;
  markdown: string;
  mention: BbMention | null;
}

/**
 * Everything a page's brief controls need, rendered at build time.
 *
 * The controls ship no generator: a reference page gets its Markdown and its
 * clipboard payload as data in the HTML, which is what keeps a generated page
 * at about 18 KB of JavaScript.
 *
 * The bb mention is a surface-only payload — it pastes into bb's composer as a
 * real mention of a Plugin Guide surface, and a slot or a namespace has no
 * surface id to name.
 */
export async function briefBundle(
  kind: Brief['kind'],
  id: string,
): Promise<BriefBundle | null> {
  const api = await briefGenerator();
  let brief: Brief;
  try {
    brief = api.build(kind, id);
  } catch {
    /* A record with no annotation gets no controls rather than a half brief. */
    return null;
  }
  const surface =
    kind === 'surface' ? (await surfaces()).find((e) => e.id === id)?.data ?? null : null;
  return {
    brief,
    markdown: renderBrief(brief, briefPin, RULES),
    mention: surface ? bbMention(surface) : null,
  };
}

export async function briefs(): Promise<Brief[]> {
  const api = await briefGenerator();
  const kinds = ['surface', 'slot', 'namespace', 'advanced'] as const;
  return kinds.flatMap((kind) => api.ids(kind).map((id) => api.build(kind, id)));
}
