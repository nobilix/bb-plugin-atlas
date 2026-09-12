/*
 * Surface and group text in another language, laid over the English records.
 *
 * `data/surfaces.json` is upstream's own text and stays English: it is what
 * the briefs, `/briefs.json` and the bb mention are built from. A translation
 * lives beside it in `translations/<locale>/surfaces.json`, one entry per id,
 * and each entry records the hash of the English text it was made from.
 *
 * An entry is used only while that hash still matches the current English
 * record. A missing or stale entry falls back to English: an untranslated
 * surface is a gap, a stale translation is a wrong claim. The build never
 * fails on either — `tests/content-qa.test.ts` does, so CI catches both.
 */
import { groupHash, surfaceHash } from '../../../translations/ru/hash.mjs';
import ruOverlay from '../../../translations/ru/surfaces.json';
import type { Locale } from '../i18n/ui';

interface SurfaceText {
  title: string;
  summary: string;
  bullets: string[];
  tagline?: string | null;
}

interface GroupText {
  title: string;
  blurb: string;
  sections?: { title: string; surfaceIds: string[] }[];
}

interface Overlay {
  groups: Record<
    string,
    { sourceHash: string; title: string; blurb: string; sections?: Record<string, string> }
  >;
  surfaces: Record<string, { sourceHash: string } & SurfaceText>;
}

const OVERLAYS: Partial<Record<Locale, Overlay>> = { ru: ruOverlay };

/** A surface's reader-facing text in `locale`, or its English text. */
export function localizeSurface<T extends SurfaceText & { id: string }>(surface: T, locale: Locale): T {
  const entry = OVERLAYS[locale]?.surfaces[surface.id];
  if (!entry || entry.sourceHash !== surfaceHash(surface)) return surface;
  return {
    ...surface,
    title: entry.title,
    summary: entry.summary,
    bullets: entry.bullets,
    tagline: entry.tagline ?? surface.tagline,
  };
}

/** A group's title, blurb and section titles in `locale`, or its English text. */
export function localizeGroup<T extends GroupText & { id: string }>(group: T, locale: Locale): T {
  const entry = OVERLAYS[locale]?.groups[group.id];
  if (!entry || entry.sourceHash !== groupHash(group)) return group;
  return {
    ...group,
    title: entry.title,
    blurb: entry.blurb,
    sections: group.sections?.map((section) => ({
      ...section,
      title: entry.sections?.[section.title] ?? section.title,
    })),
  };
}
