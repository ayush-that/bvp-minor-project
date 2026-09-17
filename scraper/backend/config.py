"""
Configuration management for the application
"""
import os
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""
    
    # API Keys
    firecrawl_api_key: str
    openai_api_key: str = ""
    
    # API Configuration
    api_title: str = "Firecrawl Job Scraper API"
    api_description: str = "API for scraping job listings and matching them with resumes"
    api_version: str = "1.0.0"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # CORS Configuration
    cors_origins: list[str] = ["*"]
    
    # Firecrawl Configuration
    firecrawl_api_url: str = "https://api.firecrawl.dev/v1"
    firecrawl_timeout: int = 60
    
    # Legacy model IDs used by scraper_service.py. Valid OpenRouter slugs.
    openai_model_extract: str = "google/gemini-2.5-flash-lite"
    openai_model_match: str = "google/gemini-2.5-flash"

    # Multi-provider agent keys (retained for compatibility; unused now that all
    # traffic is routed through OpenRouter).
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    openrouter_api_key: str = ""

    # OpenRouter endpoint (OpenAI-compatible)
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Per-agent model selection — Google Gemini Flash models via OpenRouter (fast, cheap, top results)
    discovery_model: str = "google/gemini-2.5-flash-lite"
    extraction_model: str = "google/gemini-2.5-flash-lite"
    critic_model: str = "google/gemini-2.5-flash-lite"
    matching_model: str = "google/gemini-2.5-flash"

    # SQLite
    sqlite_path: str = "./pathfinder.db"

    # Parallel fan-out
    extraction_concurrency: int = 8

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

