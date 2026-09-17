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
    openai_model_extract: str = "deepseek/deepseek-chat"
    openai_model_match: str = "deepseek/deepseek-chat"

    # Multi-provider agent keys (retained for compatibility; unused now that all
    # traffic is routed through OpenRouter).
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    openrouter_api_key: str = ""

    # OpenRouter endpoint (OpenAI-compatible)
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Per-agent model selection — DeepSeek & Gemini 3.8 Flash frontier models
    discovery_model: str = "deepseek/deepseek-chat"
    extraction_model: str = "deepseek/deepseek-chat"
    critic_model: str = "deepseek/deepseek-chat"
    matching_model: str = "deepseek/deepseek-chat"

    # SQLite
    sqlite_path: str = "./pathfinder.db"

    # Parallel fan-out
    extraction_concurrency: int = 8

    model_config = SettingsConfigDict(
        env_file=("backend/.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

