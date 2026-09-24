#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["google-genai>=1.33", "pydantic>=2"]
# ///
"""
Write the Russian pages from the English ones with the Gemini API.

One page per call, in three passes. The first pass rewrites the English page in
Russian under the rules in STYLE.md, with the whole English site in its context
so every page is written knowing what bb is and naming things the same way; the
repeated prefix is cached by the API. The second pass sees only the Russian page
and the rules, and rewrites whatever still reads as a translation. The third
puts the English and the Russian page side by side and fixes only meaning: who
does what, must against does, hedges, security claims, facts lost or added. It
returns edits, not a page, so every change is printed and can be reviewed. A
report at the end lists any term the glossary rules out that still made it into
a page, and what the run cost.

Code blocks and MDX markers are replaced by placeholders before any pass and
restored after, so the model never sees them; code spans, links, headings and
asides are checked against the English page, and a page that breaks them is
retried and never written broken.

A full run never reads the existing Russian pages: every page is written from
English. Only --check starts from them.

    uv run translations/ru/translate.py                   # every page
    uv run translations/ru/translate.py docs/start.mdx    # one page, relative to site/src/content
    uv run translations/ru/translate.py --selftest        # check the masking and the checks, no API calls
    uv run translations/ru/translate.py --check           # only the third pass, on the pages as they are
    uv run translations/ru/translate.py --report          # the consistency report on the pages as they are

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
from threading import Lock
from dataclasses import dataclass
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
CONTENT = REPO / "site" / "src" / "content"
ROOTS = ("docs", "intros")
STYLE = (HERE / "STYLE.md").read_text().split("\n---\n", 1)[1].strip()
DEFAULT_MODEL = "gemini-3.1-pro-preview"
# The check compares two pages instead of writing one; in a trial on four pages Flash caught
# twice as many meaning errors as Pro, at a sixth of the price.
CHECK_MODEL = "gemini-3.8-flash"

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
    mine = {m.group(0) for m in CODE_SPAN.finditer(russian)}
    if foreign := sorted(mine - spans):
        out.append(f"code spans not in the English page: {', '.join(foreign[:5])}")
    if lost := sorted(spans - mine):
        out.append(f"code spans the English page has and this one lost: {', '.join(lost[:5])}")
    if sorted(link_targets(russian)) != sorted(link_targets(english)):
        out.append("links differ from the English page")
    if HEADING.findall(russian) != HEADING.findall(english):
        out.append("heading levels differ from the English page")
    if ASIDE.findall(russian) != ASIDE.findall(english):
        out.append("asides differ from the English page")
    prose = outside_code_spans(PLACEHOLDER.sub(" ", russian))
    prose = re.sub(r"\]\([^)]*\)", "]", prose)
    if re.search(r"<[^<>\n]+>", prose):
        out.append("a bare <tag> in prose")
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


CHECK = """Сверь русскую страницу с английской. Стиль не оценивай и не правь: только смысл.
Ищи каждое место, где русский текст говорит не то же, что английский:
- подлежащее и дополнение поменялись местами, действие приписано не тому;
- изменилась модальность или сила утверждения (must → «делает», convention → «требует», not enforced → «не строгая», may → утверждение);
- пропала или ослабла оговорка («not verified», «at the pinned commit»);
- смягчено или усилено утверждение о безопасности;
- пропал факт, элемент перечисления, число;
- добавлено то, чего в английском нет;
- цитата из bb или строка интерфейса bb переведена, хотя должна остаться по-английски;
- текст ссылки остался по-английски, хотя его надо перевести.
Для каждого места верни before — точный фрагмент русской страницы (скопируй байт в байт, достаточно длинный, чтобы встречаться один раз), after — исправленный фрагмент в том же стиле, why — коротко, что было не так.
Плейсхолдеры ⟦…⟧, фрагменты в обратных кавычках и адреса ссылок не трогай. Если расхождений нет, верни пустой список.

"""


def english_site() -> str:
    """Every English page, code masked, for the first pass to read as context."""
    parts = []
    for source in english_pages():
        page = load(source)
        parts.append(
            f"=== {source.relative_to(CONTENT).as_posix()} ===\n# {page.title}\n{page.description}\n\n{page.body.strip()}"
        )
    return "\n\n".join(parts)


def first_pass_instruction() -> str:
    return (
        STYLE
        + "\n\n## Весь сайт по-английски\n\n"
        + "Ниже все страницы сайта на английском, блоки кода заменены плейсхолдерами. "
        + "Они нужны, чтобы ты понимал предмет целиком и называл одно и то же одинаково на всех страницах. "
        + "Переписывай только ту страницу, которую пришлют в сообщении.\n\n"
        + english_site()
    )


class Usage:
    """Tokens spent across all calls, and what they cost at list price."""

    # USD per million tokens: input, cached input, output (thinking included).
    PRICES = {"gemini-3.1-pro-preview": (2.00, 0.20, 12.00), "gemini-3.8-flash": (0.75, 0.075, 3.75)}

    def __init__(self) -> None:
        self.lock = Lock()
        self.input = self.output = 0
        self.cost = 0.0

    def add(self, model: str, meta) -> None:
        fresh = (meta.prompt_token_count or 0) - (cached := meta.cached_content_token_count or 0)
        out = (meta.candidates_token_count or 0) + (meta.thoughts_token_count or 0)
        price = self.PRICES.get(model, (0, 0, 0))
        with self.lock:
            self.input += fresh + cached
            self.output += out
            self.cost += (fresh * price[0] + cached * price[1] + out * price[2]) / 1e6

    def __str__(self) -> str:
        return f"tokens: {self.input} in, {self.output} out, ≈ ${self.cost:.2f} at list price"


USAGE = Usage()


def ask(client, model: str, system: str, prompt: str, data: dict, schema=None) -> dict:
    from google.genai import types
    from pydantic import BaseModel

    class Result(BaseModel):
        title: str
        description: str
        body: str

    response = client.models.generate_content(
        model=model,
        contents=prompt + json.dumps(data, ensure_ascii=False),
        config=types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_schema=schema or Result,
        ),
    )
    USAGE.add(model, response.usage_metadata)
    if response.parsed is None:
        raise RuntimeError("the model returned nothing")
    return response.parsed.model_dump()


def repair(english: str, russian: dict) -> dict:
    """Mechanical slips fixed rather than retried: backticks the model added around a word the
    English page writes plainly, straight quotes around prose, and an entity like
    `&lt;message&gt;` the model decoded into a bare tag MDX would try to parse."""
    spans = {m.group(0) for m in CODE_SPAN.finditer(english)}
    body = CODE_SPAN.sub(lambda m: m.group(0) if m.group(0) in spans else m.group(2), russian["body"])
    parts = re.split(r"((`+).+?\2|\]\([^)]*\))", body)
    body = "".join(
        part if i % 3 else prose_fixes(part)
        for i, part in enumerate(parts)
        if part is not None and i % 3 != 2
    )
    return {**russian, "body": body}


def prose_fixes(text: str) -> str:
    text = re.sub(r'"([^"\n]+)"', r"«\1»", text)
    return re.sub(r"<([^<>\n]+)>", r"&lt;\1&gt;", text)


def check(client, page: Page, russian: dict) -> tuple[dict, list[str]]:
    """The third pass: the English and the Russian page side by side, meaning fixed where they part."""
    from pydantic import BaseModel

    class Edit(BaseModel):
        before: str
        after: str
        why: str

    class Edits(BaseModel):
        edits: list[Edit]

    english = {"title": page.title, "description": page.description, "body": page.body}
    edits = ask(client, CHECK_MODEL, STYLE, CHECK, {"english": english, "russian": russian}, Edits)["edits"]
    notes = []
    for edit in edits:
        field = next((f for f in ("title", "description", "body") if russian[f].count(edit["before"]) == 1), None)
        if field is None:
            notes.append(f"skipped, not found once: «{edit['before'][:60]}»")
            continue
        fixed = {**russian, field: russian[field].replace(edit["before"], edit["after"])}
        if field == "body" and (issues := problems(page.body, fixed["body"])):
            notes.append(f"skipped, breaks the page ({'; '.join(issues)}): «{edit['before'][:60]}»")
            continue
        russian = fixed
        notes.append(f"{edit['why']}: «{edit['before']}» → «{edit['after']}»")
    return russian, notes


def translate(client, model: str, context: str, page: Page) -> tuple[str, list[str]]:
    """Returns the Russian file and notes; raises when no attempt keeps the page intact."""
    english = {"title": page.title, "description": page.description, "body": page.body}
    notes: list[str] = []
    for attempt in range(2):
        first = repair(page.body, ask(client, model, context, FIRST, english))
        if issues := problems(page.body, first["body"]):
            notes.append(f"first pass, try {attempt + 1}: {'; '.join(issues)}")
            continue
        for _ in range(2):
            second = repair(page.body, ask(client, model, STYLE, SECOND, first))
            if not (issues := problems(page.body, second["body"])):
                break
            notes.append(f"second pass: {'; '.join(issues)}")
        else:
            notes.append("kept the first pass: the second kept breaking the page")
            second = first
        checked, fixes = check(client, page, second)
        return render(page, **checked), notes + fixes
    raise RuntimeError("; ".join(notes))


# --- consistency -----------------------------------------------------------

# Forms the glossary in STYLE.md rules out, with the one it asks for.
RULED_OUT = [
    (r"встроенн\w*\s+плагин", "плагин из поставки bb"),
    (r"пространств\w*\s+имён", "неймспейс"),
    (r"(?<![а-яё])карт\w*\s+(UI-)?зон", "макет зон"),
    (r"(?<![а-яё])поток\w*", "тред (если речь о thread)"),
    (r"(?<![а-яё])энтрипойнт", "точка входа"),
    (r"(?<![а-яё])корзин", "набор"),
    (r"(?<![а-яё])навык", "скилл"),
    (r"25\s+слот", "22 метода-слота, 27 точек регистрации"),
    (r"[A-Za-z]'[а-яё]", "без апострофа: кириллица со склонением"),
    (r"(?<![а-яё])(является|являются|данн(ый|ая|ое|ого|ой|ом)|осуществля\w*|в рамках|представляет собой)(?![а-яё])", "канцелярит"),
]


def consistency_report(sources: list[Path]) -> None:
    found = []
    for source in sources:
        target = load(source).target
        if not target.exists():
            continue
        _, body = split_front(target.read_text())
        prose = outside_code_spans(PLACEHOLDER.sub(" ", mask(body)[0]))
        for pattern, instead in RULED_OUT:
            for match in re.finditer(pattern, prose, re.I):
                found.append(f"  {target.relative_to(CONTENT)}: «{match.group(0)}» → {instead}")
    print(f"consistency: {len(found)} ruled-out form(s)" + "".join(f"\n{line}" for line in found))


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
    parser.add_argument("--report", action="store_true", help="only the consistency report, no API calls")
    parser.add_argument("--check", action="store_true", help=f"only the third pass ({CHECK_MODEL}), on the Russian pages as they are")
    args = parser.parse_args()
    if args.selftest:
        return selftest()
    if args.report:
        consistency_report(english_pages())
        return 0

    from google import genai

    client = genai.Client(api_key=api_key())
    sources = [CONTENT / p for p in args.pages] if args.pages else english_pages()
    context = "" if args.check else first_pass_instruction()

    def verify(page: Page) -> tuple[str, list[str]]:
        front, body = split_front(page.target.read_text())
        # Links as the English page has them; rendering puts the locale back.
        russian = {"title": front_value(front, "title"), "description": front_value(front, "description"),
                   "body": re.sub(r"\]\(/ru(?=/)", "](", mask(body)[0])}
        checked, notes = check(client, page, russian)
        return render(page, **checked), notes

    def run(source: Path) -> bool:
        page = load(source)
        name = source.relative_to(CONTENT)
        try:
            text, notes = verify(page) if args.check else translate(client, args.model, context, page)
        except Exception as error:  # noqa: BLE001 — one page failing must not stop the rest
            print(f"✗ {name}: {error}", flush=True)
            return False
        page.target.parent.mkdir(parents=True, exist_ok=True)
        page.target.write_text(text)
        print(f"✓ {name}" + "".join(f"\n    {n}" for n in notes), flush=True)
        return True

    print(f"{len(sources)} pages with {CHECK_MODEL if args.check else args.model}", flush=True)
    with ThreadPoolExecutor(args.jobs) as pool:
        results = list(pool.map(run, sources))
    print(f"{sum(results)} written, {len(results) - sum(results)} failed")
    print(USAGE)
    consistency_report(sources)
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
