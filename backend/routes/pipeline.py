"""Streaming endpoint that drives the full multi-agent pipeline."""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional

from ..agents.orchestrator import run_pipeline

router = APIRouter()


class PipelineRequest(BaseModel):
    careers_url: HttpUrl
    resume: Optional[str] = Field(default=None, max_length=12000)
    max_jobs: int = Field(default=10, ge=1, le=20)


@router.post("/pipeline")
async def pipeline(req: PipelineRequest):
    return StreamingResponse(
        run_pipeline(str(req.careers_url), req.resume, req.max_jobs),
        media_type="text/event-stream",
    )
