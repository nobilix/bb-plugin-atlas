/*
 * Agent endpoint: every page as raw Markdown at `/<path>.md`.
 *
 * Two sources, one route, so no page can have an HTML twin without a Markdown
 * one: prose pages serve the file body from the docs collection; generated
 * pages serve the Markdown that `lib/generated.ts` builds from the same records
 * the HTML is rendered from.
 *
 * `/` is served at `/index.md`. Every locale gets the same set: a Russian page
 * at `/ru/<path>/` has its twin at `/ru/<path>.md`, in Russian, and `/ru/` is
 * `/ru.md`. The agent corpus proper — `/llms*.txt` and `/briefs.json` — is
 * English only.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generatedPages } from '../lib/generated';
import { LOCALES } from '../i18n/routes';

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection('docs');

  const prose = docs.map((entry) => {
    const slug = entry.id === '' || entry.id === 'index' ? 'index' : entry.id;
    const title = entry.data.title;
    const description = entry.data.description;
    const body = (entry.body ?? '').trim();
    const markdown = [
      `# ${title}`,
      '',
      description ? `> ${description}\n` : '',
      body,
      '',
    ].join('\n');
    return { params: { path: slug }, props: { markdown } };
  });

  const perLocale = await Promise.all(LOCALES.map((locale) => generatedPages(locale)));
  const generated = perLocale.flat().map((page) => ({
    params: { path: page.path },
    props: { markdown: page.markdown },
  }));

  return [...generated, ...prose];
};

export const GET: APIRoute = ({ props }) =>
  new Response(String(props.markdown), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
