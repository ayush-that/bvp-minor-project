import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import {
  Compass,
  Upload,
  Play,
  Square,
  ExternalLink,
  X,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  fetchSeeds,
  uploadResume,
  streamPipeline,
  recordFeedback,
  type Posting,
  type Ranked,
  type Seed,
} from "@/services/pipeline";

// -------- agent manifest --------
type AgentId = "discovery" | "extraction" | "critic" | "matching";
type AgentState = "idle" | "running" | "done" | "error";

type AgentMeta = {
  id: AgentId;
  label: string;
  role: string;
  purpose: string;
};

const AGENTS: AgentMeta[] = [
  {
    id: "discovery",
    label: "Discovery Agent",
    role: "Portal Crawler",
    purpose: "Scrapes career portals and isolates verified job postings.",
  },
  {
    id: "extraction",
    label: "Extraction Agent",
    role: "Schema Engine",
    purpose: "Normalizes postings into structured role, salary, skill & mode data.",
  },
  {
    id: "critic",
    label: "Critic Agent",
    role: "Integrity Auditor",
    purpose: "Cross-checks schema against source text to eliminate hallucinations.",
  },
  {
    id: "matching",
    label: "Matching Agent",
    role: "Fit Reasoner",
    purpose: "Evaluates candidate resume against role demands with qualitative reasoning.",
  },
];

// -------- micro-components --------

function AgentTile({
  meta,
  state,
  active,
}: {
  meta: AgentMeta;
  state: AgentState;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 border bg-background px-3.5 py-3 transition-all",
        "rounded-[2px]",
        state === "running" &&
          "border-primary shadow-[0_0_0_1px_hsl(var(--primary))] bg-primary/5",
        state === "done" && "border-emerald-500/60",
        state === "error" && "border-destructive",
        state === "idle" && "border-foreground/10",
        active && "ring-1 ring-primary/20"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            state === "running"
              ? "bg-primary animate-ping"
              : state === "done"
              ? "bg-emerald-500"
              : "bg-primary/70"
          )}
        />
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/80"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          {meta.label}
        </span>
        <span className="ml-auto">
          {state === "running" && (
            <CircleDot className="h-3.5 w-3.5 text-primary animate-pulse" />
          )}
          {state === "done" && (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          )}
          {state === "error" && (
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          )}
          {state === "idle" && (
            <span className="block h-2 w-2 rounded-full border border-foreground/30" />
          )}
        </span>
      </div>
      <div
        className="text-[11px] font-medium leading-tight text-foreground/70"
        style={{ fontFamily: "JetBrains Mono, monospace" }}
      >
        {meta.role}
      </div>
      <p className="text-[11px] leading-snug text-foreground/60">{meta.purpose}</p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const s = Math.max(0, Math.min(100, score));
  const r = 28;
  const c = 2 * Math.PI * r;
  const dash = (c * s) / 100;
  const color =
    s >= 70 ? "text-emerald-500" : s >= 40 ? "text-primary" : "text-foreground/40";
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 72 72">
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-foreground/10"
          strokeWidth="5"
        />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="currentColor"
          className={cn("transition-all duration-700", color)}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn("text-xl font-semibold", color)}
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          {Math.round(s)}
        </span>
      </div>
    </div>
  );
}

function EventLogLine({ ev, data }: { ev: string; data: any }) {
  const tone =
    ev === "error" || ev === "extract_error"
      ? "text-destructive"
      : ev === "warning"
        ? "text-amber-500"
        : ev === "posting"
          ? "text-emerald-600"
          : ev === "ranked"
            ? "text-primary"
            : "text-foreground/60";
  const summary = (() => {
    switch (ev) {
      case "stage":
        return data.message;
      case "discovered":
        return `${data.count} posting link${data.count === 1 ? "" : "s"} discovered`;
      case "posting":
        return `${data.job_title || "posting"} @ ${data.company || "?"}`;
      case "extract_skip":
        return `skipped — ${data.reason ?? "not a posting"}`;
      case "extract_error":
        return `extraction error — ${data.detail ?? ""}`;
      case "extracted":
        return `${data.count} postings extracted`;
      case "warning":
        return `warning: ${data.message}`;
      case "ranked":
        return `ranked ${data.ranked?.length ?? 0} postings`;
      case "done":
        return data.message;
      case "error":
        return `error in ${data.where}: ${data.detail}`;
      default:
        return JSON.stringify(data).slice(0, 80);
    }
  })();
  return (
    <div
      className={cn("flex gap-2 py-[2px]", tone)}
      style={{ fontFamily: "JetBrains Mono, monospace" }}
    >
      <span className="text-foreground/40 shrink-0">
        {new Date().toLocaleTimeString("en-GB", { hour12: false })}
      </span>
      <span className="shrink-0 uppercase text-[10px] tracking-wider opacity-80 pt-[3px]">
        {ev}
      </span>
      <span className="text-foreground/80 truncate">{summary}</span>
    </div>
  );
}

// -------- page --------

const SAMPLE_TECH_RESUME = `Ayush Singh
Education: B.Tech in Computer Science and Engineering, Bharati Vidyapeeth College of Engineering, CGPA 8.9.
Technical Skills: Python, FastAPI, React 18, TypeScript, Tailwind CSS, PostgreSQL, PyTorch, LangChain, Distributed Crawling, Docker, Git.
Projects:
1. Pathfinder: Built an autonomous agentic internship crawler and ranking pipeline with multi-agent validation, Firecrawl, and FastAPI.
2. Deep Vision: Real-time computer vision system for low-latency object tracking with PyTorch and CUDA.
Experience: Software Engineering Intern at TechStart building real-time event streaming and backend REST microservices.`;

export function Pathfinder() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [seedsError, setSeedsError] = useState<string | null>(null);
  const [careersUrl, setCareersUrl] = useState("");
  const [maxJobs, setMaxJobs] = useState(8);

  const [resume, setResume] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeUploading, setResumeUploading] = useState(false);

  const [postings, setPostings] = useState<Posting[]>([]);
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const [agentStates, setAgentStates] = useState<Record<AgentId, AgentState>>({
    discovery: "idle",
    extraction: "idle",
    critic: "idle",
    matching: "idle",
  });
  const [isRunning, setIsRunning] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Array<{ ev: string; data: any; t: number }>>(
    []
  );
  const abortRef = useRef<AbortController | null>(null);
  const logBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchSeeds()
      .then(setSeeds)
      .catch((e) => setSeedsError(e.message));
  }, []);

  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  const scoreById = useMemo(() => {
    const m = new Map<string, Ranked>();
    for (const r of ranked) m.set(r.id, r);
    return m;
  }, [ranked]);

  const visible = useMemo(() => {
    const list = postings.filter((p) => !dismissed.has(p.id));
    if (!ranked.length) return list;
    return [...list].sort(
      (a, b) =>
        (scoreById.get(b.id)?.score ?? 0) - (scoreById.get(a.id)?.score ?? 0)
    );
  }, [postings, ranked, dismissed, scoreById]);

  async function handleFile(file: File) {
    setResumeUploading(true);
    setResumeName(file.name);
    try {
      setResume(await uploadResume(file));
    } catch (e: any) {
      setError(e.message);
      setResumeName("");
    } finally {
      setResumeUploading(false);
    }
  }

  function resetAgents() {
    setAgentStates({
      discovery: "idle",
      extraction: "idle",
      critic: "idle",
      matching: "idle",
    });
  }

  function handleEvent(ev: string, data: any) {
    setEvents((cur) =>
      // keep last 200 events to stop the log growing without bound
      [...cur.slice(-199), { ev, data, t: Date.now() }]
    );

    if (ev === "stage") {
      setStage(data.message ?? "");
      if (data.stage === "discovery") {
        setAgentStates((a) => ({ ...a, discovery: "running" }));
      }
      if (data.stage === "matching") {
        setAgentStates((a) => ({
          ...a,
          extraction: "done",
          critic: "done",
          matching: "running",
        }));
      }
    }
    if (ev === "discovered") {
      setStage(`Discovered ${data.count} postings`);
      setAgentStates((a) => ({
        ...a,
        discovery: "done",
        extraction: data.count ? "running" : a.extraction,
        critic: data.count ? "running" : a.critic,
      }));
    }
    if (ev === "posting") {
      setPostings((cur) => [...cur, data as Posting]);
    }
    if (ev === "extracted") {
      setAgentStates((a) => ({ ...a, extraction: "done", critic: "done" }));
    }
    if (ev === "warning") {
      setWarning(data.message as string);
    }
    if (ev === "ranked") {
      setRanked((data.ranked as Ranked[]) || []);
      setAgentStates((a) => ({ ...a, matching: "done" }));
    }
    if (ev === "done") {
      setStage(data.message ?? "complete");
    }
    if (ev === "error") {
      setError(`${data.where}: ${data.detail}`);
      setAgentStates((a) => ({ ...a, [data.where as AgentId]: "error" }));
    }
  }

  async function run() {
    if (!careersUrl.trim()) {
      setError("pick a portal or paste a careers URL first");
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsRunning(true);
    setError(null);
    setWarning(null);
    setStage("initialising agents…");
    setPostings([]);
    setRanked([]);
    setEvents([]);
    resetAgents();

    try {
      await streamPipeline({
        careersUrl,
        resume: resume || null,
        maxJobs,
        onEvent: handleEvent,
        signal: ctrl.signal,
      });
    } catch (e: any) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      setIsRunning(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    setIsRunning(false);
    setStage("stopped");
  }

  async function dismiss(id: string) {
    setDismissed((s) => new Set(s).add(id));
    try {
      await recordFeedback(id, "dismiss");
    } catch {
      // best-effort — the card is already hidden locally
    }
  }

  return (
    <div className="relative">
      <Helmet>
        <title>Pathfinder — Agentic Internship Discovery</title>
      </Helmet>

      {/* ================ HEADLINE ================ */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="h-4 w-4 text-primary" />
          <span
            className="text-[11px] uppercase tracking-[0.22em] text-foreground/60"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            agentic pipeline · v1
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl leading-[1.05] max-w-3xl">
          <span className="font-semibold">Find internships with</span>
          <br />
          <em
            style={{
              fontFamily: "Playfair Display, serif",
              fontStyle: "italic",
              fontWeight: 400,
            }}
            className="text-primary"
          >
            four specialist agents
          </em>
          <span className="font-semibold"> on every careers page.</span>
        </h1>
        <p className="mt-3 text-sm text-foreground/60 max-w-2xl">
          Autonomous multi-agent intelligence pipeline. Every stage is live — watch the agents
          discover, extract, verify, and match in real time.
        </p>
      </header>

      {/* ================ AGENT STEPPER ================ */}
      <section className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {AGENTS.map((a) => (
            <AgentTile
              key={a.id}
              meta={a}
              state={agentStates[a.id]}
              active={isRunning && agentStates[a.id] === "running"}
            />
          ))}
        </div>
      </section>

      {/* ================ CONTROL PANEL ================ */}
      <section className="mb-6 border border-foreground/10 rounded-[2px] bg-background">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-0 md:divide-x divide-foreground/10">
          {/* LEFT: portal + url */}
          <div className="p-5 space-y-4">
            <div>
              <label
                className="block text-[10px] uppercase tracking-[0.18em] text-foreground/60 mb-2"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                source portal
              </label>
              <select
                className="w-full h-10 px-3 bg-background text-sm border border-foreground/15 rounded-[2px] focus:outline-none focus:border-primary"
                value={careersUrl}
                onChange={(e) => setCareersUrl(e.target.value)}
                disabled={isRunning}
              >
                <option value="">
                  {seedsError
                    ? `— seeds unreachable (${seedsError}) —`
                    : "— choose a portal —"}
                </option>
                {seeds.map((s) => (
                  <option key={s.url} value={s.url}>
                    {s.name} · {new URL(s.url).host}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {seeds.slice(0, 5).map((s) => (
                  <button
                    key={s.url}
                    type="button"
                    onClick={() => setCareersUrl(s.url)}
                    disabled={isRunning}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-[2px] border transition-all cursor-pointer",
                      careersUrl === s.url
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-foreground/10 hover:border-foreground/25 text-foreground/60"
                    )}
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                className="block text-[10px] uppercase tracking-[0.18em] text-foreground/60 mb-2"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                or custom careers url
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
                <Input
                  type="url"
                  placeholder="https://company.com/careers"
                  className="pl-9 rounded-[2px] font-mono text-sm"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                  value={careersUrl}
                  onChange={(e) => setCareersUrl(e.target.value)}
                  disabled={isRunning}
                />
              </div>
            </div>
            <div>
              <label
                className="block text-[10px] uppercase tracking-[0.18em] text-foreground/60 mb-2"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                max jobs : {maxJobs}
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={maxJobs}
                onChange={(e) => setMaxJobs(parseInt(e.target.value, 10))}
                disabled={isRunning}
                className="w-full accent-primary"
              />
            </div>
          </div>

          {/* RIGHT: resume + run */}
          <div className="p-5 space-y-4 bg-foreground/[0.015]">
            <div>
              <label
                className="block text-[10px] uppercase tracking-[0.18em] text-foreground/60 mb-2"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                resume
              </label>
              <label
                className={cn(
                  "flex items-center gap-2 h-10 px-3 text-sm cursor-pointer border border-dashed rounded-[2px] transition-colors",
                  resumeName
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-foreground/20 hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                <Upload className="h-4 w-4" />
                <span className="flex-1 truncate">
                  {resumeUploading
                    ? "parsing pdf…"
                    : resumeName || "Drop PDF, .txt or .md"}
                </span>
                {resume && (
                  <span
                    className="text-[10px] text-foreground/50"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {resume.length.toLocaleString()} chars
                  </span>
                )}
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  className="hidden"
                  disabled={isRunning || resumeUploading}
                  onChange={(e) =>
                    e.target.files?.[0] && handleFile(e.target.files[0])
                  }
                />
              </label>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-foreground/50 leading-snug">
                  {resume ? `${resume.split(/\s+/).length} words parsed` : "Upload PDF or load pre-filled tech profile:"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResume(SAMPLE_TECH_RESUME);
                    setResumeName("Ayush_Singh_Resume.txt");
                  }}
                  disabled={isRunning}
                  className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  + load sample resume
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              {isRunning ? (
                <Button
                  onClick={stop}
                  variant="outline"
                  className="w-full h-11 rounded-[2px] border-destructive/50 text-destructive hover:bg-destructive/5"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  <Square className="mr-2 h-3.5 w-3.5 fill-current" />
                  ABORT
                </Button>
              ) : (
                <Button
                  onClick={run}
                  disabled={!careersUrl}
                  className="w-full h-11 rounded-[2px]"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                  RUN PIPELINE
                </Button>
              )}
            </div>
            {stage && (
              <div
                className="text-[11px] text-foreground/60 truncate"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                → {stage}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================ NOTIFICATIONS ================ */}
      {warning && (
        <div className="mb-4 flex items-start gap-3 border border-amber-500/40 bg-amber-500/5 px-4 py-3 rounded-[2px]">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div
              className="text-[10px] uppercase tracking-wider text-amber-600 mb-1"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              matching agent — insufficient resume
            </div>
            <div className="text-foreground/80">{warning}</div>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-start gap-3 border border-destructive/40 bg-destructive/5 px-4 py-3 rounded-[2px]">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div
            className="text-sm text-destructive"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {error}
          </div>
        </div>
      )}

      {/* ================ RESULTS + LOG ================ */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* results */}
        <div>
          {visible.length > 0 ? (
            <>
              <div className="flex items-baseline justify-between mb-3">
                <h2
                  className="text-[11px] uppercase tracking-[0.18em] text-foreground/60"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  postings · {visible.length}
                </h2>
                {ranked.length > 0 && (
                  <span
                    className="text-[11px] text-foreground/50"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    ranked by autonomous fit analysis
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {visible.map((p, i) => {
                  const r = scoreById.get(p.id);
                  return (
                    <article
                      key={p.id}
                      className="group grid grid-cols-[1fr_auto] gap-4 border border-foreground/10 hover:border-primary/40 transition-colors p-4 rounded-[2px] bg-background"
                      style={{
                        animation: `fadeUp 320ms ease-out ${Math.min(i, 6) * 40}ms both`,
                      }}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
                          <h3
                            className="text-xl leading-tight text-foreground"
                            style={{
                              fontFamily: "Playfair Display, serif",
                              fontStyle: "italic",
                              fontWeight: 400,
                            }}
                          >
                            {p.job_title || "untitled role"}
                          </h3>
                          <span className="text-sm text-foreground/60">
                            @ {p.company || "—"}
                          </span>
                        </div>
                        <div
                          className="text-[11px] uppercase tracking-[0.12em] text-foreground/50 mb-2"
                          style={{ fontFamily: "JetBrains Mono, monospace" }}
                        >
                          {[p.location, p.work_mode, p.compensation || null]
                            .filter(Boolean)
                            .join("  ·  ")}
                        </div>
                        {p.description_summary && (
                          <p className="text-sm text-foreground/80 mb-2">
                            {p.description_summary}
                          </p>
                        )}
                        {r?.reason && (
                          <p
                            className="text-[13px] text-primary/85 mb-2"
                            style={{
                              fontFamily: "Playfair Display, serif",
                              fontStyle: "italic",
                            }}
                          >
                            “{r.reason}”
                          </p>
                        )}
                        {p.key_skills && p.key_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {p.key_skills.slice(0, 10).map((s) => (
                              <Badge
                                key={s}
                                variant="outline"
                                className="rounded-[2px] font-normal text-[10px] py-0 px-1.5"
                                style={{
                                  fontFamily: "JetBrains Mono, monospace",
                                }}
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center justify-between gap-3">
                        {r ? (
                          <ScoreRing score={r.score} />
                        ) : (
                          <div
                            className="h-20 w-20 flex items-center justify-center text-foreground/30 text-[10px] uppercase tracking-wider"
                            style={{ fontFamily: "JetBrains Mono, monospace" }}
                          >
                            pending
                          </div>
                        )}
                        <div className="flex flex-col gap-1.5 w-full">
                          <Button
                            asChild
                            size="sm"
                            className="h-8 rounded-[2px] w-full"
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                            }}
                          >
                            <a
                              href={p.apply_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => recordFeedback(p.id, "apply")}
                            >
                              apply
                              <ExternalLink className="ml-1.5 h-3 w-3" />
                            </a>
                          </Button>
                          <Button
                            onClick={() => dismiss(p.id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 rounded-[2px] text-[11px] text-foreground/50 hover:text-destructive"
                          >
                            <X className="mr-1 h-3 w-3" /> dismiss
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyBoard isRunning={isRunning} />
          )}
        </div>

        {/* live event log */}
        <aside className="border border-foreground/10 rounded-[2px] bg-foreground/[0.02] h-fit lg:sticky lg:top-4">
          <div
            className="px-3 py-2 border-b border-foreground/10 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-foreground/60"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            <span>stream · {events.length}</span>
            {isRunning && (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                live
              </span>
            )}
          </div>
          <div className="p-3 h-[380px] overflow-y-auto text-[11px]">
            {events.length === 0 ? (
              <div
                className="text-foreground/40 py-16 text-center"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                no events yet.
                <br />
                run the pipeline to fill the log.
              </div>
            ) : (
              <>
                {events.map((e, i) => (
                  <EventLogLine key={i} ev={e.ev} data={e.data} />
                ))}
                <div ref={logBottomRef} />
              </>
            )}
          </div>
        </aside>
      </section>

      {/* stagger keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function EmptyBoard({ isRunning }: { isRunning: boolean }) {
  return (
    <div className="border border-dashed border-foreground/15 rounded-[2px] p-12 flex flex-col items-center justify-center text-center min-h-[280px]">
      <div
        className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 mb-3"
        style={{ fontFamily: "JetBrains Mono, monospace" }}
      >
        {isRunning ? "agents working" : "ready"}
      </div>
      <p
        className="text-xl max-w-md"
        style={{
          fontFamily: "Playfair Display, serif",
          fontStyle: "italic",
        }}
      >
        {isRunning
          ? "the pipeline is running. postings will appear here as extraction completes."
          : "pick a portal, upload your resume, hit run. the agents take it from there."}
      </p>
    </div>
  );
}

export default Pathfinder;
