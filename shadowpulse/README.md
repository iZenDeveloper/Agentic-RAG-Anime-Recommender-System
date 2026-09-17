# ShadowPulse

Web app that scans public visibility / shadowban signals across
**X · Instagram · TikTok · Facebook · Threads**.

Aligned with PRD v0.1: every signal returns
`Clear / Restricted / Inconclusive / N/A`, plus confidence, evidence, and an
official-check CTA.

## Run locally

```bash
cd shadowpulse
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

`POST /api/scan`

```json
{ "handle": "elonmusk", "platforms": ["x", "instagram"] }
```

Free rate limit: 5 checks/IP/day, 1 check/handle/3 minutes.

## Principles

- Probe public data only — no user password OAuth.
- If it cannot be measured → **Inconclusive**, never invent Restricted.
- Visibility Score uses measurable signals only.
