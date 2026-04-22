"""
Service layer for scraping operations
"""
import json
import logging
from typing import List, Dict, Any, Optional
import requests
from openai import OpenAI

from ..config import get_settings
from ..exceptions import FirecrawlAPIError, OpenAIError, ExtractionError

# Configure logging
logger = logging.getLogger(__name__)


class ScraperService:
    """Service for scraping job listings using Firecrawl and OpenAI"""
    
    def __init__(self):
        self.settings = get_settings()
        self.firecrawl_api_key = self.settings.firecrawl_api_key
        self.openai_client = OpenAI(api_key=self.settings.openai_api_key)
        
        if not self.firecrawl_api_key:
            raise ValueError("FIRECRAWL_API_KEY not found in environment variables")
        if not self.openai_client.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
    
    def scrape_jobs_page(self, url: str, max_jobs: int = 30) -> List[str]:
        """
        Scrape the jobs page and extract apply links
        
        Args:
            url: URL of the jobs page
            max_jobs: Maximum number of jobs to extract
            
        Returns:
            List of apply links
        """
        try:
            logger.info(f"Starting to scrape jobs page: {url}")
            response = requests.post(
                f"{self.settings.firecrawl_api_url}/scrape",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.firecrawl_api_key}"
                },
                json={
                    "url": url,
                    "formats": ["markdown"]
                },
                timeout=self.settings.firecrawl_timeout
            )
            
            logger.info(f"Firecrawl response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Firecrawl API error: {response.status_code} - {response.text}")
                raise FirecrawlAPIError(response.status_code, response.text)
            
            result = response.json()
            if not result.get('success'):
                logger.error(f"Scraping failed: {result.get('message', 'Unknown error')}")
                raise ExtractionError(f"Scraping failed: {result.get('message', 'Unknown error')}")
            
            markdown_content = result['data']['markdown']
            logger.info(f"Successfully scraped page, markdown length: {len(markdown_content)}")
            
            # Extract apply links using OpenAI
            prompt = f"""
            Extract up to {max_jobs} job application links from the given markdown content.
            Return the result as a JSON object with a single key 'apply_links' containing an array of strings (the links).
            The output should be a valid JSON object, with no additional text.
            Do not include any JSON markdown formatting or code block indicators.
            Provide only the raw JSON object as the response.

            Example of the expected format:
            {{"apply_links": ["https://example.com/job1", "https://example.com/job2", ...]}}

            Markdown content:
            {markdown_content[:100000]}
            """
            
            completion = self.openai_client.chat.completions.create(
                model=self.settings.openai_model_extract,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            if not completion.choices:
                raise OpenAIError("No response from OpenAI")
            
            result = json.loads(completion.choices[0].message.content.strip())
            return result.get('apply_links', [])
            
        except requests.RequestException as e:
            raise ExtractionError(f"Network error while scraping: {str(e)}")
        except json.JSONDecodeError as e:
            raise ExtractionError(f"Error parsing response: {str(e)}")
        except (FirecrawlAPIError, OpenAIError, ExtractionError):
            raise
        except Exception as e:
            raise ExtractionError(f"Error scraping jobs page: {str(e)}")
    
    def extract_job_details(self, apply_link: str) -> Optional[Dict[str, Any]]:
        """
        Extract details from a single job posting
        
        Args:
            apply_link: URL of the job application page
            
        Returns:
            Dictionary with job details or None if extraction fails
        """
        try:
            response = requests.post(
                f"{self.settings.firecrawl_api_url}/scrape",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.firecrawl_api_key}"
                },
                json={
                    "url": apply_link,
                    "formats": ["extract"],
                    "actions": [{
                        "type": "click",
                        "selector": "#job-overview"
                    }],
                    "extract": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "job_title": {"type": "string"},
                                "sub_division_of_organization": {"type": "string"},
                                "key_skills": {"type": "array", "items": {"type": "string"}},
                                "compensation": {"type": "string"},
                                "location": {"type": "string"}
                            },
                            "required": ["job_title", "sub_division_of_organization", "key_skills", "compensation", "location"]
                        }
                    }
                },
                timeout=self.settings.firecrawl_timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    extracted_data = result['data']['extract']
                    # Use the original apply_link URL we scraped, not what Firecrawl extracts
                    extracted_data['apply_link'] = apply_link
                    return extracted_data
            
            return None
            
        except Exception:
            return None
    
    def extract_multiple_jobs(self, apply_links: List[str]) -> tuple[List[Dict[str, Any]], int]:
        """
        Extract details from multiple job postings
        
        Args:
            apply_links: List of job application URLs
            
        Returns:
            Tuple of (list of extracted jobs, count of failed extractions)
        """
        extracted_jobs = []
        failed_count = 0
        
        for link in apply_links:
            job_data = self.extract_job_details(link)
            if job_data:
                extracted_jobs.append(job_data)
            else:
                failed_count += 1
        
        return extracted_jobs, failed_count
    
    def match_jobs_with_resume(
        self, 
        resume: str, 
        jobs: List[Dict[str, Any]], 
        top_n: int = 3
    ) -> List[Dict[str, str]]:
        """
        Match jobs with resume using OpenAI's O1 model
        
        Args:
            resume: Resume text
            jobs: List of job listings
            top_n: Number of top matches to return
            
        Returns:
            List of recommended jobs
        """
        try:
            prompt = f"""
            Please analyze the resume and job listings, and return a JSON list of the top {top_n} roles that best fit the candidate's experience and skills. Include only the job title, compensation, and apply link for each recommended role. The output should be a valid JSON array of objects in the following format, with no additional text:

            [
              {{
                "job_title": "Job Title",
                "compensation": "Compensation (if available, otherwise empty string)",
                "apply_link": "Application URL"
              }},
              ...
            ]

            Based on the following resume:
            {resume}

            And the following job listings:
            {json.dumps(jobs, indent=2)}
            """
            
            completion = self.openai_client.chat.completions.create(
                model=self.settings.openai_model_match,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ]
            )
            
            recommended_jobs = json.loads(completion.choices[0].message.content.strip())
            return recommended_jobs
            
        except json.JSONDecodeError as e:
            raise OpenAIError(f"Error parsing OpenAI response: {str(e)}")
        except Exception as e:
            raise OpenAIError(f"Error matching jobs with resume: {str(e)}")

