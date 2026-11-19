"""Async SQLite persistence. One file, one table per entity, no ORM."""
import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import aiosqlite

from ..config import get_settings


SCHEMA = """
CREATE TABLE IF NOT EXISTS postings (
    id              TEXT PRIMARY KEY,
    fingerprint     TEXT UNIQUE NOT NULL,
    apply_link      TEXT NOT NULL,
    job_title       TEXT,
    company         TEXT,
    location        TEXT,
    compensation    TEXT,
    key_skills      TEXT,            -- JSON array
    raw             TEXT,            -- JSON dump
    source_url      TEXT,            -- the careers page this came from
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    posting_id   TEXT NOT NULL,
    action       TEXT NOT NULL,  -- view | save | apply | dismiss
    created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_postings_fp ON postings(fingerprint);

CREATE TABLE IF NOT EXISTS context_cache (
    cache_key TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    expires_at REAL NOT NULL
);
"""


def fingerprint(job: dict) -> str:
    """Stable dedup key over company + normalized title + location."""
    parts = [
        (job.get("company") or "").strip().lower(),
        (job.get("job_title") or "").strip().lower(),
        (job.get("location") or "").strip().lower(),
    ]
    return hashlib.md5("|".join(parts).encode("utf-8")).hexdigest()


class Database:
    def __init__(self, path: str):
        self.path = path

    async def init(self) -> None:
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        async with aiosqlite.connect(self.path) as db:
            await db.executescript(SCHEMA)
            await db.commit()

    async def upsert_posting(self, job: dict, source_url: str) -> str:
        fp = fingerprint(job)
        pid = fp  # use fingerprint as id for simplicity
        async with aiosqlite.connect(self.path) as db:
            existing = await db.execute_fetchall(
                "SELECT id, fingerprint FROM postings WHERE apply_link = ? LIMIT 1",
                (job.get("apply_link", ""),),
            )
            if existing:
                pid, fp = existing[0]
            await db.execute(
                """
                INSERT INTO postings (id, fingerprint, apply_link, job_title, company, location, compensation, key_skills, raw, source_url, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(fingerprint) DO UPDATE SET
                    apply_link=excluded.apply_link,
                    job_title=excluded.job_title,
                    company=excluded.company,
                    location=excluded.location,
                    compensation=excluded.compensation,
                    key_skills=excluded.key_skills,
                    raw=excluded.raw,
                    source_url=excluded.source_url
                """,
                (
                    pid,
                    fp,
                    job.get("apply_link", ""),
                    job.get("job_title"),
                    job.get("company") or job.get("sub_division_of_organization"),
                    job.get("location"),
                    job.get("compensation"),
                    json.dumps(job.get("key_skills") or []),
                    json.dumps(job),
                    source_url,
                    datetime.utcnow().isoformat(),
                ),
            )
            await db.commit()
        return pid

    async def list_postings(self, limit: int = 100) -> list[dict]:
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            rows = await db.execute_fetchall(
                """SELECT * FROM postings WHERE id NOT IN (
                    SELECT posting_id FROM feedback WHERE action = 'dismiss'
                ) ORDER BY created_at DESC LIMIT ?""", (limit,)
            )
        return [self._row_to_dict(r) for r in rows]

    async def get_postings(self, ids: list[str]) -> list[dict]:
        if not ids:
            return []
        placeholders = ",".join("?" for _ in ids)
        async with aiosqlite.connect(self.path) as db:
            db.row_factory = aiosqlite.Row
            rows = await db.execute_fetchall(
                f"SELECT * FROM postings WHERE id IN ({placeholders})", ids
            )
        return [self._row_to_dict(r) for r in rows]

    async def get_context_cache(self, key: str, now: float) -> Optional[dict]:
        async with aiosqlite.connect(self.path) as db:
            rows = await db.execute_fetchall(
                "SELECT payload, expires_at FROM context_cache WHERE cache_key = ? AND expires_at > ?",
                (key, now),
            )
        return {"payload": json.loads(rows[0][0]), "expires_at": rows[0][1]} if rows else None

    async def set_context_cache(self, key: str, payload: dict, expires_at: float) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                "INSERT INTO context_cache (cache_key, payload, expires_at) VALUES (?, ?, ?) "
                "ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload, expires_at=excluded.expires_at",
                (key, json.dumps(payload), expires_at),
            )
            await db.commit()

    async def record_feedback(self, posting_id: str, action: str) -> None:
        async with aiosqlite.connect(self.path) as db:
            await db.execute(
                "INSERT INTO feedback (posting_id, action, created_at) VALUES (?, ?, ?)",
                (posting_id, action, datetime.utcnow().isoformat()),
            )
            await db.commit()

    async def dismissed_ids(self) -> set[str]:
        async with aiosqlite.connect(self.path) as db:
            rows = await db.execute_fetchall(
                "SELECT DISTINCT posting_id FROM feedback WHERE action = 'dismiss'"
            )
        return {r[0] for r in rows}

    async def count(self) -> int:
        async with aiosqlite.connect(self.path) as db:
            row = await (await db.execute("SELECT COUNT(*) FROM postings")).fetchone()
        return row[0] if row else 0

    @staticmethod
    def _row_to_dict(r: Any) -> dict:
        d = dict(r)
        if d.get("key_skills"):
            d["key_skills"] = json.loads(d["key_skills"])
        raw = json.loads(d.pop("raw") or "{}")
        return {**raw, **d}


_db: Optional[Database] = None


def get_db() -> Database:
    global _db
    if _db is None:
        _db = Database(get_settings().sqlite_path)
    return _db
