# Pathfinder — Autonomous Multi-Agent Recruitment & Outreach Platform

Pathfinder is an autonomous, multi-agent platform engineered to crawl career portals, extract structured role data, audit schema integrity, and qualitatively rank candidate resumes for startup internship matching.

Everything runs in **one unified interface** at the root of the project with a high-performance Python FastAPI backend, real-time Server-Sent Events (SSE) streaming, zero required logins, and underlying AI models completely abstracted from the end user.

---

## Architecture Diagram

![Pathfinder Multi-Agent Architecture](docs/architecture.svg)

*A full editable Excalidraw diagram is also available in [`docs/architecture.excalidraw`](docs/architecture.excalidraw) for interactive presentations.*

---

## Key Capabilities

1. **4 Autonomous Specialist Agents**:
   - **Discovery Agent** (*Portal Crawler*): Traverses careers portals via Firecrawl to isolate live, direct job application URLs while eliminating boilerplate navigational links.
   - **Extraction Agent** (*Schema Engine*): Converts unstructured job descriptions into strict, typed schema (job title, compensation, location, work mode, key technical skills).
   - **Critic Agent** (*Integrity Auditor*): Audits extracted data directly against raw source text to patch hallucinations, verify work modes, and ensure link validity.
   - **Matching Agent** (*Fit Reasoner*): Performs deep qualitative reasoning comparing candidate resumes with role demands, outputting fit scores (0–100) and articulate explanations.
2. **Zero-Login Local Mode**: Seamlessly auto-hydrated with a local developer profile—no OAuth popups, Google sign-ins, or auth walls.
3. **Abstracted AI Infrastructure**: The user interface focuses entirely on functional capabilities. All underlying models and inference providers are abstracted away.
4. **Resilient Presentation Fail-Safe**: Built-in heuristic fallbacks ensure that live demonstrations will gracefully complete without errors even during network dips.
5. **Resume Builder & ATS Scoring**: In-browser ATS scoring feedback and Typst-powered instant PDF compilation.

---

## Directory Structure

```
minor-project/
├── backend/                       # Python 3.12 FastAPI backend
│   ├── agents/                    # Multi-agent implementations (Discovery, Extraction, Critic, Matching)
│   ├── routes/                    # API routes (pipeline, resume, seeds, feedback)
│   ├── storage/                   # SQLite database persistence & fingerprint deduplication
│   ├── config.py                  # Application settings & OpenRouter configuration
│   ├── main.py                    # FastAPI entrypoint & CORS setup
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # Backend API keys (Firecrawl, OpenRouter)
├── src/                           # Unified React frontend
│   ├── components/                # UI primitives, layout shells, modals
│   ├── contexts/                  # Local auth & theme stores
│   ├── pages/
│   │   └── dashboard/
│   │       ├── Pathfinder.tsx     # AI Job Matcher mission control (/app/pathfinder)
│   │       ├── Startups.tsx       # Curated startup database
│   │       ├── Resumes.tsx        # Typst PDF resume builder
│   │       └── ATScore.tsx        # ATS resume checker
│   └── services/                  # Pipeline SSE client & API helpers
├── docs/
│   └── architecture.excalidraw    # Visual system architecture diagram
├── package.json                   # Frontend dependencies & scripts
└── README.md                      # Documentation
```

---

## Getting Started

### Single-Command Start (Recommended)
Run one command to boot both the Vite frontend and the FastAPI backend concurrently with colored streaming logs:
```bash
npm run dev
# or
bun run dev
```

- **Pathfinder Dashboard**: [http://localhost:3000](http://localhost:3000) (or `/app/pathfinder`)
- **FastAPI API & Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)

### Manual Setup

#### 1. Backend (FastAPI)
```bash
python3.12 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
# Populate backend/.env using backend/.env.example as a guide.
backend/.venv/bin/python -m backend.run
```

#### 2. Frontend (Vite + React)
```bash
bun install
bun run dev
```

---

## Live Presentation Flow

1. Open [http://localhost:3000/app](http://localhost:3000/app). Notice that it immediately loads with zero login required.
2. Under **Source Portal**, choose one of the quick pills (e.g. `OpenAI`, `Stripe`, or `Wellfound`).
3. Under **Resume**, click `+ load sample resume` to load an instant engineering profile (or drop a candidate PDF).
4. Click **RUN PIPELINE**:
   - Watch the **Agent Stepper** cycle live: Discovery → Extraction → Critic → Matching.
   - Monitor the **Live Terminal Log** streaming real-time Server-Sent Events.
   - Review the resulting **Job Cards** with animated fit score rings, qualitative reason quotes, and skill chips.


## Company and people discovery

Open `/app/research`, or choose **Find people** on a matched job. Search companies
by name or description, then use **Find people** to prepare a search for that
employer. The startup directory and startup detail pages also link to this flow.

The backend uses `CONTEXT_DEV_API_KEY` in `backend/.env` for Context.dev. The key
is never sent to the browser. Search uses fast mode: people pages cost 10 credits
and company pages cost 2 credits. An identical query, country and cursor is
cached in SQLite for 24 hours. Nothing searches automatically when opening a
page. Additional pages require an explicit click.

People results contain public professional profiles, not email addresses. Add
a resume, choose **Generate outreach draft**, review and edit the result, then
copy it. Draft generation uses the configured OpenRouter model. The research
page does not send messages or update email-sent counters.

The development frontend runs on port **3000** and proxies `/api` to the local
backend on **8001**. Leave `VITE_PATHFINDER_API` empty for same-origin access,
including when opening the VPS frontend from another device.

Validate the integration with real provider calls (at most one people page and
one company page, 12 Context credits; cached repeats cost no additional credits):

```bash
backend/.venv/bin/python scripts/verify_context.py
```
