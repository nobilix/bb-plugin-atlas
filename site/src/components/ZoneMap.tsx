/*
 * The UI zone map: the bb window with every surface numbered in place.
 *
 * The one React island on the site, and only on `/map/`. What it
 * owns is state — which screen, which fixture state, which zone's details are
 * open — and that is what React is here for.
 *
 * What it does **not** own is the mockup. The seven screens arrive as children
 * from `Screens.astro`, server-rendered, and this component measures them with
 * `getBoundingClientRect`. Overlays are positioned
 * from the real boxes rather than from a second description of the layout, so
 * they cannot drift from the picture they annotate — and 800 lines of fixture
 * markup stay out of the JavaScript bundle.
 *
 * Invariants the Playwright suite asserts, and where each one is enforced:
 *   · exactly one visible screen and one visible fixture state — `hidden` and
 *     `is-active` are written from state, never toggled ad hoc;
 *   · no badge outside the stage, none under 18 px — placement is clamped to
 *     the stage box and the badge carries a size floor in CSS;
 *   · no badge overlaps another — badges are nudged apart after placement;
 *   · details never cover a zone — they open in the right-hand column, in the
 *     page flow, in place of the legend (below the map on a narrow screen);
 *   · `pushState` history, so Back returns to the previous screen or zone.
 *
 * The brief generator is not bundled here. `renderBrief` and `bbMention` are
 * imported on demand, for the reason the set panel gives at length: the module
 * they live in reaches the curated annotation bank, which does not tree-shake,
 * and this page has the tightest budget on the site. For the same reason the
 * interface strings arrive as a prop, already resolved for the page's locale,
 * rather than as the dictionaries in `i18n/ui.ts`.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { addToBasket } from './basket.ts';
import { copyRich, copyText, flash } from './clipboard.ts';
import { parseInline, plainText, resolveTarget, type Inline } from '../lib/inline-md.ts';
import type { ZoneMapKey, ZoneMapStrings } from '../i18n/ui.ts';
import './ZoneMap.css';

/* ------------------------------------------------------------------ data -- */

export interface ZoneSurface {
  id: string;
  number: number | null;
  /** In the page's locale. */
  title: string;
  /** English on every locale: what the bb mention and the set are built from. */
  briefTitle: string;
  summary: string;
  bullets: string[];
  tagline: string | null;
  experimental: boolean;
  apiSymbols: string[];
  firstParty: { name: string; id: string | null }[];
  /** The reference page on this site. */
  href: string;
  /** Its declaration in `surfaces.ts`, at the pinned commit. */
  sourceUrl: string | null;
}

export interface ZoneGroup {
  id: string;
  title: string;
  blurb: string;
  surfaces: ZoneSurface[];
  sections?: { title: string; surfaceIds: string[] }[];
}

export interface ZoneMapProps {
  groups: ZoneGroup[];
  strings: ZoneMapStrings;
  children?: React.ReactNode;
}

/** The seven screens, in the order the number keys select them. */
const SCREENS = [
  { key: 'shell', group: 'app-shell' },
  { key: 'palette', group: 'command-palette' },
  { key: 'home', group: 'home' },
  { key: 'settings', group: 'settings' },
  { key: 'plugins', group: 'extensions' },
  { key: 'composer', group: 'composer' },
  { key: 'headless', group: 'headless' },
] as const;

type ScreenKey = (typeof SCREENS)[number]['key'];

/*
 * Fixture states: the same zone drawn in each of the shapes bb can put it in.
 * The labels are the strings that must be on screen in that state, which is
 * what makes a state checkable — one that renders nothing is a broken fixture,
 * not an empty one.
 */
const FIXTURE_STATES: Record<
  string,
  { initial: string; states: { id: string; labels: string[] }[] }
> = {
  'command-palette-actions': {
    initial: 'anchor',
    states: [
      { id: 'anchor', labels: ['Quick palette', '⇧⌘P'] },
      { id: 'triggered', labels: ['Search commands', 'Plugins', 'Run release checklist'] },
      { id: 'outcome', labels: ['Release checklist'] },
    ],
  },
  'sidebar-navigation': {
    initial: 'owner',
    states: [
      { id: 'owner', labels: ['New thread', 'Search threads', 'Plugins', 'Skills'] },
      { id: 'replacement', labels: ['Custom navigation'] },
      { id: 'fallback', labels: ['New thread', 'Search threads', 'Plugins', 'Skills'] },
    ],
  },
  'sidebar-footer': {
    initial: 'action',
    states: [
      { id: 'action', labels: ['Plugin action'] },
      { id: 'disclosure', labels: ['5-hour limit', '18% left'] },
    ],
  },
};

/** Where bb serves its UI on the reader's machine: the target of "open in bb" links. */
const BB_BASE = 'http://localhost:38886';
const STAGE_WIDTH = 1440;
const STAGE_HEIGHT = 900;
const BADGE = 20;
/** Below this the stage would be unreadable, so it pans instead of shrinking. */
const PHONE_MIN_SCALE = 0.56;
const DETAILS_ID = 'atlas-zone-details';

/* ------------------------------------------------------------ hash route -- */

interface Route {
  screen: ScreenKey;
  zones: boolean;
  theme: 'light' | 'dark' | null;
  surface: string | null;
  fixtures: Record<string, string>;
}

/**
 * `#<screen>[,<modifier>…]`, parsed rather than pattern-matched.
 *
 * A generic link checker reads `#composer,surface=mention-provider` as a
 * dangling anchor; it is a route. Tokens are split, recognised by name, and
 * anything unrecognised is dropped rather than guessed at.
 */
function parseRoute(
  hash: string,
  surfaces: Map<string, ZoneSurface>,
  screenOf: (id: string) => ScreenKey | undefined,
): Route {
  const tokens = hash
    .replace(/^#/, '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);

  const route: Route = {
    screen: SCREENS[0].key,
    zones: !tokens.includes('nozones'),
    theme: tokens.includes('light') ? 'light' : tokens.includes('dark') ? 'dark' : null,
    surface: null,
    fixtures: {},
  };

  for (const token of tokens) {
    if (!token.startsWith('fx=')) continue;
    const [id, state] = token.slice(3).split(':');
    if (FIXTURE_STATES[id]?.states.some((s) => s.id === state)) route.fixtures[id] = state;
  }

  const named = SCREENS.find((s) => tokens.includes(s.key));
  if (named) route.screen = named.key;

  const token = tokens.find((t) => t.startsWith('surface='));
  const surface = token ? surfaces.get(token.slice('surface='.length)) : undefined;
  if (surface) {
    route.surface = surface.id;
    /* A surface names its own screen: `#composer,surface=thread-list` should
     * land where that zone actually is, not where the token order suggests. */
    route.screen = screenOf(surface.id) ?? route.screen;
  }
  return route;
}

function formatRoute(route: Route): string {
  const tokens: string[] = [route.screen];
  if (route.theme === 'light') tokens.push('light');
  if (!route.zones) tokens.push('nozones');
  for (const [id, state] of Object.entries(route.fixtures)) {
    if (FIXTURE_STATES[id] && state !== FIXTURE_STATES[id].initial) tokens.push(`fx=${id}:${state}`);
  }
  if (route.surface) tokens.push(`surface=${route.surface}`);
  return `#${tokens.join(',')}`;
}

/* ---------------------------------------------------------------- boxes --- */

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PlacedZone {
  id: string;
  number: number | null;
  title: string;
  box: Box;
  badge: { x: number; y: number };
  frame: boolean;
}

/** Where a badge sits relative to its zone, per the markup's `data-badge`. */
function badgeAnchor(kind: string, box: Box): { x: number; y: number } {
  switch (kind) {
    case 'tl':
      return { x: 6, y: -12 };
    case 'bl':
      return { x: 6, y: box.h - 8 };
    case 'br':
      return { x: box.w - 12, y: box.h - 8 };
    case 'in-tl':
      return { x: 8, y: 8 };
    case 'in-tr':
      return { x: box.w - 28, y: -12 };
    case 'in-br':
      return { x: box.w - 30, y: box.h - 30 };
    case 'side':
      return { x: box.w - 12, y: box.h / 2 - BADGE / 2 };
    default:
      return { x: box.w - 12, y: -12 };
  }
}

function overlaps(a: Box, b: Box, pad = 0): boolean {
  return (
    a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad
  );
}

/* ------------------------------------------------------------ rich text --- */

/**
 * Upstream text, with its inline Markdown rendered: `code`, **bold**, and
 * `[text](surface-id)` cross-links, which open that surface's details here.
 * The same parser renders the reference pages (`InlineMd.astro`).
 */
function RichText({
  text,
  isSurface,
  hrefOf,
  onSurface,
}: {
  text: string;
  isSurface: (id: string) => boolean;
  hrefOf: (id: string) => string;
  onSurface: (id: string) => void;
}) {
  const render = (nodes: Inline[]): React.ReactNode[] =>
    nodes.map((node, index) => {
      switch (node.kind) {
        case 'text':
          return node.text;
        case 'code':
          return <code key={index}>{node.text}</code>;
        case 'strong':
          return <strong key={index}>{render(node.children)}</strong>;
        case 'link': {
          const target = resolveTarget(node.target, isSurface);
          if (!target) return node.text;
          if ('external' in target) {
            return (
              <a key={index} href={target.external} rel="noreferrer">
                {node.text}
              </a>
            );
          }
          return (
            <a
              key={index}
              className="xlink"
              href={hrefOf(target.surface)}
              onClick={(event) => {
                event.preventDefault();
                onSurface(target.surface);
              }}
            >
              {node.text}
            </a>
          );
        }
      }
    });
  return <>{render(parseInline(text))}</>;
}

/* ------------------------------------------------------------- component -- */

export default function ZoneMap({ groups, strings, children }: ZoneMapProps) {
  const tr = useCallback((key: ZoneMapKey) => strings[key], [strings]);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const { surfaceById, groupOf, byGroup, screenOf } = useMemo(() => {
    const surfaceById = new Map<string, ZoneSurface>();
    const groupOf = new Map<string, string>();
    const byGroup = new Map<string, ZoneGroup>();
    for (const group of groups) {
      byGroup.set(group.id, group);
      for (const surface of group.surfaces) {
        surfaceById.set(surface.id, surface);
        groupOf.set(surface.id, group.id);
      }
    }
    const screenOf = (id: string) => SCREENS.find((s) => s.group === groupOf.get(id))?.key;
    return { surfaceById, groupOf, byGroup, screenOf };
  }, [groups]);

  const [screen, setScreen] = useState<ScreenKey>(SCREENS[0].key);
  const [zonesOn, setZonesOn] = useState(true);
  /** The surface whose details are open. Its zone stays highlighted while they are. */
  const [open, setOpen] = useState<string | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [fixtures, setFixtures] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(FIXTURE_STATES).map(([id, cfg]) => [id, cfg.initial])),
  );
  const [placed, setPlaced] = useState<PlacedZone[]>([]);
  const [scale, setScale] = useState(1);
  const [pannable, setPannable] = useState(false);

  const current = SCREENS.find((s) => s.key === screen) ?? SCREENS[0];
  const group = byGroup.get(current.group);
  const surface = open ? (surfaceById.get(open) ?? null) : null;
  const soloed = placed.some((zone) => zone.id === open);
  const headless = byGroup.get('headless');
  const screenLabel = (key: ScreenKey) => tr(`zonemap.screen.${key}`);

  /* --- fixture states: exactly one visible variant per surface ------------- */

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    for (const [surfaceId, state] of Object.entries(fixtures)) {
      for (const el of root.querySelectorAll<HTMLElement>(`[data-fx^="${surfaceId}:"]`)) {
        el.hidden = el.dataset.fx !== `${surfaceId}:${state}`;
      }
      /* The numbered zone follows the visible variant: the anchor moves with
       * the fixture rather than staying on whichever element happened to carry
       * `data-zone` in the markup. */
      const candidates = Array.from(
        root.querySelectorAll<HTMLElement>(`[data-zone-candidate="${surfaceId}"]`),
      );
      for (const el of candidates) el.removeAttribute('data-zone');
      const stateOf = (el: HTMLElement) =>
        el.dataset.zoneState ?? el.dataset.fx?.split(':')[1] ?? null;
      const active =
        candidates.find((el) => stateOf(el) === state) ??
        candidates.find((el) => !stateOf(el)) ??
        candidates[0];
      active?.setAttribute('data-zone', surfaceId);
    }
  }, [fixtures, screen]);

  /* --- exactly one visible screen ------------------------------------------ */

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    for (const el of root.querySelectorAll<HTMLElement>('.screen')) {
      el.classList.toggle('is-active', el.dataset.screen === screen);
    }
  }, [screen]);

  /* --- measuring: one zone box and one badge per numbered surface ---------- */

  const measure = useCallback(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    const screenEl = root.querySelector<HTMLElement>(`.screen[data-screen="${screen}"]`);
    if (!screenEl) return;
    const stageRect = stage.getBoundingClientRect();

    /*
     * Everything below is in screen pixels, not in the stage's own 1440×900
     * coordinates, and the overlay is not scaled with the stage. Scaled, the
     * badges would come out at 14.5 px on a 0.725 scale — under the 18 px
     * hit-target floor the Playwright suite asserts, which does not bend
     * because the picture behind it got smaller. Measuring in screen pixels
     * also means the clamp keeps a badge inside the stage as it is drawn.
     */
    const next: PlacedZone[] = [];
    for (const item of byGroup.get(current.group)?.surfaces ?? []) {
      const anchor = screenEl.querySelector<HTMLElement>(`[data-zone="${item.id}"]`);
      if (!anchor) continue;
      const rect = anchor.getBoundingClientRect();
      const box: Box = {
        x: rect.left - stageRect.left,
        y: rect.top - stageRect.top,
        w: rect.width,
        h: rect.height,
      };
      const point = badgeAnchor(anchor.dataset.badge ?? 'tr', box);
      next.push({
        id: item.id,
        number: item.number,
        title: item.title,
        box,
        frame: anchor.dataset.zoneStyle === 'frame',
        badge: { x: point.x, y: point.y },
      });
    }

    /* Two zones can share a corner, and then two badges want the same pixels.
     * Nudge the later one clear, then clamp everything back inside the stage —
     * a badge outside the stage and a badge on top of another are both defects
     * the test plan names by hand. */
    const taken: Box[] = [];
    const boxOf = (zone: PlacedZone): Box => ({
      x: zone.box.x + zone.badge.x,
      y: zone.box.y + zone.badge.y,
      w: BADGE,
      h: BADGE,
    });
    for (const zone of next) {
      for (let guard = 0; guard < 24 && taken.some((t) => overlaps(boxOf(zone), t, 2)); guard += 1) {
        zone.badge.y += BADGE + 4;
        if (zone.box.y + zone.badge.y + BADGE > stageRect.height - 2) {
          zone.badge.y = badgeAnchor('tr', zone.box).y;
          zone.badge.x -= BADGE + 4;
        }
      }
      zone.badge.x = Math.min(
        Math.max(zone.badge.x, 2 - zone.box.x),
        stageRect.width - BADGE - 2 - zone.box.x,
      );
      zone.badge.y = Math.min(
        Math.max(zone.badge.y, 2 - zone.box.y),
        stageRect.height - BADGE - 2 - zone.box.y,
      );
      taken.push(boxOf(zone));
    }
    setPlaced(next);
  }, [byGroup, current.group, screen]);

  /* --- sizing: fit a 1440×900 stage into whatever space there is ----------- */

  const fit = useCallback(() => {
    const wrap = stageWrapRef.current;
    if (!wrap) return;
    const phone = window.matchMedia('(max-width: 700px)').matches;
    let next = wrap.clientWidth / STAGE_WIDTH;
    if (phone) next = Math.max(next, PHONE_MIN_SCALE);
    next = Math.min(1, Math.max(0.14, next));
    setScale(next);
    setPannable(phone && STAGE_WIDTH * next > wrap.clientWidth + 2);
  }, []);

  useLayoutEffect(() => {
    fit();
  }, [fit, screen]);

  useEffect(() => {
    const onResize = () => {
      fit();
      measure();
    };
    window.addEventListener('resize', onResize, { passive: true });
    /* Every box in the mockup moves when the webfont lands. */
    document.fonts?.ready.then(onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fit, measure]);

  useLayoutEffect(() => {
    measure();
  }, [measure, scale, fixtures]);

  /* --- routing -------------------------------------------------------------- */

  /*
   * The URL is written from state, in an effect, rather than by whoever changed
   * the state. A handler that formatted the hash itself was one render behind:
   * it closed over the screen it was leaving, so clicking through the tabs left
   * a trail of hashes naming the previous screen.
   *
   * `pushNext` says whether the next write is a new history entry. Picking a
   * screen, opening a zone's details or closing them is going somewhere and
   * pushes, so Back undoes it; toggling the zones or a fixture state is looking
   * at the same place differently and replaces.
   *
   * The first run is skipped: it sees the initial state, before the hash has
   * been read, and would overwrite a deep link with `#shell`.
   */
  const pushNext = useRef(false);
  const routed = useRef(false);

  const applyHash = useCallback(() => {
    const route = parseRoute(window.location.hash, surfaceById, screenOf);
    if (route.theme) document.documentElement.dataset.theme = route.theme;
    setZonesOn(route.zones);
    setScreen(route.screen);
    setFixtures((prev) => ({ ...prev, ...route.fixtures }));
    setOpen(route.surface);
  }, [screenOf, surfaceById]);

  useEffect(() => {
    applyHash();
    window.addEventListener('popstate', applyHash);
    window.addEventListener('hashchange', applyHash);
    return () => {
      window.removeEventListener('popstate', applyHash);
      window.removeEventListener('hashchange', applyHash);
    };
  }, [applyHash]);

  useEffect(() => {
    if (!routed.current) {
      routed.current = true;
      return;
    }
    const next = formatRoute({
      screen,
      zones: zonesOn,
      theme: document.documentElement.dataset.theme === 'light' ? 'light' : null,
      surface: open,
      fixtures,
    });
    if (window.location.hash !== next) {
      if (pushNext.current) window.history.pushState(null, '', next);
      else window.history.replaceState(null, '', next);
    }
    pushNext.current = false;
  }, [fixtures, open, screen, zonesOn]);

  /** The route that opens a surface's details, for a link that can be middle-clicked. */
  const hrefOf = useCallback(
    (id: string) =>
      formatRoute({
        screen: screenOf(id) ?? screen,
        zones: zonesOn,
        theme: null,
        surface: id,
        fixtures: {},
      }),
    [screen, screenOf, zonesOn],
  );

  /* --- details: open, switch, close ----------------------------------------- */

  /*
   * Where focus goes after the next render: the details heading once they
   * open, or back to the zone (its badge, or its legend row) once they close.
   * Only a reader's own action sets it, so a deep link or Back never moves
   * focus on its own.
   */
  const focusNext = useRef<{ details: true } | { zone: string } | null>(null);

  const openDetails = useCallback(
    (id: string) => {
      if (!surfaceById.has(id)) return;
      pushNext.current = true;
      focusNext.current = { details: true };
      const owner = screenOf(id);
      if (owner) setScreen(owner);
      setOpen(id);
    },
    [screenOf, surfaceById],
  );

  const closeDetails = useCallback(() => {
    if (!open) return;
    pushNext.current = true;
    focusNext.current = { zone: open };
    setOpen(null);
  }, [open]);

  useEffect(() => {
    const next = focusNext.current;
    if (!next) return;
    const root = rootRef.current;
    if ('details' in next) {
      headingRef.current?.focus();
    } else {
      const id = next.zone;
      const target =
        root?.querySelector<HTMLElement>(`.badge[data-id="${id}"]`) ??
        root?.querySelector<HTMLElement>(`[data-row-id="${id}"] button`) ??
        root?.querySelector<HTMLElement>(`[data-open-surface="${id}"]`);
      target?.focus();
    }
    focusNext.current = null;
  }, [open, placed]);

  const goToScreen = useCallback((key: ScreenKey) => {
    pushNext.current = true;
    setScreen(key);
    setOpen(null);
  }, []);

  /* --- keyboard -------------------------------------------------------------- */

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (/^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName) || target.isContentEditable)) {
        return;
      }
      const digit = [
        'Digit1',
        'Digit2',
        'Digit3',
        'Digit4',
        'Digit5',
        'Digit6',
        'Digit7',
      ].indexOf(event.code);
      if (digit >= 0) goToScreen(SCREENS[digit].key);
      else if (event.code === 'KeyZ') setZonesOn((on) => !on);
      else if (event.code === 'Escape') closeDetails();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeDetails, goToScreen]);

  /* --- clipboard ------------------------------------------------------------- */

  const copyBrief = useCallback(
    async (item: ZoneSurface, label: Element) => {
      try {
        const [{ renderBrief }, corpus] = await Promise.all([
          import('@atlas/core/briefs'),
          fetch('/briefs.json').then((response) => response.json()),
        ]);
        const brief = corpus.briefs.find(
          (candidate: { kind: string; id: string }) =>
            candidate.kind === 'surface' && candidate.id === item.id,
        );
        if (!brief) throw new Error('not in the corpus');
        const markdown = renderBrief(brief, corpus.generatedFor, corpus.rules);
        flash(label, tr((await copyText(markdown)) ? 'brief.copied' : 'brief.copyFailed'));
      } catch {
        flash(label, tr('brief.copyFailed'));
      }
    },
    [tr],
  );

  const copyMention = useCallback(
    async (item: ZoneSurface, label: Element) => {
      try {
        const { bbMention } = await import('@atlas/core/briefs');
        const payload = bbMention({
          id: item.id,
          title: item.briefTitle,
          apiSymbols: item.apiSymbols,
        });
        flash(label, tr((await copyRich(payload)) ? 'brief.copied' : 'brief.copyFailed'));
      } catch {
        flash(label, tr('brief.copyFailed'));
      }
    },
    [tr],
  );

  /*
   * The backend screen's capability cards are server-rendered in `Screens.astro`
   * — static text that never changes. Their Details buttons are reached by
   * delegation rather than by a portal, which is the whole reason this island
   * never imports `react-dom`.
   */
  const onRootClick = (event: React.MouseEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-open-surface]');
    const id = button?.dataset.openSurface;
    if (id) openDetails(id);
  };

  const rich = (text: string) => (
    <RichText
      text={text}
      isSurface={(id) => surfaceById.has(id)}
      hrefOf={hrefOf}
      onSurface={openDetails}
    />
  );

  /* --- render ---------------------------------------------------------------- */

  return (
    /*
     * `not-content` is Starlight's escape hatch, and the mockup cannot live
     * without it. Inside `.sl-markdown-content` Starlight puts `margin-top:1rem`
     * between any two adjacent elements, and that rule reaches into the fixture:
     * it pushed the whole bb window 39 px down inside a stage that is exactly
     * 900 px tall, so the last zone — `content-scripts`, which is the window —
     * hung off the bottom and took its badge with it.
     */
    <div className="atlas-zonemap not-content" ref={rootRef} onClick={onRootClick}>
      <header className="chrome">
        <div className="brand">
          <span className="dot" aria-hidden="true">
            bb
          </span>
          <span>{tr('zonemap.title')}</span>
        </div>
        <div className="tabs">
          {SCREENS.map((item, index) => (
            <button
              key={item.key}
              type="button"
              className={`tab${item.key === screen ? ' is-active' : ''}`}
              aria-pressed={item.key === screen}
              onClick={() => goToScreen(item.key)}
            >
              <kbd>{index + 1}</kbd>
              {screenLabel(item.key)}
            </button>
          ))}
        </div>
        <select
          className="screensel"
          aria-label={tr('zonemap.screen')}
          value={screen}
          onChange={(event) => goToScreen(event.target.value as ScreenKey)}
        >
          {SCREENS.map((item, index) => (
            <option key={item.key} value={item.key}>
              {index + 1}. {screenLabel(item.key)}
            </option>
          ))}
        </select>
        <span className="spacer" />
        <button
          type="button"
          className={`ctl${zonesOn ? ' on' : ''}`}
          aria-pressed={zonesOn}
          onClick={() => setZonesOn((on) => !on)}
        >
          {tr(zonesOn ? 'zonemap.hideZones' : 'zonemap.showZones')} <kbd className="hint">Z</kbd>
        </button>
      </header>

      <div className="work">
        <div className={`stagewrap${zonesOn ? ' zones-on' : ''}`} ref={stageWrapRef}>
          <div
            className="stagesize"
            aria-hidden="true"
            style={{ width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale }}
          />
          <div className="stage" ref={stageRef} style={{ transform: `scale(${scale})` }}>
            {children}
          </div>
          <div
            className={`zones${soloed ? ' solo' : ''}`}
            style={{
              left: 0,
              top: 0,
              width: STAGE_WIDTH * scale,
              height: STAGE_HEIGHT * scale,
            }}
          >
            {placed.map((zone) => (
              <div
                key={zone.id}
                className={`zone${zone.frame ? ' frame' : ''}${hot === zone.id ? ' is-hot' : ''}${
                  open === zone.id ? ' is-solo' : ''
                }`}
                data-id={zone.id}
                style={{ left: zone.box.x, top: zone.box.y, width: zone.box.w, height: zone.box.h }}
              >
                {zone.number !== null && (
                  <button
                    type="button"
                    className="badge"
                    data-id={zone.id}
                    aria-label={zone.title}
                    aria-controls={DETAILS_ID}
                    aria-expanded={open === zone.id}
                    style={{ left: zone.badge.x, top: zone.badge.y }}
                    onMouseEnter={() => setHot(zone.id)}
                    onMouseLeave={() => setHot(null)}
                    onClick={() => openDetails(zone.id)}
                  >
                    {zone.number}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Beside the stage it takes no room: it only exists on a phone, where
            the column puts it directly under the map. */}
        {pannable && <p className="atlas-zonemap__panhint">{tr('zonemap.panHint')}</p>}

        <aside className="legend" id={DETAILS_ID}>
          {surface ? (
            <section
              className="details"
              data-atlas-details={surface.id}
              aria-labelledby={`${DETAILS_ID}-title`}
            >
              <div className="top">
                {surface.number !== null && <span className="num">{surface.number}</span>}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h2 id={`${DETAILS_ID}-title`} ref={headingRef} tabIndex={-1}>
                    {surface.title}
                  </h2>
                  {surface.tagline && <div className="sub">{rich(surface.tagline)}</div>}
                </div>
                {surface.experimental && (
                  <span className="lexp" style={{ margin: '3px 0 0' }}>
                    {tr('zonemap.experimental')}
                  </span>
                )}
                <button
                  type="button"
                  className="close"
                  aria-label={tr('zonemap.details.close')}
                  title={tr('zonemap.details.close')}
                  onClick={closeDetails}
                >
                  ×
                </button>
              </div>

              {FIXTURE_STATES[surface.id] && (
                <div className="fxrow">
                  <span className="lab">{tr('zonemap.details.fixtureState')}</span>
                  <span className="seg">
                    {FIXTURE_STATES[surface.id].states.map((state) => (
                      <button
                        key={state.id}
                        type="button"
                        title={state.labels.join(' · ')}
                        className={fixtures[surface.id] === state.id ? 'on' : undefined}
                        aria-pressed={fixtures[surface.id] === state.id}
                        onClick={() => setFixtures((prev) => ({ ...prev, [surface.id]: state.id }))}
                      >
                        {state.id}
                      </button>
                    ))}
                  </span>
                </div>
              )}

              <p className="sum">{rich(surface.summary)}</p>
              <ul>
                {surface.bullets.map((bullet) => (
                  <li key={bullet}>{rich(bullet)}</li>
                ))}
              </ul>

              <div className="lab">{tr('zonemap.details.sdkSymbols')}</div>
              {surface.apiSymbols.map((name) => (
                <span className="chip" key={name}>
                  {name}
                </span>
              ))}

              {surface.firstParty.length > 0 && (
                <>
                  <div className="lab">{tr('zonemap.details.firstParty')}</div>
                  <div className="fp">
                    {surface.firstParty.map((plugin) => (
                      <span className="fprow" key={plugin.name}>
                        <span className="glink nm">{plugin.name}</span>
                        {plugin.id && (
                          <a
                            className="iconlink"
                            title={tr('zonemap.details.openInBb')}
                            aria-label={`${plugin.name}: ${tr('zonemap.details.openInBb')}`}
                            href={`${BB_BASE}/plugins/${plugin.id}`}
                          >
                            ⧉
                          </a>
                        )}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <div className="cardlinks">
                <a className="glink" href={surface.href}>
                  {tr('zonemap.referencePage')}
                </a>
                <a
                  className="glink"
                  href={`${BB_BASE}/plugins/plugin-api-docs/plugin-api/${groupOf.get(surface.id)}`}
                  title={tr('zonemap.details.pluginGuideHint')}
                >
                  {tr('zonemap.details.pluginGuide')}
                </a>
              </div>
              {surface.sourceUrl && (
                <a className="ghlink" target="_blank" rel="noreferrer" href={surface.sourceUrl}>
                  {tr('zonemap.details.source')}
                </a>
              )}

              <div className="briefrow">
                <button
                  type="button"
                  className="bbtn"
                  onClick={(event) => copyBrief(surface, event.currentTarget)}
                >
                  {tr('brief.brief')}
                </button>
                <button
                  type="button"
                  className="bbtn sec"
                  title={tr('brief.mentionHint')}
                  onClick={(event) => copyMention(surface, event.currentTarget)}
                >
                  {tr('brief.mention')}
                </button>
                <button
                  type="button"
                  className="bbtn sec"
                  onClick={(event) => {
                    const added = addToBasket({
                      kind: 'surface',
                      id: surface.id,
                      title: surface.briefTitle,
                    });
                    flash(event.currentTarget, tr(added ? 'brief.inSet' : 'brief.alreadyInSet'));
                  }}
                >
                  {tr('brief.addToSet')}
                </button>
              </div>
            </section>
          ) : (
            <>
              <h2>{tr('zonemap.legend.heading')}</h2>
              <div className="gsub">{group?.blurb}</div>
              <div>
                {(group?.surfaces ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="lrow"
                    data-row-id={item.id}
                    onMouseEnter={() => setHot(item.id)}
                    onMouseLeave={() => setHot(null)}
                  >
                    <button
                      type="button"
                      className="lrowbtn"
                      aria-controls={DETAILS_ID}
                      aria-expanded={false}
                      onClick={() => openDetails(item.id)}
                    >
                      <span className="lnum">{item.number ?? '·'}</span>
                      <span className="ltitle">
                        {item.title}
                        {item.experimental && (
                          <span className="lexp">{tr('zonemap.experimental')}</span>
                        )}
                      </span>
                    </button>
                    <a className="rowlink" title={tr('zonemap.referencePage')} href={item.href}>
                      ↗
                    </a>
                  </div>
                ))}
              </div>

              {current.key !== 'headless' && headless && (
                <div className="headless">
                  <h3>{tr('zonemap.legend.headless')}</h3>
                  <p className="note">
                    {headless.blurb} {tr('zonemap.legend.headlessNote')}
                  </p>
                  <div className="hlist">
                    {headless.surfaces.map((item) => (
                      <span
                        key={item.id}
                        className="hitem"
                        data-row-id={item.id}
                        title={item.tagline ? plainText(item.tagline) : ''}
                      >
                        <button
                          type="button"
                          className="hbtn"
                          aria-controls={DETAILS_ID}
                          aria-expanded={false}
                          onClick={() => openDetails(item.id)}
                        >
                          {item.title}
                        </button>
                        <a className="rowlink" title={tr('zonemap.referencePage')} href={item.href}>
                          ↗
                        </a>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="legendfoot">{tr('zonemap.legend.foot')}</div>
            </>
          )}
        </aside>
      </div>

    </div>
  );
}
