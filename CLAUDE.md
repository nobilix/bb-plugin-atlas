# bb plugin atlas

- How the site is built and how to move it to a new bb release: `docs-internal/HOW-IT-WORKS.md`.
- What goes on which page, and the reading path: `docs-internal/DOCS-STRUCTURE.md`. English terminology: the glossary in `docs-internal/TRANSLATION-GUIDE.md`. Russian pages: `docs-internal/TRANSLATION-RU.md`.
- Every English page has a Russian twin under `site/src/content/docs/ru/` with a `sourceHash` of the English file; `pnpm test` fails when they drift.
- `pnpm run verify` is the full check.
