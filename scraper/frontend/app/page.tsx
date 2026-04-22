"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  jobScraperAPI,
  type JobListing,
  type RecommendedJob,
  type ScrapeProgress,
} from "@/lib/api";
import {
  Briefcase,
  MapPin,
  DollarSign,
  ExternalLink,
  Loader2,
  Sparkles,
  CheckCircle2,
  Link2,
} from "lucide-react";

export default function Home() {
  const [jobsUrl, setJobsUrl] = useState("https://wellfound.com/jobs");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ScrapeProgress | null>(null);
  const [jobLinks, setJobLinks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    if (!jobsUrl.trim()) {
      setError("Please enter a jobs page URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(null);
    setJobLinks([]);

    try {
      await jobScraperAPI.fullScrape(
        "", // no resume needed
        jobsUrl,
        10, // max_jobs
        3, // top_n (not used)
        (progressUpdate) => {
          setProgress(progressUpdate);

          // Update job links when available
          if (progressUpdate.apply_links) {
            setJobLinks(progressUpdate.apply_links);
          }
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            AI Job Matcher
          </h1>
          <p className="text-muted-foreground">
            Find your perfect job match using AI-powered resume analysis
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Job Scraper</CardTitle>
            <CardDescription>
              Enter a careers page URL to scrape job listings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Jobs URL Input */}
            <div className="space-y-2">
              <label htmlFor="jobs-url" className="text-sm font-medium">
                Jobs Page URL
              </label>
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="jobs-url"
                  type="url"
                  placeholder="https://company.com/careers"
                  value={jobsUrl}
                  onChange={(e) => setJobsUrl(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Examples: wellfound.com/jobs, openai.com/careers, netflix.jobs
              </p>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              onClick={handleScrape}
              disabled={isLoading || !jobsUrl.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {progress?.message || "Scraping..."}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Scrape Jobs
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        {progress && (
          <Card className="mb-8 border-primary/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {progress.stage === "complete" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{progress.message}</p>
                  {progress.stats && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {progress.stats.total_links_found} job links found
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Links Section */}
        {jobLinks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Job Listings</h2>
              <Badge variant="secondary">
                {jobLinks.length} jobs found
              </Badge>
            </div>
            <div className="grid gap-3">
              {jobLinks.map((link, index) => {
                // Extract job title from URL (simple parsing)
                const jobTitle = link.split('/').pop()?.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ') || `Job ${index + 1}`;
                
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">
                            {jobTitle}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {link}
                          </p>
                        </div>
                        <Button asChild>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            View Job
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !progress && jobLinks.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Ready to scrape job listings?
              </h3>
              <p className="text-muted-foreground">
                Enter a careers page URL above to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
