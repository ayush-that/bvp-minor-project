"""Async LLM client. All traffic routes through OpenRouter's OpenAI-compatible API."""
from __future__ import annotations

import json

import httpx

from ..config import get_settings


class AgentError(Exception):
    pass


class LLM:
    """Thin async wrapper over OpenRouter chat completions."""

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
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(raw[start : end + 1])
                except json.JSONDecodeError:
                    pass
            raise AgentError(f"bad JSON from {self.model}: {e}\nRAW:\n{raw[:500]}")

    async def _call(self, system: str, user: str) -> str:
        if not self.settings.openrouter_api_key:
            raise AgentError("OPENROUTER_API_KEY is not configured")
        url = f"{self.settings.openrouter_base_url.rstrip('/')}/chat/completions"
        async with httpx.AsyncClient(timeout=120) as c:
            r = await c.post(
                url,
                headers={
                    "Authorization": f"Bearer {self.settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
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
            try:
                r.raise_for_status()
            except httpx.HTTPStatusError as e:
                raise AgentError(
                    f"openrouter HTTP {e.response.status_code} for {self.model}: {e.response.text[:300]}"
                ) from e
            return r.json()["choices"][0]["message"]["content"]
