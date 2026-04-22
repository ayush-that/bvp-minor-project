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
            await db.execute(
                """
                INSERT INTO postings (id, fingerprint, apply_link, job_title, company, location, compensation, key_skills, raw, source_url, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(fingerprint) DO NOTHING
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
                "SELECT * FROM postings ORDER BY created_at DESC LIMIT ?", (limit,)
            )
        return [self._row_to_dict(r) for r in rows]

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
        if d.get("raw"):
            d["raw"] = json.loads(d["raw"])
        return d


_db: Optional[Database] = None


def get_db() -> Database:
    global _db
    if _db is None:
        _db = Database(get_settings().sqlite_path)
    return _db
