import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Upload,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Helmet } from "react-helmet";
import { scoreResumeATS } from "@/services/geminiService";
import { PageHeader } from "@/components/ui/page-header";

export default function ATScore() {
  const [atsFile, setAtsFile] = useState<File | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [atsScores, setAtsScores] = useState<{
    keywordRelevance: number;
    formatting: number;
    clarity: number;
    experience: number;
    skills: number;
    totalScore: number;
    feedback: {
      keywordRelevance: string;
      formatting: string;
      clarity: string;
      experience: string;
      skills: string;
    };
  } | null>(null);
  const [atsError, setAtsError] = useState<string | null>(null);

  const handleAtsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["application/pdf", "text/plain"]; // validate file type
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      if (!validTypes.includes(file.type) && !isPdf) {
        setAtsError("Please upload a PDF or TXT file");
        return;
      }
      setAtsFile(file);
      setAtsError(null);
      setAtsScores(null); // reset prev scores
    }
  };

  const handleScoreResume = async () => {
    if (!atsFile) return;
    setIsScoring(true);
    setAtsError(null);
    try {
      const scores = await scoreResumeATS(atsFile);
      setAtsScores(scores);
    } catch (err) {
      setAtsError(
        err instanceof Error
          ? err.message
          : "Failed to score resume. Please try again."
      );
    } finally {
      setIsScoring(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Pathfinder | ATS Score Checker</title>
        <meta
          name="description"
          content="Upload your resume to get an AI-powered ATS (Applicant Tracking System) score and detailed feedback on how to improve it for better job matches."
        />
      </Helmet>

      <PageHeader
        title="ATS Score Checker"
        description="Upload your resume to get an AI-powered ATS score and personalized feedback to improve your chances."
        icon={CheckCircle2}
      />

      <Card className="border-primary/20">
        <CardContent className="pt-6 space-y-6">
            {/* File Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label htmlFor="ats-upload" className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {atsFile
                            ? atsFile.name
                            : "Click to upload your resume"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF or TXT files supported
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    id="ats-upload"
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleAtsFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {atsFile && (
                <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-primary/10 rounded-md">
                  <div className="flex items-center gap-2 w-full sm:flex-1">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium truncate">
                      {atsFile.name}
                    </span>
                  </div>
                  <Button
                    onClick={handleScoreResume}
                    disabled={isScoring}
                    size="sm"
                    className="w-full sm:w-auto">
                    {isScoring ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Score Resume
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Error Display */}
            {atsError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-sm text-destructive">{atsError}</p>
              </div>
            )}

            {/* Loading State */}
            {isScoring && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Analyzing your resume with AI...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This may take a few moments
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Scores Display */}
            {atsScores && !isScoring && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="text-center p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border-2 border-primary/30">
                  <p className="text-sm text-muted-foreground font-medium mb-2">
                    Overall ATS Score
                  </p>
                  <p className="text-5xl font-bold text-primary">
                    {atsScores.totalScore}
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {atsScores.totalScore >= 80
                      ? "Excellent! Your resume is highly optimized"
                      : atsScores.totalScore >= 60
                      ? "Good! Some improvements recommended"
                      : "Needs work. Focus on the areas below"}
                  </p>
                </div>

                {/* Individual Scores */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Score Breakdown</h3>

                  {/* Sections are responsive and wrap nicely on mobile */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Keyword Relevance</span>
                      <span className="text-sm font-bold text-primary">
                        {atsScores.keywordRelevance}/20
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{
                          width: `${(atsScores.keywordRelevance / 20) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {atsScores.feedback.keywordRelevance}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Formatting</span>
                      <span className="text-sm font-bold text-primary">
                        {atsScores.formatting}/20
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{
                          width: `${(atsScores.formatting / 20) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {atsScores.feedback.formatting}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Clarity</span>
                      <span className="text-sm font-bold text-primary">
                        {atsScores.clarity}/20
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${(atsScores.clarity / 20) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {atsScores.feedback.clarity}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Experience</span>
                      <span className="text-sm font-bold text-primary">
                        {atsScores.experience}/20
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{
                          width: `${(atsScores.experience / 20) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {atsScores.feedback.experience}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Skills</span>
                      <span className="text-sm font-bold text-primary">
                        {atsScores.skills}/20
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${(atsScores.skills / 20) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {atsScores.feedback.skills}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
