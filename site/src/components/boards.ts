/*
 * The diagram boards, as data.
 *
 * `DiagramBoard.astro` is a renderer: it knows about boxes, zone bands and
 * links, and nothing about topology or data flow. Everything a specific board
 * says lives here, so adding a board is a data edit and the renderer's
 * invariants hold for it automatically.
 *
 * Text rules, from TRANSLATION-GUIDE: identifiers, paths, CLI commands and bb's
 * own UI strings are reproduced exactly; everything around them is English.
 * Captions carry no hand-written `file:line` citations (VERIFIED-AT-PIN): a
 * restated line number is a claim nothing checks, and it drifts the moment the
 * pin moves.
 */

/** A full-width band naming the process or phase the boxes below it run in. */
export interface BoardZone {
  kind: 'zone';
  text: string;
}

export interface BoardBox {
  kind: 'box';
  id: string;
  title: string;
  /** Monospace detail lines. */
  lines?: string[];
  /** `grid-area` name, when the board places boxes by named areas. */
  area?: string;
  /** Column span, when the board places boxes by flow. */
  span?: number;
  /** Plugin-authored code: filled a step darker so the three entries stand out. */
  own?: boolean;
  /** A box that is an aside rather than a step in the flow. */
  flat?: boolean;
  /** Ordinal drawn as a chip before the title. */
  num?: number;
}

export type BoardItem = BoardZone | BoardBox;

/**
 * How a connector gets from one box to another.
 *
 * `h` and `v` run straight through the gap between two rows or two columns,
 * `snake` drops into the gap below the source, crosses and drops again, and the
 * two `lane` routes run out to the side of the board. `auto` picks `h` or `v`
 * from the overlap of the two boxes. The router rejects any of them that would
 * cross a third box and falls back through the remaining shapes.
 */
export type BoardRoute = 'auto' | 'h' | 'v' | 'snake' | 'lane-left' | 'lane-right';

export interface BoardLink {
  from: string;
  to: string;
  /** Step number, drawn as a chip on the wire. */
  n?: number;
  /** `call` is a solid arrow, `async` a dashed one — a signal coming back. */
  kind: 'call' | 'async';
  route?: BoardRoute;
  /** Nudge along the perpendicular axis, in px, when the default band is busy. */
  off?: number;
  label?: string;
}

export interface BoardLegendItem {
  /** `line` solid, `dash` dashed, `box` a filled swatch. */
  mark: 'line' | 'dash' | 'box';
  text: string;
}

export interface Board {
  id: string;
  /** Accessible name for the figure. */
  title: string;
  legend: BoardLegendItem[];
  columns: string;
  /** `row column` gap, e.g. `40px 90px`. */
  gap: string;
  /** `grid-template-areas`, when boxes carry `area`. */
  areas?: string;
  items: BoardItem[];
  links: BoardLink[];
  caption: string;
}

const box = (b: Omit<BoardBox, 'kind'>): BoardBox => ({ kind: 'box', ...b });
const zone = (text: string): BoardZone => ({ kind: 'zone', text });

/* ------------------------------------------------------- system overview --- */

const systemOverview: Board = {
  id: 'system-overview',
  title: 'bb’s three processes and where a plugin’s entries run in them',
  legend: [
    { mark: 'line', text: 'request' },
    { mark: 'dash', text: 'push back' },
    { mark: 'box', text: 'plugin code' },
  ],
  columns: '1fr 1fr 1fr',
  gap: '44px 40px',
  items: [
    zone('Client: the bb app window (web, desktop, mobile) and the bb CLI'),
    box({
      id: 'o-app',
      span: 2,
      title: 'the bb app window and the bb CLI',
      lines: ['threads, the composer, the sidebar, settings', 'bb <command>, typed by a person or run by the agent'],
    }),
    box({
      id: 'o-app-entry',
      own: true,
      title: 'bb.app · app entry',
      lines: ['your UI, mounted in the same window'],
    }),
    zone('Server: one per installation, SQLite is the source of truth'),
    box({
      id: 'o-server',
      span: 2,
      title: 'the bb server',
      lines: ['projects, threads, settings, plugins', 'the HTTP API and WebSocket /ws', '127.0.0.1 by default'],
    }),
    box({
      id: 'o-server-entry',
      own: true,
      title: 'bb.server · server entry',
      lines: ['required', 'your logic, inside the server process'],
    }),
    zone('Host daemon: one per machine that runs agents'),
    box({
      id: 'o-daemon',
      span: 2,
      title: 'the host daemon',
      lines: ['starts the agent provider process', 'the thread’s workspace directory is on this machine', 'enrolls with the server as a host'],
    }),
    box({
      id: 'o-host-entry',
      own: true,
      title: 'bb.host · host entry',
      lines: ['optional', 'your code on that machine'],
    }),
  ],
  links: [
    { from: 'o-app', to: 'o-server', kind: 'call', route: 'v', off: -90, label: 'HTTP API' },
    { from: 'o-server', to: 'o-app', kind: 'async', route: 'v', off: 90, label: 'WebSocket /ws' },
    { from: 'o-server', to: 'o-daemon', kind: 'call', route: 'v', off: -90, label: 'thread commands' },
    { from: 'o-daemon', to: 'o-server', kind: 'async', route: 'v', off: 90, label: 'events back' },
    { from: 'o-app-entry', to: 'o-server-entry', kind: 'call', route: 'v', label: 'RPC' },
    { from: 'o-server-entry', to: 'o-host-entry', kind: 'call', route: 'v', label: 'host RPC' },
  ],
  caption:
    'The server holds all state; the app window, the CLI and every host daemon are its clients. A plugin always has a server entry, and adds an app entry or a host entry when it needs one.',
};

/* --------------------------------------------------------- quick start --- */

const quickstartWiring: Board = {
  id: 'quickstart-wiring',
  title: 'How the hello plugin is wired together',
  legend: [
    { mark: 'line', text: 'direct call (steps 1–4)' },
    { mark: 'dash', text: 'realtime signal back' },
    { mark: 'box', text: 'code you wrote' },
  ],
  columns: '1fr 1fr 1.05fr',
  gap: '40px 44px',
  areas: "'page rpc srv' 'cli clir srv' 'agent agentr srv' 'kv kv kv' 'ws ws ws'",
  items: [
    box({
      id: 'h-page',
      area: 'page',
      own: true,
      title: 'app.tsx · navPanel “Example todos”',
      lines: [
        '/plugins/hello/example-todos',
        'rpc.call("todos_add", …)',
        'useRealtime("todos-changed", refetch)',
      ],
    }),
    box({
      id: 'h-rpc',
      area: 'rpc',
      title: 'POST /api/v1/plugins/hello/rpc/<method>',
      lines: ['input validated by the schema', '{ ok:true, result } | { ok:false, error }'],
    }),
    box({
      id: 'h-srv',
      area: 'srv',
      own: true,
      title: 'server.ts — jiti, same process',
      lines: [
        'bb.settings.define({ showDone })',
        'bb.rpc.register(rpcContract, …)',
        'bb.cli.register({ name: "hello" })',
        'bb.realtime.publish("todos-changed")',
        'bb.onDispose(() => …)',
      ],
    }),
    box({
      id: 'h-cli',
      area: 'cli',
      title: 'bb hello add "Ship it"',
      lines: ['run() executes on the server, not in the CLI'],
    }),
    box({
      id: 'h-clir',
      area: 'clir',
      title: 'POST /api/v1/plugins/hello/cli',
      lines: ['{ argv, cwd?, threadId? }'],
    }),
    box({
      id: 'h-agent',
      area: 'agent',
      title: 'the agent in the thread',
      lines: ['skills/example-todos/SKILL.md is injected into the thread'],
    }),
    box({
      id: 'h-agentr',
      area: 'agentr',
      title: 'the same bb hello command',
      lines: ['the agent never reaches the store directly'],
    }),
    box({
      id: 'h-kv',
      area: 'kv',
      title: 'bb.storage.kv → plugin_kv in bb.db',
      lines: ['key "todos", JSON ≤ 256 KB', 'beside it: <dataDir>/plugins/hello/'],
    }),
    box({
      id: 'h-ws',
      area: 'ws',
      title:
        'WebSocket /ws — { type:"plugin-signal", pluginId:"hello", channel:"todos-changed", payload }',
      lines: [
        'ephemeral: nothing is stored and nothing is replayed; the client does the filtering, so this is not a confidentiality boundary',
      ],
    }),
  ],
  links: [
    { from: 'h-page', to: 'h-rpc', n: 1, kind: 'call', route: 'h', label: 'rpc.call(…)' },
    { from: 'h-rpc', to: 'h-srv', kind: 'call', route: 'h' },
    { from: 'h-cli', to: 'h-clir', n: 2, kind: 'call', route: 'h', label: 'CLI → server' },
    { from: 'h-clir', to: 'h-srv', kind: 'call', route: 'h' },
    { from: 'h-agent', to: 'h-agentr', n: 3, kind: 'call', route: 'h', label: 'the same command' },
    { from: 'h-agentr', to: 'h-srv', kind: 'call', route: 'h' },
    { from: 'h-srv', to: 'h-kv', kind: 'call', route: 'v', label: 'read and write' },
    {
      from: 'h-srv',
      to: 'h-ws',
      n: 4,
      kind: 'async',
      route: 'lane-right',
      label: 'publish to every client',
    },
    {
      from: 'h-ws',
      to: 'h-page',
      kind: 'async',
      route: 'lane-left',
      label: 'every page refetches',
    },
  ],
  caption:
    '1 the page over RPC · 2 the CLI · 3 the agent running the same command · 4 the signal back to every client. State lives only on the server: the page, the CLI and the agent are three clients of one server.ts.',
};

/* ------------------------------------------------------ runtime topology --- */

const runtimeTopology: Board = {
  id: 'runtime-topology',
  title: 'Where each of a plugin’s three entries runs',
  legend: [
    { mark: 'line', text: 'direct call' },
    { mark: 'dash', text: 'signal or push back' },
    { mark: 'box', text: 'plugin code' },
  ],
  columns: '1.15fr 1fr 1fr',
  gap: '54px 32px',
  items: [
    zone('Browser · Electron renderer — one JS realm, one origin · the user and the agent'),
    box({
      id: 't-app',
      span: 2,
      own: true,
      title: 'plugin dist/app.js inside the bb React app',
      lines: [
        'native import(), the same realm — not a sandbox',
        'globalThis.__bbPluginRuntime ← installPluginRuntime()',
        'shims: react, radix portals, sonner, vaul, clsx…',
      ],
    }),
    box({
      id: 't-cli',
      title: 'bb CLI and the agent',
      lines: ['$BB_CLI · bb <command>', 'agent tools and skills', 'the tool set is frozen at session start'],
    }),
    zone('Server process (Node) — SQLite is the source of truth, 127.0.0.1 by default'),
    box({
      id: 't-routes',
      span: 3,
      title: 'Hono · /api/v1/* (origin guard) · /internal/* (daemon bearer)',
      lines: [
        '/plugins/<id>/{assets, rpc, http, cli, token} · WebSocket /ws · POST /plugins/reload',
        'the only exemption from the origin guard is /plugins/<id>/http/*',
      ],
    }),
    box({
      id: 't-server',
      span: 2,
      own: true,
      title: 'plugin server.ts — jiti.import, same process',
      lines: [
        'full trust: fs, net, child_process, fetch',
        'bb.rpc · bb.http · bb.realtime · bb.storage',
        'bb.agents · bb.cli · bb.providers · bb.sdk',
        'factory time-boxed at 30 s, dispose LIFO',
      ],
    }),
    box({
      id: 't-service',
      title: 'PluginService',
      lines: [
        'loadAll / loadOne / reload',
        'status: 8 values',
        'wireLookup(loaded)',
        'generation = randomUUID() per artifact load',
      ],
    }),
    zone('Host daemon — one per enrolled machine'),
    box({
      id: 't-host',
      span: 2,
      own: true,
      title: 'plugin host worker — dist/host.js',
      lines: [
        'fork(bb-plugin-host-worker.mjs)',
        'stdio: ignore, ignore, pipe, ipc',
        'sha256 verified before launch, ≤ 256 MiB',
      ],
    }),
    box({
      id: 't-provider',
      title: 'provider subprocess — the agent',
      lines: [
        'bridge: JSON-RPC 2.0 over stdio',
        'the delta assembler stays in the daemon',
        'claude-code · codex · pi · acp-*',
      ],
    }),
    zone('Remote machine — provisioned by a machine provider'),
    box({
      id: 't-exec',
      span: 2,
      title: 'MachineExecutor.exec(argv)',
      lines: [
        'the plugin owns the transport, stdin stays private',
        'output flows through onOutput into the progress log',
      ],
    }),
    box({
      id: 't-remote',
      title: 'installed host daemon',
      lines: ['enroll → server, its own WebSocket session', 'its own copies of the plugins’ host workers'],
    }),
  ],
  links: [
    { from: 't-app', to: 't-routes', n: 1, kind: 'call', route: 'v', off: -150, label: 'useRpc → POST /rpc' },
    { from: 't-routes', to: 't-app', n: 2, kind: 'async', route: 'v', off: 60, label: '/ws: plugin-signal' },
    { from: 't-cli', to: 't-routes', n: 3, kind: 'call', route: 'v', label: 'POST /plugins/<id>/cli' },
    { from: 't-routes', to: 't-server', n: 4, kind: 'call', route: 'v', off: -120 },
    { from: 't-service', to: 't-provider', n: 5, kind: 'call', route: 'v', label: 'thread commands' },
    { from: 't-server', to: 't-host', n: 6, kind: 'call', route: 'v', off: -120, label: 'plugin.host.call' },
    { from: 't-host', to: 't-server', n: 7, kind: 'async', route: 'v', off: 90, label: 'experimental_emitSignal' },
    { from: 't-host', to: 't-exec', n: 8, kind: 'call', route: 'v', off: -100, label: 'bootstrap({ key, executor })' },
    { from: 't-remote', to: 't-routes', n: 9, kind: 'async', route: 'lane-right', label: 'enrollment + WebSocket back' },
  ],
  caption:
    'The three plugin entries are the filled boxes: bb.server in the server process, bb.app in the application’s realm, bb.host on the daemon. Each runs at a different level of trust.',
};

/* ---------------------------------------------------- canonical data flow --- */

const canonicalDataFlow: Board = {
  id: 'canonical-data-flow',
  title: 'The canonical data flow into one server entry',
  legend: [
    { mark: 'line', text: 'direct call (steps 1–8)' },
    { mark: 'dash', text: 'push back' },
    { mark: 'box', text: 'plugin code' },
  ],
  columns: '1fr 1fr 1.05fr',
  gap: '40px 44px',
  areas:
    "'app rpc srv' 'appws ws srv' 'cli clir srv' 'tool toolr srv' 'hook hookr srv' 'state state state' 'host host host'",
  items: [
    box({
      id: 'f-app',
      area: 'app',
      own: true,
      title: 'app.tsx',
      lines: [
        'useRpc<typeof rpcContract>()',
        'rpc.call("listIssues", { … })',
        'import type — the backend is erased from the bundle',
      ],
    }),
    box({
      id: 'f-rpc',
      area: 'rpc',
      title: 'POST /plugins/<id>/rpc/<method>',
      lines: ['input schema → handler → output schema'],
    }),
    box({
      id: 'f-srv',
      area: 'srv',
      own: true,
      title: 'server.ts — the factory, in the server process',
      lines: [
        'bb.rpc.register(…)',
        'bb.http.route(…)',
        'bb.cli.register({ name, run })',
        'bb.agents.registerTool(…)',
        'bb.realtime.publish(…)',
        'the result is strict JSON',
      ],
    }),
    box({
      id: 'f-appws',
      area: 'appws',
      own: true,
      flat: true,
      title: 'useRealtime("issues:changed", fn)',
      lines: ['the same component refetches its data'],
    }),
    box({
      id: 'f-ws',
      area: 'ws',
      title: 'WebSocket /ws — one shared socket',
      lines: ['{ type, pluginId, channel, payload }', 'broadcast to all; the client filters'],
    }),
    box({
      id: 'f-cli',
      area: 'cli',
      title: 'bb CLI',
      lines: ['bb <command> … · argv without the command name'],
    }),
    box({
      id: 'f-clir',
      area: 'clir',
      title: 'POST /plugins/<id>/cli',
      lines: ['run() executes on the server'],
    }),
    box({
      id: 'f-tool',
      area: 'tool',
      title: 'agent tool',
      lines: ['the tool set is frozen at session start'],
    }),
    box({
      id: 'f-toolr',
      area: 'toolr',
      title: 'called inside the server process',
      lines: ['errors come back as text'],
    }),
    box({
      id: 'f-hook',
      area: 'hook',
      title: 'external service · webhook',
      lines: ['POST with the signature in the request body'],
    }),
    box({
      id: 'f-hookr',
      area: 'hookr',
      title: 'ALL /plugins/<id>/http/<path>',
      lines: ['your own route, exact path match'],
    }),
    box({
      id: 'f-state',
      area: 'state',
      title: 'state and the outside world',
      lines: ['bb.storage.kv · bb.storage.database()', 'fetch · fs · child_process'],
    }),
    box({
      id: 'f-host',
      area: 'host',
      own: true,
      title: 'host.ts, on the agent’s machine',
      lines: [
        'called through bb.hosts.experimental_client(…)',
        'signals back with experimental_emitSignal(…)',
      ],
    }),
  ],
  links: [
    { from: 'f-app', to: 'f-rpc', n: 1, kind: 'call', route: 'h', label: 'rpc.call(…)' },
    { from: 'f-rpc', to: 'f-srv', n: 2, kind: 'call', route: 'h', off: -60, label: 'validation' },
    { from: 'f-srv', to: 'f-ws', n: 3, kind: 'async', route: 'h', off: -20, label: 'bb.realtime.publish' },
    { from: 'f-ws', to: 'f-appws', n: 4, kind: 'async', route: 'h', label: 'useRealtime → refetch' },
    { from: 'f-cli', to: 'f-clir', n: 5, kind: 'call', route: 'h', label: 'POST /cli' },
    { from: 'f-clir', to: 'f-srv', kind: 'call', route: 'h' },
    { from: 'f-tool', to: 'f-toolr', n: 6, kind: 'call', route: 'h', label: 'execute(…)' },
    { from: 'f-toolr', to: 'f-srv', kind: 'call', route: 'h' },
    { from: 'f-hook', to: 'f-hookr', n: 7, kind: 'call', route: 'h', label: 'signature in the body' },
    { from: 'f-hookr', to: 'f-srv', kind: 'call', route: 'h' },
    { from: 'f-srv', to: 'f-host', n: 8, kind: 'call', route: 'lane-right', label: 'host RPC' },
    { from: 'f-srv', to: 'f-state', kind: 'call', route: 'v', label: 'read and write' },
  ],
  caption:
    '1–2 RPC · 3–4 realtime · 5 CLI · 6 agent tool · 7 webhook over an HTTP route · 8 host RPC. Five callers, one server entry, and no shared memory between any of them.',
};

/* ------------------------------------------------------- lifecycle order --- */

const lifecycleOrder: Board = {
  id: 'lifecycle-order',
  title: 'Load order and dispose order',
  legend: [
    { mark: 'line', text: 'next step' },
    { mark: 'dash', text: 'failure path' },
    { mark: 'box', text: 'plugin code runs here' },
  ],
  /* Three columns, not four: at the ~680 px the prose column gives a board,
   * four columns are 150 px wide and `disposePluginHost` breaks mid-token. */
  columns: 'repeat(3, 1fr)',
  gap: '34px 30px',
  items: [
    zone('loadOne'),
    box({ id: 'l1', num: 1, title: 'hold → identity → enabled', lines: ['a held source or !row.enabled → disabled'] }),
    box({ id: 'l2', num: 2, title: 'stat(rootDir) → manifest', lines: ['no directory → missing'] }),
    box({ id: 'l3', num: 3, title: 'engines and SDK range', lines: ['no match → incompatible'] }),
    box({ id: 'l4', num: 4, title: 'app bundle and host artifact', lines: ['the digest is checked against host.meta.json'] }),
    box({ id: 'l5', num: 5, title: 'branding assets', lines: ['the SVG validator can fail the load'] }),
    box({ id: 'l6', num: 6, own: true, title: 'createPluginApi', lines: ['the bb object for this load'] }),
    box({ id: 'l7', num: 7, own: true, title: 'jiti.import + factory', lines: ['time-boxed at 30 s'] }),
    box({ id: 'l8', num: 8, title: 'dispose the previous instance', lines: ['here, after the factory — not before it'] }),
    box({ id: 'l9', num: 9, title: 'loaded.set(id, …)', lines: ['wireLookup starts seeing it'] }),
    box({ id: 'l10', num: 10, title: 'handle.activate()', lines: ['providers, AI services, ports'] }),
    box({ id: 'l11', num: 11, title: 'cron strings and services', lines: ['→ setStatus("running")'] }),
    box({
      id: 'l12',
      flat: true,
      title: 'the factory throws',
      lines: ['the previous instance stays alive; status running with the detail “reload failed: …”'],
    }),
    zone('disposePluginInstance — strict order'),
    box({ id: 'd1', num: 1, title: 'closeWebSockets', lines: ['code 1012'] }),
    box({ id: 'd2', num: 2, title: 'disposePluginHost', lines: ['{ pluginId, generation }'] }),
    box({ id: 'd3', num: 3, title: 'abortPluginToolCalls', lines: ['"plugin-disposed"'] }),
    box({ id: 'd4', num: 4, title: 'interruptInteractions', lines: ['reason: plugin-disposed'] }),
    box({ id: 'd5', num: 5, title: 'stopServices', lines: ['5 s → degraded'] }),
    box({ id: 'd6', num: 6, own: true, title: 'onDispose', lines: ['LIFO; one failing hook does not stop the rest'] }),
    box({ id: 'd7', num: 7, title: 'drainInvocations', lines: ['wait for in-flight work, log after 5 s'] }),
    box({ id: 'd8', num: 8, title: 'close better-sqlite3', lines: ['every tracked handle'] }),
    box({
      id: 'd9',
      num: 9,
      title: 'finally handle.invalidate()',
      lines: ['any late bb.* call → PluginContextStaleError'],
    }),
  ],
  /* Three to a row, so every third link wraps to the next one. */
  links: [
    { from: 'l1', to: 'l2', kind: 'call', route: 'h' },
    { from: 'l2', to: 'l3', kind: 'call', route: 'h' },
    { from: 'l3', to: 'l4', kind: 'call', route: 'snake' },
    { from: 'l4', to: 'l5', kind: 'call', route: 'h' },
    { from: 'l5', to: 'l6', kind: 'call', route: 'h' },
    { from: 'l6', to: 'l7', kind: 'call', route: 'snake' },
    { from: 'l7', to: 'l8', kind: 'call', route: 'h' },
    { from: 'l8', to: 'l9', kind: 'call', route: 'h' },
    { from: 'l9', to: 'l10', kind: 'call', route: 'snake' },
    { from: 'l10', to: 'l11', kind: 'call', route: 'h' },
    { from: 'l7', to: 'l12', kind: 'async', route: 'snake', label: 'throw' },
    { from: 'd1', to: 'd2', kind: 'call', route: 'h' },
    { from: 'd2', to: 'd3', kind: 'call', route: 'h' },
    { from: 'd3', to: 'd4', kind: 'call', route: 'snake' },
    { from: 'd4', to: 'd5', kind: 'call', route: 'h' },
    { from: 'd5', to: 'd6', kind: 'call', route: 'h' },
    { from: 'd6', to: 'd7', kind: 'call', route: 'snake' },
    { from: 'd7', to: 'd8', kind: 'call', route: 'h' },
    { from: 'd8', to: 'd9', kind: 'call', route: 'h' },
  ],
  caption:
    'The previous instance is disposed after the new factory has run, not before it, so a failing reload leaves the running plugin alone. One failing dispose hook does not stop the rest of the cleanup.',
};

export const BOARDS: Readonly<Record<string, Board>> = Object.freeze({
  [systemOverview.id]: systemOverview,
  [quickstartWiring.id]: quickstartWiring,
  [runtimeTopology.id]: runtimeTopology,
  [canonicalDataFlow.id]: canonicalDataFlow,
  [lifecycleOrder.id]: lifecycleOrder,
});

export function boardById(id: string): Board {
  const board = BOARDS[id];
  if (!board) {
    throw new Error(
      `Unknown diagram board "${id}". Known boards: ${Object.keys(BOARDS).join(', ')}.`,
    );
  }
  return board;
}
