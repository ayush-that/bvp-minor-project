"""
Pydantic models for request/response validation
"""
from typing import List, Optional
from pydantic import BaseModel, HttpUrl, Field


class JobListing(BaseModel):
    """Model for a single job listing"""
    job_title: str
    sub_division_of_organization: str
    key_skills: List[str]
    compensation: str
    location: str
    apply_link: str


class RecommendedJob(BaseModel):
    """Model for a recommended job"""
    job_title: str
    compensation: str
    apply_link: str


class ScrapeJobsRequest(BaseModel):
    """Request model for scraping jobs"""
    jobs_page_url: HttpUrl = Field(
        default="https://openai.com/careers/search",
        description="URL of the jobs page to scrape"
    )
    max_jobs: int = Field(
        default=3,
        ge=1,
        le=50,
        description="Maximum number of jobs to scrape (1-50)"
    )


class ScrapeJobsResponse(BaseModel):
    """Response model for scraping jobs"""
    success: bool
    message: str
    apply_links: List[str]
    job_count: int


class ExtractJobDetailsRequest(BaseModel):
    """Request model for extracting job details"""
    apply_links: List[HttpUrl]


class ExtractJobDetailsResponse(BaseModel):
    """Response model for extracting job details"""
    success: bool
    message: str
    jobs: List[JobListing]
    extracted_count: int
    failed_count: int


class MatchJobsRequest(BaseModel):
    """Request model for matching jobs with resume"""
    resume: str = Field(..., min_length=100, description="Resume text")
    jobs: List[JobListing]
    top_n: int = Field(default=3, ge=1, le=10, description="Number of top matches to return")


class MatchJobsResponse(BaseModel):
    """Response model for matching jobs"""
    success: bool
    message: str
    recommended_jobs: List[RecommendedJob]


class FullScrapeRequest(BaseModel):
    """Request model for full scraping pipeline"""
    jobs_page_url: HttpUrl = Field(
        default="https://openai.com/careers/search",
        description="URL of the jobs page to scrape"
    )
    resume: str = Field(..., min_length=100, description="Resume text")
    max_jobs: int = Field(
        default=3,
        ge=1,
        le=50,
        description="Maximum number of jobs to scrape (1-50)"
    )
    top_n: int = Field(default=3, ge=1, le=10, description="Number of top matches to return")


class FullScrapeResponse(BaseModel):
    """Response model for full scraping pipeline"""
    success: bool
    message: str
    apply_links: List[str]
    extracted_jobs: List[JobListing]
    recommended_jobs: List[RecommendedJob]
    stats: dict

