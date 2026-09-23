/*
 * `SITE_URL` is the one place the public address is set: the origin, plus the
 * path when the site is served from a subdirectory (GitHub Pages serves a
 * project at `https://<user>.github.io/<repo>`). Astro takes the two halves
 * separately: `site` for the absolute URLs in llms.txt and the sitemap, `base`
 * for every internal link.
 *
 * `localhost` is the development default, never a production origin.
 */
const url = new URL(process.env.SITE_URL || 'http://localhost:4321');

export const SITE_ORIGIN = url.origin;

/** `''` at the root, `/bb-plugin-atlas` under a subdirectory: no trailing slash. */
export const SITE_BASE = url.pathname.replace(/\/+$/, '');
