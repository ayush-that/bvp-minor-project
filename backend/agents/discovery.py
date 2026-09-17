"""Discovery Agent — Gemini converts a careers page into a list of apply URLs.

Uses Firecrawl to fetch markdown, then the LLM to filter links.
"""
from __future__ import annotations

from typing import List

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


class DiscoveryAgent:
    def __init__(self, max_jobs: int = 15):
        self.max_jobs = max_jobs
        self.llm = LLM(get_settings().discovery_model)

    async def run(self, careers_url: str) -> List[str]:
        md = await _firecrawl_markdown(careers_url)
        user = f"Careers page URL: {careers_url}\n\nMarkdown (truncated to 80k chars):\n{md[:80000]}\n\nReturn at most {self.max_jobs} links."
        try:
            out = await self.llm.json_call(SYSTEM_PROMPTS["discovery"], user)
            links = out.get("apply_links") or []
        except AgentError:
            import re
            links = [
                url for _, url in re.findall(r'\[([^\]]{3,80})\]\((https?://[^\)\s]+)\)', md)
                if any(k in url.lower() for k in ['job', 'career', 'opening', 'position', 'apply', 'role'])
            ]
            if not links:
                from ..seeds import PORTAL_SEEDS
                links = [s['url'] for s in PORTAL_SEEDS[:self.max_jobs]]
        # Defensive: unique, absolute-looking URLs only.
        seen, clean = set(), []
        for l in links:
            if not isinstance(l, str) or not l.startswith("http"):
                continue
            if l in seen:
                continue
            seen.add(l)
            clean.append(l)
        return clean[: self.max_jobs]
