# Russian locale: English pages → Russian pages

The Russian pages under `site/src/content/docs/ru/` are translated **from the current English MDX**. The English pages carry the facts: the pinned release bb 0.43.3 / SDK 0.4.104, the 22 / 5 / 6 / 27 count vocabulary, the verified claims in `VERIFIED-AT-PIN.md`.

This file is the reverse of `TRANSLATION-GUIDE.md`: same accuracy rules, applied from English to Russian.

## Page contract

- The file tree mirrors English exactly: `site/src/content/docs/<path>.mdx` → `site/src/content/docs/ru/<path>.mdx`, and the introductions of the generated index pages `site/src/content/intros/<id>.mdx` → `site/src/content/intros/ru/<id>.mdx`.
- Front matter keeps every English key in the same order (`title`, `description`, `sidebar.order`, `sourceSection`) and adds two: `sourceHash` (sha256 of the English file's bytes at translation time) and `sourcePath` (the English file, repo-relative). A CI check compares `sourceHash` with the current English file and flags a Russian page whose source changed.
- `title` and `description` are translated. `sidebar.order` and `sourceSection` are copied.
- Same headings, same levels, same order. Heading text is translated; code spans in headings stay.
- Every `{/* permalink: … */}` and `{/* DiagramBoard: … */}` marker is byte-identical to English and stays at the same position.
- Fenced code blocks are byte-identical to English, comments included. The site's generated permalinks and the identifier-fidelity check read them.
- Every inline code span in a Russian page exists verbatim as a code span in its English source.
- Asides (`:::note`, `:::caution`, `:::danger`) keep their type; the bracketed title is translated.
- Internal links go to the `/ru/…` equivalent, generated reference routes included (`/ru/surfaces/`, `/ru/frontend/`, `/ru/backend/`, `/ru/plugins/`, `/ru/changelog/`, `/ru/map/`). The agent-facing artifacts `/llms.txt`, `/llms-full.txt` and `/briefs.json` are English-only and keep their links.

## Voice

Analytical Russian: short declarative sentences, facts with sources, no hedging, no padding. If English states a fact in ten words, Russian does not take twenty. No calques ("является", "осуществляет", "данный", "в рамках", "производит проверку"): write «проверяет», not «осуществляет проверку».

- Present tense for how things work, imperative for instructions («запустите `bb plugin build`»). Address the reader as «вы» where English says "you"; drop the pronoun where Russian reads better without it.
- English "this site" / "this guide" → «этот сайт» / «этот гайд». No corporate «мы».
- Quotations from the repository, the SDK docs and code comments stay in English, inside «ёлочки». They are evidence; a translated quote is no longer a quote. The Russian sentence around them carries the meaning.
- bb UI strings (`New thread`, `Search threads`, `Plugins`, `Skills`, `Quick palette`, `Open settings`, tab names, button labels, plugin display names such as `Example todos`, `Side chat`) stay in English, as the user sees them on screen.
- Typography: «ёлочки» for Russian quotes, em dash with spaces ( — ), «ё» where it belongs, no abbreviations like «т. е.» (write «то есть»).
- English terms kept in Latin take Russian case endings with an apostrophe where the ending would otherwise glue to the word: thread'а, namespace'ы, skill'ы.

## Accuracy rules

1. Never upgrade a hedge into a claim. "as verified at the pinned commit" stays «на закреплённом коммите», not «всегда».
2. "not verified" → **«не проверено»**, and the label stays wherever English has it.
3. Numbers, versions, line counts and dates are copied, never rounded or re-derived. Counts use the fixed vocabulary: «22 метода-слота», «пять регионов билдера», «шесть членов `PluginAppBuilder`», «27 точек регистрации». Never «25 слотов».
4. Security wording is load-bearing and must survive in meaning: full trust («полное доверие», attributive «full-trust»), plaintext («plaintext», «plaintext на диске»), `0600`, unauthenticated local API («неаутентифицированный локальный API»). Softening any of them is a correctness bug.
5. Identifiers, type names, methods, paths, CLI commands, env vars, manifest keys, plugin ids, error strings and log lines are never translated. A code span is never inflected; the Russian words around it carry the case («в `server.ts`», «у `bb.storage`»).

## Glossary — one Russian term per concept

"Latin" in the Russian column means the site writes the English word in Russian prose.

| English | Russian | Notes / never use |
|---|---|---|
| surface | поверхность | not «зона», «область» |
| surface map (the tabular index) | карта поверхностей | |
| UI zone map, zone map (`/map/`) | макет UI-зон, макет зон | not «карта зон» |
| zone (on the map) | зона | only for the visual map |
| wireframe | вайрфрейм | |
| slot | слот | not «хук», «точка расширения» |
| slot method (`app.slots.*`) | метод-слот | «22 метода-слота» |
| builder region | регион билдера | «пять регионов билдера» |
| builder surface | поверхность билдера | as in "three builder surfaces" |
| builder (`PluginAppBuilder`) | билдер | |
| registration point | точка регистрации | «27 точек регистрации» |
| registration | регистрация | |
| member (of an interface / API) | член | «23 члена `BbPluginApi`» |
| namespace | namespace (Latin) | namespace'ы; not «пространство имён» |
| entry | точка входа | not «энтрипойнт» |
| server entry / app entry / host entry | server entry / app entry / host entry (Latin, feminine: «в server entry», «эта host entry») | never «бэкенд» for the server entry |
| factory | фабрика | not «конструктор», «инициализатор» |
| first-party plugin | first-party плагин | not «встроенный», «официальный» |
| example plugin | пример, плагин-пример | |
| built-in Plugin Guide | встроенный Plugin Guide | the product feature keeps its name |
| thread | thread (Latin) | thread'а, thread'ы; not «поток», «разговор», «тред» |
| conversation (describing a thread) | разговор | only in the definition of a thread |
| environment | окружение | `environment` only as identifier |
| environment provider | провайдер окружения | |
| workspace | workspace (Latin) | the directory; not «окружение» |
| worktree | worktree (Latin) | |
| machine | машина | not «хост» |
| machine provider | провайдер машины | |
| executor machine | машина-исполнитель | |
| host (the daemon identity, `host` in the data model) | host (Latin) | «на конкретном host» |
| host daemon | host daemon (Latin) | |
| the host (the bb app hosting a plugin frontend) | хост | «токены хоста», «хост шимит React» |
| host worker | host-воркер | not «хост-процесс» |
| agent provider | провайдер агента | not «провайдер модели» |
| provider (generic) | провайдер | |
| agent | агент | a program, not a person: no «поручить агенту» |
| agent tool | инструмент агента | |
| dispatch | диспетчеризация | not «маршрутизация» |
| routing (HTTP, surface signals) | маршрутизация | only where English says "route" |
| agent brief | бриф для агента | not «промпт», «спека» |
| set (brief basket) | набор | not «корзина» |
| board (diagram component) | доска | «диаграмма» is fine in prose |
| full trust | полное доверие; attributive «full-trust» | never «песочница» — it is the opposite |
| sandbox | песочница | |
| isolation | изоляция | |
| plaintext | plaintext (Latin) | «plaintext-файлы в режиме `0600`» |
| unauthenticated | неаутентифицированный | «публичный API сервера неаутентифицирован» |
| authentication | аутентификация | |
| secret | секрет | |
| trust model | модель доверия | |
| pinned release | закреплённый релиз | |
| pinned commit | закреплённый коммит | |
| the pin | пин | «на пине», «к пину» |
| release | релиз | |
| upstream | upstream (Latin) | |
| `main` (the branch) | `main` | «на `main`» |
| stable / experimental (status) | стабильный / экспериментальный; chips `stable` / `experimental_` | |
| not verified | не проверено | label is kept |
| breaking change | ломающее изменение | |
| composer | композер | |
| sidebar | сайдбар | |
| panel | панель | |
| renderer | рендерер | |
| overlay | оверлей | |
| content script | content script (Latin) | |
| skill | skill (Latin) | skill'ы; not «навык» |
| command (CLI) | команда | |
| settings | настройки | `Settings` as UI string |
| storage | хранилище | |
| runtime | рантайм | |
| bundle | бандл | |
| build (noun) | сборка | |
| scaffold | скаффолд | |
| manifest | манифест | |
| contract | контракт | |
| signal / realtime signal | сигнал / realtime-сигнал | |
| ephemeral | ephemeral (Latin) | «ephemeral-сигналы» |
| lifecycle | жизненный цикл | |
| reload | reload (Latin) | «после reload» |
| dispose | dispose (Latin) | «на dispose» |
| capability | возможность | |
| handler | обработчик | |
| props | пропсы | |
| hook (React) | хук | |
| shim, shimmed | шим, шимится | |
| design token | токен | |
| fixture | фикстура | |
| fake host (`createFakePluginHost`) | фейковый хост | |
| test harness | тестовая обвязка | |
| permalink | пермалинк | |
| acceptance criteria | критерии готовности | |
| marketplace | marketplace (Latin) | |
| registry | реестр | |
| changelog | changelog (Latin) | |
| delta (`delta.json`) | дельта | |
| frontend / backend | фронтенд / бэкенд | only where English uses the generic words |
| source of truth | источник истины | |
| generated | генерируемый | |
| reference (site section) | справочник | |
| card (a reference card: slot, namespace, surface) | карточка | «в карточке `bb.settings`» |
| turn | ход | «ход агента», «идущий ход»; not «оборот», «шаг» |
| generation (prose) | поколение | `generation` only as identifier; the table heading keeps «generation» in quotes |
| rollback | откат | |
| provider bridge, bridge | provider bridge, bridge (Latin) | bridge'а, bridge'ей; not «мост» as a term |
| kit (ACP kit, conformance kit) | кит | not «набор» — that is the brief set |
| mention, mention provider | упоминание, провайдер упоминаний | «как упоминание bb» |
| instruction provider | провайдер инструкций | |
| fixed tab | fixed tab (Latin); in prose fixed-таб | fixed-табы |
| origin guard | origin guard (Latin) | describe it as CSRF protection, never as authentication |
| bearer credentials (daemon) | bearer-креды демона | |
| time-box | тайм-бокс | «тайм-бокс 30 s» |
| enroll, enrolled machine, enrollment | enrollment (Latin), enrolled-машина | «проходит enrollment на сервере» |
| compute (what a machine provider creates) | вычислительные ресурсы | not «компьюта» |
| harness (short form of test harness) | обвязка | «фронтенд-обвязка», «обвязка для host entry» |
| scope (composer scope, CSS scoping) | scope (Latin); скоупинг, скоупится | |
| this site's own UI labels: Brief for agent · …as a bb mention · Add to set · Copy set as one brief · Copy page as Markdown · Open in bb · unreleased — lands after 0.43.3 | Бриф для агента · …как упоминание bb · Добавить в набор · Скопировать набор одним брифом · Скопировать страницу как Markdown · Открыть в bb · не выпущено — появится после 0.43.3 | the components render these on `/ru/` (`site/src/i18n/ui.ts`); the unreleased label is written by hand where it applies. Prose quotes them as the page shows them, bold or in «ёлочки». What the buttons copy stays English |
| prompt box (plain-language name for the composer) | поле ввода | «над полем ввода»; «композер» stays for "composer" |
| draft prompt, draft | черновик промпта, черновик | |
| side panel (right of a thread, on the new-thread screen) | боковая панель | not «сайдбар» — that is the left sidebar |
| tab (panel tab, Browser tab) | вкладка | fixed tab keeps its own row above |
| control (UI element) | контрол | «контролы в шапке thread'а» |
| thread header | шапка thread'а | |
| picker (model, environment, composer pickers) | пикер; «выбор модели» for the model picker | |
| timeline, timeline entry | timeline (Latin), запись timeline | not «таймлайн», «лента» |
| app-wide (scripts, overlays) | уровня приложения | «скрипт уровня приложения» |
| credentials | учётные данные | «bearer-креды демона» stays for the daemon's bearer credentials |
| helper model (bb's own short model calls) | служебная модель, служебные вызовы модели | matches «служебный inference» on the AI services page |
| retirement (of machines, environments) | вывод из эксплуатации | |
