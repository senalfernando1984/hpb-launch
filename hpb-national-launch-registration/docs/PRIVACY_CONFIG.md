# Privacy & Data-Retention Configuration

Set these placeholders before going live.

## Frontend privacy page (`src/pages/InfoPages.tsx`)
- `PRIVACY_CONTACT_NAME`
- `PRIVACY_CONTACT_EMAIL`
- `DATA_RETENTION_DATE`
- `EVENT_CONTACT_NUMBER`

## Apps Script properties
- `DATA_RETENTION_DATE` — the date after which data is archived/deleted.
- `SIGNATURE_FOLDER_ID` — restricted Drive folder for digital signatures.

## Principles enforced in code
- No participant-facing wording refers to security or security clearance.
- The privacy notice explains what is collected, why, who can access it, how
  long it is kept, the contact person, retention date, and how to request a
  correction.
- No identity-document images are requested.
- No PII in URLs, QR codes, or logs. The QR encodes only the reference.
- Sensitive fields are never stored in `localStorage`; only non-sensitive draft
  fields use `sessionStorage`, and the NIC/passport number is excluded even
  from that.
- The data-retention period is not fabricated — set `DATA_RETENTION_DATE`
  explicitly.

## After the event (administrator)
- Export required lists via `exportParticipantsCsv()`.
- After `DATA_RETENTION_DATE`, archive the Sheet and delete signature files.
