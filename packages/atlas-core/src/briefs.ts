/**
 * The agent brief: one Markdown document that tells a coding agent everything
 * it needs to build one bb plugin capability.
 *
 * There is exactly one implementation. bb's own «copy for agent» button puts
 * three lines on the clipboard — a title, a comma-separated symbol list, and an
 * instruction to go read the SDK. This adds what those three lines leave out:
 * which manifest entry registers the capability, the exact registration call,
 * the props type, whether a second plugin can share the slot, the file:line of
 * every symbol at a known commit, a first-party plugin to read, the rules that
 * bite, and what "done" means.
 *
 * Output is English: the brief is consumed by an agent working in an
 * English-language codebase.
 */
import {
  annotationFor,
  annotationsOfKind,
  type Annotation,
  type AnnotationKind,
  type AnnotationReference,
} from "./annotations.ts";
import { permalink, type Pin } from "./permalink.ts";
import { RULES } from "./rules.ts";

/**
 * The rule bank a render call should quote from.
 *
 * Passed in rather than imported by the renderers, so that a browser can import
 * `renderBasket` without pulling 19 KB of rule prose into the bundle with it.
 * The page that needs it fetches `/briefs.json`, which serves the same map.
 * Server-side callers pass `RULES`.
 */
export type RuleBank = Readonly<Record<string, string>>;
import type { Group, Plugin, Surface, SymbolRecord } from "./schema.ts";

export interface BriefPin extends Pin {
  tag: string;
  bbVersion: string;
  sdkVersion: string;
}

/** The generated data a brief is assembled from. */
export interface BriefSources {
  pin: BriefPin;
  groups: readonly Group[];
  surfaces: readonly Surface[];
  symbols: readonly SymbolRecord[];
  plugins?: readonly Plugin[];
}

export interface BriefSymbol extends SymbolRecord {
  url: string;
}

export interface Brief {
  kind: AnnotationKind;
  id: string;
  title: string;
  groupTitle: string | null;
  number: number | null;
  summary: string;
  bullets: readonly string[];
  tagline: string | null;
  entry: Annotation["entry"];
  manifestEntry: string;
  registration: string;
  propsType: string | null;
  slotKind: Annotation["slotKind"];
  stability: Annotation["stability"];
  symbols: readonly BriefSymbol[];
  reference: readonly AnnotationReference[];
  rules: readonly string[];
  doneWhen: readonly string[];
  sourceUrl: string | null;
  guideAnchor: string | null;
  mockupHash: string | null;
}

const SURFACES_PATH = "packages/plugin-api-map/src/surfaces.ts";

const MANIFEST_NOTE: Record<string, string> = {
  "bb.app": "frontend bundle",
  "bb.server": "backend",
  "bb.host": "host artifact, runs on the machine bb is connected to",
};

const SLOT_KIND_NOTE: Record<NonNullable<Annotation["slotKind"]>, string> = {
  additive: "additive — several plugins coexist in this slot",
  replacement:
    "replacement — bb passes `Original`; render it to delegate the cases you do not want to own",
  exclusive:
    "exclusive — one plugin owns this per installation and the user picks the winner in Settings → Appearance, so do not assume yours is active",
};

const STABILITY_NOTE: Record<Annotation["stability"], string> = {
  stable: "stable",
  experimental:
    "experimental — the name carries an `experimental_` prefix and both the name and the shape can change in a minor release; see docs/api_to_audit.md",
  mixed:
    "mixed — some members are stable and some carry an `experimental_` prefix; see docs/api_to_audit.md",
};

const KIND_HEADING: Record<AnnotationKind, string> = {
  surface: "bb plugin surface",
  slot: "bb plugin slot",
  namespace: "bb plugin API namespace",
  advanced: "bb plugin capability",
};

const SDK_CONTRACT_NOTE = [
  "The SDK installed on this machine is the contract: run `bb plugin types`, then read",
  "node_modules/@get-bb/plugin-sdk/bundled-types/bb-plugin-sdk-app.d.ts (frontend) or bb-plugin-sdk.d.ts (backend)",
  "before writing code. If a symbol below is missing there, the installed bb is older or newer — trust the declarations, not this brief.",
].join("\n");

export class UnknownBriefError extends Error {
  constructor(kind: AnnotationKind, id: string) {
    super(`No ${kind} annotation for "${id}".`);
    this.name = "UnknownBriefError";
  }
}

export function createBriefs(sources: BriefSources) {
  const { pin } = sources;
  const surfaceById = new Map(sources.surfaces.map((surface) => [surface.id, surface]));
  const groupById = new Map(sources.groups.map((group) => [group.id, group]));
  const symbolByName = new Map(sources.symbols.map((symbol) => [symbol.name, symbol]));

  function symbolsFor(names: readonly string[]): BriefSymbol[] {
    const out: BriefSymbol[] = [];
    for (const name of names) {
      const symbol = symbolByName.get(name);
      // A name with no record is dropped rather than linked to nowhere; the
      // sync already refuses to produce data with unresolved symbols.
      if (symbol) out.push({ ...symbol, url: permalink(pin, symbol.path, symbol.line) });
    }
    return out;
  }

  function build(kind: AnnotationKind, id: string): Brief {
    const annotation = annotationFor(kind, id);
    if (!annotation) throw new UnknownBriefError(kind, id);

    const surface = kind === "surface" ? surfaceById.get(id) : undefined;
    if (kind === "surface" && !surface) throw new UnknownBriefError(kind, id);

    const group = surface ? groupById.get(surface.group) : undefined;
    const names = surface ? surface.apiSymbols : (annotation.symbols ?? []);

    return {
      kind,
      id,
      title: surface?.title ?? annotation.title ?? id,
      groupTitle: group?.title ?? null,
      number: surface?.number ?? null,
      summary: surface?.summary ?? annotation.summary ?? "",
      bullets: surface?.bullets ?? [],
      tagline: surface?.tagline ?? null,
      entry: annotation.entry,
      manifestEntry: annotation.manifestEntry,
      registration: annotation.registration,
      propsType: annotation.propsType,
      slotKind: annotation.slotKind,
      stability: annotation.stability,
      symbols: symbolsFor(names),
      reference: annotation.reference,
      rules: annotation.rules,
      doneWhen: annotation.doneWhen,
      sourceUrl: surface ? permalink(pin, SURFACES_PATH, surface.sourceLine) : null,
      guideAnchor: annotation.guideAnchor,
      mockupHash: annotation.mockupHash,
    };
  }

  return {
    build,
    markdown: (kind: AnnotationKind, id: string) => renderBrief(build(kind, id), pin, RULES),
    basket: (refs: readonly { kind: AnnotationKind; id: string }[]) =>
      renderBasket(
        refs.map((ref) => build(ref.kind, ref.id)),
        pin,
        RULES,
      ),
    ids: (kind: AnnotationKind) => annotationsOfKind(kind).map((annotation) => annotation.id),
  };
}

/* ------------------------------------------------------------------ render */

function verifiedAgainst(pin: BriefPin): string {
  return `Verified against bb ${pin.tag} (commit ${pin.commit}), @get-bb/plugin-sdk ${pin.sdkVersion}.`;
}

function section(heading: string, body: string | null): string | null {
  return body === null || body.length === 0 ? null : `## ${heading}\n${body}`;
}

function whatItDoes(brief: Brief): string | null {
  const parts = [brief.summary, ...brief.bullets.map((bullet) => `- ${bullet}`)].filter(Boolean);
  return parts.length === 0 ? null : parts.join("\n");
}

function whereItPlugsIn(brief: Brief): string {
  const manifestNote = MANIFEST_NOTE[brief.manifestEntry];
  const lines = [
    `- Manifest entry: \`${brief.manifestEntry}\`${manifestNote ? ` (${manifestNote})` : ""}`,
    `- Registration: \`${brief.registration}\``,
  ];
  if (brief.propsType) lines.push(`- Props/handler type: \`${brief.propsType}\``);
  if (brief.slotKind) lines.push(`- Slot kind: ${SLOT_KIND_NOTE[brief.slotKind]}`);
  lines.push(`- Stability: ${STABILITY_NOTE[brief.stability]}`);
  return lines.join("\n");
}

function sdkSymbols(brief: Brief): string | null {
  if (brief.symbols.length === 0) return null;
  return brief.symbols.map((symbol) => `- \`${symbol.name}\` — ${symbol.path}:${symbol.line}`).join("\n");
}

function readThisFirst(brief: Brief): string | null {
  if (brief.reference.length === 0) return null;
  const lines = brief.reference.map((entry) => `- \`${entry.file}\` — ${entry.note}`);
  lines.push("", "Clone or open the bb repo at that commit to read them.");
  return lines.join("\n");
}

function rulesThatBite(rules: readonly string[], bank: RuleBank): string | null {
  const texts = rules.map((id) => bank[id]).filter(Boolean);
  return texts.length === 0 ? null : texts.map((text) => `- ${text}`).join("\n");
}

function doneWhen(items: readonly string[]): string | null {
  return items.length === 0
    ? null
    : items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function sourceOfTruth(brief: Brief, pin: BriefPin): string {
  const lines: string[] = [];
  if (brief.sourceUrl) lines.push(`- Surface definition: ${brief.sourceUrl}`);
  for (const symbol of brief.symbols) lines.push(`- \`${symbol.name}\`: ${symbol.url}`);
  const where = brief.groupTitle
    ? ` → ${brief.groupTitle}${brief.number === null ? "" : ` → ${brief.number}`}`
    : "";
  lines.push(
    `- bb's own Plugin Guide: enable the \`plugin-api-docs\` plugin, then open Plugin Guide${where}`,
  );
  lines.push(`- Pinned upstream tree: ${permalink(pin, "packages/plugin-sdk/src")}`);
  return lines.join("\n");
}

/** One capability, as Markdown. */
export function renderBrief(brief: Brief, pin: BriefPin, rules: RuleBank): string {
  const blocks = [
    `# ${KIND_HEADING[brief.kind]}: ${brief.title} (\`${brief.id}\`)`,
    ["Goal: implement this capability in a bb plugin.", verifiedAgainst(pin), SDK_CONTRACT_NOTE].join(
      "\n",
    ),
    section("What it does", whatItDoes(brief)),
    section("Where it plugs in", whereItPlugsIn(brief)),
    section("SDK symbols", sdkSymbols(brief)),
    section("Read this first", readThisFirst(brief)),
    section("Rules that will bite you", rulesThatBite(brief.rules, rules)),
    section("Done when", doneWhen(brief.doneWhen)),
    section("Source of truth", sourceOfTruth(brief, pin)),
  ];
  return `${blocks.filter((block): block is string => block !== null).join("\n\n")}\n`;
}

const SCAFFOLD = [
  "```",
  "bb plugin new <name>      # creates ./bb-plugin-<name> — no flags; scaffold has server.ts, app.tsx, skills/",
  "cd bb-plugin-<name>",
  "bb plugin install .       # registers the directory in place",
  "bb plugin dev             # rebuild + reload on every save",
  "```",
].join("\n");

const ARCHITECTURE =
  "app.tsx (useRpc) → bb.rpc → server.ts → storage/network. State lives on the server; the frontend, the CLI and the agent are three clients of one `server.ts`.";

/** Several capabilities in one plugin: shared preamble, deduplicated tails. */
export function renderBasket(briefs: readonly Brief[], pin: BriefPin, rules: RuleBank): string {
  if (briefs.length === 0) throw new RangeError("A basket brief needs at least one capability.");
  if (briefs.length === 1) return renderBrief(briefs[0], pin, rules);

  const manifestEntries = [...new Set(briefs.map((brief) => brief.manifestEntry))].sort();
  const ruleIds = dedupe(briefs.flatMap((brief) => brief.rules));
  const done = dedupe(briefs.flatMap((brief) => brief.doneWhen));

  const capabilities = briefs
    .map((brief, index) => {
      const lines = [
        `### ${index + 1}. ${brief.title} (\`${brief.id}\`) — \`${brief.registration}\``,
        brief.summary,
        ...brief.bullets.map((bullet) => `- ${bullet}`),
        `- Manifest entry: \`${brief.manifestEntry}\``,
      ];
      if (brief.propsType) lines.push(`- Props/handler type: \`${brief.propsType}\``);
      if (brief.slotKind) lines.push(`- Slot kind: ${SLOT_KIND_NOTE[brief.slotKind]}`);
      lines.push(`- Stability: ${STABILITY_NOTE[brief.stability]}`);
      if (brief.symbols.length > 0) {
        lines.push(
          ...brief.symbols.map((symbol) => `- \`${symbol.name}\` — ${symbol.path}:${symbol.line}`),
        );
      }
      for (const entry of brief.reference) lines.push(`- Read \`${entry.file}\` — ${entry.note}`);
      return lines.filter(Boolean).join("\n");
    })
    .join("\n\n");

  const sources = dedupe([
    ...briefs.flatMap((brief) => (brief.sourceUrl ? [`- ${brief.title}: ${brief.sourceUrl}`] : [])),
    ...briefs.flatMap((brief) => brief.symbols.map((symbol) => `- \`${symbol.name}\`: ${symbol.url}`)),
  ]);

  const blocks = [
    `# bb plugin: ${briefs.length} capabilities`,
    [
      "Goal: build one bb plugin that provides the capabilities below.",
      verifiedAgainst(pin),
      SDK_CONTRACT_NOTE,
    ].join("\n"),
    section(
      "Scaffold",
      `${SCAFFOLD}\nManifest entries needed for these capabilities: ${manifestEntries
        .map((entry) => `\`${entry}\``)
        .join(", ")}`,
    ),
    section("Architecture", ARCHITECTURE),
    section("Capabilities", capabilities),
    section("Rules that will bite you", rulesThatBite(ruleIds, rules)),
    section("Done when", doneWhen(done)),
    section("Source of truth", sources.join("\n")),
  ];
  return `${blocks.filter((block): block is string => block !== null).join("\n\n")}\n`;
}

function dedupe(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/* -------------------------------------------------------------- bb mention */

/**
 * The clipboard payload bb's composer recognises as a real mention, byte for
 * byte as `packages/plugin-api-map/src/agent-reference.ts` writes it.
 *
 * Key order inside the `resource` JSON and the order of the escape passes are
 * both load-bearing: the composer compares the serialized string, so a
 * differently-ordered but equivalent payload pastes as plain text.
 */
export const PLUGIN_GUIDE_PLUGIN_ID = "plugin-api-docs";
export const PLUGIN_GUIDE_SURFACE_PROVIDER_ID = "surface";

const MENTION_PREFIX = "Build a plugin that uses ";
const MENTION_SUFFIX = " ";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export interface BbMention {
  text: string;
  html: string;
  context: string;
}

export function bbMention(surface: Pick<Surface, "id" | "title" | "apiSymbols">): BbMention {
  const serializedText = `@${surface.title}`;
  const resource = {
    kind: "plugin",
    pluginId: PLUGIN_GUIDE_PLUGIN_ID,
    icon: null,
    itemId: `${PLUGIN_GUIDE_SURFACE_PROVIDER_ID}:${surface.id}`,
    label: surface.title,
  };
  return {
    text: `${MENTION_PREFIX}${serializedText}${MENTION_SUFFIX}`,
    html:
      `${escapeHtml(MENTION_PREFIX)}<span data-prompt-mention="true" ` +
      `data-prompt-mention-resource="${escapeHtml(JSON.stringify(resource))}" ` +
      `data-prompt-mention-serialized-text="${escapeHtml(serializedText)}">` +
      `${escapeHtml(serializedText)}</span>${escapeHtml(MENTION_SUFFIX)}`,
    context: [
      `Plugin Guide surface: ${surface.title} (${surface.id}).`,
      `Relevant @get-bb/plugin-sdk symbols: ${surface.apiSymbols.join(", ")}.`,
      "Use the bb-plugin-authoring skill and the authoritative @get-bb/plugin-sdk declarations to build a similar plugin capability.",
    ].join("\n"),
  };
}
