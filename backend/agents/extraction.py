"""Extraction Agent — converts one posting to structured JSON.

The model is chosen via `extraction_model` in settings.
Uses Firecrawl markdown (cheap) rather than Firecrawl's native extract action
so the Critic has the same raw source we parsed from.
"""
from __future__ import annotations

from typing import Optional
from typing import Literal

import httpx
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from ..config import get_settings
from .base import LLM, AgentError
from .prompts import SYSTEM_PROMPTS


class PostingData(BaseModel):
    model_config = ConfigDict(strict=True)

    job_title: str | None = None
    company: str | None = None
    location: str | None = None
    work_mode: Literal["remote", "hybrid", "onsite", "unknown"] = "unknown"
    compensation: str | None = None
    duration_weeks: float | None = Field(default=None, ge=0)
    deadline: str | None = None
    key_skills: list[str] = Field(default_factory=list)
    description_summary: str | None = None


async def _firecrawl_markdown(url: str) -> str:
    s = get_settings()
    async with httpx.AsyncClient(timeout=s.firecrawl_timeout) as c:
        r = await c.post(
            f"{s.firecrawl_api_url}/scrape",
            headers={"Authorization": f"Bearer {s.firecrawl_api_key}"},
            json={"url": url, "formats": ["markdown"]},
        )
    try:
        r.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise AgentError(f"firecrawl HTTP {e.response.status_code} for {url}") from e
    data = r.json()
    if not data.get("success"):
        raise AgentError(f"firecrawl failed for {url}: {data.get('message')}")
    return data["data"]["markdown"]


class ExtractionAgent:
    def __init__(self):
        self.llm = LLM(get_settings().extraction_model)

    async def run(self, apply_link: str) -> tuple[Optional[dict], str]:
        """Return (posting_dict_or_None, raw_markdown_source)."""
        md = await _firecrawl_markdown(apply_link)
        trimmed = md[:30000]
        user = f"Source URL: {apply_link}\n\nContent:\n{trimmed}"
        data = await self.llm.json_call(SYSTEM_PROMPTS["extraction"], user)
        if not isinstance(data, dict):
            raise AgentError("Extraction response must be an object")
        # Attach canonical apply_link (never trust LLM with the URL).
        if (data.get("description_summary") or "").strip() == "NOT_A_POSTING":
            return None, trimmed
        try:
            data = PostingData.model_validate(data).model_dump()
        except ValidationError as e:
            raise AgentError("Extraction returned an invalid posting schema") from e
        data["apply_link"] = apply_link
        return data, trimmed
