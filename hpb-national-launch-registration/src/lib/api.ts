import type { NormalisedRegistration } from './validation';
import type { RegistrationForm, RegistrationSuccess } from '../data/types';

export type SubmitResult =
  | { ok: true; data: RegistrationSuccess }
  | { ok: false; kind: 'duplicate' | 'closed' | 'offline' | 'validation' | 'error'; message: string };

interface Payload extends NormalisedRegistration {
  website: string; // honeypot
  turnstileToken?: string;
}

/**
 * Submits to the Netlify function only. The browser never contacts Google
 * Sheets or Apps Script directly, and no secret/token is present here.
 */
export const submitRegistration = async (
  payload: Payload,
  signal?: AbortSignal,
): Promise<SubmitResult> => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, kind: 'offline', message: 'An internet connection is required to submit your registration.' };
  }

  try {
    const response = await fetch('/.netlify/functions/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (response.ok && data.reference) {
      return {
        ok: true,
        data: {
          reference: String(data.reference),
          displayName: String(data.displayName ?? ''),
          verificationToken: data.verificationToken ? String(data.verificationToken) : undefined,
        },
      };
    }

    const kind =
      response.status === 409
        ? 'duplicate'
        : response.status === 403
          ? 'closed'
          : response.status === 400
            ? 'validation'
            : 'error';
    return {
      ok: false,
      kind,
      message:
        typeof data.message === 'string'
          ? data.message
          : 'We were unable to complete your registration. Please try again.',
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, kind: 'error', message: 'The request was cancelled.' };
    }
    return {
      ok: false,
      kind: 'offline',
      message: 'An internet connection is required to submit your registration.',
    };
  }
};

// ---- Session persistence (non-sensitive fields only) --------------------

const KEY = 'hpb-reg-draft';

/** Identity fields are deliberately excluded — they live only in memory. */
const SENSITIVE: (keyof RegistrationForm)[] = ['idNumber', 'website'];

export const saveDraft = (form: RegistrationForm): void => {
  try {
    const safe: Partial<RegistrationForm> = { ...form };
    for (const field of SENSITIVE) delete safe[field];
    sessionStorage.setItem(KEY, JSON.stringify(safe));
  } catch {
    /* storage unavailable — proceed without a draft */
  }
};

export const loadDraft = (): Partial<RegistrationForm> | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<RegistrationForm>) : null;
  } catch {
    return null;
  }
};

export const clearDraft = (): void => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
