# How the atlas is built and maintained

The site has two layers. The reference is generated from the bb repository at a pinned commit and regenerates on every release. The explanations, the annotations behind the agent briefs and the translations are written by hand and held to the generated data by tests.

## Repository layout

| Path | What |
|---|---|
| `pin.json` | the bb release the site describes: tag, commit, bb and SDK versions |
| `sync/` | `pnpm sync`: reads the bb clone at the pinned commit and writes `data/` |
| `data/` | the generated corpus, committed so an upstream change arrives as a readable diff |
| `packages/atlas-core/` | the Zod schemas of `data/`, the permalink builder, the zone-map route grammar, the curated annotations and rules, and the brief generator |
| `site/` | the Astro + Starlight site; its own [README](../site/README.md) covers routes, locales and components |
| `translations/ru/` | the Russian text of surfaces and groups, keyed by a hash of the English record |
| `tests/` | sync, integrity and content checks over `data/` and the built site, and the Playwright suite |
| `docs-internal/` | this file, the documentation structure, the translation contracts, and what was verified against bb |

## Layer 1: generated from bb

`pnpm sync` reads a clone of `get-bb/bb` through `git show <commit>:<path>`, so a dirty working tree in the clone cannot leak in. `pnpm bb:clone` creates a small bare clone at `.cache/bb.git`; `BB_REPO=/path/to/bb` points at another one. The sync validates every file against the schemas in `packages/atlas-core/src/schema.ts` before writing, and exits non-zero on a schema violation, an unresolved symbol or a surface count other than 46. Run twice, it produces byte-identical files; `tests/sync.test.ts` checks that.

| File | From | Records |
|---|---|---|
| `surfaces.json` | `packages/plugin-api-map/src/surfaces.ts` | 7 groups, 46 surfaces |
| `symbols.json` | the SDK sources | every SDK symbol a surface or card names, with its path and line |
| `slots.json`, `namespaces.json` | `plugin-sdk/src/app-contract.ts`, `backend-contract.ts` | `PluginAppSlots` methods and builder regions; `BbPluginApi` members |
| `plugins.json` | `plugins/bb-official.json` and each plugin's `package.json` | first-party plugins and examples |
| `releases.json` | `CHANGELOG.md`, parsed by bb's own parser | releases with dates |
| `rules.json` | `packages/atlas-core/src/rules.ts` | the curated rule bank, validated like the rest |
| `delta.json` | the pinned tag against `main` | what exists upstream but is not in the release, so the site can label it unreleased |

The site's content-layer loader (`site/src/loaders/atlas-json.ts`) reads these files into collections and validates them again; from them `site/src/pages/[...lang]/` builds the surface, slot, namespace, plugin and changelog pages in both locales, the zone map, `/briefs.json` and the `/<path>.md` twins.

## Layer 2: written by hand

- **Prose**: `site/src/content/docs/` (the guide, the tutorial, the reference pages that are not generated) and `site/src/content/intros/` (the introduction above each generated index). `DOCS-STRUCTURE.md` says what goes on which page.
- **Annotations**: `packages/atlas-core/src/annotations.ts`. For each surface, slot and namespace: the manifest entry that registers it, the registration call, the props type, whether a second plugin can share it, the first-party plugin to read, and a definition of done. Upstream carries none of this; it was established by reading the repository. The brief generator renders it.
- **Rules**: `packages/atlas-core/src/rules.ts`, the bank a brief cites by id.
- **Russian**: the pages under `docs/ru/` and `intros/ru/`, translated under `TRANSLATION-RU.md`, and `translations/ru/surfaces.json` for the surface text.

## What holds the hand-written layer to the data

`pnpm test` runs, over `data/` and the built site:

- every rule id and plugin id in the annotations resolves in `data/`;
- every inline code span on a page exists in `data/` or somewhere in the bb tree at the pinned commit (`tests/content-qa.test.ts`; the few exceptions are listed there with a reason each);
- every permalink points at the pinned commit and at a line that exists in the file;
- every page exists in both locales, every internal link resolves, and links on a Russian page stay in `/ru/`;
- every Russian page carries the sha256 of the English file it was translated from and fails when the English changed; a surface translation whose English record changed is not shown, the English is;
- nothing that exists only on `main` is presented as shipped.

`pnpm test:e2e` checks the zone map and the header in a browser. `pnpm verify` runs typecheck, build, both suites.

## Moving to a new bb release

1. `upstream-watch.yml` runs daily and opens an issue when a newer `desktop-v*` tag exists, with the delta the sync computes.
2. Set the new tag, commit and versions in `pin.json`; run `pnpm sync`; read the diff in `data/`. A surface id that moved is a breaking change for links, not a refresh.
3. If the surface count changed, the sync stops: add the new surface's annotation in `annotations.ts`, then update `EXPECTED_SURFACE_COUNT` in `sync/surfaces.mjs` and the frozen id list in `tests/sync.test.ts`. If a symbol was renamed or removed, `pnpm test` names every page and annotation that still cites it.
4. Re-read `VERIFIED-AT-PIN.md`: its verdicts are about the old pin. Read the release's changelog against the prose; the tests catch a name that changed, not a behaviour that changed under the same name.
5. Retranslate what changed. `pnpm test` lists every Russian page and surface entry whose English source moved, until each is retranslated and its `sourceHash` updated (`node translations/ru/hash.mjs --check` for the surfaces).
6. `pnpm verify`, then merge. `deploy.yml` publishes `main`.

## Deploy

`deploy.yml` builds and publishes `site/dist` to Cloudflare Pages on every push to `main`. `SITE_URL` is a repository variable and is used only for the absolute URLs in `llms.txt` and the sitemap; every internal link is relative. The secrets are `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
