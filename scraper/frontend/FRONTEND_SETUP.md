# Frontend Setup Guide

## Quick Start

### 1. Install Dependencies (if not done)
```bash
cd frontend
pnpm install
```

### 2. Configure Backend URL

The frontend is already configured to connect to `http://localhost:8000` (your FastAPI backend).

If you need to change this, create a `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start the Development Server
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 4. Start the Backend (in another terminal)
```bash
# From the project root
cd ..
python run.py
```

The API will be available at `http://localhost:8000`

## Features Implemented

### ✨ Single Page Application
- Clean, modern UI with gradient background
- Fully responsive design (mobile, tablet, desktop)
- Real-time progress updates

### 📝 Resume Input
- Large textarea for resume entry
- Form validation
- Disabled state during processing

### 🔄 Progressive Job Streaming
Jobs appear as they're processed:
1. **Stage 1**: Scraping - Shows "Found X job listings"
2. **Stage 2**: Extracting - Jobs appear in real-time as data is extracted
3. **Stage 3**: Matching - AI analyzes resume against jobs
4. **Stage 4**: Complete - Top matches highlighted

### 🎯 Top Matches Section
- Highlighted with yellow accent
- "Top Match" badge
- Displays recommended jobs first
- Automatic skill matching

### 📊 All Jobs Section
- Grid layout (responsive)
- Job cards with key information:
  - Job title
  - Organization/Division
  - Location
  - Compensation
  - Key skills (up to 4, with +N indicator)
- Apply buttons with external link icons
- Recommended jobs marked with sparkle icon

### 🎨 UI Components Used
- **Button** - Primary actions
- **Textarea** - Resume input
- **Card** - Job listings and sections
- **Badge** - Skills and labels
- **Icons** - Lucide React icons

## How It Works

### API Integration Flow

```typescript
1. User enters resume and clicks "Find Matching Jobs"
2. Frontend calls API in stages:
   
   Stage 1: POST /api/scrape-jobs
   ↓
   Updates UI: "Found 30 job listings"
   
   Stage 2: POST /api/extract-job-details
   ↓
   Jobs appear progressively as extracted
   
   Stage 3: POST /api/match-jobs
   ↓
   AI analyzes resume
   
   Stage 4: Complete
   ↓
   Top matches highlighted at top
   All jobs displayed below
```

### Progressive Updates

The `api.ts` file handles the streaming-like experience by:
1. Making sequential API calls
2. Calling `onProgress` callback after each stage
3. Updating the UI with partial results
4. Showing loading states between stages

### State Management

```typescript
- resume: string           // User's resume text
- isLoading: boolean       // Processing state
- progress: ScrapeProgress // Current stage info
- extractedJobs: []        // All jobs found
- recommendedJobs: []      // AI-matched top jobs
- error: string | null     // Error messages
```

## Customization

### Change Backend URL

Edit `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Adjust Job Limits

In `app/page.tsx`, modify the `fullScrape` call:
```typescript
await jobScraperAPI.fullScrape(
  resume,
  "https://openai.com/careers/search",
  30,  // maxJobs - change this
  3,   // topN recommendations - change this
  onProgress
);
```

### Change Jobs Page URL

Pass a different URL to scrape:
```typescript
await jobScraperAPI.fullScrape(
  resume,
  "https://example.com/careers",  // Custom URL
  30,
  3,
  onProgress
);
```

### Customize Colors

The app uses Tailwind CSS. Key colors:
- **Primary**: Default Shadcn theme
- **Accent**: Yellow for top matches
- **Background**: Slate gradient

Edit `app/globals.css` to customize theme colors.

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx           # Main application page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   └── ui/                # Shadcn UI components
│       ├── button.tsx
│       ├── textarea.tsx
│       ├── card.tsx
│       └── badge.tsx
├── lib/
│   ├── utils.ts           # Utility functions
│   └── api.ts             # API client
└── .env.local             # Environment variables (create this)
```

## API Client Usage

The API client in `lib/api.ts` can be used independently:

```typescript
import { jobScraperAPI } from '@/lib/api';

// With progress callback
const result = await jobScraperAPI.fullScrape(
  resume,
  jobsPageUrl,
  maxJobs,
  topN,
  (progress) => {
    console.log(progress.message);
    if (progress.extracted_jobs) {
      // Update UI with jobs
    }
  }
);

// Access results
console.log(result.recommended_jobs);
console.log(result.extracted_jobs);
console.log(result.stats);
```

## Troubleshooting

### CORS Errors
Make sure the backend is running and CORS is properly configured:
```python
# backend/main.py should have:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API Connection Failed
1. Check backend is running: `http://localhost:8000/health`
2. Verify `.env.local` has correct URL
3. Check browser console for errors

### Jobs Not Appearing
1. Check backend logs for errors
2. Verify API keys are set in backend `.env`
3. Check network tab in browser DevTools

## Production Deployment

### Frontend (Vercel)
```bash
# Build the app
pnpm build

# Deploy to Vercel
vercel deploy
```

Set environment variable in Vercel:
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

### Backend
Update CORS origins in `backend/config.py`:
```python
cors_origins: list[str] = ["https://your-frontend.vercel.app"]
```

## Development Tips

1. **Hot Reload**: Both Next.js and FastAPI support hot reload
2. **API Docs**: Visit `http://localhost:8000/docs` for interactive API testing
3. **Type Safety**: TypeScript types are synced with backend Pydantic models
4. **Debugging**: Use browser DevTools Network tab to inspect API calls

## Next Steps

1. ✅ Backend connected
2. ✅ UI components created
3. ✅ Progressive loading implemented
4. 🔲 Add error retry logic
5. 🔲 Add job filtering/search
6. 🔲 Add save/export functionality
7. 🔲 Add authentication
8. 🔲 Add job comparison feature

