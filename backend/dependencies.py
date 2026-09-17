"""
Dependency injection for FastAPI routes
"""
from functools import lru_cache
from .services.scraper_service import ScraperService


@lru_cache()
def get_scraper_service() -> ScraperService:
    """
    Get cached scraper service instance
    This ensures we reuse the same service instance across requests
    """
    return ScraperService()

