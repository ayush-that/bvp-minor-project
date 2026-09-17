import { useState, useEffect } from "react";
import {
  Upload,
  Wand2,
  Mail,
  FileText,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/utils/supabase";
import { EmailTemplate, UserProfile, StartupEmployee } from "@/types";
import { Link } from "react-router-dom";
import { MOCK_USER } from "@/utils/mockUser";
import { openrouterChat, openrouterChatWithPDF } from "@/services/openrouter";

interface EmailTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: StartupEmployee; // preserved for single-send mode
  startupName: string;
  startupDescription: string;
  // Optional bulk mode: if provided, treat as send-to-all context
  bulkEmployees?: StartupEmployee[];
}

export function EmailTemplateModal({
  open,
  onOpenChange,
  employee,
  startupName,
  startupDescription,
  bulkEmployees,
}: EmailTemplateModalProps) {
  // Using mock user for development
  const user = MOCK_USER;
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsingResume, setParsingResume] = useState(false);
  const [personalizedContent, setPersonalizedContent] = useState("");
  const [currentStep, setCurrentStep] = useState<"select" | "preview">(
    "select"
  );
  const [wasOpen, setWasOpen] = useState(false);

  // fetch email templates and user profile on modal open
  useEffect(() => {
    if (open && user) {
      // only reset state when modal transitions from closed to open (not on re-renders)
      if (!wasOpen) {
        setCurrentStep("select");
        setSelectedTemplate(null);
        setPersonalizedContent("");
        setLoading(false);
      }
      fetchTemplates();
      fetchUserProfile();
      setWasOpen(true);
    } else if (!open && wasOpen) {
      // cleanup when modal closes - reset all state
      setCurrentStep("select");
      setSelectedTemplate(null);
      setPersonalizedContent("");
      setLoading(false);
      setResumeFile(null);
      setParsingResume(false);
      setWasOpen(false);
    }
  }, [open, user, wasOpen]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "Database query failed (RLS policy), using fallback templates:",
          error
        );
        // Fallback templates when database is unavailable
        setTemplates([
          {
            id: "fallback-1",
            title: "Short value-first internship reachout",
            description:
              "Quick intro + 1-liner value. Perfect for cold outreach to founders.",
            template_content:
              "Subject: Exploring ways I can help at {StartupName}\nHi {FirstName}, I'm {YourName}, a {YourRole}. I saw your work on {TheirThing} and loved {SpecificDetail}. I can help with {ValueYouProvide} – happy to share a tiny demo if helpful.",
            category: "internship",
            status: "active",
            usage_count: 0,
            success_rate: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "fallback-2",
            title: "Follow-up after no reply (friendly)",
            description:
              "Polite nudge that adds value instead of asking for time.",
            template_content:
              "Subject: Quick nudge + tiny example\nHi {FirstName}, looping back in case this got buried. I put together a 1-page {ThingYouMade} to show exactly how I can help with {TheirGoal}. If not useful, all good – happy to iterate.",
            category: "follow-up",
            status: "active",
            usage_count: 0,
            success_rate: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "fallback-3",
            title: "Founder value pitch (specific and short)",
            description:
              "Lead with proof of work, ask for feedback, not a call.",
            template_content:
              "Subject: 48h mock for {StartupName}\nHi {FirstName}, I built a small {Prototype/Analysis} for {StartupName} – focused on {SpecificMetric}. Took ~48h. If this direction is useful, happy to refine based on your feedback.",
            category: "value-pitch",
            status: "active",
            usage_count: 0,
            success_rate: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        return;
      }
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      // Load from localStorage
      const savedProfile = localStorage.getItem(`user-profile-${user.id}`);
      if (savedProfile) {
        const data = JSON.parse(savedProfile);
        console.log("User profile data from localStorage:", data);
        console.log("Resume text:", data?.resume_text);
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error loading user profile from localStorage:", error);
    }
  };

  // parse resume via openrouter - supports pdfs inline (no separate upload)
  const parseResumeWithGemini = async (file: File): Promise<string> => {
    try {
      const resumePrompt =
        "analyze this resume and create a structured professional summary. start with the person's full name on the first line, then provide a concise summary highlighting key skills, experience, achievements, and contact information including email, phone, and any relevant urls/links. focus on internship-relevant details. respond with plaintext and only what is necessary.";

      const fileType = file.type.toLowerCase();

      if (fileType === "application/pdf") {
        console.log("Sending PDF to OpenRouter inline...");
        const reader = new FileReader();
        const base64: string = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const summary = await openrouterChatWithPDF({
          prompt: resumePrompt,
          pdfBase64: base64.split(",")[1],
          filename: file.name,
        });

        if (!summary) {
          throw new Error("no summary generated");
        }

        console.log("Generated summary:", summary);
        return summary.trim();
      } else {
        // for text files, read and send as text
        const text = await file.text();
        console.log("Extracted text length:", text.length);

        const summary = await openrouterChat({
          prompt: `${resumePrompt}:\n\n${text}`,
        });

        if (!summary) {
          throw new Error("no summary generated");
        }

        console.log("Generated summary:", summary);
        return summary.trim();
      }
    } catch (error) {
      console.error("Error in parseResumeWithGemini:", error);
      throw error;
    }
  };

  // handle resume upload and parsing
  const handleResumeUpload = async () => {
    if (!resumeFile || !user) return;

    try {
      setParsingResume(true);
      const resumeSummary = await parseResumeWithGemini(resumeFile);

      // Save to localStorage
      const existingProfile = localStorage.getItem(`user-profile-${user.id}`);
      const profileData = existingProfile ? JSON.parse(existingProfile) : {};
      
      profileData.user_id = user.id;
      profileData.resume_text = resumeSummary;
      profileData.last_updated = new Date().toISOString();

      localStorage.setItem(`user-profile-${user.id}`, JSON.stringify(profileData));

      // refresh user profile data
      await fetchUserProfile();
      setResumeFile(null);
      alert("Resume processed and saved to localStorage!");
    } catch (error) {
      console.error("Error processing resume:", error);
      alert("failed to process resume. please try again.");
    } finally {
      setParsingResume(false);
    }
  };

  // personalize email template via openrouter - includes auth user details
  const personalizeEmail = async (template: EmailTemplate) => {
    console.log("Personalizing email - userProfile:", userProfile);
    console.log("Resume text available:", !!userProfile?.resume_text);

    if (!userProfile?.resume_text) {
      console.log("No resume text found, returning template as-is");
      return template.template_content;
    }

    // use authenticated user's name from auth context, fallback to email prefix
    const senderName = user?.name || user?.email?.split("@")[0] || "Student";
    const senderEmail = user?.email || "";

    console.log("Sender details for personalization:", {
      senderName,
      senderEmail,
      userAuthData: user,
    });

    try {
      setLoading(true);

      const personalizedText = await openrouterChat({
        prompt: `personalize this email template using the user's details and resume info. DO NOT CHANGE THE TEMPLATE MUCH, EDIT ONLY THE NAMES AND SPECIFIC DETAILS. KEEP FORMAT SAME. highlights relevant experience and shows genuine interest.\n\nemail template:\n${
          template.template_content
        }\n\nsender details:\nname: ${senderName}\nemail: ${senderEmail}\n\nrecipient details:\nname: ${
          employee.name
        }\ncompany: ${startupName}\n what the company does: ${startupDescription}\nrole: ${
          employee.role || "team member"
        }\nemail: ${employee.email}\n\nresume summary:\n${
          userProfile.resume_text
        }\n\ninstructions:\n- replace [Your Name] or similar placeholders with "${senderName}"\n- replace [Your Email] with "${senderEmail}"\n- replace [Name] or [Recipient Name] with "${
          employee.name
        }"\n- replace [Company] with "${startupName}"\n- personalize content using specific skills and experiences from resume\n- maintain professional tone while showing enthusiasm\n- include relevant projects, skills, or achievements that match the role.  respond with plaintext and only what is necessary.`,
      });

      return personalizedText?.trim() || template.template_content;
    } catch (error) {
      console.error("Error personalizing email:", error);
      return template.template_content;
    } finally {
      setLoading(false);
    }
  };

  // increment template usage count (localStorage only)
  const incrementUsageCount = async (templateId: string) => {
    try {
      // Track usage count in localStorage
      const key = `template-usage-${templateId}`;
      const current = parseInt(localStorage.getItem(key) || "0", 10);
      localStorage.setItem(key, (current + 1).toString());
      console.log(`Template ${templateId} usage count: ${current + 1}`);
    } catch (error) {
      console.error("Error incrementing usage count:", error);
    }
  };

  // handle template selection and personalization
  const handleTemplateSelect = async (template: EmailTemplate) => {
    setSelectedTemplate(template);
    const personalized = await personalizeEmail(template);
    setPersonalizedContent(personalized);
    setCurrentStep("preview");
  };

  // generate compose links with fallbacks (Gmail first, then mailto) and log usage
  const handleSendEmail = async () => {
    // Extract subject from email body if it starts with "Subject:"
    let subject = `Regarding internship opportunity at ${startupName}`;
    let bodyContent = personalizedContent;

    // Check if the email body starts with "Subject:" and extract it
    const subjectMatch = personalizedContent.match(
      /^Subject:\s*(.+?)(?:\n|$)/i
    );
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      // Remove the subject line from the body
      bodyContent = personalizedContent
        .replace(/^Subject:\s*.+?(?:\n\n?|\r\n\r?\n?)/i, "")
        .trim();
    }

    // If bulk mode, join all employee emails with comma (RFC compliant for multiple recipients)
    const toEmails = bulkEmployees
      ? bulkEmployees.map((e) => e.email).join(",")
      : employee.email;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      toEmails
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      bodyContent
    )}`;

    // For mailto, properly encode the subject and body separately
    const mailtoUrl = `mailto:${encodeURIComponent(
      toEmails
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      bodyContent
    )}`;

    let opened = false;

    // 1) Try Gmail in a new tab/window first
    try {
      const w = window.open(gmailUrl, "_blank", "noopener,noreferrer");
      opened = !!w;
    } catch (_) {
      opened = false;
    }

    // 2) If Gmail didn't open, try mailto in a new tab/window first
    if (!opened) {
      try {
        // Note: Some browsers return null for window.open with mailto but still trigger the mail client
        window.open(mailtoUrl, "_blank");
        opened = true; // consider opened to avoid forcing same-tab if client already triggered
      } catch (_) {
        opened = false;
      }
    }

    // 2b) Last-resort: same-tab mailto navigation
    if (!opened) {
      try {
        window.location.href = mailtoUrl;
        opened = true;
      } catch (_) {
        opened = false;
      }
    }

    if (!opened) {
      return; // do not increment usage or close if nothing opened
    }

    // We can't know if the user actually sent the email, but we count once a composer opened
    if (selectedTemplate) {
      await incrementUsageCount(selectedTemplate.id);
    }

    // Track email sent counts in localStorage
    try {
      const incrementForEmployee = (emp: StartupEmployee) => {
        if (!emp.id) return;
        try {
          const key = `employee-emails-${emp.id}`;
          const current = parseInt(localStorage.getItem(key) || "0", 10);
          localStorage.setItem(key, (current + 1).toString());
          console.log(`Employee ${emp.name} email count: ${current + 1}`);
        } catch {}
      };

      if (bulkEmployees && bulkEmployees.length > 0) {
        bulkEmployees.forEach((e) => incrementForEmployee(e));
      } else if (employee) {
        incrementForEmployee(employee);
      }
    } catch {}

    // refresh template list to show updated counts
    await fetchTemplates();

    onOpenChange(false);
  };

  // go back to template selection
  const handleBackToSelection = () => {
    setCurrentStep("select");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[85vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {bulkEmployees ? startupName : employee.name}
          </DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>

        {currentStep === "select" ? (
          // step 1: template selection
          <div className="space-y-6">
            {/* resume check section */}
            {!userProfile?.resume_text && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    resume required for personalization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-primary mb-4">
                    upload your resume to create personalized emails that stand
                    out.
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={(e) =>
                        setResumeFile(e.target.files?.[0] || null)
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={handleResumeUpload}
                      disabled={!resumeFile || parsingResume}
                      className="flex items-center gap-2 text-black"
                    >
                      {parsingResume ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {parsingResume ? "processing..." : "upload"}
                    </Button>
                  </div>

                  <p className="text-black-700 mt-4 text-sm">
                    (
                    <Link className="text-orange-700" to="/app/settings">
                      update
                    </Link>{" "}
                    your profile for better customization)
                  </p>
                </CardContent>
              </Card>
            )}

            {/* template selection */}
            <div>
              {/* profile reminder - always visible for better email gen */}
              <div className="mb-3 text-sm text-muted-foreground">
                💡 tip:{" "}
                <Link
                  to="/app/settings"
                  className="text-primary hover:underline font-medium"
                >
                  complete your profile
                </Link>{" "}
                for more personalized cold emails
              </div>
              <h3 className="text-lg font-medium mb-4">
                Select a template to continue
              </h3>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer transition-colors hover:bg-foreground/10"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">
                          {template.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="text-xs text-muted-foreground overflow-hidden"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {template.template_content.substring(0, 150)}...
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">
                            {template.description}
                          </Badge>
                          {/* <span className="text-xs text-muted-foreground">
                            Uses: {template.usage_count || 0}
                          </span> */}
                        </div>
                        <Button
                          size="sm"
                          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <ArrowRight className="h-3 w-3" />
                          use template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // step 2: email preview
          <div className="space-y-6">
            <div className="w-full max-w-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Email Preview</h3>
                {userProfile?.resume_text && (
                  <Badge
                    variant="default"
                    className="flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Wand2 className="h-3 w-3" />
                    AI Personalized
                  </Badge>
                )}
              </div>
              <Card className="w-full">
                <CardContent className="pt-0 px-0 sm:pt-6 sm:px-6 lg:px-8">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div>
                        <strong>to:</strong>{" "}
                        {bulkEmployees
                          ? `All Employees (${bulkEmployees.length})`
                          : employee.email}
                      </div>
                      <div>
                        <strong>subject:</strong> regarding internship
                        opportunity at {startupName}
                      </div>
                    </div>
                    <div className="border-t pt-3 sm:pt-4">
                      {loading ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          personalizing email...
                        </div>
                      ) : (
                        <div className="w-full">
                          <textarea
                            value={
                              personalizedContent ||
                              selectedTemplate?.template_content
                            }
                            onChange={(e) =>
                              setPersonalizedContent(e.target.value)
                            }
                            className="w-full min-h-[200px] max-h-[35vh] sm:min-h-[250px] sm:max-h-[40vh] lg:min-h-[300px] lg:max-h-[45vh] text-sm leading-relaxed whitespace-pre-wrap resize-y border-2 border-gray-300 dark:border-gray-600 rounded-md p-2 sm:p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            rows={Math.max(
                              10,
                              Math.min(
                                25,
                                personalizedContent?.split("\n").length + 2
                              )
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:items-center sm:gap-4 p-3 sm:p-4">
          {/* mobile: send email btn full width on top, desktop: normal layout */}
          {currentStep === "preview" && (
            <div className="flex flex-col items-center sm:items-end gap-1 w-full sm:w-auto sm:order-2">
              <Button
                onClick={handleSendEmail}
                disabled={!selectedTemplate || loading}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground w-full h-12 text-base font-medium sm:w-auto sm:h-10 sm:text-sm"
              >
                <Mail className="h-4 w-4" />
                send email
              </Button>
              <div className="text-xs text-muted-foreground text-center sm:text-right mt-1">
                Please review and personalize the email before sending.
              </div>
            </div>
          )}

          {/* mobile: back and cancel btns half width each, desktop: normal layout */}
          <div className="flex gap-3 w-full justify-center sm:w-auto sm:justify-start sm:order-1">
            {currentStep === "preview" && (
              <Button
                variant="outline"
                onClick={handleBackToSelection}
                className="flex items-center justify-center gap-2 flex-1 h-12 text-base font-medium sm:flex-none sm:h-10 sm:text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                back to templates
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center flex-1 h-12 text-base font-medium sm:flex-none sm:h-10 sm:text-sm"
            >
              cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
