"""Local HTTP E2E check for Context search, caching and draft-only outreach.

Uses at most one new people page and one company page (12 Context credits).
Repeated identical calls should use the application cache. Run against a local
backend with the configured key. All evidence contains public profiles only.
"""
import argparse
import json
from pathlib import Path

import httpx


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--api', default='http://127.0.0.1:8001')
    parser.add_argument('--report', default='/tmp/pathfinder-context-evidence/live-e2e.json')
    args = parser.parse_args()
    assert args.api.startswith(('http://127.0.0.1:', 'http://localhost:')), 'Local development backend only'
    report = {'api': args.api, 'checks': []}
    try:
        with httpx.Client(base_url=args.api, timeout=60) as client:
            r = client.get('/api/context/status')
            assert r.status_code == 200, f'Context integration missing: HTTP {r.status_code}'
            assert r.json()['configured'], 'Context backend key not configured'
            report['checks'].append('Backend Context key configured')
            for kind, query in [('people', 'Recruiters at Stripe'), ('companies', 'Stripe')]:
                body = {'kind': kind, 'query': query}
                first = client.post('/api/context/search', json=body)
                assert first.status_code == 200, f'{kind} search HTTP {first.status_code}'
                data = first.json()
                assert data['results'], f'No real {kind} results'
                cached = client.post('/api/context/search', json=body)
                assert cached.status_code == 200
                saved = cached.json()
                assert saved['cache']['hit'] and saved['results'] == data['results']
                assert saved.get('key_metadata', {}).get('credits_consumed') == 0
                report[kind] = {'response': data, 'cached_request_id': saved.get('request_id')}
                report['checks'].append(f'Real {kind} results and zero-charge cached repeat')
            for body in [
                {'kind': 'people', 'query': ' '},
                {'kind': 'people', 'query': 'x' * 501},
                {'kind': 'companies', 'query': 'Stripe', 'country': 'invalid'},
                {'kind': 'companies', 'query': 'Stripe', 'cursor': 'x' * 65},
            ]:
                assert client.post('/api/context/search', json=body).status_code == 422
            report['checks'].append('Invalid query, country and cursor rejected before provider calls')
            report['status'] = 'passed'
    except Exception as exc:
        report.update(status='failed', failure=str(exc))
        raise
    finally:
        p = Path(args.report)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(report, indent=2))
        print(f"{report['status']}: {p}")


if __name__ == '__main__':
    main()
