"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Posting, Ranked, Seed,
  fetchSeeds, uploadResume, streamPipeline, recordFeedback,
} from "@/lib/api";
import {
  Briefcase, ExternalLink, Loader2, Sparkles, CheckCircle2, Upload, X,
} from "lucide-react";

export default function Home() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [careersUrl, setCareersUrl] = useState("");
  const [resume, setResume] = useState<string>("");
  const [resumeName, setResumeName] = useState<string>("");
  const [postings, setPostings] = useState<Posting[]>([]);
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [stage, setStage] = useState<string>("");
  const [isLoading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSeeds().then(setSeeds).catch(() => {});
  }, []);

  const scoreById = useMemo(() => {
    const m = new Map<string, Ranked>();
    for (const r of ranked) m.set(r.id, r);
    return m;
  }, [ranked]);

  const visible = useMemo(() => {
    const list = postings.filter((p) => !dismissed.has(p.id));
    if (!ranked.length) return list;
    return [...list].sort(
      (a, b) => (scoreById.get(b.id)?.score ?? 0) - (scoreById.get(a.id)?.score ?? 0),
    );
  }, [postings, ranked, dismissed, scoreById]);

  async function handleFile(file: File) {
    try {
      setResumeName(file.name);
      setResume(await uploadResume(file));
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function run() {
    if (!careersUrl.trim()) return setErr("pick a portal or paste a URL");
    setLoading(true); setErr(null); setPostings([]); setRanked([]); setStage("starting");
    try {
      await streamPipeline(careersUrl, resume || null, 10, (ev, data) => {
        if (ev === "stage") setStage(data.message);
        if (ev === "discovered") setStage(`Discovered ${data.count} postings`);
        if (ev === "posting") setPostings((cur) => [...cur, data]);
        if (ev === "ranked") setRanked(data.ranked);
        if (ev === "done") setStage(data.message);
        if (ev === "error" || ev === "extract_error") setErr(`${ev}: ${JSON.stringify(data)}`);
      });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function dismiss(id: string) {
    setDismissed((s) => new Set(s).add(id));
    await recordFeedback(id, "dismiss");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Pathfinder</h1>
          <p className="text-muted-foreground">Agentic internship discovery — Gemini + OpenAI + Claude via OpenRouter.</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Start a pipeline</CardTitle>
            <CardDescription>Pick a portal (or paste any careers URL), upload your resume, run.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <select
                className="border rounded-md h-10 px-3 bg-background text-sm"
                value={careersUrl}
                onChange={(e) => setCareersUrl(e.target.value)}
                disabled={isLoading}
              >
                <option value="">— choose a portal —</option>
                {seeds.map((s) => (
                  <option key={s.url} value={s.url}>{s.name}</option>
                ))}
              </select>
              <Input
                placeholder="…or paste any careers URL"
                value={careersUrl}
                onChange={(e) => setCareersUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <label className="flex items-center gap-2 border rounded-md h-10 px-3 text-sm cursor-pointer hover:bg-accent">
              <Upload className="h-4 w-4" />
              <span className="flex-1 truncate">{resumeName || "Upload resume (PDF / .txt)"}</span>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                className="hidden"
                disabled={isLoading}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>

            {err && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{err}</div>}

            <Button onClick={run} disabled={isLoading || !careersUrl} className="w-full" size="lg">
              {isLoading
                ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{stage || "Running…"}</>)
                : (<><Sparkles className="mr-2 h-4 w-4" />Run pipeline</>)}
            </Button>
          </CardContent>
        </Card>

        {stage && (
          <Card className="mb-6 border-primary/50">
            <CardContent className="pt-6 flex items-center gap-3">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />}
              <div className="font-medium">{stage}</div>
            </CardContent>
          </Card>
        )}

        {visible.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold">Results</h2>
              <Badge variant="secondary">{visible.length} postings</Badge>
            </div>
            <div className="grid gap-3">
              {visible.map((p) => {
                const r = scoreById.get(p.id);
                return (
                  <Card key={p.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg truncate">{p.job_title || "(untitled role)"}</h3>
                            {r && <Badge>{Math.round(r.score)}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {[p.company, p.location, p.work_mode].filter(Boolean).join(" · ")}
                          </p>
                          {p.description_summary && (
                            <p className="text-sm mt-2 line-clamp-2">{p.description_summary}</p>
                          )}
                          {r?.reason && (
                            <p className="text-xs italic text-primary/80 mt-2">AI match: {r.reason}</p>
                          )}
                          {p.key_skills?.length ? (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {p.key_skills.slice(0, 8).map((s) => (
                                <Badge key={s} variant="outline">{s}</Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button asChild size="sm">
                            <a href={p.apply_link} target="_blank" rel="noopener noreferrer">
                              Apply <ExternalLink className="ml-2 h-3 w-3" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => dismiss(p.id)}>
                            <X className="h-3 w-3 mr-1" /> Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {!isLoading && !postings.length && (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready when you are.</h3>
              <p className="text-muted-foreground">Pick a portal and hit Run.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
