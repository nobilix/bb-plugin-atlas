# Documentation structure

How the site is organized for a reader who is about to write their first bb plugin, and the writing rules the prose follows.

## Checkpoint

`Kind: explanation + tutorial + reference, one kind per page | Audience: a developer who knows TypeScript and React, has used bb, and has never written a plugin | Purpose: build a correct mental model of bb and of a plugin, general to specific, then find the exact API in the reference | Non-goals: restating bb's source, teaching TypeScript, React or zod, documenting unreleased API`

## Structural rules

The structure serves a first-time reader, not someone who already knows bb's internals. Four rules follow:

1. Learning pages carry no reference detail. The scaffold tree, the manifest line by line, the load and dispose orders, the statuses and the origin guard live on reference pages; a learning page names only the facts that shape a design.
2. bb itself is explained from a plugin author's point of view before the plugin is. Threads, environments, hosts and the host daemon get their own page, not rows in a table inside Architecture.
3. One page answers the first design question: "I want my plugin to do X; where does it go?"
4. Each fact lives in one place, and other pages link to it.

## The reading path

The sidebar is ordered from general to specific. Each page states in its first paragraph what the reader will know after it.

| Group | Page | Route | Kind | The reader leaves knowing |
|---|---|---|---|---|
| Learn | Overview | `/` | orientation | what the site covers and the order to read it in |
| Learn | How bb works | `/concepts/` | explanation | bb's processes and domain objects, and that bb's own features are plugins |
| Learn | How a plugin works | `/architecture/` | explanation | the three entries, how they talk, where state lives, the load cycle, the trust level |
| Learn | Your first plugin | `/start/` | tutorial | how to scaffold, install, run and change a plugin, and where each piece of the scaffold sits in the model |
| Learn | Choosing a surface | `/choose/` | how-to | which surface, registration call and first-party plugin fit a given idea |
| Build and ship | Testing | `/testing/` | how-to | how to test each entry without a running bb |
| Build and ship | Trust model | `/trust/` | explanation | what plugin code can reach, and the design rules that follow |
| Reference | Surfaces, Frontend slots, Backend namespaces, UI zone map | generated, each opened by an introduction from `src/content/intros/` | reference | the exact API, exhaustively |
| Reference | Package anatomy | `/package/` | reference | every manifest field, the dependency rule, the files on disk |
| Reference | CLI and distribution | `/cli/` | reference | every `bb plugin` command, install kinds, publishing |
| Reference | Runtime and lifecycle | `/runtime/` | reference | load and dispose order, statuses, reload semantics, services and schedules |
| Extension points | `advanced/*` | unchanged | reference | agent, environment and machine providers, host workers, AI services, browsers, thread metadata |
| Catalog | Plugins, Changelog, Glossary, About | unchanged | reference | |

## Rules for what goes where

- **One kind per page.** An explanation page shows at most one short code shape per concept and links the reference for the rest. The tutorial shows only the code the reader reads or types. Signatures, field tables, limits and step orders live in the reference.
- **Code is linked, not reprinted.** A reader who needs the full scaffold opens the scaffold; the page names the file and says what to look for in it.
- **One fact, one home.** Lifecycle facts belong to `/runtime/`, limits to the Backend namespaces page, manifest fields to `/package/`, the "for X, read plugin Y" table to `/choose/`. Everything else links.
- **Conclusion first** at page, section and paragraph level.

## Style

The English prose: no em or en dashes, sentence-case headings, one term per concept per `TRANSLATION-GUIDE.md`'s glossary, sentences under 35 words, conclusion first.

The Russian pages keep Russian typography, including the dash: `TRANSLATION-RU.md` requires it and the content QA test enforces it. This is an exception to the dash rule, bounded to the `ru` locale, because the dash is grammar in Russian rather than an aside marker.

## Verification

- `pnpm run verify` (typecheck, build, tests, e2e).
- A fresh-eyes read of every rewritten English page before it ships.
