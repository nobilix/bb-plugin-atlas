# English pages: voice and terminology

English is the source language of the site. The Russian locale is translated from the English pages (`TRANSLATION-RU.md`), and everything written for an agent — briefs, the bb mention, `/briefs.json`, `/llms*.txt` — is English only.

## Voice

Technical documentation for developers who already know React, TypeScript and Node. Plain, direct, no marketing. American spelling. Present tense for how things work ("the factory runs in the server process"), imperative for instructions ("run `bb plugin build`").

The voice is analytical: short declarative sentences, no hedging, facts with sources. Do not inflate it into the padded style of typical vendor docs. A fact that fits in eight words does not take twenty-five.

## Never translate

- Identifiers, type names, methods, file paths, CLI commands, env vars, manifest keys.
- bb's own UI strings: `New thread`, `Search threads`, `Plugins`, `Skills`, `Report a bug`, `Quick palette`, `Open settings`, tab names, button labels. These must match what the user sees on screen.
- Plugin ids and display names as upstream writes them (`simple-notes`, `Side chat`).
- Error strings and log lines.

## Glossary — one English term per concept

| Russian | English | Never use |
|---|---|---|
| поверхность | surface | area, zone (except the visual "zone overlay" on the map) |
| слот | slot | hook, extension point |
| точка входа | entry | entrypoint, entry file |
| бэкенд-вход / `bb.server` | server entry | backend |
| фронтенд-вход / `bb.app` | app entry | frontend bundle (ok once, in passing) |
| хост-вход / `bb.host` | host entry | — |
| хост-воркер | host worker | host process |
| встроенный плагин | first-party plugin | built-in plugin, official plugin |
| фабрика | factory | constructor, initializer |
| поток / тред | thread | conversation |
| окружение | environment | workspace (workspace is the directory) |
| машина | machine | host (host is the daemon identity) |
| провайдер агента | agent provider | model provider |
| диспетчеризация | dispatch | routing |
| бриф для агента | agent brief | prompt, spec |
| набор | set | basket, cart |
| макет зон | zone map | mockup, wireframe |
| доска (диаграмма) | board | diagram (fine in prose, `board` in component names) |
| полное доверие | full trust | sandboxed (never — it is the opposite) |

## Accuracy rules

1. **Never upgrade a hedge into a claim.** A fact checked at one version is "as verified at the pinned commit", not "always".
2. A claim that could not be confirmed is labelled **"not verified"** and keeps that label. Do not quietly drop it.
3. Numbers, versions, line counts and dates come from `data/` or the pin, never rounded or re-derived.
4. The author's own measurements use either the passive or "this guide"; do not invent a corporate "we" that implies a team.
5. Security wording is load-bearing: `full-trust`, `plaintext`, `0600`, `unauthenticated` must survive translation exactly. Softening them is a correctness bug, not a style choice.

## Checks

1. Hand-written permalinks and symbol mentions are replaced by the generated helpers; prose never hard-codes a link into upstream.
2. `tests/content-qa.test.ts` requires every code span on a page to exist in `data/` or in the bb tree at the pinned commit.
3. A human reads the trust model page and the quick start end to end after any change; those two carry the highest cost of a subtle mistake.
