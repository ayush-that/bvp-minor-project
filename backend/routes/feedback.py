"""Capture explicit candidate feedback (save/apply/dismiss) against postings."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..storage import get_db

router = APIRouter()

ALLOWED = {"view", "save", "apply", "dismiss"}


class FeedbackBody(BaseModel):
    action: str


@router.post("/feedback/{posting_id}")
async def record(posting_id: str, body: FeedbackBody):
    if body.action not in ALLOWED:
        raise HTTPException(400, f"action must be one of {ALLOWED}")
    await get_db().record_feedback(posting_id, body.action)
    return {"ok": True}
