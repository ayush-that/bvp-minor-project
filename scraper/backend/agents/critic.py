"""Critic Agent — Claude Haiku audits an extraction against its source and emits a patch."""
from __future__ import annotations

import json

from ..config import get_settings
from .base import LLM, AgentError
from .prompts import SYSTEM_PROMPTS

VALID_WORK_MODES = {"remote", "hybrid", "onsite", "unknown"}


class CriticAgent:
    def __init__(self):
        self.llm = LLM(get_settings().critic_model, max_tokens=800)

    async def run(self, source_markdown: str, extracted: dict) -> dict:
        """Return possibly-patched extraction dict."""
        user = (
            "<SOURCE>\n" + source_markdown[:15000] + "\n</SOURCE>\n\n"
            "<EXTRACTED>\n" + json.dumps(extracted, indent=2) + "\n</EXTRACTED>"
        )
        try:
            verdict = await self.llm.json_call(SYSTEM_PROMPTS["critic"], user)
        except AgentError:
            # Critic failure should never kill extraction; pass through.
            return extracted
        if verdict.get("ok"):
            return extracted
        patch = verdict.get("patch") or {}
        merged = {**extracted, **patch}
        # Hard schema guard: critic is advisory, not authoritative.
        if merged.get("work_mode") not in VALID_WORK_MODES:
            merged["work_mode"] = extracted.get("work_mode") or "unknown"
        merged["apply_link"] = extracted.get("apply_link")  # never overwrite URL
        return merged
