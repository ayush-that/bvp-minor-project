"""Extraction Agent — converts one posting to structured JSON.

Provider is chosen via `extraction_model` in settings (default: Claude Haiku).
Uses Firecrawl markdown (cheap) rather than Firecrawl's native extract action
so the Critic has the same raw source we parsed from.
"""
from __future__ import annotations

from typing import Optional

import httpx

from ..config import get_settings
from .base import LLM, AgentError
from .prompts import SYSTEM_PROMPTS


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
        self.llm = LLM(get_settings().extraction_model, max_tokens=1500)

    async def run(self, apply_link: str) -> tuple[Optional[dict], str]:
        """Return (posting_dict_or_None, raw_markdown_source)."""
        try:
            md = await _firecrawl_markdown(apply_link)
        except AgentError:
            return None, ""
        trimmed = md[:30000]
        user = f"Source URL: {apply_link}\n\nContent:\n{trimmed}"
        try:
            data = await self.llm.json_call(SYSTEM_PROMPTS["extraction"], user)
        except AgentError:
            return None, trimmed
        # Attach canonical apply_link (never trust LLM with the URL).
        data["apply_link"] = apply_link
        if (data.get("description_summary") or "").strip() == "NOT_A_POSTING":
            return None, trimmed
        return data, trimmed
