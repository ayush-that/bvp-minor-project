"""Local HTTP E2E check. Run with backend/.venv/bin/python scripts/verify_pipeline.py.

Use --careers-url to exercise real Firecrawl and OpenRouter calls before checking
restore and reranking. The backend should use a disposable SQLITE_PATH.
"""
import argparse
import json
from pathlib import Path

import httpx


RESUME = """Demonstration candidate, computer science student completing a bachelor's
degree. Skills include Python, FastAPI, React, TypeScript, SQL, PostgreSQL, Docker,
Git and Linux. Built a job discovery system with asynchronous APIs, structured
data extraction and resume matching. Completed a software engineering internship
developing REST endpoints, testing database queries and improving frontend
accessibility. Seeking an engineering internship to build reliable web services."""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api", default="http://127.0.0.1:8000")
    parser.add_argument("--careers-url")
    parser.add_argument("--report", default="/tmp/pathfinder-wiring-evidence/e2e.json")
    args = parser.parse_args()
    assert args.api.startswith(("http://127.0.0.1:", "http://localhost:")), "Local backend only"
    report = {"api": args.api, "live_portal": args.careers_url, "checks": []}
    try:
        with httpx.Client(base_url=args.api, timeout=240) as client:
            response = client.get("/api/postings")
            assert response.status_code == 200, f"Restore endpoint: HTTP {response.status_code}"
            report["checks"].append("Persisted postings API available")
            if args.careers_url:
                events = []
                with client.stream("POST", "/api/pipeline", json={
                    "careers_url": args.careers_url, "resume": RESUME, "max_jobs": 2,
                }) as response:
                    assert response.status_code == 200
                    event = ""
                    for line in response.iter_lines():
                        if line.startswith("event:"):
                            event = line[6:].strip()
                        elif line.startswith("data:"):
                            events.append({"event": event, "data": json.loads(line[5:])})
                report["events"] = events
                assert not any(e["event"] == "error" for e in events), "Pipeline emitted an error"
                postings = [e["data"] for e in events if e["event"] == "posting"]
                assert postings, "No live postings extracted"
                for stage in ["extraction", "critic"]:
                    assert any(e["event"] == "agent" and e["data"]["stage"] == stage for e in events)
                assert all(p["audit"]["status"] in ["verified", "corrected"] for p in postings)
                assert any(e["event"] == "ranked" and e["data"]["ranked"] for e in events)
                report["checks"].append("Live discovery, extraction, critic and matching streamed")

            postings = client.get("/api/postings").json()["postings"]
            assert postings, "Run with --careers-url to populate the disposable database"
            report["restored_postings"] = postings
            assert all(p.get("description_summary") and p.get("audit") for p in postings)
            ids = [p["id"] for p in postings]
            assert len(ids) == len(set(ids)), "Duplicate persisted IDs"
            report["checks"].append("Jobs, summaries and critic audits restored without scraping")

            response = client.post("/api/postings/match", json={"posting_ids": ids, "resume": RESUME})
            assert response.status_code == 200, f"Rerank HTTP {response.status_code}"
            ranked = response.json()["ranked"]
            assert {r["id"] for r in ranked} == set(ids)
            assert all(0 <= r["score"] <= 100 and r["reason"] for r in ranked)
            report["reranked"] = ranked
            report["checks"].append("Stored jobs reranked with real model explanations")

            for payload in [
                {"posting_ids": [], "resume": RESUME},
                {"posting_ids": ids, "resume": " "},
            ]:
                assert client.post("/api/postings/match", json=payload).status_code == 422
            assert client.post("/api/postings/match", json={
                "posting_ids": ["nonexistent"], "resume": RESUME,
            }).status_code == 404
            report["checks"].append("Empty requests and unknown posting IDs rejected")
            report["status"] = "passed"
    except Exception as exc:
        report["status"] = "failed"
        report["failure"] = str(exc)
        raise
    finally:
        path = Path(args.report)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(report, indent=2))
        print(f"{report['status']}: {path}")


if __name__ == "__main__":
    main()
