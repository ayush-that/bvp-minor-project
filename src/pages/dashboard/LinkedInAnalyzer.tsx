import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, Loader2, Sparkles, FileText } from "lucide-react";
import { Helmet } from "react-helmet";
import { useAuthStore } from "@/contexts/useAuthStore";
import { analyzeLinkedInProfile } from "@/services/geminiService";
import { PageHeader } from "@/components/ui/page-header";

export default function LinkedInAnalyzer() {
  const { user } = useAuthStore();
  const [profileInput, setProfileInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    profileCompleteness: number;
    headline: number;
    summary: number;
    experience: number;
    skills: number;
    engagement: number;
    totalScore: number;
    advice: {
      profileCompleteness: string;
      headline: string;
      summary: string;
      experience: string;
      skills: string;
      engagement: string;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!profileInput.trim()) {
      setError("Please paste your LinkedIn profile content");
      return;
    }

    // warn if user just pasted a url instead of content
    const isJustUrl =
      profileInput.trim().match(/^https?:\/\/[^\s]+$/i) ||
      profileInput.trim().match(/^linkedin\.com\/in\/[^\s]+$/i) ||
      profileInput.trim().length < 100; // too short to be real profile

    if (isJustUrl) {
      setError(
        "⚠️ It looks like you only entered a URL. Please copy and paste the FULL TEXT content from your LinkedIn profile (headline, about, experience, skills, etc.)"
      );
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeLinkedInProfile(profileInput);
      setAnalysisResult(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze profile. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // get score color based on val
  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 75) return "text-green-500";
    if (percentage >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div>
      <Helmet>
        <title>Pathfinder | LinkedIn Profile Analyzer</title>
        <meta
          name="description"
          content="Get AI-powered analysis of your LinkedIn profile with personalized advice and ratings to boost your professional presence."
        />
      </Helmet>

      <PageHeader
        title="LinkedIn Profile Analyzer"
        description="Enter your LinkedIn URL or paste your profile info to get AI-powered ratings and actionable advice."
        icon={Linkedin}
      />

      {user && (
        <Card className="border-primary/20">
          <CardContent className="pt-6 space-y-6">
            {/* input section */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="linkedin-input"
                  className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Paste Your LinkedIn Profile Content
                </label>
                <div className="space-y-2">
                  <textarea
                    id="linkedin-input"
                    placeholder="Paste your entire LinkedIn profile text here...
Example:
Software Engineer | Full-Stack Developer | React, Node.js
About:
Passionate software engineer with 5+ years of experience...
Experience:
Senior Developer at Tech Company
- Led team of 5 developers
- Increased performance by 40%
..."
                    value={profileInput}
                    onChange={(e) => setProfileInput(e.target.value)}
                    className="w-full min-h-[200px] p-3 border rounded-md bg-background text-foreground resize-y"
                    disabled={isAnalyzing}
                  />
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !profileInput.trim()}
                    className="w-full sm:w-auto"
                    size="default">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze Profile
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                    📋 How to use:
                  </p>
                  <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-4 list-decimal">
                    <li>Go to your LinkedIn profile page</li>
                    <li>
                      Copy ALL text (headline, about, experience, skills, etc.)
                    </li>
                    <li>Paste it here for AI analysis</li>
                  </ol>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    ⚠️ Note: Entering just a URL won't work - you must paste the
                    actual profile content
                  </p>
                </div>
              </div>
            </div>

            {/* err display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* loading state */}
            {isAnalyzing && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Analyzing your LinkedIn profile with AI...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This may take a few moments
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* results display */}
            {analysisResult && !isAnalyzing && (
              <div className="space-y-6">
                {/* overall score */}
                <div className="text-center p-6 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-lg border-2 border-blue-500/30">
                  <p className="text-sm text-muted-foreground font-medium mb-2">
                    Overall LinkedIn Profile Score
                  </p>
                  <p
                    className={`text-5xl font-bold ${getScoreColor(
                      analysisResult.totalScore,
                      120
                    )}`}>
                    {analysisResult.totalScore}
                    <span className="text-2xl text-muted-foreground">/120</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {analysisResult.totalScore >= 90
                      ? "Exceptional! Your profile stands out"
                      : analysisResult.totalScore >= 70
                      ? "Good! Some key improvements will help"
                      : analysisResult.totalScore >= 50
                      ? "Average. Focus on areas below"
                      : "Needs significant work. Start with basics"}
                  </p>
                </div>

                {/* individual scores */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Score Breakdown</h3>

                  {/* profile completeness */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Profile Completeness</span>
                      <span
                        className={`text-sm font-bold ${getScoreColor(
                          analysisResult.profileCompleteness,
                          20
                        )}`}>
                        {analysisResult.profileCompleteness}/20
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2 transition-all"
                        style={{
                          width: `${
                            (analysisResult.profileCompleteness / 20) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.advice.profileCompleteness}
                    </p>
                  </div>

                  {/* headline */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Headline</span>
                      <span
                        className={`text-sm font-bold ${getScoreColor(
                          analysisResult.headline,
                          20
                        )}`}>
                        {analysisResult.headline}/20
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2 transition-all"
                        style={{
                          width: `${(analysisResult.headline / 20) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.advice.headline}
                    </p>
                  </div>

                  {/* summary/about */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Summary/About</span>
                      <span
                        className={`text-sm font-bold ${getScoreColor(
                          analysisResult.summary,
                          20
                        )}`}>
                        {analysisResult.summary}/20
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2 transition-all"
                        style={{
                          width: `${(analysisResult.summary / 20) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.advice.summary}
                    </p>
                  </div>

                  {/* experience */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Experience</span>
                      <span
                        className={`text-sm font-bold ${getScoreColor(
                          analysisResult.experience,
                          20
                        )}`}>
                        {analysisResult.experience}/20
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2 transition-all"
                        style={{
                          width: `${(analysisResult.experience / 20) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.advice.experience}
                    </p>
                  </div>

                  {/* skills */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Skills & Endorsements</span>
                      <span
                        className={`text-sm font-bold ${getScoreColor(
                          analysisResult.skills,
                          20
                        )}`}>
                        {analysisResult.skills}/20
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2 transition-all"
                        style={{
                          width: `${(analysisResult.skills / 20) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.advice.skills}
                    </p>
                  </div>

                  {/* engagement */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Engagement & Network</span>
                      <span
                        className={`text-sm font-bold ${getScoreColor(
                          analysisResult.engagement,
                          20
                        )}`}>
                        {analysisResult.engagement}/20
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2 transition-all"
                        style={{
                          width: `${(analysisResult.engagement / 20) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.advice.engagement}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-center space-y-3">
            <Linkedin className="h-12 w-12 mx-auto text-blue-500" />
            <h3 className="text-xl font-semibold">
              Sign in to use LinkedIn Analyzer
            </h3>
            <p className="text-sm text-muted-foreground">
              Get AI-powered ratings and personalized advice to optimize your
              LinkedIn profile.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
