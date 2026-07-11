import type { Handler, HandlerEvent } from '@netlify/functions';

/**
 * Registration API gateway.
 *
 * The browser posts here; this function validates, normalises, applies basic
 * abuse protection, verifies Turnstile (when enabled), then forwards the clean
 * payload to the Google Apps Script backend using a secret token.
 *
 * It never exposes the Apps Script URL, the token, or the Google Sheet ID to
 * the client, and never logs NIC/passport numbers, phone numbers or emails.
 */

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

const MAX_BODY_BYTES = 8 * 1024;

const respond = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: JSON_HEADERS,
  body: JSON.stringify(body),
});

// ---- Validation mirrors the client (defence in depth) -------------------

const normaliseNic = (v: string) => v.replace(/[\s-]/g, '').toUpperCase();
const isValidNic = (v: string) => {
  const n = normaliseNic(v);
  return /^[0-9]{9}[VX]$/.test(n) || /^[0-9]{12}$/.test(n);
};
const normalisePassport = (v: string) => v.replace(/\s/g, '').toUpperCase();
const isValidPassport = (v: string) => /^[A-Z0-9]{5,15}$/.test(normalisePassport(v));
const normaliseMobile = (v: string) => {
  const t = v.trim();
  return (t.startsWith('+') ? '+' : '') + t.replace(/[^\d]/g, '');
};
const isValidMobile = (v: string) => {
  const m = normaliseMobile(v);
  return m.startsWith('+') ? /^\+\d{9,15}$/.test(m) : /^\d{9,12}$/.test(m);
};
const normaliseEmail = (v: string) => v.trim().toLowerCase();
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normaliseEmail(v));
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const bounded = (v: string, min: number, max: number) => v.trim().length >= min && v.trim().length <= max;

interface CleanRecord {
  title: string;
  givenName: string;
  surname: string;
  fullName: string;
  idType: 'nic' | 'passport';
  idNumber: string;
  issuingCountry: string;
  mobile: string;
  email: string;
  designation: string;
  institution: string;
  attendanceConfirmed: boolean;
  accuracyConfirmed: boolean;
  privacyAcknowledged: boolean;
  submittedAt: string;
}

const verifyTurnstile = async (token: string, ip: string | undefined): Promise<boolean> => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // disabled when not configured
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return respond(405, { message: 'Method not allowed.' });
  }
  if (!(event.headers['content-type'] || '').includes('application/json')) {
    return respond(415, { message: 'Unsupported content type.' });
  }
  if ((event.body?.length ?? 0) > MAX_BODY_BYTES) {
    return respond(413, { message: 'Request too large.' });
  }

  if (process.env.REGISTRATION_OPEN === 'false') {
    return respond(403, {
      message:
        'Registration is not currently open. Please check back later or contact the event registration team.',
    });
  }

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(event.body || '{}');
  } catch {
    return respond(400, { message: 'Invalid request.' });
  }

  // Honeypot — silently accept but do not forward.
  if (str(raw.website).trim() !== '') {
    return respond(200, { reference: 'HPB-2026-000000', displayName: '' });
  }

  const turnstileToken = str(raw.turnstileToken);
  if (process.env.TURNSTILE_SECRET_KEY && !turnstileToken) {
    return respond(400, { message: 'Verification challenge missing. Please try again.' });
  }
  if (process.env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(
      turnstileToken,
      event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'],
    );
    if (!ok) return respond(400, { message: 'Verification failed. Please try again.' });
  }

  const idType = raw.idType === 'passport' ? 'passport' : 'nic';
  const idNumberRaw = str(raw.idNumber);
  const errors: string[] = [];

  if (!bounded(str(raw.title), 1, 40)) errors.push('title');
  if (!bounded(str(raw.givenName), 1, 100)) errors.push('givenName');
  if (!bounded(str(raw.surname), 1, 100)) errors.push('surname');
  if (!bounded(str(raw.fullName), 2, 200)) errors.push('fullName');
  if (idType === 'nic' ? !isValidNic(idNumberRaw) : !isValidPassport(idNumberRaw))
    errors.push('idNumber');
  if (!isValidMobile(str(raw.mobile))) errors.push('mobile');
  if (!isValidEmail(str(raw.email))) errors.push('email');
  if (!bounded(str(raw.designation), 1, 150)) errors.push('designation');
  if (!bounded(str(raw.institution), 1, 150)) errors.push('institution');
  if (raw.attendanceConfirmed !== true) errors.push('attendanceConfirmed');
  if (raw.accuracyConfirmed !== true) errors.push('accuracyConfirmed');
  if (raw.privacyAcknowledged !== true) errors.push('privacyAcknowledged');

  if (errors.length > 0) {
    // Do not echo submitted values back.
    return respond(400, { message: 'Some information is missing or invalid. Please review the form.' });
  }

  const record: CleanRecord = {
    title: str(raw.title).trim(),
    givenName: str(raw.givenName).trim(),
    surname: str(raw.surname).trim(),
    fullName: str(raw.fullName).trim(),
    idType,
    idNumber: idType === 'nic' ? normaliseNic(idNumberRaw) : normalisePassport(idNumberRaw),
    issuingCountry: idType === 'passport' ? str(raw.issuingCountry).trim() : '',
    mobile: normaliseMobile(str(raw.mobile)),
    email: normaliseEmail(str(raw.email)),
    designation: str(raw.designation).trim(),
    institution: str(raw.institution).trim(),
    attendanceConfirmed: true,
    accuracyConfirmed: true,
    privacyAcknowledged: true,
    submittedAt: new Date().toISOString(),
  };

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const apiToken = process.env.REGISTRATION_API_TOKEN;
  if (!scriptUrl || !apiToken) {
    // Misconfiguration — never leak which value is missing.
    return respond(500, { message: 'The registration service is temporarily unavailable.' });
  }

  try {
    const upstream = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', token: apiToken, record }),
    });

    const data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;

    if (upstream.ok && data.reference) {
      return respond(200, {
        reference: data.reference,
        displayName: data.displayName ?? '',
        verificationToken: data.verificationToken,
      });
    }
    if (data.duplicate === true || upstream.status === 409) {
      return respond(409, {
        message:
          'A registration may already exist using the information provided. Please contact the event registration team if you require assistance.',
      });
    }
    return respond(502, { message: 'We were unable to complete your registration. Please try again shortly.' });
  } catch {
    // Never log the request body or any personal field.
    return respond(502, { message: 'We were unable to reach the registration service. Please try again shortly.' });
  }
};
