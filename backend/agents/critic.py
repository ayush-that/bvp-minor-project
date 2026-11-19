"""Audit an extraction against its source and retain the accepted corrections."""
from __future__ import annotations

import json
from pydantic import ValidationError

from ..config import get_settings
from .base import LLM, AgentError
from .prompts import SYSTEM_PROMPTS
from .extraction import PostingData

class CriticAgent:
    def __init__(self):
        self.llm = LLM(get_settings().critic_model)

    async def run(self, source_markdown: str, extracted: dict) -> dict:
        """Return possibly-patched extraction dict."""
        user = (
            "<SOURCE>\n" + source_markdown[:30000] + "\n</SOURCE>\n\n"
            "<EXTRACTED>\n" + json.dumps({
                k: v for k, v in extracted.items() if k in PostingData.model_fields
            }, indent=2) + "\n</EXTRACTED>"
        )
        try:
            verdict = await self.llm.json_call(SYSTEM_PROMPTS["critic"], user)
            if not isinstance(verdict, dict) or not isinstance(verdict.get("ok"), bool):
                raise AgentError("Invalid critic verdict")
            issues = verdict.get("issues", [])
            if not isinstance(issues, list) or any(not isinstance(i, str) for i in issues):
                raise AgentError("Invalid critic issues")
            patch = verdict.get("patch") or {}
            if not isinstance(patch, dict):
                raise AgentError("Invalid critic patch")
            patch = {k: v for k, v in patch.items() if k in PostingData.model_fields}
            if verdict["ok"]:
                patch = {}
            merged = PostingData.model_validate({**extracted, **patch}).model_dump()
        except (AgentError, ValidationError):
            return {**extracted, "audit": {
                "status": "unavailable", "issues": ["Source audit unavailable; extraction has not been verified."],
                "changes": {},
            }}
        changes = {
            k: {"before": extracted.get(k), "after": merged[k]}
            for k in patch if extracted.get(k) != merged[k]
        }
        status = "verified" if verdict["ok"] and not issues else "corrected" if changes else "unresolved"
        return {**merged, "apply_link": extracted["apply_link"], "audit": {
            "status": status, "issues": issues, "changes": changes,
        }}
