"""Matching Agent — Claude Sonnet ranks postings against a resume with reasoning."""
from __future__ import annotations

import json
import re
from typing import List, Optional, Tuple

from ..config import get_settings
from .base import LLM, AgentError
from .prompts import SYSTEM_PROMPTS


MIN_RESUME_WORDS = 40


def _quick_resume_gate(resume: str) -> Optional[str]:
    """Return a warning string if the resume is obviously inadequate, else None.

    Cheap client-side check; the LLM prompt repeats the same gate so we never
    waste a matching call on empty input.
    """
    text = (resume or "").strip()
    if not text:
        return "Resume is empty — upload a PDF or paste your resume text before matching."
    words = re.findall(r"\w+", text)
    if len(words) < MIN_RESUME_WORDS:
        return (
            f"Resume is too short ({len(words)} words). Add your education, at least 3 "
            "technical skills, and one project or work experience."
        )
    return None


class MatchingAgent:
    def __init__(self):
        self.llm = LLM(get_settings().matching_model, max_tokens=3000)

    async def run(self, resume: str, postings: List[dict]) -> Tuple[List[dict], Optional[str]]:
        """postings items MUST have an 'id'. Returns (ranked, warning)."""
        # Cheap local gate — skips the LLM round-trip when the resume is obviously bad.
        gate_warning = _quick_resume_gate(resume)
        if gate_warning:
            stub = [
                {"id": p["id"], "score": 0, "reason": "insufficient resume — cannot evaluate fit"}
                for p in postings
            ]
            return stub, gate_warning

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
            "<RESUME>\n" + resume.strip()[:12000] + "\n</RESUME>\n\n"
            "<POSTINGS>\n" + json.dumps(slim, indent=2) + "\n</POSTINGS>"
        )
        try:
            out = await self.llm.json_call(SYSTEM_PROMPTS["matching"], user)
        except AgentError:
            # Graceful: return neutral scores so the UI still shows postings.
            stub = [{"id": p["id"], "score": 50, "reason": "matcher unavailable"} for p in postings]
            return stub, None

        warning = out.get("warning")
        ranked = out.get("ranked") or []
        valid_ids = {p["id"] for p in postings}
        cleaned = [r for r in ranked if r.get("id") in valid_ids]
        missing = valid_ids - {r["id"] for r in cleaned}
        for mid in missing:
            cleaned.append({"id": mid, "score": 0, "reason": "not evaluated"})
        cleaned.sort(key=lambda r: -float(r.get("score", 0)))
        return cleaned, warning
