import { Helmet } from "react-helmet";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Upload, FileText } from "lucide-react";

export default function PublicATS() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Pathfinder | ATS Score Checker</title>
        <meta
          name="description"
          content="Preview ATS scoring. Sign in to upload your resume and get detailed feedback."
        />
        <meta property="og:title" content="Pathfinder | ATS Score Checker" />
        <meta
          property="og:description"
          content="Preview ATS scoring. Sign in to upload your resume and get detailed feedback."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/ats`} />
        <meta
          property="og:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pathfinder | ATS Score Checker" />
        <meta
          name="twitter:description"
          content="Preview ATS scoring. Sign in to upload your resume and get detailed feedback."
        />
        <meta
          name="twitter:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <link rel="canonical" href={`${window.location.origin}/ats`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${window.location.origin}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "ATS",
                item: `${window.location.origin}/ats`,
              },
            ],
          })}
        </script>
      </Helmet>

      <PageHeader
        title="ATS Score Checker"
        description="Upload your resume to get an AI-powered ATS score and personalized feedback — sign in to try it"
        icon={CheckCircle2}
      />

      <Card className="rounded-none border border-foreground/10">
        <CardContent className="pt-6 space-y-6">
          {/* Disabled upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <div className="border-2 border-dashed rounded-lg p-6 opacity-60">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        Sign in to upload your resume
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF or TXT files supported
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2 p-3 bg-foreground/5 rounded-md">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium flex-1 text-muted-foreground">
                example_resume.pdf
              </span>
              <Button disabled size="sm">
                Login to Score
              </Button>
            </div>
          </div>

          {/* Placeholder scores */}
          <div className="space-y-6">
            <div className="text-center p-6 bg-gradient-to-br from-primary/15 to-primary/0 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground font-medium mb-2">
                Overall ATS Score
              </p>
              <p className="text-5xl font-bold text-primary">
                78<span className="text-2xl text-muted-foreground">/100</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Good! Some improvements recommended
              </p>
            </div>

            <div className="space-y-4">
              {[
                { label: "Keyword Relevance", score: 16, total: 20 },
                { label: "Formatting", score: 15, total: 20 },
                { label: "Clarity", score: 15, total: 20 },
                { label: "Experience", score: 16, total: 20 },
                { label: "Skills", score: 16, total: 20 },
              ].map((s) => (
                <div className="space-y-2" key={s.label}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-sm font-bold text-primary">
                      {s.score}/{s.total}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${(s.score / s.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sign in to get personalized feedback for your resume
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-foreground/10 bg-foreground/5 px-4 py-3">
          <p className="text-sm text-foreground/80">
            Score your resume and get tailored recommendations
          </p>
          <a href="/sign-in?auto=1&redirectTo=%2Fapp" className="inline-flex">
            <Button size="sm">Sign in to Score</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
