/*
 * The pin, inlined at build time from `<repo>/pin.json`.
 *
 * A JSON import, not `readFileSync`: the prerender entry is bundled into
 * `dist/.prerender/`, so a path relative to `import.meta.url` points at the
 * wrong directory by the time it runs. Rollup inlines the JSON instead, which
 * also makes a malformed pin a build error rather than a runtime one.
 */
import pinData from '../../../pin.json';

export interface Pin {
  upstream: {
    repo: string;
    url: string;
    tag: string;
    commit: string;
    commitDate: string;
    bbVersion: string;
    sdkVersion: string;
  };
  watch: { branch: string; lastSeenCommit: string; note?: string };
  permalinkBase: string;
}

export const pin: Pin = pinData as Pin;

export const shortCommit = pin.upstream.commit.slice(0, 7);

/** `<repo>/commit/<sha>` — the pinned commit on the upstream host. */
export const commitUrl = `${pin.upstream.url}/commit/${pin.upstream.commit}`;
