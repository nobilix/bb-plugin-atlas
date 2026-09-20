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

/** `''` for English, `/ru` for Russian. */
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

/** A site path in a locale: `localePath('ru', '/surfaces/')` is `/ru/surfaces/`. */
export function localePath(locale: Locale, path: string): string {
  return `${localePrefix(locale)}${path}`;
}

/** `getStaticPaths` entries for a page under `src/pages/[...lang]/`. */
export function localeParams() {
  return LOCALES.map((locale) => ({
    params: { lang: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }));
}
