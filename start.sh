#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Starting Minor Project Services ==="

# 1. Start Scraper FastAPI Backend
echo "Starting Firecrawl Scraper Backend on http://localhost:8000..."
(cd "$DIR/scraper" && .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload) &
BACKEND_PID=$!

# 2. Start Scraper Next.js Frontend
echo "Starting Scraper Frontend on http://localhost:3001..."
(cd "$DIR/scraper/frontend" && pnpm exec next dev -p 3001) &
SCRAPER_FE_PID=$!

# 3. Start Pathfinder (Otter) Vite Frontend
echo "Starting Pathfinder on http://localhost:5173..."
(cd "$DIR/otter" && bun run dev --port 5173) &
OTTER_PID=$!

cleanup() {
  echo ""
  echo "Shutting down services..."
  kill $BACKEND_PID $SCRAPER_FE_PID $OTTER_PID 2>/dev/null || true
  wait $BACKEND_PID $SCRAPER_FE_PID $OTTER_PID 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo ""
echo "All services running:"
echo "  - Pathfinder App:       http://localhost:5173"
echo "  - Scraper Frontend:     http://localhost:3001"
echo "  - Scraper FastAPI API:  http://localhost:8000 (docs at /docs)"
echo ""
echo "Press Ctrl+C to stop all services."
wait
