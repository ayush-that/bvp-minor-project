"""Expose the portal seed list to the frontend dropdown."""
from fastapi import APIRouter

from ..seeds import PORTAL_SEEDS

router = APIRouter()


@router.get("/seeds")
async def list_seeds():
    return {"seeds": PORTAL_SEEDS}
