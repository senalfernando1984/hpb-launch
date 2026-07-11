/**
 * HPB National Launch 2026 — registration backend (Google Apps Script).
 *
 * Deploy as a Web App (Execute as: Me; Who has access: Anyone).
 * The public route accepts ONLY the `register` action, and only when the
 * request carries the shared token that the Netlify function holds. All
 * administrative work happens in the authenticated staff interface (Staff.html)
 * or via the editor-run functions at the bottom of this file.
 *
 * Configure everything via Script Properties (File ▸ Project properties ▸
 * Script properties) — see the keys read in getConfig(). Do not hard-code
 * secrets in this file.
 */

// ---------------------------------------------------------------- config

function getConfig() {
  var p = PropertiesService.getScriptProperties();
  return {
    sheetId: p.getProperty('SHEET_ID'),
    apiToken: p.getProperty('API_TOKEN'),
    adminEmails: (p.getProperty('ADMIN_EMAILS') || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(String),
    receptionEmails: (p.getProperty('RECEPTION_EMAILS') || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(String),
    signatureFolderId: p.getProperty('SIGNATURE_FOLDER_ID'),
    notificationEmail: p.getProperty('NOTIFICATION_EMAIL'),
    registrationOpen: (p.getProperty('REGISTRATION_OPEN') || 'true') !== 'false',
    registrationDeadline: p.getProperty('REGISTRATION_DEADLINE'),
    retentionDate: p.getProperty('DATA_RETENTION_DATE'),
    sendConfirmation: (p.getProperty('SEND_CONFIRMATION_EMAIL') || 'true') !== 'false',
    senderName: p.getProperty('CONFIRMATION_EMAIL_SENDER_NAME') || 'HPB National Launch 2026',
    publicSiteUrl: p.getProperty('PUBLIC_SITE_URL') || '',
    agendaUrl: p.getProperty('AGENDA_URL') || 'https://national-launch-agenda.netlify.app'
  };
}

var SHEETS = {
  registrations: 'Registrations',
  checkin: 'CheckIn_Log',
  audit: 'Audit_Log',
  settings: 'Settings',
  lookups: 'Lookups'
};

var REG_HEADERS = [
  'Registration ID', 'Submission timestamp', 'Title', 'Given name', 'Surname',
  'Full name as per NIC/passport', 'Identification type', 'NIC/passport number', 'Issuing country',
  'Mobile number', 'Email', 'Official designation', 'Institution', 'Attendance confirmed',
  'Consent confirmed', 'Registration status', 'Participant-verification status',
  'Confirmation email status', 'Check-in status', 'Check-in timestamp', 'Seat number',
  'Seating category', 'Signature obtained', 'Signature method', 'Signature Drive file ID',
  'Signature file URL', 'Identity document checked', 'Checked in by', 'Administrative notes',
  'Last updated timestamp'
];

// ---------------------------------------------------------------- routing

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    if (body.action === 'register') {
      return handleRegister(body);
    }
    return json({ error: 'Unsupported action.' }, 400);
  } catch (err) {
    return json({ error: 'Invalid request.' }, 400);
  }
}

function json(obj, code) {
  // Apps Script Web Apps always return HTTP 200; the client reads the payload.
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------- register

function handleRegister(body) {
  var cfg = getConfig();

  if (!cfg.apiToken || body.token !== cfg.apiToken) {
    return json({ error: 'Unauthorised.' }, 401);
  }
  if (!cfg.registrationOpen) {
    return json({ error: 'closed' }, 403);
  }
  if (cfg.registrationDeadline && new Date() > new Date(cfg.registrationDeadline)) {
    return json({ error: 'closed' }, 403);
  }

  var r = body.record || {};
  // Server-side validation (defence in depth).
  if (!validRecord(r)) {
    return json({ error: 'invalid' }, 400);
  }

  var idNumber = normaliseId(r.idNumber, r.idType);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.openById(cfg.sheetId);
    var sheet = ss.getSheetByName(SHEETS.registrations);

    if (findRowByIdNumber(sheet, idNumber) > 0) {
      audit_(ss, 'register.duplicate', 'idNumber=' + maskId_(idNumber));
      return json({ duplicate: true }, 409);
    }

    var reference = nextReference_(ss);
    var now = new Date();
    var row = [
      reference, now, r.title, r.givenName, r.surname, r.fullName, r.idType, idNumber,
      r.issuingCountry || '', r.mobile, r.email, r.designation, r.institution,
      r.attendanceConfirmed ? 'Yes' : 'No', r.privacyAcknowledged ? 'Yes' : 'No',
      'Registered', 'Pending', 'Pending', 'Not checked in', '', '', '', 'No', '', '', '',
      'No', '', '', now
    ];
    sheet.appendRow(row);

    audit_(ss, 'register.success', reference);

    var verificationToken = signReference_(reference, cfg.apiToken);

    if (cfg.sendConfirmation) {
      try {
        sendConfirmationEmail_(cfg, r, reference);
        setConfirmationStatus_(sheet, reference, 'Sent');
      } catch (mailErr) {
        setConfirmationStatus_(sheet, reference, 'Failed');
      }
    }

    return json({
      reference: reference,
      displayName: [r.title, r.givenName, r.surname].filter(String).join(' '),
      verificationToken: verificationToken
    }, 200);
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------- helpers

function validRecord(r) {
  if (!r) return false;
  function s(v) { return typeof v === 'string' ? v.trim() : ''; }
  if (!s(r.title) || !s(r.givenName) || !s(r.surname) || s(r.fullName).length < 2) return false;
  if (r.idType === 'nic') { if (!validNic_(r.idNumber)) return false; }
  else if (r.idType === 'passport') { if (!validPassport_(r.idNumber)) return false; }
  else return false;
  if (!validMobile_(r.mobile)) return false;
  if (!validEmail_(r.email)) return false;
  if (!s(r.designation) || !s(r.institution)) return false;
  if (r.attendanceConfirmed !== true || r.accuracyConfirmed !== true || r.privacyAcknowledged !== true) return false;
  return true;
}

function normaliseId(v, type) {
  if (type === 'nic') return String(v).replace(/[\s-]/g, '').toUpperCase();
  return String(v).replace(/\s/g, '').toUpperCase();
}
function validNic_(v) { var n = normaliseId(v, 'nic'); return /^[0-9]{9}[VX]$/.test(n) || /^[0-9]{12}$/.test(n); }
function validPassport_(v) { return /^[A-Z0-9]{5,15}$/.test(normaliseId(v, 'passport')); }
function validMobile_(v) { var m = String(v).trim(); m = (m.charAt(0) === '+' ? '+' : '') + m.replace(/[^\d]/g, ''); return m.charAt(0) === '+' ? /^\+\d{9,15}$/.test(m) : /^\d{9,12}$/.test(m); }
function validEmail_(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim().toLowerCase()); }

function maskId_(idNumber) {
  var s = String(idNumber);
  return s.length <= 4 ? s : new Array(s.length - 3).join('•') + s.slice(-4);
}

function findRowByIdNumber(sheet, idNumber) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var col = REG_HEADERS.indexOf('NIC/passport number') + 1;
  var values = sheet.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).toUpperCase() === idNumber) return i + 2;
  }
  return -1;
}

function nextReference_(ss) {
  var props = PropertiesService.getScriptProperties();
  var counter = Number(props.getProperty('REG_COUNTER') || '0') + 1;
  props.setProperty('REG_COUNTER', String(counter));
  return 'HPB-2026-' + ('000000' + counter).slice(-6);
}

function signReference_(reference, token) {
  var sig = Utilities.computeHmacSha256Signature(reference, token);
  return Utilities.base64EncodeWebSafe(sig).slice(0, 16);
}

function setConfirmationStatus_(sheet, reference, status) {
  var row = findRowByReference_(sheet, reference);
  if (row > 0) sheet.getRange(row, REG_HEADERS.indexOf('Confirmation email status') + 1).setValue(status);
}

function findRowByReference_(sheet, reference) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var values = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === reference) return i + 2;
  }
  return -1;
}

function audit_(ss, action, detail) {
  var sheet = ss.getSheetByName(SHEETS.audit);
  if (!sheet) return;
  sheet.appendRow([new Date(), action, detail || '', (Session.getActiveUser().getEmail() || 'system')]);
}

function sendConfirmationEmail_(cfg, r, reference) {
  var name = [r.title, r.givenName, r.surname].filter(String).join(' ');
  var subject = 'HPB National Launch 2026 – Registration Confirmation';
  var lines = [
    'Dear ' + name + ',',
    '',
    'Thank you. Your advance registration for the HPB National Launch 2026 has been received.',
    '',
    'Registration reference: ' + reference,
    'Date: 15 July 2026',
    'Requested arrival time: 1.00 p.m.',
    'Official programme commences: 1.30 p.m.',
    'Venue: Jasmine Hall, BMICH',
    '',
    'Please bring the original National Identity Card or passport corresponding to the identification number provided during registration.',
    '',
    'View the complete programme agenda and expert-panel information:',
    cfg.agendaUrl,
    '',
    'Participants are kindly requested to arrive by 1.00 p.m. The official programme commences at 1.30 p.m.',
    '',
    'Health Promotion Bureau',
    'Ministry of Health and Mass Media'
  ];
  var ics = buildIcsForEmail_(cfg, reference);
  MailApp.sendEmail({
    to: r.email,
    name: cfg.senderName,
    subject: subject,
    body: lines.join('\n'),
    attachments: [Utilities.newBlob(ics, 'text/calendar', 'HPB_National_Launch_2026.ics')]
  });
}

function buildIcsForEmail_(cfg, reference) {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Health Promotion Bureau//HPB National Launch 2026//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE', 'TZID:Asia/Colombo',
    'BEGIN:STANDARD', 'DTSTART:19960525T003000', 'TZOFFSETFROM:+0630', 'TZOFFSETTO:+0530', 'TZNAME:+0530', 'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    'UID:hpb-national-launch-2026-' + reference + '@hpb.health.gov.lk',
    'DTSTART;TZID=Asia/Colombo:20260715T130000',
    'DTEND;TZID=Asia/Colombo:20260715T173000',
    'SUMMARY:HPB National Launch 2026',
    'LOCATION:Jasmine Hall\\, BMICH',
    'DESCRIPTION:Please arrive by 1.00 p.m. The official programme commences at 1.30 p.m. Agenda: ' + cfg.agendaUrl,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:HPB National Launch 2026 is tomorrow', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
}

// ---------------------------------------------------------------- staff interface (authenticated)

function doGet() {
  var email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  var cfg = getConfig();
  var allowed = cfg.adminEmails.concat(cfg.receptionEmails);
  if (allowed.indexOf(email) === -1) {
    return HtmlService.createHtmlOutput(
      '<h2 style="font-family:sans-serif">Access restricted</h2>' +
      '<p style="font-family:sans-serif">This reception interface is limited to authorised staff.</p>'
    );
  }
  var t = HtmlService.createTemplateFromFile('Staff');
  t.staffEmail = email;
  return t.evaluate().setTitle('HPB National Launch 2026 — Reception').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function requireStaff_() {
  var email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  var cfg = getConfig();
  if (cfg.adminEmails.concat(cfg.receptionEmails).indexOf(email) === -1) {
    throw new Error('Unauthorised');
  }
  return email;
}

/** Search returns only the fields reception needs; identity number is masked. */
function staffSearch(query) {
  requireStaff_();
  var cfg = getConfig();
  var ss = SpreadsheetApp.openById(cfg.sheetId);
  var sheet = ss.getSheetByName(SHEETS.registrations);
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var data = sheet.getRange(2, 1, last - 1, REG_HEADERS.length).getValues();
  var q = String(query || '').trim().toLowerCase();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var hay = [row[0], row[5], row[7], row[9], row[12], row[20]].join(' ').toLowerCase();
    if (q && hay.indexOf(q) === -1) continue;
    out.push({
      reference: row[0], fullName: row[5], idType: row[6], idMasked: maskId_(row[7]),
      mobile: row[9], designation: row[11], institution: row[12],
      registrationStatus: row[15], verificationStatus: row[16], checkInStatus: row[18],
      seat: row[20], signature: row[22]
    });
    if (out.length >= 25) break;
  }
  return out;
}

function staffCheckIn(reference, seat, seatingCategory, signatureObtained, signatureMethod, idChecked, note) {
  var staff = requireStaff_();
  var cfg = getConfig();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.openById(cfg.sheetId);
    var sheet = ss.getSheetByName(SHEETS.registrations);
    var row = findRowByReference_(sheet, reference);
    if (row < 0) throw new Error('Registration not found.');

    var checkInStatusCol = REG_HEADERS.indexOf('Check-in status') + 1;
    if (String(sheet.getRange(row, checkInStatusCol).getValue()) === 'Checked in') {
      throw new Error('This participant is already checked in.');
    }
    var now = new Date();
    sheet.getRange(row, checkInStatusCol).setValue('Checked in');
    sheet.getRange(row, REG_HEADERS.indexOf('Check-in timestamp') + 1).setValue(now);
    if (seat) sheet.getRange(row, REG_HEADERS.indexOf('Seat number') + 1).setValue(seat);
    if (seatingCategory) sheet.getRange(row, REG_HEADERS.indexOf('Seating category') + 1).setValue(seatingCategory);
    sheet.getRange(row, REG_HEADERS.indexOf('Signature obtained') + 1).setValue(signatureObtained ? 'Yes' : 'No');
    if (signatureMethod) sheet.getRange(row, REG_HEADERS.indexOf('Signature method') + 1).setValue(signatureMethod);
    sheet.getRange(row, REG_HEADERS.indexOf('Identity document checked') + 1).setValue(idChecked ? 'Yes' : 'No');
    sheet.getRange(row, REG_HEADERS.indexOf('Participant-verification status') + 1).setValue(idChecked ? 'Verified' : 'Pending');
    sheet.getRange(row, REG_HEADERS.indexOf('Checked in by') + 1).setValue(staff);
    if (note) sheet.getRange(row, REG_HEADERS.indexOf('Administrative notes') + 1).setValue(note);
    sheet.getRange(row, REG_HEADERS.indexOf('Last updated timestamp') + 1).setValue(now);

    ss.getSheetByName(SHEETS.checkin).appendRow([now, reference, staff, seat || '', idChecked ? 'Yes' : 'No', signatureObtained ? 'Yes' : 'No']);
    audit_(ss, 'checkin', reference + ' by ' + staff);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------- editor-run administration

/** Run once from the editor to create/repair all sheets and validations. */
function setupSpreadsheet() {
  var cfg = getConfig();
  if (!cfg.sheetId) throw new Error('Set SHEET_ID in Script properties first.');
  var ss = SpreadsheetApp.openById(cfg.sheetId);

  ensureSheet_(ss, SHEETS.registrations, REG_HEADERS);
  ensureSheet_(ss, SHEETS.checkin, ['Timestamp', 'Registration ID', 'Staff', 'Seat', 'ID checked', 'Signature obtained']);
  ensureSheet_(ss, SHEETS.audit, ['Timestamp', 'Action', 'Detail', 'Actor']);
  ensureSheet_(ss, SHEETS.settings, ['Key', 'Value']);
  ensureSheet_(ss, SHEETS.lookups, ['Registration status', 'Check-in status', 'Signature method', 'Verification status', 'Seating category']);

  var reg = ss.getSheetByName(SHEETS.registrations);
  reg.setFrozenRows(1);
  addValidation_(reg, 'Registration status', ['Registered', 'Cancelled', 'Waitlisted']);
  addValidation_(reg, 'Check-in status', ['Not checked in', 'Checked in']);
  addValidation_(reg, 'Signature method', ['', 'Physical', 'Digital']);
  addValidation_(reg, 'Participant-verification status', ['Pending', 'Verified', 'Mismatch']);
  addValidation_(reg, 'Seating category', ['', 'General', 'Reserved', 'VIP', 'Media', 'To be assigned']);

  SpreadsheetApp.getUi && Logger.log('Setup complete.');
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var empty = existing.join('') === '';
  if (empty) sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function addValidation_(sheet, headerName, options) {
  var col = REG_HEADERS.indexOf(headerName) + 1;
  if (col < 1) return;
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(options, true).setAllowInvalid(false).build();
  sheet.getRange(2, col, 2000, 1).setDataValidation(rule);
}

/** Generate CSVs into Drive for authorised export (run from editor). */
function exportParticipantsCsv() {
  requireStaff_();
  var cfg = getConfig();
  var ss = SpreadsheetApp.openById(cfg.sheetId);
  var sheet = ss.getSheetByName(SHEETS.registrations);
  var values = sheet.getDataRange().getValues();
  var pick = ['Registration ID', 'Full name as per NIC/passport', 'Identification type', 'NIC/passport number', 'Mobile number', 'Email', 'Official designation', 'Institution', 'Registration status', 'Participant-verification status'];
  var idx = pick.map(function (h) { return REG_HEADERS.indexOf(h); });
  var rows = values.map(function (row, i) {
    return idx.map(function (c) { return csvCell_(i === 0 ? REG_HEADERS[c] : row[c]); }).join(',');
  });
  var csv = rows.join('\r\n');
  var file = DriveApp.createFile('HPB_Participants_' + Utilities.formatDate(new Date(), 'Asia/Colombo', 'yyyyMMdd_HHmm') + '.csv', csv, 'text/csv');
  audit_(ss, 'export.participants', file.getId());
  Logger.log('Export created: ' + file.getUrl());
}

function csvCell_(v) {
  var s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function setRegistrationOpen(open) {
  PropertiesService.getScriptProperties().setProperty('REGISTRATION_OPEN', open ? 'true' : 'false');
}

function verifyScriptProperties() {
  var cfg = getConfig();
  var missing = [];
  ['sheetId', 'apiToken'].forEach(function (k) { if (!cfg[k]) missing.push(k); });
  Logger.log(missing.length ? 'Missing: ' + missing.join(', ') : 'All required properties present.');
  Logger.log('Admins: ' + cfg.adminEmails.length + ' | Reception: ' + cfg.receptionEmails.length);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
