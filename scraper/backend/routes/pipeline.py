"""Streaming endpoint that drives the full multi-agent pipeline."""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from ..agents.orchestrator import run_pipeline

router = APIRouter()


class PipelineRequest(BaseModel):
    careers_url: str
    resume: Optional[str] = None
    max_jobs: int = 10


@router.post("/pipeline")
async def pipeline(req: PipelineRequest):
    return StreamingResponse(
        run_pipeline(req.careers_url, req.resume, req.max_jobs),
        media_type="text/event-stream",
    )
