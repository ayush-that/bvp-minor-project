export type ResearchKind = "people" | "companies";

type Location = { city?: string | null; region?: string | null; country_code?: string | null };
export type Person = {
  name: string;
  description?: string | null;
  profiles?: string[];
  role?: { title?: string | null; company?: { name?: string | null; domain?: string | null } | null } | null;
  location?: Location | null;
  years_of_experience?: number | null;
  skills?: string[];
  schools?: string[];
};
export type Company = {
  name: string;
  domain?: string | null;
  description?: string | null;
  industries?: string[];
  headquarters?: Location | null;
  employees?: { count?: number | null; min?: number | null; max?: number | null } | null;
  funding?: { stage?: string | null; total_usd?: number | null } | null;
};
export type SearchRequest = { kind: ResearchKind; query: string; country?: string; cursor?: string };
export type SearchResponse = {
  results: (Person | Company)[];
  next_cursor?: string | null;
  request_id?: string;
  key_metadata?: { credits_consumed?: number; credits_remaining?: number };
  cache: { hit: boolean; expires_at: string };
};
export type OutreachDraft = { subject: string; message: string };

async function post<T>(path: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/api/context/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(typeof data?.detail === "string" ? data.detail : `Request failed (${response.status}). Please try again.`);
  }
  return data as T;
}

export async function searchContext(body: SearchRequest, signal: AbortSignal): Promise<SearchResponse> {
  const result = await post<SearchResponse>("search", body, signal);
  if (!result || !Array.isArray(result.results) || !result.cache) throw new Error("Search returned an unexpected response.");
  result.results = result.results.filter((item) => item && typeof item.name === "string");
  return result;
}

export async function generateOutreach(
  person: Person, resume: string, company: string | undefined, signal: AbortSignal,
): Promise<OutreachDraft> {
  const result = await post<OutreachDraft>("draft", { person, resume, company }, signal);
  if (typeof result?.subject !== "string" || typeof result?.message !== "string") throw new Error("The draft could not be generated. Please retry.");
  return result;
}

export function safeWebUrl(value: unknown, domain = false): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  const candidate = domain && !/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? `https://${trimmed}` : trimmed;
  try {
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
