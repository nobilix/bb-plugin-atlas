/*
 * Every string the atlas's own interface chrome shows: the zone map's toolbar,
 * legend and details panel, the header link to it, the generated pages'
 * headings, labels and table headers, and the brief and set controls.
 *
 * Page prose is not here — it lives in the content collection, one file per
 * locale. bb's own UI strings drawn inside the mockup are not here either: they
 * are bb's, and they are never translated. Nor is anything written for an
 * agent — the brief, the bb mention, the set's Markdown — which stays English
 * on every locale.
 *
 * A locale is added by adding its dictionary to `ui`. A key missing from it
 * falls back to English, so a partial translation renders rather than breaks.
 * A `{name}` in a string is a placeholder that `t` fills in.
 */

const en = {
  'nav.zoneMap': 'Zone map',

  /* --- generated pages: shared ------------------------------------------ */
  'stamp.pinned': 'pinned',
  'stability.stable': 'stable',
  'stability.experimental': 'experimental',
  'chip.deprecated': 'deprecated',
  'source.heading': 'Source',
  'source.line': 'line {line}',
  'source.atPin': ', at the pinned commit.',

  /* --- surfaces ---------------------------------------------------------- */
  'surfaces.title': 'Surfaces',
  'surfaces.description': 'Every place a plugin can appear or act in bb, grouped by where it lives.',
  /** The Markdown twin's shorter lede. */
  'surfaces.lede': 'Every place a plugin can appear or act in bb.',
  'surfaces.onMap': 'on the map',
  'surfaces.showOnMap': 'Show {title} on the zone map',
  'surface.inGroup': '#{number} in group',
  'surface.showOnMap': 'Show on the zone map',
  'surface.gives': 'What it gives you',
  'surface.api': 'API',
  'surface.apiNote': 'Each symbol links to the pinned commit it was read at.',
  'surface.usedBy': 'Used by',
  'surface.group': 'Group',
  'surface.stability': 'Stability',
  'surface.firstParty': 'First-party plugins',

  /* --- frontend slots ---------------------------------------------------- */
  'frontend.title': 'Frontend slots',
  'frontend.description': 'The registration points an app entry reaches surfaces through.',
  'frontend.slotMethods': 'Slot methods ({count})',
  'frontend.slotMethodsNote': 'Members of `interface PluginAppSlots`.',
  'frontend.builderRegions': 'Builder regions ({count})',
  'frontend.builderRegionsNote':
    'Regions of `PluginAppBuilder`, reached through the builder rather than through `app.slots`.',
  'slot.kind': 'Kind',
  'slot.kind.method': 'slot method',
  'slot.kind.builder': 'builder surface',
  'slot.registeredWith': 'Registered with',
  'slot.registrationType': 'Registration type',

  /* --- backend namespaces ------------------------------------------------ */
  'backend.title': 'Backend namespaces',
  'backend.description': 'The members of the plugin API a server entry is handed.',
  /* The three `upstreamNote`s are for a locale whose page quotes English
   * upstream text; in English there is nothing to say, so nothing renders. */
  'backend.upstreamNote': '',
  'namespace.member': 'Member',
  'namespace.type': 'Type',

  /* --- plugin catalog and changelog -------------------------------------- */
  'plugins.title': 'Plugin catalog',
  'plugins.description': 'The plugins that ship with bb, and the examples.',
  'plugins.upstreamNote': '',
  'plugins.firstParty': 'First-party plugins',
  'plugins.examples': 'Examples',
  'plugins.other': 'Other',
  'plugins.col.plugin': 'Plugin',
  'plugins.col.does': 'What it does',
  'plugins.col.entries': 'Entries',
  'plugins.col.source': 'Source',
  'plugins.noDescription': 'no description upstream',
  'changelog.title': 'Changelog',
  'changelog.description': 'What changed for plugin authors, release by release.',
  'changelog.upstreamNote': '',
  'changelog.pinned': 'pinned release',

  /* --- the map page around the island ------------------------------------ */
  'mapPage.markdown':
    'An interactive mockup of the bb window with every surface numbered in place.\nIt has no Markdown equivalent — open `{path}` in a browser.',

  /* --- brief controls, the set, Copy page -------------------------------- */
  'brief.brief': 'Brief for agent',
  'brief.mention': '…as a bb mention',
  'brief.mentionHint':
    "Pastes into bb's composer as a real mention — needs the plugin-api-docs plugin enabled",
  'brief.addToSet': 'Add to set',
  'brief.note':
    'The brief is Markdown, written for a coding agent: what the capability is, where it registers, every SDK symbol with a pinned permalink, the rules that bite, and what done means.',
  'brief.copied': 'Copied',
  'brief.copyFailed': 'Copy failed',
  'brief.inSet': 'In the set',
  'brief.alreadyInSet': 'Already there',
  'basket.copy': 'Copy set as one brief',
  'basket.clear': 'Clear',
  'basket.count': 'In the set: {count}',
  'basket.remove': 'Remove {title} from the set',
  'copyPage.label': 'Copy page as Markdown',
  'copyPage.opened': 'Opened',

  /* --- the zone map ------------------------------------------------------ */
  'zonemap.title': 'UI zone map',
  'zonemap.description': 'The bb window with every surface numbered in place.',
  'zonemap.screen': 'Screen',
  'zonemap.screen.shell': 'The app window',
  'zonemap.screen.palette': 'Quick palette',
  'zonemap.screen.home': 'Home page',
  'zonemap.screen.settings': 'Plugin settings',
  'zonemap.screen.plugins': 'Plugin page',
  'zonemap.screen.composer': 'The composer',
  'zonemap.screen.headless': 'Plugin backend',
  'zonemap.showZones': 'Show zones',
  'zonemap.hideZones': 'Hide zones',
  'zonemap.panHint': 'The mockup is wider than the screen — drag it sideways',

  'zonemap.legend.heading': 'Zones on this screen',
  'zonemap.legend.headless': 'No UI (headless)',
  'zonemap.legend.headlessNote': 'They carry no numbers.',
  'zonemap.legend.foot':
    "Hovering a row highlights its zone; clicking opens its details here. The numbers are the ones bb's own Plugin Guide uses.",
  'zonemap.experimental': 'experimental',
  'zonemap.experimentalShort': 'exp',
  'zonemap.referencePage': 'Open the reference page',
  'zonemap.detailsButton': 'Details',

  'zonemap.details.close': 'Close details and return to the list',
  'zonemap.details.fixtureState': 'Fixture state',
  'zonemap.details.sdkSymbols': 'SDK symbols',
  'zonemap.details.firstParty': 'First-party plugins',
  'zonemap.details.openInBb': 'Open in bb — needs bb running on this machine',
  'zonemap.details.pluginGuide': "Open in bb's built-in Plugin Guide",
  'zonemap.details.pluginGuideHint': 'Opens only with bb running and the Plugin Guide plugin enabled',
  'zonemap.details.source': 'surfaces.ts, at the pinned commit',
};

export type UiKey = keyof typeof en;

/*
 * Russian, in TRANSLATION-RU's vocabulary: «поверхность», «метод-слот»,
 * «регион билдера», «набор», «бриф для агента», «макет UI-зон»; namespace and
 * the three entries stay Latin. `Quick palette` is bb's own name for that
 * screen and stays as bb writes it.
 */
const ru: Partial<Record<UiKey, string>> = {
  'nav.zoneMap': 'Макет зон',

  'stamp.pinned': 'пин',
  'stability.stable': 'стабильный',
  'stability.experimental': 'экспериментальный',
  'chip.deprecated': 'устаревший',
  'source.heading': 'Исходник',
  'source.line': 'строка {line}',
  'source.atPin': ', на закреплённом коммите.',

  'surfaces.title': 'Поверхности',
  'surfaces.description':
    'Все места, где плагин может появиться или действовать в bb, сгруппированные по тому, где они живут.',
  'surfaces.lede': 'Все места, где плагин может появиться или действовать в bb.',
  'surfaces.onMap': 'на макете',
  'surfaces.showOnMap': 'Показать «{title}» на макете зон',
  'surface.inGroup': '№{number} в группе',
  'surface.showOnMap': 'Показать на макете зон',
  'surface.gives': 'Что это даёт',
  'surface.apiNote': 'Каждый символ ведёт на закреплённый коммит, на котором он прочитан.',
  'surface.usedBy': 'Кто использует',
  'surface.group': 'Группа',
  'surface.stability': 'Стабильность',
  'surface.firstParty': 'First-party плагины',

  'frontend.title': 'Слоты фронтенда',
  'frontend.description': 'Точки регистрации, через которые app entry добирается до поверхностей.',
  'frontend.slotMethods': 'Методы-слоты ({count})',
  'frontend.slotMethodsNote': 'Члены `interface PluginAppSlots`.',
  'frontend.builderRegions': 'Регионы билдера ({count})',
  'frontend.builderRegionsNote':
    'Регионы `PluginAppBuilder`: до них добираются через билдер, а не через `app.slots`.',
  'slot.kind': 'Вид',
  'slot.kind.method': 'метод-слот',
  'slot.kind.builder': 'поверхность билдера',
  'slot.registeredWith': 'Регистрируется через',
  'slot.registrationType': 'Тип регистрации',

  'backend.title': "Namespace'ы бэкенда",
  'backend.description': 'Члены plugin API, которые получает server entry.',
  'backend.upstreamNote':
    "Описания namespace'ов — doc-комментарии из исходников bb; они приводятся на английском, как в коде.",
  'namespace.member': 'Член',
  'namespace.type': 'Тип',

  'plugins.title': 'Каталог плагинов',
  'plugins.description': 'Плагины, которые поставляются с bb, и примеры.',
  'plugins.upstreamNote':
    'Описания плагинов взяты из их манифестов в upstream и приводятся на английском.',
  'plugins.firstParty': 'First-party плагины',
  'plugins.examples': 'Примеры',
  'plugins.other': 'Другие',
  'plugins.col.plugin': 'Плагин',
  'plugins.col.does': 'Что делает',
  'plugins.col.entries': 'Точки входа',
  'plugins.col.source': 'Исходник',
  'plugins.noDescription': 'в upstream нет описания',
  'changelog.description': 'Что изменилось для авторов плагинов, релиз за релизом.',
  'changelog.upstreamNote':
    'Записи ниже — changelog самого bb; они приводятся на английском, без перевода.',
  'changelog.pinned': 'закреплённый релиз',

  'mapPage.markdown':
    'Интерактивный макет окна bb, в котором каждая поверхность пронумерована на своём месте.\nMarkdown-версии у него нет — откройте `{path}` в браузере.',

  'brief.brief': 'Бриф для агента',
  'brief.mention': '…как упоминание bb',
  'brief.mentionHint':
    'Вставляется в композер bb как настоящее упоминание — нужен включённый плагин plugin-api-docs',
  'brief.addToSet': 'Добавить в набор',
  'brief.note':
    'Бриф — Markdown на английском, написанный для агента: что это за возможность, где она регистрируется, каждый символ SDK с закреплённым пермалинком, правила, на которых спотыкаются, и что считается готовым.',
  'brief.copied': 'Скопировано',
  'brief.copyFailed': 'Не скопировалось',
  'brief.inSet': 'В наборе',
  'brief.alreadyInSet': 'Уже в наборе',
  'basket.copy': 'Скопировать набор одним брифом',
  'basket.clear': 'Очистить',
  'basket.count': 'В наборе: {count}',
  'basket.remove': 'Убрать {title} из набора',
  'copyPage.label': 'Скопировать страницу как Markdown',
  'copyPage.opened': 'Открыто',

  'zonemap.title': 'Макет UI-зон',
  'zonemap.description': 'Окно bb, в котором каждая поверхность пронумерована на своём месте.',
  'zonemap.screen': 'Экран',
  'zonemap.screen.shell': 'Окно приложения',
  'zonemap.screen.home': 'Домашняя страница',
  'zonemap.screen.settings': 'Настройки плагина',
  'zonemap.screen.plugins': 'Страница плагина',
  'zonemap.screen.composer': 'Композер',
  'zonemap.screen.headless': 'Бэкенд плагина',
  'zonemap.showZones': 'Показать зоны',
  'zonemap.hideZones': 'Скрыть зоны',
  'zonemap.panHint': 'Макет шире экрана — сдвиньте его в сторону',

  'zonemap.legend.heading': 'Зоны на этом экране',
  'zonemap.legend.headless': 'Без UI (headless)',
  'zonemap.legend.headlessNote': 'Номеров у них нет.',
  'zonemap.legend.foot':
    'Наведение на строку подсвечивает её зону, клик открывает подробности здесь. Номера — те же, что во встроенном Plugin Guide bb.',
  'zonemap.experimental': 'экспериментальная',
  'zonemap.experimentalShort': 'эксп.',
  'zonemap.referencePage': 'Открыть справочную страницу',
  'zonemap.detailsButton': 'Подробнее',

  'zonemap.details.close': 'Закрыть подробности и вернуться к списку',
  'zonemap.details.fixtureState': 'Состояние фикстуры',
  'zonemap.details.sdkSymbols': 'Символы SDK',
  'zonemap.details.firstParty': 'First-party плагины',
  'zonemap.details.openInBb': 'Открыть в bb — нужен bb, запущенный на этой машине',
  'zonemap.details.pluginGuide': 'Открыть во встроенном Plugin Guide bb',
  'zonemap.details.pluginGuideHint':
    'Откроется, только если bb запущен и включён плагин Plugin Guide',
  'zonemap.details.source': 'surfaces.ts на закреплённом коммите',
};

export const ui = { en, ru } satisfies Record<string, Partial<Record<UiKey, string>>>;

export type Locale = keyof typeof ui;

export const DEFAULT_LOCALE: Locale = 'en';

/** A BCP-47 tag (`en`, `ru-RU`, Starlight's `lang`) to a locale with a dictionary. */
export function toLocale(lang: string | undefined): Locale {
  const base = lang?.split('-')[0];
  return base && base in ui ? (base as Locale) : DEFAULT_LOCALE;
}

export function t(locale: Locale, key: UiKey, vars: Record<string, string | number> = {}): string {
  const dictionary: Partial<Record<UiKey, string>> = ui[locale];
  const text = dictionary[key] ?? ui.en[key];
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

/*
 * The zone map's strings, resolved for one locale and handed to the island as
 * a prop. The island does not import `t`: that would ship every dictionary in
 * its bundle, and `/map/` has the tightest JS budget on the site.
 */
export type ZoneMapKey = Extract<UiKey, `zonemap.${string}` | `brief.${string}`>;
export type ZoneMapStrings = Record<ZoneMapKey, string>;

export function zoneMapStrings(locale: Locale): ZoneMapStrings {
  const keys = (Object.keys(en) as UiKey[]).filter(
    (key): key is ZoneMapKey => key.startsWith('zonemap.') || key.startsWith('brief.'),
  );
  return Object.fromEntries(keys.map((key) => [key, t(locale, key)])) as ZoneMapStrings;
}
