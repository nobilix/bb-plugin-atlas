/*
 * Agent endpoint: the whole brief corpus at one stable URL.
 *
 * The briefs themselves come from atlas-core through `lib/atlas-core.ts`, so
 * this endpoint and the in-page "Brief for agent" button can never diverge.
 */
import type { APIRoute } from 'astro';
import { briefs } from '../lib/generated';
import { RULES } from '../lib/atlas-core';
import { pin } from '../lib/pin';

export const prerender = true;

export const GET: APIRoute = async () => {
  const corpus = await briefs();
  const body = {
    $schema: 'https://github.com/nobilix/bb-plugin-atlas#briefs',
    /* The whole pin, not a description of it: a consumer rendering one of these
     * briefs needs the same object the generator was given, and a permalink
     * refuses to be built without `permalinkBase` or `url`. */
    generatedFor: {
      bbVersion: pin.upstream.bbVersion,
      sdkVersion: pin.upstream.sdkVersion,
      commit: pin.upstream.commit,
      tag: pin.upstream.tag,
      url: pin.upstream.url,
      permalinkBase: pin.permalinkBase,
    },
    count: corpus.length,
    /* The rule bank travels with the corpus. A brief cites rules by id, and the
     * set panel in the browser renders Markdown from these records — shipping
     * 19 KB of rule prose in every page's JavaScript to do that would double
     * what a generated page ships. */
    rules: RULES,
    briefs: corpus,
  };
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
};
