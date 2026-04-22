export interface LocalUserProfile {
  user_id: string;
  resume_text: string;
  skills: string[];
  custom_links: Array<{ id: string; label: string; url: string }>;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  experience_years?: number;
  education?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  additional_info?: string;
  last_updated: string;
}

export interface LocalUserPreferences {
  user_id: string;
  preferred_domains: string[];
  preferred_locations: string[];
  preferred_company_stages: string[];
}

export function getUserProfile(userId: string): LocalUserProfile | null {
  try {
    const data = localStorage.getItem(`user-profile-${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error loading user profile from localStorage:", error);
    return null;
  }
}

export function getUserPreferences(
  userId: string
): LocalUserPreferences | null {
  try {
    const data = localStorage.getItem(`user-preferences-${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error loading user preferences from localStorage:", error);
    return null;
  }
}

export function saveUserProfile(
  userId: string,
  profile: Partial<LocalUserProfile>
): void {
  try {
    const existing = getUserProfile(userId) || {
      user_id: userId,
      skills: [],
      custom_links: [],
      resume_text: "",
      last_updated: "",
    };
    const updated = {
      ...existing,
      ...profile,
      last_updated: new Date().toISOString(),
    };
    localStorage.setItem(`user-profile-${userId}`, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving user profile to localStorage:", error);
  }
}

export function saveUserPreferences(
  userId: string,
  preferences: Partial<LocalUserPreferences>
): void {
  try {
    const existing = getUserPreferences(userId) || {
      user_id: userId,
      preferred_domains: [],
      preferred_locations: [],
      preferred_company_stages: [],
    };
    const updated = { ...existing, ...preferences };
    localStorage.setItem(`user-preferences-${userId}`, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving user preferences to localStorage:", error);
  }
}
