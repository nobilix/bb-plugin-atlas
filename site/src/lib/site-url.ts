/*
 * No origin is hard-coded: `SITE_URL` in the environment is the single place
 * it is set.
 *
 * `localhost` is the *development* default, never a production origin: the
 * deploy job sets SITE_URL and every internal link on the site is relative, so
 * a wrong value here cannot leak into a page's own navigation. It only affects
 * absolute URLs in llms.txt and the sitemap.
 */
export const SITE_URL = process.env.SITE_URL || 'http://localhost:4321';
