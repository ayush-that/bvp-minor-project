"""Server-only Context.dev searches with persistent, key-scoped caching."""
import asyncio
import hashlib
import json
import time
from datetime import datetime, timezone

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from ..config import get_settings
from ..storage import get_db

SEARCH_LOCK = asyncio.Lock()
CACHE_SECONDS = 24 * 60 * 60


class ResultModel(BaseModel):
    model_config = ConfigDict(strict=True)


class Location(ResultModel):
    city: str | None = None
    region: str | None = None
    country_code: str | None = None


class Employer(ResultModel):
    name: str | None = None
    domain: str | None = None


class CurrentRole(ResultModel):
    title: str | None = None
    company: Employer | None = None


class PersonResult(ResultModel):
    name: str = Field(min_length=1)
    description: str | None = None
    profiles: list[str] | None = None
    role: CurrentRole | None = None
    location: Location | None = None
    years_of_experience: float | None = None
    skills: list[str] | None = None
    schools: list[str] | None = None


class Employees(ResultModel):
    count: int | None = None
    min: int | None = None
    max: int | None = None


class Funding(ResultModel):
    stage: str | None = None
    total_usd: float | None = None


class CompanyResult(ResultModel):
    name: str = Field(min_length=1)
    domain: str | None = None
    description: str | None = None
    industries: list[str] | None = None
    headquarters: Location | None = None
    employees: Employees | None = None
    funding: Funding | None = None


def normalize_results(kind: str, data: dict) -> list[dict]:
    model = PersonResult if kind == "people" else CompanyResult
    return [model.model_validate(item).model_dump() for item in data["results"]]


async def search(kind: str, query: str, country: str | None, cursor: str | None) -> dict:
    key = get_settings().context_dev_api_key
    if not key:
        raise HTTPException(503, "Context search is not configured on the backend.")
    body = {"query": query, "mode": "fast", "tags": ["pathfinder"]}
    if country:
        body["filters"] = {"countries": [country]}
    if cursor:
        body["cursor"] = cursor
    cache_key = hashlib.sha256((key + kind + json.dumps(body, sort_keys=True)).encode()).hexdigest()
    db = get_db()
    async with SEARCH_LOCK:
        cached = await db.get_context_cache(cache_key, time.time())
        if cached:
            payload = cached["payload"]
            try:
                payload["results"] = normalize_results(kind, payload)
            except (ValidationError, TypeError, KeyError):
                raise HTTPException(502, "The cached search could not be read. Please contact the project maintainer.")
            payload["key_metadata"] = {"credits_consumed": 0}
            payload["cache"] = {"hit": True, "expires_at": datetime.fromtimestamp(cached["expires_at"], timezone.utc).isoformat()}
            return payload
        endpoint = "people/search" if kind == "people" else "company/search"
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    f"https://api.context.dev/v1/{endpoint}",
                    headers={"Authorization": f"Bearer {key}"}, json=body,
                )
        except httpx.TimeoutException:
            raise HTTPException(504, "Context search timed out. Try a shorter query.")
        except httpx.HTTPError:
            raise HTTPException(502, "Context could not be reached. Please retry later.")
        if response.status_code >= 400:
            errors = {
                400: (422, "Context rejected this search. Check the query, filters or page cursor."),
                401: (502, "Context rejected the backend API key. Check its configuration."),
                402: (402, "The Context test key has insufficient credits for this search."),
                403: (502, "The Context key does not have permission for this search."),
                408: (504, "Context search timed out. Try a shorter query."),
                429: (429, "Context rate limit reached. Wait before searching again."),
            }
            status, message = errors.get(response.status_code, (502, "Context search is temporarily unavailable."))
            raise HTTPException(status, message)
        try:
            data = response.json()
            if not isinstance(data, dict) or not isinstance(data.get("results"), list):
                raise ValueError("Missing results")
            data["results"] = normalize_results(kind, data)
            if data.get("next_cursor") is not None and not isinstance(data["next_cursor"], str):
                raise ValueError("Invalid page cursor")
            if data.get("request_id") is not None and not isinstance(data["request_id"], str):
                raise ValueError("Invalid request identifier")
        except (ValueError, TypeError):
            raise HTTPException(502, "Context returned an unreadable search result.")
        payload = {"results": data["results"], "next_cursor": data.get("next_cursor"), "request_id": data.get("request_id")}
        metadata = data.get("key_metadata")
        if isinstance(metadata, dict):
            payload["key_metadata"] = {k: metadata[k] for k in ("credits_consumed", "credits_remaining") if isinstance(metadata.get(k), int)}
        expires = time.time() + CACHE_SECONDS
        await db.set_context_cache(cache_key, payload, expires)
        return {**payload, "cache": {"hit": False, "expires_at": datetime.fromtimestamp(expires, timezone.utc).isoformat()}}
