/*
 * Where each locale's pages live. English is Starlight's root locale and has
 * no prefix; every other locale lives under `/<locale>/` (the `locales` block
 * in astro.config.mjs, which this list must match — `tests/routes.test.ts`
 * checks that every page exists in every locale).
 *
 * The generated pages sit under `src/pages/[...lang]/`: one file per route,
 * built once per locale, with `lang` undefined for the root.
 */
import { DEFAULT_LOCALE, ui, type Locale } from './ui';

export const LOCALES = Object.keys(ui) as Locale[];

/** Astro's `base` without its trailing slash: `''` at the root, `/bb-plugin-atlas` under one. */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** `''` for English, `/ru` for Russian. Locale only: the route as Astro names it. */
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

/** What every link the site writes itself starts with: the base, then the locale. */
export function linkPrefix(locale: Locale): string {
  return `${BASE}${localePrefix(locale)}`;
}

/** Markdown as written, with its root links given the base: `](/start/)` becomes `](<base>/start/)`. */
export function markdownWithBase(markdown: string): string {
  return markdown.replaceAll('](/', `](${BASE}/`);
}

/** An href in a locale: `localePath('ru', '/surfaces/')` is `/ru/surfaces/`, plus the base. */
export function localePath(locale: Locale, path: string): string {
  return `${linkPrefix(locale)}${path}`;
}

/** `getStaticPaths` entries for a page under `src/pages/[...lang]/`. */
export function localeParams() {
  return LOCALES.map((locale) => ({
    params: { lang: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }));
}
