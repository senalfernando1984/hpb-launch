import { useMemo, useRef, useState } from 'react';
import { AgendaButton, CalendarActions } from '../components/Chrome';
import { ArrowLeftIcon, CheckIcon } from '../components/Icons';
import { eventDetails } from '../data/event';
import type { RegistrationForm, RegistrationSuccess } from '../data/types';
import { normaliseRegistration, validateForm } from '../lib/validation';
import { clearDraft, submitRegistration } from '../lib/api';
import { useRouter } from '../lib/router';

interface Props {
  form: RegistrationForm;
  onSuccess: (result: RegistrationSuccess) => void;
}

const maskId = (idNumber: string, idType: string): string => {
  const clean = idNumber.trim();
  if (clean.length <= 4) return clean;
  return `${'•'.repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)} (${idType === 'nic' ? 'NIC' : 'Passport'})`;
};

export const ReviewPage = ({ form, onSuccess }: Props) => {
  const { navigate } = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const record = useMemo(() => normaliseRegistration(form), [form]);
  const displayName = [record.title, record.givenName, record.surname].filter(Boolean).join(' ');

  // Guard: if someone deep-links to /review without a valid form, send them back.
  const incomplete = Object.keys(validateForm(form)).length > 0;

  const rows: { label: string; value: string }[] = [
    { label: 'Name', value: displayName },
    { label: 'Full name (as per ID)', value: record.fullName },
    { label: 'Identity document', value: record.idType === 'nic' ? 'Sri Lankan NIC' : 'Passport' },
    { label: 'Identity number', value: maskId(record.idNumber, record.idType) },
    ...(record.issuingCountry ? [{ label: 'Issuing country', value: record.issuingCountry }] : []),
    { label: 'Mobile', value: record.mobile },
    { label: 'Email', value: record.email },
    { label: 'Designation', value: record.designation },
    { label: 'Institution', value: record.institution },
  ];

  const submit = async () => {
    if (submitting) return;
    setError('');
    setSubmitting(true);
    abortRef.current = new AbortController();
    const result = await submitRegistration(
      { ...record, website: form.website },
      abortRef.current.signal,
    );
    setSubmitting(false);

    if (result.ok) {
      clearDraft();
      onSuccess(result.data);
      navigate('/confirmation');
      return;
    }
    setError(result.message);
  };

  if (incomplete) {
    return (
      <div className="shell stack">
        <div className="alert alert--info" role="status">
          Some required information is missing. Please return to the form to complete your
          registration.
        </div>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/register')}>
          Return to the form
        </button>
      </div>
    );
  }

  return (
    <div className="shell stack">
      <div>
        <p className="eyebrow">Review &amp; submit</p>
        <h1 className="page-title">Please review your details</h1>
        <p className="lead">
          Check the information below before submitting. You can go back to make changes.
        </p>
      </div>

      <section className="card">
        <div className="review-list">
          {rows.map((r) => (
            <div className="review-list__row" key={r.label}>
              <span className="review-list__label">{r.label}</span>
              <span className="review-list__value">{r.value}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="card card--notice">
        Please bring the original {record.idType === 'nic' ? 'National Identity Card' : 'passport'}{' '}
        corresponding to the identification number provided during registration.
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      <div className="form-nav">
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => navigate('/register')}
          disabled={submitting}
        >
          <ArrowLeftIcon />
          Back to form
        </button>
        <button type="button" className="btn btn--primary" onClick={submit} disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Submitting…' : 'Submit registration'}
          {!submitting && <CheckIcon />}
        </button>
      </div>

      <p className="field__hint">An internet connection is required to submit your registration.</p>

      <hr className="rule" />
      <div className="action-panel action-panel--inline">
        <AgendaButton />
        <CalendarActions />
      </div>
      <p className="field__hint">
        Registered for {eventDetails.title} · {eventDetails.date} · {eventDetails.venue}
      </p>
    </div>
  );
};
