# Google Sheet Column Specification

## Registrations
1. Registration ID (HPB-2026-000123)
2. Submission timestamp
3. Title
4. Given name
5. Surname
6. Full name as per NIC/passport
7. Identification type (nic | passport)
8. NIC/passport number  ← protect
9. Issuing country
10. Mobile number  ← protect
11. Email  ← protect
12. Official designation
13. Institution
14. Attendance confirmed
15. Consent confirmed
16. Registration status (Registered | Cancelled | Waitlisted)
17. Participant-verification status (Pending | Verified | Mismatch)  ← protect
18. Confirmation email status (Sent | Failed | Pending)
19. Check-in status (Not checked in | Checked in)
20. Check-in timestamp
21. Seat number
22. Seating category (General | Reserved | VIP | Media | To be assigned)
23. Signature obtained (Yes | No)
24. Signature method (Physical | Digital)
25. Signature Drive file ID  ← protect
26. Signature file URL  ← protect
27. Identity document checked (Yes | No)
28. Checked in by
29. Administrative notes  ← protect
30. Last updated timestamp

Freeze the header row (done by `setupSpreadsheet`). Protect the marked columns
to the admin accounts.

## CheckIn_Log
Timestamp · Registration ID · Staff · Seat · ID checked · Signature obtained

## Audit_Log
Timestamp · Action · Detail · Actor

## Settings
Key · Value (operational settings manageable without editing code)

## Lookups
Dropdown source lists for the validated columns.
