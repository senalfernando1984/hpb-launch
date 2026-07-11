# Testing & Validation Report

Automated checks run against this build (in the container).

## Compliance — participant-facing language
- No occurrence of: security clearance, security screening, security
  verification, security requirement, security purpose, security coordination,
  security list, Prime Minister's security, VIP security, police verification —
  in the built bundle or any participant-facing source. **PASS**
- Frontend never states the event "starts at 1.00 p.m." **PASS**
- Arrival 1.00 p.m. and commencement 1.30 p.m. both present and distinct. **PASS**

## Secret exposure
- No Google Sheets / Apps Script URL in the frontend bundle. **PASS**
- No API-token literal in the frontend bundle. **PASS**
- Browser posts only to `/.netlify/functions/register`. **PASS**

## Validation (unit, runtime)
- NIC old format `921234567V` valid; lowercase normalised to `V`. **PASS**
- NIC new format `199212345678` valid. **PASS**
- NIC with spaces normalised and validated. **PASS**
- Invalid NIC `12345` rejected. **PASS**
- Passport `N1234567` valid. **PASS**
- Mobile `0771234567` and `+94 77 123 4567` valid; normalised. **PASS**
- Mobile `123` rejected. **PASS**
- Email valid/invalid discrimination. **PASS**
- Empty form yields 12 field errors. **PASS**
- Server function mirrors all of the above (defence in depth).

## Calendar
- `.ics` uses `TZID=Asia/Colombo`, `DTSTART …130000`, `DTEND …173000`,
  includes the agenda URL and two `VALARM` reminders. **PASS**
- Google Calendar link uses `action=TEMPLATE`, `ctz=Asia/Colombo`, and carries
  no PII before the description. **PASS**

## Rendering (jsdom)
- Landing, register, privacy, help render with no runtime errors. **PASS**
- Agenda button: `target="_blank"`, `rel="noopener noreferrer"`, correct href,
  opens the separate agenda app. **PASS**
- Register step 1 shows, honeypot present, progressbar present. **PASS**
- Privacy notice lists all stated purposes and contains no security language.

## Build
- `tsc -b` clean (strict). **PASS**
- `vite build` succeeds; PWA service worker generated. **PASS**
- Netlify function typechecks against `@netlify/functions`. **PASS**

## Not exercised in this environment (require live services)
The following need real Google/Netlify credentials and were implemented to spec
but not executed here: end-to-end submission to Apps Script, `LockService`
duplicate detection, confirmation-email delivery, staff allowlist enforcement,
digital-signature Drive upload, and CSV export. Follow `docs/DEPLOYMENT.md` and
`docs/APPS_SCRIPT_DEPLOYMENT.md`, then run the live test checklist in the master
specification before declaring the system production-ready.
