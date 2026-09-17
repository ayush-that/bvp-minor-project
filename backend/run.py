#!/usr/bin/env python3
"""
Simple script to run the FastAPI server with settings loaded from .env
"""
import uvicorn
from backend.config import get_settings

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info"
    )

