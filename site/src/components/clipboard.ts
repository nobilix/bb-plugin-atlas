/*
 * Clipboard writes that survive the ways the Clipboard API is denied: blocked
 * permission, a gesture the browser does not trust, a page served over plain
 * http on a LAN. Every path ends in either text on the clipboard or a visible
 * failure — never a button that looks like it worked.
 *
 * Shared by the brief controls, the set panel and the zone map, so the three
 * behave identically.
 */

/** A payload with two flavours: what bb's composer reads, and what plain text editors read. */
export interface RichPayload {
  text: string;
  html: string;
}

function execCopy(fill: (area: HTMLTextAreaElement) => void): boolean {
  if (!document.body || typeof document.execCommand !== 'function') return false;
  const area = document.createElement('textarea');
  area.readOnly = true;
  area.setAttribute('aria-hidden', 'true');
  area.style.cssText = 'position:fixed;top:0;left:-9999px;width:1px;height:1px;opacity:0';
  fill(area);
  document.body.append(area);
  try {
    area.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return execCopy((area) => {
      area.value = text;
    });
  }
}

/**
 * Both flavours at once, which is what makes a bb mention paste as a mention
 * rather than as the words "@Full-page panels".
 *
 * The fallback is bb's own: a hidden textarea plus a one-shot `copy` handler
 * that writes `text/plain` and `text/html` itself. It reports failure when the
 * handler never ran, because a plain-text-only copy would paste as prose and
 * look like a bug in bb rather than a missing clipboard permission here.
 */
export async function copyRich(payload: RichPayload): Promise<boolean> {
  if (typeof ClipboardItem === 'function' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([payload.text], { type: 'text/plain' }),
          'text/html': new Blob([payload.html], { type: 'text/html' }),
        }),
      ]);
      return true;
    } catch {
      /* fall through to the editing command */
    }
  }

  let rich = false;
  const onCopy = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    event.clipboardData.setData('text/plain', payload.text);
    event.clipboardData.setData('text/html', payload.html);
    event.preventDefault();
    rich = true;
  };
  document.addEventListener('copy', onCopy, { once: true });
  try {
    return execCopy((area) => {
      area.value = payload.text;
    }) && rich;
  } finally {
    document.removeEventListener('copy', onCopy);
  }
}

/** Say what happened on the button itself, then put its own label back. */
export function flash(label: Element, message: string, ms = 2000): void {
  const element = label as HTMLElement & { _atlasIdle?: string; _atlasTimer?: number };
  element._atlasIdle ??= element.textContent ?? '';
  element.textContent = message;
  window.clearTimeout(element._atlasTimer);
  element._atlasTimer = window.setTimeout(() => {
    element.textContent = element._atlasIdle ?? '';
  }, ms);
}
