// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import starlightLlmsTxt from 'starlight-llms-txt';
import { SITE_URL } from './src/lib/site-url.js';
import remarkDiagramBoard from './src/components/remark-diagram-board.mjs';

/*
 * Versions are pinned exactly in package.json, on purpose: Starlight ships
 * breaking changes in minors (0.39 changed sidebar autogeneration, 0.41
 * required Astro v7, 0.42 rewrote the mobile menu and removed `tagline`).
 * A caret here would be a silent redesign on some future install.
 */

export default defineConfig({
  /* The domain is undecided. `site` comes from the environment and is used for
   * absolute URLs in llms.txt only — every internal link on the site is
   * relative. starlight-llms-txt refuses to load without it. */
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },

  /* The prose marks each diagram with an MDX comment naming the board; this
   * rewrites those markers into the real component. The MDX
   * integration extends this config, so one registration covers .md and .mdx. */
  markdown: { remarkPlugins: [remarkDiagramBoard] },

  integrations: [
    /* React is available for opt-in islands. It is never mounted from a shared
     * layout: one `client:load` island costs ~213 KB on the page it lands on. */
    react(),

    starlight({
      /* The name is a name: the Russian home page keeps it too. */
      title: 'bb plugin atlas',
      description:
        'Every surface a bb plugin can occupy, with the API that reaches it, pinned to a released version of bb.',
      /* English at the root, Russian under `/ru/`. Starlight's own language
       * picker is the switch: it sits beside the theme select in the header
       * and in the phone menu, and it lands on the same page in the other
       * language, generated pages included (`src/pages/[...lang]/`). Pagefind
       * indexes each language separately by `<html lang>`, and
       * starlight-llms-txt reads the default locale only, so `/llms*.txt`
       * stay English. `src/i18n/routes.ts` lists the same locales. */
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        ru: { label: 'Русский', lang: 'ru' },
      },
      customCss: ['./src/styles/tokens.css', './src/styles/theme.css'],
      components: {
        /* Adds "Copy page as Markdown" beside the page title. */
        PageTitle: './src/components/overrides/PageTitle.astro',
        /* Adds the "Zone map" link to the header and to the phone menu. */
        SocialIcons: './src/components/overrides/SocialIcons.astro',
      },
      head: [
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Sen:wght@400;500;600;700&display=swap',
          },
        },
      ],
      /* Pagefind is on by default and only works in a production build. */
      pagefind: true,
      lastUpdated: false,
      credits: false,
      plugins: [
        starlightLlmsTxt({
          projectName: 'bb plugin atlas',
          description:
            'A reference atlas of every surface a bb plugin can occupy, generated from a pinned release of bb.',
          details: [
            'This documentation describes the shipped release bb 0.43.3 (SDK 0.4.104), pinned to commit e865697.',
            'Identifiers, paths, CLI commands and UI strings are reproduced exactly as bb writes them.',
            'Anything marked "unreleased" is on the upstream main branch but is not in 0.43.3 — do not treat it as available.',
          ].join('\n\n'),
          optionalLinks: [
            {
              label: 'Brief corpus (JSON)',
              url: '/briefs.json',
              description: 'Every surface, slot and namespace as a machine-readable brief.',
            },
          ],
        }),
      ],
      /* The route map from SITE-SPEC. Prose targets live in src/content/docs/;
       * the generated sections are built from the content-layer loader. */
      sidebar: [
        /* Links are written once; Starlight prefixes them with `/ru` on
         * Russian pages. Labels follow TRANSLATION-RU's glossary. The order is
         * the reading path from docs-internal/DOCS-STRUCTURE.md: bb as a whole,
         * then a plugin, then the tutorial, then choosing a surface; the
         * reference comes after it. */
        {
          label: 'Start here',
          translations: { ru: 'Начало' },
          items: [
            { label: 'Overview', translations: { ru: 'Обзор' }, link: '/' },
            { label: 'How bb works', translations: { ru: 'Как устроен bb' }, link: '/concepts/' },
            {
              label: 'How a plugin works',
              translations: { ru: 'Как устроен плагин' },
              link: '/architecture/',
            },
            { label: 'Your first plugin', translations: { ru: 'Первый плагин' }, link: '/start/' },
            {
              label: 'Choosing a surface',
              translations: { ru: 'Выбор поверхности' },
              link: '/choose/',
            },
          ],
        },
        {
          label: 'Practice',
          translations: { ru: 'Практика' },
          items: [
            { label: 'Testing', translations: { ru: 'Тестирование' }, link: '/testing/' },
            { label: 'Trust model', translations: { ru: 'Модель доверия' }, link: '/trust/' },
          ],
        },
        {
          label: 'Reference',
          translations: { ru: 'Справочник' },
          items: [
            { label: 'Surfaces', translations: { ru: 'Поверхности' }, link: '/surfaces/' },
            { label: 'Frontend slots', translations: { ru: 'Слоты фронтенда' }, link: '/frontend/' },
            {
              label: 'Backend namespaces',
              translations: { ru: "Namespace'ы бэкенда" },
              link: '/backend/',
            },
            { label: 'UI zone map', translations: { ru: 'Макет UI-зон' }, link: '/map/' },
            { label: 'Package anatomy', translations: { ru: 'Анатомия пакета' }, link: '/package/' },
            { label: 'CLI and distribution', translations: { ru: 'CLI и дистрибуция' }, link: '/cli/' },
            {
              label: 'Runtime and lifecycle',
              translations: { ru: 'Рантайм и жизненный цикл' },
              link: '/runtime/',
            },
            { label: 'Glossary', translations: { ru: 'Глоссарий' }, link: '/glossary/' },
          ],
        },
        {
          /* Autogenerated, so pages added under `advanced/` appear without a
           * config change. Everything else is listed by hand, because the
           * route map is the contract, not the file tree. */
          label: 'Advanced',
          translations: { ru: 'Продвинутое' },
          /* Starlight 0.39 removed `autogenerate` beside `label` on a group;
           * it now goes inside `items`. This is the breaking-change-in-a-minor
           * the spec warned about, which is why the versions are pinned exact. */
          items: [{ autogenerate: { directory: 'advanced' } }],
        },
        {
          label: 'Catalog',
          translations: { ru: 'Каталог' },
          items: [
            { label: 'Plugins', translations: { ru: 'Плагины' }, link: '/plugins/' },
            { label: 'Changelog', link: '/changelog/' },
            { label: 'About', translations: { ru: 'Об этом сайте' }, link: '/about/' },
          ],
        },
      ],
    }),
  ],
});
