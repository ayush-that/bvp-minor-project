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
    openai_api_key: str
    
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
    
    # OpenAI Configuration
    openai_model_extract: str = "gpt-4o"
    openai_model_match: str = "gpt-5-mini"

    # Multi-provider agent keys
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    openrouter_api_key: str = ""

    # Per-agent model selection (one model per provider for variety)
    discovery_model: str = "gemini-2.5-flash"
    extraction_model: str = "gpt-4o-mini"
    critic_model: str = "claude-haiku-4-5-20251001"
    matching_model: str = "claude-sonnet-4-6"

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

