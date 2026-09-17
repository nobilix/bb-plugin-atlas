/*
 * The set: capabilities a reader is collecting to build as one plugin.
 *
 * **One key, `atlas.basket`.** The two the HTML editions used — `bb-agent-set`
 * on the guide and `bb-zones-basket` on the zone map — meant adding a surface
 * on one page and finding an empty set on the other. That is the bug this port
 * fixes, so nothing here may read or write either old key.
 *
 * Entries carry a title as well as a kind and an id, so the panel can list what
 * is in the set without fetching anything. The Markdown needs `/briefs.json`,
 * which the panel fetches only when someone asks for it.
 */

export const BASKET_STORAGE_KEY = 'atlas.basket';
/** Fired on `window` after every change, so panels on the page re-render. */
export const BASKET_EVENT = 'atlas:basket';

export interface BasketEntry {
  kind: string;
  id: string;
  title: string;
}

interface StoredBasket {
  v: 1;
  items: BasketEntry[];
}

function isEntry(value: unknown): value is BasketEntry {
  const entry = value as BasketEntry;
  return (
    typeof entry?.kind === 'string' &&
    typeof entry?.id === 'string' &&
    typeof entry?.title === 'string'
  );
}

/**
 * Storage is allowed to be missing, full, or to throw on read: private windows,
 * cleared site data and blocked third-party storage all do one of those. The
 * set then behaves as empty rather than taking the page down with it.
 */
export function readBasket(): BasketEntry[] {
  try {
    const raw = localStorage.getItem(BASKET_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const items = (parsed as StoredBasket)?.items;
    return Array.isArray(items) ? items.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function write(items: BasketEntry[]): void {
  try {
    const payload: StoredBasket = { v: 1, items };
    localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* The panel still shows this session's set; it just will not survive a reload. */
  }
  window.dispatchEvent(new CustomEvent<BasketEntry[]>(BASKET_EVENT, { detail: items }));
}

/** Returns false when the capability was already in the set. */
export function addToBasket(entry: BasketEntry): boolean {
  const items = readBasket();
  if (items.some((item) => item.kind === entry.kind && item.id === entry.id)) return false;
  write([...items, entry]);
  return true;
}

export function removeFromBasket(kind: string, id: string): void {
  write(readBasket().filter((item) => !(item.kind === kind && item.id === id)));
}

export function clearBasket(): void {
  write([]);
}
