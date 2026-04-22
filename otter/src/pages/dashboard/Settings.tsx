import { useState, useEffect, useRef } from "react";
import {
  Settings as SettingsIcon,
  Plus,
  X,
  Loader2,
  Wand2,
  Save,
  Upload,
  FileText,
  // LogOut,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserProfile, Domain } from "@/types";
import { parseResumeWithGemini } from "@/services/geminiService";
import { openrouterChat } from "@/services/openrouter";
import { MOCK_USER } from "@/utils/mockUser";

const domains: Domain[] = [
  "Product",
  "Marketing",
  "Growth",
  "Brand",
  "Design",
  "Content",
  "Community",
  "Sales",
  "Operations",
];

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  education: string;
  experience_years: number;
  additional_info: string;
}

interface UserPreferencesData {
  preferred_domains: string[];
  preferred_locations: string[];
  preferred_company_stages: string[];
}

export function Settings() {
  // Using mock user for development
  const user = MOCK_USER;
  const authLoading = false;

  // profile data states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferencesData>({
    preferred_domains: [],
    preferred_locations: [],
    preferred_company_stages: [],
  });

  // form states
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    portfolio: "",
    education: "",
    experience_years: 0,
    additional_info: "",
  });

  // skills mgmt
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  // custom links mgmt
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [newCustomLink, setNewCustomLink] = useState({ label: "", url: "" });
  const [showAddLinks, setShowAddLinks] = useState(false);

  // loading states
  const [loading, setLoading] = useState(false);
  const [updatingResume, setUpdatingResume] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [parsingResume, setParsingResume] = useState(false);

  // resume upload autofill
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // fetch user profile and preferences on mount
  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    } else if (user === null) {
      // user is explicitly null (not loading), so stop fetching
      setFetchingData(false);
    }
  }, [user?.id]); // only depend on user.id to avoid unnecessary re-fetches

  const fetchUserData = async () => {
    if (!user?.id) {
      setFetchingData(false);
      return;
    }

    try {
      setFetchingData(true);

      // Load from localStorage
      const savedProfile = localStorage.getItem(`user-profile-${user.id}`);
      const savedPreferences = localStorage.getItem(
        `user-preferences-${user.id}`
      );

      if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        setUserProfile(profileData);
        setSkills(profileData.skills || []);
        setCustomLinks(profileData.custom_links || []);
        setProfileForm((prev) => ({
          ...prev,
          linkedin: profileData.linkedin || "",
          github: profileData.github || "",
          portfolio: profileData.portfolio || "",
          education: profileData.education || "",
          experience_years: profileData.experience_years || 0,
        }));
      }

      if (savedPreferences) {
        const prefsData = JSON.parse(savedPreferences);
        setUserPreferences({
          preferred_domains: prefsData.preferred_domains || [],
          preferred_locations: prefsData.preferred_locations || [],
          preferred_company_stages: prefsData.preferred_company_stages || [],
        });
      }

      // init form with user data
      setProfileForm((prev) => ({
        ...prev,
        first_name: user.name?.split(" ")[0] || "",
        last_name: user.name?.split(" ")[1] || "",
        email: user.email || "",
      }));
    } catch (error) {
      console.error("err loading user data:", error);
    } finally {
      setFetchingData(false);
    }
  };

  // openrouter ai integration to update resume_text
  const updateResumeWithGemini = async (
    profileData: ProfileFormData,
    userSkills: string[],
    domainPrefs: string[]
  ) => {
    try {
      setUpdatingResume(true);

      const profileSummary = `
name: ${profileData.first_name} ${profileData.last_name}
email: ${profileData.email}
phone: ${profileData.phone}
linkedin: ${profileData.linkedin}
github: ${profileData.github}
portfolio: ${profileData.portfolio}
education: ${profileData.education}
experience: ${profileData.experience_years} years
skills: ${userSkills.join(", ")}
preferred domains: ${domainPrefs.join(", ")}
additional info: ${profileData.additional_info}
      `.trim();

      const resumeText = await openrouterChat({
        prompt: `create a professional resume summary from this profile information. format it as a structured summary that highlights key skills, experience, achievements, and contact information. make it suitable for internship applications and emphasize relevant technical skills and domain expertise. respond with plaintext and only what is necessary:\n\n${profileSummary}`,
        temperature: 0.7,
        maxTokens: 1400,
      });

      return resumeText?.trim() || null;
    } catch (error) {
      console.error("err updating resume with openrouter:", error);
      return null;
    } finally {
      setUpdatingResume(false);
    }
  };

  // handle profile form changes
  const handleProfileChange = (
    field: keyof ProfileFormData,
    value: string | number
  ) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // handle domain preference toggle
  const toggleDomainPreference = (domain: string) => {
    setUserPreferences((prev) => ({
      ...prev,
      preferred_domains: prev.preferred_domains.includes(domain)
        ? prev.preferred_domains.filter((d) => d !== domain)
        : [...prev.preferred_domains, domain],
    }));
  };

  // add skill
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills((prev) => [...prev, newSkill.trim()]);
      setNewSkill("");
    }
  };

  // remove skill
  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  };

  // add custom link
  const addCustomLink = () => {
    if (newCustomLink.label.trim() && newCustomLink.url.trim()) {
      const customLink: CustomLink = {
        id: Date.now().toString(),
        label: newCustomLink.label.trim(),
        url: newCustomLink.url.trim(),
      };
      setCustomLinks((prev) => [...prev, customLink]);
      setNewCustomLink({ label: "", url: "" });
    }
  };

  // remove custom link
  const removeCustomLink = (linkId: string) => {
    setCustomLinks((prev) => prev.filter((link) => link.id !== linkId));
  };

  // handle resume upload and autofill
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleAutofillProfile = async () => {
    if (!uploadedFile) return;

    try {
      setParsingResume(true);

      // parse resume with gemini
      const parsedData = await parseResumeWithGemini(uploadedFile);

      // autofill form with parsed data
      setProfileForm((prev) => ({
        ...prev,
        first_name: parsedData.firstName || prev.first_name,
        last_name: parsedData.lastName || prev.last_name,
        email: parsedData.email || prev.email,
        phone: parsedData.phone || prev.phone,
        linkedin: parsedData.linkedin || prev.linkedin,
        github: parsedData.github || prev.github,
        portfolio: parsedData.portfolio || prev.portfolio,
        education: parsedData.education || prev.education,
        experience_years: parsedData.experienceYears || prev.experience_years,
        additional_info: parsedData.additionalInfo
          ? typeof parsedData.additionalInfo === "string"
            ? parsedData.additionalInfo
            : JSON.stringify(parsedData.additionalInfo, null, 2)
          : prev.additional_info,
      }));

      // autofill skills
      if (parsedData.skills && parsedData.skills.length > 0) {
        // merge with existing skills, avoid dupes
        setSkills((prev) => {
          const combined = [...prev, ...parsedData.skills!];
          return Array.from(new Set(combined));
        });
      }

      // reset file input
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setParsingResume(false);
    }
  };

  // save all profile changes to localStorage
  const saveProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // generate updated resume text with gemini
      const updatedResumeText = await updateResumeWithGemini(
        profileForm,
        skills,
        userPreferences.preferred_domains
      );

      // Save to localStorage
      const profileData = {
        user_id: user.id,
        resume_text: updatedResumeText || userProfile?.resume_text || "",
        skills: skills,
        custom_links: customLinks,
        linkedin: profileForm.linkedin,
        github: profileForm.github,
        portfolio: profileForm.portfolio,
        experience_years: profileForm.experience_years,
        education: profileForm.education,
        phone: profileForm.phone,
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        additional_info: profileForm.additional_info,
        last_updated: new Date().toISOString(),
      };

      const prefsData = {
        user_id: user.id,
        preferred_domains: userPreferences.preferred_domains,
        preferred_locations: userPreferences.preferred_locations,
        preferred_company_stages: userPreferences.preferred_company_stages,
      };

      // Save to localStorage
      localStorage.setItem(
        `user-profile-${user.id}`,
        JSON.stringify(profileData)
      );
      localStorage.setItem(
        `user-preferences-${user.id}`,
        JSON.stringify(prefsData)
      );

      // Update local state
      setUserProfile(profileData as any);
    } catch (error) {
      console.error("err saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetchingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
        icon={SettingsIcon}
      />

      <div className="space-y-8">
        {/* profile autofill w/ resume upload */}
        <Card className="border-foreground/10 bg-foreground/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Profile Autofill (Optional)
            </CardTitle>
            <CardDescription>
              upload your resume to automatically fill your profile with
              detailed information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {/* hidden native file input */}
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleResumeUpload}
                  disabled={parsingResume}
                  className="hidden"
                />
                {/* visible trigger button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsingResume}
                  className="min-w-[160px] justify-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadedFile ? "Choose another file" : "Choose file"}
                </Button>
                <Button
                  onClick={handleAutofillProfile}
                  disabled={!uploadedFile || parsingResume}
                  className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px]"
                >
                  {parsingResume ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      parsing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      autofill
                    </>
                  )}
                </Button>
              </div>

              {uploadedFile && !parsingResume && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/60 p-2 rounded max-w-fit">
                  <FileText className="h-4 w-4" />
                  <span>{uploadedFile.name}</span>
                  <span className="text-xs">
                    ({(uploadedFile.size / 1024).toFixed(1)} kb)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setUploadedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    title="Remove file"
                    aria-label="Remove file"
                    className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                📄 supported formats: pdf, txt, doc, docx • ai will extract and
                populate all fields below
              </p>
            </div>
          </CardContent>
        </Card>

        {/* profile info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={profileForm.first_name}
                  onChange={(e) =>
                    handleProfileChange("first_name", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={profileForm.last_name}
                  onChange={(e) =>
                    handleProfileChange("last_name", e.target.value)
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                value={profileForm.email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                type="email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                  type="tel"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Experience (Years)
                </label>
                <Input
                  value={profileForm.experience_years}
                  onChange={(e) =>
                    handleProfileChange(
                      "experience_years",
                      parseInt(e.target.value) || 0
                    )
                  }
                  type="number"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Education</label>
              <Input
                value={profileForm.education}
                onChange={(e) =>
                  handleProfileChange("education", e.target.value)
                }
                placeholder="e.g., computer science at xyz university"
              />
            </div>
          </CardContent>
        </Card>

        {/* social links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>
              Add your professional social links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">LinkedIn</label>
              <Input
                value={profileForm.linkedin}
                onChange={(e) =>
                  handleProfileChange("linkedin", e.target.value)
                }
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <label className="text-sm font-medium">GitHub</label>
              <Input
                value={profileForm.github}
                onChange={(e) => handleProfileChange("github", e.target.value)}
                type="url"
                placeholder="https://github.com/yourusername"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Resume</label>
              <Input
                value={profileForm.portfolio}
                onChange={(e) =>
                  handleProfileChange("portfolio", e.target.value)
                }
                type="url"
                placeholder="https://yourportfolio.com"
              />
            </div>

            {/* add more links btn */}
            <div className="pt-2">
              <Button
                onClick={() => setShowAddLinks(!showAddLinks)}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {showAddLinks ? "hide additional links" : "add more links"}
              </Button>
            </div>

            {/* custom links section - only show when toggled */}
            {showAddLinks && (
              <div className="pt-4 border-t space-y-4">
                {/* existing custom links */}
                {customLinks.length > 0 && (
                  <div className="space-y-2">
                    {customLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-2 p-2 bg-foreground/5 rounded-none"
                      >
                        <span className="text-sm font-medium min-w-[80px]">
                          {link.label}:
                        </span>
                        <span className="text-sm text-foreground/70 flex-1 truncate">
                          {link.url}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCustomLink(link.id)}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* add new custom link */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newCustomLink.label}
                      onChange={(e) =>
                        setNewCustomLink((prev) => ({
                          ...prev,
                          label: e.target.value,
                        }))
                      }
                      placeholder="link name (e.g., twitter, medium)"
                      className="text-sm"
                    />
                    <Input
                      value={newCustomLink.url}
                      onChange={(e) =>
                        setNewCustomLink((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                      type="url"
                      placeholder="https://..."
                      className="text-sm"
                    />
                  </div>
                  <Button
                    onClick={addCustomLink}
                    disabled={
                      !newCustomLink.label.trim() || !newCustomLink.url.trim()
                    }
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    add link
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* skills mgmt */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>
              Add and manage your technical skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="add a skill..."
                onKeyPress={(e) => e.key === "Enter" && addSkill()}
              />
              <Button
                onClick={addSkill}
                disabled={!newSkill.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 text-background" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="flex items-center gap-1 bg-foreground/10 text-foreground/70"
                >
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* domain prefs */}
        <Card>
          <CardHeader>
            <CardTitle>Domain Preferences</CardTitle>
            <CardDescription>
              Select the domains you're interested in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {domains.map((domain) => (
                <Badge
                  key={domain}
                  variant={
                    userPreferences.preferred_domains.includes(domain)
                      ? "default"
                      : "outline"
                  }
                  className={`cursor-pointer ${
                    userPreferences.preferred_domains.includes(domain)
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-background/10"
                  }`}
                  onClick={() => toggleDomainPreference(domain)}
                >
                  {domain}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* additional info */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              Any additional details about yourself
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={profileForm.additional_info}
              onChange={(e) =>
                handleProfileChange("additional_info", e.target.value)
              }
              className="w-full min-h-[100px] p-3 border rounded-none bg-background"
              placeholder="tell us about your projects, achievements, or anything else you'd like to highlight..."
            />
          </CardContent>
        </Card>

        {/* save btn */}
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {updatingResume && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wand2 className="h-4 w-4" />
                  ai updating profile...
                </div>
              )}
            </div>
            <Button
              onClick={saveProfile}
              disabled={loading || updatingResume}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              save all changes
            </Button>

            {/* <Button
              onClick={logout}
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button> */}
          </div>
        </CardContent>

        {/* danger zone */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="destructive"
              className="bg-red-700 text-white hover:bg-red-700/90">
              Delete Account
            </Button>
          </CardFooter>
        </Card> */}
      </div>
    </div>
  );
}
