/*
 * The inline Markdown upstream text carries: `` `code` ``, `**bold**` and
 * `[text](target)` links.
 *
 * Upstream writes cross-references between surfaces as a link whose target is
 * a bare surface id — `[thread row status](thread-row-status)` — because inside
 * bb's Plugin Guide that id is a route. Nowhere on this site is it one, so a
 * target is resolved here: a known surface id or an absolute http(s) URL
 * becomes a link, and anything else becomes its text. Raw Markdown never
 * reaches a reader.
 *
 * One parser for every rendering — the Astro pages, the zone map island and
 * the Markdown twins — so the three cannot disagree about what a link is.
 */

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; children: Inline[] }
  | { kind: 'link'; text: string; target: string };

const INLINE = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ kind: 'text', text: text.slice(last, index) });
    if (match[1] !== undefined) out.push({ kind: 'code', text: match[1] });
    else if (match[2] !== undefined) out.push({ kind: 'strong', children: parseInline(match[2]) });
    else out.push({ kind: 'link', text: match[3], target: match[4] });
    last = index + match[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}

export type LinkTarget = { surface: string } | { external: string } | null;

/** What a link target points at, or null when it points at nothing on this site. */
export function resolveTarget(target: string, isSurface: (id: string) => boolean): LinkTarget {
  if (/^https?:\/\//.test(target)) return { external: target };
  if (isSurface(target)) return { surface: target };
  return null;
}

/** A surface's reference page; `prefix` is the locale's (`/ru`), empty for English. */
export const surfaceHref = (id: string, prefix = '') => `${prefix}/surfaces/${id}/`;

/** The words a reader sees, with every piece of syntax gone: for meta descriptions and captions. */
export function plainText(text: string): string {
  const flatten = (nodes: Inline[]): string =>
    nodes.map((node) => (node.kind === 'strong' ? flatten(node.children) : node.text)).join('');
  return flatten(parseInline(text));
}

/** Markdown again, with surface targets made absolute and dead targets reduced to text. */
export function resolveMarkdownLinks(
  text: string,
  isSurface: (id: string) => boolean,
  prefix = '',
): string {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label: string, target: string) => {
    const resolved = resolveTarget(target, isSurface);
    if (!resolved) return label;
    return 'surface' in resolved ? `[${label}](${surfaceHref(resolved.surface, prefix)})` : whole;
  });
}
