"""Run specialist agents concurrently and stream their actual progress."""
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
    settings = get_settings()
    db = get_db()
    yield _sse("stage", {"stage": "discovery", "message": f"Discovering postings on {careers_url}"})
    try:
        links = await DiscoveryAgent(max_jobs=max_jobs).run(careers_url)
    except Exception:
        yield _sse("error", {"where": "discovery", "detail": "Discovery failed. Check the selected portal and provider access."})
        return
    yield _sse("discovered", {"count": len(links), "links": links})
    if not links:
        yield _sse("done", {"message": "no postings discovered"})
        return

    queue: asyncio.Queue = asyncio.Queue()
    sem = asyncio.Semaphore(settings.extraction_concurrency)
    extractor, critic = ExtractionAgent(), CriticAgent()
    stats = {s: {"completed": 0, "failed": 0} for s in ("extraction", "critic")}

    async def process_one(link: str) -> None:
        stage = "extraction"
        try:
            async with sem:
                await queue.put(("agent", {"stage": stage, "status": "running", "apply_link": link}))
                data, src = await extractor.run(link)
                stats[stage]["completed"] += 1
                if not data:
                    await queue.put(("extract_skip", {"reason": "not a posting", "apply_link": link}))
                    return
                stage = "critic"
                await queue.put(("agent", {"stage": stage, "status": "running", "apply_link": link}))
                data = await critic.run(src, data)
                audit = data["audit"]
                stats[stage]["failed" if audit["status"] in ("unavailable", "unresolved") else "completed"] += 1
                await queue.put(("audit", {"apply_link": link, **audit}))
                stage = "storage"
                pid = await db.upsert_posting(data, source_url=careers_url)
                data.update(id=pid, source_url=careers_url)
                await queue.put(("posting", data))
        except Exception:
            if stage in stats:
                stats[stage]["failed"] += 1
            await queue.put(("extract_error", {"stage": stage, "apply_link": link, "detail": f"{stage} failed for this posting; no result was fabricated"}))
        finally:
            queue.put_nowait(("worker_done", {}))

    results: dict[str, dict] = {}
    dismissed = await db.dismissed_ids()
    tasks = [asyncio.create_task(process_one(link)) for link in links]
    try:
        remaining = len(tasks)
        while remaining:
            event, data = await queue.get()
            if event == "worker_done":
                remaining -= 1
                continue
            if event == "posting":
                if data["id"] in dismissed:
                    continue
                results[data["id"]] = data
            yield _sse(event, data)
    finally:
        for task in tasks:
            if not task.done():
                task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

    for stage, counts in stats.items():
        status = "error" if counts["failed"] else "done" if counts["completed"] else "idle"
        yield _sse("agent", {"stage": stage, "status": status, **counts})
    yield _sse("extracted", {"count": len(results)})
    if not results:
        yield _sse("done", {"message": "No jobs extracted. Check the log for skipped postings or provider failures."})
        return
    if not resume:
        yield _sse("done", {"message": f"{len(results)} jobs saved; add a resume to rank them without scraping again"})
        return

    yield _sse("stage", {"stage": "matching", "message": "Ranking postings against resume"})
    try:
        ranked, warning = await MatchingAgent().run(resume, list(results.values()))
    except Exception:
        yield _sse("error", {"where": "matching", "detail": "Matching unavailable. Jobs are saved; retry ranking without scraping."})
        return
    if warning:
        yield _sse("warning", {"message": warning})
    yield _sse("ranked", {"ranked": ranked})
    yield _sse("done", {"message": f"pipeline complete: {len(results)} postings, {len(ranked)} ranked"})
