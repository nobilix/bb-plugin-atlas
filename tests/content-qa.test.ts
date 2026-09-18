/**
 * Content QA.
 *
 * Identifiers are never translated, and nothing that only exists on `main` is
 * presented as shipped. Two more rules for the Russian locale: each Russian page keeps its English page's
 * contract (TRANSLATION-RU.md), and the translated surface text is current.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { dataDir, distDir, docsInternalDir, ENGLISH_ONLY, localeOf, repoRoot } from "./lib/paths.ts";
import { distFiles, pages, type Page } from "./lib/dist.ts";
import { inlineCodeOf } from "./lib/prose.ts";
import { deltaFile, pin } from "./lib/data.ts";
import { absentAtPin, findClone, MissingCloneError, wordsAtPin } from "./lib/upstream-git.ts";
import { counted } from "./lib/report.ts";
import {
  asides,
  bareProse,
  codeSpans,
  contentDir,
  englishTwin,
  headings,
  isRussian,
  linkTargets,
  markers,
  mdxFiles,
  parseMdx,
  readDoc,
  untranslated,
} from "./lib/mdx.ts";
// The overlay's own hash and diff, not a copy: one definition of "current".
import { diffOverlay } from "../translations/ru/hash.mjs";
import { localizeSurface } from "../site/src/lib/overlay.ts";

let built: Page[];
let files: string[];

/** The generated data and `pin.json`, searched before the pinned tree itself. */
let upstreamHaystack = "";
/** This project's own frozen vocabulary — `sourceSection`, `/llms.txt`, and such. */
let ownHaystack = "";

beforeAll(async () => {
  built = await pages();
  files = await distFiles();

  for (const name of readdirSync(dataDir)) {
    upstreamHaystack += readFileSync(join(dataDir, name), "utf8");
  }
  upstreamHaystack += readFileSync(join(repoRoot, "pin.json"), "utf8");

  for (const name of readdirSync(docsInternalDir)) {
    if (name.endsWith(".md")) ownHaystack += readFileSync(join(docsInternalDir, name), "utf8");
  }
  ownHaystack += readFileSync(join(repoRoot, "site", "README.md"), "utf8");
  ownHaystack += readFileSync(join(repoRoot, "README.md"), "utf8");
});

/* ------------------------------------------------------- identifier fidelity */

/**
 * Words that are TypeScript, HTTP or English rather than identifiers. A code
 * span like `(bb: BbPluginApi) => void` is composed on the page; `void` proving
 * nothing about translation, only `BbPluginApi` does.
 */
const NOT_AN_IDENTIFIER = new Set(
  (
    "string number boolean void null undefined true false any unknown never object symbol bigint " +
    "export default import from const let var function return interface type class extends implements " +
    "new async await this typeof keyof readonly public private protected static get set enum namespace " +
    "declare module require yield try catch finally throw switch case break continue else for while " +
    "delete instanceof Record Partial Promise Array Map Set Omit Pick Readonly Required " +
    "GET POST PUT PATCH DELETE HEAD ALL " +
    "and not but with only just each into over under when then than that these those also same other " +
    "some every the all one two three"
  ).split(" "),
);

/**
 * Tokens in code spans that are correct and yet are nowhere in the pinned tree,
 * each for a stated reason. Anything else missing upstream is a defect.
 */
const NOT_UPSTREAM = new Set([
  // Named in order to say that upstream has no such thing.
  "definePlugin",
  "worker_threads",
  "useProject",
  "useRoute",
  // Placeholders and fragments of literals: `<rootId>`, `<hash16>`, `30_000`, `0o600`.
  "rootId",
  "hash16",
  "_000",
  "o600",
  // A file an author creates; the scaffold writes none.
  "npmignore",
  // Step labels in the dispose-order table on /runtime/, named after what the step does.
  "abortPluginToolCalls",
  "interruptInteractions",
]);

function identifierTokens(span: string): string[] {
  return [...span.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)]
    .map((m) => m[0])
    .filter((token) => token.length >= 3 && !NOT_AN_IDENTIFIER.has(token));
}

describe("identifier fidelity", () => {
  /**
   * Inline code spans, not fenced blocks. A fenced block is mostly English
   * comments — "the full cycle", "a safe read inside configure" — and demanding
   * that those words exist upstream tests nothing about
   * translation. The inline span is where a translated identifier actually
   * hides, and there are over 1 500 of them.
   *
   * An identifier traces back when it is in `data/`, or else anywhere in the
   * upstream tree at the pinned commit.
   */
  it("every code span traces back to data/ or the pinned upstream tree", () => {
    const clone = findClone();
    if (!clone) throw new MissingCloneError();
    const spans = new Map<string, string>();
    for (const page of built) {
      for (const span of inlineCodeOf(page)) {
        const text = span.trim();
        if (text && !spans.has(text)) spans.set(text, page.route);
      }
    }

    // A composed span — a URL shape, a union type, a command template — is not
    // in the source as one string. Its identifiers still must be.
    const unmatched = [...spans]
      .filter(([span]) => !upstreamHaystack.includes(span))
      .map(([span, route]) => ({
        span,
        route,
        tokens: identifierTokens(span).filter((t) => !upstreamHaystack.includes(t)),
      }));
    const upstreamWords = wordsAtPin(clone, pin.commit);

    const ownVocabulary: string[] = [];
    const translated: string[] = [];

    for (const { span, route, tokens } of unmatched) {
      const missing = tokens.filter((t) => !upstreamWords.has(t) && !NOT_UPSTREAM.has(t));
      if (missing.length === 0) continue;
      if (missing.every((t) => ownHaystack.includes(t))) {
        ownVocabulary.push(`${route}: ${span}`);
        continue;
      }
      translated.push(`${route}: \`${span}\` — ${missing.join(", ")} appears nowhere upstream`);
    }

    counted("code spans (identifier fidelity)", spans.size, translated.length);
    if (ownVocabulary.length > 0) {
      console.log(
        `    · ${ownVocabulary.length} span(s) are this site's own vocabulary, defined in docs-internal: ` +
          ownVocabulary.join(" | "),
      );
    }
    expect(spans.size).toBeGreaterThan(1000);
    expect(translated).toEqual([]);
  });
});

describe("upstream inline Markdown is rendered", () => {
  /*
   * Upstream cross-references surfaces as `[text](surface-id)` and credits
   * contributors as `[@name](https://…)`. Both are resolved on the way out
   * (`site/src/lib/inline-md.ts`); a `](` a reader can see means one slipped
   * through as raw Markdown. Code blocks are exempt: `[x](y)` in a code sample
   * is code.
   */
  it("no page shows a raw `[text](target)` link", () => {
    const raw: string[] = [];
    for (const page of built) {
      const main = page.content.querySelector("main") ?? page.content;
      const clone = main.clone() as typeof main;
      for (const node of clone.querySelectorAll("pre, code, script, style")) node.remove();
      for (const match of clone.textContent.matchAll(/\[[^\]\n]{1,80}\]\([^)\s]{1,200}\)/g)) {
        raw.push(`${page.route}: ${match[0]}`);
      }
    }
    counted("pages scanned for raw Markdown links", built.length, raw.length);
    expect(raw.slice(0, 20)).toEqual([]);
  });

  it("a surface cross-link becomes a link to that surface", () => {
    const page = built.find((p) => p.route === "/surfaces/content-scripts/");
    expect(page, "no /surfaces/content-scripts/ page").toBeDefined();
    const link = [...page!.content.querySelectorAll("main a")].find(
      (a) => a.textContent.trim() === "thread row status",
    );
    expect(link?.getAttribute("href")).toBe("/surfaces/thread-row-status/");
  });

  it("on a Russian page, it links to the Russian page", () => {
    const page = built.find((p) => p.route === "/ru/surfaces/content-scripts/");
    expect(page, "no /ru/surfaces/content-scripts/ page").toBeDefined();
    const hrefs = [...page!.content.querySelectorAll("main .sl-markdown-content a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/ru/surfaces/thread-row-status/");
    expect(hrefs).not.toContain("/surfaces/thread-row-status/");
  });
});

/* ------------------------------------------------------- unreleased labelling */

/** The label, as each locale writes it: "unreleased — lands after 0.43.3" / «не выпущено — …». */
const UNRELEASED_LABEL = /unreleased|не выпущено/;

describe("unreleased labelling", () => {
  const clone = findClone();

  /**
   * Names `main` references and the pin does not — and, of those, the ones that
   * are genuinely not in the pinned tree. Only the second set has to carry a
   * label: the first is dominated by API that shipped in 0.43.3 and that simply
   * no surface listed yet. Labelling those "unreleased" would be the mistake
   * VERIFIED-AT-PIN.md was written to stop.
   */
  function mainOnlyNames(): string[] {
    const names = new Set(deltaFile.symbolsOnlyInMain.map((s) => s.name));
    for (const surface of deltaFile.surfaces) {
      for (const added of surface.apiSymbolsAdded ?? []) names.add(added);
    }
    return [...names].sort();
  }

  it("has something to check", () => {
    expect(mainOnlyNames().length).toBeGreaterThan(50);
  });

  it("separates 'referenced only on main' from 'not in the release'", () => {
    if (!clone) throw new MissingCloneError();
    const mainOnly = mainOnlyNames();
    const absent = absentAtPin(clone, pin.commit, mainOnly);
    console.log(
      `    · ${mainOnly.length} names are referenced only on main; ${absent.size} of them are ` +
        `absent from the pinned tree: ${[...absent].join(", ") || "(none)"}`,
    );
    // A pin bump that suddenly makes most of them genuinely new is news, and
    // this number appearing in the diff is how it gets noticed.
    expect(absent.size).toBeLessThan(mainOnly.length / 2);
  });

  it("anything absent from the release is absent from the site, or labelled unreleased", () => {
    if (!clone) throw new MissingCloneError();
    const absent = absentAtPin(clone, pin.commit, mainOnlyNames());
    const leaves = new Map([...absent].map((name) => [name.split(".").pop()!, name]));

    const violations: string[] = [];
    let rendered = 0;
    for (const page of built) {
      for (const span of page.content.querySelectorAll("code")) {
        const text = span.textContent.trim();
        const name = absent.has(text) ? text : leaves.get(text);
        if (!name) continue;
        rendered += 1;
        const holder =
          span.closest("li") ?? span.closest("tr") ?? span.closest("p") ?? span.closest("section");
        const scopeText = (holder ?? page.content).textContent.toLowerCase();
        if (!UNRELEASED_LABEL.test(scopeText)) {
          violations.push(
            `${page.route}: \`${text}\` is not in ${pin.tag} and carries no "unreleased" label`,
          );
        }
      }
    }
    counted("unreleased symbols rendered on the site", rendered, violations.length);
    expect([...new Set(violations)]).toEqual([]);
  });

  it("no surface that exists only on main is documented as shipped", () => {
    const onlyInMain = deltaFile.surfaces.filter((s) => s.status === "only-in-main").map((s) => s.id);
    const leaked = onlyInMain.filter((id) =>
      built.some((page) => page.route.endsWith(`/surfaces/${id}/`)),
    );
    expect(leaked).toEqual([]);
  });

  it("no page claims a version other than the pinned one", () => {
    // delta.json exists so the site can label, not restate. A page must not
    // quietly print `main`'s SDK version.
    const wrong: string[] = [];
    for (const page of built) {
      const prose = page.content.textContent;
      for (const stale of ["0.4.108", "0.43.4"]) {
        if (prose.includes(stale)) wrong.push(`${page.route}: mentions ${stale}`);
      }
    }
    expect(wrong).toEqual([]);
  });
});

/* ------------------------------------------------------------ Russian pages */

describe("Russian pages keep their English page's contract", () => {
  /*
   * TRANSLATION-RU.md, "Page contract". A Russian page mirrors one English
   * page: the translator changes the words and nothing a tool reads — not the
   * front matter keys, headings, fenced code, markers, code spans or asides —
   * and every internal link stays inside `/ru/`.
   */
  const english = mdxFiles().filter((path) => !isRussian(path));
  const russian = mdxFiles().filter(isRussian);

  function each(check: (path: string, en: string, ru: string) => string[]): string[] {
    return russian.flatMap((path) =>
      check(englishTwin(path), readDoc(englishTwin(path)), readDoc(path)).map((problem) => `${path}: ${problem}`),
    );
  }

  it("every English page has a Russian page, and every Russian page an English one", () => {
    expect(russian.map(englishTwin)).toEqual(english);
    expect(russian.length).toBeGreaterThanOrEqual(22);
  });

  it("front matter keeps the English keys in order and adds `sourceHash` and `sourcePath`", () => {
    const problems = each((path, enText, ruText) => {
      const en = parseMdx(enText);
      const ru = parseMdx(ruText);
      const out: string[] = [];
      const want = [...en.keys, "sourceHash", "sourcePath"];
      if (ru.keys.join() !== want.join()) out.push(`keys ${ru.keys.join()} ≠ ${want.join()}`);
      for (const key of ["  order", "sourceSection"]) {
        if (ru.values.get(key) !== en.values.get(key)) {
          out.push(`${key.trim()} ${ru.values.get(key)} ≠ ${en.values.get(key)}`);
        }
      }
      if (ru.values.get("sourcePath") !== `"site/src/content/${path}"`) {
        out.push(`sourcePath is ${ru.values.get("sourcePath")}`);
      }
      const description = ru.values.get("description") ?? "";
      if (!/[А-Яа-яЁё]/.test(description)) out.push("description is not translated");
      return out;
    });
    counted("Russian front matter", russian.length, problems.length);
    expect(problems).toEqual([]);
  });

  it("every `sourceHash` is the sha256 of the current English file", () => {
    const stale = each((path, _en, ruText) => {
      const want = createHash("sha256").update(readFileSync(join(contentDir, path))).digest("hex");
      const have = parseMdx(ruText).values.get("sourceHash");
      if (have === `"${want}"`) return [];
      return [`the English page changed (now ${want.slice(0, 12)}); retranslate, then update sourceHash`];
    });
    counted("Russian pages checked for a stale source", russian.length, stale.length);
    expect(stale).toEqual([]);
  });

  it("headings, fenced code, markers and asides are the English ones", () => {
    const problems = each((_path, enText, ruText) => {
      const en = parseMdx(enText);
      const ru = parseMdx(ruText);
      const out: string[] = [];
      const levels = (parts: typeof en) => headings(parts.prose).map((h) => h.level).join();
      if (levels(ru) !== levels(en)) out.push(`heading levels ${levels(ru)} ≠ ${levels(en)}`);
      const headingSpans = (parts: typeof en) => JSON.stringify(headings(parts.prose).map((h) => h.spans));
      if (headingSpans(ru) !== headingSpans(en)) out.push("code spans in headings differ");
      if (ru.blocks.length !== en.blocks.length || ru.blocks.some((b, i) => b !== en.blocks[i])) {
        out.push(`fenced code is not byte-identical (${ru.blocks.length} vs ${en.blocks.length} blocks)`);
      }
      if (markers(ru.prose).join("\n") !== markers(en.prose).join("\n")) {
        out.push("{/* … */} markers differ in text or order");
      }
      if (asides(ru.prose).join() !== asides(en.prose).join()) {
        out.push(`asides ${asides(ru.prose).join()} ≠ ${asides(en.prose).join()}`);
      }
      return out;
    });
    expect(problems).toEqual([]);
  });

  it("every code span exists verbatim as a code span in the English page", () => {
    let spans = 0;
    const problems = each((_path, enText, ruText) => {
      const english = new Set(codeSpans(parseMdx(enText).prose.join("\n")));
      const mine = codeSpans(parseMdx(ruText).prose.join("\n"));
      spans += mine.length;
      return mine.filter((span) => !english.has(span)).map((span) => `\`${span}\` is not in English`);
    });
    counted("Russian code spans", spans, problems.length);
    expect(problems).toEqual([]);
  });

  it("internal links go to the /ru/ twin of an English link", () => {
    const problems = each((_path, enText, ruText) => {
      const en = linkTargets(parseMdx(enText).prose);
      const ru = linkTargets(parseMdx(ruText).prose);
      const out: string[] = [];
      if (ru.length !== en.length) out.push(`${ru.length} links, English has ${en.length}`);
      for (const target of ru) {
        if (!target.startsWith("/") || ENGLISH_ONLY.has(target)) continue;
        if (!target.startsWith("/ru/")) out.push(`${target} is not localized`);
        else if (!en.includes(target.slice(3))) out.push(`${target} has no English counterpart`);
      }
      return out;
    });
    expect(problems).toEqual([]);
  });

  it("reads as Russian, with Russian typography", () => {
    const problems = each((_path, _en, ruText) => {
      const { prose } = parseMdx(ruText);
      const bare = bareProse(prose);
      const out = untranslated(prose).map((cell) => `looks untranslated: ${cell}`);
      if (bare.includes('"')) out.push("a straight double quote in prose (use «ёлочки»)");
      if (/ - /.test(bare)) out.push("a spaced hyphen in prose (use an em dash)");
      return out;
    });
    expect(problems).toEqual([]);
  });

  it("the chrome is Russian on a Russian page", () => {
    const page = built.find((p) => p.route === "/ru/surfaces/thread-list/");
    expect(page, "no /ru/surfaces/thread-list/ page").toBeDefined();
    const text = page!.content.querySelector("main")!.textContent;
    for (const english of ["Show on the zone map", "What it gives you", "Brief for agent", "Add to set"]) {
      expect(text, `"${english}" on a Russian page`).not.toContain(english);
    }
    expect(text).toContain("Бриф для агента");
  });
});

describe("translated surface text", () => {
  /*
   * `translations/ru/surfaces.json` translates the reader-facing text of each
   * surface and group, and records the hash of the English it was made from.
   * The site falls back to English for a missing or stale entry, so the build
   * never breaks on one — this is where it breaks instead.
   */
  const source = JSON.parse(readFileSync(join(dataDir, "surfaces.json"), "utf8"));
  const overlay = JSON.parse(
    readFileSync(join(repoRoot, "translations", "ru", "surfaces.json"), "utf8"),
  );

  it("every group and surface has a current Russian entry, and nothing else does", () => {
    const { missing, stale, extra } = diffOverlay(source, overlay);
    counted(
      "overlay entries (groups + surfaces)",
      source.groups.length + source.surfaces.length,
      missing.length + stale.length + extra.length,
    );
    expect({ missing, stale, extra }).toEqual({ missing: [], stale: [], extra: [] });
  });

  it("a stale entry is never shown: the English text is", () => {
    const surface = source.surfaces.find((s: { id: string }) => s.id === "thread-list");
    expect(localizeSurface(surface, "ru").title).toBe(overlay.surfaces["thread-list"].title);
    const changed = { ...surface, summary: `${surface.summary} (changed upstream)` };
    expect(localizeSurface(changed, "ru")).toEqual(changed);
    expect(localizeSurface(surface, "en")).toEqual(surface);
  });

  it("the Russian reference pages show it", () => {
    const wrong: string[] = [];
    for (const surface of source.surfaces as { id: string; title: string }[]) {
      const ru = built.find((p) => p.route === `/ru/surfaces/${surface.id}/`);
      const en = built.find((p) => p.route === `/surfaces/${surface.id}/`);
      const title = (page: Page | undefined) => page?.content.querySelector("main h1")?.textContent.trim();
      if (title(ru) !== overlay.surfaces[surface.id]?.title) {
        wrong.push(`/ru/surfaces/${surface.id}/: ${title(ru)}`);
      }
      if (title(en) !== surface.title) wrong.push(`/surfaces/${surface.id}/: ${title(en)}`);
    }
    counted("surface titles per locale", source.surfaces.length * 2, wrong.length);
    expect(wrong).toEqual([]);
  });
});
