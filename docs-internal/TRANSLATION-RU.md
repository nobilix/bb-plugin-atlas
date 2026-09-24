# Russian locale: English pages → Russian pages

The Russian pages under `site/src/content/docs/ru/` and `site/src/content/intros/ru/` are written **from the current English MDX**. The English pages carry the facts: the pinned release bb 0.43.3 / SDK 0.4.104, the 22 / 5 / 6 / 27 count vocabulary, the verified claims in `VERIFIED-AT-PIN.md`.

How Russian is written — voice, accuracy rules, glossary — is in [`translations/ru/STYLE.md`](../translations/ru/STYLE.md). It is the system prompt of the translation script and the guide for editing a page by hand, so there is one set of rules for both.

## Page contract

- The file tree mirrors English exactly: `site/src/content/docs/<path>.mdx` → `site/src/content/docs/ru/<path>.mdx`, and the introductions of the generated index pages `site/src/content/intros/<id>.mdx` → `site/src/content/intros/ru/<id>.mdx`.
- Front matter keeps every English key in the same order and adds two: `sourceHash` (sha256 of the English file's bytes at translation time) and `sourcePath` (the English file, repo-relative). `pnpm test` compares `sourceHash` with the current English file and fails on a Russian page whose source changed.
- `title` and `description` are translated; the other keys are copied.
- Same headings, same levels, same order; code spans in headings stay.
- `{/* permalink: … */}` and `{/* DiagramBoard: … */}` markers and fenced code blocks are byte-identical to English, at the same positions.
- Every inline code span in a Russian page exists verbatim as a code span in its English source, and none is lost.
- Asides keep their type; the bracketed title is translated.
- Internal links go to the `/ru/…` equivalent. `/llms.txt`, `/llms-full.txt` and `/briefs.json` are English-only and keep their links.

The site's own UI strings are in `site/src/i18n/ui.ts`; the reader-facing text of the surfaces is in `translations/ru/surfaces.json`, keyed by id with a `sourceHash` of the English record.

## Updating the Russian pages

`translations/ru/translate.py` writes a Russian page from its English source with the Gemini API, in three passes: a first draft with the whole English site as context, a pass that rewrites whatever still reads as a translation, and a check that compares the two pages and fixes meaning only. It prints every fix the check made, and what the run cost.

```sh
uv run translations/ru/translate.py docs/start.mdx   # the pages whose English changed
uv run translations/ru/translate.py --check          # only the meaning check, on the pages as they are
uv run translations/ru/translate.py --report         # glossary forms STYLE.md rules out
```

The key is `$GEMINI_API_KEY` or the macOS keychain item `gemini-api-key`. Read the printed fixes, then `pnpm build && pnpm test`. For a one-sentence change in English, editing the Russian page by hand and updating its `sourceHash` is simpler.
