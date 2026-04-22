"""
FastAPI application for Firecrawl Job Scraper
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .routes import scraper
from .config import get_settings

# Load environment variables
load_dotenv()

# Get settings
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    print(f"🚀 Starting {settings.api_title} v{settings.api_version}")
    yield
    # Shutdown
    print("👋 Shutting down gracefully")


app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scraper.router, prefix="/api", tags=["scraper"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": settings.api_title,
        "version": settings.api_version,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.api_version,
        "service": "firecrawl-scraper"
    }

