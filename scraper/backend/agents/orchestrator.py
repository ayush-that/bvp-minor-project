"""Orchestrator — runs the full agent pipeline with parallel fan-out + streamed events."""
from __future__ import annotations

import asyncio
import json
from typing import AsyncIterator, Optional

from ..config import get_settings
from ..storage import get_db
from .critic import CriticAgent
from .discovery import DiscoveryAgent
from .extraction import ExtractionAgent
from .matching import MatchingAgent


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def run_pipeline(
    careers_url: str,
    resume: Optional[str],
    max_jobs: int = 10,
) -> AsyncIterator[str]:
    """Yields Server-Sent Events as the pipeline progresses."""
    settings = get_settings()
    db = get_db()

    yield _sse("stage", {"stage": "discovery", "message": f"Discovering postings on {careers_url}"})

    try:
        links = await DiscoveryAgent(max_jobs=max_jobs).run(careers_url)
    except Exception as e:
        yield _sse("error", {"where": "discovery", "detail": str(e)})
        return

    yield _sse("discovered", {"count": len(links), "links": links})

    if not links:
        yield _sse("done", {"message": "no postings discovered"})
        return

    # Fan out extraction + critic, bounded by concurrency.
    sem = asyncio.Semaphore(settings.extraction_concurrency)
    extractor = ExtractionAgent()
    critic = CriticAgent()

    async def process_one(link: str) -> Optional[dict]:
        async with sem:
            data, src = await extractor.run(link)
            if not data:
                return None
            data = await critic.run(src, data)
            return data

    results: list[dict] = []
    tasks = [asyncio.create_task(process_one(l)) for l in links]
    for fut in asyncio.as_completed(tasks):
        try:
            data = await fut
        except Exception as e:
            yield _sse("extract_error", {"detail": str(e)})
            continue
        if not data:
            yield _sse("extract_skip", {"reason": "not a posting"})
            continue
        pid = await db.upsert_posting(data, source_url=careers_url)
        data["id"] = pid
        results.append(data)
        yield _sse("posting", data)

    yield _sse("extracted", {"count": len(results)})

    if not resume:
        yield _sse("done", {"message": "no resume provided; skipping match"})
        return

    yield _sse("stage", {"stage": "matching", "message": "Ranking postings against resume"})

    try:
        ranked, warning = await MatchingAgent().run(resume, results)
    except Exception as e:
        yield _sse("error", {"where": "matching", "detail": str(e)})
        return

    if warning:
        yield _sse("warning", {"message": warning})

    dismissed = await db.dismissed_ids()
    visible = [r for r in ranked if r["id"] not in dismissed]

    yield _sse("ranked", {"ranked": visible})
    yield _sse("done", {"message": f"pipeline complete — {len(results)} postings, {len(visible)} ranked"})
