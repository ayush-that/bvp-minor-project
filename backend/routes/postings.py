"""Read and rematch discovered postings without paying to scrape them again.

Like the existing pipeline, this is a single-candidate local workspace API.
"""
import asyncio

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field, field_validator

from ..agents.base import AgentError
from ..agents.matching import MatchingAgent
from ..storage import get_db

router = APIRouter()


class RematchRequest(BaseModel):
    posting_ids: list[str] = Field(min_length=1, max_length=50)
    resume: str = Field(min_length=1, max_length=12000)

    @field_validator("resume")
    @classmethod
    def nonempty_resume(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Resume cannot be blank")
        return value.strip()


@router.get("/postings")
async def list_postings(limit: int = Query(default=50, ge=1, le=50)):
    return {"postings": await get_db().list_postings(limit)}


@router.post("/postings/match")
async def rematch(req: RematchRequest, request: Request):
    db = get_db()
    postings = await db.get_postings(req.posting_ids)
    if {p["id"] for p in postings} != set(req.posting_ids):
        raise HTTPException(404, "One or more postings no longer exist. Reload the saved jobs.")
    dismissed = await db.dismissed_ids()
    postings = [p for p in postings if p["id"] not in dismissed]
    if not postings:
        raise HTTPException(409, "All selected postings have been dismissed.")
    task = asyncio.create_task(MatchingAgent().run(req.resume, postings))
    try:
        while not task.done():
            if await request.is_disconnected():
                raise HTTPException(499, "Matching cancelled")
            await asyncio.wait({task}, timeout=0.2)
        ranked, warning = task.result()
    except AgentError:
        raise HTTPException(502, "Matching is unavailable. Your saved jobs are unchanged.")
    finally:
        if not task.done():
            task.cancel()
        await asyncio.gather(task, return_exceptions=True)
    return {"ranked": ranked, "warning": warning}
