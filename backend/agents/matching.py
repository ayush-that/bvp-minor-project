"""Rank postings against a resume with validated scores and explanations."""
from __future__ import annotations

import json
import math
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
        self.llm = LLM(get_settings().matching_model)

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
        if not postings:
            return [], None
        out = await self.llm.json_call(SYSTEM_PROMPTS["matching"], user)
        if not isinstance(out, dict):
            raise AgentError("Matching response must be an object")

        warning = out.get("warning")
        ranked = out.get("ranked") or []
        valid_ids = {p["id"] for p in postings}
        cleaned = []
        seen = set()
        if not isinstance(ranked, list):
            raise AgentError("Matching response must include ranked postings")
        for r in ranked:
            if not isinstance(r, dict):
                raise AgentError("Malformed ranking")
            pid, score, reason = r.get("id"), r.get("score"), r.get("reason")
            if (
                not isinstance(pid, str) or pid not in valid_ids or pid in seen
                or isinstance(score, bool) or not isinstance(score, (int, float))
                or not math.isfinite(score) or not 0 <= score <= 100
                or not isinstance(reason, str) or not reason.strip()
            ):
                raise AgentError("Invalid posting ID, score or explanation in matching response")
            seen.add(pid)
            cleaned.append({"id": pid, "score": score, "reason": reason})
        if seen != valid_ids:
            raise AgentError("Matching response omitted postings")
        cleaned.sort(key=lambda r: -float(r.get("score", 0)))
        return cleaned, warning if isinstance(warning, str) else None
