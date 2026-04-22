"""Matching Agent — Claude Sonnet ranks postings against a resume with reasoning."""
from __future__ import annotations

import json
from typing import List

from ..config import get_settings
from .base import LLM, AgentError
from .prompts import SYSTEM_PROMPTS


class MatchingAgent:
    def __init__(self):
        self.llm = LLM(get_settings().matching_model, max_tokens=3000)

    async def run(self, resume: str, postings: List[dict]) -> List[dict]:
        """postings items MUST have an 'id'. Returns ranked list with score + reason."""
        slim = [
            {
                "id": p["id"],
                "job_title": p.get("job_title"),
                "company": p.get("company"),
                "location": p.get("location"),
                "work_mode": p.get("work_mode"),
                "key_skills": p.get("key_skills"),
                "description_summary": p.get("description_summary"),
            }
            for p in postings
        ]
        user = (
            "<RESUME>\n" + (resume or "").strip()[:12000] + "\n</RESUME>\n\n"
            "<POSTINGS>\n" + json.dumps(slim, indent=2) + "\n</POSTINGS>"
        )
        try:
            out = await self.llm.json_call(SYSTEM_PROMPTS["matching"], user)
        except AgentError:
            # Graceful: return neutral scores so the UI still shows postings.
            return [{"id": p["id"], "score": 50, "reason": "matcher unavailable"} for p in postings]

        ranked = out.get("ranked") or []
        valid_ids = {p["id"] for p in postings}
        cleaned = [r for r in ranked if r.get("id") in valid_ids]
        missing = valid_ids - {r["id"] for r in cleaned}
        for mid in missing:
            cleaned.append({"id": mid, "score": 0, "reason": "not evaluated"})
        cleaned.sort(key=lambda r: -float(r.get("score", 0)))
        return cleaned
