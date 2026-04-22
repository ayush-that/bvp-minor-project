export type Posting = {
  id: string;
  job_title?: string;
  company?: string;
  location?: string;
  work_mode?: string;
  compensation?: string;
  key_skills?: string[];
  description_summary?: string;
  apply_link: string;
};

export type Ranked = { id: string; score: number; reason: string };

export type Seed = { name: string; url: string };

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchSeeds(): Promise<Seed[]> {
  const r = await fetch(`${API}/api/seeds`);
  const j = await r.json();
  return j.seeds;
}

export async function uploadResume(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API}/api/resume`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`resume upload failed: ${r.status}`);
  const j = await r.json();
  return j.resume as string;
}

export async function recordFeedback(postingId: string, action: "save" | "apply" | "dismiss" | "view") {
  await fetch(`${API}/api/feedback/${encodeURIComponent(postingId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

type SSEHandler = (event: string, data: any) => void;

export async function streamPipeline(
  careersUrl: string,
  resume: string | null,
  maxJobs: number,
  onEvent: SSEHandler,
  signal?: AbortSignal,
) {
  const res = await fetch(`${API}/api/pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ careers_url: careersUrl, resume, max_jobs: maxJobs }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`pipeline failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const lines = chunk.split("\n");
      let event = "message";
      let dataRaw = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataRaw += line.slice(5).trim();
      }
      if (!dataRaw) continue;
      try {
        onEvent(event, JSON.parse(dataRaw));
      } catch {
        onEvent(event, dataRaw);
      }
    }
  }
}
