#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Starting Pathfinder (Unified Architecture) ==="

# 1. Start Scraper & Multi-Agent FastAPI Backend
echo "Starting FastAPI Agentic Backend on http://localhost:8000..."
(cd "$DIR/scraper" && .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload) &
BACKEND_PID=$!

# 2. Start Unified Pathfinder Frontend
echo "Starting Unified Pathfinder Dashboard on http://localhost:5173..."
(cd "$DIR/otter" && bun run dev --port 5173) &
OTTER_PID=$!

cleanup() {
  echo ""
  echo "Shutting down services..."
  kill $BACKEND_PID $OTTER_PID 2>/dev/null || true
  wait $BACKEND_PID $OTTER_PID 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo ""
echo "Unified System Running:"
echo "  - Unified Dashboard (AI Matcher & Startups): http://localhost:5173"
echo "  - FastAPI Streaming Agent Backend:           http://localhost:8000 (docs at /docs)"
echo ""
echo "Press Ctrl+C to stop all services."
wait
