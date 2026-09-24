#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["google-genai>=1.33", "pydantic>=2"]
# ///
"""
Write the Russian pages from the English ones with the Gemini API.

One page per call, in two passes. The first pass rewrites the English page in
Russian under the rules in STYLE.md. The second pass sees only the Russian and
rewrites whatever still reads as a translation. Code blocks and MDX markers are
replaced by placeholders before either pass and restored after, so the model
never sees them; code spans, links, headings and asides are checked against the
English page, and a page that breaks them is retried and never written broken.

The existing Russian pages are never read: every page is written from English.

    uv run translations/ru/translate.py                   # every page
    uv run translations/ru/translate.py docs/start.mdx    # one page, relative to site/src/content
    uv run translations/ru/translate.py --selftest        # check the masking and the checks, no API calls

The key comes from $GEMINI_API_KEY, else from the macOS keychain item
`gemini-api-key` (`security add-generic-password -a "$USER" -s gemini-api-key -w`).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
CONTENT = REPO / "site" / "src" / "content"
ROOTS = ("docs", "intros")
STYLE = (HERE / "STYLE.md").read_text().split("\n---\n", 1)[1].strip()
DEFAULT_MODEL = "gemini-3.1-pro-preview"

# The agent corpus is English on every page, so links to it are not localized.
ENGLISH_ONLY = {"/llms.txt", "/llms-full.txt", "/llms-small.txt", "/briefs.json"}

FENCE = re.compile(r"^(`{3,}|~{3,}).*?$\n.*?^\1\s*$", re.M | re.S)
MARKER = re.compile(r"\{/\*.*?\*/\}")
PLACEHOLDER = re.compile(r"⟦[CM]\d+⟧")
CODE_SPAN = re.compile(r"(`+)(.+?)\1")
LINK = re.compile(r"\]\(([^)\s]+)\)")
HEADING = re.compile(r"^(#{1,6})\s", re.M)
ASIDE = re.compile(r"^:::(\w+)", re.M)


# --- pages -----------------------------------------------------------------


@dataclass
class Page:
    source: Path  # the English file
    front: list[str]  # its front matter lines
    title: str
    description: str
    body: str  # masked
    blocks: dict[str, str]  # placeholder → original text

    @property
    def target(self) -> Path:
        root, *rest = self.source.relative_to(CONTENT).parts
        return CONTENT.joinpath(root, "ru", *rest)


def english_pages() -> list[Path]:
    return sorted(
        path
        for root in ROOTS
        for path in (CONTENT / root).rglob("*.mdx")
        if "ru" not in path.relative_to(CONTENT / root).parts
    )


def split_front(text: str) -> tuple[list[str], str]:
    if not text.startswith("---\n"):
        raise ValueError("no front matter")
    end = text.index("\n---\n", 4)
    return text[4:end].split("\n"), text[end + 5 :]


def front_value(front: list[str], key: str) -> str:
    for line in front:
        if line.startswith(f"{key}:"):
            value = line.split(":", 1)[1].strip()
            return json.loads(value) if value.startswith('"') else value
    raise ValueError(f"no {key} in front matter")


def mask(body: str) -> tuple[str, dict[str, str]]:
    blocks: dict[str, str] = {}

    def keep(kind: str):
        def replace(match: re.Match) -> str:
            key = f"⟦{kind}{sum(k[1] == kind for k in blocks) + 1}⟧"
            blocks[key] = match.group(0)
            return key

        return replace

    body = FENCE.sub(keep("C"), body)
    body = MARKER.sub(keep("M"), body)
    return body, blocks


def unmask(body: str, blocks: dict[str, str]) -> str:
    return PLACEHOLDER.sub(lambda m: blocks[m.group(0)], body)


def load(source: Path) -> Page:
    front, body = split_front(source.read_text())
    masked, blocks = mask(body)
    return Page(
        source=source,
        front=front,
        title=front_value(front, "title"),
        description=front_value(front, "description"),
        body=masked,
        blocks=blocks,
    )


# --- checks ----------------------------------------------------------------


def outside_code_spans(text: str) -> str:
    return CODE_SPAN.sub(" ", text)


def link_targets(text: str) -> list[str]:
    """Targets with the locale taken off, so an English and a Russian page compare."""
    return [re.sub(r"^/ru(?=/)", "", t) for t in LINK.findall(outside_code_spans(text))]


def problems(english: str, russian: str) -> list[str]:
    """What the Russian page breaks that the content tests would also catch."""
    out = []
    if PLACEHOLDER.findall(russian) != PLACEHOLDER.findall(english):
        out.append("code blocks or markers moved, went missing or were duplicated")
    spans = {m.group(0) for m in CODE_SPAN.finditer(english)}
    foreign = sorted({m.group(0) for m in CODE_SPAN.finditer(russian)} - spans)
    if foreign:
        out.append(f"code spans not in the English page: {', '.join(foreign[:5])}")
    if sorted(link_targets(russian)) != sorted(link_targets(english)):
        out.append("links differ from the English page")
    if HEADING.findall(russian) != HEADING.findall(english):
        out.append("heading levels differ from the English page")
    if ASIDE.findall(russian) != ASIDE.findall(english):
        out.append("asides differ from the English page")
    prose = outside_code_spans(PLACEHOLDER.sub(" ", russian))
    prose = re.sub(r"\]\([^)]*\)", "]", prose)
    if '"' in prose:
        out.append("a straight double quote in prose")
    if " - " in prose:
        out.append("a spaced hyphen in prose")
    return out


# --- output ----------------------------------------------------------------


def localize_links(body: str) -> str:
    def localize(match: re.Match) -> str:
        target = match.group(1)
        if not target.startswith("/") or target.startswith("/ru/") or target.split("#")[0] in ENGLISH_ONLY:
            return match.group(0)
        return f"](/ru{target})"

    parts = re.split(r"(`+.+?`+)", body)
    return "".join(p if p.startswith("`") else LINK.sub(localize, p) for p in parts)


def render(page: Page, title: str, description: str, body: str) -> str:
    quote = lambda value: json.dumps(value, ensure_ascii=False)
    front = []
    for line in page.front:
        if line.startswith("title:"):
            line = f"title: {quote(title)}"
        elif line.startswith("description:"):
            line = f"description: {quote(description)}"
        front.append(line)
    digest = hashlib.sha256(page.source.read_bytes()).hexdigest()
    front += [
        f'sourceHash: "{digest}"',
        f'sourcePath: "{page.source.relative_to(REPO).as_posix()}"',
    ]
    return "---\n" + "\n".join(front) + "\n---\n" + unmask(localize_links(body), page.blocks)


# --- the model -------------------------------------------------------------


def api_key() -> str:
    if key := os.environ.get("GEMINI_API_KEY"):
        return key
    try:
        return subprocess.run(
            ["security", "find-generic-password", "-a", os.environ.get("USER", ""), "-s", "gemini-api-key", "-w"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        sys.exit("No key: set GEMINI_API_KEY or add the keychain item `gemini-api-key`.")


FIRST = """Перепиши эту страницу по-русски по правилам из системной инструкции.
Верни title, description и body. Плейсхолдеры ⟦…⟧, фрагменты в обратных кавычках и адреса ссылок оставь как есть.

"""

SECOND = """Вот русская страница. Прочитай её как русскоязычный разработчик, не зная, что это перевод.
Перепиши всё, что звучит переводом: кальки, канцелярит, английский порядок слов, лишние слова.
Не меняй смысл, числа, термины из глоссария, плейсхолдеры ⟦…⟧, фрагменты в обратных кавычках и адреса ссылок.
Верни title, description и body.

"""


def ask(client, model: str, prompt: str, page: dict) -> dict:
    from google.genai import types
    from pydantic import BaseModel

    class Result(BaseModel):
        title: str
        description: str
        body: str

    response = client.models.generate_content(
        model=model,
        contents=prompt + json.dumps(page, ensure_ascii=False),
        config=types.GenerateContentConfig(
            system_instruction=STYLE,
            response_mime_type="application/json",
            response_schema=Result,
        ),
    )
    if response.parsed is None:
        raise RuntimeError("the model returned no page")
    return response.parsed.model_dump()


def translate(client, model: str, page: Page) -> tuple[str, list[str]]:
    """Returns the Russian file and notes; raises when no attempt keeps the page intact."""
    english = {"title": page.title, "description": page.description, "body": page.body}
    notes: list[str] = []
    for attempt in range(2):
        first = ask(client, model, FIRST, english)
        if issues := problems(page.body, first["body"]):
            notes.append(f"first pass, try {attempt + 1}: {'; '.join(issues)}")
            continue
        for _ in range(2):
            second = ask(client, model, SECOND, first)
            if not (issues := problems(page.body, second["body"])):
                return render(page, **second), notes
            notes.append(f"second pass: {'; '.join(issues)}")
        notes.append("kept the first pass: the second kept breaking the page")
        return render(page, **first), notes
    raise RuntimeError("; ".join(notes))


# --- main ------------------------------------------------------------------


def selftest() -> int:
    """No API: masking round-trips, and the checks accept the Russian pages the tests accept."""
    failed = 0
    for source in english_pages():
        page = load(source)
        _, body = split_front(source.read_text())
        if unmask(page.body, page.blocks) != body:
            print(f"✗ {source.relative_to(CONTENT)}: masking does not round-trip")
            failed += 1
        if page.target.exists():
            _, ru_body = split_front(page.target.read_text())
            ru_masked, _ = mask(ru_body)
            if issues := problems(page.body, ru_masked):
                print(f"· {page.target.relative_to(CONTENT)}: {'; '.join(issues)}")
    print(f"{len(english_pages())} pages, {failed} masking failures")
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("pages", nargs="*", help="English pages relative to site/src/content, e.g. docs/start.mdx")
    parser.add_argument("--model", default=os.environ.get("GEMINI_MODEL", DEFAULT_MODEL))
    parser.add_argument("--jobs", type=int, default=4)
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    if args.selftest:
        return selftest()

    from google import genai

    client = genai.Client(api_key=api_key())
    sources = [CONTENT / p for p in args.pages] if args.pages else english_pages()

    def run(source: Path) -> bool:
        page = load(source)
        name = source.relative_to(CONTENT)
        try:
            text, notes = translate(client, args.model, page)
        except Exception as error:  # noqa: BLE001 — one page failing must not stop the rest
            print(f"✗ {name}: {error}", flush=True)
            return False
        page.target.parent.mkdir(parents=True, exist_ok=True)
        page.target.write_text(text)
        print(f"✓ {name}" + "".join(f"\n    {n}" for n in notes), flush=True)
        return True

    print(f"{len(sources)} pages with {args.model}", flush=True)
    with ThreadPoolExecutor(args.jobs) as pool:
        results = list(pool.map(run, sources))
    print(f"{sum(results)} written, {len(results) - sum(results)} failed")
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
