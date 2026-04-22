# Firecrawl Job Scraper API

A FastAPI-based backend service for scraping job listings using Firecrawl and matching them with resumes using OpenAI's GPT models.

## Features

- 🔍 **Scrape Job Listings** - Extract job application links from any careers page
- 📊 **Extract Job Details** - Get structured data from individual job postings
- 🤖 **AI-Powered Matching** - Match jobs with resumes using OpenAI's O1 model
- 🚀 **Full Pipeline** - Complete end-to-end scraping and matching in one API call
- 📝 **Type-Safe** - Built with Pydantic for robust data validation
- 🌐 **CORS Enabled** - Ready for frontend integration

## Tech Stack

- **FastAPI** - Modern, fast web framework
- **Firecrawl** - Web scraping and data extraction
- **OpenAI** - GPT-4 and O1 models for intelligent processing
- **Pydantic** - Data validation and serialization
- **Python 3.12** - Latest Python features

## Setup

### Prerequisites

- Python 3.12
- Firecrawl API key
- OpenAI API key

### Installation

1. Clone the repository and navigate to the project directory:

```bash
cd firecrawl-scraper
```

2. Create a virtual environment:

```bash
python3.12 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
# or with uv
uv pip install -r requirements.txt
```

4. Create a `.env` file in the root directory:

```env
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## Running the Server

### Development Mode

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:

- API: `http://localhost:8000`
- Interactive Docs: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

## API Endpoints

### 1. Health Check

**GET** `/health`

Check if the API is running.

**Response:**

```json
{
  "status": "healthy"
}
```

### 2. Scrape Jobs Page

**POST** `/api/scrape-jobs`

Extract job application links from a careers page.

**Request Body:**

```json
{
  "jobs_page_url": "https://openai.com/careers/search",
  "max_jobs": 30
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully extracted 30 apply links",
  "apply_links": ["https://...", "https://..."],
  "job_count": 30
}
```

### 3. Extract Job Details

**POST** `/api/extract-job-details`

Extract detailed information from job application pages.

**Request Body:**

```json
{
  "apply_links": [
    "https://jobs.ashbyhq.com/openai/...",
    "https://jobs.ashbyhq.com/openai/..."
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully extracted 28 jobs, 2 failed",
  "jobs": [
    {
      "job_title": "Software Engineer",
      "sub_division_of_organization": "Engineering",
      "key_skills": ["Python", "FastAPI", "React"],
      "compensation": "$150k - $200k",
      "location": "San Francisco, CA",
      "apply_link": "https://..."
    }
  ],
  "extracted_count": 28,
  "failed_count": 2
}
```

### 4. Match Jobs with Resume

**POST** `/api/match-jobs`

Match job listings with a resume using AI.

**Request Body:**

```json
{
  "resume": "Your resume text here...",
  "jobs": [
    {
      "job_title": "Software Engineer",
      "sub_division_of_organization": "Engineering",
      "key_skills": ["Python", "FastAPI"],
      "compensation": "$150k - $200k",
      "location": "San Francisco, CA",
      "apply_link": "https://..."
    }
  ],
  "top_n": 3
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully matched 3 jobs",
  "recommended_jobs": [
    {
      "job_title": "Software Engineer",
      "compensation": "$150k - $200k",
      "apply_link": "https://..."
    }
  ]
}
```

### 5. Full Scraping Pipeline

**POST** `/api/full-scrape`

Complete pipeline: scrape jobs, extract details, and match with resume.

**Request Body:**

```json
{
  "jobs_page_url": "https://openai.com/careers/search",
  "resume": "Your resume text here...",
  "max_jobs": 30,
  "top_n": 3
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully completed full scraping pipeline",
  "apply_links": ["https://...", "https://..."],
  "extracted_jobs": [...],
  "recommended_jobs": [...],
  "stats": {
    "total_links_found": 30,
    "jobs_extracted": 28,
    "extraction_failed": 2,
    "recommendations": 3
  }
}
```

## Project Structure

```
firecrawl-scraper/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── models.py            # Pydantic models
│   ├── routes/
│   │   ├── __init__.py
│   │   └── scraper.py       # API endpoints
│   └── services/
│       ├── __init__.py
│       └── scraper_service.py  # Business logic
├── scraper.py               # Original standalone script
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (create this)
└── README.md
```

## Usage Examples

### Using cURL

```bash
# Full scraping pipeline
curl -X POST "http://localhost:8000/api/full-scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "jobs_page_url": "https://openai.com/careers/search",
    "resume": "Your resume text...",
    "max_jobs": 30,
    "top_n": 3
  }'
```

### Using Python

```python
import requests

response = requests.post(
    "http://localhost:8000/api/full-scrape",
    json={
        "jobs_page_url": "https://openai.com/careers/search",
        "resume": "Your resume text...",
        "max_jobs": 30,
        "top_n": 3
    }
)

result = response.json()
print(result["recommended_jobs"])
```

### Using JavaScript/TypeScript

```typescript
const response = await fetch("http://localhost:8000/api/full-scrape", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jobs_page_url: "https://openai.com/careers/search",
    resume: "Your resume text...",
    max_jobs: 30,
    top_n: 3,
  }),
});

const result = await response.json();
console.log(result.recommended_jobs);
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `404` - Resource not found
- `422` - Validation error
- `500` - Server error

Error response format:

```json
{
  "detail": "Error message here"
}
```

## Environment Variables

| Variable            | Description            | Required |
| ------------------- | ---------------------- | -------- |
| `FIRECRAWL_API_KEY` | Your Firecrawl API key | Yes      |
| `OPENAI_API_KEY`    | Your OpenAI API key    | Yes      |

## Rate Limits & Costs

Be aware of:

- **Firecrawl API** rate limits and costs per scrape
- **OpenAI API** token usage and costs (especially for O1 model)
- Consider implementing caching for frequently scraped pages

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black backend/
ruff backend/
```

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
