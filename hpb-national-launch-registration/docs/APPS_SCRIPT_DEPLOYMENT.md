# Google Apps Script + Sheet Deployment

## 1. Create the Google Sheet
1. Create a new Google Sheet in the organiser's Google account.
2. Copy the Sheet ID from the URL: `docs.google.com/spreadsheets/d/<SHEET_ID>/edit`.

## 2. Create the Apps Script project
1. From the Sheet: **Extensions ▸ Apps Script** (or create a standalone script).
2. Add three files matching `apps-script/`:
   - `Code.gs`  (paste the contents)
   - `Staff.html` (File ▸ New ▸ HTML, name it `Staff`)
   - Project manifest: **Project Settings ▸ Show "appsscript.json"**, paste `appsscript.json`.

## 3. Script properties
**Project Settings ▸ Script properties ▸ Add**:

| Key | Example / notes |
| --- | --- |
| `SHEET_ID` | `<GOOGLE_SHEET_ID>` |
| `API_TOKEN` | a long random string; must match Netlify `REGISTRATION_API_TOKEN` |
| `ADMIN_EMAILS` | comma-separated authorised admin Google accounts |
| `RECEPTION_EMAILS` | comma-separated reception-staff Google accounts |
| `SIGNATURE_FOLDER_ID` | (optional) restricted Drive folder for digital signatures |
| `NOTIFICATION_EMAIL` | (optional) internal notification address |
| `REGISTRATION_OPEN` | `true` / `false` |
| `REGISTRATION_DEADLINE` | ISO date-time, e.g. `2026-07-13T23:59:59+05:30` |
| `DATA_RETENTION_DATE` | e.g. `2026-09-30` |
| `SEND_CONFIRMATION_EMAIL` | `true` / `false` |
| `CONFIRMATION_EMAIL_SENDER_NAME` | `HPB National Launch 2026` |
| `PUBLIC_SITE_URL` | final Netlify address |
| `AGENDA_URL` | `https://national-launch-agenda.netlify.app` |

Generate a token, e.g. `openssl rand -hex 32`.

## 4. Initialise the Sheet
1. In the editor, select `setupSpreadsheet` and **Run**. Authorise when prompted.
2. This creates the `Registrations`, `CheckIn_Log`, `Audit_Log`, `Settings`,
   `Lookups` sheets with headers, frozen rows and dropdown validation.
3. Run `verifyScriptProperties` and check the log shows all required properties.

## 5. Deploy as a Web App
1. **Deploy ▸ New deployment ▸ Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Deploy, authorise, and copy the **/exec** Web App URL.
4. Put this URL in Netlify as `GOOGLE_APPS_SCRIPT_URL`.

> The public `/exec` route only accepts the `register` action **and** only when
> the request carries the matching `API_TOKEN`. The staff interface (the `/exec`
> GET page) is separately gated by the email allowlist.

## 6. Protect sensitive columns (manual, recommended)
In the Sheet, select the columns holding NIC/passport number, mobile, email,
signature info, verification status and administrative notes → **Data ▸ Protect
sheets and ranges** → restrict editing to the admin accounts.

## 7. Staff access
Share the Web App URL with reception staff. Only accounts listed in
`RECEPTION_EMAILS` or `ADMIN_EMAILS` can load the reception interface; everyone
else sees an "Access restricted" page.

## Ongoing administration (run from the editor)
- `setRegistrationOpen(true|false)` — open/close registration centrally.
- `exportParticipantsCsv()` — writes a CSV to Drive (authorised staff only).
- `verifyScriptProperties()` — sanity-check configuration.
