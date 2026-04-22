export interface Internship {
  id: string;
  role: string;
  companyName: string;
  stipend: string;
  location: "remote" | "hybrid" | "onsite";
  companyType: "startup" | "corporate";
  domain: string[];
  description: string;
  applyLink: string;
  postedDate: string;
  deadline: string;
}

// updt startup type to match db schema
export interface Startup {
  id: string;
  name: string;
  description?: string;
  website?: string;
  sector?: string;
  location?: string;
  funding_round?: string;
  funding_amount?: string;
  funding_date?: string;
  team_size?: string;
  logo_url?: string;
  is_hiring: boolean;
  is_trending: boolean;
  status: "pending" | "verified" | "rejected";
  views_count: number;
  saves_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // add employees and tags for ui
  employees?: StartupEmployee[];
  tags?: string[];
  slug: string;
}

// new employee type from db schema
export interface StartupEmployee {
  id?: string;
  startup_id?: string;
  name: string;
  role?: string;
  email: string;
  linkedin_url?: string;
  status?: "verified" | "pending" | "invalid";
  emails_sent?: number;
  created_at?: string;
  updated_at?: string;
}

// form types for creating/editing
export interface StartupFormData {
  name: string;
  description?: string;
  website?: string;
  sector?: string;
  location?: string;
  funding_round?: string;
  funding_amount?: string;
  team_size?: string;
  logo_url?: string;
  is_hiring: boolean;
  tags?: string[];
  employees: StartupEmployeeFormData[];
  slug: string;
  is_trending: boolean;
}

export interface StartupEmployeeFormData {
  name: string;
  role?: string;
  email: string;
  linkedin_url?: string;
}

export interface EmailTemplate {
  id: string;
  title: string;
  description?: string;
  template_content: string;
  category: "internship" | "value-pitch" | "follow-up";
  status?: "active" | "draft" | "archived";
  usage_count?: number;
  success_rate?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  resume_text?: string;
  profile_score?: number;
  skills?: string[];
  experience_years?: number;
  education?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  phone?: string;
  location?: string;
  summary?: string;
  custom_links?: Array<{ id: string; label: string; url: string }>;
  last_updated?: string;
  created_at?: string;
}

export interface UserNote {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyContact {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  linkedIn?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
}

export interface UserPreferences {
  domains: string[];
  savedInternships: string[];
  savedStartups: string[];
  emailsSent: number;
  repliesReceived: number;
}

export type Domain =
  | "Product"
  | "Marketing"
  | "Growth"
  | "Brand"
  | "Design"
  | "Content"
  | "Community"
  | "Sales"
  | "Operations";

// resume template type
export interface ResumeTemplate {
  id: string;
  name: string;
  description?: string;
  preview_image_url?: string;
  typst_template: string;
  category: "general" | "technical" | "creative" | "minimal" | "professional";
  is_active: boolean;
  usage_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// user data for resume gen
export interface UserResumeData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  education?: string;
  skills?: string[];
  experience_years?: number;
  resume_text?: string;
  // additional fields from user_profiles
  profile_score?: number;
}
