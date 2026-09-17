"""
API routes for scraper operations
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from ..models import (
    ScrapeJobsRequest,
    ScrapeJobsResponse,
    ExtractJobDetailsRequest,
    ExtractJobDetailsResponse,
    MatchJobsRequest,
    MatchJobsResponse,
    FullScrapeRequest,
    FullScrapeResponse,
    JobListing,
)
from ..services import ScraperService
from ..dependencies import get_scraper_service
from ..exceptions import FirecrawlAPIError, OpenAIError, ExtractionError

router = APIRouter()


@router.post("/scrape-jobs", response_model=ScrapeJobsResponse)
async def scrape_jobs(
    request: ScrapeJobsRequest,
    service: ScraperService = Depends(get_scraper_service)
):
    """
    Scrape a jobs page and extract apply links
    """
    try:
        apply_links = service.scrape_jobs_page(
            url=str(request.jobs_page_url),
            max_jobs=request.max_jobs
        )
        
        return ScrapeJobsResponse(
            success=True,
            message=f"Successfully extracted {len(apply_links)} apply links",
            apply_links=apply_links,
            job_count=len(apply_links)
        )
    except FirecrawlAPIError as e:
        raise HTTPException(status_code=502, detail=f"Firecrawl API error: {e.message}")
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {str(e)}")
    except ExtractionError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/extract-job-details", response_model=ExtractJobDetailsResponse)
async def extract_job_details(
    request: ExtractJobDetailsRequest,
    service: ScraperService = Depends(get_scraper_service)
):
    """
    Extract detailed information from job application pages
    """
    try:
        apply_links = [str(link) for link in request.apply_links]
        
        extracted_jobs, failed_count = service.extract_multiple_jobs(apply_links)
        
        return ExtractJobDetailsResponse(
            success=True,
            message=f"Successfully extracted {len(extracted_jobs)} jobs, {failed_count} failed",
            jobs=[JobListing(**job) for job in extracted_jobs],
            extracted_count=len(extracted_jobs),
            failed_count=failed_count
        )
    except FirecrawlAPIError as e:
        raise HTTPException(status_code=502, detail=f"Firecrawl API error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/match-jobs", response_model=MatchJobsResponse)
async def match_jobs(
    request: MatchJobsRequest,
    service: ScraperService = Depends(get_scraper_service)
):
    """
    Match jobs with a resume using AI
    """
    try:
        # Convert Pydantic models to dicts
        jobs_data = [job.model_dump() for job in request.jobs]
        
        recommended_jobs = service.match_jobs_with_resume(
            resume=request.resume,
            jobs=jobs_data,
            top_n=request.top_n
        )
        
        return MatchJobsResponse(
            success=True,
            message=f"Successfully matched {len(recommended_jobs)} jobs",
            recommended_jobs=recommended_jobs
        )
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/full-scrape", response_model=FullScrapeResponse)
async def full_scrape(
    request: FullScrapeRequest,
    service: ScraperService = Depends(get_scraper_service)
):
    """
    Complete pipeline: scrape jobs, extract details, and match with resume
    """
    try:
        # Step 1: Scrape jobs page for apply links
        apply_links = service.scrape_jobs_page(
            url=str(request.jobs_page_url),
            max_jobs=request.max_jobs
        )
        
        if not apply_links:
            raise HTTPException(status_code=404, detail="No job links found")
        
        # Step 2: Extract job details
        extracted_jobs, failed_count = service.extract_multiple_jobs(apply_links)
        
        if not extracted_jobs:
            raise HTTPException(status_code=404, detail="No job details could be extracted")
        
        # Step 3: Match jobs with resume
        recommended_jobs = service.match_jobs_with_resume(
            resume=request.resume,
            jobs=extracted_jobs,
            top_n=request.top_n
        )
        
        return FullScrapeResponse(
            success=True,
            message="Successfully completed full scraping pipeline",
            apply_links=apply_links,
            extracted_jobs=[JobListing(**job) for job in extracted_jobs],
            recommended_jobs=recommended_jobs,
            stats={
                "total_links_found": len(apply_links),
                "jobs_extracted": len(extracted_jobs),
                "extraction_failed": failed_count,
                "recommendations": len(recommended_jobs)
            }
        )
    except HTTPException:
        raise
    except FirecrawlAPIError as e:
        raise HTTPException(status_code=502, detail=f"Firecrawl API error: {e.message}")
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {str(e)}")
    except ExtractionError as e:
        raise HTTPException(status_code=500, detail=f"Extraction error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

