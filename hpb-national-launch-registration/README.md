# HPB National Launch 2026 — Registration & Reception System

A secure, mobile-first advance registration and reception check-in system for the
HPB National Launch 2026 (15 July 2026, Jasmine Hall, BMICH).

## Architecture

```
Participant browser
  → Netlify React frontend (this repo, /src)
    → Netlify serverless function  /.netlify/functions/register
      → Google Apps Script Web App  (apps-script/Code.gs)
        → Private Google Sheet       (Registrations, CheckIn_Log, Audit_Log, …)
```

The browser never contacts Google Sheets or Apps Script directly. Secrets (the
Apps Script URL, the shared token, the Sheet ID) live only in Netlify
environment variables and Apps Script properties — never in frontend code.

Reception staff use a **separate** authenticated interface served by Apps Script
HTML Service (`apps-script/Staff.html`), restricted to an email allowlist. It is
not part of the public site navigation.

## What is included

- Full React + TypeScript + Vite participant frontend: landing → 4-step
  register → review → confirmation, plus privacy and help pages.
- Client + server validation for Sri Lankan NIC (old & new), passport, mobile,
  email; normalisation on both sides.
- Netlify function gateway with honeypot, optional Cloudflare Turnstile,
  payload limits, no-PII logging, and no secret exposure.
- Google Apps Script backend: `register` action with token check, `LockService`
  duplicate protection, unique `HPB-2026-000123` references, audit log, optional
  confirmation email with `.ics` attachment.
- Google Sheet initialisation (`setupSpreadsheet`) with headers, frozen row and
  dropdown validation.
- Staff reception interface: search, identity-check, arrival, seat, signature
  status, duplicate-check-in prevention, audit logging.
- Google Calendar link + standards-compliant `.ics` (Asia/Colombo, arrival
  1.00 p.m., end 5.30 p.m., agenda URL in the description).
- Personal check-in QR containing only the registration reference.
- PWA shell caching that never caches registration or confirmation data.

## Local setup

```bash
npm install
npm run dev          # participant frontend (functions need `netlify dev`)
```

To run the function locally, use the Netlify CLI:

```bash
npm i -g netlify-cli
netlify dev          # serves the site + /.netlify/functions/register
```

## Build

```bash
npm run build        # tsc -b && vite build  →  dist/
npm run preview
```

## Deployment (summary)

1. **Google Sheet** — create a Sheet, copy its ID.
2. **Apps Script** — see `docs/APPS_SCRIPT_DEPLOYMENT.md`. Paste `Code.gs` +
   `Staff.html` + `appsscript.json`, set Script properties, run
   `setupSpreadsheet`, deploy as a Web App, copy the `/exec` URL.
3. **Netlify** — connect the repo (or drag `dist`), set environment variables
   from `.env.example`, deploy. See `docs/DEPLOYMENT.md`.
4. Set `VITE_PUBLIC_SITE_URL` to the final Netlify address and redeploy.

The public programme agenda stays separate:
`https://national-launch-agenda.netlify.app`.

## Environment variables

Server-side (Netlify, never exposed): `GOOGLE_APPS_SCRIPT_URL`,
`REGISTRATION_API_TOKEN`, `PUBLIC_SITE_URL`, `REGISTRATION_OPEN`,
`REGISTRATION_DEADLINE`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`.

Frontend (public, `VITE_` prefix): `VITE_PUBLIC_SITE_URL`, `VITE_AGENDA_URL`,
`VITE_TURNSTILE_SITE_KEY`, `VITE_REGISTRATION_OPEN`.

See `.env.example`.

## Documentation

- `docs/DEPLOYMENT.md` — Netlify deployment.
- `docs/APPS_SCRIPT_DEPLOYMENT.md` — Apps Script + Sheet setup.
- `docs/RECEPTION_GUIDE.md` — reception-staff operating guide.
- `docs/PRIVACY_CONFIG.md` — privacy & data-retention configuration.
- `docs/SHEET_SPECIFICATION.md` — Google Sheet column specification.
- `docs/TESTING_REPORT.md` — what was verified in this build.

## Privacy & communication rules

No participant-facing page, email or message states or implies that information
is collected for security purposes. Information is described only in terms of
registration, participant verification at reception, seating and event
coordination. Identity-document images are never requested. No PII appears in
URLs, QR codes, or logs.
