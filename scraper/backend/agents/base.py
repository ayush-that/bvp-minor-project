"""Multi-provider async LLM client. One class, three backends, JSON-mode helpers."""
from __future__ import annotations

import json
from typing import Any, Optional

import httpx

from ..config import get_settings


class AgentError(Exception):
    pass


class LLM:
    """Thin async wrapper over OpenAI, Anthropic, and Gemini."""

    def __init__(self, model: str, *, temperature: float = 0.0, max_tokens: int = 2000):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.settings = get_settings()

    async def json_call(self, system: str, user: str) -> dict:
        """Return a parsed JSON object. Raises AgentError on provider/parse failure."""
        raw = await self._call(system, user)
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            # Last-resort tolerance: find the first {...} span.
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(raw[start : end + 1])
                except json.JSONDecodeError:
                    pass
            raise AgentError(f"bad JSON from {self.model}: {e}\nRAW:\n{raw[:500]}")

    async def _call(self, system: str, user: str) -> str:
        provider = self._provider()
        if provider == "openai":
            return await self._openai(system, user)
        if provider == "anthropic":
            return await self._anthropic(system, user)
        if provider == "gemini":
            return await self._gemini(system, user)
        raise AgentError(f"unknown provider for model {self.model}")

    def _provider(self) -> str:
        m = self.model.lower()
        if m.startswith("gpt"):
            return "openai"
        if m.startswith("claude"):
            return "anthropic"
        if m.startswith("gemini"):
            return "gemini"
        raise AgentError(f"cannot infer provider from model id: {self.model}")

    async def _openai(self, system: str, user: str) -> str:
        async with httpx.AsyncClient(timeout=120) as c:
            r = await c.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.settings.openai_api_key}"},
                json={
                    "model": self.model,
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]

    async def _anthropic(self, system: str, user: str) -> str:
        async with httpx.AsyncClient(timeout=120) as c:
            r = await c.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": self.max_tokens,
                    "temperature": self.temperature,
                    "system": system + "\n\nReply with JSON only. No prose, no code fences.",
                    "messages": [{"role": "user", "content": user}],
                },
            )
            r.raise_for_status()
            return r.json()["content"][0]["text"]

    async def _gemini(self, system: str, user: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.settings.gemini_api_key}"
        async with httpx.AsyncClient(timeout=120) as c:
            r = await c.post(
                url,
                json={
                    "systemInstruction": {"parts": [{"text": system}]},
                    "contents": [{"role": "user", "parts": [{"text": user}]}],
                    "generationConfig": {
                        "temperature": self.temperature,
                        "maxOutputTokens": self.max_tokens,
                        "responseMimeType": "application/json",
                    },
                },
            )
            r.raise_for_status()
            data = r.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
