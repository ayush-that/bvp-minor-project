"""Eval harness: runs the extraction agent against a labeled set and prints field-level P/R/F1.

Usage:  .venv/bin/python eval.py
"""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

from backend.agents.extraction import ExtractionAgent

FIELDS = ["job_title", "company", "location", "work_mode", "key_skills"]


def field_match(field: str, got, expected) -> bool:
    if got is None and (expected is None or expected == ""):
        return True
    if got is None or expected is None:
        return False
    if field == "key_skills":
        g = {s.strip().lower() for s in (got or [])}
        e = {s.strip().lower() for s in (expected or [])}
        if not e:
            return not g
        return len(g & e) / len(e) >= 0.5
    return str(got).strip().lower() == str(expected).strip().lower()


async def main() -> None:
    fixtures = json.loads(Path("eval_fixtures/annotated.json").read_text())
    extractor = ExtractionAgent()

    per_field: dict[str, dict[str, int]] = {f: {"tp": 0, "fp": 0, "fn": 0} for f in FIELDS}

    for item in fixtures:
        got, _ = await extractor.run(item["apply_link"])
        got = got or {}
        for f in FIELDS:
            g = got.get(f)
            e = item["expected"].get(f)
            if field_match(f, g, e):
                per_field[f]["tp"] += 1
            else:
                if e:
                    per_field[f]["fn"] += 1
                if g:
                    per_field[f]["fp"] += 1

    print(f"{'field':<18}{'P':>8}{'R':>8}{'F1':>8}")
    for f, m in per_field.items():
        p = m["tp"] / (m["tp"] + m["fp"]) if (m["tp"] + m["fp"]) else 0.0
        r = m["tp"] / (m["tp"] + m["fn"]) if (m["tp"] + m["fn"]) else 0.0
        f1 = (2 * p * r / (p + r)) if (p + r) else 0.0
        print(f"{f:<18}{p:>8.3f}{r:>8.3f}{f1:>8.3f}")


if __name__ == "__main__":
    asyncio.run(main())
