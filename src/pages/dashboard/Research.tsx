import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Building2, Copy, ExternalLink, Loader2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { MOCK_USER } from "@/utils/mockUser";
import {
  generateOutreach, safeWebUrl, searchContext,
  type Company, type OutreachDraft, type Person, type ResearchKind, type SearchRequest, type SearchResponse,
} from "@/services/context";

type ResearchState = {
  signature: string;
  kind: ResearchKind;
  query: string;
  country: string;
  submitted: SearchRequest | null;
  response: SearchResponse | null;
};
const STORAGE_KEY = "pathfinder-context-research";
const textAreaClass = "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm";

function initialState(signature: string): ResearchState {
  const params = new URLSearchParams(signature);
  const kind = params.get("kind") === "companies" ? "companies" : "people";
  const company = params.get("company");
  const role = params.get("role");
  const query = params.get("q") || (company ? `Recruiters and hiring managers at ${company}${role ? ` for ${role} roles` : ""}` : "");
  const fallback: ResearchState = { signature, kind, query: query.slice(0, 500), country: "", submitted: null, response: null };
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null") as ResearchState | null;
    if (saved?.signature === signature && ["people", "companies"].includes(saved.kind)
      && typeof saved.query === "string" && typeof saved.country === "string"
      && (!saved.response || Array.isArray(saved.response.results))) {
      return saved.response && !(Date.parse(saved.response.cache?.expires_at) > Date.now())
        ? { ...saved, response: null, submitted: null } : saved;
    }
  } catch { /* Start a fresh search if storage is unavailable. */ }
  return fallback;
}

function savedResume(): string {
  try {
    const profile = JSON.parse(localStorage.getItem(`user-profile-${MOCK_USER.id}`) || "null");
    return typeof profile?.resume_text === "string" ? profile.resume_text.slice(0, 12000) : "";
  } catch { return ""; }
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function place(value: Person["location"]): string {
  return [value?.city, value?.region, value?.country_code].filter(Boolean).join(", ");
}

export function Research() {
  const location = useLocation();
  const [state, setState] = useState(() => initialState(location.search));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState(savedResume);
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const searchRef = useRef<AbortController | null>(null);
  const draftRef = useRef<AbortController | null>(null);
  const searchingRef = useRef(false);

  useEffect(() => {
    searchRef.current?.abort();
    draftRef.current?.abort();
    setState(initialState(location.search));
    searchingRef.current = false;
    setBusy(false);
    setDrafting(false);
    setDraft(null);
    setError(null);
    return () => { searchRef.current?.abort(); draftRef.current?.abort(); };
  }, [location.search]);

  useEffect(() => {
    if (state.signature !== location.search) return;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Search still works without storage. */ }
  }, [state, location.search]);

  function prepareSearch(kind: ResearchKind, query = "") {
    draftRef.current?.abort();
    setDraft(null);
    setDrafting(false);
    setError(null);
    setState((current) => ({ ...current, kind, query, submitted: null, response: null }));
  }

  async function search(more = false) {
    if (searchingRef.current) return;
    const request: SearchRequest = more && state.submitted
      ? { ...state.submitted, cursor: state.response?.next_cursor || undefined }
      : { kind: state.kind, query: state.query.trim(), ...(state.country ? { country: state.country.toUpperCase() } : {}) };
    if (!request.query || (more && !request.cursor)) return;
    const controller = new AbortController();
    searchRef.current = controller;
    searchingRef.current = true;
    draftRef.current?.abort();
    setDrafting(false);
    setBusy(true);
    setError(null);
    setDraft(null);
    if (!more) setState((current) => ({ ...current, response: null, submitted: null }));
    try {
      const response = await searchContext(request, controller.signal);
      if (controller.signal.aborted) return;
      setState((current) => ({ ...current, submitted: { ...request, cursor: undefined }, response: {
        ...response, results: more ? [...(current.response?.results || []), ...response.results] : response.results,
      } }));
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Search failed.");
    } finally {
      if (searchRef.current === controller) { searchingRef.current = false; setBusy(false); }
    }
  }

  async function createDraft(person: Person) {
    if (drafting || resume.trim().length < 100) return;
    const controller = new AbortController();
    draftRef.current = controller;
    setDrafting(true);
    setRecipient(person.name);
    setDraft(null);
    setCopied(false);
    setError(null);
    try {
      const result = await generateOutreach(person, resume, person.role?.company?.name || undefined, controller.signal);
      if (!controller.signal.aborted) setDraft(result);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Draft generation failed.");
    } finally {
      if (draftRef.current === controller) setDrafting(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    try { await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.message}`); setCopied(true); }
    catch { setError("Copy was unavailable. You can select and copy the draft text below."); }
  }

  const shownKind = state.submitted?.kind || state.kind;
  const price = state.kind === "people" ? 10 : 2;

  return (
    <div className="space-y-6">
      <Helmet><title>People & Company Research | Pathfinder</title></Helmet>
      <PageHeader title="People & Company Research" icon={Search}
        description="Discover companies, find relevant professionals, and prepare a personal introduction." />
      <Card hover={false} className="space-y-4">
        <div className="flex gap-2" role="group" aria-label="Search category">
          {(["people", "companies"] as const).map((kind) => (
            <Button key={kind} variant={state.kind === kind ? "secondary" : "outline"} disabled={busy}
              aria-pressed={state.kind === kind} onClick={() => prepareSearch(kind)}>
              {kind === "people" ? <Users className="mr-2 h-4 w-4" /> : <Building2 className="mr-2 h-4 w-4" />}
              {kind === "people" ? "People" : "Companies"}
            </Button>
          ))}
        </div>
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void search(); }}>
          <label className="block text-sm font-medium" htmlFor="research-query">Who are you looking for?</label>
          <Input id="research-query" value={state.query} maxLength={500} disabled={busy}
            onChange={(event) => setState((current) => ({ ...current, query: event.target.value }))}
            placeholder={state.kind === "people" ? "Recruiters at Stripe hiring software engineering interns" : "AI startups in India with 10 to 100 employees"} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-xs text-muted-foreground">Country code (optional)
              <Input aria-label="Country code" className="w-32 uppercase" placeholder="IN, US, GB" maxLength={2}
                value={state.country} disabled={busy} pattern="[A-Za-z]{2}"
                onChange={(event) => setState((current) => ({ ...current, country: event.target.value.toUpperCase().replace(/[^A-Z]/g, "") }))} />
            </label>
            <Button type="submit" disabled={busy || !state.query.trim()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {busy ? "Searching…" : "Search"}
            </Button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground">
          New searches and additional pages use {price} Context credits. Repeated searches use a 24-hour cache.
          Searches run only when you click Search or Load more.
        </p>
      </Card>

      {state.kind === "people" && <details className="rounded-md border p-4">
        <summary className="cursor-pointer text-sm font-medium">Your resume for outreach drafts {resume ? "(loaded)" : "(optional)"}</summary>
        <p className="my-2 text-xs text-muted-foreground">Uses your saved Profile resume when available. Add at least 100 characters about your experience before generating a draft.</p>
        <textarea aria-label="Resume for outreach" className={textAreaClass} rows={5} maxLength={12000} value={resume}
          disabled={drafting} onChange={(event) => { setResume(event.target.value); setDraft(null); }} />
      </details>}
      {error && <p role="alert" className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
      {state.response && <section aria-label="Search results" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p>{state.response.results.length} {shownKind} found <span className="text-muted-foreground">for “{state.submitted?.query}”</span></p>
          <Badge variant="outline">{state.response.cache.hit ? "Cached, no new search charge" : `${state.response.key_metadata?.credits_consumed ?? (shownKind === "people" ? 10 : 2)} credits used`}</Badge>
        </div>
        {!state.response.results.length && <Card hover={false}><p className="text-sm text-muted-foreground">No matches found. Try a broader role, company or location.</p></Card>}
        <div className="grid gap-4 md:grid-cols-2">
          {state.response.results.map((result, index) => shownKind === "people" ? (() => {
            const person = result as Person;
            const profiles = strings(person.profiles).map((url) => safeWebUrl(url)).filter((url): url is string => !!url);
            return <Card key={`${person.name}-${profiles[0] || index}`} className="space-y-3">
              <div><h2 className="text-lg font-semibold">{person.name}</h2>
                <p className="text-sm">{[person.role?.title, person.role?.company?.name].filter(Boolean).join(" · ") || "Role not listed"}</p>
                <p className="text-xs text-muted-foreground">{[place(person.location), typeof person.years_of_experience === "number" ? `${person.years_of_experience} years of experience` : ""].filter(Boolean).join(" · ")}</p>
              </div>
              {person.description && <p className="text-sm text-muted-foreground">{person.description}</p>}
              <div className="flex flex-wrap gap-1">{strings(person.skills).slice(0, 8).map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div>
              {!!strings(person.schools).length && <p className="text-xs text-muted-foreground">{strings(person.schools).join(" · ")}</p>}
              <div className="flex flex-wrap gap-2">{profiles.slice(0, 3).map((url, i) => <Button asChild key={url} size="sm" variant="outline">
                <a href={url} target="_blank" rel="noopener noreferrer">Public profile{i ? ` ${i + 1}` : ""}<ExternalLink className="ml-1 h-3 w-3" /></a>
              </Button>)}</div>
              <Button size="sm" variant="secondary" disabled={drafting || busy || resume.trim().length < 100} onClick={() => void createDraft(person)}>
                {drafting && recipient === person.name ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}Generate outreach draft
              </Button>
              {resume.trim().length < 100 && <p className="text-xs text-muted-foreground">Add a resume of at least 100 characters above to prepare a personal introduction.</p>}
            </Card>;
          })() : (() => {
            const company = result as Company;
            const website = safeWebUrl(company.domain, true);
            const employees = company.employees?.count ?? (company.employees?.min != null ? `${company.employees.min}${company.employees.max != null ? `–${company.employees.max}` : "+"}` : null);
            return <Card key={`${company.domain || company.name}-${index}`} className="space-y-3">
              <div><h2 className="text-lg font-semibold">{company.name}</h2><p className="text-xs text-muted-foreground">{place(company.headquarters)}</p></div>
              {company.description && <p className="text-sm text-muted-foreground">{company.description}</p>}
              <div className="flex flex-wrap gap-1">{strings(company.industries).slice(0, 6).map((industry) => <Badge key={industry} variant="outline">{industry}</Badge>)}</div>
              <p className="text-xs text-muted-foreground">{[employees != null ? `${employees} employees` : "", company.funding?.stage?.replace(/_/g, " "), typeof company.funding?.total_usd === "number" ? `${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(company.funding.total_usd)} disclosed funding` : ""].filter(Boolean).join(" · ")}</p>
              <div className="flex flex-wrap gap-2">
                {website && <Button asChild size="sm" variant="outline"><a href={website} target="_blank" rel="noopener noreferrer">Website<ExternalLink className="ml-1 h-3 w-3" /></a></Button>}
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => prepareSearch("people", `Recruiters and hiring managers at ${company.name}`)}>Find people</Button>
              </div>
            </Card>;
          })())}
        </div>
        {state.response.next_cursor && <Button variant="outline" disabled={busy} onClick={() => void search(true)}>Load more ({shownKind === "people" ? 10 : 2} credits)</Button>}
        {shownKind === "people" && <p className="text-xs text-muted-foreground">Context provides public professional profiles, not email addresses or phone numbers. Results are search matches, not confirmed hiring contacts.</p>}
      </section>}

      {(drafting || draft) && <Card hover={false} className="space-y-3" aria-label="Outreach draft">
        <h2 className="font-semibold">Introduction for {recipient}</h2>
        {drafting ? <p role="status" className="text-sm text-muted-foreground">Preparing a draft using your resume…</p> : draft && <>
          <label className="block space-y-1 text-sm">Subject<Input value={draft.subject} onChange={(event) => { setCopied(false); setDraft({ ...draft, subject: event.target.value }); }} /></label>
          <label className="block space-y-1 text-sm">Message<textarea className={textAreaClass} rows={9} value={draft.message} onChange={(event) => { setCopied(false); setDraft({ ...draft, message: event.target.value }); }} /></label>
          <Button onClick={() => void copyDraft()}><Copy className="mr-2 h-4 w-4" />{copied ? "Copied" : "Copy draft"}</Button>
          <p className="text-xs text-muted-foreground">Review and personalize this draft. Nothing is sent from this page.</p>
        </>}
      </Card>}
      {!state.response && !busy && <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Search by role, company, skills or location. Company results can lead directly to a people search.
      </div>}
    </div>
  );
}
