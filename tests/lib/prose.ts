import type { Page } from "./dist.ts";

/** Inline code spans — the identifier surface of a page. */
export function inlineCodeOf(page: Page): string[] {
  const out: string[] = [];
  for (const el of page.content.querySelectorAll("code")) {
    if (el.closest("pre")) continue;
    const text = el.textContent.trim();
    if (text) out.push(text);
  }
  return out;
}
