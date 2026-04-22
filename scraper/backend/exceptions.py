"""
Custom exceptions for the application
"""


class FirecrawlError(Exception):
    """Base exception for Firecrawl-related errors"""
    pass


class FirecrawlAPIError(FirecrawlError):
    """Exception raised when Firecrawl API returns an error"""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"Firecrawl API error {status_code}: {message}")


class OpenAIError(Exception):
    """Base exception for OpenAI-related errors"""
    pass


class ExtractionError(Exception):
    """Exception raised when job extraction fails"""
    pass


class ValidationError(Exception):
    """Exception raised when validation fails"""
    pass

