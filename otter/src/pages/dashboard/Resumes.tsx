import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Loader2, Eye } from "lucide-react";
import { Helmet } from "react-helmet";
import { supabase } from "@/utils/supabase";
import { ResumeTemplate, UserProfile, UserResumeData } from "@/types";
import { compileTypstToPdf, revokeObjectUrl } from "@/services/typstCompiler";
import { generateTypstResume } from "@/services/geminiService";
import { PageHeader } from "@/components/ui/page-header";
import { MOCK_USER } from "@/utils/mockUser";

export function Resumes() {
  // Using mock user for development
  const user = MOCK_USER;
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ResumeTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // ATS checker moved to its own page: src/pages/dashboard/ATScore.tsx

  // fetch templates + user profile on mount
  useEffect(() => {
    fetchTemplates();
    fetchUserProfile();
  }, []);

  // cleanup preview url on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokeObjectUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const { data, error } = await supabase
        .from("resume_templates")
        .select("*")
        .eq("is_active", true)
        .order("usage_count", { ascending: false });

      if (error) {
        console.warn("Database unavailable, using fallback resume templates:", error);
        // Fallback templates when database is unavailable
        setTemplates([
          {
            id: "fallback-template-1",
            name: "Modern Professional",
            description: "Clean and modern resume template perfect for tech roles",
            typst_template: `// Basic template placeholder\n#set page(paper: "us-letter", margin: 1in)\n#set text(font: "Linux Libertine", size: 11pt)\n\n= {firstName} {lastName}\n#link("mailto:{email}")[{email}] | {phone}\n\n== Education\n{education}\n\n== Skills\n{skills}\n\n== Experience\n{experience_years} years of experience`,
            category: "modern",
            is_active: true,
            usage_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        setLoadingTemplates(false);
        return;
      }
      setTemplates(data || []);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load resume templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user?.id) return;

    try {
      // Load from localStorage
      const savedProfile = localStorage.getItem(`user-profile-${user.id}`);
      if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        setUserProfile(profileData || null);
      }
    } catch (err) {
      console.error("Error loading user profile from localStorage:", err);
    }
  };

  const handleGenerateResume = async (template: ResumeTemplate) => {
    setSelectedTemplate(template);
    setError(null);
    setIsGenerating(true);

    try {
      // prep user data - parse name & collect all profile info
      const nameParts = user.name?.split(" ") || [];
      const userData: UserResumeData = {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: userProfile?.phone || "",
        location: userProfile?.location || "",
        website: userProfile?.portfolio || "",
        linkedin: userProfile?.linkedin || "",
        github: userProfile?.github || "",
        summary: userProfile?.summary || "",
        education: userProfile?.education || "",
        skills: userProfile?.skills || [],
        experience_years: userProfile?.experience_years || 0,
        resume_text: userProfile?.resume_text || "",
        profile_score: userProfile?.profile_score,
      };

      console.log("==== RESUME GENERATION STARTED ====");
      console.log("Template:", template.name);
      console.log("Template content length:", template.typst_template.length);
      console.log("User data:", JSON.stringify(userData, null, 2));

      // gen typst via gemini
      console.log("Calling Gemini to generate Typst code...");
      const typstSource = await generateTypstResume(
        template.typst_template,
        userData
      );

      console.log("✅ Typst generation complete, length:", typstSource.length);

      // compile to pdf
      setIsCompiling(true);
      console.log("Starting PDF compilation...");
      const { url } = await compileTypstToPdf(typstSource);

      // cleanup old preview
      if (previewUrl) {
        revokeObjectUrl(previewUrl);
      }

      setPreviewUrl(url);
      console.log("✅ Resume generation complete!");

      // incr usage count in localStorage
      const key = `resume-template-usage-${template.id}`;
      const current = parseInt(localStorage.getItem(key) || "0", 10);
      localStorage.setItem(key, (current + 1).toString());
      console.log(`Resume template ${template.name} usage count: ${current + 1}`);
    } catch (err) {
      console.error("❌ RESUME GENERATION FAILED:", err);

      // provide more helpful error msgs
      let errorMsg = "Failed to generate resume. Please try again.";
      if (err instanceof Error) {
        if (err.message.includes("unknown variable")) {
          errorMsg =
            "Template compilation error. The template may have undefined variables. Please try a different template or contact support.";
        } else if (err.message.includes("failed to load file")) {
          errorMsg =
            "Template uses unsupported features (custom fonts/imports). Please try a different template.";
        } else {
          errorMsg = err.message;
        }
      }

      setError(errorMsg);
    } finally {
      setIsGenerating(false);
      setIsCompiling(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;

    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `resume_${new Date().getTime()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ATS checker moved to its own page: src/pages/dashboard/ATScore.tsx

  return (
    <div>
      <Helmet>
        <title>Pathfinder | AI Resume Builder</title>
        <meta
          name="description"
          content="Generate professional resumes instantly with AI-powered templates. Create stunning resumes in seconds."
        />
      </Helmet>

      <PageHeader
        title="AI Resume Builder"
        description="Generate professional resumes instantly with AI-powered templates"
        icon={Sparkles}
      />

      {/* Resume Builder Section */}
      <>
        {/* Templates Grid */}
          {loadingTemplates ? (
            <div className="flex justify-start py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-left py-8 text-muted-foreground">
              <p>No templates available yet.</p>
              <p className="text-xs mt-2">
                Contact admin to add resume templates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[templates[0]].map((template) => (
                <Card
                  key={template.id}
                  className={`h-full group transition-shadow cursor-pointer ${
                    selectedTemplate?.id === template.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() =>
                    !isGenerating && handleGenerateResume(template)
                  }>
                  <CardContent className="pt-1 space-y-3 h-full flex flex-col">
                    {template.preview_image_url && (
                      <div className="aspect-[8.5/11] bg-foreground/5 rounded-md overflow-hidden">
                        <img
                          src={template.preview_image_url}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between flex-row w-full mb-2">
                        <h3 className="font-semibold text-sm">
                          {template.name}
                        </h3>
                        <span className="text-[10px] bg-foreground/10 text-foreground/70 px-2 py-0.5 rounded">
                          {template.category}
                        </span>
                      </div>
                      {template.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-auto"
                      disabled={isGenerating}>
                      {isGenerating && selectedTemplate?.id === template.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Loading States */}
          {isGenerating && (
            <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isCompiling
                      ? "Compiling PDF..."
                      : "Generating resume with AI..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This may take a few moments
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview & Download */}
          {previewUrl && !isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Eye className="h-5 w-5" /> Preview
                </h3>
                <Button onClick={handleDownload} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden bg-foreground/5">
                <iframe
                  src={previewUrl}
                  className="w-full h-[60vh] min-h-[360px]"
                  title="Resume Preview"
                />
              </div>
          </div>
        )}
      </>
    </div>
  );
}
