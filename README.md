# Pathfinder — Multi-Agent Internship Discovery & Outreach Platform

Pathfinder is an autonomous, multi-agent AI platform designed to discover, extract, audit, and intelligently match students with startup internship opportunities.

Built with a modern web architecture, streaming real-time Server-Sent Events (SSE), and powered by Google Gemini Flash via OpenRouter for high-speed, cost-effective reasoning.

---

## System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Client Applications      │
                                  ├───────────────┬───────────────┤
                                  │  Pathfinder   │    Matcher    │
                                  │ (Vite / React)│  (Next.js 15) │
                                  │   Port 5173   │   Port 3001   │
                                  └───────┬───────┴───────┬───────┘
                                          │               │
                                          ▼               ▼
                        ┌──────────────────────────────────────────────────┐
                        │          FastAPI Streaming Backend               │
                        │                  (Port 8000)                     │
                        └─────────────────────────┬────────────────────────┘
                                                  │
                ┌─────────────────────────────────┴─────────────────────────────────┐
                ▼                                 ▼                                 ▼
       ┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
       │ Discovery Agent │               │Extraction Agent │               │  Critic Agent   │
       │ (Gemini Flash)  │               │ (Gemini Flash)  │               │ (Gemini Flash)  │
       │ Scrapes portals │               │ Structured JSON │               │ Audits schemas  │
       └────────┬────────┘               └────────┬────────┘               └────────┬────────┘
                │                                 │                                 │
                └─────────────────────────────────┼─────────────────────────────────┘
                                                  ▼
                                       ┌─────────────────────┐
                                       │   Matching Agent    │
                                       │(Gemini 2.5 Flash)   │
                                       │ Ranks with reasons  │
                                       └──────────┬──────────┘
                                                  │
                                                  ▼
                                       ┌─────────────────────┐
                                       │ SQLite Database / DB│
                                       │   (pathfinder.db)   │
                                       └─────────────────────┘
```

---

## Features

- 🤖 **4-Stage Agentic Pipeline**:
  1. **Discovery Agent**: Traverses career pages (Wellfound, Y Combinator, AngelList, etc.) via Firecrawl and isolates valid job application URLs.
  2. **Extraction Agent**: Transforms raw scraped markdown into validated, schema-compliant job postings (job title, compensation, location, work mode, key technical skills).
  3. **Critic Agent**: Audits extracted fields against the raw source text to patch hallucinations, verify work modes, and guarantee link integrity.
  4. **Matching Agent**: Performs deep qualitative reasoning comparing candidate resumes with role requirements, producing match percentages and natural-language explanations.
- ⚡ **Live SSE Streaming**: Watch each agent report its progress, discoveries, extractions, and evaluations in real time with zero buffering.
- 📄 **Resume Scoring & Typst PDF Compilation**: Integrated ATS resume quality analysis and on-the-fly PDF resume generation.
- 🏢 **Curated Startup Directory**: Browse verified startups with sector tags, direct email outreach templates, and recruitment contacts.
- 🛡️ **Fail-Safe Offline Mode**: Built-in heuristic fallbacks ensuring live panel presentations never fail even under network or quota restrictions.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Pathfinder Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Radix UI primitives, Supabase |
| **Scraper Frontend** | Next.js 15 (App Router, Turbopack), React 19, TypeScript, Lucide Icons |
| **Backend & Pipeline** | FastAPI, Python 3.12, Pydantic v2, aiosqlite, Firecrawl API |
| **AI Models** | Google Gemini 2.5 Flash & Flash-Lite via OpenRouter (fast, low-latency, cost-effective) |
| **Package Managers** | Bun (Vite frontend), pnpm (Next.js frontend), uv (Python virtual environment) |

---

## Quick Start (Showcase Setup)

### Automated Launch (All Services)
A single command boots the entire stack:
```bash
./start.sh
```

This starts:
- **Pathfinder Dashboard**: [http://localhost:5173](http://localhost:5173) (or `/app/pathfinder`)
- **Scraper / Matcher UI**: [http://localhost:3001](http://localhost:3001)
- **FastAPI API & Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Manual Launch (Separate Terminals)

#### 1. Scraper Backend (Python 3.12 FastAPI)
```bash
cd scraper
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

#### 2. Pathfinder Dashboard (React + Vite)
```bash
cd otter
bun install
bun run dev
```

#### 3. AI Matcher UI (Next.js 15)
```bash
cd scraper/frontend
pnpm install
pnpm dev -p 3001
```

---

## Environment Configuration

Sample templates are provided as `.env.example` in each folder:

### `scraper/.env`
```env
FIRECRAWL_API_KEY=fc-...
OPENROUTER_API_KEY=sk-or-v1-...
```

### `otter/.env`
```env
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_OPENROUTER_API_KEY=sk-or-v1-...
```

---

## Demonstration Script for Presentation

1. **Open the Agentic Pipeline**: Navigate to `http://localhost:3001` (or `http://localhost:5173/app/pathfinder`).
2. **Upload a Candidate Resume**: Select a student resume PDF (or click and paste a software engineering resume).
3. **Select a Career Portal Seed**: Pick from pre-seeded verified portals (e.g. *OpenAI*, *Wellfound*, *Stripe*).
4. **Run Live Agents**: Click **Run Pipeline** and demonstrate:
   - **Discovery Agent**: Scrapes the portal live and announces discovered posting URLs.
   - **Extraction Agent**: Streams job cards as they are parsed with skills and work modes.
   - **Critic Agent**: Audits and verifies details against source markdown.
   - **Matching Agent**: Produces ranked score rings with full explanatory reasoning on candidate fit.
