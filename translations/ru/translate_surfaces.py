#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["google-genai>=1.33", "pydantic>=2"]
# ///
"""
Write the Russian overlay of data/surfaces.json, translations/ru/surfaces.json,
with the Gemini API.

Only groups and surfaces that are new or whose English changed are written; the
list comes from hash.mjs, the code the tests use. Entries go in batches with the
whole English site in context, as the pages do, then the check model compares
each batch with the English and fixes meaning only. Each entry written gets
the hash of the English it was made from (hash.mjs computes it, as the tests
do); an entry that failed keeps its old hash, so it stays stale.

    uv run translations/ru/translate_surfaces.py
"""
from __future__ import annotations

import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

from translate import CHECK_MODEL, DEFAULT_MODEL, HERE, REPO, STYLE, USAGE, api_key, ask, first_pass_instruction, problems, repair

SOURCE = REPO / "data" / "surfaces.json"
OVERLAY = HERE / "surfaces.json"
BATCH = 8

FIRST = """Переведи тексты поверхностей и групп bb для русской версии сайта по правилам из системной инструкции.
Для каждой записи верни тот же id и kind. Переведи title, summary, каждый пункт bullets (столько же пунктов, в том же порядке), tagline, blurb и sections; пустые поля оставь пустыми.
summary начинай с глагола в повелительном наклонении на «вы», как в английском («Add a…» — «Добавьте…»); «With this, a plugin can:» в конце — «С её помощью плагин может:».
Строки интерфейса bb, фрагменты в обратных кавычках и адреса ссылок в круглых скобках не меняй.

"""

CHECK = """Сверь русские записи с английскими. Стиль не правь: только смысл — кто что делает, модальность, оговорки, пропавшие или добавленные факты, переведённые строки интерфейса bb.
Верни все русские записи, исправив только то, что расходится по смыслу, и в notes перечисли каждое исправление коротко.

"""


def node(script: str):
    """Run an ES module against hash.mjs and data/surfaces.json, and parse what it prints."""
    prelude = (
        "import { diffOverlay, groupHash, surfaceHash } from './translations/ru/hash.mjs';"
        "import { readFileSync } from 'node:fs';"
        "const read = (p) => JSON.parse(readFileSync(p, 'utf8'));"
        "const source = read('data/surfaces.json');"
    )
    out = subprocess.run(["node", "--input-type=module", "-e", prelude + script], cwd=REPO, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def stale() -> list[str]:
    """`groups/<id>` and `surfaces/<id>` the overlay is missing or holds stale."""
    return node("const d = diffOverlay(source, read('translations/ru/surfaces.json'));"
                "console.log(JSON.stringify([...d.missing, ...d.stale]));")


def hashes() -> dict[str, str]:
    """The current English hash of every `groups/<id>` and `surfaces/<id>`."""
    return node("console.log(JSON.stringify(Object.fromEntries(["
                "...source.groups.map((g) => ['groups/' + g.id, groupHash(g)]),"
                "...source.surfaces.map((s) => ['surfaces/' + s.id, surfaceHash(s)])])));")


def english_entry(kind: str, item: dict) -> dict:
    if kind == "groups":
        return {"id": item["id"], "kind": kind, "title": item["title"], "blurb": item["blurb"],
                "sections": [s["title"] for s in item.get("sections", [])]}
    return {"id": item["id"], "kind": kind, "title": item["title"], "summary": item["summary"],
            "bullets": item["bullets"], "tagline": item.get("tagline", "")}


def flat(entry: dict) -> str:
    """One text per entry, so the page checks (code spans, links, quotes) apply unchanged."""
    parts = [entry.get("title", ""), entry.get("summary", ""), entry.get("tagline", ""), entry.get("blurb", "")]
    return "\n".join(parts + list(entry.get("bullets", [])) + list(entry.get("sections", [])))


def repaired(english: dict, russian: dict) -> dict:
    """The page fix-ups (quotes, backticks, bare tags) on every text of an entry."""
    fix = lambda text: repair(flat(english), {"body": text})["body"]
    return {k: [fix(v) for v in value] if isinstance(value, list) else fix(value) if k not in ("id", "kind") else value
            for k, value in russian.items()}


def broken(english: dict, russian: dict) -> list[str]:
    issues = problems(flat(english), flat(russian))
    for field in ("bullets", "sections"):
        if len(english.get(field, [])) != len(russian.get(field, [])):
            issues.append(f"{field}: {len(english.get(field, []))} in English, {len(russian.get(field, []))} in Russian")
    return issues


def schemas():
    from pydantic import BaseModel

    class Entry(BaseModel):
        id: str
        kind: str
        title: str
        summary: str = ""
        bullets: list[str] = []
        tagline: str = ""
        blurb: str = ""
        sections: list[str] = []

    class Batch(BaseModel):
        entries: list[Entry]

    class Checked(BaseModel):
        entries: list[Entry]
        notes: list[str]

    return Batch, Checked


def translate_batch(client, model: str, context: str, english: list[dict]) -> tuple[dict[str, dict], list[str]]:
    Batch, Checked = schemas()
    by_id = {e["id"]: e for e in english}
    for attempt in range(2):
        answer = ask(client, model, context, FIRST, {"entries": english}, Batch)["entries"]
        draft = {e["id"]: repaired(by_id[e["id"]], e) for e in answer if e["id"] in by_id}
        if set(draft) == set(by_id) and not any(broken(by_id[i], draft[i]) for i in by_id):
            break
    else:
        bad = {i: broken(by_id[i], draft[i]) if i in draft else ["missing"] for i in by_id}
        raise RuntimeError("; ".join(f"{i}: {', '.join(v)}" for i, v in bad.items() if v))
    checked = ask(client, CHECK_MODEL, STYLE, CHECK, {"english": english, "russian": list(draft.values())}, Checked)
    fixed = {e["id"]: repaired(by_id[e["id"]], e) for e in checked["entries"] if e["id"] in by_id}
    # A fix that breaks an entry is dropped: the draft already passed.
    result = {i: fixed[i] if i in fixed and not broken(by_id[i], fixed[i]) else draft[i] for i in by_id}
    return result, checked["notes"]


def overlay_entry(kind: str, english: dict, russian: dict, source_hash: str) -> dict:
    if kind == "groups":
        entry = {"sourceHash": source_hash, "title": russian["title"], "blurb": russian["blurb"]}
        if english["sections"]:
            entry["sections"] = dict(zip(english["sections"], russian["sections"]))
        return entry
    entry = {"sourceHash": source_hash, "title": russian["title"], "summary": russian["summary"], "bullets": russian["bullets"]}
    if english["tagline"]:
        entry["tagline"] = russian["tagline"]
    return entry


def main() -> int:
    from google import genai

    todo = stale()
    if not todo:
        print("translations/ru/surfaces.json: all groups and surfaces current")
        return 0
    source = json.loads(SOURCE.read_text())
    items = {f"{kind}/{item['id']}": english_entry(kind, item) for kind in ("groups", "surfaces") for item in source[kind]}
    english = [items[key] for key in todo]
    batches = [english[i:i + BATCH] for i in range(0, len(english), BATCH)]
    client = genai.Client(api_key=api_key())
    context = first_pass_instruction()
    print(f"{len(english)} entries in {len(batches)} batches with {DEFAULT_MODEL}, checked with {CHECK_MODEL}", flush=True)

    def run(batch: list[dict]):
        try:
            return translate_batch(client, DEFAULT_MODEL, context, batch)
        except Exception as error:  # noqa: BLE001 — one batch failing must not stop the rest
            print(f"✗ {', '.join(e['id'] for e in batch)}: {error}", flush=True)
            return None

    with ThreadPoolExecutor(4) as pool:
        results = list(pool.map(run, batches))

    overlay = json.loads(OVERLAY.read_text())
    current = hashes()
    written = 0
    for batch, result in zip(batches, results):
        if result is None:
            continue
        russian, notes = result
        for e in batch:
            key = f"{e['kind']}/{e['id']}"
            overlay[e["kind"]][e["id"]] = overlay_entry(e["kind"], e, russian[e["id"]], current[key])
            written += 1
        for note in notes:
            print(f"    {note}")
    ids = {kind: [item["id"] for item in source[kind]] for kind in ("groups", "surfaces")}
    for kind in ids:  # the English order, and nothing the English no longer has
        overlay[kind] = {i: overlay[kind][i] for i in ids[kind] if i in overlay[kind]}
    OVERLAY.write_text(json.dumps(overlay, ensure_ascii=False, indent=2) + "\n")
    print(f"{written} of {len(english)} written\n{USAGE}")
    return 0 if written == len(english) else 1


if __name__ == "__main__":
    sys.exit(main())
